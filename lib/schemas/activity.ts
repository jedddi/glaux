import { z } from "zod"

const timestampSchema = z.string().datetime({ offset: true })

export const activityEventSchema = z.object({
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  event_type: z.enum([
    "model_uploaded",
    "model_parse_started",
    "model_parse_completed",
    "model_parse_failed",
    "inspector_viewed",
    "evaluator_viewed",
    "evaluation_started",
    "evaluation_completed",
    "evaluation_failed",
    "evaluation_dataset_uploaded",
    "failures_viewed",
    "failure_analysis_started",
    "failure_analysis_completed",
    "failure_analysis_failed",
    "inspection_job_started",
    "inspection_job_completed",
    "inspection_job_failed",
    "evaluation_job_started",
    "evaluation_job_completed",
    "evaluation_job_failed",
  ]),
  payload: z.record(z.string(), z.unknown()).default({}),
  created_at: timestampSchema.optional(),
})

export type ActivityEvent = z.infer<typeof activityEventSchema>
