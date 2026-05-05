import { useQuery } from "@tanstack/react-query"
import { getSessionGraph } from "@/lib/services/session-service"
import { sessionKeys } from "./use-session"

export function useSessionGraph(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.graph(sessionId ?? ""),
    queryFn: () => getSessionGraph(sessionId!),
    enabled: !!sessionId,
    retry: 1,
  })
}
