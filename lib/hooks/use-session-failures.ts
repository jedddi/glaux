import { useQuery } from "@tanstack/react-query"
import { getSessionFailures } from "@/lib/services/session-service"
import { sessionKeys } from "./use-session"

export function useSessionFailures(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.failures(sessionId ?? ""),
    queryFn: () => getSessionFailures(sessionId!),
    enabled: !!sessionId,
  })
}
