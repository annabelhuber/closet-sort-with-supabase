"use client";

import {
  formatGarmentCategory,
  GARMENT_CATEGORY_GROUPS,
  isGarmentCategory,
} from "@/lib/constants/garment-categories";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

type GarmentCategorySelectProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export function GarmentCategorySelect({
  id,
  value,
  onChange,
  disabled,
}: GarmentCategorySelectProps) {
  const includeLegacyValue = Boolean(value) && !isGarmentCategory(value);

  return (
    <select
      id={id}
      className={selectClassName}
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">Select a category</option>
      {includeLegacyValue ? (
        <option value={value}>{formatGarmentCategory(value)}</option>
      ) : null}
      {GARMENT_CATEGORY_GROUPS.map((group) => (
        <optgroup key={group.coarse} label={group.label}>
          <option value={group.coarse}>{group.label}</option>
          {group.categories.map((category) => (
            <option key={`${group.coarse}-${category}`} value={category}>
              {formatGarmentCategory(category)}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
