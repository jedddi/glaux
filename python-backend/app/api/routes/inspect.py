import logging

from fastapi import APIRouter, HTTPException

from app.schemas.execution import (
    ErrorResponse,
    JobDetailResponse,
    InspectionRequest,
)
from app.services.inspect_service import run_inspection, InspectionError
from app.services.job_store import job_store

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/inspect",
    response_model=JobDetailResponse,
    responses={400: {"model": ErrorResponse}},
)
async def create_inspection_job(request: InspectionRequest) -> JobDetailResponse:
    job = job_store.create_job(
        kind="inspection",
        project_id=request.project_id,
        request_payload=request.model_dump(),
    )

    job_store.update_status(job.id, "running", progress_message="Running model inspection")

    try:
        result = await run_inspection(
            project_id=request.project_id,
            model_asset_id=request.model_asset_id,
            model_format=request.model_format,
            file_name=request.file_name,
            model_download_url=request.model_download_url,
        )

        job_store.set_result(job.id, result, kind="inspection")
        job_store.update_status(
            job.id, "succeeded", progress_message="Inspection completed"
        )
    except InspectionError as e:
        job_store.update_status(
            job.id,
            "failed",
            error_code=e.code,
            error_message=e.message,
        )
        logger.warning(f"Inspection failed for job {job.id}: {e.code} - {e.message}")
    except Exception as e:
        job_store.update_status(
            job.id,
            "failed",
            error_code="INTERNAL_ERROR",
            error_message=str(e),
        )
        logger.error(f"Unexpected error during inspection for job {job.id}: {e}")

    updated = job_store.get_job(job.id)
    if updated is None:
        raise HTTPException(status_code=500, detail="Job not found after creation")

    return JobDetailResponse(job=updated)