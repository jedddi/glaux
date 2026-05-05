import { NextResponse } from "next/server"

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL ?? "http://localhost:8000"
const DEFAULT_TIMEOUT_MS = 120_000
const parsedTimeout = Number(process.env.FASTAPI_REQUEST_TIMEOUT_MS)
const TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0
  ? parsedTimeout
  : DEFAULT_TIMEOUT_MS

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/sessions/${sessionId}/download`, {
      method: "GET",
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => null)
      return NextResponse.json(
        { error: { message: err?.detail ?? "Failed to download model" } },
        { status: response.status }
      )
    }

    const headers = new Headers()
    const contentType = response.headers.get("content-type")
    const contentLength = response.headers.get("content-length")
    const contentDisposition = response.headers.get("content-disposition")
    if (contentType) headers.set("content-type", contentType)
    if (contentLength) headers.set("content-length", contentLength)
    if (contentDisposition) headers.set("content-disposition", contentDisposition)

    return new Response(response.body, {
      status: 200,
      headers,
    })
  } catch (err) {
    const message = err instanceof Error && err.name === "AbortError"
      ? `Request timed out after ${TIMEOUT_MS / 1000}s`
      : "Failed to connect to FastAPI"
    return NextResponse.json(
      { error: { message } },
      { status: 502 }
    )
  } finally {
    clearTimeout(timeout)
  }
}
