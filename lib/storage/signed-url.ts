import { createAdminClient } from "@/lib/supabase/admin";

export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn = 3600,
) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message ?? "Failed to create signed URL.");
  }

  return data.signedUrl;
}
