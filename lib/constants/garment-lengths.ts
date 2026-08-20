import {
  getParentCategory,
  isBroadCategory,
  isFineCategory,
  type BroadCategory,
} from "@/lib/constants/garment-categories";

export const SKIRT_DRESS_LENGTHS = ["mini", "midi", "maxi"] as const;
export const PANTS_LENGTHS = ["capri", "cropped", "regular", "long"] as const;
export const TOP_OUTERWEAR_LENGTHS = ["cropped", "regular", "long"] as const;

const SKIRT_DRESS_TYPES = new Set(["skirt", "dress"]);
const PANTS_LIKE_TYPES = new Set([
  "pants",
  "slacks",
  "jeans",
  "leggings",
  "jumpsuit",
]);

export type GarmentLength =
  | (typeof SKIRT_DRESS_LENGTHS)[number]
  | (typeof PANTS_LENGTHS)[number]
  | (typeof TOP_OUTERWEAR_LENGTHS)[number];

export function formatGarmentLength(length: string) {
  if (!length) return "";
  return length.charAt(0).toUpperCase() + length.slice(1);
}

/**
 * Length options for the current taxonomy. Athletic follows the parent broad category.
 */
export function getLengthOptions(
  category?: string | null,
  subcategory?: string | null,
): readonly string[] | null {
  const broad = resolveBroad(category, subcategory);
  const fine = (subcategory || "").trim().toLowerCase();

  if (fine && SKIRT_DRESS_TYPES.has(fine)) {
    return SKIRT_DRESS_LENGTHS;
  }

  if (fine && PANTS_LIKE_TYPES.has(fine)) {
    return PANTS_LENGTHS;
  }

  // Athletic: options come from parent broad only.
  if (fine === "athletic") {
    if (broad === "top" || broad === "outerwear") {
      return TOP_OUTERWEAR_LENGTHS;
    }
    if (broad === "bottom" || broad === "one_piece") {
      return PANTS_LENGTHS;
    }
    return null;
  }

  if (broad === "top" || broad === "outerwear") {
    return TOP_OUTERWEAR_LENGTHS;
  }

  return null;
}

export function sanitizeLength(
  length: string | null | undefined,
  category?: string | null,
  subcategory?: string | null,
): string {
  if (!length) return "";
  const options = getLengthOptions(category, subcategory);
  if (!options) return "";
  return options.includes(length) ? length : "";
}

function resolveBroad(
  category?: string | null,
  subcategory?: string | null,
): BroadCategory | null {
  const cat = (category || "").trim().toLowerCase();
  const sub = (subcategory || "").trim().toLowerCase();

  if (cat && isBroadCategory(cat)) {
    return cat;
  }
  if (sub && isFineCategory(sub)) {
    return getParentCategory(sub, cat);
  }
  if (cat && isFineCategory(cat)) {
    return getParentCategory(cat);
  }
  return null;
}
