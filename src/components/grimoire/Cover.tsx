import { PixelSprite } from "@/components/pixel/PixelSprite";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { SparkleGlyph, StarGlyph } from "@/components/sprites/Glyphs";
import { ELDER_FUTHARK } from "@/lib/divination";
import { PHASE_LABEL, type TideDay } from "@/lib/cycle";
import { formatLong, parseKey, type DateKey } from "@/lib/dates";
import type { Mood } from "@/lib/familiars";
import { skyMoonLine, skyMoonPhase } from "@/lib/moon";
import { greeting } from "@/lib/owner";
import type { Familiar, Sticker } from "@/lib/types";
import { CoverStickers, StickerArt } from "./Stickers";

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

/** Leather grain: two faint offset pixel checkers. */
export const LEATHER: React.CSSProperties = {
  backgroundColor: "var(--cover-leather)",
  backgroundImage:
    "linear-gradient(45deg, rgb(0 0 0 / 0.14) 25%, transparent 25%, transparent 75%, rgb(0 0 0 / 0.14) 75%)," +
    "linear-gradient(45deg, rgb(255 255 255 / 0.03) 25%, transparent 25%, transparent 75%, rgb(255 255 255 / 0.03) 75%)",
  backgroundSize: "8px 8px, 8px 8px",
  backgroundPosition: "0 0, 4px 4px",
};

/** The spine, tooled border, gilt corners, gold flecks, and (unless it's locked shut) the little strap and clasp. */
export function CoverDecor({ clasp = true }: { clasp?: boolean }) {
  return (
    <>
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
      {clasp && (
        <span aria-hidden className="absolute top-[80%] right-0 flex -translate-y-1/2 items-center">
          <span className="grid size-7 place-items-center bg-gold-500 shadow-[inset_-4px_-4px_0_#b07a1c,inset_4px_4px_0_#fff4c2]">
            <span className="size-2.5 bg-(--cover-spine)" />
          </span>
          <span className="h-10 w-9 border-y-4 border-dashed border-gold-900 bg-(--cover-spine)" />
        </span>
      )}
    </>
  );
}

/** Positions of the runes in the embossed circle behind the moon. */
const RUNE_RING = ELDER_FUTHARK.map((rune, i) => {
  const angle = (i / ELDER_FUTHARK.length) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  return { rune, x: 120 + Math.cos(rad) * 100, y: 120 + Math.sin(rad) * 100, angle: angle + 90 };
});

/** A faint rune circle pressed into the leather, gilt worn almost away, behind the moon. */
function RuneCircle() {
  const strokes = (dx: number, dy: number, color: string) => (
    <g stroke={color} strokeWidth={1.2} strokeLinecap="square" fill="none" transform={`translate(${dx} ${dy})`}>
      <circle cx={120} cy={120} r={114} strokeDasharray="2 4" />
      <circle cx={120} cy={120} r={86} />
      {RUNE_RING.map(({ rune, x, y, angle }) => (
        <g key={rune.name} transform={`translate(${x} ${y}) rotate(${angle}) scale(1.15) translate(-3 -5)`}>
          {rune.strokes.map(([x1, y1, x2, y2], j) => (
            <line key={j} x1={x1} y1={y1} x2={x2} y2={y2} />
          ))}
        </g>
      ))}
    </g>
  );
  return (
    <svg viewBox="0 0 240 240" aria-hidden className="pointer-events-none absolute -inset-9 opacity-35">
      {/* Embossed: a dark edge below, the worn gilt above */}
      {strokes(0.8, 0.8, "rgb(0 0 0 / 0.55)")}
      {strokes(0, 0, "#b07a1c")}
    </svg>
  );
}

/** A dithered halo: a pixel checkerboard of moonlight that fades out from the moon. */
const GLOW: React.CSSProperties = {
  background: "repeating-conic-gradient(#ffd866 0 25%, transparent 0 50%) 0 0 / 4px 4px",
  maskImage: "radial-gradient(circle, black 30%, transparent 62%)",
  WebkitMaskImage: "radial-gradient(circle, black 30%, transparent 62%)",
};

/** Where the little sparkles start their drift past the moon (percent of the ring). */
const SPARKLES = [
  { left: 30, top: 70, delay: 0 },
  { left: 66, top: 60, delay: 1.7 },
  { left: 48, top: 78, delay: 3.4 },
];

/** The title, a greeting, the moon in its ring of stars, the date, and tonight's real moon. */
function CoverFace({
  moonPhase,
  today,
  line,
  hint,
  fill = true,
}: {
  moonPhase: number;
  today: DateKey;
  /** An extra line under the date (your tide). */
  line?: string;
  hint?: React.ReactNode;
  /** Fill the cover's height and centre (false when the cover lays out the rest itself). */
  fill?: boolean;
}) {
  const date = parseKey(today);
  const hello = greeting(new Date().getHours());
  return (
    <span className={`relative flex flex-col items-center pr-10 pl-14 ${fill ? "min-h-[85dvh] justify-center gap-6" : "gap-4 pt-12"}`}>
      <span className="space-y-1">
        <span className="pixel-title block text-3xl leading-tight sm:text-4xl">
          The Lunar
          <br />
          Grimoire
        </span>
        {hello && <span className="block font-journal text-lg text-gold-100">{hello}</span>}
      </span>

      <span aria-hidden className={`relative my-4 block ${fill ? "size-44 sm:size-52" : "size-36 sm:size-44"}`}>
        <RuneCircle />
        <span className="absolute inset-0 opacity-30" style={GLOW} />
        <span className="absolute inset-3 rounded-full border-4 border-dashed border-gold-900" />
        {RING.map((s, i) => (
          <span
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 animate-twinkle"
            style={{ left: `${s.left}%`, top: `${s.top}%`, animationDelay: `${(i * 0.37) % 3}s` }}
          >
            <StarGlyph size={s.big ? 15 : 10} />
          </span>
        ))}
        <span className="absolute inset-0 grid place-items-center">
          <span className="animate-float">
            <PixelMoon phase={moonPhase} variant="tide" size={fill ? 104 : 84} resolution={22} />
          </span>
        </span>
        {SPARKLES.map((p) => (
          <span key={p.left} className="drift-up absolute" style={{ left: `${p.left}%`, top: `${p.top}%`, animationDelay: `${p.delay}s` }}>
            <SparkleGlyph size={8} />
          </span>
        ))}
      </span>

      <span className="space-y-1">
        <span className="block font-display text-xl tracking-wide text-gold-300">{formatLong(date)}</span>
        {line && <span className="block font-journal text-lg text-gold-100">{line}</span>}
        <span className="block font-journal text-lg text-gold-100">{skyMoonLine(date)}</span>
      </span>

      {hint}
    </span>
  );
}

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
        style={LEATHER}
      >
        <CoverDecor />
        <CoverFace
          moonPhase={tracking && tide ? tide.phaseValue : 0.12}
          today={today}
          line={phase ? `${phase} · Day ${tide!.cycleDay}` : undefined}
          hint={<span className="animate-twinkle text-sm tracking-widest text-gold-500 uppercase group-hover:text-gold-300">✦ Tap to open ✦</span>}
        />
      </button>
      {familiar && <CoverStickers stickers={(familiar.stickers ?? []).filter((s) => s.onCover)} familiar={familiar} mood={mood} />}
    </div>
  );
}

type LockedProps = {
  today: DateKey;
  familiar?: Familiar;
  stickers: Sticker[];
  /** The combination lock, fastening the strap. */
  lock: React.ReactNode;
  /** The lock's width, so the strap ends at its end plate. */
  lockWidth: number;
  lockHeight: number;
  /** True once the lock opens, so the strap drops away with it. */
  opening: boolean;
  /** A tag hanging from the lock: what to do, or what went wrong. */
  tag: React.ReactNode;
};

/** Where stickers rest on the locked cover: tucked by the gilt corners, out of the moon's way (a third perches on the strap). */
const LOCKED_SPOTS: [number, number, number][] = [
  [15, 7, -8],
  [85, 7, 7],
];

/** One gold rivet, pixel style. */
function Rivet() {
  return <span aria-hidden className="block size-3 bg-gold-500 shadow-[inset_-3px_-3px_0_#b07a1c,inset_2px_2px_0_#fff4c2,0_2px_0_rgb(0_0_0/0.4)]" />;
}

/**
 * The leather strap: fixed at the spine with gold rivets, stitched along
 * both edges, casting a shadow, and running into the lock's end plate.
 */
function Strap({ opening, lockWidth, height, perch }: { opening: boolean; lockWidth: number; height: number; perch?: React.ReactNode }) {
  return (
    <span
      aria-hidden
      className={`absolute left-0 flex items-center ${opening ? "strap-fall" : ""}`}
      style={{ right: lockWidth - 6, top: (height - 40) / 2, height: 40 }}
    >
      <span
        className="relative h-full w-full border-y-2 border-black/60 shadow-[0_5px_0_rgb(0_0_0/0.4),inset_0_3px_0_rgb(255_255_255/0.14),inset_0_-3px_0_rgb(0_0_0/0.3)]"
        style={{ background: "linear-gradient(rgb(255 255 255 / 0.12), rgb(255 255 255 / 0.12)), var(--cover-leather)" }}
      >
        {/* Stitching along both edges */}
        <span className="absolute inset-x-1 top-1 border-t-2 border-dashed border-gold-500" />
        <span className="absolute inset-x-1 bottom-1 border-t-2 border-dashed border-gold-500" />
        {/* Riveted to the cover at the spine */}
        <span className="absolute top-1/2 left-7 flex -translate-y-1/2 flex-col gap-2">
          <Rivet />
          <Rivet />
        </span>
        {perch && <span className="absolute bottom-[calc(100%-10px)] left-8 -rotate-3">{perch}</span>}
      </span>
    </span>
  );
}

/**
 * The closed grimoire with a PIN set: the same cover, fastened by a leather
 * strap from the spine into an antique brass combination lock. The moon shows
 * the real sky and the familiar a neutral mood, so nothing about your cycle shows.
 */
export function LockedCover({ today, familiar, stickers, lock, lockWidth, lockHeight, opening, tag }: LockedProps) {
  const resting = stickers.slice(0, LOCKED_SPOTS.length).map((s, i) => ({ ...s, x: LOCKED_SPOTS[i][0], y: LOCKED_SPOTS[i][1], rot: LOCKED_SPOTS[i][2] }));
  const onStrap = stickers[LOCKED_SPOTS.length];
  return (
    <div className="cover-gilt relative flex min-h-[85dvh] flex-col overflow-hidden text-center" style={LEATHER}>
      <CoverDecor clasp={false} />
      <CoverFace moonPhase={skyMoonPhase(parseKey(today))} today={today} fill={false} />
      {familiar && <CoverStickers stickers={resting} familiar={familiar} mood="waxing" readOnly hideToday idle size={44} />}

      <span aria-hidden className="min-h-16 flex-1" />

      {/* The strap and its lock, then the tag hanging from the lock */}
      <div className="relative z-30 w-full" style={{ height: lockHeight + 56 }}>
        <div className="absolute inset-x-0 bottom-0" style={{ height: lockHeight }}>
          <Strap
            opening={opening}
            lockWidth={lockWidth}
            height={lockHeight}
            perch={
              onStrap && (
                <span className="sticker-idle block" style={{ animationDelay: "1.1s" }}>
                  <StickerArt sticker={onStrap} size={44} />
                </span>
              )
            }
          />
          <div className="absolute right-3 bottom-0">{lock}</div>
        </div>
      </div>
      <div className="relative z-30 flex justify-end pt-1 pr-6 pb-12 pl-12">{tag}</div>
    </div>
  );
}
