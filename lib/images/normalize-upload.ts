import { heicTo } from "heic-to/next";

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

function jpegFileFromBlob(blob: Blob, originalName: string) {
  const baseName = originalName.replace(/\.(heic|heif)$/i, "") || "photo";
  return new File([blob], `${baseName}.jpg`, { type: "image/jpeg" });
}

/**
 * Safari (and some Chromium builds) can decode HEIC natively.
 * Prefer that when available — it avoids WASM/libheif edge cases.
 */
async function convertHeicWithNativeDecoder(file: File): Promise<File | null> {
  if (typeof createImageBitmap !== "function") {
    return null;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d");
    if (!context) {
      bitmap.close();
      return null;
    }

    context.drawImage(bitmap, 0, 0);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), "image/jpeg", 0.92);
    });

    if (!blob) {
      return null;
    }

    return jpegFileFromBlob(blob, file.name);
  } catch {
    return null;
  }
}

async function convertHeicWithLib(file: File): Promise<File> {
  const blob = await heicTo({
    blob: file,
    type: "image/jpeg",
    quality: 0.92,
  });

  return jpegFileFromBlob(blob, file.name);
}

function formatConversionError(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return "Could not convert this HEIC/HEIF image. Try exporting it as JPEG first.";
}

/**
 * Convert HEIC/HEIF to a JPEG File for upload + YOLO processing.
 * Returns the original file unchanged when it is not HEIC.
 */
export async function normalizeImageFileForUpload(file: File): Promise<File> {
  if (!isHeicFile(file)) {
    return file;
  }

  const native = await convertHeicWithNativeDecoder(file);
  if (native) {
    return native;
  }

  try {
    return await convertHeicWithLib(file);
  } catch (error) {
    throw new Error(formatConversionError(error));
  }
}
