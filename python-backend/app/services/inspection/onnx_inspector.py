import logging
from typing import Optional

import onnx
from onnx import ModelProto, TensorProto, ValueInfoProto

from app.services.inspection.format_detector import detect_format_from_bytes

logger = logging.getLogger(__name__)


def inspect_onnx(data: bytes, file_name: Optional[str] = None) -> dict:
    try:
        model = onnx.load_from_string(data)
    except Exception as e:
        raise ValueError(f"Failed to parse ONNX model: {e}") from e

    warnings: list[str] = []

    try:
        onnx.checker.check_model(model, full_check=False)
    except Exception as e:
        warnings.append(f"ONNX model validation warning: {e}")

    graph = model.graph

    input_tensors = _extract_onnx_tensors(graph.input)
    output_tensors = _extract_onnx_tensors(graph.output)

    operators = _extract_onnx_operators(graph)

    parameter_count = _count_onnx_parameters(model)

    layer_count = _count_onnx_layers(graph)

    operator_count = len(operators)
    top_op_types = _compute_top_operator_types(operators)

    shape_summaries = []
    for t in input_tensors:
        shape_str = ", ".join(str(s) for s in t["shape"])
        shape_summaries.append(f"Input tensor '{t['name']}': [{shape_str}]")
    for t in output_tensors:
        shape_str = ", ".join(str(s) for s in t["shape"])
        shape_summaries.append(f"Output tensor '{t['name']}': [{shape_str}]")

    dtype_summaries = _compute_dtype_summaries(input_tensors, output_tensors)

    edge_hints_info = _compute_onnx_edge_hints(model, warnings)

    summary_parts = [
        f"Inspected ONNX model",
        f"('{file_name}')" if file_name else "",
    ]
    if parameter_count is not None:
        summary_parts.append(f"with ~{_fmt_count(parameter_count)} parameters")
    if operator_count:
        summary_parts.append(f"and {operator_count} operator(s)")
    top_ops = ", ".join(f"{t['op_type']}({t['count']})" for t in top_op_types[:5])
    if top_ops:
        summary_parts.append(f"Top ops: {top_ops}")
    summary = " ".join(p for p in summary_parts if p)

    return {
        "format": "onnx",
        "file_name": file_name,
        "file_size_bytes": len(data),
        "input_tensors": input_tensors,
        "output_tensors": output_tensors,
        "shape_summaries": shape_summaries,
        "dtype_summaries": dtype_summaries,
        "parameter_count": parameter_count,
        "layer_count": layer_count,
        "operator_count": operator_count,
        "graph_name": graph.name if graph.name else None,
        "operators": operators,
        "architecture": {
            "graph_name": graph.name if graph.name else None,
            "top_operator_types": top_op_types,
        },
        "edge_hints": edge_hints_info,
        "tflite_metadata": None,
        "warnings": warnings,
        "summary": summary,
    }


def _extract_onnx_tensors(value_infos) -> list[dict]:
    tensors = []
    for vi in value_infos:
        name = vi.name
        dtype = onnx_dtype_to_str(vi.type.tensor_type.elem_type)
        shape: list = []
        if vi.type.tensor_type.HasField("shape"):
            for dim in vi.type.tensor_type.shape.dim:
                if dim.HasField("dim_value"):
                    shape.append(int(dim.dim_value))
                elif dim.HasField("dim_param"):
                    shape.append(dim.dim_param)
                else:
                    shape.append(None)
        else:
            shape.append(None)
        tensors.append({"name": name, "dtype": dtype, "shape": shape})
    return tensors


def _extract_onnx_operators(graph) -> list[dict]:
    ops = []
    for i, node in enumerate(graph.node):
        ops.append({
            "index": i,
            "name": node.name or None,
            "op_type": node.op_type,
            "inputs": list(node.input),
            "outputs": list(node.output),
        })
    return ops


def _count_onnx_parameters(model: ModelProto) -> Optional[int]:
    try:
        total = 0
        for init in model.graph.initializer:
            shape = [d for d in init.dims if d > 0]
            if not shape:
                continue
            count = 1
            for d in shape:
                count *= d
            total += count
        return total if total > 0 else None
    except Exception:
        return None


def _count_onnx_layers(graph) -> Optional[int]:
    try:
        op_types = set()
        for node in graph.node:
            op_types.add(node.op_type)
        return len(op_types)
    except Exception:
        return None


def _compute_top_operator_types(operators: list[dict]) -> list[dict]:
    from collections import Counter
    counter = Counter(op["op_type"] for op in operators)
    return [
        {"op_type": op_type, "count": count}
        for op_type, count in counter.most_common(10)
    ]


def _compute_dtype_summaries(
    input_tensors: list[dict], output_tensors: list[dict]
) -> list[str]:
    summaries = []
    input_dtypes = {t["dtype"] for t in input_tensors if t["dtype"] != "unknown"}
    output_dtypes = {t["dtype"] for t in output_tensors if t["dtype"] != "unknown"}
    if input_dtypes:
        summaries.append(f"Input tensor dtype(s): {', '.join(sorted(input_dtypes))}")
    if output_dtypes:
        summaries.append(f"Output tensor dtype(s): {', '.join(sorted(output_dtypes))}")
    has_dynamic = any(
        any(s is None or isinstance(s, str) for s in t["shape"])
        for t in input_tensors + output_tensors
    )
    if has_dynamic:
        summaries.append("Model uses dynamic shape dimensions")
    return summaries


def _compute_onnx_edge_hints(model: ModelProto, warnings: list[str]) -> dict:
    quantized = None
    has_metadata = None
    notes: list[str] = []
    edge_warnings: list[str] = []

    try:
        has_quant_nodes = any(
            "quant" in node.op_type.lower() or "qlinear" in node.op_type.lower()
            or "quantize" in node.op_type.lower()
            for node in model.graph.node
        )
        quantized = has_quant_nodes

        if has_quant_nodes:
            notes.append("Quantization operators detected in model graph")
        else:
            notes.append("No quantization operators detected")
    except Exception:
        pass

    try:
        has_metadata = len(model.metadata_props) > 0
        if has_metadata:
            notes.append(f"Model has {len(model.metadata_props)} metadata properties")
    except Exception:
        pass

    try:
        opset_versions = [o.version for o in model.opset_import]
        if opset_versions:
            notes.append(f"ONNX opset version(s): {', '.join(str(v) for v in opset_versions)}")
    except Exception:
        pass

    for node in model.graph.node:
        if node.domain and node.domain != "" and node.domain != "ai.onnx":
            edge_warnings.append(
                f"Custom operator domain '{node.domain}' may not be supported on all edge runtimes"
            )
            break

    dynamic_inputs = [
        t for t in _extract_onnx_tensors(model.graph.input)
        if any(s is None or isinstance(s, str) for s in t["shape"])
    ]
    if dynamic_inputs:
        edge_warnings.append(
            f"{len(dynamic_inputs)} input tensor(s) have dynamic shapes - verify deployment batch size"
        )

    return {
        "quantized": quantized,
        "has_metadata": has_metadata,
        "notes": notes,
        "warnings": edge_warnings,
    }


def onnx_dtype_to_str(dtype_int: int) -> str:
    mapping = {
        0: "undefined", 1: "float", 2: "uint8", 3: "int8",
        4: "uint16", 5: "int16", 6: "int32", 7: "int64",
        8: "string", 9: "bool", 10: "float16", 11: "double",
        12: "uint32", 13: "uint64", 14: "complex64", 15: "complex128",
        16: "bfloat16", 17: "float8e4m3fn", 18: "float8e4m3fnuz",
        19: "float8e5m2", 20: "float8e5m2fnuz", 21: "uint4",
        22: "int4",
    }
    return mapping.get(dtype_int, "unknown")


def _fmt_count(n: int) -> str:
    if n >= 1_000_000_000:
        return f"{n / 1_000_000_000:.1f}B"
    if n >= 1_000_000:
        return f"{n / 1_000_000:.1f}M"
    if n >= 1_000:
        return f"{n / 1_000:.1f}K"
    return str(n)