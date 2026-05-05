import { z } from "zod"

const timestampSchema = z.string().datetime({ offset: true })

export const edgeHintSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  hint_type: z.enum(["boundary", "adversarial", "distribution_shift", "class_imbalance"]),
  description: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  details: z.unknown().optional(),
  created_at: timestampSchema.optional(),
})

export type EdgeHint = z.infer<typeof edgeHintSchema>
