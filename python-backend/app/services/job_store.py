import uuid
from datetime import datetime, timezone
from typing import Optional

from app.schemas.execution import (
    JobDetail,
    JobKind,
    JobStatus,
    JobSummary,
)


class InMemoryJobStore:
    """Simple in-memory store for execution jobs.

    This is a stub implementation for Phase 1. In later phases,
    this can be replaced with a database-backed store.
    """

    def __init__(self) -> None:
        self._jobs: dict[str, dict] = {}

    def create_job(
        self,
        kind: JobKind,
        project_id: str,
        request_payload: Optional[dict] = None,
    ) -> JobSummary:
        job_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc)

        job: dict = {
            "id": job_id,
            "kind": kind,
            "status": JobStatus.queued,
            "project_id": project_id,
            "initiated_by": None,
            "created_at": now,
            "updated_at": now,
            "started_at": None,
            "completed_at": None,
            "progress_message": None,
            "error_code": None,
            "error_message": None,
            "request_payload": request_payload,
            "result_summary": None,
            "artifacts": None,
            "inspection_result": None,
            "evaluation_result": None,
        }

        self._jobs[job_id] = job
        return self._to_summary(job)

    def get_job(self, job_id: str) -> Optional[JobDetail]:
        job = self._jobs.get(job_id)
        if job is None:
            return None
        return self._to_detail(job)

    def update_status(
        self,
        job_id: str,
        status: JobStatus,
        **kwargs,
    ) -> Optional[JobSummary]:
        job = self._jobs.get(job_id)
        if job is None:
            return None

        job["status"] = status
        job["updated_at"] = datetime.now(timezone.utc)

        if status == JobStatus.running and job["started_at"] is None:
            job["started_at"] = datetime.now(timezone.utc)

        if status in (JobStatus.succeeded, JobStatus.failed):
            job["completed_at"] = datetime.now(timezone.utc)

        for key, value in kwargs.items():
            if key in job:
                job[key] = value

        return self._to_summary(job)

    def set_result(
        self,
        job_id: str,
        result: dict,
        kind: JobKind,
    ) -> Optional[JobSummary]:
        job = self._jobs.get(job_id)
        if job is None:
            return None

        job["result_summary"] = result
        if kind == JobKind.inspection:
            job["inspection_result"] = result
        elif kind == JobKind.evaluation:
            job["evaluation_result"] = result

        job["updated_at"] = datetime.now(timezone.utc)
        return self._to_summary(job)

    def _to_summary(self, job: dict) -> JobSummary:
        return JobSummary(
            id=job["id"],
            kind=job["kind"],
            status=job["status"],
            project_id=job["project_id"],
            initiated_by=job["initiated_by"],
            created_at=job["created_at"],
            updated_at=job["updated_at"],
            started_at=job["started_at"],
            completed_at=job["completed_at"],
            progress_message=job["progress_message"],
            error_code=job["error_code"],
            error_message=job["error_message"],
        )

    def _to_detail(self, job: dict) -> JobDetail:
        return JobDetail(
            id=job["id"],
            kind=job["kind"],
            status=job["status"],
            project_id=job["project_id"],
            initiated_by=job["initiated_by"],
            created_at=job["created_at"],
            updated_at=job["updated_at"],
            started_at=job["started_at"],
            completed_at=job["completed_at"],
            progress_message=job["progress_message"],
            error_code=job["error_code"],
            error_message=job["error_message"],
            request_payload=job.get("request_payload"),
            result_summary=job.get("result_summary"),
            artifacts=job.get("artifacts"),
            inspection_result=job.get("inspection_result"),
            evaluation_result=job.get("evaluation_result"),
        )


job_store = InMemoryJobStore()
