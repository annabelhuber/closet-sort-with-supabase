import heic2any from "heic2any";

const HEIC_MIME_TYPES = new Set([
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export function isHeicFile(file: File) {
  const mime = file.type.toLowerCase();
  if (HEIC_MIME_TYPES.has(mime)) {
    return true;
  }

  const name = file.name.toLowerCase();
  return name.endsWith(".heic") || name.endsWith(".heif");
}

/**
 * Convert HEIC/HEIF to a JPEG File for upload + YOLO processing.
 * Returns the original file unchanged when it is not HEIC.
 */
export async function normalizeImageFileForUpload(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  const converted = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 0.92,
  });

  const blob = Array.isArray(converted) ? converted[0] : converted;
  if (!blob) {
    throw new Error("Failed to convert HEIC image.");
  }

  const baseName = file.name.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}
