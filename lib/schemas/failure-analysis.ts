import { z } from "zod"
import { projectSchema } from "./project-core"
import { modelAssetSchema } from "./model"
import { evaluationStatusEnum } from "./evaluation"

const timestampSchema = z.string().datetime({ offset: true })

export const failureSampleSchema = z.object({
  id: z.string().uuid().optional(),
  evaluation_id: z.string().uuid(),
  project_id: z.string().uuid(),
  model_asset_id: z.string().uuid().optional().nullable(),
  image_path: z.string().optional().nullable(),
  predicted_label: z.string().optional(),
  actual_label: z.string().optional(),
  confidence: z.number().optional(),
  error_type: z.string().optional().nullable(),
  rank: z.number().int().optional().nullable(),
  input_preview_url: z.string().optional().nullable(),
  metadata: z.unknown().optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
})

export const failureAnalysisStatusEnum = z.enum(["idle", "queued", "running", "completed", "failed"])

export const confusedPairSchema = z.object({
  trueLabel: z.string(),
  predictedLabel: z.string(),
  count: z.number().int(),
})

export const failureClassDistributionSchema = z.object({
  className: z.string(),
  count: z.number().int(),
})

export const failureAnalysisSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  evaluation_id: z.string().uuid(),
  model_asset_id: z.string().uuid().optional().nullable(),
  status: failureAnalysisStatusEnum.default("idle"),
  total_failures: z.number().int().default(0),
  top_confused_pairs: z.array(confusedPairSchema).default([]),
  failure_by_true_class: z.array(failureClassDistributionSchema).default([]),
  failure_by_predicted_class: z.array(failureClassDistributionSchema).default([]),
  provenance: z.string().optional().default("simulated"),
  error_message: z.string().optional().nullable(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
})

export const failureSummaryResponseSchema = z.object({
  project: z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: projectSchema.shape.status,
    modelFormat: z.enum(["onnx", "tflite"]).nullable(),
  }),
  asset: z.object({
    id: z.string().uuid(),
    originalFilename: z.string(),
    fileSizeBytes: z.number(),
    parseStatus: modelAssetSchema.shape.parse_status,
    parseError: z.string().nullable(),
    updatedAt: z.string().optional().nullable(),
  }).nullable(),
  evaluation: z.object({
    id: z.string().uuid(),
    status: evaluationStatusEnum,
    accuracy: z.number().nullable(),
    f1Score: z.number().nullable(),
    sampleCount: z.number().nullable(),
    classCount: z.number().nullable(),
    completedAt: z.string().nullable(),
    isSimulated: z.boolean(),
  }).nullable(),
  analysis: z.object({
    id: z.string().uuid(),
    status: failureAnalysisStatusEnum,
    totalFailures: z.number().int(),
    topConfusedPairs: z.array(confusedPairSchema),
    failureByTrueClass: z.array(failureClassDistributionSchema),
    failureByPredictedClass: z.array(failureClassDistributionSchema),
    provenance: z.string(),
    errorMessage: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }).nullable(),
  samples: z.array(z.object({
    id: z.string().uuid(),
    trueLabel: z.string(),
    predictedLabel: z.string(),
    confidence: z.number().nullable(),
    errorType: z.string().nullable(),
    rank: z.number().int().nullable(),
    inputPreviewUrl: z.string().nullable(),
    metadata: z.unknown(),
    createdAt: z.string(),
  })),
  hasModel: z.boolean(),
  hasEvaluation: z.boolean(),
  hasAnalysis: z.boolean(),
  isStale: z.boolean(),
})

export type FailureSample = z.infer<typeof failureSampleSchema>
export type FailureAnalysisStatus = z.infer<typeof failureAnalysisStatusEnum>
export type FailureAnalysis = z.infer<typeof failureAnalysisSchema>
export type ConfusedPair = z.infer<typeof confusedPairSchema>
export type FailureClassDistribution = z.infer<typeof failureClassDistributionSchema>
export type FailureSummaryResponse = z.infer<typeof failureSummaryResponseSchema>
