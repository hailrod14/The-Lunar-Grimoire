"use client";

import { formatShort, parseKey } from "@/lib/dates";
import type { CycleSummary } from "@/lib/insights";
import { useChartTip } from "./useChartTip";

const HEIGHT = 120;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-midnight-950 px-2 py-1">
      <p className="text-xs tracking-wider text-silver-500 uppercase">{label}</p>
      <p className="font-journal text-2xl leading-tight text-gold-300">{value}</p>
    </div>
  );
}

/** Each completed cycle's length, oldest to newest, with the average marked. */
export function CycleBars({ summary }: { summary: CycleSummary }) {
  const { container, bind, node } = useChartTip();
  const top = Math.max(35, summary.longest + 3);
  const y = (days: number) => (days / top) * HEIGHT;
  const avg = Math.round(summary.average);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
        <Stat label="Average cycle" value={`${avg} days`} />
        <Stat label="Range" value={summary.shortest === summary.longest ? `${summary.shortest} days` : `${summary.shortest}–${summary.longest} days`} />
        <Stat label="Average tide" value={summary.tideAverage ? `${Math.round(summary.tideAverage)} days` : "—"} />
        <Stat label="Cycles shown" value={`${summary.bars.length}`} />
      </div>

      <div ref={container} className="relative pt-2">
        <div className="relative flex items-end gap-0.5 border-b-2 border-silver-700" style={{ height: HEIGHT }} role="list" aria-label="Cycle lengths">
          {/* The average, as a dashed reference line */}
          <span aria-hidden className="absolute inset-x-0 border-t-2 border-dashed border-silver-500" style={{ bottom: y(summary.average) }} />
          <span aria-hidden className="absolute right-0 bg-midnight-800 px-1 font-journal text-base text-silver-300" style={{ bottom: y(summary.average) + 2 }}>
            avg {avg}
          </span>
          {summary.bars.map((bar) => (
            <button
              key={bar.start}
              type="button"
              role="listitem"
              {...bind(`${bar.length} days`, `Cycle from ${formatShort(parseKey(bar.start))}`)}
              aria-label={`Cycle from ${formatShort(parseKey(bar.start))}: ${bar.length} days`}
              className="group relative flex h-full max-w-8 flex-1 items-end"
            >
              <span className="block w-full bg-gold-500 group-hover:bg-gold-300 group-focus-visible:bg-gold-300" style={{ height: y(bar.length) }} />
            </button>
          ))}
        </div>
        <div className="mt-1 flex justify-between font-journal text-base text-silver-500" aria-hidden>
          <span>{formatShort(parseKey(summary.bars[0].start))}</span>
          <span>{formatShort(parseKey(summary.bars.at(-1)!.start))}</span>
        </div>
        {node}
      </div>
    </div>
  );
}
