import { useQuery } from "@tanstack/react-query"
import { getSessionInspect } from "@/lib/services/session-service"
import { sessionKeys } from "./use-session"

export function useSessionInspect(sessionId: string | null) {
  return useQuery({
    queryKey: sessionKeys.inspect(sessionId ?? ""),
    queryFn: () => getSessionInspect(sessionId!),
    enabled: !!sessionId,
    retry: 1,
  })
}
