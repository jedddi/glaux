import { assertValidTransition } from "@/lib/lifecycle/status"
import { fastapiUpload, fastapiGet } from "@/lib/server/fastapi-client"
import type { SessionStatus } from "@/lib/schemas/session"

interface SessionLifecycle {
  status: SessionStatus
  setStatus: (s: SessionStatus) => void
}

export async function uploadAndInspect(
  sessionId: string,
  file: File,
  lifecycle: SessionLifecycle
): Promise<unknown> {
  assertValidTransition(lifecycle.status, "uploading", "session")
  lifecycle.setStatus("uploading")

  try {
    await fastapiUpload<{ ok: boolean }>(
      `/sessions/${sessionId}/upload`,
      file,
      { session_id: sessionId }
    )

    assertValidTransition("uploading", "analyzing", "session")
    lifecycle.setStatus("analyzing")

    const result = await fastapiGet<{ result: unknown }>(
      `/sessions/${sessionId}/inspect`
    )

    assertValidTransition("analyzing", "ready", "session")
    lifecycle.setStatus("ready")

    return result.result
  } catch (error) {
    try {
      assertValidTransition(lifecycle.status, "error", "session")
    } catch {
      // ignore if transition is invalid
    }
    lifecycle.setStatus("error")
    throw error
  }
}

export async function evaluateSession(
  sessionId: string,
  datasetFile?: File
): Promise<unknown> {
  const formData = new FormData()
  if (datasetFile) {
    formData.append("file", datasetFile)
  }

  const result = await fastapiUpload<{ result: unknown }>(
    `/sessions/${sessionId}/evaluate`,
    datasetFile ?? new File([], "empty"),
    { session_id: sessionId, has_dataset: datasetFile ? "true" : "false" }
  )

  return result.result
}
