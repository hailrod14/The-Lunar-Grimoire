/*
 * Pixel art for the cover's strap lock, after antique combination journal
 * locks: a horizontal brass housing with a pointed nose, a round push-knob,
 * notched edges, a window of number wheels, and a square end plate where the
 * leather strap feeds in. Drawn to fit however many wheels the code needs.
 */

/** One pixel of lock art, in screen pixels (the UI's pixel size). */
export const ART = 4;

export const LOCK_PALETTE: Record<string, string> = {
  o: "#241808", // outline
  D: "#4a3612", // deep shadow
  d: "#6e5320", // shadow
  g: "#9a7b3c", // antique brass
  G: "#c2a25e", // lit brass
  h: "#e6d29a", // highlight
  w: "#120c04", // the dark window behind the wheels
};

/** Height of the lock in art pixels. */
const H = 22;
const MID = (H - 1) / 2;
const NOSE = 6;
const KNOB = { x: 9.5, y: MID, r: 4.8 };
const WHEELS_FROM = 16;
const NOTCHES = 5;
const PLATE = 10;

/** One wheel's width and one digit's height on the lock, in screen pixels. */
export const WHEEL_PX = 22;
export const ROW_PX = 18;
export const WHEEL_GAP_PX = 2;

export type LockLayout = {
  rows: string[];
  /** Sizes and positions in screen pixels. */
  width: number;
  height: number;
  knob: { left: number; top: number; size: number };
  window: { left: number; top: number; width: number; height: number };
  /** Where the strap meets the end plate (vertical centre). */
  strapTop: number;
};

/**
 * The lock for a code of `digits` digits. Facing "right", the end plate is on
 * the left (where a strap from the spine feeds in) and the nose points to
 * the fore-edge.
 */
export function strapLock(digits: number, facing: "left" | "right" = "left"): LockLayout {
  const windowPx = digits * WHEEL_PX + (digits - 1) * WHEEL_GAP_PX + 8;
  const windowArt = Math.ceil(windowPx / ART);
  const wheelsTo = WHEELS_FROM + windowArt; // exclusive
  const plateFrom = wheelsTo + NOTCHES;
  const W = plateFrom + PLATE;

  const rows: string[] = [];
  for (let y = 0; y < H; y++) {
    let row = "";
    for (let x = 0; x < W; x++) row += cell(x, y);
    rows.push(row);
  }

  function cell(x: number, y: number): string {
    // The square end plate, full height, with a bevel and the strap slot.
    if (x >= plateFrom) {
      const px = x - plateFrom;
      if (y === 0 || y === H - 1 || px === 0 || px === PLATE - 1) return "o";
      if ((px === 2 || px === PLATE - 3) && (y === 3 || y === H - 4)) return "h"; // rivets
      // A keyhole: a round top over a narrow slot.
      const kh = Math.hypot(px - 4.5, y - (MID - 1.5));
      if (kh <= 1.7 || (px >= 4 && px <= 5 && y >= MID - 1 && y <= MID + 3)) return "w";
      if (kh <= 2.6 || (px >= 3 && px <= 6 && y >= MID - 1 && y <= MID + 4)) return "D";
      if (y === 1 || px === 1) return "h";
      if (y === H - 2 || px === PLATE - 2) return "D";
      return px < 4 ? "G" : "g";
    }

    // The round push-knob, over the nose and housing.
    const kd = Math.hypot(x - KNOB.x, y - KNOB.y);
    if (kd <= KNOB.r) {
      if (kd > KNOB.r - 0.9) return "o";
      const lit = x - KNOB.x + (y - KNOB.y);
      if (kd > KNOB.r - 1.9) return lit < -2 ? "h" : lit > 2 ? "D" : "G";
      return lit < -1 ? "G" : lit > 2 ? "d" : "g";
    }

    // The pointed nose.
    if (x < NOSE) {
      const half = (x / (NOSE - 1)) * 6.5;
      const dy = Math.abs(y - MID);
      if (dy > half + 0.5) return ".";
      if (dy > half - 0.6) return "o";
      return y < MID ? "G" : "d";
    }

    // The housing body, with notched edges outside the wheel window.
    const top = 3;
    const bottom = H - 4;
    const notched = (x < WHEELS_FROM - 1 || x >= wheelsTo + 1) && (x - NOSE) % 3 !== 0;
    if (notched && (y === top - 1 || y === bottom + 1)) return y < MID ? "G" : "d";
    if (notched && (y === top - 2 || y === bottom + 2)) return "o";
    if (y < top - 1 || y > bottom + 1) return ".";
    if (y === top - 1 || y === bottom + 1) return "o";
    if (x >= WHEELS_FROM && x < wheelsTo && y > top && y < bottom) return "w";
    if (x === WHEELS_FROM - 1 || x === wheelsTo) return y === top || y === bottom ? "o" : "D";
    if (y === top) return "h";
    if (y === top + 1) return "G";
    if (y === bottom) return "D";
    if (y === bottom - 1) return "d";
    return "g";
  }

  const knobSize = Math.round(KNOB.r * 2 * ART);
  const width = W * ART;
  const knob = { left: Math.round((KNOB.x + 0.5) * ART - knobSize / 2), top: Math.round((KNOB.y + 0.5) * ART - knobSize / 2), size: knobSize };
  const slot = { left: WHEELS_FROM * ART, top: 4 * ART, width: windowArt * ART, height: (H - 8) * ART };
  const right = facing === "right";
  return {
    rows: right ? rows.map((r) => [...r].reverse().join("")) : rows,
    width,
    height: H * ART,
    knob: right ? { ...knob, left: width - knob.left - knob.size } : knob,
    window: right ? { ...slot, left: width - slot.left - slot.width } : slot,
    strapTop: (H * ART) / 2,
  };
}
