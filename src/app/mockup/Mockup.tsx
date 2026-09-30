"use client";

import { useState } from "react";
import { dateKey, diffDays } from "@/lib/dates";
import { CabinetView } from "./CabinetView";
import { CalendarView } from "./CalendarView";
import { DayView } from "./DayView";
import { JournalView } from "./JournalView";
import { INITIAL_DAYS, INITIAL_POTIONS, TODAY, emptyDay, type DayMock, type Potion } from "./mockData";
import { Ribbons, type View } from "./Ribbons";
import { SettingsView } from "./SettingsView";

export function Mockup() {
  const [view, setView] = useState<View>("calendar");
  const [selected, setSelected] = useState(TODAY);
  const [days, setDays] = useState<Record<string, DayMock>>(INITIAL_DAYS);
  const [potions, setPotions] = useState<Potion[]>(INITIAL_POTIONS);

  const day = days[dateKey(selected)] ?? emptyDay();
  const update = (fn: (d: DayMock) => DayMock) =>
    setDays((prev) => ({ ...prev, [dateKey(selected)]: fn(prev[dateKey(selected)] ?? emptyDay()) }));

  const open = (d: Date, v: View = "day") => {
    setSelected(d);
    setView(v);
    window.scrollTo({ top: 0 });
  };

  const onRibbon = (v: View) => {
    // The Today and Journal ribbons always open today's page.
    if (v === "day" || v === "journal") open(TODAY, v);
    else open(selected, v);
  };

  const isToday = diffDays(selected, TODAY) === 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-16">
      <p className="mb-3 text-center font-journal text-lg text-violet-300">
        Clickable mockup · sample data · nothing is saved
      </p>
      <div className="flex items-start">
        <div className="pixel-frame pixel-frame--gold min-h-[85dvh] min-w-0 flex-1 p-3 sm:p-5">
          {view === "calendar" && <CalendarView days={days} potions={potions} onOpenDay={(d) => open(d)} />}
          {view === "day" && (
            <DayView
              key={dateKey(selected)}
              date={selected}
              day={day}
              potions={potions}
              update={update}
              onNavigate={(d) => open(d, "day")}
              onOpenJournal={() => open(selected, "journal")}
            />
          )}
          {view === "journal" && (
            <JournalView key={dateKey(selected)} date={selected} day={day} update={update} onNavigate={(d) => open(d, "journal")} />
          )}
          {view === "cabinet" && <CabinetView potions={potions} setPotions={setPotions} />}
          {view === "settings" && <SettingsView />}
        </div>
        <Ribbons active={view} dayLabel={view === "day" && !isToday ? "Day" : "Today"} onSelect={onRibbon} />
      </div>
    </div>
  );
}
