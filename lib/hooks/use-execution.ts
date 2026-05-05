// LEGACY: not used in the ephemeral flow
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import type {
  ExecutionJobDetail,
  ExecutionJobSummary,
  InspectionRequest,
  EvaluationRequest,
} from "@/lib/schemas/execution"
import { isTerminal } from "@/lib/lifecycle/status"

async function fetchJob(jobId: string): Promise<ExecutionJobDetail> {
  const res = await fetch(`/api/execution/jobs/${jobId}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error?.message ?? "Failed to fetch execution job")
  }
  const data = await res.json()
  return data.job
}

async function runInspectionApi(request: InspectionRequest): Promise<{ job: ExecutionJobSummary }> {
  const res = await fetch("/api/execution/inspect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json()
    const details = err.error?.details
      ? `: ${JSON.stringify(err.error.details)}`
      : ""
    throw new Error(`${err.error?.message ?? "Failed to run inspection job"}${details}`)
  }
  return res.json()
}

async function runEvaluationApi(request: EvaluationRequest): Promise<{ job: ExecutionJobSummary }> {
  const res = await fetch("/api/execution/evaluate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  })
  if (!res.ok) {
    const err = await res.json()
    const details = err.error?.details
      ? `: ${JSON.stringify(err.error.details)}`
      : ""
    throw new Error(`${err.error?.message ?? "Failed to run evaluation job"}${details}`)
  }
  return res.json()
}

export const executionKeys = {
  all: ["execution-jobs"] as const,
  detail: (jobId: string) => [...executionKeys.all, jobId] as const,
  byProject: (projectId: string) => [...executionKeys.all, "project", projectId] as const,
  byProjectAndKind: (projectId: string, kind: string) =>
    [...executionKeys.byProject(projectId), kind] as const,
}

export function useExecutionJob(jobId: string | null) {
  return useQuery({
    queryKey: jobId ? executionKeys.detail(jobId) : [...executionKeys.all, "disabled"],
    queryFn: () => fetchJob(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as ExecutionJobDetail | undefined
      if (data?.status && !isTerminal(data.status)) {
        return 3000
      }
      return false
    },
  })
}

export function useRunInspectionJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runInspectionApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: executionKeys.detail(data.job.id),
      })
      queryClient.invalidateQueries({
        queryKey: executionKeys.byProjectAndKind(data.job.projectId, "inspection"),
      })
      queryClient.invalidateQueries({
        queryKey: ["inspector-summary", data.job.projectId],
      })
      queryClient.invalidateQueries({
        queryKey: ["project-status", data.job.projectId],
      })
    },
  })
}

export function useRunEvaluationJob() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: runEvaluationApi,
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: executionKeys.detail(data.job.id),
      })
      queryClient.invalidateQueries({
        queryKey: executionKeys.byProjectAndKind(data.job.projectId, "evaluation"),
      })
    },
  })
}
