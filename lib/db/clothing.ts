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

export async function getClothingItem(itemId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clothing_items")
    .select("*")
    .eq("id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ClothingItem | null) ?? null;
}

export async function getClothingLocations(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clothing_items")
    .select("location")
    .eq("user_id", userId)
    .not("location", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  const locations = new Set<string>();
  for (const row of data ?? []) {
    const location = row.location?.trim();
    if (location) {
      locations.add(location);
    }
  }

  return [...locations].sort((a, b) => a.localeCompare(b));
}

export async function updateClothingItem(
  itemId: string,
  userId: string,
  updates: Partial<
    Pick<
      ClothingItem,
      | "name"
      | "brand"
      | "size"
      | "color"
      | "category"
      | "notes"
      | "location"
      | "laundry"
    >
  >,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("clothing_items")
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
