export const GARMENT_CATEGORY_GROUPS = [
  {
    coarse: "top",
    label: "Top",
    categories: ["tee", "tank", "blouse", "sweater", "button_up", "athletic"],
  },
  {
    coarse: "bottom",
    label: "Bottom",
    categories: ["jeans", "slacks", "shorts", "skirt", "leggings", "athletic"],
  },
  {
    coarse: "one_piece",
    label: "One piece",
    categories: ["dress", "romper", "jumpsuit", "athletic"],
  },
  {
    coarse: "outerwear",
    label: "Outerwear",
    categories: ["jacket", "cardigan", "blazer", "coat"],
  },
  {
    coarse: "footwear",
    label: "Footwear",
    categories: ["boots", "sneakers", "sandals", "heels"],
  },
  {
    coarse: "accessory",
    label: "Accessory",
    categories: ["jewelry", "belt"],
  },
] as const;

export const GARMENT_CATEGORIES = [
  ...new Set(GARMENT_CATEGORY_GROUPS.flatMap((group) => group.categories)),
] as string[];

export const GARMENT_COARSE_CATEGORIES = GARMENT_CATEGORY_GROUPS.map(
  (group) => group.coarse,
);

const ALL_CATEGORY_VALUES = new Set<string>([
  ...GARMENT_CATEGORIES,
  ...GARMENT_COARSE_CATEGORIES,
]);

export function formatGarmentCategory(category: string) {
  if (!category) return "";
  return category
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isGarmentCategory(value: string) {
  return ALL_CATEGORY_VALUES.has(value);
}

/**
 * Prefer an existing fine/coarse category; otherwise fall back to coarse suggestion.
 */
export function resolveGarmentCategory(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = candidate.trim().toLowerCase().replace(/\s+/g, "_");
    if (ALL_CATEGORY_VALUES.has(normalized)) {
      return normalized;
    }
  }
  return "";
}
