"use client";

import { useState, useTransition } from "react";

import {
  discardDetectedItemAction,
  updateDetectedItemAction,
} from "@/app/(authenticated)/add-new/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    color: item.color ?? item.suggested_color ?? "",
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

  return (
    <div className="rounded-lg border p-4 space-y-4">
      <img
        src={imageUrl}
        alt={fields.category || "Detected clothing item"}
        className="h-48 w-full rounded-md object-contain bg-muted"
      />
      <div className="grid gap-3">
        {(
          [
            ["name", "Name"],
            ["brand", "Brand"],
            ["size", "Size"],
            ["color", "Color"],
            ["category", "Category"],
            ["notes", "Notes"],
          ] as const
        ).map(([key, label]) => (
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
