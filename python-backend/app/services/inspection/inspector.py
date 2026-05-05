import logging
import tempfile
from typing import Optional

import httpx

from app.services.inspection.format_detector import detect_format_from_bytes
from app.services.inspection.onnx_inspector import inspect_onnx
from app.services.inspection.tflite_inspector import inspect_tflite

logger = logging.getLogger(__name__)

DOWNLOAD_TIMEOUT_SECONDS = 120


class InspectionError(Exception):
    def __init__(self, code: str, message: str, details: Optional[dict] = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)


async def inspect_model_from_url(
    download_url: str,
    file_name: Optional[str] = None,
    model_format: Optional[str] = None,
) -> dict:
    try:
        data = await _download_model(download_url)
    except Exception as e:
        raise InspectionError(
            code="FILE_DOWNLOAD_FAILED",
            message=f"Failed to download model file: {e}",
            details={"url": download_url[:100]},
        ) from e

    return _inspect_bytes(data, file_name=file_name, model_format=model_format)


def inspect_model_from_bytes(
    data: bytes,
    file_name: Optional[str] = None,
    model_format: Optional[str] = None,
) -> dict:
    return _inspect_bytes(data, file_name=file_name, model_format=model_format)


def _inspect_bytes(
    data: bytes,
    file_name: Optional[str] = None,
    model_format: Optional[str] = None,
) -> dict:
    if not data:
        raise InspectionError(
            code="EMPTY_FILE",
            message="Model file is empty",
        )

    detected_format: str
    try:
        if model_format and model_format in ("onnx", "tflite"):
            detected_format = model_format
        else:
            detected_format = detect_format_from_bytes(data, file_name=file_name)
    except ValueError as e:
        raise InspectionError(
            code="UNSUPPORTED_FORMAT",
            message=str(e),
        ) from e

    try:
        if detected_format == "onnx":
            result = inspect_onnx(data, file_name=file_name)
        elif detected_format == "tflite":
            result = inspect_tflite(data, file_name=file_name)
        else:
            raise InspectionError(
                code="UNSUPPORTED_FORMAT",
                message=f"Format '{detected_format}' is not supported for inspection",
            )
    except InspectionError:
        raise
    except Exception as e:
        raise InspectionError(
            code="PARSE_FAILED",
            message=f"Failed to parse {detected_format.upper()} model: {e}",
            details={"format": detected_format},
        ) from e

    result["format"] = detected_format
    return result


async def _download_model(url: str) -> bytes:
    async with httpx.AsyncClient(timeout=DOWNLOAD_TIMEOUT_SECONDS) as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.content