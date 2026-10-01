import { PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { StarGlyph } from "@/components/sprites/Glyphs";
import { PHASE_LABEL, type TideDay } from "@/lib/cycle";
import { formatLong, parseKey, type DateKey } from "@/lib/dates";
import type { Mood } from "@/lib/familiars";
import type { Familiar } from "@/lib/types";
import { CoverStickers } from "./Stickers";

/** Tooled-gold corner filigree; mirrored for the other three corners. */
const CORNER = [
  "gggggggggg",
  "gYYYYYYYg.",
  "gYgggggg..",
  "gYg.......",
  "gYg...y...",
  "gYg..yWy..",
  "gYg...y...",
  "gYg.......",
  "gg........",
  "g.........",
];
const CORNER_PALETTE = { g: "#b07a1c", Y: "#ffd866", y: "#f2b33d", W: "#fff4c2" };

const CORNERS = [
  { className: "top-3 left-7", flip: "" },
  { className: "top-3 right-3", flip: "-scale-x-100" },
  { className: "bottom-3 left-7", flip: "-scale-y-100" },
  { className: "bottom-3 right-3", flip: "-scale-100" },
];

/** A ring of stars around the moon, as offsets in percent of the ring's size. */
const RING = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * 2 * Math.PI - Math.PI / 2;
  return { left: 50 + Math.cos(angle) * 46, top: 50 + Math.sin(angle) * 46, big: i % 2 === 0 };
});

/** Scattered gold flecks pressed into the leather. */
const FLECKS = [
  [14, 22], [80, 16], [22, 70], [86, 64], [30, 88], [70, 84], [58, 10], [40, 30], [66, 38], [18, 46], [90, 40],
];

type Props = { tide: TideDay | null; tracking: boolean; today: DateKey; familiar?: Familiar; mood: Mood; onOpen: () => void };

/** The closed grimoire. Tapping anywhere opens it to the calendar; stickers can be dragged around. */
export function Cover({ tide, tracking, today, familiar, mood, onOpen }: Props) {
  const phase = tracking && tide ? PHASE_LABEL[tide.phase] : null;

  return (
    <div className="relative">
    <button
      type="button"
      onClick={onOpen}
      aria-label="Open the Grimoire"
      className="cover-gilt group relative block min-h-[85dvh] w-full overflow-hidden text-center focus-visible:outline-offset-[-8px]"
      style={{
        backgroundColor: "var(--cover-leather)",
        // Leather grain: two faint offset pixel checkers.
        backgroundImage:
          "linear-gradient(45deg, rgb(0 0 0 / 0.14) 25%, transparent 25%, transparent 75%, rgb(0 0 0 / 0.14) 75%)," +
          "linear-gradient(45deg, rgb(255 255 255 / 0.03) 25%, transparent 25%, transparent 75%, rgb(255 255 255 / 0.03) 75%)",
        backgroundSize: "8px 8px, 8px 8px",
        backgroundPosition: "0 0, 4px 4px",
      }}
    >
      {/* Spine with raised gold bands */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-5 bg-(--cover-spine) shadow-[inset_-4px_0_0_rgb(0_0_0/0.35)]">
        {[12, 30, 50, 70, 88].map((top) => (
          <span key={top} className="absolute left-0 h-1 w-full bg-gold-700" style={{ top: `${top}%` }} />
        ))}
      </span>

      {/* Inset tooled border */}
      <span aria-hidden className="absolute inset-y-5 right-5 left-9 border-4 border-gold-700 shadow-[inset_0_0_0_4px_var(--cover-leather),inset_0_0_0_8px_rgb(176_122_28/0.45)]" />
      {CORNERS.map((c) => (
        <span key={c.className} aria-hidden className={`absolute ${c.className} ${c.flip}`}>
          <PixelSprite rows={CORNER} palette={CORNER_PALETTE} size={40} />
        </span>
      ))}

      {FLECKS.map(([left, top]) => (
        <span
          key={`${left}-${top}`}
          aria-hidden
          className="absolute size-1 bg-gold-500 opacity-60 animate-twinkle"
          style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${(left + top) % 3}s` }}
        />
      ))}

      {/* Strap and clasp across the fore-edge */}
      <span aria-hidden className="absolute top-[80%] right-0 flex -translate-y-1/2 items-center">
        <span className="grid size-7 place-items-center bg-gold-500 shadow-[inset_-4px_-4px_0_#b07a1c,inset_4px_4px_0_#fff4c2]">
          <span className="size-2.5 bg-(--cover-spine)" />
        </span>
        <span className="h-10 w-9 border-y-4 border-dashed border-gold-900 bg-(--cover-spine)" />
      </span>

      <span className="relative flex min-h-[85dvh] flex-col items-center justify-center gap-6 pr-10 pl-14">
        <span className="pixel-title text-3xl leading-tight sm:text-4xl">
          The Lunar
          <br />
          Grimoire
        </span>

        <span aria-hidden className="relative block size-44 sm:size-52">
          <span className="absolute inset-3 rounded-full border-4 border-dashed border-gold-900" />
          {RING.map((s, i) => (
            <span key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${s.left}%`, top: `${s.top}%` }}>
              <StarGlyph size={s.big ? 15 : 10} />
            </span>
          ))}
          <span className="absolute inset-0 grid place-items-center">
            <span className="animate-float">
              <PixelMoon phase={tracking && tide ? tide.phaseValue : 0.12} variant="tide" size={104} resolution={22} />
            </span>
          </span>
        </span>

        <span className="space-y-1">
          <span className="block font-journal text-xl text-gold-300">{formatLong(parseKey(today))}</span>
          {phase && (
            <span className="block font-journal text-lg text-gold-700">
              {phase} · Day {tide!.cycleDay}
            </span>
          )}
        </span>

        <span className="animate-twinkle text-sm tracking-widest text-gold-500 uppercase group-hover:text-gold-300">
          ✦ Tap to open ✦
        </span>
      </span>

    </button>
    {familiar && <CoverStickers stickers={(familiar.stickers ?? []).filter((s) => s.onCover)} familiar={familiar} mood={mood} />}
    </div>
  );
}
