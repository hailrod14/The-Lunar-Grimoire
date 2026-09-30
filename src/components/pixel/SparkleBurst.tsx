"use client";

import { SparkleGlyph } from "@/components/sprites/Glyphs";

const DIRECTIONS = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * 2 * Math.PI;
  const distance = i % 2 === 0 ? 28 : 20;
  return { dx: Math.round(Math.cos(angle) * distance), dy: Math.round(Math.sin(angle) * distance) };
});

/**
 * A golden pixel-sparkle burst. Increment `burstKey` to replay it;
 * 0 renders nothing. Place inside a `relative` container.
 */
export function SparkleBurst({ burstKey }: { burstKey: number }) {
  if (burstKey === 0) return null;
  return (
    <span key={burstKey} aria-hidden className="pointer-events-none absolute inset-0">
      {DIRECTIONS.map(({ dx, dy }, i) => (
        <span
          key={i}
          className="sparkle"
          style={{ "--dx": `${dx}px`, "--dy": `${dy}px` } as React.CSSProperties}
        >
          <SparkleGlyph size={i % 2 === 0 ? 14 : 10} />
        </span>
      ))}
    </span>
  );
}
