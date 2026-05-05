import { z } from "zod"
import { projectSchema } from "./project-core"

const timestampSchema = z.string().datetime({ offset: true })

export const modelAssetSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().positive(),
  file_type: z.string().min(1),
  format: z.enum(["onnx", "tflite"]).optional().nullable(),
  storage_bucket: z.string().default("models"),
  upload_status: z.enum(["pending", "uploading", "completed", "failed"]).default("completed"),
  parse_status: z.enum(["pending", "processing", "completed", "failed"]).default("pending"),
  parse_error: z.string().optional().nullable(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
})

export const modelInputSchema = z.object({
  name: z.string(),
  dtype: z.string().nullable(),
  shape: z.array(z.union([z.string(), z.number(), z.null()])),
})

export const modelOutputSchema = modelInputSchema

export const modelOperatorSchema = z.object({
  index: z.number(),
  name: z.string().nullable(),
  opType: z.string(),
  inputs: z.array(z.string()),
  outputs: z.array(z.string()),
})

export const architectureSchema = z.object({
  graphName: z.string().nullable(),
  topOperatorTypes: z.array(z.object({ opType: z.string(), count: z.number() })),
  raw: z.record(z.string(), z.unknown()).optional(),
})

export const edgeHintsSchema = z.object({
  quantized: z.boolean().nullable(),
  hasMetadata: z.boolean().nullable(),
  notes: z.array(z.string()),
  warnings: z.array(z.string()),
})

export const parsedModelResultSchema = z.object({
  format: z.enum(["onnx", "tflite"]),
  fileSizeBytes: z.number().nullable(),
  layerCount: z.number().nullable(),
  operatorCount: z.number().nullable(),
  inputs: z.array(modelInputSchema),
  outputs: z.array(modelOutputSchema),
  operators: z.array(modelOperatorSchema),
  architecture: architectureSchema,
  tfliteMetadata: z.record(z.string(), z.unknown()).nullable().optional(),
  edgeHints: edgeHintsSchema.nullable().optional(),
})

export const modelSummarySchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  model_asset_id: z.string().uuid().optional().nullable(),
  total_parameters: z.number().int().optional().nullable(),
  trainable_parameters: z.number().int().optional().nullable(),
  architecture: z.string().optional().nullable(),
  input_shape: z.string().optional().nullable(),
  output_shape: z.string().optional().nullable(),
  layer_count: z.number().int().optional().nullable(),
  operator_count: z.number().int().optional().nullable(),
  top1_accuracy: z.number().optional().nullable(),
  summary_json: z.unknown().optional().nullable(),
  input_shapes: z.array(z.unknown()).default([]),
  output_shapes: z.array(z.unknown()).default([]),
  inputs_json: z.array(z.unknown()).default([]),
  outputs_json: z.array(z.unknown()).default([]),
  operators_json: z.array(z.unknown()).default([]),
  architecture_json: z.record(z.string(), z.unknown()).default({}),
  tflite_metadata_json: z.record(z.string(), z.unknown()).nullable().optional(),
  edge_hints_json: z.record(z.string(), z.unknown()).nullable().optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
})

export type ModelAsset = z.infer<typeof modelAssetSchema>
export type ModelInput = z.infer<typeof modelInputSchema>
export type ModelOutput = z.infer<typeof modelOutputSchema>
export type ModelOperator = z.infer<typeof modelOperatorSchema>
export type Architecture = z.infer<typeof architectureSchema>
export type EdgeHints = z.infer<typeof edgeHintsSchema>
export type ParsedModelResult = z.infer<typeof parsedModelResultSchema>
export type ModelSummary = z.infer<typeof modelSummarySchema>

export const inspectorSummaryResponseSchema = z.object({
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
  summary: z.object({
    layerCount: z.number().nullable(),
    operatorCount: z.number().nullable(),
    inputs: z.array(modelInputSchema),
    outputs: z.array(modelOutputSchema),
    operators: z.array(modelOperatorSchema),
    architecture: architectureSchema,
    tfliteMetadata: z.record(z.string(), z.unknown()).nullable(),
    edgeHints: edgeHintsSchema.nullable(),
  }).nullable(),
})

export type InspectorSummaryResponse = z.infer<typeof inspectorSummaryResponseSchema>
