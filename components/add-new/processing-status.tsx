"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { getProcessingState, startDetectionForSession } from "@/app/(authenticated)/add-new/actions";
import { JOB_STATUS, SESSION_STATUS } from "@/lib/processing/constants";

export function ProcessingStatus({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("Detecting clothing in your photo...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const startDetection = async () => {
      try {
        await startDetectionForSession(sessionId);
      } catch (startError) {
        if (!cancelled) {
          setError(
            startError instanceof Error
              ? startError.message
              : "Failed to start detection.",
          );
        }
      }
    };

    startDetection();

    const poll = async () => {
      try {
        const state = await getProcessingState(sessionId);

        if (cancelled) return;

        if (
          state.sessionStatus === SESSION_STATUS.READY_FOR_REVIEW &&
          state.job?.status === JOB_STATUS.SUCCEEDED
        ) {
          router.replace(`/add-new/review/${sessionId}`);
          return;
        }

        if (
          state.sessionStatus === SESSION_STATUS.FAILED ||
          state.job?.status === JOB_STATUS.FAILED
        ) {
          setError(
            state.job?.error_message ??
              state.sessionError ??
              "Processing failed.",
          );
          return;
        }

        if (state.job?.status === JOB_STATUS.RUNNING) {
          setMessage("Processing your photo...");
        }
      } catch (pollError) {
        if (!cancelled) {
          setError(
            pollError instanceof Error
              ? pollError.message
              : "Failed to check processing status.",
          );
        }
      }
    };

    poll();
    const interval = setInterval(poll, 2000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [router, sessionId]);

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-500">{error}</p>
        <a href="/add-new" className="text-sm underline">
          Try again
        </a>
      </div>
    );
  }

  return <p className="text-sm text-muted-foreground">{message}</p>;
}
