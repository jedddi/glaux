import logging
import struct
from typing import Optional

logger = logging.getLogger(__name__)
MAX_TFLITE_VECTOR_ITEMS = 1_000_000

TFLITE_TENSOR_TYPE_MAP = {
    0: "float32", 1: "float16", 2: "int32", 3: "uint8",
    4: "int64", 5: "string", 6: "bool", 7: "int16",
    8: "int8", 9: "float64", 10: "complex64",
    11: "int4", 12: "uint64",
}

BUILTIN_OPERATOR_NAMES = {
    0: "ADD", 1: "AVERAGE_POOL_2D", 2: "CONCATENATION", 3: "CONV_2D",
    4: "DEPTHWISE_CONV_2D", 5: "DEQUANTIZE", 6: "EMBEDDING_LOOKUP",
    7: "FLOOR", 8: "FULLY_CONNECTED", 9: "HASHTABLE_LOOKUP",
    10: "L2_NORMALIZATION", 11: "L2_POOL_2D", 12: "LOCAL_RESPONSE_NORMALIZATION",
    13: "LOGISTIC", 14: "LSH_PROJECTION", 15: "LSTM",
    16: "MAX_POOL_2D", 17: "MUL", 18: "RELU",
    19: "RELU_N1_TO_1", 20: "RELU6", 21: "RESHAPE",
    22: "RESIZE_BILINEAR", 23: "RNN", 24: "SOFTMAX",
    25: "SPACE_TO_BATCH_ND", 26: "SVDF", 27: "TANH",
    28: "CONCAT_EMBEDDINGS", 29: "SKIP_GRAM", 30: "CALL",
    31: "CUSTOM", 32: "EMBEDDING_LOOKUP_SPARSE", 33: "PAD",
    34: "PADV2", 35: "SPACE_TO_DEPTH", 36: "DEPTH_TO_SPACE",
    37: "INSTANCE_NORMALIZATION", 38: "LOG_SOFTMAX", 39: "MIRROR_PAD",
    40: "ABS", 41: "BITCAST", 42: "BITWISE_XOR", 43: "BROADCAST_TO",
    44: "CAST", 45: "CEIL", 46: "GATHER", 47: "GATHER_ND",
    48: "LESS", 49: "LESS_EQUAL", 50: "SELECT", 51: "SELECT_V2",
    52: "SLICE", 53: "SORT", 54: "TILE", 55: "TOPK_V2",
    56: "TRANSPOSE_CONV", 57: "UNIDIRECTIONAL_SEQUENCE_LSTM",
    58: "UNIDIRECTIONAL_SEQUENCE_RNN", 59: "WHERE",
    60: "ZEROS_LIKE", 61: "FILL", 62: "FLOOR_DIV",
    63: "FLOOR_MOD", 64: "GREATER", 65: "GREATER_EQUAL",
    66: "SUM", 67: "REDUCE_PROD", 68: "REDUCE_MAX",
    69: "REDUCE_MIN", 70: "REDUCE_ANY", 71: "REDUCE_ALL",
    72: "EXP", 73: "LOGICAL_NOT", 74: "LOGICAL_AND",
    75: "LOGICAL_OR", 76: "SUB", 77: "TRANSPOSE",
    78: "EXPAND_DIMS", 79: "SPARSE_TO_DENSE",
    80: "DEQUANTIZE", 81: "REVERSE_SEQUENCE",
    82: "MATRIX_DIAG", 83: "QUANTIZE", 84: "MATRIX_SET_DIAG",
    85: "ROUND", 86: "HARD_SWISH", 87: "IF",
    88: "WHILE", 89: "NON_MAX_SUPPRESSION_V4",
    90: "NON_MAX_SUPPRESSION_V5", 91: "SCATTER_ND",
    92: "SELECT_V2", 93: "DENSIFY", 94: "SEGMENT_SUM",
    95: "BATCH_MATMUL", 96: "UNIDIRECTIONAL_SEQUENCE_LSTM",
    97: "BIDIRECTIONAL_SEQUENCE_RNN", 98: "BIDIRECTIONAL_SEQUENCE_LSTM",
    99: "RESHAPE", 100: "BATCH_TO_SPACE_ND",
    101: "SPACE_TO_BATCH_ND", 102: "CUMSUM", 103: "BROADCAST_TO",
}


def inspect_tflite(data: bytes, file_name: Optional[str] = None) -> dict:
    parsed_model = _parse_tflite_model(data)
    subgraphs = parsed_model["subgraphs"]
    if not subgraphs:
        if parsed_model["warnings"]:
            details = "; ".join(parsed_model["warnings"][:3])
            raise ValueError(f"Failed to parse TFLite graph structure: {details}")
        raise ValueError("TFLite model parsed but contains no subgraphs")

    warnings: list[str] = list(parsed_model["warnings"])
    notes: list[str] = []

    primary = subgraphs[0]
    input_tensors = primary["inputs"]
    output_tensors = primary["outputs"]
    operators = primary["operators"]
    operator_count = len(operators)

    layer_count = None
    try:
        layer_count = len(set(op["op_type"] for op in operators))
    except Exception:
        pass

    top_op_types = _compute_top_operator_types(operators)

    shape_summaries = []
    for t in input_tensors:
        shape_str = ", ".join(str(s) for s in t["shape"])
        shape_summaries.append(f"Input tensor '{t['name']}': [{shape_str}]")
    for t in output_tensors:
        shape_str = ", ".join(str(s) for s in t["shape"])
        shape_summaries.append(f"Output tensor '{t['name']}': [{shape_str}]")

    dtype_summaries = []
    input_dtypes = {t["dtype"] for t in input_tensors if t["dtype"] != "unknown"}
    output_dtypes = {t["dtype"] for t in output_tensors if t["dtype"] != "unknown"}
    if input_dtypes:
        dtype_summaries.append(f"Input tensor dtype(s): {', '.join(sorted(input_dtypes))}")
    if output_dtypes:
        dtype_summaries.append(f"Output tensor dtype(s): {', '.join(sorted(output_dtypes))}")

    quantized = _detect_quantization(primary["tensors"], operators)
    has_metadata = parsed_model["metadata_count"] > 0

    edge_warnings: list[str] = []
    if quantized is True:
        notes.append("Quantization detected in TFLite model")
    elif quantized is False:
        notes.append("No quantization detected")
    else:
        notes.append("Could not determine quantization status")

    if any(op["op_type"] == "CUSTOM" or op["op_type"].startswith("CUSTOM_") for op in operators):
        edge_warnings.append("Model contains custom operators that may not be supported on all edge devices")

    dynamic_inputs = [
        t for t in input_tensors
        if any(s is None or isinstance(s, str) for s in t["shape"])
    ]
    if dynamic_inputs:
        edge_warnings.append(
            f"{len(dynamic_inputs)} input tensor(s) have dynamic shapes"
        )

    if has_metadata:
        notes.append(f"Model metadata entries: {parsed_model['metadata_count']}")
    else:
        notes.append("No metadata entries present (this is valid for TFLite)")

    if parsed_model["description"]:
        notes.append(f"Model description: {parsed_model['description']}")

    if parsed_model["version"] is not None:
        notes.append(f"TFLite schema version field: {parsed_model['version']}")

    parameter_count = _estimate_tflite_parameters(primary)

    summary_parts = [
        "Inspected TFLite model",
        f"('{file_name}')" if file_name else "",
    ]
    if parameter_count is not None:
        summary_parts.append(f"with ~{_fmt_count(parameter_count)} parameters")
    if operator_count:
        summary_parts.append(f"and {operator_count} operator(s)")
    top_ops_str = ", ".join(f"{t['op_type']}({t['count']})" for t in top_op_types[:5])
    if top_ops_str:
        summary_parts.append(f"Top ops: {top_ops_str}")
    summary = " ".join(p for p in summary_parts if p)

    return {
        "format": "tflite",
        "file_name": file_name,
        "file_size_bytes": len(data),
        "input_tensors": input_tensors,
        "output_tensors": output_tensors,
        "shape_summaries": shape_summaries,
        "dtype_summaries": dtype_summaries,
        "parameter_count": parameter_count,
        "layer_count": layer_count,
        "operator_count": operator_count,
        "graph_name": primary.get("name"),
        "operators": operators,
        "architecture": {
            "graph_name": primary.get("name"),
            "top_operator_types": top_op_types,
        },
        "edge_hints": {
            "quantized": quantized,
            "has_metadata": has_metadata,
            "notes": notes,
            "warnings": edge_warnings,
        },
        "tflite_metadata": {
            "subgraph_count": len(subgraphs),
            "schema_version": parsed_model["version"],
            "description": parsed_model["description"],
            "graph_raw_counts": primary.get("raw_counts", {}),
            "raw_counts": parsed_model["raw_counts"],
        },
        "warnings": warnings,
        "summary": summary,
    }


def _parse_tflite_model(data: bytes) -> dict:
    if len(data) < 8:
        raise ValueError("TFLite file is too small to contain a FlatBuffer model")

    warnings: list[str] = []
    file_identifier = data[4:8]
    if file_identifier != b"TFL3":
        warnings.append(
            f"Unexpected TFLite file identifier '{file_identifier.decode('latin-1', errors='replace')}'"
        )

    root_offset = struct.unpack_from("<I", data, 0)[0]
    model_table = _read_table(data, root_offset)

    version = _read_uint32_field(data, model_table, 0, default=None)
    description = _read_string_field(data, model_table, 3)
    metadata_count = _vector_length_field(data, model_table, 6)

    operator_codes = _parse_operator_codes(data, model_table, warnings)
    subgraphs = _parse_subgraphs(data, model_table, operator_codes, warnings)

    raw_counts = {
        "operator_code_count": len(operator_codes),
        "subgraph_count": _vector_length_field(data, model_table, 2),
        "buffer_count": _vector_length_field(data, model_table, 4),
        "metadata_count": metadata_count,
    }

    return {
        "version": version,
        "description": description,
        "metadata_count": metadata_count,
        "subgraphs": subgraphs,
        "warnings": warnings,
        "raw_counts": raw_counts,
    }


def _parse_subgraph(data: bytes, offset: int) -> Optional[dict]:
    table = _read_table(data, offset)

    tensors = _parse_subgraph_tensors(data, table)
    inputs_idx = _parse_subgraph_indices(data, table, 1)
    outputs_idx = _parse_subgraph_indices(data, table, 2)
    operators = _parse_subgraph_operators(data, table, tensors)
    name = _read_string_field(data, table, 4)

    input_tensors = [tensors[i] for i in inputs_idx if 0 <= i < len(tensors)]
    output_tensors = [tensors[i] for i in outputs_idx if 0 <= i < len(tensors)]

    return {
        "name": name,
        "tensors": tensors,
        "inputs": input_tensors,
        "outputs": output_tensors,
        "operators": operators,
    }


def _read_table(data: bytes, offset: int) -> Optional[dict]:
    if offset < 0 or offset + 4 > len(data):
        raise ValueError(f"FlatBuffer table offset out of range: {offset}")

    vtable_offset = offset - struct.unpack_from("<i", data, offset)[0]
    if vtable_offset < 0 or vtable_offset + 4 > len(data):
        raise ValueError(f"Invalid vtable offset at table position {offset}")

    vtable_size = struct.unpack_from("<H", data, vtable_offset)[0]
    object_inline_size = struct.unpack_from("<H", data, vtable_offset + 2)[0]
    if vtable_size < 4:
        raise ValueError(f"Invalid vtable size {vtable_size} at table position {offset}")

    num_fields = (vtable_size - 4) // 2
    fields: dict[int, int] = {}
    for i in range(num_fields):
        field_offset = struct.unpack_from("<H", data, vtable_offset + 4 + i * 2)[0]
        if field_offset != 0:
            fields[i] = field_offset

    return {
        "start": offset,
        "vtable_size": vtable_size,
        "object_size": object_inline_size,
        "fields": fields,
    }


def _get_field_offset(table: dict, field_index: int) -> Optional[int]:
    return table.get("fields", {}).get(field_index)


def _read_uoffset(data: bytes, position: int) -> int:
    if position < 0 or position + 4 > len(data):
        raise ValueError(f"FlatBuffer uoffset read out of range at {position}")
    return struct.unpack_from("<I", data, position)[0]


def _field_position(data: bytes, table: dict, field_index: int) -> Optional[int]:
    field_offset = _get_field_offset(table, field_index)
    if field_offset is None:
        return None
    position = table["start"] + field_offset
    if position < 0 or position >= len(data):
        raise ValueError(f"Field position out of range for field {field_index}")
    return position


def _read_uint32_field(
    data: bytes, table: dict, field_index: int, default: Optional[int] = 0
) -> Optional[int]:
    position = _field_position(data, table, field_index)
    if position is None:
        return default
    if position + 4 > len(data):
        raise ValueError(f"uint32 field {field_index} exceeds buffer size")
    return struct.unpack_from("<I", data, position)[0]


def _read_int32_field(
    data: bytes, table: dict, field_index: int, default: Optional[int] = 0
) -> Optional[int]:
    position = _field_position(data, table, field_index)
    if position is None:
        return default
    if position + 4 > len(data):
        raise ValueError(f"int32 field {field_index} exceeds buffer size")
    return struct.unpack_from("<i", data, position)[0]


def _read_int8_field(
    data: bytes, table: dict, field_index: int, default: Optional[int] = 0
) -> Optional[int]:
    position = _field_position(data, table, field_index)
    if position is None:
        return default
    if position + 1 > len(data):
        raise ValueError(f"int8 field {field_index} exceeds buffer size")
    return struct.unpack_from("<b", data, position)[0]


def _vector_info(data: bytes, table: dict, field_index: int) -> Optional[tuple[int, int]]:
    position = _field_position(data, table, field_index)
    if position is None:
        return None
    vector_start = position + _read_uoffset(data, position)
    if vector_start + 4 > len(data):
        raise ValueError(f"Vector field {field_index} exceeds buffer size")
    vector_length = _safe_vector_length(data, vector_start, element_size=1)
    return vector_start + 4, vector_length


def _vector_length_field(data: bytes, table: dict, field_index: int) -> int:
    info = _vector_info(data, table, field_index)
    if info is None:
        return 0
    _, length = info
    return length


def _read_string_field(data: bytes, table: dict, field_index: int) -> Optional[str]:
    position = _field_position(data, table, field_index)
    if position is None:
        return None
    string_start = position + _read_uoffset(data, position)
    return _read_string(data, string_start)


def _read_vector(data: bytes, offset: int) -> list:
    if offset < 0 or offset + 4 > len(data):
        return []
    length = _safe_vector_length(data, offset, element_size=4)
    result = []
    for i in range(length):
        item_offset = offset + 4 + i * 4
        if item_offset + 4 <= len(data):
            val = struct.unpack_from("<i", data, item_offset)[0]
            result.append(val)
    return result


def _read_string(data: bytes, offset: int) -> Optional[str]:
    if offset < 0 or offset + 4 > len(data):
        return None
    try:
        str_len = struct.unpack_from("<I", data, offset)[0]
        str_data = data[offset + 4: offset + 4 + str_len]
        return str_data.decode("utf-8", errors="replace")
    except Exception:
        return None


def _parse_subgraph_tensors(data: bytes, subgraph_table: dict) -> list[dict]:
    info = _vector_info(data, subgraph_table, 0)
    if info is None:
        return []

    vector_data_start, length = info
    tensors: list[dict] = []
    for i in range(length):
        elem_pos = vector_data_start + i * 4
        if elem_pos + 4 > len(data):
            break
        rel = struct.unpack_from("<I", data, elem_pos)[0]
        if rel == 0:
            tensors.append({"name": f"tensor_{i}", "dtype": "unknown", "shape": []})
            continue
        abs_offset = elem_pos + rel
        tensor = _parse_tensor(data, abs_offset, i)
        tensors.append(tensor)
    return tensors


def _parse_tensor(data: bytes, offset: int, index: int) -> dict:
    table = _read_table(data, offset)

    name = _read_string_field(data, table, 3) or f"tensor_{index}"
    dtype_int = _read_int8_field(data, table, 1, default=0)
    dtype_str = TFLITE_TENSOR_TYPE_MAP.get(dtype_int or 0, f"unknown({dtype_int})")

    shape = _parse_shape_vector(data, table, 0)
    shape_signature = _parse_shape_vector(data, table, 7)
    if not shape and shape_signature:
        shape = shape_signature

    return {
        "name": name,
        "dtype": dtype_str,
        "shape": shape,
        "quantized": _get_field_offset(table, 4) is not None,
    }


def _parse_subgraph_indices(data: bytes, subgraph_table: dict, field_index: int) -> list[int]:
    info = _vector_info(data, subgraph_table, field_index)
    if info is None:
        return []

    indices_abs, length = info
    result: list[int] = []
    for i in range(length):
        pos = indices_abs + i * 4
        if pos + 4 > len(data):
            break
        idx = struct.unpack_from("<i", data, pos)[0]
        result.append(idx)
    return result


def _parse_subgraph_operators(data: bytes, subgraph_table: dict, tensors: list[dict]) -> list[dict]:
    info = _vector_info(data, subgraph_table, 3)
    if info is None:
        return []

    op_data_start, length = info
    operators: list[dict] = []
    for i in range(length):
        elem_pos = op_data_start + i * 4
        if elem_pos + 4 > len(data):
            break
        rel = struct.unpack_from("<I", data, elem_pos)[0]
        if rel == 0:
            continue
        abs_offset = elem_pos + rel
        operators.append(_parse_operator(data, abs_offset, i, tensors, []))
    return operators


def _parse_operator(
    data: bytes,
    offset: int,
    index: int,
    tensors: list[dict],
    operator_codes: list[dict],
) -> dict:
    table = _read_table(data, offset)
    opcode_index = _read_uint32_field(data, table, 0, default=0) or 0
    op_type = _resolve_operator_name(opcode_index, operator_codes)

    input_indices = _parse_operator_tensor_indices(data, table, 1)
    output_indices = _parse_operator_tensor_indices(data, table, 2)

    return {
        "index": index,
        "name": None,
        "op_type": op_type,
        "inputs": _resolve_tensor_names(input_indices, tensors, prefix="in"),
        "outputs": _resolve_tensor_names(output_indices, tensors, prefix="out"),
    }


def _parse_int_vector(data: bytes, offset: int) -> list[int]:
    try:
        length = _safe_vector_length(data, offset, element_size=4)
        result = []
        for i in range(length):
            val = struct.unpack_from("<i", data, offset + 4 + i * 4)[0]
            result.append(val)
        return result
    except Exception:
        return []


def _safe_vector_length(data: bytes, offset: int, element_size: int) -> int:
    if element_size <= 0:
        return 0
    if offset < 0 or offset + 4 > len(data):
        return 0
    try:
        raw_length = struct.unpack_from("<I", data, offset)[0]
    except Exception:
        return 0

    max_by_bytes = max(0, (len(data) - (offset + 4)) // element_size)
    return min(raw_length, max_by_bytes, MAX_TFLITE_VECTOR_ITEMS)


def _parse_subgraphs(
    data: bytes, model_table: dict, operator_codes: list[dict], warnings: list[str]
) -> list[dict]:
    info = _vector_info(data, model_table, 2)
    if info is None:
        return []

    subgraph_data_start, length = info
    subgraphs: list[dict] = []
    for i in range(length):
        elem_pos = subgraph_data_start + i * 4
        if elem_pos + 4 > len(data):
            break
        rel = struct.unpack_from("<I", data, elem_pos)[0]
        if rel == 0:
            warnings.append(f"Subgraph entry {i} was null")
            continue
        subgraph_offset = elem_pos + rel
        try:
            table = _read_table(data, subgraph_offset)
            tensors = _parse_subgraph_tensors(data, table)
            inputs_idx = _parse_subgraph_indices(data, table, 1)
            outputs_idx = _parse_subgraph_indices(data, table, 2)
            operators = _parse_subgraph_operators_with_codes(
                data, table, tensors, operator_codes
            )
            name = _read_string_field(data, table, 4)

            subgraphs.append(
                {
                    "name": name,
                    "tensors": tensors,
                    "inputs": [tensors[idx] for idx in inputs_idx if 0 <= idx < len(tensors)],
                    "outputs": [tensors[idx] for idx in outputs_idx if 0 <= idx < len(tensors)],
                    "operators": operators,
                    "raw_counts": {
                        "tensor_count": _vector_length_field(data, table, 0),
                        "input_count": len(inputs_idx),
                        "output_count": len(outputs_idx),
                        "operator_count": len(operators),
                    },
                }
            )
        except Exception as e:
            warnings.append(f"Failed parsing subgraph {i}: {e}")
    return subgraphs


def _parse_subgraph_operators_with_codes(
    data: bytes, subgraph_table: dict, tensors: list[dict], operator_codes: list[dict]
) -> list[dict]:
    info = _vector_info(data, subgraph_table, 3)
    if info is None:
        return []

    op_data_start, length = info
    operators: list[dict] = []
    for i in range(length):
        elem_pos = op_data_start + i * 4
        if elem_pos + 4 > len(data):
            break
        rel = struct.unpack_from("<I", data, elem_pos)[0]
        if rel == 0:
            continue
        abs_offset = elem_pos + rel
        operators.append(_parse_operator(data, abs_offset, i, tensors, operator_codes))
    return operators


def _parse_operator_codes(data: bytes, model_table: dict, warnings: list[str]) -> list[dict]:
    info = _vector_info(data, model_table, 1)
    if info is None:
        return []

    op_code_data_start, length = info
    operator_codes: list[dict] = []
    for i in range(length):
        elem_pos = op_code_data_start + i * 4
        if elem_pos + 4 > len(data):
            break
        rel = struct.unpack_from("<I", data, elem_pos)[0]
        if rel == 0:
            warnings.append(f"OperatorCode entry {i} was null")
            operator_codes.append({"builtin_code": None, "custom_code": None, "version": None})
            continue

        table = _read_table(data, elem_pos + rel)
        builtin_code = _read_int8_field(data, table, 0, default=None)
        custom_code = _read_string_field(data, table, 1)
        version = _read_int32_field(data, table, 2, default=None)
        deprecated_builtin_code = _read_uint32_field(data, table, 3, default=None)
        if builtin_code == 127 and deprecated_builtin_code is not None:
            builtin_code = deprecated_builtin_code

        operator_codes.append(
            {
                "builtin_code": builtin_code,
                "custom_code": custom_code,
                "version": version,
            }
        )
    return operator_codes


def _parse_shape_vector(data: bytes, tensor_table: dict, field_index: int) -> list[Optional[int]]:
    info = _vector_info(data, tensor_table, field_index)
    if info is None:
        return []
    vector_data_start, length = info
    result: list[Optional[int]] = []
    for i in range(length):
        pos = vector_data_start + i * 4
        if pos + 4 > len(data):
            break
        value = struct.unpack_from("<i", data, pos)[0]
        result.append(value if value >= 0 else None)
    return result


def _parse_operator_tensor_indices(data: bytes, operator_table: dict, field_index: int) -> list[int]:
    info = _vector_info(data, operator_table, field_index)
    if info is None:
        return []
    vector_data_start, length = info
    result: list[int] = []
    for i in range(length):
        pos = vector_data_start + i * 4
        if pos + 4 > len(data):
            break
        result.append(struct.unpack_from("<i", data, pos)[0])
    return result


def _resolve_operator_name(opcode_index: int, operator_codes: list[dict]) -> str:
    if 0 <= opcode_index < len(operator_codes):
        operator_code = operator_codes[opcode_index]
        custom_code = operator_code.get("custom_code")
        if custom_code:
            return f"CUSTOM_{custom_code}"
        builtin_code = operator_code.get("builtin_code")
        if builtin_code is not None:
            return BUILTIN_OPERATOR_NAMES.get(builtin_code, f"BUILTIN_{builtin_code}")
    return f"OPCODE_{opcode_index}"


def _resolve_tensor_names(indices: list[int], tensors: list[dict], prefix: str) -> list[str]:
    names: list[str] = []
    for idx in indices:
        if idx == -1:
            names.append("OPTIONAL_TENSOR")
            continue
        if 0 <= idx < len(tensors):
            names.append(tensors[idx].get("name") or f"{prefix}_{idx}")
            continue
        names.append(f"{prefix}_{idx}")
    return names


def _detect_quantization(tensors: list[dict], operators: list[dict]) -> Optional[bool]:
    quant_ops = {
        "QUANTIZE", "DEQUANTIZE", "QUANTIZE_PER_CHANNEL",
    }
    try:
        for tensor in tensors:
            if tensor.get("quantized"):
                return True
            dtype = tensor.get("dtype", "")
            if dtype in {"uint8", "int8", "int16", "int4"}:
                return True

        for op in operators:
            if op["op_type"] in quant_ops:
                return True
            if "quant" in op["op_type"].lower():
                return True
        return False
    except Exception:
        return None


def _estimate_tflite_parameters(
    subgraph: dict
) -> Optional[int]:
    try:
        total_params = 0
        for tensor in subgraph.get("tensors", []):
            shape = tensor.get("shape", [])
            if not shape or any(s is None for s in shape):
                continue
            count = 1
            for dim in shape:
                count *= dim
            total_params += count
        return total_params if total_params > 0 else None
    except Exception:
        return None


def _compute_top_operator_types(operators: list[dict]) -> list[dict]:
    from collections import Counter
    counter = Counter(op["op_type"] for op in operators)
    return [
        {"op_type": op_type, "count": count}
        for op_type, count in counter.most_common(10)
    ]


def _fmt_count(n: int) -> str:
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.1f}B"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)