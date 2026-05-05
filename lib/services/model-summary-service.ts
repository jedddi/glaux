// LEGACY: not used in the ephemeral flow
import { createServerSupabase } from "@/lib/supabase/server"
import { modelSummarySchema } from "@/lib/schemas/model"
import type { ModelSummary, ParsedModelResult } from "@/lib/schemas/model"

export async function getModelSummaryByProject(projectId: string): Promise<ModelSummary | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("model_summaries")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return modelSummarySchema.parse(data)
}

export async function upsertModelSummary(
  projectId: string,
  modelAssetId: string,
  parsed: ParsedModelResult
): Promise<ModelSummary> {
  const supabase = await createServerSupabase()

  const payload = {
    project_id: projectId,
    model_asset_id: modelAssetId,
    layer_count: parsed.layerCount,
    operator_count: parsed.operatorCount,
    input_shapes: parsed.inputs.map((i) => i.shape),
    output_shapes: parsed.outputs.map((o) => o.shape),
    inputs_json: parsed.inputs,
    outputs_json: parsed.outputs,
    operators_json: parsed.operators,
    architecture_json: parsed.architecture,
    tflite_metadata_json: parsed.tfliteMetadata ?? null,
    edge_hints_json: parsed.edgeHints ?? null,
    summary_json: parsed,
  }

  // Try to update existing summary first
  const { data: existing } = await supabase
    .from("model_summaries")
    .select("id")
    .eq("project_id", projectId)
    .eq("model_asset_id", modelAssetId)
    .maybeSingle()

  if (existing) {
    const { data, error } = await supabase
      .from("model_summaries")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single()

    if (error) throw new Error(error.message)
    return modelSummarySchema.parse(data)
  }

  const { data, error } = await supabase
    .from("model_summaries")
    .insert(payload)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return modelSummarySchema.parse(data)
}
