import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
]);

export const updateDetectedItemSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  brand: z.string().max(200).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export function validateImageFile(file: File) {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  const looksLikeHeic =
    name.endsWith(".heic") ||
    name.endsWith(".heif") ||
    mime.includes("heic") ||
    mime.includes("heif");

  if (mime && !ALLOWED_MIME_TYPES.has(mime) && !looksLikeHeic) {
    throw new Error("Please upload a JPEG, PNG, WebP, or HEIC image.");
  }

  if (!mime && !looksLikeHeic && !/\.(jpe?g|png|webp)$/i.test(name)) {
    throw new Error("Please upload a JPEG, PNG, WebP, or HEIC image.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be 10MB or smaller.");
  }
}
