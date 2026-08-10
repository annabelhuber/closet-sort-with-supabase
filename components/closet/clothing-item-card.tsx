"use client";

import { useState, useTransition } from "react";

import { updateClothingItemAction } from "@/app/(authenticated)/view-closet/actions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { GarmentCategorySelect } from "@/components/ui/garment-category-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LocationInput } from "@/components/ui/location-input";
import { RotatableImage } from "@/components/ui/rotatable-image";
import {
  formatGarmentCategory,
  resolveGarmentCategory,
} from "@/lib/constants/garment-categories";
import {
  formatGarmentColor,
  GARMENT_COLORS,
  resolveGarmentColor,
} from "@/lib/constants/garment-colors";
import type { ClothingItem } from "@/types/database";

export function ClothingItemCard({
  item,
  imageUrl,
  locationSuggestions,
  onLocationCommit,
}: {
  item: ClothingItem;
  imageUrl: string;
  locationSuggestions: string[];
  onLocationCommit?: (location: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayImageUrl, setDisplayImageUrl] = useState(imageUrl);
  const [imageVersion, setImageVersion] = useState(0);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [fields, setFields] = useState({
    name: item.name ?? "",
    brand: item.brand ?? "",
    size: item.size ?? "",
    color: resolveGarmentColor(item.color),
    category: resolveGarmentCategory(item.category),
    notes: item.notes ?? "",
    location: item.location ?? "",
    laundry: item.laundry ?? false,
  });
  const [savedFields, setSavedFields] = useState(fields);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startEditing = () => {
    setFields(savedFields);
    setRotationDegrees(0);
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFields(savedFields);
    setRotationDegrees(0);
    setError(null);
    setIsEditing(false);
  };

  const rotateClockwise = () => {
    setRotationDegrees((current) => (current + 90) % 360);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await updateClothingItemAction({
          itemId: item.id,
          fields,
          rotationDegrees,
        });
        setSavedFields(fields);
        if (fields.location.trim()) {
          onLocationCommit?.(fields.location.trim());
        }
        setRotationDegrees(0);
        setDisplayImageUrl(result.imageUrl);
        setImageVersion((version) => version + 1);
        setIsEditing(false);
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "Failed to update item.",
        );
      }
    });
  };

  const textFields = [
    ["name", "Name"],
    ["brand", "Brand"],
    ["size", "Size"],
    ["notes", "Notes"],
  ] as const;

  return (
    <div className="rounded-lg border">
      <div className="p-3 pb-0">
        <RotatableImage
          key={`${item.id}-${imageVersion}`}
          src={displayImageUrl}
          alt={savedFields.name || savedFields.category || "Clothing item"}
          rotationDegrees={isEditing ? rotationDegrees : 0}
        />
      </div>
      <div className="p-3 space-y-3 text-sm">
        {isEditing ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={rotateClockwise}
              disabled={isPending}
            >
              Rotate ↻
            </Button>
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
                  />
                </div>
              ))}
              <div className="grid gap-1">
                <Label htmlFor={`${item.id}-category`}>Category</Label>
                <GarmentCategorySelect
                  id={`${item.id}-category`}
                  value={fields.category}
                  disabled={isPending}
                  onChange={(category) =>
                    setFields((current) => ({ ...current, category }))
                  }
                />
              </div>
              <div className="grid gap-1">
                <Label htmlFor={`${item.id}-color`}>Color</Label>
                <select
                  id={`${item.id}-color`}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={fields.color}
                  onChange={(event) =>
                    setFields((current) => ({
                      ...current,
                      color: event.target.value,
                    }))
                  }
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
                />
              </div>
              <div className="flex items-center gap-2 pt-1">
                <Checkbox
                  id={`${item.id}-laundry`}
                  checked={fields.laundry}
                  disabled={isPending}
                  onCheckedChange={(checked) =>
                    setFields((current) => ({
                      ...current,
                      laundry: checked === true,
                    }))
                  }
                />
                <Label htmlFor={`${item.id}-laundry`}>In the Laundry?</Label>
              </div>
            </div>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={save} disabled={isPending}>
                {isPending ? "Saving..." : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={cancelEditing}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-1">
              <p className="font-medium">
                {savedFields.name ||
                  formatGarmentCategory(savedFields.category) ||
                  "Untitled item"}
              </p>
              {savedFields.brand ? (
                <p className="text-muted-foreground">{savedFields.brand}</p>
              ) : null}
              {savedFields.size ? (
                <p className="text-muted-foreground">Size: {savedFields.size}</p>
              ) : null}
              {savedFields.color ? (
                <p className="text-muted-foreground">
                  Color: {formatGarmentColor(savedFields.color)}
                </p>
              ) : null}
              {savedFields.category ? (
                <p className="text-muted-foreground">
                  Category: {formatGarmentCategory(savedFields.category)}
                </p>
              ) : null}
              {savedFields.location ? (
                <p className="text-muted-foreground">
                  Location: {savedFields.location}
                </p>
              ) : null}
              <p className="text-muted-foreground">
                {savedFields.laundry ? "In the laundry" : "Not in the laundry"}
              </p>
              {savedFields.notes ? (
                <p className="text-muted-foreground">{savedFields.notes}</p>
              ) : null}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={startEditing}>
              Edit
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
