import struct
from typing import Optional


def detect_format_from_bytes(data: bytes, file_name: Optional[str] = None) -> str:
    if _is_onnx(data):
        return "onnx"
    if _is_tflite(data):
        return "tflite"
    if file_name:
        lower = file_name.lower()
        if lower.endswith(".onnx"):
            return "onnx"
        if lower.endswith((".tflite", ".lite")):
            return "tflite"
    raise ValueError(
        f"Unsupported model format. Could not detect format from file"
        + (f" '{file_name}'" if file_name else "")
        + ". Supported formats: ONNX, TFLite."
    )


def _is_onnx(data: bytes) -> bool:
    if len(data) < 4:
        return False
    magic = data[:4]
    ONNX_MAGIC = b"\x08\x07"
    if magic[:2] == ONNX_MAGIC:
        try:
            offset = struct.unpack_from("<i", data, 0)[0]
            return 0 < offset < len(data)
        except struct.error:
            pass
    return False


def _is_tflite(data: bytes) -> bool:
    if len(data) < 8:
        return False
    try:
        root_offset = struct.unpack_from("<i", data, 0)[0]
        file_size_offset = root_offset + 4
        if file_size_offset + 4 <= len(data):
            file_size = struct.unpack_from("<i", data, file_size_offset)[0]
            return 0 < file_size <= len(data)
    except struct.error:
        pass
    return False