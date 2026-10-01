"use client";

import { useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";
import { dateKey, parseKey, type DateKey } from "@/lib/dates";
import { ELEMENT_INFO } from "@/lib/elements";
import { buildVisitSummary } from "@/lib/summary";
import { FLOWS, type Grimoire } from "@/lib/types";

const SPANS = [
  { months: 3, label: "Last 3 months" },
  { months: 6, label: "Last 6 months" },
  { months: 12, label: "Last year" },
  { months: 0, label: "Everything" },
];

const fullDate = (d: DateKey) => parseKey(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
const days = (n?: number) => {
  if (n === undefined) return "—";
  const rounded = Math.round(n * 10) / 10;
  return `${rounded} ${rounded === 1 ? "day" : "days"}`;
};
const flowLabel = (id?: string) => FLOWS.find((f) => f.id === id)?.label ?? "—";

function Th({ children }: { children: React.ReactNode }) {
  return <th className="border-b-2 border-black py-1 pr-3 text-left font-semibold">{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-neutral-300 py-1 pr-3 align-top">{children}</td>;
}

/** A plain, printable summary for a healthcare visit. Black on white, clinical language, no journal. */
export function VisitSummary({ g, today, onClose }: { g: Grimoire; today: DateKey; onClose: () => void }) {
  const [months, setMonths] = useState(6);
  const [includeMoods, setIncludeMoods] = useState(false);
  const [name, setName] = useState("");

  const earliestLog = [...Object.keys(g.days), ...g.tides.map((t) => t.start)].sort()[0] ?? today;
  const start = parseKey(today);
  const from = months ? dateKey(new Date(start.getFullYear(), start.getMonth() - months, start.getDate())) : earliestLog;
  const s = buildVisitSummary(g, from, today, today);

  return (
    <div className="min-h-dvh bg-neutral-200 pb-10">
      <div className="no-print sticky top-0 z-10 space-y-2 bg-midnight-900 px-4 py-3 shadow-lg">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2">
          <button type="button" onClick={onClose} className="pixel-button pixel-button--ghost">
            <ArrowLeft size={16} /> Back to the Grimoire
          </button>
          <button type="button" onClick={() => window.print()} className="pixel-button pixel-button--gold">
            <Printer size={16} /> Print or save as PDF
          </button>
        </div>
        <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 text-sm text-silver-300">
          {SPANS.map((span) => (
            <button
              key={span.months}
              type="button"
              aria-pressed={months === span.months}
              onClick={() => setMonths(span.months)}
              className={`px-2 py-1 ${months === span.months ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-300"}`}
            >
              {span.label}
            </button>
          ))}
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={includeMoods} onChange={(e) => setIncludeMoods(e.target.checked)} className="accent-gold-500" />
            Include mood elements
          </label>
          <label className="flex items-center gap-1">
            Name (optional, not saved)
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-40 bg-midnight-950 px-2 py-0.5 text-silver-100" />
          </label>
        </div>
      </div>

      <article className="print-sheet mx-auto mt-6 max-w-3xl space-y-6 bg-white p-8 font-sans text-[13px] leading-relaxed text-black shadow-xl">
        <header className="border-b-2 border-black pb-3">
          <h1 className="text-xl font-bold">Menstrual cycle, symptom &amp; medication summary</h1>
          {name.trim() && <p className="text-base">{name.trim()}</p>}
          <p>
            Covering {fullDate(s.from)} – {fullDate(s.to)} · prepared {fullDate(today)}
          </p>
          <p className="text-neutral-600">Self-reported records from a personal tracking app. {s.daysLogged} days with entries in this span.</p>
        </header>

        {s.tracking && (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Cycle overview</h2>
            <table className="w-full border-collapse">
              <tbody>
                <tr><Td>Average cycle length</Td><Td>{days(s.overview.averageCycle)} ({s.overview.cyclesMeasured} cycles measured)</Td></tr>
                <tr><Td>Shortest / longest cycle</Td><Td>{s.overview.shortestCycle === undefined ? "—" : `${s.overview.shortestCycle} / ${s.overview.longestCycle} days`}</Td></tr>
                <tr><Td>Average period length</Td><Td>{days(s.overview.averagePeriod)}</Td></tr>
                <tr><Td>Typical variation</Td><Td>± {s.overview.variation} {s.overview.variation === 1 ? "day" : "days"}</Td></tr>
                <tr><Td>Last period started</Td><Td>{s.overview.lastPeriodStart ? fullDate(s.overview.lastPeriodStart) : "—"}</Td></tr>
                <tr><Td>Next period expected</Td><Td>{s.overview.nextExpected ? `${fullDate(s.overview.nextExpected.earliest)} – ${fullDate(s.overview.nextExpected.latest)} (estimate)` : "—"}</Td></tr>
              </tbody>
            </table>
          </section>
        )}

        {s.tracking && (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Periods</h2>
            {s.periods.length ? (
              <table className="w-full border-collapse">
                <thead><tr><Th>Started</Th><Th>Ended</Th><Th>Period length</Th><Th>Cycle length</Th><Th>Heaviest flow</Th></tr></thead>
                <tbody>
                  {s.periods.map((p) => (
                    <tr key={p.start}>
                      <Td>{fullDate(p.start)}</Td>
                      <Td>{p.end ? fullDate(p.end) : "ongoing"}</Td>
                      <Td>{days(p.length)}</Td>
                      <Td>{p.cycleLength ? `${p.cycleLength} days` : "—"}</Td>
                      <Td>{flowLabel(p.heaviestFlow)}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No periods recorded in this span.</p>
            )}
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-base font-bold">Symptoms</h2>
          {s.symptoms.length ? (
            <table className="w-full border-collapse">
              <thead><tr><Th>Symptom</Th><Th>Days</Th><Th>Mild / moderate / strong</Th>{s.tracking && <Th>Most often in</Th>}</tr></thead>
              <tbody>
                {s.symptoms.map((x) => (
                  <tr key={x.name}>
                    <Td>{x.name}</Td>
                    <Td>{x.days}</Td>
                    <Td>{x.mild} / {x.moderate} / {x.strong}</Td>
                    {s.tracking && <Td>{x.commonPhase ?? "—"}</Td>}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No symptoms recorded in this span.</p>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-base font-bold">Medications &amp; supplements</h2>
          {s.medications.length || s.asNeeded.length ? (
            <table className="w-full border-collapse">
              <thead><tr><Th>Name</Th><Th>Dose</Th><Th>Schedule</Th><Th>Taken</Th></tr></thead>
              <tbody>
                {s.medications.map((m) => (
                  <tr key={m.name}>
                    <Td>{m.name}</Td>
                    <Td>{m.dose || "—"}</Td>
                    <Td>{m.schedule}</Td>
                    <Td>{m.scheduled ? `${m.taken} of ${m.scheduled} scheduled doses (${Math.round((m.taken / m.scheduled) * 100)}%)` : "—"}</Td>
                  </tr>
                ))}
                {s.asNeeded.map((m) => (
                  <tr key={m.name}>
                    <Td>{m.name}</Td>
                    <Td>{m.dose || "—"}</Td>
                    <Td>as needed</Td>
                    <Td>{m.doses} doses on {m.days} days</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p>No medications recorded in this span.</p>
          )}
        </section>

        {includeMoods && (
          <section className="space-y-2">
            <h2 className="text-base font-bold">Mood (self-rated)</h2>
            {s.moods.length ? (
              <table className="w-full border-collapse">
                <thead><tr><Th>Mood</Th><Th>Times logged</Th><Th>Average intensity (1–5)</Th><Th>Leaning difficult</Th></tr></thead>
                <tbody>
                  {s.moods.map((m) => (
                    <tr key={m.element}>
                      <Td>{ELEMENT_INFO[m.element].light} / {ELEMENT_INFO[m.element].shadow.toLowerCase()}</Td>
                      <Td>{m.logs}</Td>
                      <Td>{m.averageIntensity.toFixed(1)}</Td>
                      <Td>{Math.round(m.shadowShare * 100)}% of the time ({ELEMENT_INFO[m.element].shadow.toLowerCase()})</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No moods recorded in this span.</p>
            )}
          </section>
        )}

        <footer className="border-t border-neutral-400 pt-2 text-[11px] text-neutral-600">
          Personal journal entries are not included. Dates and predictions are self-reported estimates, not a diagnosis.
        </footer>
      </article>
    </div>
  );
}
