import { createClient } from "@/lib/supabase/server";
import { DETECTED_ITEM_STATUS } from "@/lib/processing/constants";
import type { DetectedItem } from "@/types/database";

export async function getDetectedItemsBySession(
  sessionId: string,
  userId: string,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("detected_items")
    .select("*")
    .eq("upload_session_id", sessionId)
    .eq("user_id", userId)
    .neq("status", DETECTED_ITEM_STATUS.DISCARDED)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as DetectedItem[];
}

export async function updateDetectedItem(
  itemId: string,
  userId: string,
  updates: Partial<DetectedItem>,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("detected_items")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", itemId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function discardDetectedItem(itemId: string, userId: string) {
  await updateDetectedItem(itemId, userId, {
    status: DETECTED_ITEM_STATUS.DISCARDED,
  });
}

export async function confirmDetectedItems(itemIds: string[], userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("detected_items")
    .update({
      status: DETECTED_ITEM_STATUS.CONFIRMED,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .in("id", itemIds);

  if (error) {
    throw new Error(error.message);
  }
}
