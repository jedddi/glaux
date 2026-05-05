# Glaux Python Execution Service

FastAPI service that provides real model inspection (ONNX/TFLite) and stub evaluation for Glaux.

## Inspection (Real)

The `/inspect` endpoint performs real model parsing:
- **ONNX**: Full graph inspection using the `onnx` Python library — extracts inputs, outputs, operators, parameter count, architecture, and edge hints.
- **TFLite**: Binary flatbuffer parsing — extracts subgraph metadata, tensor info, operators, and quantization hints.

The `model_download_url` field is required. The Next.js orchestrator generates a signed Supabase Storage URL and passes it to the service.

## Evaluation (Stub)

The `/evaluate` endpoint returns deterministic stub results. This will be implemented in a future phase.

## Quick Start

```bash
# Create virtual environment
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the service
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`.

Interactive docs at `http://localhost:8000/docs`.

## Environment Variables

Copy `.env.example` to `.env` and adjust values as needed:

| Variable | Default | Description |
|---|---|---|
| HOST | 0.0.0.0 | Bind host |
| PORT | 8000 | Bind port |
| LOG_LEVEL | info | Logging level |

## Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| POST | `/inspect` | Create inspection job (real ONNX/TFLite parsing) |
| POST | `/evaluate` | Create evaluation job (stub) |
| GET | `/jobs/{job_id}` | Get job detail |

## Architecture

```
python-backend/
  app/
    main.py                # FastAPI app entry point
    api/
      routes/
        health.py          # Health check endpoint
        inspect.py         # Inspection job endpoint (async, real parsing)
        evaluate.py        # Evaluation job endpoint (stub)
        jobs.py            # Job detail endpoint
    schemas/
      execution.py         # Pydantic models
    services/
      inspect_service.py   # Inspection service entry point
      evaluate_service.py  # Stub evaluation service
      job_store.py         # In-memory job store
      inspection/
        __init__.py
        inspector.py       # Main inspector (format routing, URL download)
        onnx_inspector.py  # ONNX model parser
        tflite_inspector.py # TFLite model parser
        format_detector.py  # Auto-format detection from bytes
```

## Integration with Next.js

Set `FASTAPI_BASE_URL` in your Next.js `.env.local`:

```
FASTAPI_BASE_URL=http://localhost:8000
```

The Next.js app communicates with this service through `lib/server/fastapi-client.ts`. The orchestrator generates signed download URLs for model files and passes them to FastAPI.