from datetime import datetime
from enum import Enum
from typing import Any, Optional
from pydantic import BaseModel, Field


class JobKind(str, Enum):
    inspection = "inspection"
    evaluation = "evaluation"


class JobStatus(str, Enum):
    queued = "queued"
    running = "running"
    succeeded = "succeeded"
    failed = "failed"


class TensorInfo(BaseModel):
    name: str
    dtype: str
    shape: list[Any]


class OperatorInfo(BaseModel):
    index: int
    name: Optional[str] = None
    op_type: str
    inputs: list[str] = []
    outputs: list[str] = []


class OperatorTypeCount(BaseModel):
    op_type: str
    count: int


class ArchitectureInfo(BaseModel):
    graph_name: Optional[str] = None
    top_operator_types: list[OperatorTypeCount] = []


class EdgeHintsInfo(BaseModel):
    quantized: Optional[bool] = None
    has_metadata: Optional[bool] = None
    notes: list[str] = []
    warnings: list[str] = []


class InspectionResult(BaseModel):
    format: str
    file_name: Optional[str] = None
    file_size_bytes: Optional[int] = None
    input_tensors: list[TensorInfo]
    output_tensors: list[TensorInfo]
    shape_summaries: list[str] = []
    dtype_summaries: list[str] = []
    parameter_count: Optional[int] = None
    layer_count: Optional[int] = None
    operator_count: Optional[int] = None
    graph_name: Optional[str] = None
    operators: list[OperatorInfo] = []
    architecture: Optional[ArchitectureInfo] = None
    edge_hints: Optional[EdgeHintsInfo] = None
    tflite_metadata: Optional[dict[str, Any]] = None
    warnings: list[str] = []
    summary: str


class PerClassMetric(BaseModel):
    class_name: str
    precision: float
    recall: float
    f1: float
    support: int


class ConfusionMatrix(BaseModel):
    labels: list[str]
    matrix: list[list[int]]


class DatasetSummary(BaseModel):
    sample_count: int
    class_count: int
    class_name: Optional[str] = None


class EvaluationResult(BaseModel):
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    loss: Optional[float] = None
    per_class_metrics: list[PerClassMetric]
    confusion_matrix: Optional[ConfusionMatrix] = None
    dataset_summary: Optional[DatasetSummary] = None
    warnings: list[str]
    summary: str


class InspectionRequest(BaseModel):
    project_id: str
    model_asset_id: Optional[str] = None
    model_format: Optional[str] = None
    file_name: Optional[str] = None
    model_download_url: Optional[str] = None


class EvaluationRequest(BaseModel):
    project_id: str
    model_asset_id: Optional[str] = None
    dataset_name: Optional[str] = None
    dataset_size: Optional[int] = None


class JobSummary(BaseModel):
    id: str
    kind: JobKind
    status: JobStatus
    project_id: str
    initiated_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    progress_message: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None


class JobDetail(JobSummary):
    request_payload: Optional[dict[str, Any]] = None
    result_summary: Optional[dict[str, Any]] = None
    artifacts: Optional[list[dict[str, Any]]] = None
    inspection_result: Optional[InspectionResult] = None
    evaluation_result: Optional[EvaluationResult] = None


class JobCreateResponse(BaseModel):
    job: JobSummary


class JobDetailResponse(BaseModel):
    job: JobDetail


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str = "0.2.0"


class ErrorResponse(BaseModel):
    code: str
    message: str
    details: Optional[dict[str, Any]] = None
