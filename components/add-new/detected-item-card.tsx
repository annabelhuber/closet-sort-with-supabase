"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  confirmDetectedItemAction,
  discardDetectedItemAction,
  updateDetectedItemAction,
} from "@/app/(authenticated)/add-new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatGarmentColor,
  GARMENT_COLORS,
  resolveGarmentColor,
} from "@/lib/constants/garment-colors";
import type { DetectedItem } from "@/types/database";

type DetectedItemCardProps = {
  item: DetectedItem;
  imageUrl: string;
  onDiscard: () => void;
  onSaved: () => void;
};

export function DetectedItemCard({
  item,
  imageUrl,
  onDiscard,
  onSaved,
}: DetectedItemCardProps) {
  const router = useRouter();
  const [fields, setFields] = useState({
    name: item.name ?? "",
    brand: item.brand ?? "",
    size: item.size ?? "",
    color: resolveGarmentColor(item.color, item.suggested_color),
    category: item.category ?? item.suggested_category ?? "",
    notes: item.notes ?? "",
  });
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const persistFields = () => {
    startTransition(async () => {
      await updateDetectedItemAction(item.id, fields);
    });
  };

  const saveToCloset = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await confirmDetectedItemAction(
          item.id,
          fields,
          rotationDegrees,
        );
        onSaved();
        if (result.sessionComplete) {
          router.push("/view-closet");
        }
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Failed to save item to closet.",
        );
      }
    });
  };

  const discard = () => {
    startTransition(async () => {
      await discardDetectedItemAction(item.id);
      onDiscard();
    });
  };

  const rotateClockwise = () => {
    setRotationDegrees((current) => (current + 90) % 360);
  };

  const textFields = [
    ["name", "Name"],
    ["brand", "Brand"],
    ["size", "Size"],
    ["category", "Category"],
    ["notes", "Notes"],
  ] as const;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-md bg-muted">
          <img
            src={imageUrl}
            alt={fields.category || "Detected clothing item"}
            className="max-h-full max-w-full object-contain transition-transform duration-200"
            style={{ transform: `rotate(${rotationDegrees}deg)` }}
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={rotateClockwise}
          disabled={isPending}
        >
          Rotate ↻
        </Button>
      </div>
      <div className="grid gap-3">
        {textFields.map(([key, label]) => (
          <div key={key} className="grid gap-1">
            <Label htmlFor={`${item.id}-${key}`}>{label}</Label>
            <Input
              id={`${item.id}-${key}`}
              value={fields[key]}
              onChange={(event) =>
                setFields((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))
              }
              onBlur={persistFields}
            />
          </div>
        ))}

        <div className="grid gap-1">
          <Label htmlFor={`${item.id}-color`}>Color</Label>
          <select
            id={`${item.id}-color`}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={fields.color}
            onChange={(event) => {
              const color = event.target.value;
              setFields((current) => ({ ...current, color }));
              startTransition(async () => {
                await updateDetectedItemAction(item.id, {
                  ...fields,
                  color,
                });
              });
            }}
          >
            {GARMENT_COLORS.map((color) => (
              <option key={color} value={color}>
                {formatGarmentColor(color)}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" onClick={saveToCloset} disabled={isPending}>
          {isPending ? "Saving..." : "Save"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={discard}
          disabled={isPending}
        >
          Discard
        </Button>
      </div>
    </div>
  );
}
