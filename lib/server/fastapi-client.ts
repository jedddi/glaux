const FASTAPI_BASE_URL =
  process.env.FASTAPI_BASE_URL ?? "http://localhost:8000"

const DEFAULT_REQUEST_TIMEOUT_MS = 120_000
const parsedTimeout = Number(process.env.FASTAPI_REQUEST_TIMEOUT_MS)
const REQUEST_TIMEOUT_MS =
  Number.isFinite(parsedTimeout) && parsedTimeout > 0
    ? parsedTimeout
    : DEFAULT_REQUEST_TIMEOUT_MS

export class FastAPIConnectionError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message)
    this.name = "FastAPIConnectionError"
  }
}

export class FastAPIResponseError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message)
    this.name = "FastAPIResponseError"
  }
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new FastAPIConnectionError(
        `Request to FastAPI timed out after ${timeoutMs}ms: ${url}`
      )
    }
    throw new FastAPIConnectionError(
      `Failed to connect to FastAPI at ${url}`,
      error
    )
  } finally {
    clearTimeout(timeout)
  }
}

async function parseFastAPIResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorBody: Record<string, unknown> | null = null
    try {
      errorBody = await response.json()
    } catch {
      // ignore
    }

    const code =
      typeof errorBody?.code === "string" ? errorBody.code : undefined
    const message =
      typeof errorBody?.message === "string"
        ? errorBody.message
        : `FastAPI returned ${response.status}`
    const details =
      errorBody?.details && typeof errorBody.details === "object"
        ? (errorBody.details as Record<string, unknown>)
        : undefined

    throw new FastAPIResponseError(message, response.status, code, details)
  }

  return response.json() as Promise<T>
}

export async function fastapiGet<T>(path: string): Promise<T> {
  const url = `${FASTAPI_BASE_URL}${path}`
  const response = await fetchWithTimeout(url, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })
  return parseFastAPIResponse<T>(response)
}

export async function fastapiPost<T>(
  path: string,
  body: Record<string, unknown>
): Promise<T> {
  const url = `${FASTAPI_BASE_URL}${path}`
  const response = await fetchWithTimeout(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  return parseFastAPIResponse<T>(response)
}

export function getFastAPIBaseURL(): string {
  return FASTAPI_BASE_URL
}

export async function fastapiUpload<T>(
  path: string,
  file: File,
  fields?: Record<string, string>
): Promise<T> {
  const url = `${FASTAPI_BASE_URL}${path}`
  const formData = new FormData()
  formData.append("file", file)
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      formData.append(key, value)
    }
  }

  const response = await fetchWithTimeout(url, {
    method: "POST",
    body: formData,
  })
  return parseFastAPIResponse<T>(response)
}
