"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  DashboardStats,
  ModelAsset,
  Project,
  ProjectForm,
  ProjectUpdate,
} from "@/lib/schemas/project"

type UploadModelInput = {
  projectId: string
  file: File
  signal?: AbortSignal
}

type UploadModelResponse = {
  asset: ModelAsset
  project: Project
  path: string
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects")
  if (!res.ok) throw new Error("Failed to fetch projects")
  return res.json()
}

async function fetchProjectModels(projectId: string): Promise<ModelAsset[]> {
  const res = await fetch(`/api/projects/${projectId}/models`)
  if (!res.ok) throw new Error("Failed to fetch models")
  return res.json()
}

async function fetchDashboardStats(): Promise<DashboardStats> {
  const res = await fetch("/api/stats")
  if (!res.ok) throw new Error("Failed to fetch stats")
  return res.json()
}

async function createProjectApi(input: ProjectForm): Promise<Project> {
  const res = await fetch("/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? "Failed to create project")
  }
  return res.json()
}

async function updateProjectApi(id: string, input: ProjectUpdate): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? "Failed to update project")
  }
  return res.json()
}

async function deleteProjectApi(id: string): Promise<void> {
  const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? "Failed to delete project")
  }
}

async function uploadModelApi(input: UploadModelInput): Promise<UploadModelResponse> {
  const formData = new FormData()
  formData.append("project_id", input.projectId)
  formData.append("file", input.file)

  const controller = input.signal ? null : new AbortController()
  const signal = input.signal ?? controller?.signal
  const timeoutId = controller ? setTimeout(() => controller.abort(), 2 * 60 * 1000) : null

  let res: Response
  try {
    res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
      signal,
    })
  } catch (error) {
    if (timeoutId) clearTimeout(timeoutId)
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Upload cancelled (or timed out).")
    }
    throw error
  }

  if (timeoutId) clearTimeout(timeoutId)

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? "Failed to upload model")
  }

  return res.json()
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  })
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: fetchDashboardStats,
    staleTime: 60 * 1000,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

export function useUploadModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: uploadModelApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project", data.project.id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; input: ProjectUpdate }) =>
      updateProjectApi(data.id, data.input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["project", variables.id] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProjectApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
    },
  })
}

export function useProjectModels(projectId: string | null) {
  return useQuery({
    queryKey: ["project-models", projectId],
    queryFn: () => fetchProjectModels(projectId!),
    enabled: !!projectId,
  })
}
