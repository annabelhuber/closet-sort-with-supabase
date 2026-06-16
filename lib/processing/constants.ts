export const JOB_TYPES = {
  DETECT_GARMENTS: "detect_garments",
  OCR_TAG: "ocr_tag",
} as const;

export const JOB_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  SUCCEEDED: "succeeded",
  FAILED: "failed",
} as const;

export const SESSION_STATUS = {
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  READY_FOR_REVIEW: "ready_for_review",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const DETECTED_ITEM_STATUS = {
  DETECTED: "detected",
  CONFIRMED: "confirmed",
  DISCARDED: "discarded",
} as const;
