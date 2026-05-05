// LEGACY: not used in the ephemeral flow
import { createServerSupabase } from "@/lib/supabase/server"
import { failureAnalysisSchema, failureSampleSchema } from "@/lib/schemas/failure-analysis"
import type { FailureAnalysis, FailureSample, FailureAnalysisStatus } from "@/lib/schemas/failure-analysis"

export async function getLatestFailureAnalysisByProject(
  projectId: string
): Promise<FailureAnalysis | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("failure_analyses")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return failureAnalysisSchema.parse(data)
}

export async function getFailureAnalysisByEvaluation(
  evaluationId: string
): Promise<FailureAnalysis | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("failure_analyses")
    .select("*")
    .eq("evaluation_id", evaluationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return failureAnalysisSchema.parse(data)
}

export async function createFailureAnalysis(
  projectId: string,
  evaluationId: string,
  modelAssetId?: string | null
): Promise<FailureAnalysis> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("failure_analyses")
    .insert({
      project_id: projectId,
      evaluation_id: evaluationId,
      model_asset_id: modelAssetId ?? null,
      status: "idle",
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return failureAnalysisSchema.parse(data)
}

export async function updateFailureAnalysisStatus(
  analysisId: string,
  status: FailureAnalysisStatus,
  extra?: Record<string, unknown>
): Promise<FailureAnalysis> {
  const supabase = await createServerSupabase()
  const updatePayload: Record<string, unknown> = { status, ...extra }
  const { data, error } = await supabase
    .from("failure_analyses")
    .update(updatePayload)
    .eq("id", analysisId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return failureAnalysisSchema.parse(data)
}

export async function persistFailureAnalysisResults(
  analysisId: string,
  results: {
    totalFailures: number
    topConfusedPairs: Array<{ trueLabel: string; predictedLabel: string; count: number }>
    failureByTrueClass: Array<{ className: string; count: number }>
    failureByPredictedClass: Array<{ className: string; count: number }>
    provenance: string
  }
): Promise<FailureAnalysis> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("failure_analyses")
    .update({
      status: "completed",
      total_failures: results.totalFailures,
      top_confused_pairs: results.topConfusedPairs,
      failure_by_true_class: results.failureByTrueClass,
      failure_by_predicted_class: results.failureByPredictedClass,
      provenance: results.provenance,
    })
    .eq("id", analysisId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return failureAnalysisSchema.parse(data)
}

export async function clearPriorFailureSamples(
  projectId: string,
  evaluationId: string
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from("failure_samples")
    .delete()
    .eq("project_id", projectId)
    .eq("evaluation_id", evaluationId)

  if (error) throw new Error(error.message)
}

export async function clearPriorFailureAnalysis(
  projectId: string,
  evaluationId: string
): Promise<void> {
  const supabase = await createServerSupabase()
  const { error } = await supabase
    .from("failure_analyses")
    .delete()
    .eq("project_id", projectId)
    .eq("evaluation_id", evaluationId)

  if (error) throw new Error(error.message)
}

export async function persistFailureSamples(
  samples: Array<{
    project_id: string
    evaluation_id: string
    model_asset_id?: string | null
    predicted_label: string
    actual_label: string
    confidence: number
    error_type: string
    rank: number
    metadata?: Record<string, unknown>
  }>
): Promise<FailureSample[]> {
  if (samples.length === 0) return []

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("failure_samples")
    .insert(samples)
    .select()

  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => failureSampleSchema.parse(d))
}

export async function getFailureSamplesByProject(
  projectId: string,
  filters?: {
    trueLabel?: string
    predictedLabel?: string
    errorType?: string
    minConfidence?: number
    maxConfidence?: number
    limit?: number
    offset?: number
  }
): Promise<FailureSample[]> {
  const supabase = await createServerSupabase()
  let query = supabase
    .from("failure_samples")
    .select("*")
    .eq("project_id", projectId)
    .order("rank", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false })

  if (filters?.trueLabel) {
    query = query.eq("actual_label", filters.trueLabel)
  }
  if (filters?.predictedLabel) {
    query = query.eq("predicted_label", filters.predictedLabel)
  }
  if (filters?.errorType) {
    query = query.eq("error_type", filters.errorType)
  }
  if (filters?.minConfidence !== undefined) {
    query = query.gte("confidence", filters.minConfidence)
  }
  if (filters?.maxConfidence !== undefined) {
    query = query.lte("confidence", filters.maxConfidence)
  }

  const limit = filters?.limit ?? 50
  const offset = filters?.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => failureSampleSchema.parse(d))
}
