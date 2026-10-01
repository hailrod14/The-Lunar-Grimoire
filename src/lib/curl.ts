/*
 * Page-curl geometry. A corner of the page is lifted and dragged across;
 * the fold is the perpendicular bisector between where the corner started
 * and where it is now. Everything past the fold lifts off the page and is
 * mirrored across the fold to become the flap (the back of the paper).
 */

export type Pt = { x: number; y: number };
export type TurnDirection = "forward" | "backward";

export type CurlFrame = {
  /** The part of the old page still lying flat. */
  page: Pt[];
  /** The lifted part, folded over: the back of the paper. */
  flap: Pt[];
  /** Points from the fold toward the lifted corner (for shading). */
  normal: Pt;
};

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Keep the part of a convex polygon where `keep(point) <= 0` (Sutherland–Hodgman, one edge). */
function clip(poly: Pt[], side: (p: Pt) => number): Pt[] {
  const out: Pt[] = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const sa = side(a);
    const sb = side(b);
    if (sa <= 0) out.push(a);
    if (sa <= 0 !== sb <= 0) {
      const k = sa / (sa - sb);
      out.push({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k });
    }
  }
  return out;
}

/**
 * The curl at progress `t` (0 → 1) on a `w`×`h` page. Forward turns lift the
 * bottom-right corner and carry it left; backward turns mirror that.
 */
export function curlFrame(w: number, h: number, t: number, dir: TurnDirection): CurlFrame {
  const rect: Pt[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  const forward = dir === "forward";
  if (t <= 0) return { page: rect, flap: [], normal: { x: forward ? 1 : -1, y: 0 } };

  const corner = { x: forward ? w : 0, y: h };
  const travel = 2 * w * easeInOut(Math.min(t, 1));
  // The corner arcs upward a little as it travels, like a hand lifting it.
  const lift = Math.sin(Math.PI * Math.min(t, 1)) * h * 0.18;
  const tip = { x: forward ? w - travel : travel, y: h - lift };

  const normal = { x: corner.x - tip.x, y: corner.y - tip.y };
  const mid = { x: (corner.x + tip.x) / 2, y: (corner.y + tip.y) / 2 };
  const side = (p: Pt) => (p.x - mid.x) * normal.x + (p.y - mid.y) * normal.y;
  const lenSq = normal.x ** 2 + normal.y ** 2;
  const reflect = (p: Pt): Pt => {
    const k = (2 * side(p)) / lenSq;
    return { x: p.x - k * normal.x, y: p.y - k * normal.y };
  };

  const page = clip(rect, side);
  const lifted = clip(rect, (p) => -side(p));
  return { page, flap: lifted.map(reflect), normal };
}

/** Shoelace area, for tests and sanity checks. */
export function area(poly: Pt[]): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}
