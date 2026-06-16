import { createClient } from "@/lib/supabase/server";
import { JOB_STATUS } from "@/lib/processing/constants";
import type { Json, ProcessingJob } from "@/types/database";

export async function createProcessingJob({
  userId,
  uploadSessionId,
  jobType,
  payload,
  detectedItemId,
}: {
  userId: string;
  uploadSessionId: string;
  jobType: string;
  payload: Json;
  detectedItemId?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_jobs")
    .insert({
      user_id: userId,
      upload_session_id: uploadSessionId,
      detected_item_id: detectedItemId ?? null,
      job_type: jobType,
      status: JOB_STATUS.QUEUED,
      payload,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create processing job.");
  }

  return data as ProcessingJob;
}

export async function getLatestJobForSession(
  sessionId: string,
  userId: string,
  jobType: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("processing_jobs")
    .select("*")
    .eq("upload_session_id", sessionId)
    .eq("user_id", userId)
    .eq("job_type", jobType)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ProcessingJob | null) ?? null;
}

export async function updateProcessingJob(
  jobId: string,
  updates: Partial<ProcessingJob>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("processing_jobs")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  if (error) {
    throw new Error(error.message);
  }
}
