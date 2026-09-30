import { PixelMoon } from "@/components/sprites/PixelMoon";
import { PHASE_LABEL, type TideDay } from "@/lib/cycle";
import { parseKey, type DateKey } from "@/lib/dates";
import { skyMoonName, skyMoonPhase } from "@/lib/moon";

/** Your personal Tide: always gold. Shows a waiting moon when there's no tide data. */
export function TideBadge({ tide, size = 56, lines }: { tide: TideDay | null; size?: number; lines: string[] }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <PixelMoon
        phase={tide?.phaseValue ?? 0}
        variant="tide"
        size={size}
        resolution={20}
        title={tide ? `Your Tide: ${PHASE_LABEL[tide.phase]}` : "Your Tide"}
        className="shrink-0"
      />
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-gold-700">Your Tide</p>
        <p className="text-lg leading-tight text-gold-300">{tide ? PHASE_LABEL[tide.phase] : "Awaiting"}</p>
        {lines.map((line) => (
          <p key={line} className="font-journal text-lg leading-tight text-silver-300">
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}

/** The real moon in the sky: always a small silver badge. */
export function SkyBadge({ date }: { date: DateKey }) {
  const phase = skyMoonPhase(parseKey(date));
  const name = skyMoonName(phase);
  return (
    <div className="pixel-frame pixel-frame--silver flex shrink-0 items-center gap-2 px-2 py-1" title={`Sky Moon: ${name}`}>
      <PixelMoon phase={phase} variant="sky" size={24} resolution={12} title={`Sky Moon: ${name}`} />
      <div className="leading-none">
        <p className="text-[10px] uppercase tracking-wider text-silver-500">Sky</p>
        <p className="font-journal text-base leading-none text-silver-100">{name}</p>
      </div>
    </div>
  );
}
