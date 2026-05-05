// LEGACY: not used in the ephemeral flow
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { EvaluationSummaryResponse } from "@/lib/schemas/evaluation"
import { isActive } from "@/lib/lifecycle/status"

async function fetchEvaluatorSummary(projectId: string): Promise<EvaluationSummaryResponse> {
  const res = await fetch(`/api/projects/${projectId}/evaluations/latest`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch evaluator summary")
  }
  return res.json()
}

async function fetchProjectEvaluations(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/evaluations`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch evaluations")
  }
  return res.json()
}

async function createEvaluationApi(projectId: string, input: { modelAssetId?: string; datasetName?: string }) {
  const res = await fetch(`/api/projects/${projectId}/evaluations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to create evaluation")
  }
  return res.json()
}

async function runEvaluationApi(projectId: string, evaluationId: string) {
  const res = await fetch(`/api/projects/${projectId}/evaluations/${evaluationId}/run`, {
    method: "POST",
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to run evaluation")
  }
  return res.json()
}

async function uploadEvaluationDatasetApi(
  projectId: string,
  data: { name: string; file?: File }
) {
  const formData = new FormData()
  formData.append("name", data.name)
  if (data.file) {
    formData.append("file", data.file)
  }
  const res = await fetch(`/api/projects/${projectId}/evaluation-dataset`, {
    method: "POST",
    body: formData,
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to upload dataset")
  }
  return res.json()
}

export const evaluatorKeys = {
  all: (projectId: string) => ["evaluations", projectId] as const,
  summary: (projectId: string) => [...evaluatorKeys.all(projectId), "summary"] as const,
  list: (projectId: string) => [...evaluatorKeys.all(projectId), "list"] as const,
}

export function useEvaluatorSummary(projectId: string | null) {
  return useQuery({
    queryKey: evaluatorKeys.summary(projectId ?? ""),
    queryFn: () => fetchEvaluatorSummary(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data as EvaluationSummaryResponse | undefined
      if (data?.evaluation?.status && isActive(data.evaluation.status)) {
        return 3000
      }
      return false
    },
  })
}

export function useProjectEvaluations(projectId: string | null) {
  return useQuery({
    queryKey: evaluatorKeys.list(projectId ?? ""),
    queryFn: () => fetchProjectEvaluations(projectId!),
    enabled: !!projectId,
  })
}

export function useCreateEvaluation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: { modelAssetId?: string; datasetName?: string }) =>
      createEvaluationApi(projectId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluatorKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

export function useRunEvaluation(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (evaluationId: string) => runEvaluationApi(projectId, evaluationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluatorKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}

export function useUploadEvaluationDataset(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; file?: File }) =>
      uploadEvaluationDatasetApi(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluatorKeys.all(projectId) })
    },
  })
}
