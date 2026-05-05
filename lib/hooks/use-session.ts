import { useMutation, useQueryClient } from "@tanstack/react-query"
import { createSession, uploadToSession } from "@/lib/services/session-service"

export const sessionKeys = {
  all: ["session"] as const,
  detail: (s: string) => [...sessionKeys.all, s] as const,
  inspect: (s: string) => [...sessionKeys.detail(s), "inspect"] as const,
  graph: (s: string) => [...sessionKeys.detail(s), "graph"] as const,
  evaluate: (s: string) => [...sessionKeys.detail(s), "evaluate"] as const,
  failures: (s: string) => [...sessionKeys.detail(s), "failures"] as const,
}

export function useCreateSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createSession,
    onSuccess: (sessionId) => {
      queryClient.setQueryData(sessionKeys.detail(sessionId), { sessionId })
    },
  })
}

export function useUploadToSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, file }: { sessionId: string; file: File }) =>
      uploadToSession(sessionId, file),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.inspect(data.sessionId) })
      queryClient.invalidateQueries({ queryKey: sessionKeys.graph(data.sessionId) })
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(data.sessionId) })
    },
  })
}
