"use client";

import { useState } from "react";

import { ClothingItemCard } from "@/components/closet/clothing-item-card";
import type { ClothingItem } from "@/types/database";

type ClosetGridItem = {
  item: ClothingItem;
  imageUrl: string;
};

export function ClosetItemsGrid({
  items,
  initialLocationSuggestions,
}: {
  items: ClosetGridItem[];
  initialLocationSuggestions: string[];
}) {
  const [locationSuggestions, setLocationSuggestions] = useState(
    initialLocationSuggestions,
  );

  const rememberLocation = (location: string) => {
    setLocationSuggestions((current) => {
      if (current.includes(location)) {
        return current;
      }
      return [...current, location].sort((a, b) => a.localeCompare(b));
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map(({ item, imageUrl }) => (
        <ClothingItemCard
          key={item.id}
          item={item}
          imageUrl={imageUrl}
          locationSuggestions={locationSuggestions}
          onLocationCommit={rememberLocation}
        />
      ))}
    </div>
  );
}
