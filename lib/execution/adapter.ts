// LEGACY: not used in the ephemeral flow
import type { ModelAsset } from "@/lib/schemas/model"
import type { Evaluation } from "@/lib/schemas/evaluation"
import type { ConfusionMatrix, PerClassMetric } from "@/lib/schemas/evaluation"

export interface EvaluationRunner {
  run(asset: ModelAsset | null): Promise<EvaluationResult>
}

export interface FailureAnalysisRunner {
  analyze(evaluation: Evaluation): Promise<FailureSample[]>
}

export interface EvaluationResult {
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  loss: number | null
  sampleCount: number
  classCount: number
  confusionMatrix: ConfusionMatrix
  perClassMetrics: PerClassMetric[]
  isSimulated: boolean
}

export interface FailureSample {
  predicted_label: string
  actual_label: string
  confidence: number
  error_type: string
  rank: number
  metadata: Record<string, unknown>
}
