import { z } from "zod";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const updateDetectedItemSchema = z.object({
  name: z.string().max(200).optional().nullable(),
  brand: z.string().max(200).optional().nullable(),
  size: z.string().max(50).optional().nullable(),
  color: z.string().max(50).optional().nullable(),
  category: z.string().max(100).optional().nullable(),
  notes: z.string().max(1000).optional().nullable(),
});

export function validateImageFile(file: File) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    throw new Error("Please upload a JPEG, PNG, or WebP image.");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Image must be 10MB or smaller.");
  }
}
