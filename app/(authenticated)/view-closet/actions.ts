"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getClothingItem, updateClothingItem } from "@/lib/db/clothing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/storage/paths";
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

async function rotateDisplayImage(
  displayImagePath: string,
  rotationDegrees: number,
) {
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;
  if (normalizedRotation === 0) {
    return;
  }

  const admin = createAdminClient();
  const { data: file, error: downloadError } = await admin.storage
    .from(BUCKETS.display)
    .download(displayImagePath);

  if (downloadError || !file) {
    throw new Error(
      downloadError?.message ?? "Failed to download closet image.",
    );
  }

  const sharp = (await import("sharp")).default;
  const sourceBuffer = Buffer.from(await file.arrayBuffer());
  const outputBuffer = await sharp(sourceBuffer)
    .rotate(normalizedRotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const { error: uploadError } = await admin.storage
    .from(BUCKETS.display)
    .upload(displayImagePath, outputBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }
}

export async function updateClothingItemAction(
  itemId: string,
  input: Record<string, string | null | undefined>,
  rotationDegrees = 0,
) {
  const { id: userId } = await requireUser();
  const parsed = updateDetectedItemSchema.parse(input);

  const item = await getClothingItem(itemId, userId);
  if (!item) {
    throw new Error("Closet item not found.");
  }

  await updateClothingItem(itemId, userId, parsed);
  await rotateDisplayImage(item.display_image_path, rotationDegrees);

  revalidatePath("/view-closet");
}
