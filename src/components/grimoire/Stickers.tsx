"use client";

import { useRef, useState } from "react";
import { FamiliarSprite } from "@/components/sprites/FamiliarSprite";
import { BloodDropGlyph, SparkleGlyph, StarGlyph } from "@/components/sprites/Glyphs";
import { formatShort, parseKey } from "@/lib/dates";
import { moveSticker } from "@/lib/stickers";
import { dispatch } from "@/lib/store";
import type { Sticker } from "@/lib/types";

/** A white die-cut edge that follows the sprite's own pixels, plus a soft drop shadow. */
const DIE_CUT =
  "drop-shadow(2px 0 0 #fff) drop-shadow(-2px 0 0 #fff) drop-shadow(0 2px 0 #fff) drop-shadow(0 -2px 0 #fff) drop-shadow(1px 3px 1px rgb(0 0 0 / 0.45))";

const BADGE: Record<Sticker["kind"], React.ReactNode> = {
  season: <span className="text-base leading-none">🍂</span>,
  sabbat: <StarGlyph size={12} />,
  cycle: <BloodDropGlyph size={10} />,
  streak: <SparkleGlyph size={12} />,
};

export const stickerTitle = (s: Sticker) => `${s.label}, ${formatShort(parseKey(s.date))}`;

/** One sticker: the familiar as it looked that day, die-cut, with a little badge for what it was for. */
export function StickerArt({ sticker, size = 60 }: { sticker: Sticker; size?: number }) {
  return (
    <span className="relative inline-block" style={{ filter: DIE_CUT }}>
      <FamiliarSprite familiar={sticker.look} mood={sticker.mood} size={size} still />
      <span className="absolute right-0 bottom-1 grid size-5 place-items-center rounded-full bg-white">{BADGE[sticker.kind]}</span>
    </span>
  );
}

/** Today's familiar as a sticker too (always on the cover, not stored). */
export function LiveSticker({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block" style={{ filter: DIE_CUT }}>
      {children}
    </span>
  );
}

/**
 * The stickers on the cover. Drag one to move it (it stays where you drop
 * it, on every device); tap one to see what it was for.
 */
export function CoverStickers({ stickers }: { stickers: Sticker[] }) {
  const layer = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  const toPercent = (clientX: number, clientY: number) => {
    const r = layer.current!.getBoundingClientRect();
    const clamp = (n: number) => Math.min(94, Math.max(6, n));
    return { x: clamp(((clientX - r.left) / r.width) * 100), y: clamp(((clientY - r.top) / r.height) * 100) };
  };

  return (
    <div ref={layer} className="pointer-events-none absolute inset-0">
      {stickers.map((s) => {
        const here = drag?.id === s.id ? drag : s;
        return (
          <div
            key={s.id}
            role="img"
            aria-label={`Sticker: ${stickerTitle(s)}`}
            title={stickerTitle(s)}
            className={`pointer-events-auto absolute cursor-grab touch-none select-none ${drag?.id === s.id ? "z-20 cursor-grabbing" : "z-10"}`}
            style={{ left: `${here.x}%`, top: `${here.y}%`, transform: `translate(-50%, -50%) rotate(${s.rot}deg) scale(${drag?.id === s.id ? 1.12 : 1})` }}
            onPointerDown={(e) => {
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                // Some pointers can't be captured; dragging still works while over the sticker.
              }
              setDrag({ id: s.id, x: s.x, y: s.y, moved: false });
            }}
            onPointerMove={(e) => {
              if (drag?.id !== s.id) return;
              const p = toPercent(e.clientX, e.clientY);
              const moved = drag.moved || Math.abs(p.x - s.x) > 2 || Math.abs(p.y - s.y) > 2;
              setDrag({ id: s.id, ...p, moved });
            }}
            onPointerUp={() => {
              if (drag?.id !== s.id) return;
              if (drag.moved) dispatch((g) => moveSticker(g, s.id, drag.x, drag.y));
              else setShown((x) => (x === s.id ? null : s.id));
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            <StickerArt sticker={s} size={56} />
            {shown === s.id && (
              <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 bg-midnight-950 px-2 py-0.5 font-journal text-base whitespace-nowrap text-gold-300">
                {stickerTitle(s)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
