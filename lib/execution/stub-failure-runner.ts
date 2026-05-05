// LEGACY: not used in the ephemeral flow
import type { Evaluation } from "@/lib/schemas/evaluation"
import type { FailureAnalysisRunner, FailureSample } from "./adapter"

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff
    return (state >>> 0) / 0xffffffff
  }
}

export class StubFailureAnalysisRunner implements FailureAnalysisRunner {
  async analyze(evaluation: Evaluation): Promise<FailureSample[]> {
    const seed = (evaluation.id ?? evaluation.project_id ?? "default")
      .split("")
      .reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const rand = seededRandom(seed)

    const confusionMatrix = evaluation.confusion_matrix
    const perClassMetrics = evaluation.per_class_metrics
    const labels = confusionMatrix?.labels ?? perClassMetrics?.map((m) => m.className) ?? []
    const matrix = confusionMatrix?.matrix ?? []

    if (labels.length === 0) {
      return this.generateFallbackSamples(rand)
    }

    const offDiagonalEntries: Array<{
      trueLabel: string
      predictedLabel: string
      count: number
    }> = []

    for (let i = 0; i < matrix.length; i++) {
      for (let j = 0; j < matrix[i].length; j++) {
        if (i !== j && matrix[i][j] > 0) {
          offDiagonalEntries.push({
            trueLabel: labels[i],
            predictedLabel: labels[j],
            count: matrix[i][j],
          })
        }
      }
    }

    offDiagonalEntries.sort((a, b) => b.count - a.count)

    const totalSamples = Math.min(
      Math.round(20 + rand() * 30),
      offDiagonalEntries.reduce((sum, e) => sum + e.count, 0)
    )

    const samples: FailureSample[] = []
    let rank = 1

    for (const entry of offDiagonalEntries) {
      const samplesFromPair = Math.max(1, Math.round(
        (entry.count / Math.max(1, offDiagonalEntries.reduce((s, e) => s + e.count, 0))) * totalSamples
      ))

      for (let k = 0; k < samplesFromPair && samples.length < totalSamples; k++) {
        const perClass = perClassMetrics?.find((m) => m.className === entry.trueLabel)
        const baseConfidence = perClass ? perClass.recall : 0.8
        const confidence = Math.round(
          Math.max(0.15, Math.min(0.95, baseConfidence - 0.1 + rand() * 0.3)) * 10000
        ) / 10000

        const errorType = confidence < 0.5
          ? "low_confidence"
          : confidence > 0.85
            ? "high_confidence_misclassification"
            : "confused_pair"

        samples.push({
          predicted_label: entry.predictedLabel,
          actual_label: entry.trueLabel,
          confidence,
          error_type: errorType,
          rank: rank++,
          metadata: {
            provenance: "simulated",
            source: "stub_failure_runner",
            generated_at: new Date().toISOString(),
          },
        })
      }
    }

    samples.sort((a, b) => a.confidence - b.confidence)
    samples.forEach((s, i) => { s.rank = i + 1 })

    return samples
  }

  private generateFallbackSamples(rand: () => number): FailureSample[] {
    const count = Math.round(20 + rand() * 30)
    const classCount = Math.round(3 + rand() * 5)
    const labels = Array.from({ length: classCount }, (_, i) => `class_${i}`)

    const samples: FailureSample[] = []
    for (let i = 0; i < count; i++) {
      const trueIdx = Math.floor(rand() * labels.length)
      let predIdx = Math.floor(rand() * labels.length)
      while (predIdx === trueIdx) {
        predIdx = Math.floor(rand() * labels.length)
      }

      const confidence = Math.round((0.2 + rand() * 0.7) * 10000) / 10000
      const errorType = confidence < 0.5
        ? "low_confidence"
        : confidence > 0.85
          ? "high_confidence_misclassification"
          : "confused_pair"

      samples.push({
        predicted_label: labels[predIdx],
        actual_label: labels[trueIdx],
        confidence,
        error_type: errorType,
        rank: i + 1,
        metadata: {
          provenance: "simulated",
          source: "stub_failure_runner",
          generated_at: new Date().toISOString(),
        },
      })
    }

    samples.sort((a, b) => a.confidence - b.confidence)
    samples.forEach((s, i) => { s.rank = i + 1 })

    return samples
  }
}

export const stubFailureAnalysisRunner = new StubFailureAnalysisRunner()
