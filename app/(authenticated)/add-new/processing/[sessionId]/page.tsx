import { redirect } from "next/navigation";

import { ProcessingStatus } from "@/components/add-new/processing-status";
import { getUploadSession } from "@/lib/db/upload-sessions";
import { getLatestJobForSession } from "@/lib/db/processing-jobs";
import {
  JOB_STATUS,
  JOB_TYPES,
  SESSION_STATUS,
} from "@/lib/processing/constants";
import { createClient } from "@/lib/supabase/server";

type ProcessingPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function ProcessingPage({ params }: ProcessingPageProps) {
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

  if (session.status === SESSION_STATUS.READY_FOR_REVIEW) {
    redirect(`/add-new/review/${sessionId}`);
  }

  if (session.status === SESSION_STATUS.COMPLETED) {
    redirect("/view-closet");
  }

  const job = await getLatestJobForSession(
    sessionId,
    user.id,
    JOB_TYPES.DETECT_GARMENTS,
  );

  if (job?.status === JOB_STATUS.SUCCEEDED) {
    redirect(`/add-new/review/${sessionId}`);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Processing photo</h1>
      <ProcessingStatus sessionId={sessionId} />
    </div>
  );
}
