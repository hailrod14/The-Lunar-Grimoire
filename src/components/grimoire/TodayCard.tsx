"use client";

import { useState } from "react";
import { END_CHECK_DAYS, needsEndCheck, openTide, type TideDay } from "@/lib/cycle";
import { addDaysKey, diffKeys, formatHHMM, type DateKey } from "@/lib/dates";
import { ELEMENT_INFO } from "@/lib/elements";
import { beginTide, endTide, getDay, loggedElements, reopenTide, setFlow, tideAt } from "@/lib/grimoire";
import { dispatch } from "@/lib/store";
import { allDosesOn, doseLog, runningLow } from "@/lib/potions";
import { dueReminders } from "@/lib/reminders";
import { FLOWS, type Grimoire } from "@/lib/types";
import { useNow } from "@/lib/useNow";
import { describeSupply } from "./CabinetView";
import { Section } from "./Section";

/** After this many days late, add a gentle note that it may be worth checking in with someone. */
const LONG_LATE_DAYS = 21;

export function TodayCard({ g, today, tide, onOpenToday }: { g: Grimoire; today: DateKey; tide: TideDay | null; onOpenToday: () => void }) {
  const [endCheckDismissed, setEndCheckDismissed] = useState(false);
  const now = useNow();
  const awaiting = now ? dueReminders(g, today, now) : [];
  const low = runningLow(g, today);
  const [endDate, setEndDate] = useState(() => addDaysKey(today, -1));
  const day = getDay(g, today);
  const doses = allDosesOn(g, today);
  const takenDoses = doses.filter((d) => doseLog(day, d.potion.id, d.slot)).length;
  const elements = loggedElements(day);

  const tracking = g.settings.cycleTracking;
  const current = tideAt(g.tides, today);
  const flowing = current && !current.end;
  const endedToday = current?.end === today;
  const open = openTide(g.tides, today);
  const openDays = open ? diffKeys(today, open.start) + 1 : 0;

  return (
    <div className="space-y-3">
      {awaiting.length > 0 && (
        <button type="button" onClick={onOpenToday} className="pixel-frame pixel-frame--gold block w-full p-3 text-left">
          <span className="block text-gold-300">⏰ Awaiting you</span>
          <span className="block font-journal text-lg text-silver-100">
            {awaiting.map((d) => `${d.potion.name} (${formatHHMM(d.time)})`).join(" · ")}
          </span>
        </button>
      )}
      {low.length > 0 && (
        <div className="pixel-frame pixel-frame--gold p-3" role="status">
          <p className="text-gold-300">🧪 Time to refill</p>
          {low.map(({ potion, status }) => (
            <p key={potion.id} className="font-journal text-lg leading-snug text-silver-100">
              {potion.name}: {describeSupply(status)}
            </p>
          ))}
        </div>
      )}
      {tracking && open && needsEndCheck(g.tides, today) && !endCheckDismissed && (
        <Section title="Has your tide ended?" className="pixel-frame--gold">
          <p className="font-journal text-lg text-silver-300">It&apos;s been flowing for {openDays} days. When was its last day?</p>
          <form
            className="flex flex-wrap items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (endDate >= open.start && endDate <= today) dispatch((x) => endTide(x, endDate));
            }}
          >
            <input
              type="date"
              aria-label="Last day of this tide"
              value={endDate}
              min={open.start}
              max={today}
              onChange={(e) => setEndDate(e.target.value)}
              className="pixel-frame bg-midnight-950 px-2 py-1 font-journal text-xl text-silver-100"
            />
            <button type="submit" className="pixel-button pixel-button--gold">
              That&apos;s the day
            </button>
          </form>
          <button type="button" onClick={() => setEndCheckDismissed(true)} className="pixel-button pixel-button--ghost">
            Still flowing
          </button>
        </Section>
      )}

      {tracking && tide && tide.daysLate > 0 && !tide.bleeding && (
        <p className="pixel-frame p-3 font-journal text-lg text-silver-300">
          The waning lingers… your tide is {tide.daysLate} day{tide.daysLate === 1 ? "" : "s"} later than usual and may be near.
          {tide.daysLate >= LONG_LATE_DAYS &&
            " Tides can skip for many reasons, like stress, illness, travel, or changes in medication. If this is unusual for you, it may be worth checking in with a healthcare provider."}
        </p>
      )}

      <Section title="Today">
        {tracking && (
          <div className="space-y-2">
            {flowing ? (
              <>
                <p className="font-journal text-lg text-silver-300">How heavy is your flow today?</p>
                <div className="flex flex-wrap gap-1">
                  {FLOWS.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      aria-pressed={day.flow === f.id}
                      onClick={() => dispatch((x) => setFlow(x, today, day.flow === f.id ? undefined : f.id))}
                      className={`px-2 py-1 text-sm ${day.flow === f.id ? "bg-blood text-white" : "bg-midnight-950 text-silver-300"}`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => dispatch((x) => endTide(x, today))} className="pixel-button pixel-button--ghost">
                    My tide has ended
                  </button>
                  {current.start < today && openDays < END_CHECK_DAYS && (
                    <button
                      type="button"
                      onClick={() => dispatch((x) => endTide(x, addDaysKey(today, -1)))}
                      className="pixel-button pixel-button--ghost"
                    >
                      It ended yesterday
                    </button>
                  )}
                </div>
              </>
            ) : endedToday ? (
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-journal text-lg text-silver-300">Your tide ended today.</p>
                <button type="button" onClick={() => dispatch((x) => reopenTide(x, current.id))} className="pixel-button pixel-button--ghost">
                  Undo
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => dispatch((x) => beginTide(x, today))} className="pixel-button pixel-button--gold">
                My tide has begun
              </button>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1 font-journal text-lg text-silver-300">
          <span>Elements: {elements.map((e) => ELEMENT_INFO[e].name).join(", ") || "none yet"}</span>
          {doses.length > 0 && (
            <span>
              Potions: {takenDoses} of {doses.length} {doses.length === 1 ? "dose" : "doses"} taken
            </span>
          )}
          <span>Journal: {day.journal.trim() ? "written" : "not yet"}</span>
        </div>
        <button type="button" onClick={onOpenToday} className="pixel-button pixel-button--gold w-full">
          Open today&apos;s page
        </button>
      </Section>
    </div>
  );
}
