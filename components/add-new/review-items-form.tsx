"use client";

import { useMemo, useState, useTransition } from "react";

import { confirmDetectedItemsAction } from "@/app/(authenticated)/add-new/actions";
import { DetectedItemCard } from "@/components/add-new/detected-item-card";
import { RegionRedrawDialog } from "@/components/add-new/region-redraw-dialog";
import { Button } from "@/components/ui/button";
import type { DetectedItem } from "@/types/database";

type ReviewItem = DetectedItem & { imageUrl: string };

export function ReviewItemsForm({
  sessionId,
  sourceImageUrl,
  initialItems,
  initialLocationSuggestions,
}: {
  sessionId: string;
  sourceImageUrl: string;
  initialItems: ReviewItem[];
  initialLocationSuggestions: string[];
}) {
  const startedEmpty = initialItems.length === 0;
  const [items, setItems] = useState(initialItems);
  const [locationSuggestions, setLocationSuggestions] = useState(
    initialLocationSuggestions,
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [redrawOpen, setRedrawOpen] = useState(startedEmpty);
  const [replaceItemId, setReplaceItemId] = useState<string | null>(null);
  const [initialOutlinePoints, setInitialOutlinePoints] = useState<
    Array<{ x: number; y: number }> | null
  >(null);
  const [redrawMode, setRedrawMode] = useState<"fix" | "add" | "no_detection">(
    startedEmpty ? "no_detection" : "fix",
  );

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

  const openFixCrop = (itemId: string) => {
    const item = items.find((entry) => entry.id === itemId);
    setReplaceItemId(itemId);
    setInitialOutlinePoints(item?.outline_points ?? null);
    setRedrawMode("fix");
    setRedrawOpen(true);
  };

  const openAddMissing = (mode: "add" | "no_detection" = "add") => {
    setReplaceItemId(null);
    setInitialOutlinePoints(null);
    setRedrawMode(mode);
    setRedrawOpen(true);
  };

  const handleRedetectComplete = (result: {
    replacedItemId: string | null;
    items: ReviewItem[];
  }) => {
    setItems((current) => {
      const withoutReplaced = result.replacedItemId
        ? current.filter((entry) => entry.id !== result.replacedItemId)
        : current;
      const existingIds = new Set(withoutReplaced.map((entry) => entry.id));
      const additions = result.items.filter(
        (entry) => !existingIds.has(entry.id),
      );
      return [...withoutReplaced, ...additions];
    });
    setError(null);
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

  return (
    <div className="space-y-6">
      {visibleItems.length === 0 ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {startedEmpty
              ? "Nothing was detected automatically. Outline the clothing on the photo and adjust sensitivity to create a crop."
              : "No items left to review. Draw around a missing item, upload another photo, or view your closet."}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={() =>
                openAddMissing(startedEmpty ? "no_detection" : "add")
              }
            >
              {startedEmpty ? "Outline clothing" : "Add missing item"}
            </Button>
            <Button asChild>
              <a href="/add-new">Back to upload</a>
            </Button>
            <Button asChild variant="outline">
              <a href="/view-closet">View closet</a>
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {visibleItems.map((item) => (
              <DetectedItemCard
                key={item.id}
                item={item}
                imageUrl={item.imageUrl}
                locationSuggestions={locationSuggestions}
                onLocationCommit={rememberLocation}
                onFixCrop={() => openFixCrop(item.id)}
                onDiscard={() => removeItem(item.id)}
                onSaved={() => removeItem(item.id)}
              />
            ))}
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => openAddMissing("add")}
            >
              Add missing item
            </Button>
            <Button type="button" onClick={confirmAll} disabled={isPending}>
              {isPending ? "Adding to closet..." : "Add all to closet"}
            </Button>
          </div>
        </>
      )}

      <RegionRedrawDialog
        open={redrawOpen}
        sessionId={sessionId}
        sourceImageUrl={sourceImageUrl}
        replaceItemId={replaceItemId}
        initialOutlinePoints={initialOutlinePoints}
        initialFullFrame={redrawMode === "no_detection"}
        mode={redrawMode}
        onClose={() => setRedrawOpen(false)}
        onComplete={handleRedetectComplete}
      />
    </div>
  );
}
