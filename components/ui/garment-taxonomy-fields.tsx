"use client";

import { GarmentCategorySelect } from "@/components/ui/garment-category-select";
import { Label } from "@/components/ui/label";
import {
  applyCategorySelection,
  applySubcategorySelection,
  formatGarmentCategory,
  getSubcategories,
  isBroadCategory,
  type GarmentTaxonomy,
} from "@/lib/constants/garment-categories";
import {
  formatGarmentLength,
  getLengthOptions,
  sanitizeLength,
} from "@/lib/constants/garment-lengths";

const selectClassName =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export type TaxonomyFormSlice = {
  category: string;
  subcategory: string;
  length: string;
  uiCategory: string;
};

type GarmentTaxonomyFieldsProps = {
  idPrefix: string;
  fields: TaxonomyFormSlice;
  disabled?: boolean;
  onChange: (next: TaxonomyFormSlice) => void;
};

export function taxonomyFromResolved(
  taxonomy: GarmentTaxonomy,
  length?: string | null,
): TaxonomyFormSlice {
  const category = taxonomy.category;
  const subcategory = taxonomy.subcategory;
  return {
    category,
    subcategory,
    uiCategory: taxonomy.uiCategory,
    length: sanitizeLength(length, category, subcategory),
  };
}

export function GarmentTaxonomyFields({
  idPrefix,
  fields,
  disabled,
  onChange,
}: GarmentTaxonomyFieldsProps) {
  const subOptions = isBroadCategory(fields.category)
    ? getSubcategories(fields.category)
    : [];
  // Show Sub-category whenever Category is showing a broad parent (even after a
  // sub is chosen). Hide it only when Category is displaying a fine/child value.
  const showSubcategory =
    isBroadCategory(fields.category) &&
    fields.uiCategory === fields.category &&
    subOptions.length > 0;

  const lengthOptions = getLengthOptions(fields.category, fields.subcategory);

  const emit = (taxonomy: GarmentTaxonomy, length: string) => {
    onChange({
      category: taxonomy.category,
      subcategory: taxonomy.subcategory,
      uiCategory: taxonomy.uiCategory,
      length: sanitizeLength(length, taxonomy.category, taxonomy.subcategory),
    });
  };

  return (
    <>
      <div className="grid gap-1">
        <Label htmlFor={`${idPrefix}-category`}>Category</Label>
        <GarmentCategorySelect
          id={`${idPrefix}-category`}
          value={fields.uiCategory}
          disabled={disabled}
          onChange={(value) => {
            const taxonomy = applyCategorySelection(value, fields);
            emit(taxonomy, fields.length);
          }}
        />
      </div>

      {showSubcategory ? (
        <div className="grid gap-1">
          <Label htmlFor={`${idPrefix}-subcategory`}>Sub-category</Label>
          <select
            id={`${idPrefix}-subcategory`}
            className={selectClassName}
            value={
              subOptions.includes(fields.subcategory) ? fields.subcategory : ""
            }
            disabled={disabled}
            onChange={(event) => {
              const taxonomy = applySubcategorySelection(
                fields.category,
                event.target.value,
              );
              emit(taxonomy, fields.length);
            }}
          >
            <option value="">Select a sub-category</option>
            {subOptions.map((sub) => (
              <option key={sub} value={sub}>
                {formatGarmentCategory(sub)}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      {lengthOptions ? (
        <div className="grid gap-1">
          <Label htmlFor={`${idPrefix}-length`}>Length</Label>
          <select
            id={`${idPrefix}-length`}
            className={selectClassName}
            value={fields.length}
            disabled={disabled}
            onChange={(event) =>
              onChange({
                ...fields,
                length: event.target.value,
              })
            }
          >
            <option value="">Select a length (optional)</option>
            {lengthOptions.map((length) => (
              <option key={length} value={length}>
                {formatGarmentLength(length)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </>
  );
}
