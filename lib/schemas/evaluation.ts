import { z } from "zod"
import { projectSchema } from "./project-core"
import { modelAssetSchema } from "./model"

const timestampSchema = z.string().datetime({ offset: true })

export const evaluationStatusEnum = z.enum(["idle", "queued", "running", "completed", "failed"])

export const confusionMatrixSchema = z.object({
  labels: z.array(z.string()),
  matrix: z.array(z.array(z.number())),
})

export const perClassMetricSchema = z.object({
  className: z.string(),
  precision: z.number(),
  recall: z.number(),
  f1: z.number(),
  support: z.number(),
})

export const datasetSourceSchema = z.object({
  type: z.enum(["upload", "reference", "bundled"]),
  fileName: z.string().optional(),
  fileSize: z.number().optional(),
  description: z.string().optional(),
})

export const evaluationSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  model_asset_id: z.string().uuid().optional().nullable(),
  dataset_name: z.string().optional().nullable(),
  dataset_size: z.number().int().optional().nullable(),
  dataset_source: datasetSourceSchema.optional().default({ type: "upload" }),
  dataset_file_path: z.string().optional().nullable(),
  accuracy: z.number().optional().nullable(),
  precision: z.number().optional().nullable(),
  recall: z.number().optional().nullable(),
  f1_score: z.number().optional().nullable(),
  loss: z.number().optional().nullable(),
  sample_count: z.number().int().optional().nullable(),
  class_count: z.number().int().optional().nullable(),
  confusion_matrix: confusionMatrixSchema.optional().nullable(),
  per_class_metrics: z.array(perClassMetricSchema).optional().nullable(),
  status: evaluationStatusEnum.default("idle"),
  error_message: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  started_at: timestampSchema.optional().nullable(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional().nullable(),
  completed_at: timestampSchema.optional().nullable(),
})

export const createEvaluationRequestSchema = z.object({
  modelAssetId: z.string().uuid().optional(),
  datasetName: z.string().optional(),
  datasetSource: datasetSourceSchema.optional(),
})

export const runEvaluationRequestSchema = z.object({
  evaluationId: z.string().uuid().optional(),
})

export const evaluationSummaryResponseSchema = z.object({
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
    datasetName: z.string().nullable(),
    datasetSize: z.number().nullable(),
    status: evaluationStatusEnum,
    accuracy: z.number().nullable(),
    precision: z.number().nullable(),
    recall: z.number().nullable(),
    f1Score: z.number().nullable(),
    loss: z.number().nullable(),
    sampleCount: z.number().nullable(),
    classCount: z.number().nullable(),
    confusionMatrix: confusionMatrixSchema.nullable(),
    perClassMetrics: z.array(perClassMetricSchema).nullable(),
    errorMessage: z.string().nullable(),
    isSimulated: z.boolean(),
    modelAssetId: z.string().uuid().nullable(),
    startedAt: z.string().nullable(),
    completedAt: z.string().nullable(),
    createdAt: z.string(),
    updatedAt: z.string().nullable(),
  }).nullable(),
  hasModel: z.boolean(),
  hasDataset: z.boolean(),
  isStale: z.boolean(),
})

export type EvaluationStatus = z.infer<typeof evaluationStatusEnum>
export type Evaluation = z.infer<typeof evaluationSchema>
export type ConfusionMatrix = z.infer<typeof confusionMatrixSchema>
export type PerClassMetric = z.infer<typeof perClassMetricSchema>
export type DatasetSource = z.infer<typeof datasetSourceSchema>
export type CreateEvaluationRequest = z.infer<typeof createEvaluationRequestSchema>
export type RunEvaluationRequest = z.infer<typeof runEvaluationRequestSchema>
export type EvaluationSummaryResponse = z.infer<typeof evaluationSummaryResponseSchema>
