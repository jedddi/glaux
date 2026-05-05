import { NextRequest, NextResponse } from "next/server"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000"
const DEFAULT_TIMEOUT_MS = 120_000
const parsedTimeout = Number(process.env.FASTAPI_REQUEST_TIMEOUT_MS)
const TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : DEFAULT_TIMEOUT_MS

async function proxyFetch(path: string, init?: RequestInit) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`Request timed out after ${TIMEOUT_MS / 1000}s`)
    }
    throw new Error("Failed to connect to FastAPI")
  } finally {
    clearTimeout(timeout)
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  try {
    const response = await proxyFetch(`/sessions/${sessionId}/evaluate`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (response.status === 404) {
      return NextResponse.json({ error: { message: "No evaluation results" } }, { status: 404 })
    }

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      return NextResponse.json(
        { error: { message: err?.detail ?? "Failed to fetch evaluation" } },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "Failed to connect to FastAPI" } },
      { status: 502 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const formData = await request.formData()

  try {
    const response = await proxyFetch(`/sessions/${sessionId}/evaluate`, {
      method: "POST",
      body: formData,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      return NextResponse.json(
        { error: { message: err?.detail ?? "Evaluation failed" } },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    return NextResponse.json(
      { error: { message: err instanceof Error ? err.message : "Failed to connect to FastAPI" } },
      { status: 502 }
    )
  }
}
