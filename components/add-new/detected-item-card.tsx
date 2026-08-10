"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  confirmDetectedItemAction,
  discardDetectedItemAction,
  updateDetectedItemAction,
} from "@/app/(authenticated)/add-new/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GarmentCategorySelect } from "@/components/ui/garment-category-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationInput } from "@/components/ui/location-input";
import { RotatableImage } from "@/components/ui/rotatable-image";
import { resolveGarmentCategory } from "@/lib/constants/garment-categories";
import {
  formatGarmentColor,
  GARMENT_COLORS,
  resolveGarmentColor,
} from "@/lib/constants/garment-colors";
import type { DetectedItem } from "@/types/database";

type DetectedItemCardProps = {
  item: DetectedItem;
  imageUrl: string;
  locationSuggestions: string[];
  onLocationCommit?: (location: string) => void;
  onDiscard: () => void;
  onSaved: () => void;
};

export function DetectedItemCard({
  item,
  imageUrl,
  locationSuggestions,
  onLocationCommit,
  onDiscard,
  onSaved,
}: DetectedItemCardProps) {
  const router = useRouter();
  const [fields, setFields] = useState({
    name: item.name ?? "",
    brand: item.brand ?? "",
    size: item.size ?? "",
    color: resolveGarmentColor(item.color, item.suggested_color),
    category: resolveGarmentCategory(item.category, item.suggested_category),
    notes: item.notes ?? "",
    location: item.location ?? "",
    laundry: item.laundry ?? false,
  });
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const persistFields = (nextFields = fields) => {
    startTransition(async () => {
      await updateDetectedItemAction(item.id, nextFields);
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
        if (fields.location.trim()) {
          onLocationCommit?.(fields.location.trim());
        }
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
    ["notes", "Notes"],
  ] as const;

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <div className="space-y-2">
        <RotatableImage
          src={imageUrl}
          alt={fields.category || "Detected clothing item"}
          rotationDegrees={rotationDegrees}
        />
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
              onBlur={() => persistFields()}
            />
          </div>
        ))}

        <div className="grid gap-1">
          <Label htmlFor={`${item.id}-category`}>Category</Label>
          <GarmentCategorySelect
            id={`${item.id}-category`}
            value={fields.category}
            disabled={isPending}
            onChange={(category) => {
              const nextFields = { ...fields, category };
              setFields(nextFields);
              persistFields(nextFields);
            }}
          />
        </div>

        <div className="grid gap-1">
          <Label htmlFor={`${item.id}-color`}>Color</Label>
          <select
            id={`${item.id}-color`}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={fields.color}
            onChange={(event) => {
              const color = event.target.value;
              const nextFields = { ...fields, color };
              setFields(nextFields);
              persistFields(nextFields);
            }}
          >
            {GARMENT_COLORS.map((color) => (
              <option key={color} value={color}>
                {formatGarmentColor(color)}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-1">
          <Label htmlFor={`${item.id}-location`}>Location</Label>
          <LocationInput
            id={`${item.id}-location`}
            value={fields.location}
            suggestions={locationSuggestions}
            disabled={isPending}
            onChange={(location) =>
              setFields((current) => ({ ...current, location }))
            }
            onBlur={() => {
              persistFields();
              if (fields.location.trim()) {
                onLocationCommit?.(fields.location.trim());
              }
            }}
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Checkbox
            id={`${item.id}-laundry`}
            checked={fields.laundry}
            disabled={isPending}
            onCheckedChange={(checked) => {
              const laundry = checked === true;
              const nextFields = { ...fields, laundry };
              setFields(nextFields);
              persistFields(nextFields);
            }}
          />
          <Label htmlFor={`${item.id}-laundry`}>In the Laundry?</Label>
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
