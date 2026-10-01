"use client";

import { useEffect, useState } from "react";
import { usePageTurn, type TurnDirection } from "@/components/pixel/usePageTurn";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { tideDay } from "@/lib/cycle";
import { diffKeys, type DateKey } from "@/lib/dates";
import { setMusicVolume, startMusic, stopMusic } from "@/lib/music";
import { listenForInstallPrompt, registerServiceWorker } from "@/lib/pwa";
import { updateSettings } from "@/lib/grimoire";
import { dismissLoadProblem, dispatch, useGrimoireState } from "@/lib/store";
import { applyTheme, resolveTheme } from "@/lib/theme";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { startSync } from "@/lib/sync";
import { useReminderNotifications } from "@/lib/useReminders";
import { useToday } from "@/lib/useToday";
import type { Grimoire } from "@/lib/types";
import { CalendarView } from "./CalendarView";
import { Cover } from "./Cover";
import { FamiliarView } from "./FamiliarView";
import { LockScreen } from "./LockScreen";
import { Onboarding } from "./Onboarding";
import { CabinetView } from "./CabinetView";
import { DayView } from "./DayView";
import { InsightsView } from "./insights/InsightsView";
import { JournalView } from "./JournalView";
import { SettingsView } from "./SettingsView";
import { VisitSummary } from "./VisitSummary";
import { RIBBON_ORDER, Ribbons, type View } from "./Ribbons";

/** Wide enough to lay the book open as two pages side by side. */
const SPREAD_QUERY = "(min-width: 1100px)";

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
  useEffect(() => {
    listenForInstallPrompt();
    registerServiceWorker();
  }, []);
  const state = useGrimoireState();
  const today = useToday();

  const open = state?.status === "open" ? state : null;

  // Music follows the setting (and stops while locked); it starts on the next tap, as browsers require.
  const musicOn = open?.grimoire.settings.musicEnabled ?? false;
  const musicVolume = open?.grimoire.settings.musicVolume ?? 0.5;
  useEffect(() => {
    if (musicOn) startMusic();
    else stopMusic();
  }, [musicOn]);
  useEffect(() => setMusicVolume(musicVolume), [musicVolume]);
  useReminderNotifications(Boolean(open?.grimoire.settings.onboarded));

  // Sync, if it's set up on this device, starts once the Grimoire is open (after the PIN, if any).
  const isOpen = open !== null;
  useEffect(() => {
    if (isOpen) void startSync(false);
  }, [isOpen]);

  // Theme: follows the setting, the device's light/dark mode, or the season.
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const themeSetting = open?.grimoire.settings.theme;
  const hemisphere = open?.grimoire.settings.hemisphere ?? "north";
  useEffect(() => {
    if (!themeSetting || !today) return; // While locked, keep the theme from last time.
    applyTheme(resolveTheme(themeSetting, prefersDark, today, hemisphere));
  }, [themeSetting, prefersDark, today, hemisphere]);

  if (!state || !today) return <Loading />;
  if (state.status === "locked") return <LockScreen />;
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
  const [summaryOpen, setSummaryOpen] = useState(false);
  const { pageRef, overlay, turn } = usePageTurn();
  // Wide screens lay the book open flat: the calendar on the left page, everything else on the right.
  const spread = useMediaQuery(SPREAD_QUERY);
  const rightView: View = spread && view === "calendar" ? "day" : view;

  const open = (date: DateKey, v: View = "day") => {
    if (!coverOpen) {
      turn(
        "forward",
        () => {
          setCoverOpen(true);
          setSelected(date);
          setView(v);
        },
        "leather",
      );
      return;
    }
    const target: View = spread && v === "calendar" ? "day" : v;
    if (target === rightView && date === selected) return;
    // Later sections and later days turn forward; earlier ones turn back.
    const dir: TurnDirection =
      target === rightView ? (diffKeys(date, selected) > 0 ? "forward" : "backward")
      : RIBBON_ORDER.indexOf(target) > RIBBON_ORDER.indexOf(rightView) ? "forward"
      : "backward";
    turn(dir, () => {
      setSelected(date);
      setView(target);
      if (!spread) window.scrollTo({ top: 0 });
    });
  };

  /** Turn the pages back and close the cover. */
  const close = () =>
    turn(
      "backward",
      () => {
        setCoverOpen(false);
        setView("calendar");
        setSelected(today);
        window.scrollTo({ top: 0 });
      },
      "leather",
    );

  // The Today and Journal ribbons always open today's page.
  const onRibbon = (v: View) => open(v === "day" || v === "journal" ? today : selected, v);

  const page = (v: View) => (
    <>
      {v === "calendar" && <CalendarView g={g} today={today} onOpenDay={(d) => open(d)} onOpenFamiliar={() => open(selected, "familiar")} />}
      {v === "familiar" && <FamiliarView g={g} today={today} />}
      {v === "day" && (
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
      {v === "journal" && <JournalView key={selected} g={g} date={selected} today={today} onNavigate={(d) => open(d, "journal")} />}
      {v === "cabinet" && <CabinetView g={g} today={today} />}
      {v === "insights" && <InsightsView g={g} today={today} onOpenSummary={() => setSummaryOpen(true)} />}
      {v === "settings" && <SettingsView g={g} today={today} onOpenSummary={() => setSummaryOpen(true)} />}
    </>
  );

  const ribbons = (
    <Ribbons
      active={coverOpen ? rightView : null}
      dayLabel={rightView === "day" && selected !== today ? "Day" : "Today"}
      onSelect={onRibbon}
      hide={spread ? ["calendar"] : []}
      onClose={coverOpen ? close : undefined}
      music={{
        on: g.settings.musicEnabled,
        toggle: () => dispatch((x) => updateSettings(x, { musicEnabled: !x.settings.musicEnabled })),
      }}
    />
  );

  // The page that turns: the cover, the single page on phones, or the right-hand page of the spread.
  const turningPage = (
    <div className="pixel-frame pixel-frame--gold min-h-[85dvh] min-w-0 flex-1">
      <div ref={pageRef} className={coverOpen ? "p-3 sm:p-5" : ""}>
        {coverOpen ? (
          page(rightView)
        ) : (
          <Cover
            tide={tideDay(today, g.tides, g.settings, today)}
            tracking={g.settings.cycleTracking}
            today={today}
            onOpen={() => open(today, "calendar")}
          />
        )}
      </div>
      {overlay}
    </div>
  );

  if (summaryOpen) {
    return (
      <VisitSummary
        g={g}
        today={today}
        onClose={() => {
          setSummaryOpen(false);
          window.scrollTo({ top: 0 });
        }}
      />
    );
  }

  if (spread && coverOpen) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-6 pb-16">
        <div className="flex items-start">
          <div className="flex min-w-0 flex-1 items-stretch">
            {/* Left page, with the spine's shadow along its inner edge */}
            <div className="pixel-frame pixel-frame--gold min-h-[85dvh] min-w-0 flex-1 p-5">
              {page("calendar")}
              <span aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-3 bg-black/25" />
            </div>
            <div aria-hidden className="w-2 shrink-0 bg-gold-900" />
            {turningPage}
          </div>
          {ribbons}
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-4 pb-16">
      <div className="flex items-start">
        {turningPage}
        {ribbons}
      </div>
    </main>
  );
}
