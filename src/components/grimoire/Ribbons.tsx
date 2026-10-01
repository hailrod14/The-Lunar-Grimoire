import { BookOpen, CalendarDays, Music, Settings } from "lucide-react";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { CrystalBallGlyph } from "@/components/sprites/Glyphs";
import { VesselSprite } from "@/components/sprites/VesselSprite";

export type View = "calendar" | "day" | "journal" | "cabinet" | "insights" | "settings";

/** Top-to-bottom ribbon order, which decides the page-turn direction. */
export const RIBBON_ORDER: View[] = ["calendar", "day", "journal", "cabinet", "insights", "settings"];

const RIBBONS: { view: View; label: string; bg: string; icon: React.ReactNode }[] = [
  { view: "calendar", label: "Calendar", bg: "bg-violet-500", icon: <CalendarDays size={18} strokeWidth={2.5} /> },
  { view: "day", label: "Today", bg: "bg-gold-500", icon: <PixelMoon phase={0.2} variant="tide" size={18} resolution={10} /> },
  { view: "journal", label: "Journal", bg: "bg-parchment-300", icon: <BookOpen size={18} strokeWidth={2.5} /> },
  { view: "cabinet", label: "Cabinet", bg: "bg-[#2fbfa8]", icon: <VesselSprite vessel="flask" color="violet" size={18} /> },
  { view: "insights", label: "Insights", bg: "bg-violet-300", icon: <CrystalBallGlyph size={18} /> },
  { view: "settings", label: "Settings", bg: "bg-silver-300", icon: <Settings size={18} strokeWidth={2.5} /> },
];

/** Bookmark ribbons hanging off the right edge of the book. */
type Props = {
  active: View | null;
  dayLabel: string;
  onSelect: (v: View) => void;
  /** Sections that are always visible (e.g. the calendar in the two-page spread) need no ribbon. */
  hide?: View[];
  /** Forest music on/off, shown as a small charm below the ribbons. */
  music?: { on: boolean; toggle: () => void };
  /** Close the book back onto its cover (shown while it's open). */
  onClose?: () => void;
};

export function Ribbons({ active, dayLabel, onSelect, hide = [], music, onClose }: Props) {
  return (
    <nav aria-label="Grimoire sections" className="sticky top-4 flex shrink-0 flex-col gap-2 pt-8">
      {RIBBONS.filter((r) => !hide.includes(r.view)).map((r) => {
        const isActive = r.view === active;
        const label = r.view === "day" ? dayLabel : r.label;
        return (
          <button
            key={r.view}
            type="button"
            onClick={() => onSelect(r.view)}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
            className={`${r.bg} flex flex-col items-center gap-1.5 pt-2 pr-2 pb-3.5 pl-1 text-midnight-950 transition-[width] duration-100 ${
              isActive ? "w-12 brightness-110" : "w-9 opacity-75 hover:w-10 hover:opacity-100"
            }`}
            style={{
              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 8px), 0 100%)",
              boxShadow: "inset 4px 0 0 rgb(0 0 0 / 0.25)",
            }}
          >
            {r.icon}
            <span className="text-xs [writing-mode:vertical-rl]">{label}</span>
          </button>
        );
      })}
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close the Grimoire"
          title="Close the Grimoire"
          className="mt-2 ml-1 grid size-8 place-items-center bg-midnight-700 hover:bg-midnight-600"
          style={{ boxShadow: "0 0 0 4px var(--color-midnight-950)" }}
        >
          {/* The cover's gold clasp, in miniature */}
          <span aria-hidden className="grid size-5 place-items-center bg-gold-500 shadow-[inset_-3px_-3px_0_#b07a1c,inset_3px_3px_0_#fff4c2]">
            <span className="size-1.5 bg-midnight-950" />
          </span>
        </button>
      )}
      {music && (
        <button
          type="button"
          onClick={music.toggle}
          aria-pressed={music.on}
          aria-label={music.on ? "Turn forest music off" : "Turn forest music on"}
          title={music.on ? "Forest music: on" : "Forest music: off"}
          className={`mt-2 ml-1 grid size-8 place-items-center ${music.on ? "bg-gold-500 text-midnight-950" : "bg-midnight-700 text-silver-500"}`}
          style={{ boxShadow: "0 0 0 4px var(--color-midnight-950)" }}
        >
          <Music size={16} strokeWidth={2.5} className={music.on ? "animate-float" : ""} />
        </button>
      )}
    </nav>
  );
}
