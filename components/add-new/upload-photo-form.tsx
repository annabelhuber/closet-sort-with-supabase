"use client";

import { useRef, useState, useTransition } from "react";

import {
  finalizeUploadSession,
  prepareUploadSession,
} from "@/app/(authenticated)/add-new/actions";
import { Button } from "@/components/ui/button";
import { isHeicFile, normalizeImageFileForUpload } from "@/lib/images/normalize-upload";
import {
  BUCKETS,
  extensionFromMimeType,
  sourcePhotoPath,
} from "@/lib/storage/paths";
import { createClient } from "@/lib/supabase/client";
import { validateImageFile } from "@/lib/validations/upload";

export function UploadPhotoForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (file: File | undefined) => {
    if (!file) return;

    setError(null);
    setStatus(null);

    startTransition(async () => {
      try {
        validateImageFile(file);

        let uploadFile = file;
        if (isHeicFile(file)) {
          setStatus("Converting HEIC to JPEG...");
          uploadFile = await normalizeImageFileForUpload(file);
        }

        const extension = extensionFromMimeType(uploadFile.type);
        if (!extension) {
          throw new Error("Please upload a JPEG, PNG, WebP, or HEIC image.");
        }

        setStatus("Preparing upload...");
        const { sessionId } = await prepareUploadSession();

        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("You must be logged in to upload a photo.");
        }

        const path = sourcePhotoPath(user.id, sessionId, extension);

        setStatus("Uploading photo...");
        const { error: uploadError } = await supabase.storage
          .from(BUCKETS.source)
          .upload(path, uploadFile, {
            contentType: uploadFile.type,
            upsert: false,
          });

        if (uploadError) {
          throw new Error(uploadError.message);
        }

        setStatus("Starting detection...");
        await finalizeUploadSession(sessionId, path);
      } catch (uploadError) {
        setStatus(null);
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Upload failed.",
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        className="hidden"
        onChange={(event) => handleSubmit(event.target.files?.[0])}
      />
      <Button
        type="button"
        disabled={isPending}
        onClick={() => inputRef.current?.click()}
      >
        {isPending ? "Uploading..." : "Upload image"}
      </Button>
      {status ? (
        <p className="text-sm text-muted-foreground">{status}</p>
      ) : null}
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
    </div>
  );
}
