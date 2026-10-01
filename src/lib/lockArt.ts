/*
 * Pixel art for the crescent-moon combination lock, drawn at any size so it
 * fits however many wheels the code needs. The body is a round brass moon:
 * the lit crescent polished gold, the shadowed part engraved darker bronze
 * and scattered with stars, with star rivets around the rim. The shackle is
 * a separate sprite so it can spring open.
 */

export const LOCK_PALETTE: Record<string, string> = {
  o: "#2a1a05", // outline
  D: "#5c3d0c", // deep bronze
  d: "#8a5a10", // bronze (the moon's shadow side)
  g: "#f2b33d", // gold (the lit crescent)
  G: "#ffd866", // bright gold
  h: "#fff4c2", // highlight
  s: "#fff4c2", // star
  t: "#ffd866", // engraved star on the shadow side
};

/** The moon-shaped body, `size` art pixels across. */
export function lockBody(size: number): string[] {
  const r = size / 2;
  const c = r - 0.5;
  const shadowShift = r * 0.55;
  const rows: string[] = [];
  for (let y = 0; y < size; y++) {
    let row = "";
    for (let x = 0; x < size; x++) {
      const dx = x - c;
      const dy = y - c;
      const dist = Math.hypot(dx, dy);
      if (dist > r - 0.2) {
        row += ".";
        continue;
      }
      if (dist > r - 1.3) {
        row += "o";
        continue;
      }
      const shadow = Math.hypot(dx - shadowShift, dy + shadowShift * 0.15) < r * 0.95;
      const rim = dist > r - 2.6;
      if (shadow) row += rim ? "D" : "d";
      else if (rim) row += dx + dy < -r * 0.6 ? "h" : "G";
      else row += dx + dy < -r * 0.9 ? "G" : "g";
    }
    rows.push(row);
  }

  // Star rivets around the lit rim, and engraved stars in the shadow.
  const put = (x: number, y: number, ch: string) => {
    if (y < 0 || y >= size || x < 0 || x >= size || rows[y][x] === "." || rows[y][x] === "o") return;
    rows[y] = rows[y].slice(0, x) + ch + rows[y].slice(x + 1);
  };
  const star = (x: number, y: number, ch: string, big: boolean) => {
    put(x, y, ch);
    if (big) [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([a, b]) => put(x + a, y + b, ch));
  };
  for (const angle of [120, 150, 180, 210, 240]) {
    const a = (angle * Math.PI) / 180;
    star(Math.round(c + Math.cos(a) * (r - 4)), Math.round(c - Math.sin(a) * (r - 4)), "s", angle === 180);
  }
  const engraved: [number, number, boolean][] = [
    [0.62, 0.22, true],
    [0.82, 0.4, false],
    [0.7, 0.78, true],
    [0.86, 0.62, false],
    [0.55, 0.88, false],
  ];
  for (const [fx, fy, big] of engraved) star(Math.round(fx * size), Math.round(fy * size), "t", big);
  return rows;
}

/** The arched shackle, `width` art pixels wide, rising `height` above the body. */
export function lockShackle(width: number, height: number): string[] {
  const rows: string[] = [];
  const c = (width - 1) / 2;
  const outer = width / 2;
  const thick = Math.max(4, Math.round(width / 5));
  for (let y = 0; y < height; y++) {
    let row = "";
    for (let x = 0; x < width; x++) {
      // An arch: the top half of a ring, then straight legs down into the body.
      const cy = outer - 0.5;
      const dy = y < cy ? cy - y : 0;
      const dist = Math.hypot(x - c, dy);
      const inRing = dist <= outer - 0.3 && dist >= outer - thick;
      if (!inRing) row += ".";
      else if (dist >= outer - 1.2 || dist <= outer - thick + 0.8) row += "o";
      else row += x < c ? "G" : "g";
    }
    rows.push(row);
  }
  return rows;
}
