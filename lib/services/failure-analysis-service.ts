// LEGACY: not used in the ephemeral flow
import type { Evaluation } from "@/lib/schemas/evaluation"
import { generateStubFailureSamples } from "./failure-runner"
import {
  createFailureAnalysis,
  updateFailureAnalysisStatus,
  persistFailureAnalysisResults,
  clearPriorFailureSamples,
  clearPriorFailureAnalysis,
  persistFailureSamples,
} from "./failure-service"
import { logActivity } from "./activity-service"

type AnalysisResult = {
  analysisId: string
  totalFailures: number
  topConfusedPairs: Array<{ trueLabel: string; predictedLabel: string; count: number }>
  failureByTrueClass: Array<{ className: string; count: number }>
  failureByPredictedClass: Array<{ className: string; count: number }>
}

export async function analyzeFailuresFromEvaluation(
  projectId: string,
  evaluation: Evaluation,
  modelAssetId?: string | null
): Promise<AnalysisResult> {
  const evaluationId = evaluation.id!

  await clearPriorFailureSamples(projectId, evaluationId)
  await clearPriorFailureAnalysis(projectId, evaluationId)

  const analysis = await createFailureAnalysis(projectId, evaluationId, modelAssetId)
  await updateFailureAnalysisStatus(analysis.id!, "queued")

  await logActivity(projectId, "failure_analysis_started", {
    analysis_id: analysis.id!,
    evaluation_id: evaluationId,
  }).catch(() => {})

  try {
    await updateFailureAnalysisStatus(analysis.id!, "running", {
      started_at: new Date().toISOString(),
    })

    const stubSamples = generateStubFailureSamples(evaluation)

    const dbSamples = stubSamples.map((s) => ({
      project_id: projectId,
      evaluation_id: evaluationId,
      model_asset_id: modelAssetId ?? null,
      predicted_label: s.predicted_label,
      actual_label: s.actual_label,
      confidence: s.confidence,
      error_type: s.error_type,
      rank: s.rank,
      metadata: s.metadata,
    }))

    await persistFailureSamples(dbSamples)

    const topConfusedPairs = computeTopConfusedPairs(stubSamples)
    const failureByTrueClass = computeClassDistribution(stubSamples, "actual_label")
    const failureByPredictedClass = computeClassDistribution(stubSamples, "predicted_label")

    await persistFailureAnalysisResults(analysis.id!, {
      totalFailures: stubSamples.length,
      topConfusedPairs,
      failureByTrueClass,
      failureByPredictedClass,
      provenance: "simulated",
    })

    await logActivity(projectId, "failure_analysis_completed", {
      analysis_id: analysis.id!,
      evaluation_id: evaluationId,
      total_failures: stubSamples.length,
    }).catch(() => {})

    return {
      analysisId: analysis.id!,
      totalFailures: stubSamples.length,
      topConfusedPairs,
      failureByTrueClass,
      failureByPredictedClass,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failure analysis failed"
    await updateFailureAnalysisStatus(analysis.id!, "failed", { error_message: message })
    await logActivity(projectId, "failure_analysis_failed", {
      analysis_id: analysis.id!,
      evaluation_id: evaluationId,
      error: message,
    }).catch(() => {})
    throw err
  }
}

function computeTopConfusedPairs(
  samples: Array<{ actual_label: string; predicted_label: string }>
): Array<{ trueLabel: string; predictedLabel: string; count: number }> {
  const counts = new Map<string, { trueLabel: string; predictedLabel: string; count: number }>()
  for (const s of samples) {
    const key = `${s.actual_label}→${s.predicted_label}`
    const existing = counts.get(key)
    if (existing) {
      existing.count++
    } else {
      counts.set(key, { trueLabel: s.actual_label, predictedLabel: s.predicted_label, count: 1 })
    }
  }
  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
}

function computeClassDistribution(
  samples: Array<{ actual_label: string; predicted_label: string }>,
  field: "actual_label" | "predicted_label"
): Array<{ className: string; count: number }> {
  const counts = new Map<string, number>()
  for (const s of samples) {
    const key = s[field]
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([className, count]) => ({ className, count }))
    .sort((a, b) => b.count - a.count)
}
