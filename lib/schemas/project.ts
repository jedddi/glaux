import { z } from "zod"

export const ALLOWED_MODEL_EXTENSIONS = [".onnx", ".tflite"] as const
export const MAX_MODEL_UPLOAD_BYTES = 250 * 1024 * 1024
const timestampSchema = z.string().datetime({ offset: true })

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Project name is required").max(128),
  description: z.string().max(512).optional().default(""),
  model_type: z.enum(["pytorch", "tensorflow", "onnx", "other"]).default("pytorch"),
  status: z.enum(["draft", "uploading", "analyzing", "complete", "failed"]).default("draft"),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
})

export const projectFormSchema = projectSchema.pick({
  name: true,
  description: true,
  model_type: true,
})

export const projectUpdateSchema = projectFormSchema.partial()

export const uploadSchema = z.object({
  project_id: z.string().uuid(),
  file_name: z
    .string()
    .min(1, "File name is required")
    .max(255, "File name is too long")
    .refine((value) => !/[\\/]/.test(value), "File name cannot include path separators")
    .refine(
      (value) =>
        ALLOWED_MODEL_EXTENSIONS.some((extension) =>
          value.toLowerCase().endsWith(extension)
        ),
      "Only .onnx and .tflite model files are supported"
    ),
  file_size: z
    .number()
    .positive("File must not be empty")
    .max(MAX_MODEL_UPLOAD_BYTES, "Model file must be 250 MB or smaller"),
  file_type: z.string().default("application/octet-stream"),
})

export const modelAssetSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  file_name: z.string().min(1),
  file_path: z.string().min(1),
  file_size: z.number().positive(),
  file_type: z.string().min(1),
  storage_bucket: z.string().default("models"),
  created_at: timestampSchema.optional(),
})

export const modelSummarySchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  total_parameters: z.number().int().optional(),
  trainable_parameters: z.number().int().optional(),
  architecture: z.string().optional(),
  input_shape: z.string().optional(),
  output_shape: z.string().optional(),
  layer_count: z.number().int().optional(),
  top1_accuracy: z.number().optional(),
  summary_json: z.unknown().optional(),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
})

export const evaluationSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  dataset_name: z.string().optional(),
  dataset_size: z.number().int().optional(),
  accuracy: z.number().optional(),
  precision: z.number().optional(),
  recall: z.number().optional(),
  f1_score: z.number().optional(),
  confusion_matrix: z.unknown().optional(),
  per_class_metrics: z.unknown().optional(),
  status: z.enum(["pending", "running", "complete", "failed"]).default("pending"),
  created_at: timestampSchema.optional(),
  completed_at: timestampSchema.optional(),
})

export const failureSampleSchema = z.object({
  id: z.string().uuid().optional(),
  evaluation_id: z.string().uuid(),
  project_id: z.string().uuid(),
  image_path: z.string().optional(),
  predicted_label: z.string().optional(),
  actual_label: z.string().optional(),
  confidence: z.number().optional(),
  metadata: z.unknown().optional(),
  created_at: timestampSchema.optional(),
})

export const edgeHintSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  hint_type: z.enum(["boundary", "adversarial", "distribution_shift", "class_imbalance"]),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  details: z.unknown().optional(),
  created_at: timestampSchema.optional(),
})

export const dashboardStatsSchema = z.object({
  total_projects: z.number().int(),
  models_analyzed: z.number().int(),
  failures_flagged: z.number().int(),
  avg_accuracy: z.number(),
})

export type Project = z.infer<typeof projectSchema>
export type ProjectForm = z.infer<typeof projectFormSchema>
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>
export type Upload = z.infer<typeof uploadSchema>
export type ModelAsset = z.infer<typeof modelAssetSchema>
export type ModelSummary = z.infer<typeof modelSummarySchema>
export type Evaluation = z.infer<typeof evaluationSchema>
export type FailureSample = z.infer<typeof failureSampleSchema>
export type EdgeHint = z.infer<typeof edgeHintSchema>

export type DashboardStats = {
  total_projects: number
  models_analyzed: number
  failures_flagged: number
  avg_accuracy: number
}
