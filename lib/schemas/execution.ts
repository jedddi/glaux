import { z } from "zod"

const timestampSchema = z.string().datetime({ offset: true })

export const executionJobKindEnum = z.enum(["inspection", "evaluation"])

export const executionJobStatusEnum = z.enum(["queued", "running", "succeeded", "failed"])

export const artifactReferenceSchema = z.object({
  name: z.string(),
  type: z.string(),
  path: z.string().optional().nullable(),
  url: z.string().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const backendErrorPayloadSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional().nullable(),
})

export const inspectionRequestSchema = z.object({
  projectId: z.string().min(1, "Project ID is required").optional(),
  sessionId: z.string().uuid().optional(),
  modelAssetId: z.string().optional().nullable(),
  modelFormat: z.enum(["onnx", "tflite"]).optional().nullable(),
  fileName: z.string().optional().nullable(),
  modelDownloadUrl: z.string().optional().nullable(),
}).refine((data) => data.projectId || data.sessionId, {
  message: "Either projectId or sessionId is required",
})

export const evaluationRequestSchema = z.object({
  projectId: z.string().min(1, "Project ID is required").optional(),
  sessionId: z.string().uuid().optional(),
  modelAssetId: z.string().optional().nullable(),
  datasetName: z.string().optional().nullable(),
  datasetSize: z.number().int().optional().nullable(),
}).refine((data) => data.projectId || data.sessionId, {
  message: "Either projectId or sessionId is required",
})

export const tensorInfoSchema = z.object({
  name: z.string(),
  dtype: z.string(),
  shape: z.array(z.union([z.string(), z.number(), z.null()])),
})

export const operatorInfoSchema = z.object({
  index: z.number(),
  name: z.string().optional().nullable(),
  opType: z.string(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
})

export const operatorTypeCountSchema = z.object({
  opType: z.string(),
  count: z.number(),
})

export const architectureInfoSchema = z.object({
  graphName: z.string().optional().nullable(),
  topOperatorTypes: z.array(operatorTypeCountSchema).default([]),
  raw: z.record(z.string(), z.unknown()).optional(),
})

export const edgeHintsInfoSchema = z.object({
  quantized: z.boolean().optional().nullable(),
  hasMetadata: z.boolean().optional().nullable(),
  notes: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
})

export const inspectionResultSchema = z.object({
  format: z.string(),
  fileName: z.string().optional().nullable(),
  fileSizeBytes: z.number().optional().nullable(),
  inputTensors: z.array(tensorInfoSchema).default([]),
  outputTensors: z.array(tensorInfoSchema).default([]),
  shapeSummaries: z.array(z.string()).default([]),
  dtypeSummaries: z.array(z.string()).default([]),
  parameterCount: z.number().int().optional().nullable(),
  layerCount: z.number().int().optional().nullable(),
  operatorCount: z.number().int().optional().nullable(),
  graphName: z.string().optional().nullable(),
  operators: z.array(operatorInfoSchema).default([]),
  architecture: architectureInfoSchema.optional().nullable(),
  edgeHints: edgeHintsInfoSchema.optional().nullable(),
  tfliteMetadata: z.record(z.string(), z.unknown()).optional().nullable(),
  warnings: z.array(z.string()).default([]),
  summary: z.string().default(""),
})

export const inspectionStubResultSchema = inspectionResultSchema

export const evaluationStubResultSchema = z.object({
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
  ),
  confusionMatrix: z.object({
    labels: z.array(z.string()),
    matrix: z.array(z.array(z.number())),
  }).optional().nullable(),
  datasetSummary: z.object({
    sampleCount: z.number().int(),
    classCount: z.number().int(),
    className: z.string().optional().nullable(),
  }).optional().nullable(),
  warnings: z.array(z.string()),
  summary: z.string(),
})

export const executionJobSummarySchema = z.object({
  id: z.string().uuid(),
  kind: executionJobKindEnum,
  status: executionJobStatusEnum,
  projectId: z.string().uuid(),
  initiatedBy: z.string().optional().nullable(),
  createdAt: timestampSchema,
  updatedAt: timestampSchema.optional().nullable(),
  startedAt: timestampSchema.optional().nullable(),
  completedAt: timestampSchema.optional().nullable(),
  progressMessage: z.string().optional().nullable(),
  errorCode: z.string().optional().nullable(),
  errorMessage: z.string().optional().nullable(),
})

export const executionJobDetailSchema = executionJobSummarySchema.extend({
  requestPayload: z.record(z.string(), z.unknown()).optional().nullable(),
  resultSummary: z.record(z.string(), z.unknown()).optional().nullable(),
  artifacts: z.array(artifactReferenceSchema).optional().nullable(),
  inspectionResult: inspectionStubResultSchema.optional().nullable(),
  evaluationResult: evaluationStubResultSchema.optional().nullable(),
})

export const executionJobCreateResponseSchema = z.object({
  job: executionJobSummarySchema,
})

export const executionJobDetailResponseSchema = z.object({
  job: executionJobDetailSchema,
})

export type ExecutionJobKind = z.infer<typeof executionJobKindEnum>
export type ExecutionJobStatus = z.infer<typeof executionJobStatusEnum>
export type ArtifactReference = z.infer<typeof artifactReferenceSchema>
export type BackendErrorPayload = z.infer<typeof backendErrorPayloadSchema>
export type InspectionRequest = z.infer<typeof inspectionRequestSchema>
export type EvaluationRequest = z.infer<typeof evaluationRequestSchema>
export type TensorInfo = z.infer<typeof tensorInfoSchema>
export type OperatorInfo = z.infer<typeof operatorInfoSchema>
export type OperatorTypeCount = z.infer<typeof operatorTypeCountSchema>
export type ArchitectureInfo = z.infer<typeof architectureInfoSchema>
export type EdgeHintsInfo = z.infer<typeof edgeHintsInfoSchema>
export type InspectionResult = z.infer<typeof inspectionResultSchema>
export type InspectionStubResult = z.infer<typeof inspectionStubResultSchema>
export type EvaluationStubResult = z.infer<typeof evaluationStubResultSchema>
export type ExecutionJobSummary = z.infer<typeof executionJobSummarySchema>
export type ExecutionJobDetail = z.infer<typeof executionJobDetailSchema>
export type ExecutionJobCreateResponse = z.infer<typeof executionJobCreateResponseSchema>
export type ExecutionJobDetailResponse = z.infer<typeof executionJobDetailResponseSchema>
