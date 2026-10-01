"use client";

import { FileText } from "lucide-react";
import { CrystalBallGlyph } from "@/components/sprites/Glyphs";
import { PHASE_LABEL } from "@/lib/cycle";
import type { DateKey } from "@/lib/dates";
import { MIN_CYCLES, MIN_ELEMENT_LOGS, MIN_REST_DAYS, POTION_WINDOW, computeInsights } from "@/lib/insights";
import type { Grimoire } from "@/lib/types";
import { PHASE_BG } from "../CalendarView";
import { Section } from "../Section";
import { CycleBars } from "./CycleBars";
import { ElementGrid, ElementHighlights } from "./ElementGrid";
import { PotionBars } from "./PotionBars";
import { RestHighlights, RestTable } from "./RestTable";

function Clouded({ children }: { children: React.ReactNode }) {
  return <p className="font-journal text-lg text-silver-500">🌫️ {children}</p>;
}

/** The Scrying Glass: patterns across your tides, elements, symptoms, and potions. */
export function InsightsView({ g, today, onOpenSummary }: { g: Grimoire; today: DateKey; onOpenSummary: () => void }) {
  const insights = computeInsights(g, today);
  const tracking = g.settings.cycleTracking;
  const { elements, rest, symptoms, cycles, potions } = insights;

  return (
    <div className="space-y-4">
      <header className="flex flex-col items-center gap-1 text-center">
        <div className="animate-float">
          <CrystalBallGlyph size={48} />
        </div>
        <h2 className="pixel-title text-2xl">The Scrying Glass</h2>
        <p className="font-journal text-lg text-silver-300">Patterns in your tides, moods, and potions. Clearer the more you log.</p>
      </header>

      {tracking && (
        <Section title="Elements through your tide">
          {elements.ready ? (
            <>
              <ElementHighlights highlights={elements.highlights} />
              <ElementGrid rows={elements.rows} />
              <p className="font-journal text-base text-silver-500">
                Each row adds up to 100%: what share of that phase&apos;s logged elements went to each one. Tap a square for more.
              </p>
            </>
          ) : (
            <Clouded>
              The glass is still clouded. Log elements a little longer: {MIN_ELEMENT_LOGS - elements.totalLogs} more to go.
            </Clouded>
          )}
        </Section>
      )}

      <Section title={tracking ? "Rest & energy through your tide" : "Rest & energy"}>
        {rest.ready ? (
          <>
            <RestHighlights highlights={rest.highlights} />
            <RestTable rows={rest.rows} />
          </>
        ) : (
          <Clouded>
            Log your sleep and energy on the day page for {MIN_REST_DAYS - rest.logged} more day{MIN_REST_DAYS - rest.logged === 1 ? "" : "s"}{" "}
            and your patterns will show here.
          </Clouded>
        )}
      </Section>

      {tracking && (
        <Section title="Symptoms through your tide">
          {symptoms.ready ? (
            <ul className="space-y-2">
              {symptoms.phases
                .filter((p) => p.daysLogged > 0)
                .map((p) => (
                  <li key={p.phase} className="bg-midnight-950 p-2">
                    <p className="flex items-center gap-2 text-sm text-silver-100">
                      <span className={`h-1 w-5 ${PHASE_BG[p.phase]}`} />
                      {PHASE_LABEL[p.phase]}
                      <span className="font-journal text-base text-silver-500">
                        · {p.daysLogged} day{p.daysLogged === 1 ? "" : "s"} with symptoms
                      </span>
                    </p>
                    <p className="font-journal text-lg text-silver-300">
                      {p.top.map((s) => `${s.name} (${s.days} of ${p.daysLogged})`).join(" · ")}
                    </p>
                  </li>
                ))}
            </ul>
          ) : (
            <Clouded>Log symptoms on a few more days and the phases they gather in will show here.</Clouded>
          )}
        </Section>
      )}

      {tracking && (
        <Section title="Your cycles">
          {cycles ? (
            <CycleBars summary={cycles} />
          ) : (
            <Clouded>
              After {MIN_CYCLES} complete cycles, their lengths will appear here. Adding past tides in Settings fills this in sooner.
            </Clouded>
          )}
        </Section>
      )}

      <Section title={`Potions, the last ${POTION_WINDOW} days`}>
        {potions.length ? (
          <PotionBars potions={potions} />
        ) : (
          <Clouded>Check off your daily potions and your consistency will show here.</Clouded>
        )}
      </Section>

      <button type="button" onClick={onOpenSummary} className="pixel-button pixel-button--gold w-full">
        <FileText size={16} /> Make a summary for a doctor visit
      </button>

      {!tracking && (
        <p className="px-2 font-journal text-lg text-silver-500">
          Turn cycle tracking on in Settings to see how your elements and symptoms move with your tide.
        </p>
      )}
      <p className="px-2 font-journal text-base text-silver-500">
        These are reflections from your own entries, not medical findings, and they never leave this device.
      </p>
    </div>
  );
}
