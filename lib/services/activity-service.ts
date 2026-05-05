// LEGACY: not used in the ephemeral flow
import { createServerSupabase } from "@/lib/supabase/server"
import { activityEventSchema } from "@/lib/schemas/activity"
import type { ActivityEvent } from "@/lib/schemas/activity"

export async function logActivity(
  projectId: string,
  eventType: ActivityEvent["event_type"],
  payload?: Record<string, unknown>
): Promise<ActivityEvent> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from("activity_events")
    .insert({
      project_id: projectId,
      event_type: eventType,
      payload: payload ?? {},
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return activityEventSchema.parse(data)
}
