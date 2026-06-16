"use client";

import { useMemo, useState, useTransition } from "react";

import { confirmDetectedItemsAction } from "@/app/(authenticated)/add-new/actions";
import { DetectedItemCard } from "@/components/add-new/detected-item-card";
import { Button } from "@/components/ui/button";
import type { DetectedItem } from "@/types/database";

type ReviewItem = DetectedItem & { imageUrl: string };

export function ReviewItemsForm({
  sessionId,
  initialItems,
}: {
  sessionId: string;
  initialItems: ReviewItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleItems = useMemo(() => items, [items]);

  const confirm = () => {
    setError(null);
    startTransition(async () => {
      try {
        await confirmDetectedItemsAction(sessionId);
      } catch (confirmError) {
        setError(
          confirmError instanceof Error
            ? confirmError.message
            : "Failed to add items to closet.",
        );
      }
    });
  };

  if (visibleItems.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No items left to review. Upload another photo to try again.
        </p>
        <Button asChild>
          <a href="/add-new">Back to upload</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {visibleItems.map((item) => (
          <DetectedItemCard
            key={item.id}
            item={item}
            imageUrl={item.imageUrl}
            onDiscard={() =>
              setItems((current) => current.filter((entry) => entry.id !== item.id))
            }
          />
        ))}
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="button" onClick={confirm} disabled={isPending}>
        {isPending ? "Adding to closet..." : "Add to closet"}
      </Button>
    </div>
  );
}
