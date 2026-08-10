export const GARMENT_COLORS = [
  "black",
  "white",
  "gray",
  "brown",
  "beige",
  "cream",
  "red",
  "pink",
  "orange",
  "yellow",
  "green",
  "blue",
  "navy",
  "purple",
  "maroon",
  "multicolor",
] as const;

export type GarmentColor = (typeof GARMENT_COLORS)[number];

/** RGB centroids matching image_detection/color_utils.py */
export const GARMENT_COLOR_RGB: Record<
  Exclude<GarmentColor, "multicolor">,
  [number, number, number]
> = {
  black: [20, 20, 20],
  white: [245, 245, 245],
  gray: [140, 140, 140],
  brown: [110, 70, 40],
  beige: [210, 190, 160],
  cream: [245, 235, 210],
  red: [190, 35, 35],
  pink: [230, 130, 170],
  orange: [230, 130, 40],
  yellow: [230, 200, 50],
  green: [50, 140, 70],
  blue: [50, 100, 190],
  navy: [25, 40, 90],
  purple: [120, 60, 160],
  maroon: [110, 30, 45],
};

export function formatGarmentColor(color: string) {
  if (!color) return "";
  return color
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isGarmentColor(value: string): value is GarmentColor {
  return (GARMENT_COLORS as readonly string[]).includes(value);
}

function parseHexRgb(hex: string): [number, number, number] | null {
  const cleaned = hex.trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return null;
  }
  return [
    parseInt(cleaned.slice(0, 2), 16),
    parseInt(cleaned.slice(2, 4), 16),
    parseInt(cleaned.slice(4, 6), 16),
  ];
}

function rgbToHsv(
  r: number,
  g: number,
  b: number,
): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = ((gn - bn) / delta) % 6;
    else if (max === gn) h = (bn - rn) / delta + 2;
    else h = (rn - gn) / delta + 4;
    h *= 60;
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  return { h, s, v: max };
}

function isPinkishRgb(r: number, g: number, b: number) {
  return r >= 140 && b > g + 25 && b >= 80;
}

/** Map a hex string to the nearest named garment color via HSV rules. */
export function nearestGarmentColorFromHex(hex: string): GarmentColor {
  const rgb = parseHexRgb(hex);
  if (!rgb) {
    return "gray";
  }

  const [r, g, b] = rgb;
  const { h, s, v } = rgbToHsv(r, g, b);
  const s255 = s * 255;
  const v255 = v * 255;
  const h179 = h / 2;

  // Chromatic first when saturation is meaningful
  if (s255 >= 50) {
    if (v255 <= 100 && h179 >= 95 && h179 <= 130) return "navy";
    if (v255 <= 95 && (h179 <= 10 || h179 >= 168)) return "maroon";
    if (v255 <= 100 && h179 >= 10 && h179 <= 30) return "brown";

    if (s255 < 80 && h179 >= 10 && h179 <= 35 && v255 >= 150) {
      return v255 >= 195 ? "cream" : "beige";
    }

    if (h179 <= 10 || h179 >= 168) {
      if (isPinkishRgb(r, g, b) && v255 >= 115) return "pink";
      if (v255 < 95 || (v255 < 115 && s255 > 110)) return "maroon";
      return "red";
    }
    if (h179 <= 18) return v255 < 130 ? "brown" : "orange";
    if (h179 <= 32) {
      if (v255 < 115 && s255 >= 60) return "brown";
      if (s255 < 95 && v255 > 165) return v255 < 220 ? "beige" : "cream";
      return "yellow";
    }
    if (h179 <= 85) return "green";
    if (h179 <= 95) return "blue";
    if (h179 <= 130) return v255 < 120 ? "navy" : "blue";
    if (h179 <= 152) {
      if (v255 >= 165 && r >= 160 && b > g + 20) return "pink";
      return "purple";
    }
    if (h179 <= 168) return v255 < 115 && r < 140 ? "purple" : "pink";
    if (isPinkishRgb(r, g, b) && v255 >= 115) return "pink";
    if (v255 < 95) return "maroon";
    return "red";
  }

  // Neutrals
  if (v255 <= 125) return "black";
  if (v255 >= 185) {
    if (h179 >= 15 && h179 <= 40 && s255 >= 18) return "cream";
    return "white";
  }
  if (v255 >= 160) {
    if (h179 >= 12 && h179 <= 40 && s255 >= 15) {
      return v255 >= 175 ? "cream" : "beige";
    }
    if (s255 < 35) return "white";
    return "gray";
  }
  if (h179 >= 12 && h179 <= 40 && s255 >= 20) {
    if (v255 >= 140) return "beige";
    if (v255 >= 80) return "brown";
  }
  return "gray";
}

/**
 * Resolve a stored color / suggestion into a dropdown value.
 * Prefers named colors; maps legacy hex codes to the nearest name.
 */
export function resolveGarmentColor(
  ...candidates: Array<string | null | undefined>
): GarmentColor {
  for (const candidate of candidates) {
    if (!candidate) continue;
    const normalized = candidate.trim().toLowerCase();
    if (isGarmentColor(normalized)) {
      return normalized;
    }
    if (normalized.startsWith("#") || /^[0-9a-f]{6}$/i.test(normalized)) {
      return nearestGarmentColorFromHex(
        normalized.startsWith("#") ? normalized : `#${normalized}`,
      );
    }
  }
  return "gray";
}
