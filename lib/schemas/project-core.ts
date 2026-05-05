// LEGACY: not used in the ephemeral flow
import { z } from "zod"

export const ALLOWED_MODEL_EXTENSIONS = [".onnx", ".tflite"] as const
export const MAX_MODEL_UPLOAD_BYTES = 250 * 1024 * 1024

const timestampSchema = z.string().datetime({ offset: true })

export const projectSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Project name is required").max(128),
  description: z.string().max(512).optional().default(""),
  model_type: z.enum(["pytorch", "tensorflow", "onnx", "other"]).default("pytorch"),
  model_format: z.enum(["onnx", "tflite"]).optional().nullable(),
  status: z.enum(["draft", "uploading", "analyzing", "complete", "failed"]).default("draft"),
  active_model_asset_id: z.string().uuid().optional().nullable(),
  last_opened_at: timestampSchema.optional().nullable(),
  is_demo: z.boolean().optional().default(false),
  created_at: timestampSchema.optional(),
  updated_at: timestampSchema.optional(),
})

export const projectFormSchema = projectSchema.pick({
  name: true,
  description: true,
  model_type: true,
})

export const projectUpdateSchema = projectFormSchema.partial().extend({
  status: projectSchema.shape.status.optional(),
  model_format: projectSchema.shape.model_format.optional(),
  active_model_asset_id: projectSchema.shape.active_model_asset_id.optional(),
  last_opened_at: projectSchema.shape.last_opened_at.optional(),
})

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

export type Project = z.infer<typeof projectSchema>
export type ProjectForm = z.infer<typeof projectFormSchema>
export type ProjectUpdate = z.infer<typeof projectUpdateSchema>
export type Upload = z.infer<typeof uploadSchema>
