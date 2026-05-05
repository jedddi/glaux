// LEGACY: not used in the ephemeral flow
import type { ModelAsset } from "@/lib/schemas/model"
import type { EvaluationRunner, EvaluationResult } from "./adapter"

function seededRandom(seed: number): () => number {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) & 0xffffffff
    return (state >>> 0) / 0xffffffff
  }
}

export class StubEvaluationRunner implements EvaluationRunner {
  async run(asset: ModelAsset | null): Promise<EvaluationResult> {
    const fileName = asset?.file_name ?? "model"
    const seed = fileName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const rand = seededRandom(seed)

    const accuracy = Math.round((0.82 + rand() * 0.15) * 10000) / 10000
    const precision = Math.round((0.80 + rand() * 0.17) * 10000) / 10000
    const recall = Math.round((0.78 + rand() * 0.19) * 10000) / 10000
    const f1Score = Math.round((2 * precision * recall) / (precision + recall) * 10000) / 10000
    const loss = Math.round((0.15 + rand() * 0.35) * 10000) / 10000
    const sampleCount = Math.round(800 + rand() * 7200)
    const classCount = Math.round(3 + rand() * 8)

    const classNames = Array.from({ length: classCount }, (_, i) => `class_${i}`)
    const confusionMatrix = {
      labels: classNames,
      matrix: classNames.map((_, rowIdx) =>
        classNames.map((_, colIdx) => {
          if (rowIdx === colIdx) return Math.round(40 + rand() * 160)
          return Math.round(rand() * 30)
        })
      ),
    }

    const perClassMetrics = classNames.map((name) => {
      const cp = Math.round((0.75 + rand() * 0.23) * 10000) / 10000
      const cr = Math.round((0.73 + rand() * 0.25) * 10000) / 10000
      const cf1 = Math.round((2 * cp * cr) / (cp + cr) * 10000) / 10000
      const support = Math.round(sampleCount / classCount * (0.8 + rand() * 0.4))
      return { className: name, precision: cp, recall: cr, f1: cf1, support }
    })

    return {
      accuracy,
      precision,
      recall,
      f1Score,
      loss,
      sampleCount,
      classCount,
      confusionMatrix,
      perClassMetrics,
      isSimulated: true,
    }
  }
}

export const stubEvaluationRunner = new StubEvaluationRunner()
