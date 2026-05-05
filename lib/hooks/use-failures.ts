// LEGACY: not used in the ephemeral flow
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { FailureSummaryResponse } from "@/lib/schemas/failure-analysis"
import { isActive } from "@/lib/lifecycle/status"

async function fetchFailureSummary(projectId: string): Promise<FailureSummaryResponse> {
  const res = await fetch(`/api/projects/${projectId}/failures`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch failure summary")
  }
  return res.json()
}

async function fetchFailureSummaryOnly(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/failures/summary`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch failure summary")
  }
  return res.json()
}

async function fetchFailureSamples(
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
) {
  const params = new URLSearchParams()
  if (filters?.trueLabel) params.set("trueLabel", filters.trueLabel)
  if (filters?.predictedLabel) params.set("predictedLabel", filters.predictedLabel)
  if (filters?.errorType) params.set("errorType", filters.errorType)
  if (filters?.minConfidence !== undefined) params.set("minConfidence", String(filters.minConfidence))
  if (filters?.maxConfidence !== undefined) params.set("maxConfidence", String(filters.maxConfidence))
  if (filters?.limit !== undefined) params.set("limit", String(filters.limit))
  if (filters?.offset !== undefined) params.set("offset", String(filters.offset))

  const qs = params.toString()
  const url = `/api/projects/${projectId}/failures/samples${qs ? `?${qs}` : ""}`
  const res = await fetch(url)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch failure samples")
  }
  return res.json()
}

async function triggerFailureAnalysis(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/failures/analyze`, {
    method: "POST",
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to run failure analysis")
  }
  return res.json()
}

export const failureKeys = {
  all: (projectId: string) => ["failures", projectId] as const,
  summary: (projectId: string) => [...failureKeys.all(projectId), "summary"] as const,
  summaryOnly: (projectId: string) => [...failureKeys.all(projectId), "summary-only"] as const,
  samples: (projectId: string, filters?: Record<string, unknown>) =>
    [...failureKeys.all(projectId), "samples", filters] as const,
}

export function useFailureSummary(projectId: string | null) {
  return useQuery({
    queryKey: failureKeys.summary(projectId ?? ""),
    queryFn: () => fetchFailureSummary(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data as FailureSummaryResponse | undefined
      if (data?.analysis?.status && isActive(data.analysis.status)) {
        return 3000
      }
      return false
    },
  })
}

export function useFailureSummaryOnly(projectId: string | null) {
  return useQuery({
    queryKey: failureKeys.summaryOnly(projectId ?? ""),
    queryFn: () => fetchFailureSummaryOnly(projectId!),
    enabled: !!projectId,
  })
}

export function useFailureSamples(
  projectId: string | null,
  filters?: {
    trueLabel?: string
    predictedLabel?: string
    errorType?: string
    minConfidence?: number
    maxConfidence?: number
    limit?: number
    offset?: number
  }
) {
  return useQuery({
    queryKey: failureKeys.samples(projectId ?? "", filters as Record<string, unknown>),
    queryFn: () => fetchFailureSamples(projectId!, filters),
    enabled: !!projectId,
  })
}

export function useAnalyzeFailures(projectId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => triggerFailureAnalysis(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: failureKeys.all(projectId) })
      queryClient.invalidateQueries({ queryKey: ["project", projectId] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
