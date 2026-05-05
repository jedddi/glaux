from fastapi import APIRouter

from app.schemas.execution import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="healthy",
        service="glaux-execution",
    )
