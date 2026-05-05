import logging
import mimetypes
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from fastapi import APIRouter, HTTPException, UploadFile, Form, File
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.schemas.execution import (
    ErrorResponse,
    InspectionResult,
    InspectionRequest,
)
from app.services.inspection.inspector import inspect_model_from_bytes, InspectionError
from app.services.evaluate_service import generate_stub_evaluation_result

logger = logging.getLogger(__name__)

SESSIONS_DIR = Path(os.getenv("SESSIONS_DIR", "sessions"))

class SessionInfo(BaseModel):
    session_id: str
    created_at: datetime
    model_file_name: Optional[str] = None
    model_format: Optional[str] = None
    inspection_result: Optional[dict] = None
    evaluation_result: Optional[dict] = None
    failure_result: Optional[dict] = None

class InMemorySessionStore:
    def __init__(self) -> None:
        self._sessions: dict[str, SessionInfo] = {}

    def create(self, session_id: str) -> SessionInfo:
        info = SessionInfo(
            session_id=session_id,
            created_at=datetime.now(timezone.utc),
        )
        self._sessions[session_id] = info
        session_dir = SESSIONS_DIR / session_id
        session_dir.mkdir(parents=True, exist_ok=True)
        return info

    def get(self, session_id: str) -> Optional[SessionInfo]:
        return self._sessions.get(session_id)

    def set_inspection_result(self, session_id: str, result: dict) -> None:
        info = self._sessions.get(session_id)
        if info:
            info.inspection_result = result

    def set_evaluation_result(self, session_id: str, result: dict) -> None:
        info = self._sessions.get(session_id)
        if info:
            info.evaluation_result = result

    def set_failure_result(self, session_id: str, result: dict) -> None:
        info = self._sessions.get(session_id)
        if info:
            info.failure_result = result

session_store = InMemorySessionStore()

router = APIRouter(prefix="/sessions")

def _get_session_dir(session_id: str) -> Path:
    return SESSIONS_DIR / session_id

def _get_model_dir(session_id: str) -> Path:
    return _get_session_dir(session_id) / "model"

def _get_model_path(session_id: str) -> Optional[Path]:
    model_dir = _get_model_dir(session_id)
    if not model_dir.exists():
        return None
    files = list(model_dir.iterdir())
    return files[0] if files else None

def _ensure_inspection_result(session: SessionInfo, model_path: Path) -> dict[str, Any]:
    if session.inspection_result is not None:
        return session.inspection_result

    data = model_path.read_bytes()
    result = inspect_model_from_bytes(
        data,
        session.model_file_name,
        session.model_format,
    )
    session.inspection_result = result
    return result

def _extract_namespace(op_name: str, op_type: str, op_index: int) -> str:
    """Extract namespace hierarchy from slash-separated operator/tensor names."""
    if not op_name or op_name == op_type:
        return ""
    normalized_name = op_name.replace("\\", "/")
    if "/" not in normalized_name:
        return ""
    return normalized_name.rsplit("/", 1)[0]


def _is_placeholder_tensor_name(name: str) -> bool:
    normalized = name.strip()
    if not normalized:
        return True
    upper_name = normalized.upper()
    if upper_name == "OPTIONAL_TENSOR":
        return True
    lower_name = normalized.lower()
    return lower_name.startswith("out_") or lower_name.startswith("tensor_")


def _resolve_display_name(op: dict[str, Any], op_type: str, op_index: int) -> str:
    explicit_name = op.get("name")
    if isinstance(explicit_name, str) and explicit_name.strip():
        return explicit_name.strip()

    outputs = op.get("outputs") if isinstance(op.get("outputs"), list) else []
    for output_name in outputs:
        if not isinstance(output_name, str):
            continue
        candidate = output_name.strip()
        if _is_placeholder_tensor_name(candidate):
            continue
        return candidate

    return f"{op_type}_{op_index}"


def _format_op_label(op_type: str) -> str:
    """Match the Model Explorer convention: lowercase TFLite-style ALL_CAPS op types,
    leave PascalCase / mixed-case (ONNX-style) op types untouched."""
    if not op_type:
        return "unknown"
    if any(c.islower() for c in op_type):
        return op_type
    return op_type.lower()


def _collect_boundary_tensor_names(inspect_result: dict[str, Any], key_snake: str, key_camel: str) -> set[str]:
    tensors = inspect_result.get(key_snake)
    if not isinstance(tensors, list):
        tensors = inspect_result.get(key_camel)
    if not isinstance(tensors, list):
        return set()
    names: set[str] = set()
    for tensor in tensors:
        if isinstance(tensor, dict):
            name = tensor.get("name")
        elif isinstance(tensor, str):
            name = tensor
        else:
            name = None
        if isinstance(name, str) and name.strip():
            names.add(name.strip())
    return names


def _build_graph_collections(
    inspect_result: dict[str, Any],
    *,
    session_id: str,
    graph_name: str,
) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    operators = inspect_result.get("operators")
    if not isinstance(operators, list) or len(operators) == 0:
        raise HTTPException(status_code=422, detail="No operators available to build graph")

    input_tensor_names = _collect_boundary_tensor_names(
        inspect_result, "input_tensors", "inputTensors"
    )
    output_tensor_names = _collect_boundary_tensor_names(
        inspect_result, "output_tensors", "outputTensors"
    )

    graph_inputs_node_id = "graph_inputs"
    graph_outputs_node_id = "graph_outputs"

    producer_by_tensor: dict[str, str] = {}
    for tensor_name in input_tensor_names:
        producer_by_tensor[tensor_name] = graph_inputs_node_id

    nodes: list[dict[str, Any]] = []

    for idx, op in enumerate(operators):
        if not isinstance(op, dict):
            continue
        op_index = op.get("index")
        if not isinstance(op_index, int):
            op_index = idx
        node_id = f"op_{op_index}"

        outputs = op.get("outputs") if isinstance(op.get("outputs"), list) else []
        for tensor_name in outputs:
            if isinstance(tensor_name, str) and tensor_name:
                producer_by_tensor[tensor_name] = node_id

    if input_tensor_names:
        nodes.append(
            {
                "id": graph_inputs_node_id,
                "label": "GraphInputs",
                "namespace": "",
                "incomingEdges": [],
                "attrs": [
                    {"key": "tensors", "value": ", ".join(sorted(input_tensor_names))},
                ],
            }
        )

    graph_output_edges: list[dict[str, Any]] = []
    seen_output_edge_keys: set[tuple[str, str]] = set()

    for idx, op in enumerate(operators):
        if not isinstance(op, dict):
            continue
        op_index = op.get("index")
        if not isinstance(op_index, int):
            op_index = idx
        node_id = f"op_{op_index}"

        op_type = op.get("op_type") or op.get("opType") or "UNKNOWN"
        op_name = _resolve_display_name(op, str(op_type), op_index)
        label_name = _format_op_label(str(op_type))
        inputs = op.get("inputs") if isinstance(op.get("inputs"), list) else []
        outputs = op.get("outputs") if isinstance(op.get("outputs"), list) else []

        incoming_edges: list[dict[str, Any]] = []
        for tensor_name in inputs:
            if not isinstance(tensor_name, str) or not tensor_name:
                continue
            source_node_id = producer_by_tensor.get(tensor_name)
            if not source_node_id or source_node_id == node_id:
                continue
            incoming_edges.append(
                {
                    "sourceNodeId": source_node_id,
                    "sourceNodeOutputId": tensor_name,
                    "targetNodeInputId": tensor_name,
                }
            )

        for tensor_name in outputs:
            if not isinstance(tensor_name, str) or not tensor_name:
                continue
            if tensor_name not in output_tensor_names:
                continue
            edge_key = (node_id, tensor_name)
            if edge_key in seen_output_edge_keys:
                continue
            seen_output_edge_keys.add(edge_key)
            graph_output_edges.append(
                {
                    "sourceNodeId": node_id,
                    "sourceNodeOutputId": tensor_name,
                    "targetNodeInputId": tensor_name,
                }
            )

        namespace = _extract_namespace(op_name, op_type, op_index)
        nodes.append(
            {
                "id": node_id,
                "label": label_name,
                "namespace": namespace,
                "incomingEdges": incoming_edges,
                "attrs": [
                    {"key": "index", "value": str(op_index)},
                    {"key": "opType", "value": str(op_type)},
                    {"key": "name", "value": str(op_name)},
                ],
            }
        )

    if output_tensor_names and graph_output_edges:
        nodes.append(
            {
                "id": graph_outputs_node_id,
                "label": "GraphOutputs",
                "namespace": "",
                "incomingEdges": graph_output_edges,
                "attrs": [
                    {"key": "tensors", "value": ", ".join(sorted(output_tensor_names))},
                ],
            }
        )

    graph_id = f"session_{session_id}_graph"
    graph_collections = [
        {
            "label": graph_name,
            "graphs": [
                {
                    "id": graph_id,
                    "nodes": nodes,
                }
            ],
        }
    ]

    visualizer_config: dict[str, Any] = {
        "showOpNodeOutOfLayerEdgesWithoutSelecting": True,
        "highlightLayerNodeInputsOutputs": True,
    }

    return graph_collections, visualizer_config

@router.post("/{session_id}/upload")
async def upload_model(
    session_id: str,
    file: UploadFile = File(...),
):
    session = session_store.get(session_id)
    if session is None:
        session = session_store.create(session_id)

    model_dir = _get_model_dir(session_id)
    model_dir.mkdir(parents=True, exist_ok=True)

    file_data = await file.read()
    file_name = file.filename or f"model-{uuid.uuid4().hex}"
    file_path = model_dir / file_name
    file_path.write_bytes(file_data)

    ext = os.path.splitext(file_name)[1].lower()
    model_format = "onnx" if ext == ".onnx" else "tflite" if ext == ".tflite" else "unknown"

    session.model_file_name = file_name
    session.model_format = model_format

    logger.info(f"Model uploaded for session {session_id}: {file_name} ({model_format})")

    return {
        "sessionId": session_id,
        "fileName": file_name,
        "format": model_format,
    }

@router.get("/{session_id}/inspect")
async def inspect_session(session_id: str):
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    model_path = _get_model_path(session_id)
    if model_path is None or not model_path.exists():
        raise HTTPException(status_code=400, detail="No model file uploaded for this session")

    if session.inspection_result is not None:
        return {"result": session.inspection_result}

    try:
        data = await run_in_threadpool(model_path.read_bytes)
        result = await run_in_threadpool(
            inspect_model_from_bytes,
            data,
            session.model_file_name,
            session.model_format,
        )
        session.inspection_result = result
        return {"result": result}
    except InspectionError as e:
        raise HTTPException(status_code=400, detail=f"{e.code}: {e.message}")
    except Exception as e:
        logger.error(f"Inspection failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Inspection failed: {str(e)}")

@router.get("/{session_id}/download")
async def download_session_model(session_id: str):
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    model_path = _get_model_path(session_id)
    if model_path is None or not model_path.exists():
        raise HTTPException(status_code=404, detail="No model file uploaded for this session")

    guessed_mime, _ = mimetypes.guess_type(model_path.name)
    media_type = guessed_mime or "application/octet-stream"
    return FileResponse(
        path=model_path,
        media_type=media_type,
        filename=model_path.name,
    )

@router.get("/{session_id}/graph")
async def get_session_graph(session_id: str):
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    model_path = _get_model_path(session_id)
    if model_path is None or not model_path.exists():
        raise HTTPException(status_code=400, detail="No model file uploaded for this session")

    try:
        inspect_result = await run_in_threadpool(_ensure_inspection_result, session, model_path)
        graph_name = str(
            inspect_result.get("graph_name")
            or inspect_result.get("graphName")
            or inspect_result.get("file_name")
            or inspect_result.get("fileName")
            or session.model_file_name
            or "Model"
        )
        graph_collections, visualizer_config = _build_graph_collections(
            inspect_result,
            session_id=session_id,
            graph_name=graph_name,
        )
        return {"graphCollections": graph_collections, "visualizerConfig": visualizer_config}
    except InspectionError as e:
        raise HTTPException(status_code=400, detail=f"{e.code}: {e.message}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Graph generation failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Graph generation failed: {str(e)}")

@router.post("/{session_id}/evaluate")
async def evaluate_session(
    session_id: str,
    file: Optional[UploadFile] = File(None),
    dataset_name: Optional[str] = Form(None),
):
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.model_file_name is None:
        raise HTTPException(status_code=400, detail="No model uploaded for this session")

    ds_name = dataset_name or (file.filename if file else "simulated")

    try:
        result = generate_stub_evaluation_result(
            project_id=session_id,
            dataset_name=ds_name,
        )
        result_dict = result.model_dump()
        session.evaluation_result = result_dict

        failure_result = _generate_stub_failures(session_id, result)
        session.failure_result = failure_result

        return {"result": result_dict}
    except Exception as e:
        logger.error(f"Evaluation failed for session {session_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")

@router.get("/{session_id}/evaluate")
async def get_evaluation(session_id: str):
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.evaluation_result is None:
        raise HTTPException(status_code=404, detail="No evaluation results for this session")

    return {"result": session.evaluation_result}

@router.get("/{session_id}/failures")
async def get_failures(session_id: str):
    session = session_store.get(session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.failure_result is None:
        raise HTTPException(status_code=404, detail="No failure results for this session")

    return {"result": session.failure_result}

def _generate_stub_failures(session_id: str, evaluation_result) -> dict:
    samples = []
    for i in range(15):
        samples.append({
            "id": f"sample-{i}",
            "predictedLabel": "dog" if i % 3 == 0 else "cat",
            "actualLabel": "cat" if i % 3 == 0 else "dog",
            "confidence": round(0.3 + (i * 0.04), 2),
            "errorType": "misclassification",
            "rank": i + 1,
            "metadata": {"provenance": "simulated"},
        })

    return {
        "totalFailures": 15,
        "accuracy": evaluation_result.accuracy,
        "topConfusedPairs": [
            {"trueLabel": "cat", "predictedLabel": "dog", "count": 5},
            {"trueLabel": "dog", "predictedLabel": "cat", "count": 3},
            {"trueLabel": "bird", "predictedLabel": "fish", "count": 2},
        ],
        "failureByTrueClass": {"cat": 5, "dog": 3, "bird": 2},
        "failureByPredictedClass": {"dog": 5, "cat": 3, "fish": 2},
        "samples": samples,
        "provenance": "simulated",
    }
