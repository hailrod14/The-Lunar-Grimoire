// Draws the app icon (a gold pixel crescent on the night sky) and writes it
// as PNGs for the web app manifest and iOS home screen.
// Run with: node scripts/make-icons.mjs
import { mkdirSync, writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const GRID = 32;
const COLORS = {
  sky: [15, 13, 46],
  skyGlow: [36, 22, 63],
  lit: [255, 216, 102],
  highlight: [255, 244, 194],
  shade: [224, 154, 44],
  crater: [232, 172, 58],
  dark: [58, 33, 80],
  rim: [176, 122, 28],
  star: [255, 216, 102],
  starSilver: [195, 207, 234],
};

const STARS = [
  [5, 6, "star"], [26, 5, "starSilver"], [27, 24, "star"], [4, 25, "starSilver"], [22, 28, "starSilver"],
];
const CRATERS = [[-0.32, -0.18, 0.17], [0.28, 0.32, 0.14], [0.12, -0.48, 0.1], [-0.12, 0.5, 0.1]];

/** The icon as a GRID×GRID array of RGB colors. */
function drawGrid() {
  const grid = [];
  const center = GRID / 2;
  const r = 10;
  const phase = 0.22; // a waxing crescent, like the app's home screen
  const lx = Math.sin(phase * 2 * Math.PI);
  const lz = -Math.cos(phase * 2 * Math.PI);

  for (let y = 0; y < GRID; y++) {
    const row = [];
    for (let x = 0; x < GRID; x++) {
      // A soft violet glow behind the moon, drawn as stepped rings.
      const dist = Math.hypot(x + 0.5 - center, y + 0.5 - center);
      let color = dist < r + 3 ? COLORS.skyGlow : COLORS.sky;

      const dx = (x + 0.5 - center) / r;
      const dy = (y + 0.5 - center) / r;
      const d2 = dx * dx + dy * dy;
      if (d2 <= 1) {
        const z = Math.sqrt(1 - d2);
        const b = dx * lx + z * lz;
        if (b <= 0) color = d2 > ((r - 1) / r) ** 2 ? COLORS.rim : COLORS.dark;
        else if (b < 0.18) color = COLORS.shade;
        else if (CRATERS.some(([cx, cy, cr]) => (dx - cx) ** 2 + (dy - cy) ** 2 < cr * cr)) color = COLORS.crater;
        else if (dx > 0.2 && dy < -0.35) color = COLORS.highlight;
        else color = COLORS.lit;
      }
      row.push(color);
    }
    grid.push(row);
  }
  // Four-point stars.
  for (const [sx, sy, key] of STARS) {
    for (const [ox, oy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = sx + ox;
      const y = sy + oy;
      if (x >= 0 && y >= 0 && x < GRID && y < GRID) grid[y][x] = COLORS[key];
    }
  }
  return grid;
}

// ── Minimal PNG encoder ──────────────────────────────────────

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, grid) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      // Nearest-neighbour scaling keeps the pixels crisp.
      const [r, g, b] = grid[Math.floor((y * GRID) / size)][Math.floor((x * GRID) / size)];
      const i = y * (size * 3 + 1) + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const grid = drawGrid();
mkdirSync("public/icons", { recursive: true });
for (const size of [192, 512]) writeFileSync(`public/icons/icon-${size}.png`, png(size, grid));
// The design keeps the moon inside the central safe zone, so it doubles as the maskable icon.
writeFileSync("public/icons/maskable-512.png", png(512, grid));
writeFileSync("src/app/apple-icon.png", png(180, grid));
console.log("Wrote public/icons/*.png and src/app/apple-icon.png");
