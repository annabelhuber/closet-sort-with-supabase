import { createClient } from "@/lib/supabase/server";
import type { ClothingItem, Database } from "@/types/database";

type ClothingInsert = Database["public"]["Tables"]["clothing_items"]["Insert"];

export async function createClothingItem(item: ClothingInsert) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clothing_items")
    .insert(item)
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create clothing item.");
  }

  return data as ClothingItem;
}

export async function getClothingItems(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clothing_items")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as ClothingItem[];
}
