import { createClient } from "@/lib/supabase/server";
import { SESSION_STATUS } from "@/lib/processing/constants";
import type { UploadSession } from "@/types/database";

export async function createUploadSession(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upload_sessions")
    .insert({
      user_id: userId,
      status: SESSION_STATUS.UPLOADED,
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create upload session.");
  }

  return data as UploadSession;
}

export async function getUploadSession(sessionId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("upload_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as UploadSession;
}

export async function updateUploadSession(
  sessionId: string,
  updates: Partial<UploadSession>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("upload_sessions")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) {
    throw new Error(error.message);
  }
}
