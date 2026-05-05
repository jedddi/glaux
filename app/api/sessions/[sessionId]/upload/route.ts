import { NextRequest, NextResponse } from "next/server"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000"
const DEFAULT_TIMEOUT_MS = 120_000
const parsedTimeout = Number(process.env.FASTAPI_REQUEST_TIMEOUT_MS)
const TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : DEFAULT_TIMEOUT_MS

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params
  const formData = await request.formData()

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/sessions/${sessionId}/upload`, {
      method: "POST",
      body: formData,
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      return NextResponse.json(
        { error: { message: err?.detail ?? "Upload to FastAPI failed" } },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? `Upload timed out after ${TIMEOUT_MS / 1000}s`
      : "Failed to connect to FastAPI"
    return NextResponse.json(
      { error: { message } },
      { status: 502 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
