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
  initialLocationSuggestions,
}: {
  sessionId: string;
  initialItems: ReviewItem[];
  initialLocationSuggestions: string[];
}) {
  const [items, setItems] = useState(initialItems);
  const [locationSuggestions, setLocationSuggestions] = useState(
    initialLocationSuggestions,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleItems = useMemo(() => items, [items]);

  const removeItem = (itemId: string) => {
    setItems((current) => current.filter((entry) => entry.id !== itemId));
  };

  const rememberLocation = (location: string) => {
    setLocationSuggestions((current) => {
      if (current.includes(location)) {
        return current;
      }
      return [...current, location].sort((a, b) => a.localeCompare(b));
    });
  };

  const confirmAll = () => {
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
          No items left to review. Upload another photo or view your closet.
        </p>
        <div className="flex gap-2">
          <Button asChild>
            <a href="/add-new">Back to upload</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/view-closet">View closet</a>
          </Button>
        </div>
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
            locationSuggestions={locationSuggestions}
            onLocationCommit={rememberLocation}
            onDiscard={() => removeItem(item.id)}
            onSaved={() => removeItem(item.id)}
          />
        ))}
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <Button type="button" onClick={confirmAll} disabled={isPending}>
        {isPending ? "Adding to closet..." : "Add all to closet"}
      </Button>
    </div>
  );
}
