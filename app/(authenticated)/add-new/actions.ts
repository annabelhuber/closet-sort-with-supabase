"use server";

import { redirect } from "next/navigation";

import { confirmDetectedItems, discardDetectedItem, getDetectedItem, getDetectedItemsBySession, updateDetectedItem } from "@/lib/db/detected-items";
import { createClothingItem } from "@/lib/db/clothing";
import {
  createProcessingJob,
  getLatestJobForSession,
  updateProcessingJob,
} from "@/lib/db/processing-jobs";
import {
  createUploadSession,
  getUploadSession,
  updateUploadSession,
} from "@/lib/db/upload-sessions";
import {
  DETECTED_ITEM_STATUS,
  JOB_STATUS,
  JOB_TYPES,
  SESSION_STATUS,
} from "@/lib/processing/constants";
import { triggerDetection } from "@/lib/processing/detect-client";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { BUCKETS, displayPhotoPath } from "@/lib/storage/paths";
import {
  updateDetectedItemSchema,
  type UpdateItemFields,
} from "@/lib/validations/upload";
import type { DetectedItem } from "@/types/database";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/");
  }

  return {
    id: user.id,
    supabase,
  };
}

export async function prepareUploadSession() {
  const { id: userId } = await requireUser();
  const session = await createUploadSession(userId);
  return { sessionId: session.id };
}

function assertValidSourcePhotoPath(
  userId: string,
  sessionId: string,
  path: string,
) {
  const prefix = `${userId}/${sessionId}/source.`;
  if (!path.startsWith(prefix)) {
    throw new Error("Invalid source photo path.");
  }

  const extension = path.slice(prefix.length);
  if (!["jpg", "png", "webp"].includes(extension)) {
    throw new Error("Invalid source photo extension.");
  }
}

export async function finalizeUploadSession(
  sessionId: string,
  sourcePhotoPathValue: string,
) {
  const { id: userId, supabase } = await requireUser();
  assertValidSourcePhotoPath(userId, sessionId, sourcePhotoPathValue);

  const session = await getUploadSession(sessionId, userId);
  if (!session) {
    throw new Error("Upload session not found.");
  }

  const { data: uploadedFile, error: downloadError } = await supabase.storage
    .from(BUCKETS.source)
    .download(sourcePhotoPathValue);

  if (downloadError || !uploadedFile) {
    await updateUploadSession(sessionId, {
      status: SESSION_STATUS.FAILED,
      error_message:
        downloadError?.message ?? "Uploaded photo could not be found.",
    });
    throw new Error(
      downloadError?.message ?? "Uploaded photo could not be found.",
    );
  }

  await updateUploadSession(sessionId, {
    source_image_path: sourcePhotoPathValue,
    status: SESSION_STATUS.PROCESSING,
    error_message: null,
  });

  await createProcessingJob({
    userId,
    uploadSessionId: sessionId,
    jobType: JOB_TYPES.DETECT_GARMENTS,
    payload: {
      source_path: sourcePhotoPathValue,
      bucket: BUCKETS.source,
    },
  });

  redirect(`/add-new/processing/${sessionId}`);
}

export async function startDetectionForSession(sessionId: string) {
  const { id: userId } = await requireUser();
  const session = await getUploadSession(sessionId, userId);

  if (!session?.source_image_path) {
    throw new Error("Upload session is missing a source photo.");
  }

  const job = await getLatestJobForSession(
    sessionId,
    userId,
    JOB_TYPES.DETECT_GARMENTS,
  );

  if (!job || job.status !== JOB_STATUS.QUEUED) {
    return { started: false };
  }

  try {
    await triggerDetection({
      jobId: job.id,
      sessionId,
      userId,
      sourcePath: session.source_image_path,
    });
    return { started: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start detection.";

    await updateProcessingJob(job.id, {
      status: JOB_STATUS.FAILED,
      error_message: message,
    });
    await updateUploadSession(sessionId, {
      status: SESSION_STATUS.FAILED,
      error_message: message,
    });
    throw new Error(message);
  }
}

export async function getProcessingState(sessionId: string) {
  const { id: userId } = await requireUser();
  const session = await getUploadSession(sessionId, userId);

  if (!session) {
    throw new Error("Upload session not found.");
  }

  const job = await getLatestJobForSession(
    sessionId,
    userId,
    JOB_TYPES.DETECT_GARMENTS,
  );

  return {
    sessionStatus: session.status,
    sessionError: session.error_message,
    job: job
      ? {
          id: job.id,
          status: job.status,
          error_message: job.error_message,
          result: job.result,
        }
      : null,
  };
}

export async function updateDetectedItemAction(
  itemId: string,
  input: UpdateItemFields,
) {
  const { id: userId } = await requireUser();
  const parsed = updateDetectedItemSchema.parse(input);
  await updateDetectedItem(itemId, userId, parsed);
}

export async function discardDetectedItemAction(itemId: string) {
  const { id: userId } = await requireUser();
  await discardDetectedItem(itemId, userId);
}

async function createClothingItemFromDetected(
  userId: string,
  item: DetectedItem,
  rotationDegrees: number,
) {

  const admin = createAdminClient();
  const clothingItemId = crypto.randomUUID();
  const displayPath = displayPhotoPath(userId, clothingItemId);

  const { data: processedFile, error: downloadError } = await admin.storage
    .from(BUCKETS.processed)
    .download(item.processed_image_path);

  if (downloadError || !processedFile) {
    throw new Error(
      downloadError?.message ?? "Failed to download processed image.",
    );
  }

  const sharp = (await import("sharp")).default;
  const sourceBuffer = Buffer.from(await processedFile.arrayBuffer());
  const normalizedRotation = ((rotationDegrees % 360) + 360) % 360;
  const outputBuffer =
    normalizedRotation === 0
      ? sourceBuffer
      : await sharp(sourceBuffer)
          .rotate(normalizedRotation, {
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          })
          .png()
          .toBuffer();

  const { error: uploadError } = await admin.storage
    .from(BUCKETS.display)
    .upload(displayPath, outputBuffer, {
      contentType: "image/png",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  await createClothingItem({
    id: clothingItemId,
    user_id: userId,
    detected_item_id: item.id,
    display_image_path: displayPath,
    name: item.name ?? null,
    brand: item.brand ?? null,
    size: item.size ?? null,
    color: item.color ?? item.suggested_color ?? null,
    category: item.category ?? item.suggested_category ?? null,
    notes: item.notes ?? null,
    location: item.location ?? null,
    laundry: item.laundry ?? false,
  });

  return item.id;
}

export async function confirmDetectedItemAction(
  itemId: string,
  input: UpdateItemFields,
  rotationDegrees = 0,
) {
  const { id: userId } = await requireUser();
  const parsed = updateDetectedItemSchema.parse(input);
  await updateDetectedItem(itemId, userId, parsed);

  const item = await getDetectedItem(itemId, userId);
  if (!item || item.status !== DETECTED_ITEM_STATUS.DETECTED) {
    throw new Error("This item is not available to save.");
  }

  const updatedItem = {
    ...item,
    ...parsed,
    color: parsed.color ?? item.color,
    category: parsed.category ?? item.category,
    location: parsed.location ?? item.location,
    laundry: parsed.laundry ?? item.laundry ?? false,
  };

  await createClothingItemFromDetected(userId, updatedItem, rotationDegrees);
  await confirmDetectedItems([itemId], userId);

  const remaining = await getDetectedItemsBySession(
    item.upload_session_id,
    userId,
  );

  if (remaining.length === 0) {
    await updateUploadSession(item.upload_session_id, {
      status: SESSION_STATUS.COMPLETED,
      error_message: null,
    });
    return { sessionComplete: true as const };
  }

  return { sessionComplete: false as const };
}

export async function confirmDetectedItemsAction(sessionId: string) {
  const { id: userId } = await requireUser();
  const session = await getUploadSession(sessionId, userId);

  if (!session || session.status !== SESSION_STATUS.READY_FOR_REVIEW) {
    throw new Error("This upload session is not ready to confirm.");
  }

  const items = await getDetectedItemsBySession(sessionId, userId);

  if (items.length === 0) {
    throw new Error("No items to add to your closet.");
  }

  const confirmedIds: string[] = [];

  for (const item of items) {
    await createClothingItemFromDetected(userId, item, 0);
    confirmedIds.push(item.id);
  }

  await confirmDetectedItems(confirmedIds, userId);
  await updateUploadSession(sessionId, {
    status: SESSION_STATUS.COMPLETED,
    error_message: null,
  });

  redirect("/view-closet");
}
