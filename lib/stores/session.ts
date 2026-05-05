import { create } from "zustand"
import type { SessionStatus } from "@/lib/schemas/session"

type ActiveTool = "inspector" | "evaluator" | "failures"

interface SessionStore {
  sessionId: string | null
  status: SessionStatus
  modelFileName: string | null
  activeTool: ActiveTool
  setSessionId: (id: string) => void
  setStatus: (s: SessionStatus) => void
  setModelFileName: (name: string | null) => void
  setActiveTool: (tool: ActiveTool) => void
  reset: () => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessionId: null,
  status: "idle",
  modelFileName: null,
  activeTool: "inspector",
  setSessionId: (id) => set({ sessionId: id }),
  setStatus: (s) => set({ status: s }),
  setModelFileName: (name) => set({ modelFileName: name }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  reset: () => set({ sessionId: null, status: "idle", modelFileName: null, activeTool: "inspector" }),
}))
