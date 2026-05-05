// LEGACY: not used in the ephemeral flow
import {
  createExecutionJob,
  updateExecutionJobStatus,
} from "@/lib/services/execution-service"
import { logActivity } from "@/lib/services/activity-service"
import { fastapiPost, fastapiGet } from "@/lib/server/fastapi-client"
import { assertValidTransition } from "@/lib/lifecycle/status"
import { createServerSupabase } from "@/lib/supabase/server"
import { upsertModelSummary } from "@/lib/services/model-summary-service"
import type {
  ExecutionJobKind,
  ExecutionJobSummary,
  InspectionRequest,
  EvaluationRequest,
  InspectionResult,
} from "@/lib/schemas/execution"
import type { ParsedModelResult } from "@/lib/schemas/model"

export type RunExecutionJobResult = {
  jobId: string
  kind: ExecutionJobKind
  status: ExecutionJobSummary["status"]
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function convertKeysToCamel(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(convertKeysToCamel)
  }
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj as Record<string, unknown>).map(([key, value]) => [
        snakeToCamel(key),
        convertKeysToCamel(value),
      ])
    )
  }
  return obj
}

async function callFastAPIAndPersist(
  job: ExecutionJobSummary,
  endpoint: string,
  payload: Record<string, unknown>
): Promise<Record<string, unknown>> {
  assertValidTransition("queued", "running", "execution-job")

  await updateExecutionJobStatus(job.id, "running", {
    started_at: new Date().toISOString(),
    progress_message: "Executing on FastAPI service",
  })

  try {
    const response = await fastapiPost<Record<string, unknown>>(endpoint, payload)
    // FastAPI returns { job: { ... , inspection_result: ..., evaluation_result: ... } }
    const jobData = (response.job as Record<string, unknown>) ?? response
    // Convert snake_case keys to camelCase for TypeScript schemas
    return convertKeysToCamel(jobData) as Record<string, unknown>
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "FastAPI execution failed"
    await updateExecutionJobStatus(job.id, "failed", {
      error_code: "FASTAPI_EXECUTION_ERROR",
      error_message: message,
      completed_at: new Date().toISOString(),
    })
    throw error
  }
}

async function createModelDownloadUrl(
  projectId: string,
  modelAssetId: string | null | undefined
): Promise<string | null> {
  if (!modelAssetId) return null

  const supabase = await createServerSupabase()
  const { data: asset, error } = await supabase
    .from("model_assets")
    .select("storage_bucket, file_path")
    .eq("id", modelAssetId)
    .single()

  if (error || !asset) return null

  const { data: signedUrlData, error: urlError } = await supabase.storage
    .from(asset.storage_bucket)
    .createSignedUrl(asset.file_path, 120)

  if (urlError || !signedUrlData) return null
  return signedUrlData.signedUrl
}

function inspectionResultToParsedModel(
  result: InspectionResult
): ParsedModelResult {
  const fmt = result.format === "onnx" || result.format === "tflite"
    ? result.format
    : "onnx"

  return {
    format: fmt as "onnx" | "tflite",
    fileSizeBytes: result.fileSizeBytes ?? null,
    layerCount: result.layerCount ?? null,
    operatorCount: result.operatorCount ?? null,
    inputs: (result.inputTensors ?? []).map((t) => ({
      name: t.name,
      dtype: t.dtype ?? null,
      shape: t.shape,
    })),
    outputs: (result.outputTensors ?? []).map((t) => ({
      name: t.name,
      dtype: t.dtype ?? null,
      shape: t.shape,
    })),
    operators: (result.operators ?? []).map((op) => ({
      index: op.index,
      name: op.name ?? null,
      opType: op.opType,
      inputs: op.inputs ?? [],
      outputs: op.outputs ?? [],
    })),
    architecture: {
      graphName: result.architecture?.graphName ?? null,
      topOperatorTypes: result.architecture?.topOperatorTypes ?? [],
    },
    tfliteMetadata: result.tfliteMetadata ?? null,
    edgeHints: result.edgeHints
      ? {
          quantized: result.edgeHints.quantized ?? null,
          hasMetadata: result.edgeHints.hasMetadata ?? null,
          notes: result.edgeHints.notes ?? [],
          warnings: result.edgeHints.warnings ?? [],
        }
      : null,
  }
}

export async function runInspectionJob(
  projectId: string,
  request: InspectionRequest
): Promise<RunExecutionJobResult> {
  const job = await createExecutionJob({
    kind: "inspection",
    projectId,
    requestPayload: request as Record<string, unknown>,
  })

  await logActivity(projectId, "inspection_job_started", {
    job_id: job.id,
    model_asset_id: request.modelAssetId,
  }).catch(() => {})

  let downloadUrl: string | null = null
  try {
    downloadUrl = await createModelDownloadUrl(projectId, request.modelAssetId)
  } catch {
    // Download URL generation failed - FastAPI will handle the error
  }

  try {
    const jobData = await callFastAPIAndPersist(job, "/inspect", {
      project_id: request.projectId,
      model_asset_id: request.modelAssetId ?? null,
      model_format: request.modelFormat ?? null,
      file_name: request.fileName ?? null,
      model_download_url: downloadUrl,
    })

    // `callFastAPIAndPersist` already camel-cases keys.
    const inspectionResult = jobData.inspectionResult ?? jobData.resultSummary
    const successPayload: Record<string, unknown> = {
      progress_message: "Inspection completed",
      completed_at: new Date().toISOString(),
    }
    if (inspectionResult && typeof inspectionResult === "object") {
      successPayload.result_summary = inspectionResult
    }
    await updateExecutionJobStatus(job.id, "succeeded", successPayload)

    if (
      inspectionResult &&
      typeof inspectionResult === "object" &&
      request.modelAssetId
    ) {
      try {
        const parsed = inspectionResultToParsedModel(
          inspectionResult as InspectionResult
        )
        await upsertModelSummary(projectId, request.modelAssetId, parsed)
      } catch {
        // Model summary update is best-effort; don't fail the job
      }
    }

    await logActivity(projectId, "inspection_job_completed", {
      job_id: job.id,
    }).catch(() => {})

    return {
      jobId: job.id,
      kind: "inspection",
      status: "succeeded",
    }
  } catch (error) {
    await logActivity(projectId, "inspection_job_failed", {
      job_id: job.id,
      error: error instanceof Error ? error.message : "Unknown error",
    }).catch(() => {})
    throw error
  }
}

export async function runEvaluationJob(
  projectId: string,
  request: EvaluationRequest
): Promise<RunExecutionJobResult> {
  const job = await createExecutionJob({
    kind: "evaluation",
    projectId,
    requestPayload: request as Record<string, unknown>,
  })

  await logActivity(projectId, "evaluation_job_started", {
    job_id: job.id,
    model_asset_id: request.modelAssetId,
    dataset_name: request.datasetName,
  }).catch(() => {})

  try {
    const jobData = await callFastAPIAndPersist(job, "/evaluate", {
      project_id: request.projectId,
      model_asset_id: request.modelAssetId ?? null,
      dataset_name: request.datasetName ?? null,
      dataset_size: request.datasetSize ?? null,
    })

    // `callFastAPIAndPersist` already camel-cases keys.
    const evaluationResult = jobData.evaluationResult ?? jobData.resultSummary
    const successPayload: Record<string, unknown> = {
      progress_message: "Evaluation completed",
      completed_at: new Date().toISOString(),
    }
    if (evaluationResult && typeof evaluationResult === "object") {
      successPayload.result_summary = evaluationResult
    }
    await updateExecutionJobStatus(job.id, "succeeded", successPayload)

    await logActivity(projectId, "evaluation_job_completed", {
      job_id: job.id,
    }).catch(() => {})

    return {
      jobId: job.id,
      kind: "evaluation",
      status: "succeeded",
    }
  } catch (error) {
    await logActivity(projectId, "evaluation_job_failed", {
      job_id: job.id,
      error: error instanceof Error ? error.message : "Unknown error",
    }).catch(() => {})
    throw error
  }
}

export async function syncJobStatusFromFastAPI(jobId: string): Promise<void> {
  try {
    const fastapiJob = await fastapiGet<Record<string, unknown>>(`/jobs/${jobId}`)
    const jobData = (fastapiJob.job as Record<string, unknown>) ?? fastapiJob
    const fastapiStatus = jobData.status as string | undefined

    if (!fastapiStatus) return

    const statusMap: Record<string, string> = {
      queued: "queued",
      running: "running",
      succeeded: "succeeded",
      failed: "failed",
    }

    const mappedStatus = statusMap[fastapiStatus]
    if (!mappedStatus) return

    const extra: Record<string, unknown> = {}
    if (jobData.inspection_result || jobData.evaluation_result) {
      const resultKey = jobData.inspection_result ? "inspection_result" : "evaluation_result"
      extra.result_summary = convertKeysToCamel(jobData[resultKey])
    }
    if (jobData.error_message) {
      extra.error_message = jobData.error_message
    }
    if (jobData.error_code) {
      extra.error_code = jobData.error_code
    }

    await updateExecutionJobStatus(jobId, mappedStatus as never, extra)
  } catch {
    // If FastAPI is unavailable, don't update the local job status
  }
}
