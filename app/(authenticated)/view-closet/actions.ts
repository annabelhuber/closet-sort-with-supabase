"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { updateClothingItem } from "@/lib/db/clothing";
import { createClient } from "@/lib/supabase/server";
import { updateDetectedItemSchema } from "@/lib/validations/upload";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/");
  }

  return { id: user.id };
}

export async function updateClothingItemAction(
  itemId: string,
  input: Record<string, string | null | undefined>,
) {
  const { id: userId } = await requireUser();
  const parsed = updateDetectedItemSchema.parse(input);
  await updateClothingItem(itemId, userId, parsed);
  revalidatePath("/view-closet");
}
