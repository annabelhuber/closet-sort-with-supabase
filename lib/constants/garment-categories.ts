export const GARMENT_CATEGORY_GROUPS = [
  {
    coarse: "top",
    label: "Top",
    categories: ["tee", "tank", "blouse", "sweater", "button_up", "athletic"],
  },
  {
    coarse: "bottom",
    label: "Bottom",
    categories: [
      "pants",
      "jeans",
      "slacks",
      "shorts",
      "skirt",
      "leggings",
      "athletic",
    ],
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

export type BroadCategory =
  (typeof GARMENT_CATEGORY_GROUPS)[number]["coarse"];

export const GARMENT_COARSE_CATEGORIES = GARMENT_CATEGORY_GROUPS.map(
  (group) => group.coarse,
) as BroadCategory[];

const FINE_TO_PARENTS = new Map<string, BroadCategory[]>();
for (const group of GARMENT_CATEGORY_GROUPS) {
  for (const fine of group.categories) {
    const existing = FINE_TO_PARENTS.get(fine) ?? [];
    existing.push(group.coarse);
    FINE_TO_PARENTS.set(fine, existing);
  }
}

/** Fine categories that appear under more than one broad group. */
export const AMBIGUOUS_FINE_CATEGORIES = new Set(
  [...FINE_TO_PARENTS.entries()]
    .filter(([, parents]) => parents.length > 1)
    .map(([fine]) => fine),
);

export const GARMENT_CATEGORIES = [...FINE_TO_PARENTS.keys()];

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

export function isBroadCategory(value: string): value is BroadCategory {
  return (GARMENT_COARSE_CATEGORIES as string[]).includes(value);
}

export function isFineCategory(value: string) {
  return FINE_TO_PARENTS.has(value);
}

export function getParentCategories(fine: string): BroadCategory[] {
  return FINE_TO_PARENTS.get(fine) ?? [];
}

export function getParentCategory(
  fine: string,
  preferredBroad?: string | null,
): BroadCategory | null {
  const parents = getParentCategories(fine);
  if (parents.length === 0) return null;
  if (preferredBroad && parents.includes(preferredBroad as BroadCategory)) {
    return preferredBroad as BroadCategory;
  }
  return parents[0] ?? null;
}

export function getSubcategories(broad: string): string[] {
  const group = GARMENT_CATEGORY_GROUPS.find((g) => g.coarse === broad);
  return group ? [...group.categories] : [];
}

/**
 * Encode a Category dropdown option.
 * Ambiguous fines (e.g. athletic) include the parent so the optgroup is preserved.
 */
export function encodeCategoryOption(coarse: string, fine?: string) {
  if (!fine) return coarse;
  if (AMBIGUOUS_FINE_CATEGORIES.has(fine)) {
    return `${fine}@${coarse}`;
  }
  return fine;
}

export function decodeCategoryOption(value: string): {
  selection: string;
  preferredBroad: BroadCategory | null;
} {
  if (!value) {
    return { selection: "", preferredBroad: null };
  }
  const at = value.indexOf("@");
  if (at > 0) {
    const fine = value.slice(0, at);
    const broad = value.slice(at + 1);
    if (isFineCategory(fine) && isBroadCategory(broad)) {
      return { selection: fine, preferredBroad: broad };
    }
  }
  return {
    selection: value,
    preferredBroad: isBroadCategory(value) ? value : null,
  };
}

export type GarmentTaxonomy = {
  /** Always the broad category when known. */
  category: string;
  /** Fine type, or empty when only broad is selected. */
  subcategory: string;
  /** Value shown in the Category select (child if set, else parent). */
  uiCategory: string;
  showSubcategory: boolean;
};

/**
 * Split stored fields (or a single legacy category) into taxonomy.
 * Prefer explicit subcategory; otherwise treat category as either broad or fine.
 */
export function resolveGarmentTaxonomy(
  category?: string | null,
  subcategory?: string | null,
  suggestedCategory?: string | null,
): GarmentTaxonomy {
  const sub = normalizeToken(subcategory);
  const cat = normalizeToken(category);
  const suggested = normalizeToken(suggestedCategory);

  if (sub && isFineCategory(sub)) {
    const parent =
      getParentCategory(sub, cat) ??
      getParentCategory(sub, suggested) ??
      getParentCategory(sub);
    return {
      category: parent ?? cat,
      subcategory: sub,
      uiCategory: encodeCategoryOption(parent ?? cat, sub),
      showSubcategory: false,
    };
  }

  if (cat && isFineCategory(cat)) {
    // Legacy: fine stored only in category.
    const parent = getParentCategory(cat, suggested) ?? getParentCategory(cat);
    return {
      category: parent ?? "",
      subcategory: cat,
      uiCategory: encodeCategoryOption(parent ?? "", cat),
      showSubcategory: false,
    };
  }

  if (cat && isBroadCategory(cat)) {
    return {
      category: cat,
      subcategory: "",
      uiCategory: cat,
      showSubcategory: true,
    };
  }

  if (suggested && isBroadCategory(suggested)) {
    return {
      category: suggested,
      subcategory: "",
      uiCategory: suggested,
      showSubcategory: true,
    };
  }

  if (suggested && isFineCategory(suggested)) {
    const parent = getParentCategory(suggested);
    return {
      category: parent ?? "",
      subcategory: suggested,
      uiCategory: encodeCategoryOption(parent ?? "", suggested),
      showSubcategory: false,
    };
  }

  return {
    category: cat || suggested,
    subcategory: "",
    uiCategory: cat || suggested,
    showSubcategory: false,
  };
}

/**
 * Apply a Category dropdown change.
 */
export function applyCategorySelection(
  rawValue: string,
  previous?: Pick<GarmentTaxonomy, "category" | "subcategory">,
): GarmentTaxonomy {
  const { selection, preferredBroad } = decodeCategoryOption(rawValue);

  if (!selection) {
    return {
      category: "",
      subcategory: "",
      uiCategory: "",
      showSubcategory: false,
    };
  }

  if (isBroadCategory(selection)) {
    return {
      category: selection,
      subcategory: "",
      uiCategory: selection,
      showSubcategory: true,
    };
  }

  if (isFineCategory(selection)) {
    const parent =
      preferredBroad ??
      getParentCategory(selection, previous?.category) ??
      getParentCategory(selection);
    return {
      category: parent ?? "",
      subcategory: selection,
      uiCategory: encodeCategoryOption(parent ?? "", selection),
      showSubcategory: false,
    };
  }

  // Unknown / legacy free text — keep as category only.
  return {
    category: selection,
    subcategory: "",
    uiCategory: selection,
    showSubcategory: false,
  };
}

export function applySubcategorySelection(
  broad: string,
  subcategory: string,
): GarmentTaxonomy {
  if (!subcategory) {
    return {
      category: broad,
      subcategory: "",
      uiCategory: broad,
      showSubcategory: isBroadCategory(broad),
    };
  }
  const parent =
    getParentCategory(subcategory, broad) ?? getParentCategory(subcategory);
  return {
    category: parent ?? broad,
    subcategory,
    uiCategory: encodeCategoryOption(parent ?? broad, subcategory),
    showSubcategory: false,
  };
}

/**
 * Prefer an existing fine/coarse category; otherwise fall back to coarse suggestion.
 * @deprecated Prefer resolveGarmentTaxonomy for split category/subcategory.
 */
export function resolveGarmentCategory(
  ...candidates: Array<string | null | undefined>
): string {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = normalizeToken(candidate);
    if (ALL_CATEGORY_VALUES.has(normalized)) {
      return normalized;
    }
  }
  return "";
}

function normalizeToken(value?: string | null) {
  if (!value) return "";
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}
