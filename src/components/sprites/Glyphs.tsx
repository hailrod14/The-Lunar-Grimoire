import { PixelSprite } from "@/components/pixel/PixelSprite";

const SPARKLE = [
  "...y...",
  "...y...",
  "..yWy..",
  "yyWWWyy",
  "..yWy..",
  "...y...",
  "...y...",
];

const STAR = [
  "..y..",
  ".yWy.",
  "yWWWy",
  ".yWy.",
  "..y..",
];

const BLOOD_DROP = [
  "...o...",
  "..obo..",
  "..obo..",
  ".obbbo.",
  "obwbbbo",
  "obbbbbo",
  "obbbbbo",
  ".obbbo.",
  "..ooo..",
];

export function SparkleGlyph({ size = 14, color = "#ffd866" }: { size?: number; color?: string }) {
  return <PixelSprite rows={SPARKLE} palette={{ y: color, W: "#fff4c2" }} size={size} />;
}

export function StarGlyph({ size = 10 }: { size?: number }) {
  return <PixelSprite rows={STAR} palette={{ y: "#f2b33d", W: "#fff4c2" }} size={size} />;
}

export function BloodDropGlyph({ size = 14, title }: { size?: number; title?: string }) {
  return (
    <PixelSprite rows={BLOOD_DROP} palette={{ o: "#4a0f1c", b: "#b8324a", w: "#f09aa8" }} size={size} title={title} />
  );
}

const CRYSTAL_BALL = [
  "....oooo....",
  "..oowwbboo..",
  ".owwbbbbbbo.",
  ".owbbbsbbbo.",
  "obbbbbbbbbbo",
  "obbbsbbbbbbo",
  "obbbbbbbbbbo",
  ".obbbbbbbbo.",
  "..oobbbboo..",
  "...gggggg...",
  "..gGGGGGGg..",
  "..gggggggg..",
];

export function CrystalBallGlyph({ size = 18, title }: { size?: number; title?: string }) {
  return (
    <PixelSprite
      rows={CRYSTAL_BALL}
      palette={{ o: "#2a1f4d", b: "#6b44b8", w: "#e4dbff", s: "#fff4c2", g: "#b07a1c", G: "#ffd866" }}
      size={size}
      title={title}
    />
  );
}

// ── Holidays and personal occasions ──────────────────────────

const PENNANT = [
  "o......",
  "ovvv...",
  "oVVVVv.",
  "ovvv...",
  "o......",
  "o......",
  "o......",
];

export function HolidayGlyph({ size = 8, title }: { size?: number; title?: string }) {
  return <PixelSprite rows={PENNANT} palette={{ o: "#c3cfea", v: "#a88ef0", V: "#e4dbff" }} size={size} title={title} />;
}

const OCCASION_SPRITES = {
  birthday: {
    rows: ["..f.f..", "..c.c..", ".ppppp.", ".pwwwp.", ".ppppp.", "bbbbbbb", "......."],
    palette: { f: "#ffd866", c: "#e4dbff", p: "#e5638f", w: "#fff4f8", b: "#b07a1c" },
  },
  anniversary: {
    rows: [".rr.rr.", "rwrrrrr", "rrrrrrR", ".rrrrR.", "..rrR..", "...R...", "......."],
    palette: { r: "#f06a95", R: "#b8324a", w: "#ffe6ef" },
  },
  celebration: {
    rows: ["..y.y..", "...y...", "tttyttt", "TTTyTTT", ".TTyTT.", ".TTyTT.", ".TTyTT."],
    palette: { y: "#ffd866", t: "#5fe0c8", T: "#2fbfa8" },
  },
  remembrance: {
    rows: ["...f...", "..fYf..", "...f...", "..www..", "..wwW..", "..wwW..", ".bbbbb."],
    palette: { f: "#f2b33d", Y: "#fff4c2", w: "#f6ead0", W: "#c9a86a", b: "#8c6b3a" },
  },
} as const;

export function OccasionGlyph({ kind, size = 8, title }: { kind: keyof typeof OCCASION_SPRITES; size?: number; title?: string }) {
  const { rows, palette } = OCCASION_SPRITES[kind];
  return <PixelSprite rows={rows} palette={palette} size={size} title={title} />;
}
