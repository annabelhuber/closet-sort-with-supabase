"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getClothingItem, updateClothingItem } from "@/lib/db/clothing";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS } from "@/lib/storage/paths";
import { getSignedUrl } from "@/lib/storage/signed-url";
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
  const normalizedRotation = ((Number(rotationDegrees) % 360) + 360) % 360;
  if (normalizedRotation === 0) {
    return false;
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
    .ensureAlpha()
    .rotate(normalizedRotation, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  // Prefer update() for an existing object; fall back to remove + upload.
  const { error: updateError } = await admin.storage
    .from(BUCKETS.display)
    .update(displayImagePath, outputBuffer, {
      contentType: "image/png",
      upsert: true,
    });

  if (updateError) {
    await admin.storage.from(BUCKETS.display).remove([displayImagePath]);
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

  return true;
}

export async function updateClothingItemAction(input: {
  itemId: string;
  fields: Record<string, string | null | undefined>;
  rotationDegrees?: number;
}) {
  const { id: userId } = await requireUser();
  const parsed = updateDetectedItemSchema.parse(input.fields);
  const rotationDegrees = Number(input.rotationDegrees ?? 0);

  const item = await getClothingItem(input.itemId, userId);
  if (!item) {
    throw new Error("Closet item not found.");
  }

  await updateClothingItem(input.itemId, userId, parsed);
  const didRotate = await rotateDisplayImage(
    item.display_image_path,
    rotationDegrees,
  );

  // Touch the row so caches/revalidation see a change even for rotate-only saves.
  if (didRotate) {
    await updateClothingItem(input.itemId, userId, parsed);
  }

  revalidatePath("/view-closet");

  const imageUrl = await getSignedUrl(
    BUCKETS.display,
    item.display_image_path,
  );

  return {
    imageUrl,
    rotated: didRotate,
  };
}
