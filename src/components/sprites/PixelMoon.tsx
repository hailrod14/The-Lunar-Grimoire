import { PixelSprite } from "@/components/pixel/PixelSprite";

export type MoonVariant = "tide" | "sky";

/** Gold for your personal Tide, silver for the real Sky Moon — never confused. */
const PALETTES: Record<MoonVariant, Record<string, string>> = {
  tide: {
    l: "#ffd866", // lit
    h: "#fff4c2", // highlight
    s: "#e09a2c", // terminator shade
    c: "#e8ac3a", // crater
    d: "#3a2150", // dark side
    e: "#b07a1c", // dark-side rim
  },
  sky: {
    l: "#e3e9f7",
    h: "#ffffff",
    s: "#9aa9cc",
    c: "#c3cfea",
    d: "#141935",
    e: "#56648a",
  },
};

/** Crater centers and radii, in unit-disc coordinates. */
const CRATERS: [number, number, number][] = [
  [-0.32, -0.18, 0.17],
  [0.28, 0.32, 0.14],
  [0.12, -0.48, 0.1],
  [-0.12, 0.5, 0.1],
  [0.45, -0.1, 0.08],
];

/**
 * Builds pixel rows for a moon. `phase` runs 0 → 1:
 * 0 = new/dark, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter.
 * Lighting is computed on a sphere, so every in-between phase looks right.
 */
export function moonRows(phase: number, n: number): string[] {
  const r = n / 2;
  const theta = phase * 2 * Math.PI;
  const lx = Math.sin(theta); // +x lit while waxing (right side, northern hemisphere)
  const lz = -Math.cos(theta); // toward the viewer at full
  const rimInner = ((r - 1) / r) ** 2;
  const rows: string[] = [];

  for (let y = 0; y < n; y++) {
    let row = "";
    for (let x = 0; x < n; x++) {
      const dx = (x + 0.5 - r) / r;
      const dy = (y + 0.5 - r) / r;
      const d2 = dx * dx + dy * dy;
      if (d2 > 1) {
        row += ".";
        continue;
      }
      const z = Math.sqrt(1 - d2);
      const brightness = dx * lx + z * lz;
      if (brightness <= 0) {
        row += d2 > rimInner ? "e" : "d";
        continue;
      }
      const inCrater = CRATERS.some(([cx, cy, cr]) => (dx - cx) ** 2 + (dy - cy) ** 2 < cr * cr);
      if (brightness < 0.18) row += "s";
      else if (inCrater) row += "c";
      else if (dx < -0.2 && dy < -0.35 && brightness > 0.6) row += "h";
      else row += "l";
    }
    rows.push(row);
  }
  return rows;
}

type PixelMoonProps = {
  phase: number;
  variant: MoonVariant;
  /** Rendered size in CSS px. */
  size?: number;
  /** Pixel grid resolution. Larger = smoother moon. */
  resolution?: number;
  title?: string;
  className?: string;
};

export function PixelMoon({ phase, variant, size = 64, resolution = 20, title, className }: PixelMoonProps) {
  return (
    <PixelSprite
      rows={moonRows(phase, resolution)}
      palette={PALETTES[variant]}
      size={size}
      title={title}
      className={className}
    />
  );
}
