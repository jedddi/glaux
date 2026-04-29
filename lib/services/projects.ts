import { createServerSupabase } from "@/lib/supabase/server"
import { projectSchema, projectFormSchema, projectUpdateSchema, modelAssetSchema } from "@/lib/schemas/project"
import type { Project, ProjectForm, ProjectUpdate, DashboardStats, ModelAsset } from "@/lib/schemas/project"

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
