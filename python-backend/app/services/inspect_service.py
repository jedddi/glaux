import logging
from typing import Optional

from app.services.inspection.inspector import inspect_model_from_url, InspectionError

logger = logging.getLogger(__name__)


async def run_inspection(
    project_id: str,
    model_asset_id: Optional[str] = None,
    model_format: Optional[str] = None,
    file_name: Optional[str] = None,
    model_download_url: Optional[str] = None,
) -> dict:
    if not model_download_url and not model_asset_id:
        raise InspectionError(
            code="MISSING_FILE_REFERENCE",
            message="No model file reference provided. Supply model_download_url or model_asset_id.",
        )

    if model_download_url is None:
        raise InspectionError(
            code="MISSING_DOWNLOAD_URL",
            message="Model download URL is required for file resolution.",
        )

    result = await inspect_model_from_url(
        download_url=model_download_url,
        file_name=file_name,
        model_format=model_format,
    )

    return result