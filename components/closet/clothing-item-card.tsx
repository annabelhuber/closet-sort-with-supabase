"use client";

import { useState, useTransition } from "react";

import { updateClothingItemAction } from "@/app/(authenticated)/view-closet/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatGarmentColor,
  GARMENT_COLORS,
  resolveGarmentColor,
} from "@/lib/constants/garment-colors";
import type { ClothingItem } from "@/types/database";

export function ClothingItemCard({
  item,
  imageUrl,
}: {
  item: ClothingItem;
  imageUrl: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [fields, setFields] = useState({
    name: item.name ?? "",
    brand: item.brand ?? "",
    size: item.size ?? "",
    color: resolveGarmentColor(item.color),
    category: item.category ?? "",
    notes: item.notes ?? "",
  });
  const [savedFields, setSavedFields] = useState(fields);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const startEditing = () => {
    setFields(savedFields);
    setError(null);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setFields(savedFields);
    setError(null);
    setIsEditing(false);
  };

  const save = () => {
    setError(null);
    startTransition(async () => {
      try {
        await updateClothingItemAction(item.id, fields);
        setSavedFields(fields);
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
    ["category", "Category"],
    ["notes", "Notes"],
  ] as const;

  return (
    <div className="rounded-lg border overflow-hidden">
      <img
        src={imageUrl}
        alt={savedFields.name || savedFields.category || "Clothing item"}
        className="h-48 w-full object-contain bg-muted"
      />
      <div className="p-3 space-y-3 text-sm">
        {isEditing ? (
          <>
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
                {savedFields.name || savedFields.category || "Untitled item"}
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
              {savedFields.category && savedFields.name ? (
                <p className="text-muted-foreground">
                  Category: {savedFields.category}
                </p>
              ) : null}
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
