export const BUCKETS = {
  source: "source_photos",
  processed: "processed_photos",
  display: "display_photos",
  tag: "tag_photos",
} as const;

const SOURCE_EXTENSIONS = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

export type SourceImageMimeType = keyof typeof SOURCE_EXTENSIONS;

export function extensionFromMimeType(mimeType: string) {
  return SOURCE_EXTENSIONS[mimeType as SourceImageMimeType] ?? null;
}

export function sourcePhotoPath(
  userId: string,
  sessionId: string,
  extension = "jpg",
) {
  return `${userId}/${sessionId}/source.${extension}`;
}

export function processedPhotoPath(
  userId: string,
  sessionId: string,
  itemId: string,
) {
  return `${userId}/${sessionId}/${itemId}.png`;
}

export function displayPhotoPath(userId: string, clothingItemId: string) {
  return `${userId}/${clothingItemId}/display.png`;
}

export function tagPhotoPath(
  userId: string,
  sessionId: string,
  itemId: string,
) {
  return `${userId}/${sessionId}/${itemId}-tag.jpg`;
}
