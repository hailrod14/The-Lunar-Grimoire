"use client";

import { ElementSprite } from "@/components/sprites/ElementSprite";
import { PHASE_LABEL } from "@/lib/cycle";
import { ELEMENT_INFO, ELEMENTS, type Element } from "@/lib/elements";
import type { Insights } from "@/lib/insights";
import { PHASE_BG } from "../CalendarView";
import { useChartTip } from "./useChartTip";

/** One hue (gold) from the theme's ramp: step 0 is "not felt", then less → more. */
const RAMP = [0, 1, 2, 3, 4, 5].map((n) => `var(--heat-${n})`);
const step = (share: number) => (share === 0 ? 0 : Math.min(5, 1 + Math.floor(share * 5)));
const pct = (n: number) => `${Math.round(n * 100)}%`;

const VERBS: Record<Element, string> = {
  fire: "burns brightest",
  water: "flows strongest",
  earth: "settles deepest",
  air: "stirs most",
};

export function ElementHighlights({ highlights }: { highlights: Insights["elements"]["highlights"] }) {
  if (!highlights.length) return null;
  return (
    <ul className="space-y-1 font-journal text-xl text-silver-100">
      {highlights.map((h) => (
        <li key={h.element} className="flex items-start gap-2">
          <span className="mt-1 shrink-0">
            <ElementSprite element={h.element} size={18} />
          </span>
          <span>
            {ELEMENT_INFO[h.element].name} {VERBS[h.element]} in your {PHASE_LABEL[h.phase]}: {pct(h.share)} of what you felt then.
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Phases × elements: what share of each phase's element logs went to each element. */
export function ElementGrid({ rows }: { rows: Insights["elements"]["rows"] }) {
  const { container, bind, node } = useChartTip();

  return (
    <div ref={container} className="relative">
      <table className="w-full border-separate border-spacing-0.5">
        <caption className="sr-only">Share of each tide phase&apos;s element logs that went to each element</caption>
        <thead>
          <tr>
            <th scope="col" className="w-16" />
            {ELEMENTS.map((e) => (
              <th key={e} scope="col" className="pb-1 font-normal">
                <span className="flex flex-col items-center gap-0.5">
                  <ElementSprite element={e} size={18} />
                  <span className="text-[10px] text-silver-300">{ELEMENT_INFO[e].name}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.phase}>
              <th scope="row" className="pr-1 text-left font-normal">
                <span className="block text-[11px] leading-tight text-silver-100">{PHASE_LABEL[row.phase]}</span>
                <span className={`mt-0.5 block h-1 w-6 ${PHASE_BG[row.phase]}`} />
                <span className="block font-journal text-sm leading-tight text-silver-500">{row.total} logs</span>
              </th>
              {row.cells.map((cell) => {
                const s = step(cell.share);
                const detail = cell.count
                  ? `${cell.count} of ${row.total} in ${PHASE_LABEL[row.phase]}${cell.shadowShare >= 0.5 ? ` · mostly ${ELEMENT_INFO[cell.element].shadow.toLowerCase()}` : ` · mostly ${ELEMENT_INFO[cell.element].light.toLowerCase()}`}`
                  : `Not felt in ${PHASE_LABEL[row.phase]}`;
                return (
                  <td key={cell.element} className="p-0">
                    <button
                      type="button"
                      {...bind(`${ELEMENT_INFO[cell.element].name}: ${pct(cell.share)}`, detail)}
                      aria-label={`${ELEMENT_INFO[cell.element].name} in ${PHASE_LABEL[row.phase]}: ${pct(cell.share)}, ${detail}`}
                      className="grid h-11 w-full place-items-center font-journal text-lg hover:outline-2 hover:outline-silver-100 focus-visible:outline-offset-0"
                      style={{ background: RAMP[s], color: s >= 4 ? "var(--heat-ink-bright)" : "var(--heat-ink-dim)" }}
                    >
                      {cell.count ? pct(cell.share) : "·"}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 flex items-center justify-end gap-1 font-journal text-base text-silver-500" aria-hidden>
        less
        {RAMP.slice(1).map((c) => (
          <span key={c} className="h-2 w-4" style={{ background: c }} />
        ))}
        more
      </div>
      {node}
    </div>
  );
}
