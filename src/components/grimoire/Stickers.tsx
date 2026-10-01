"use client";

import { useRef, useState } from "react";
import { FamiliarSprite } from "@/components/sprites/FamiliarSprite";
import { BloodDropGlyph, SparkleGlyph, StarGlyph } from "@/components/sprites/Glyphs";
import { formatShort, parseKey } from "@/lib/dates";
import type { Mood } from "@/lib/familiars";
import { updateFamiliar } from "@/lib/grimoire";
import { TODAY_SPOT, moveSticker } from "@/lib/stickers";
import { dispatch } from "@/lib/store";
import type { Familiar, Sticker } from "@/lib/types";

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

/** Something on the cover that can be dragged: an earned sticker, or today's familiar. */
type Item = { id: string; x: number; y: number; rot: number; title: string; art: React.ReactNode; onDrop: (x: number, y: number) => void };

/**
 * The stickers on the cover, today's familiar among them. Drag one to move
 * it (it stays where you drop it, on every device); tap one to see what it's for.
 * They sit above the cover rather than inside it, so touching one never opens the book.
 */
type CoverStickersProps = {
  stickers: Sticker[];
  familiar: Familiar;
  mood: Mood;
  /** Shown but not movable (the locked cover). */
  readOnly?: boolean;
  /** Leave today's familiar out (it's sitting somewhere else). */
  hideToday?: boolean;
  /** A gentle resting motion. */
  idle?: boolean;
  /** Sticker size in pixels. */
  size?: number;
};

export function CoverStickers({ stickers, familiar, mood, readOnly = false, hideToday = false, idle = false, size = 56 }: CoverStickersProps) {
  const layer = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<{ id: string; x: number; y: number; moved: boolean } | null>(null);
  const [shown, setShown] = useState<string | null>(null);

  const spot = familiar.coverSpot ?? { x: TODAY_SPOT[0], y: TODAY_SPOT[1] };
  const items: Item[] = [
    ...stickers.map((s) => ({
      id: s.id,
      x: s.x,
      y: s.y,
      rot: s.rot,
      title: stickerTitle(s),
      art: <StickerArt sticker={s} size={size} />,
      onDrop: (x: number, y: number) => dispatch((g) => moveSticker(g, s.id, x, y)),
    })),
    ...(hideToday ? [] : [{
      id: "today",
      x: spot.x,
      y: spot.y,
      rot: -6,
      title: `${familiar.name}, today`,
      art: (
        <LiveSticker>
          <FamiliarSprite familiar={familiar} mood={mood} size={80} />
        </LiveSticker>
      ),
      onDrop: (x: number, y: number) => dispatch((g) => updateFamiliar(g, { coverSpot: { x: Math.round(x), y: Math.round(y) } })),
    }]),
  ];

  const toPercent = (clientX: number, clientY: number) => {
    const r = layer.current!.getBoundingClientRect();
    const clamp = (n: number) => Math.min(94, Math.max(6, n));
    return { x: clamp(((clientX - r.left) / r.width) * 100), y: clamp(((clientY - r.top) / r.height) * 100) };
  };

  return (
    <div ref={layer} className="pointer-events-none absolute inset-0" aria-hidden={readOnly || undefined}>
      {items.map((s) => {
        const here = drag?.id === s.id ? drag : s;
        return (
          <div
            key={s.id}
            role="img"
            aria-label={`Sticker: ${s.title}`}
            title={s.title}
            className={`${readOnly ? "pointer-events-none" : "pointer-events-auto cursor-grab"} absolute touch-none select-none ${drag?.id === s.id ? "z-20 cursor-grabbing" : "z-10"}`}
            style={{ left: `${here.x}%`, top: `${here.y}%`, transform: `translate(-50%, -50%) rotate(${s.rot}deg) scale(${drag?.id === s.id ? 1.12 : 1})` }}
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => {
              e.stopPropagation();
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
            onPointerUp={(e) => {
              e.stopPropagation();
              if (drag?.id !== s.id) return;
              if (drag.moved) s.onDrop(drag.x, drag.y);
              else setShown((x) => (x === s.id ? null : s.id));
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            {idle ? (
              <span className="sticker-idle block" style={{ animationDelay: `${(s.x % 7) * 0.4}s` }}>
                {s.art}
              </span>
            ) : (
              s.art
            )}
            {shown === s.id && (
              <span className="absolute top-full left-1/2 mt-1 -translate-x-1/2 bg-midnight-950 px-2 py-0.5 font-journal text-base whitespace-nowrap text-gold-300">
                {s.title}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
