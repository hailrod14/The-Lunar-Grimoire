"use client";

import type { PotionConsistency } from "@/lib/insights";
import { useChartTip } from "./useChartTip";

/** How many of the last days each daily potion was checked off. */
export function PotionBars({ potions }: { potions: PotionConsistency[] }) {
  const { container, bind, node } = useChartTip();
  return (
    <div ref={container} className="relative space-y-2">
      {potions.map((p) => {
        const pct = Math.round(p.share * 100);
        return (
          <button
            key={p.id}
            type="button"
            {...bind(`${pct}%`, `${p.name}: ${p.taken} of ${p.possible} days`)}
            aria-label={`${p.name}: taken ${p.taken} of ${p.possible} days, ${pct} percent`}
            className="block w-full text-left"
          >
            <span className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm text-silver-100">{p.name}</span>
              <span className="shrink-0 font-journal text-lg text-silver-300">
                {p.taken}/{p.possible} · {pct}%
              </span>
            </span>
            <span className="mt-0.5 block h-3 bg-midnight-950">
              <span className="block h-full bg-gold-500" style={{ width: `${pct}%` }} />
            </span>
          </button>
        );
      })}
      {node}
    </div>
  );
}
