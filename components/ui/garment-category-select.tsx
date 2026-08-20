"use client";

import {
  encodeCategoryOption,
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
  const knownValues = new Set<string>();
  for (const group of GARMENT_CATEGORY_GROUPS) {
    knownValues.add(group.coarse);
    for (const category of group.categories) {
      knownValues.add(encodeCategoryOption(group.coarse, category));
    }
  }
  const includeLegacyValue = Boolean(value) && !knownValues.has(value) && !isGarmentCategory(value);

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
          {group.categories.map((category) => {
            const optionValue = encodeCategoryOption(group.coarse, category);
            return (
              <option key={optionValue} value={optionValue}>
                {formatGarmentCategory(category)}
              </option>
            );
          })}
        </optgroup>
      ))}
    </select>
  );
}
