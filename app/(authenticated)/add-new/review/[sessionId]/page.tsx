import { redirect } from "next/navigation";

import { ReviewItemsForm } from "@/components/add-new/review-items-form";
import { getClothingLocations } from "@/lib/db/clothing";
import { getDetectedItemsBySession } from "@/lib/db/detected-items";
import { getLatestJobForSession } from "@/lib/db/processing-jobs";
import { getUploadSession } from "@/lib/db/upload-sessions";
import {
  JOB_STATUS,
  JOB_TYPES,
  SESSION_STATUS,
} from "@/lib/processing/constants";
import { BUCKETS } from "@/lib/storage/paths";
import { getSignedUrl } from "@/lib/storage/signed-url";
import { createClient } from "@/lib/supabase/server";

type ReviewPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ReviewPage({ params }: ReviewPageProps) {
  const { sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const session = await getUploadSession(sessionId, user.id);

  if (!session) {
    redirect("/add-new");
  }

  if (session.status === SESSION_STATUS.PROCESSING) {
    redirect(`/add-new/processing/${sessionId}`);
  }

  if (session.status === SESSION_STATUS.FAILED) {
    redirect("/add-new");
  }

  const job = await getLatestJobForSession(
    sessionId,
    user.id,
    JOB_TYPES.DETECT_GARMENTS,
  );

  if (!job || job.status !== JOB_STATUS.SUCCEEDED) {
    redirect(`/add-new/processing/${sessionId}`);
  }

  const [items, locationSuggestions] = await Promise.all([
    getDetectedItemsBySession(sessionId, user.id),
    getClothingLocations(user.id),
  ]);
  const reviewItems = await Promise.all(
    items.map(async (item) => ({
      ...item,
      imageUrl: await getSignedUrl(BUCKETS.processed, item.processed_image_path),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Review detected items</h1>
        <p className="mt-2 text-muted-foreground">
          Edit the suggested details for each item, then add them to your closet.
        </p>
      </div>
      <ReviewItemsForm
        sessionId={sessionId}
        initialItems={reviewItems}
        initialLocationSuggestions={locationSuggestions}
      />
    </div>
  );
}
