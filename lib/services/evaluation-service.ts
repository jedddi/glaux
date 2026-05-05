// LEGACY: not used in the ephemeral flow
import { createServerSupabase } from "@/lib/supabase/server"
import { evaluationSchema } from "@/lib/schemas/evaluation"
import type { Evaluation, EvaluationStatus } from "@/lib/schemas/evaluation"

export async function getLatestEvaluationByProject(projectId: string): Promise<Evaluation | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return evaluationSchema.parse(data)
}

export async function listEvaluationsByProject(projectId: string): Promise<Evaluation[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("evaluations")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => evaluationSchema.parse(d))
}

export async function createEvaluationRun(
  projectId: string,
  input: {
    modelAssetId?: string
    datasetName?: string
    datasetSource?: Record<string, unknown>
  }
): Promise<Evaluation> {
  const supabase = await createServerSupabase()
  const payload = {
    project_id: projectId,
    model_asset_id: input.modelAssetId ?? null,
    dataset_name: input.datasetName ?? null,
    dataset_source: input.datasetSource ?? { type: "upload" },
    status: "idle",
  }
  const { data, error } = await supabase
    .from("evaluations")
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return evaluationSchema.parse(data)
}

export async function updateEvaluationStatus(
  evaluationId: string,
  status: EvaluationStatus,
  extra?: Record<string, unknown>
): Promise<Evaluation> {
  const supabase = await createServerSupabase()
  const updatePayload: Record<string, unknown> = { status, ...extra }
  const { data, error } = await supabase
    .from("evaluations")
    .update(updatePayload)
    .eq("id", evaluationId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return evaluationSchema.parse(data)
}

export async function persistEvaluationResults(
  evaluationId: string,
  results: {
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    loss: number | null
    sampleCount: number
    classCount: number
    confusionMatrix: Record<string, unknown> | null
    perClassMetrics: Record<string, unknown>[] | null
    isSimulated: boolean
  }
): Promise<Evaluation> {
  const supabase = await createServerSupabase()
  const notes = results.isSimulated ? "simulated" : null
  const updatePayload = {
    status: "completed",
    accuracy: results.accuracy,
    precision: results.precision,
    recall: results.recall,
    f1_score: results.f1Score,
    loss: results.loss,
    sample_count: results.sampleCount,
    class_count: results.classCount,
    confusion_matrix: results.confusionMatrix,
    per_class_metrics: results.perClassMetrics,
    notes,
    completed_at: new Date().toISOString(),
  }
  const { data, error } = await supabase
    .from("evaluations")
    .update(updatePayload)
    .eq("id", evaluationId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return evaluationSchema.parse(data)
}

export async function attachEvaluationDataset(
  evaluationId: string,
  dataset: {
    name: string
    source?: Record<string, unknown>
    filePath?: string
    size?: number
  }
): Promise<Evaluation> {
  const supabase = await createServerSupabase()
  const updatePayload = {
    dataset_name: dataset.name,
    dataset_source: dataset.source ?? { type: "upload" },
    dataset_file_path: dataset.filePath ?? null,
    dataset_size: dataset.size ?? null,
  }
  const { data, error } = await supabase
    .from("evaluations")
    .update(updatePayload)
    .eq("id", evaluationId)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return evaluationSchema.parse(data)
}