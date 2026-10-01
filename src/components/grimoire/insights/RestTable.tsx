import { PHASE_LABEL } from "@/lib/cycle";
import type { RestHighlight, RestRow } from "@/lib/insights";
import type { Level } from "@/lib/types";
import { PHASE_BG } from "../CalendarView";
import { ENERGY, SLEEP_QUALITY } from "../RestSection";

const hours = (h: number | null) => (h === null ? "–" : `${h.toFixed(1)} h`);
const word = (names: Record<Level, string>, v: number | null) => (v === null ? "–" : names[Math.round(v) as Level]);

function Pips({ value }: { value: number | null }) {
  if (value === null) return null;
  return (
    <span aria-hidden className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`size-1.5 ${i <= Math.round(value) ? "bg-gold-300" : "bg-midnight-600"}`} />
      ))}
    </span>
  );
}

export function RestHighlights({ highlights }: { highlights: RestHighlight[] }) {
  if (!highlights.length) return null;
  return (
    <ul className="space-y-1 font-journal text-lg leading-snug text-silver-100">
      {highlights.map((h) => (
        <li key={h.kind}>
          {h.kind === "sleep"
            ? `🌙 You sleep least in your ${PHASE_LABEL[h.low]} (${hours(h.lowValue)}) and most in your ${PHASE_LABEL[h.high]} (${hours(h.highValue)}).`
            : `✨ Your energy runs lowest in your ${PHASE_LABEL[h.low]} and brightest in your ${PHASE_LABEL[h.high]}.`}
        </li>
      ))}
    </ul>
  );
}

export function RestTable({ rows }: { rows: RestRow[] }) {
  return (
    <table className="w-full border-separate border-spacing-y-1 text-left">
      <caption className="sr-only">Average sleep, sleep quality, and energy by tide phase</caption>
      <thead>
        <tr className="text-sm text-silver-300">
          <th scope="col" className="font-normal">
            {rows[0]?.phase === "all" ? "" : "Phase"}
          </th>
          <th scope="col" className="font-normal">Sleep</th>
          <th scope="col" className="font-normal">Slept</th>
          <th scope="col" className="font-normal">Energy</th>
        </tr>
      </thead>
      <tbody className="font-journal text-lg text-silver-100">
        {rows.map((r) => (
          <tr key={r.phase} className="bg-midnight-950">
            <th scope="row" className="py-1 pr-1 pl-2 font-normal">
              {r.phase === "all" ? (
                "Average"
              ) : (
                <span className="flex flex-col">
                  <span className="text-base leading-tight">{PHASE_LABEL[r.phase]}</span>
                  <span className={`h-1 w-5 ${PHASE_BG[r.phase]}`} />
                </span>
              )}
            </th>
            <td className="py-1 pr-1 tabular-nums">{hours(r.hours)}</td>
            <td className="py-1 pr-1">
              <span className="flex flex-col gap-0.5">
                {word(SLEEP_QUALITY, r.quality)}
                <Pips value={r.quality} />
              </span>
            </td>
            <td className="py-1 pr-2">
              <span className="flex flex-col gap-0.5">
                {word(ENERGY, r.energy)}
                <Pips value={r.energy} />
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
