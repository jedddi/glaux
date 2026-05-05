from fastapi import FastAPI

from app.api.routes import evaluate, health, inspect, jobs, sessions

app = FastAPI(
    title="Glaux Execution Service",
    description="Execution service for Glaux model inspection and evaluation",
    version="0.2.0",
)

app.include_router(health.router, tags=["health"])
app.include_router(inspect.router, tags=["inspection"])
app.include_router(evaluate.router, tags=["evaluation"])
app.include_router(jobs.router, tags=["jobs"])
app.include_router(sessions.router, tags=["sessions"])


@app.get("/")
def root():
    return {
        "service": "glaux-execution",
        "version": "0.2.0",
        "docs": "/docs",
    }
