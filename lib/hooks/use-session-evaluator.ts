import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { runSessionEvaluate, getSessionEvaluate } from "@/lib/services/session-service"
import { sessionKeys } from "./use-session"

export function useSessionEvaluate(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.evaluate(sessionId ?? ""),
    queryFn: () => getSessionEvaluate(sessionId!),
    enabled: !!sessionId,
    retry: 1,
  })
}

export function useRunSessionEvaluate() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ sessionId, datasetFile }: { sessionId: string; datasetFile?: File }) =>
      runSessionEvaluate(sessionId, datasetFile),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.evaluate(variables.sessionId) })
      queryClient.invalidateQueries({ queryKey: sessionKeys.failures(variables.sessionId) })
    },
  })
}
