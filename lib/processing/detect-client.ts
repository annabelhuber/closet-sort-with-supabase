type DetectionPoint = { x: number; y: number };

type DetectionResultItem = {
  id: string;
  processed_image_path: string;
  suggested_category: string | null;
  suggested_color: string | null;
  detection_confidence: number | null;
};

type PreviewResultItem = {
  image_base64: string;
  suggested_category: string | null;
  suggested_color: string | null;
  detection_confidence: number | null;
};

async function postToProcessor(
  path: string,
  body: Record<string, unknown>,
) {
  const baseUrl = process.env.IMAGE_PROCESSOR_URL;
  const apiKey = process.env.IMAGE_PROCESSOR_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Image processor environment variables are not configured.");
  }

  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = { detail: text };
    }
  }

  if (!response.ok) {
    const detail =
      payload &&
      typeof payload === "object" &&
      "detail" in payload &&
      typeof (payload as { detail: unknown }).detail === "string"
        ? (payload as { detail: string }).detail
        : text || "Image detection request failed.";
    throw new Error(detail);
  }

  return payload;
}

export async function triggerDetection({
  jobId,
  sessionId,
  userId,
  sourcePath,
}: {
  jobId: string;
  sessionId: string;
  userId: string;
  sourcePath: string;
}) {
  return postToProcessor("/v1/detect", {
    job_id: jobId,
    session_id: sessionId,
    user_id: userId,
    source_path: sourcePath,
  }) as Promise<{
    ok: boolean;
    item_count: number;
    items: DetectionResultItem[];
  }>;
}

export async function triggerRedetection({
  jobId,
  sessionId,
  userId,
  sourcePath,
  points,
  replaceItemId,
  sensitivity = 50,
}: {
  jobId: string;
  sessionId: string;
  userId: string;
  sourcePath: string;
  points: DetectionPoint[];
  replaceItemId?: string | null;
  sensitivity?: number;
}) {
  return postToProcessor("/v1/redetect", {
    job_id: jobId,
    session_id: sessionId,
    user_id: userId,
    source_path: sourcePath,
    region: { points },
    replace_item_id: replaceItemId ?? null,
    sensitivity,
  }) as Promise<{
    ok: boolean;
    item_count: number;
    items: DetectionResultItem[];
    replaced_item_id?: string | null;
  }>;
}

export async function triggerRedetectPreview({
  sessionId,
  userId,
  sourcePath,
  points,
  sensitivity = 50,
}: {
  sessionId: string;
  userId: string;
  sourcePath: string;
  points: DetectionPoint[];
  sensitivity?: number;
}) {
  return postToProcessor("/v1/redetect/preview", {
    session_id: sessionId,
    user_id: userId,
    source_path: sourcePath,
    region: { points },
    sensitivity,
  }) as Promise<{
    ok: boolean;
    item_count: number;
    items: PreviewResultItem[];
  }>;
}
