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
