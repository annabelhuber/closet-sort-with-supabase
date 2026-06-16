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
  const baseUrl = process.env.IMAGE_PROCESSOR_URL;
  const apiKey = process.env.IMAGE_PROCESSOR_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("Image processor environment variables are not configured.");
  }

  const response = await fetch(`${baseUrl}/v1/detect`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify({
      job_id: jobId,
      session_id: sessionId,
      user_id: userId,
      source_path: sourcePath,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Image detection request failed.");
  }
}
