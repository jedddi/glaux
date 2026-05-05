export const EVALUATION_STATUSES = ["idle", "queued", "running", "completed", "failed"] as const
export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number]

export const FAILURE_ANALYSIS_STATUSES = ["idle", "queued", "running", "completed", "failed"] as const
export type FailureAnalysisStatus = (typeof FAILURE_ANALYSIS_STATUSES)[number]

export const EXECUTION_JOB_STATUSES = ["queued", "running", "succeeded", "failed"] as const
export type ExecutionJobStatus = (typeof EXECUTION_JOB_STATUSES)[number]

export const SESSION_STATUSES = ["idle", "uploading", "analyzing", "ready", "error"] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const TERMINAL_STATUSES = new Set(["completed", "failed", "succeeded", "error", "ready"] as const)
export const ACTIVE_STATUSES = new Set(["queued", "running", "uploading", "analyzing"] as const)
export const RETRYABLE_STATUSES = new Set(["failed", "error"] as const)

export const VALID_EVALUATION_TRANSITIONS: Record<EvaluationStatus, EvaluationStatus[]> = {
  idle: ["queued", "failed"],
  queued: ["running", "failed"],
  running: ["completed", "failed"],
  completed: [],
  failed: ["queued"],
}

export const VALID_FAILURE_ANALYSIS_TRANSITIONS: Record<FailureAnalysisStatus, FailureAnalysisStatus[]> = {
  idle: ["queued", "failed"],
  queued: ["running", "failed"],
  running: ["completed", "failed"],
  completed: [],
  failed: ["queued"],
}

export const VALID_EXECUTION_JOB_TRANSITIONS: Record<ExecutionJobStatus, ExecutionJobStatus[]> = {
  queued: ["running", "failed"],
  running: ["succeeded", "failed"],
  succeeded: [],
  failed: ["queued"],
}

export const VALID_SESSION_TRANSITIONS: Record<SessionStatus, SessionStatus[]> = {
  idle: ["uploading", "error"],
  uploading: ["analyzing", "error"],
  analyzing: ["ready", "error"],
  ready: [],
  error: ["uploading"],
}

export function isTerminal(status: string): boolean {
  return TERMINAL_STATUSES.has(status as typeof TERMINAL_STATUSES extends Set<infer T> ? T : never)
}

export function isActive(status: string): boolean {
  return ACTIVE_STATUSES.has(status as typeof ACTIVE_STATUSES extends Set<infer T> ? T : never)
}

export function isRetryable(status: string): boolean {
  return RETRYABLE_STATUSES.has(status as typeof RETRYABLE_STATUSES extends Set<infer T> ? T : never)
}

export function isValidTransition(
  from: string,
  to: string,
  type: "evaluation" | "failure-analysis" | "execution-job" | "session"
): boolean {
  if (type === "evaluation") {
    const validTargets = VALID_EVALUATION_TRANSITIONS[from as EvaluationStatus]
    if (!validTargets) return false
    return validTargets.includes(to as EvaluationStatus)
  }
  if (type === "failure-analysis") {
    const validTargets = VALID_FAILURE_ANALYSIS_TRANSITIONS[from as FailureAnalysisStatus]
    if (!validTargets) return false
    return validTargets.includes(to as FailureAnalysisStatus)
  }
  if (type === "session") {
    const validTargets = VALID_SESSION_TRANSITIONS[from as SessionStatus]
    if (!validTargets) return false
    return validTargets.includes(to as SessionStatus)
  }
  const validTargets = VALID_EXECUTION_JOB_TRANSITIONS[from as ExecutionJobStatus]
  if (!validTargets) return false
  return validTargets.includes(to as ExecutionJobStatus)
}

export function assertValidTransition(
  from: string,
  to: string,
  type: "evaluation" | "failure-analysis" | "execution-job" | "session"
): void {
  if (!isValidTransition(from, to, type)) {
    const transitions = type === "evaluation"
      ? VALID_EVALUATION_TRANSITIONS
      : type === "failure-analysis"
        ? VALID_FAILURE_ANALYSIS_TRANSITIONS
        : type === "session"
          ? VALID_SESSION_TRANSITIONS
          : VALID_EXECUTION_JOB_TRANSITIONS
    const allowed = transitions[from as keyof typeof transitions] ?? []
    throw new Error(
      `Invalid ${type} status transition: "${from}" -> "${to}". ` +
      `Allowed transitions from "${from}": ${JSON.stringify(allowed)}`
    )
  }
}
