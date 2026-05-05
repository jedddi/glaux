import {
  sessionInspectResponseSchema,
  sessionGraphResponseSchema,
  sessionEvaluateResponseSchema,
  sessionFailuresResponseSchema,
  sessionUploadResponseSchema,
} from "@/lib/schemas/session"

function unwrapResult<T>(payload: unknown): T {
  if (payload && typeof payload === "object" && "result" in payload) {
    return (payload as { result: T }).result
  }
  return payload as T
}

function mapInspectResponse(raw: Record<string, unknown>): Record<string, unknown> {
  const operators = Array.isArray(raw.operators) ? raw.operators : []
  const architecture = raw.architecture as Record<string, unknown> | null | undefined
  const edgeHints = raw.edge_hints as Record<string, unknown> | null | undefined
  const topOperatorTypes = architecture
    ? (Array.isArray(architecture.top_operator_types)
      ? architecture.top_operator_types
      : (Array.isArray(architecture.topOperatorTypes) ? architecture.topOperatorTypes : []))
    : []

  return {
    format: typeof raw.format === "string" ? raw.format : "unknown",
    fileName: raw.file_name ?? raw.fileName ?? null,
    fileSizeBytes: raw.file_size_bytes ?? raw.fileSizeBytes ?? null,
    inputTensors: raw.input_tensors ?? raw.inputTensors ?? [],
    outputTensors: raw.output_tensors ?? raw.outputTensors ?? [],
    shapeSummaries: raw.shape_summaries ?? raw.shapeSummaries ?? [],
    dtypeSummaries: raw.dtype_summaries ?? raw.dtypeSummaries ?? [],
    parameterCount: raw.parameter_count ?? raw.parameterCount ?? null,
    layerCount: raw.layer_count ?? raw.layerCount ?? null,
    operatorCount: raw.operator_count ?? raw.operatorCount ?? null,
    graphName: raw.graph_name ?? raw.graphName ?? null,
    operators: operators.map((op) => {
      const entry = op as Record<string, unknown>
      return {
        index: entry.index,
        name: entry.name ?? null,
        opType: entry.op_type ?? entry.opType ?? "",
        inputs: entry.inputs ?? [],
        outputs: entry.outputs ?? [],
      }
    }),
    architecture: architecture
      ? {
          graphName: architecture.graph_name ?? architecture.graphName ?? null,
          topOperatorTypes: topOperatorTypes.map((entry) => {
            const item = entry as Record<string, unknown>
            return {
              opType: item.op_type ?? item.opType ?? "UNKNOWN",
              count: item.count ?? 0,
            }
          }),
          raw: architecture.raw,
        }
      : null,
    edgeHints: edgeHints
      ? {
          quantized: edgeHints.quantized ?? null,
          hasMetadata: edgeHints.has_metadata ?? edgeHints.hasMetadata ?? null,
          notes: edgeHints.notes ?? [],
          warnings: edgeHints.warnings ?? [],
        }
      : null,
    tfliteMetadata: raw.tflite_metadata ?? raw.tfliteMetadata ?? null,
    warnings: raw.warnings ?? [],
    summary: typeof raw.summary === "string" ? raw.summary : "",
  }
}

function mapEvaluateResponse(raw: Record<string, unknown>): Record<string, unknown> {
  const perClassMetrics = Array.isArray(raw.per_class_metrics)
    ? raw.per_class_metrics
    : (Array.isArray(raw.perClassMetrics) ? raw.perClassMetrics : [])
  const datasetSummary = (raw.dataset_summary ?? raw.datasetSummary) as Record<string, unknown> | null | undefined

  return {
    accuracy: raw.accuracy,
    precision: raw.precision,
    recall: raw.recall,
    f1Score: raw.f1_score ?? raw.f1Score,
    loss: raw.loss ?? null,
    perClassMetrics: perClassMetrics.map((metric) => {
      const entry = metric as Record<string, unknown>
      return {
        className: entry.class_name ?? entry.className ?? "",
        precision: entry.precision,
        recall: entry.recall,
        f1: entry.f1,
        support: entry.support,
      }
    }),
    confusionMatrix: raw.confusion_matrix ?? raw.confusionMatrix ?? null,
    datasetSummary: datasetSummary
      ? {
          sampleCount: datasetSummary.sample_count ?? datasetSummary.sampleCount ?? 0,
          classCount: datasetSummary.class_count ?? datasetSummary.classCount ?? 0,
          className: datasetSummary.class_name ?? datasetSummary.className ?? null,
        }
      : null,
    warnings: raw.warnings ?? [],
    summary: typeof raw.summary === "string" ? raw.summary : "",
    provenance: typeof raw.provenance === "string" ? raw.provenance : "simulated",
  }
}

export async function createSession(): Promise<string> {
  const response = await fetch("/api/sessions", { method: "POST" })
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Failed to create session")
  }
  const data = await response.json()
  return data.sessionId as string
}

export async function uploadToSession(
  sessionId: string,
  file: File
): Promise<{ sessionId: string; fileName: string; format: string }> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`/api/sessions/${sessionId}/upload`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Failed to upload model")
  }
  const data = await response.json()
  return sessionUploadResponseSchema.parse(data)
}

export async function getSessionInspect(
  sessionId: string
): Promise<ReturnType<typeof sessionInspectResponseSchema.parse>> {
  const response = await fetch(`/api/sessions/${sessionId}/inspect`)
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Failed to fetch inspection results")
  }
  const payload = await response.json()
  const result = unwrapResult<Record<string, unknown>>(payload)
  return sessionInspectResponseSchema.parse(mapInspectResponse(result))
}

export function getSessionModelDownloadUrl(sessionId: string): string {
  return `/api/sessions/${sessionId}/download`
}

export async function getSessionGraph(
  sessionId: string
): Promise<ReturnType<typeof sessionGraphResponseSchema.parse>> {
  const response = await fetch(`/api/sessions/${sessionId}/graph`)
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Failed to fetch model graph")
  }
  const payload = await response.json()
  return sessionGraphResponseSchema.parse(payload)
}

export async function runSessionEvaluate(
  sessionId: string,
  datasetFile?: File
): Promise<ReturnType<typeof sessionEvaluateResponseSchema.parse>> {
  const formData = new FormData()
  if (datasetFile) {
    formData.append("file", datasetFile)
  }

  const response = await fetch(`/api/sessions/${sessionId}/evaluate`, {
    method: "POST",
    body: formData,
  })
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Failed to run evaluation")
  }
  const payload = await response.json()
  const result = unwrapResult<Record<string, unknown>>(payload)
  return sessionEvaluateResponseSchema.parse(mapEvaluateResponse(result))
}

export async function getSessionEvaluate(
  sessionId: string
): Promise<ReturnType<typeof sessionEvaluateResponseSchema.parse> | null> {
  const response = await fetch(`/api/sessions/${sessionId}/evaluate`)
  if (response.status === 404) return null
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Failed to fetch evaluation results")
  }
  const payload = await response.json()
  const result = unwrapResult<Record<string, unknown>>(payload)
  return sessionEvaluateResponseSchema.parse(mapEvaluateResponse(result))
}

export async function getSessionFailures(
  sessionId: string
): Promise<ReturnType<typeof sessionFailuresResponseSchema.parse> | null> {
  const response = await fetch(`/api/sessions/${sessionId}/failures`)
  if (response.status === 404) return null
  if (!response.ok) {
    const err = await response.json().catch(() => null)
    throw new Error(err?.error?.message ?? "Failed to fetch failure results")
  }
  const payload = await response.json()
  const result = unwrapResult<Record<string, unknown>>(payload)
  return sessionFailuresResponseSchema.parse(result)
}
