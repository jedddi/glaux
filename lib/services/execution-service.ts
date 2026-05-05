// LEGACY: not used in the ephemeral flow
import { createServerSupabase } from "@/lib/supabase/server"
import {
  executionJobSummarySchema,
  executionJobDetailSchema,
  inspectionStubResultSchema,
  evaluationStubResultSchema,
} from "@/lib/schemas/execution"
import type {
  ExecutionJobSummary,
  ExecutionJobDetail,
  ExecutionJobKind,
} from "@/lib/schemas/execution"

export async function createExecutionJob(
  input: {
    kind: ExecutionJobKind
    projectId: string
    fastapiJobId?: string
    requestPayload?: Record<string, unknown>
  }
): Promise<ExecutionJobSummary> {
  const supabase = await createServerSupabase()
  const payload = {
    kind: input.kind,
    project_id: input.projectId,
    status: "queued" as const,
    fastapi_job_id: input.fastapiJobId ?? null,
    request_payload: input.requestPayload ?? null,
  }

  const { data, error } = await supabase
    .from("execution_jobs")
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return executionJobSummarySchema.parse(mapDbToSummary(data))
}

export async function updateExecutionJobStatus(
  jobId: string,
  status: ExecutionJobSummary["status"],
  extra?: Record<string, unknown>
): Promise<ExecutionJobSummary> {
  const supabase = await createServerSupabase()
  const updatePayload: Record<string, unknown> = { status, ...extra }

  if (status === "running" && !updatePayload.started_at) {
    updatePayload.started_at = new Date().toISOString()
  }
  if ((status === "succeeded" || status === "failed") && !updatePayload.completed_at) {
    updatePayload.completed_at = new Date().toISOString()
  }

  const { data, error } = await supabase
    .from("execution_jobs")
    .update(updatePayload)
    .eq("id", jobId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return executionJobSummarySchema.parse(mapDbToSummary(data))
}

export async function getExecutionJobById(
  jobId: string
): Promise<ExecutionJobDetail | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("execution_jobs")
    .select("*")
    .eq("id", jobId)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }

  return executionJobDetailSchema.parse(mapDbToDetail(data))
}

export async function getLatestExecutionJobByProject(
  projectId: string,
  kind?: ExecutionJobKind
): Promise<ExecutionJobSummary | null> {
  const supabase = await createServerSupabase()
  let query = supabase
    .from("execution_jobs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)

  if (kind) {
    query = query.eq("kind", kind)
  }

  const { data, error } = await query.single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }

  return executionJobSummarySchema.parse(mapDbToSummary(data))
}

function mapDbToSummary(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    projectId: row.project_id,
    initiatedBy: row.initiated_by ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at ?? null,
    completedAt: row.completed_at ?? null,
    progressMessage: row.progress_message ?? null,
    errorCode: row.error_code ?? null,
    errorMessage: row.error_message ?? null,
  }
}

function mapDbToDetail(row: Record<string, unknown>): Record<string, unknown> {
  const summary = mapDbToSummary(row)
  const resultSummary = (row.result_summary as Record<string, unknown> | null) ?? null
  const inspectionParsed = inspectionStubResultSchema.safeParse(resultSummary)
  const evaluationParsed = evaluationStubResultSchema.safeParse(resultSummary)

  if (!inspectionParsed.success && row.kind === "inspection" && resultSummary) {
    console.warn(
      "[execution-service] Failed to parse inspection result:",
      inspectionParsed.error.message
    )
  }

  return {
    ...summary,
    requestPayload: row.request_payload ?? null,
    resultSummary,
    artifacts: row.artifacts ?? null,
    inspectionResult: row.kind === "inspection" ? (inspectionParsed.success ? inspectionParsed.data : null) : null,
    evaluationResult: row.kind === "evaluation" ? (evaluationParsed.success ? evaluationParsed.data : null) : null,
  }
}
