// LEGACY: not used in the ephemeral flow
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type { InspectorSummaryResponse } from "@/lib/schemas/model"

async function fetchInspectorSummary(projectId: string): Promise<InspectorSummaryResponse> {
  const res = await fetch(`/api/projects/${projectId}/summary`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch summary")
  }
  return res.json()
}

async function fetchProjectStatus(projectId: string) {
  const res = await fetch(`/api/projects/${projectId}/status`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch status")
  }
  return res.json()
}

async function triggerParse(projectId: string): Promise<{
  projectId: string
  assetId: string
  parseStatus: string
  summary: Record<string, unknown>
}> {
  const res = await fetch(`/api/projects/${projectId}/parse`, { method: "POST" })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to parse model")
  }
  return res.json()
}

export function useInspectorSummary(projectId: string | null) {
  return useQuery({
    queryKey: ["inspector-summary", projectId],
    queryFn: () => fetchInspectorSummary(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data as InspectorSummaryResponse | undefined
      if (data?.project?.status === "analyzing" || data?.asset?.parseStatus === "processing") {
        return 3000
      }
      return false
    },
  })
}

export function useProjectStatus(projectId: string | null) {
  return useQuery({
    queryKey: ["project-status", projectId],
    queryFn: () => fetchProjectStatus(projectId!),
    enabled: !!projectId,
    refetchInterval: (query) => {
      const data = query.state.data as { status: string; asset?: { parseStatus: string } } | undefined
      if (data?.status === "analyzing" || data?.asset?.parseStatus === "processing") {
        return 3000
      }
      return false
    },
  })
}

export function useParseModel() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: triggerParse,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["inspector-summary", variables] })
      queryClient.invalidateQueries({ queryKey: ["project-status", variables] })
      queryClient.invalidateQueries({ queryKey: ["project", variables] })
      queryClient.invalidateQueries({ queryKey: ["projects"] })
    },
  })
}
