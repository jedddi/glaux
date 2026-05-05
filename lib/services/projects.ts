// LEGACY: not used in the ephemeral flow
import { createServerSupabase } from "@/lib/supabase/server"
import { projectSchema, projectFormSchema, projectUpdateSchema } from "@/lib/schemas/project-core"
import { modelAssetSchema } from "@/lib/schemas/model"
import type { Project, ProjectForm, ProjectUpdate } from "@/lib/schemas/project-core"
import type { ModelAsset } from "@/lib/schemas/model"
import type { DashboardStats } from "@/lib/schemas/dashboard"

type ToolName = "inspector" | "evaluator" | "failures"

async function getMostRecentProject(options?: {
  requireActiveModel?: boolean
  requireComplete?: boolean
}): Promise<Project | null> {
  const supabase = await createServerSupabase()
  let query = supabase
    .from("projects")
    .select("*")
    .order("last_opened_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)

  if (options?.requireActiveModel) {
    query = query.not("active_model_asset_id", "is", null)
  }

  if (options?.requireComplete) {
    query = query.eq("status", "complete")
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw new Error(error.message)
  return data ? projectSchema.parse(data) : null
}

export async function getProjects(): Promise<Project[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => projectSchema.parse(d))
}

export async function getProject(id: string): Promise<Project | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return projectSchema.parse(data)
}

export async function getProjectWithActiveAsset(id: string): Promise<{ project: Project; asset: ModelAsset | null } | null> {
  const project = await getProject(id)
  if (!project) return null

  if (!project.active_model_asset_id) {
    return { project, asset: null }
  }

  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("model_assets")
    .select("*")
    .eq("id", project.active_model_asset_id)
    .single()

  if (error || !data) {
    return { project, asset: null }
  }

  return { project, asset: modelAssetSchema.parse(data) }
}

export async function createProject(input: ProjectForm): Promise<Project> {
  const validated = projectFormSchema.parse(input)
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("projects")
    .insert(validated)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return projectSchema.parse(data)
}

export async function updateProject(id: string, input: ProjectUpdate): Promise<Project> {
  const validated = projectUpdateSchema.parse(input)
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("projects")
    .update(validated)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return projectSchema.parse(data)
}

export async function deleteProject(id: string): Promise<void> {
  const supabase = await createServerSupabase()

  const { data: assets } = await supabase
    .from("model_assets")
    .select("file_path, storage_bucket")
    .eq("project_id", id)

  if (assets && assets.length > 0) {
    const filePaths = assets.map((a) => a.file_path)
    await supabase.storage.from("models").remove(filePaths)
  }

  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)

  if (error) throw new Error(error.message)
}

export async function getProjectModels(projectId: string): Promise<ModelAsset[]> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("model_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []).map((d) => modelAssetSchema.parse(d))
}

export async function getLatestModelAsset(projectId: string): Promise<ModelAsset | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("model_assets")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw new Error(error.message)
  }
  return modelAssetSchema.parse(data)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createServerSupabase()

  const { count: totalProjects } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })

  const { count: modelsAnalyzed } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "complete")

  const { count: failuresFlagged } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .eq("status", "failed")

  const { data: summaries } = await supabase
    .from("model_summaries")
    .select("top1_accuracy")

  const accuracies = summaries?.filter((s) => s.top1_accuracy != null).map((s) => s.top1_accuracy) ?? []
  const avgAccuracy = accuracies.length > 0
    ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
    : 0

  return {
    total_projects: totalProjects ?? 0,
    models_analyzed: modelsAnalyzed ?? 0,
    failures_flagged: failuresFlagged ?? 0,
    avg_accuracy: Math.round(avgAccuracy * 100) / 100,
  }
}

export async function getDefaultProjectForTool(tool: ToolName): Promise<Project | null> {
  if (tool === "evaluator") {
    // Evaluator should prefer a project that already has a parsed/ready model.
    return (
      (await getMostRecentProject({ requireActiveModel: true, requireComplete: true })) ??
      (await getMostRecentProject({ requireActiveModel: true })) ??
      (await getMostRecentProject())
    )
  }

  if (tool === "failures") {
    // Failures should prefer a project with a completed model (same as evaluator).
    return (
      (await getMostRecentProject({ requireActiveModel: true, requireComplete: true })) ??
      (await getMostRecentProject({ requireActiveModel: true })) ??
      (await getMostRecentProject())
    )
  }

  // Inspector should prefer a project that has a model selected.
  return (
    (await getMostRecentProject({ requireActiveModel: true })) ??
    (await getMostRecentProject())
  )
}

export async function touchProjectLastOpened(projectId: string): Promise<void> {
  await updateProject(projectId, { last_opened_at: new Date().toISOString() })
}
