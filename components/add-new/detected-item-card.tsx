"use client";

import { useState, useTransition } from "react";

import {
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
};

export function DetectedItemCard({
  item,
  imageUrl,
  onDiscard,
}: DetectedItemCardProps) {
  const [fields, setFields] = useState({
    name: item.name ?? "",
    brand: item.brand ?? "",
    size: item.size ?? "",
    color: resolveGarmentColor(item.color, item.suggested_color),
    category: item.category ?? item.suggested_category ?? "",
    notes: item.notes ?? "",
  });
  const [isPending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      await updateDetectedItemAction(item.id, fields);
    });
  };

  const discard = () => {
    startTransition(async () => {
      await discardDetectedItemAction(item.id);
      onDiscard();
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
    <div className="rounded-lg border p-4 space-y-4">
      <img
        src={imageUrl}
        alt={fields.category || "Detected clothing item"}
        className="h-48 w-full rounded-md object-contain bg-muted"
      />
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
              onBlur={save}
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
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={save} disabled={isPending}>
          Save
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
