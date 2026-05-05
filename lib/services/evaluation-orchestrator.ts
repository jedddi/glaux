// LEGACY: not used in the ephemeral flow
import type { ModelAsset } from "@/lib/schemas/model"
import {
  getLatestEvaluationByProject,
  createEvaluationRun,
  updateEvaluationStatus,
  persistEvaluationResults,
} from "./evaluation-service"
import { logActivity } from "./activity-service"
import type { EvaluationRunner } from "@/lib/execution/adapter"
import { stubEvaluationRunner } from "@/lib/execution/stub-evaluation-runner"
import { assertValidTransition } from "@/lib/lifecycle/status"

export type RunEvaluationResult = {
  evaluationId: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  loss: number | null
  sampleCount: number
  classCount: number
}

export async function runEvaluation(
  projectId: string,
  asset: ModelAsset,
  runner: EvaluationRunner = stubEvaluationRunner
): Promise<RunEvaluationResult> {
  let evaluation = await getLatestEvaluationByProject(projectId)

  if (!evaluation) {
    evaluation = await createEvaluationRun(projectId, {
      modelAssetId: asset.id,
    })
  }

  const evaluationId = evaluation.id!

  await updateEvaluationStatus(evaluationId, "queued")
  await logActivity(projectId, "evaluation_started", {
    evaluation_id: evaluationId,
    model_asset_id: asset.id,
  }).catch(() => {})

  try {
    assertValidTransition("queued", "running", "evaluation")
    await updateEvaluationStatus(evaluationId, "running", {
      started_at: new Date().toISOString(),
      model_asset_id: asset.id,
    })

    const results = await runner.run(asset)

    evaluation = await persistEvaluationResults(evaluationId, {
      accuracy: results.accuracy,
      precision: results.precision,
      recall: results.recall,
      f1Score: results.f1Score,
      loss: results.loss,
      sampleCount: results.sampleCount,
      classCount: results.classCount,
      confusionMatrix: results.confusionMatrix,
      perClassMetrics: results.perClassMetrics,
      isSimulated: results.isSimulated,
    })

    await logActivity(projectId, "evaluation_completed", {
      evaluation_id: evaluationId,
      model_asset_id: asset.id,
    }).catch(() => {})

    return {
      evaluationId,
      accuracy: results.accuracy,
      precision: results.precision,
      recall: results.recall,
      f1Score: results.f1Score,
      loss: results.loss,
      sampleCount: results.sampleCount,
      classCount: results.classCount,
    }
  } catch (evalError) {
    const message = evalError instanceof Error ? evalError.message : "Evaluation run failed"
    await updateEvaluationStatus(evaluationId, "failed", { error_message: message })
    await logActivity(projectId, "evaluation_failed", {
      evaluation_id: evaluationId,
      error: message,
    }).catch(() => {})
    throw evalError
  }
}
