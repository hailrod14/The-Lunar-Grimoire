"use client";

import { useState } from "react";
import { usePageTurn, type TurnDirection } from "@/components/pixel/usePageTurn";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { tideDay } from "@/lib/cycle";
import { diffKeys, type DateKey } from "@/lib/dates";
import { dismissLoadProblem, useGrimoireState } from "@/lib/store";
import { useToday } from "@/lib/useToday";
import type { Grimoire } from "@/lib/types";
import { CalendarView } from "./CalendarView";
import { Cover } from "./Cover";
import { Onboarding } from "./Onboarding";
import { CabinetView } from "./CabinetView";
import { DayView } from "./DayView";
import { JournalView } from "./JournalView";
import { SettingsPlaceholder } from "./Placeholders";
import { RIBBON_ORDER, Ribbons, type View } from "./Ribbons";

function Loading() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4" aria-busy="true">
      <div className="animate-float">
        <PixelMoon phase={0.12} variant="tide" size={96} resolution={24} />
      </div>
      <p className="font-journal text-2xl text-silver-300">Opening the grimoire…</p>
    </main>
  );
}

export function AppShell() {
  const state = useGrimoireState();
  const today = useToday();
  if (!state || !today) return <Loading />;
  if (!state.grimoire.settings.onboarded) return <Onboarding today={today} />;
  return (
    <>
      {state.problem && (
        <div role="alert" className="mx-auto mt-4 max-w-2xl px-4">
          <div className="pixel-frame pixel-frame--gold space-y-2 p-3 font-journal text-lg text-silver-100">
            <p>
              Your saved Grimoire couldn&apos;t be read ({state.problem.message}), so a fresh one was started. The unreadable
              copy was kept safely in this browser.
            </p>
            <button type="button" onClick={dismissLoadProblem} className="pixel-button pixel-button--ghost">
              Understood
            </button>
          </div>
        </div>
      )}
      {state.saveFailed && (
        <div role="alert" className="mx-auto mt-4 max-w-2xl px-4">
          <p className="pixel-frame p-3 font-journal text-lg text-silver-100">
            ⚠️ Your latest changes couldn&apos;t be saved. This browser&apos;s storage may be full or blocked (for example, in a
            private window).
          </p>
        </div>
      )}
      <Book g={state.grimoire} today={today} />
    </>
  );
}

function Book({ g, today }: { g: Grimoire; today: DateKey }) {
  const [view, setView] = useState<View>("calendar");
  const [selected, setSelected] = useState<DateKey>(today);
  // The book opens closed, on its cover; the calendar is the first page.
  const [coverOpen, setCoverOpen] = useState(false);
  const { pageRef, overlay, turn } = usePageTurn();

  const open = (date: DateKey, v: View = "day") => {
    if (!coverOpen) {
      turn("forward", () => {
        setCoverOpen(true);
        setSelected(date);
        setView(v);
      });
      return;
    }
    if (v === view && date === selected) return;
    // Later sections and later days turn forward; earlier ones turn back.
    const dir: TurnDirection =
      v === view ? (diffKeys(date, selected) > 0 ? "forward" : "backward")
      : RIBBON_ORDER.indexOf(v) > RIBBON_ORDER.indexOf(view) ? "forward"
      : "backward";
    turn(dir, () => {
      setSelected(date);
      setView(v);
      window.scrollTo({ top: 0 });
    });
  };

  // The Today and Journal ribbons always open today's page.
  const onRibbon = (v: View) => open(v === "day" || v === "journal" ? today : selected, v);

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 pb-16">
      <div className="flex items-start">
        <div className="pixel-frame pixel-frame--gold min-h-[85dvh] min-w-0 flex-1">
          <div ref={pageRef} className={coverOpen ? "p-3 sm:p-5" : ""}>
            {!coverOpen && (
              <Cover
                tide={tideDay(today, g.tides, g.settings, today)}
                tracking={g.settings.cycleTracking}
                today={today}
                onOpen={() => open(today, "calendar")}
              />
            )}
            {coverOpen && view === "calendar" && <CalendarView g={g} today={today} onOpenDay={(d) => open(d)} />}
            {coverOpen && view === "day" && (
              <DayView
                key={selected}
                g={g}
                date={selected}
                today={today}
                onNavigate={(d) => open(d, "day")}
                onOpenJournal={() => open(selected, "journal")}
                onOpenCabinet={() => open(selected, "cabinet")}
              />
            )}
            {coverOpen && view === "journal" && (
              <JournalView key={selected} g={g} date={selected} today={today} onNavigate={(d) => open(d, "journal")} />
            )}
            {coverOpen && view === "cabinet" && <CabinetView g={g} />}
            {coverOpen && view === "settings" && <SettingsPlaceholder g={g} />}
          </div>
          {overlay}
        </div>
        <Ribbons active={coverOpen ? view : null} dayLabel={view === "day" && selected !== today ? "Day" : "Today"} onSelect={onRibbon} />
      </div>
    </main>
  );
}
