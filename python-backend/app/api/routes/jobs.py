from fastapi import APIRouter, HTTPException

from app.schemas.execution import ErrorResponse, JobDetailResponse
from app.services.job_store import job_store

router = APIRouter()


@router.get(
    "/jobs/{job_id}",
    response_model=JobDetailResponse,
    responses={404: {"model": ErrorResponse}},
)
def get_job(job_id: str) -> JobDetailResponse:
    job = job_store.get_job(job_id)
    if job is None:
        raise HTTPException(
            status_code=404,
            detail={
                "code": "JOB_NOT_FOUND",
                "message": f"Job {job_id} not found",
            },
        )
    return JobDetailResponse(job=job)
