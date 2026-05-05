import { z } from "zod"

export const sessionIdSchema = z.string().uuid()

export const sessionStatusEnum = z.enum(["idle", "uploading", "analyzing", "ready", "error"])

export const sessionStateSchema = z.object({
  sessionId: sessionIdSchema,
  status: sessionStatusEnum,
  modelFileName: z.string().optional().nullable(),
  modelFormat: z.enum(["onnx", "tflite"]).optional().nullable(),
})

export const sessionUploadResponseSchema = z.object({
  sessionId: sessionIdSchema,
  fileName: z.string(),
  format: z.enum(["onnx", "tflite"]),
})

export const sessionInspectResponseSchema = z.object({
  format: z.string(),
  fileName: z.string().optional().nullable(),
  fileSizeBytes: z.number().optional().nullable(),
  inputTensors: z.array(
    z.object({
      name: z.string(),
      dtype: z.string(),
      shape: z.array(z.union([z.string(), z.number(), z.null()])),
    })
  ).default([]),
  outputTensors: z.array(
    z.object({
      name: z.string(),
      dtype: z.string(),
      shape: z.array(z.union([z.string(), z.number(), z.null()])),
    })
  ).default([]),
  shapeSummaries: z.array(z.string()).default([]),
  dtypeSummaries: z.array(z.string()).default([]),
  parameterCount: z.number().int().optional().nullable(),
  layerCount: z.number().int().optional().nullable(),
  operatorCount: z.number().int().optional().nullable(),
  graphName: z.string().optional().nullable(),
  operators: z.array(
    z.object({
      index: z.number(),
      name: z.string().optional().nullable(),
      opType: z.string(),
      inputs: z.array(z.string()),
      outputs: z.array(z.string()),
    })
  ).default([]),
  architecture: z.object({
    graphName: z.string().optional().nullable(),
    topOperatorTypes: z.array(
      z.object({
        opType: z.string(),
        count: z.number(),
      })
    ).default([]),
    raw: z.record(z.string(), z.unknown()).optional(),
  }).optional().nullable(),
  edgeHints: z.object({
    quantized: z.boolean().optional().nullable(),
    hasMetadata: z.boolean().optional().nullable(),
    notes: z.array(z.string()).default([]),
    warnings: z.array(z.string()).default([]),
  }).optional().nullable(),
  tfliteMetadata: z.record(z.string(), z.unknown()).optional().nullable(),
  warnings: z.array(z.string()).default([]),
  summary: z.string().default(""),
})

export const sessionGraphResponseSchema = z.object({
  graphCollections: z.array(
    z.object({
      label: z.string(),
      graphs: z.array(
        z.object({
          id: z.string(),
          nodes: z.array(
            z.object({
              id: z.string(),
              label: z.string(),
              namespace: z.string(),
              incomingEdges: z.array(
                z.object({
                  sourceNodeId: z.string(),
                  sourceNodeOutputId: z.string().optional(),
                  targetNodeInputId: z.string().optional(),
                })
              ).optional(),
              attrs: z.array(
                z.object({
                  key: z.string(),
                  value: z.string(),
                })
              ).optional(),
            })
          ),
        })
      ),
    })
  ),
  visualizerConfig: z.record(z.string(), z.unknown()).optional(),
})

export const sessionEvaluateResponseSchema = z.object({
  accuracy: z.number(),
  precision: z.number(),
  recall: z.number(),
  f1Score: z.number(),
  loss: z.number().nullable(),
  perClassMetrics: z.array(
    z.object({
      className: z.string(),
      precision: z.number(),
      recall: z.number(),
      f1: z.number(),
      support: z.number(),
    })
  ).default([]),
  confusionMatrix: z.object({
    labels: z.array(z.string()),
    matrix: z.array(z.array(z.number())),
  }).optional().nullable(),
  datasetSummary: z.object({
    sampleCount: z.number().int(),
    classCount: z.number().int(),
    className: z.string().optional().nullable(),
  }).optional().nullable(),
  warnings: z.array(z.string()).default([]),
  summary: z.string().default(""),
  provenance: z.string().optional().default("simulated"),
})

export const sessionFailureSampleSchema = z.object({
  id: z.string(),
  predictedLabel: z.string(),
  actualLabel: z.string(),
  confidence: z.number(),
  errorType: z.string().optional().nullable(),
  rank: z.number().int().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const sessionFailuresResponseSchema = z.object({
  totalFailures: z.number().int(),
  accuracy: z.number().optional().nullable(),
  topConfusedPairs: z.array(
    z.object({
      trueLabel: z.string(),
      predictedLabel: z.string(),
      count: z.number().int(),
    })
  ).default([]),
  failureByTrueClass: z.record(z.string(), z.number()).optional().nullable(),
  failureByPredictedClass: z.record(z.string(), z.number()).optional().nullable(),
  samples: z.array(sessionFailureSampleSchema).default([]),
  provenance: z.string().optional().default("simulated"),
})

export type SessionId = z.infer<typeof sessionIdSchema>
export type SessionStatus = z.infer<typeof sessionStatusEnum>
export type SessionState = z.infer<typeof sessionStateSchema>
export type SessionUploadResponse = z.infer<typeof sessionUploadResponseSchema>
export type SessionInspectResponse = z.infer<typeof sessionInspectResponseSchema>
export type SessionGraphResponse = z.infer<typeof sessionGraphResponseSchema>
export type SessionEvaluateResponse = z.infer<typeof sessionEvaluateResponseSchema>
export type SessionFailureSample = z.infer<typeof sessionFailureSampleSchema>
export type SessionFailuresResponse = z.infer<typeof sessionFailuresResponseSchema>
