from fastapi import APIRouter, HTTPException

from app.schemas.execution import (
    ErrorResponse,
    EvaluationRequest,
    JobDetailResponse,
)
from app.services.evaluate_service import generate_stub_evaluation_result
from app.services.job_store import job_store

router = APIRouter()


@router.post(
    "/evaluate",
    response_model=JobDetailResponse,
    responses={400: {"model": ErrorResponse}},
)
def create_evaluation_job(request: EvaluationRequest) -> JobDetailResponse:
    job = job_store.create_job(
        kind="evaluation",
        project_id=request.project_id,
        request_payload=request.model_dump(),
    )

    result = generate_stub_evaluation_result(
        project_id=request.project_id,
        dataset_name=request.dataset_name,
    )

    job_store.update_status(job.id, "running", progress_message="Running evaluation")
    job_store.set_result(job.id, result.model_dump(), kind="evaluation")
    job_store.update_status(job.id, "succeeded", progress_message="Evaluation completed")

    updated = job_store.get_job(job.id)
    if updated is None:
        raise HTTPException(status_code=500, detail="Job not found after creation")

    return JobDetailResponse(job=updated)
