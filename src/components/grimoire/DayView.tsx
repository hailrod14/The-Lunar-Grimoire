"use client";

import { useState } from "react";
import { BookOpen, HelpCircle, Minus, Plus, X } from "lucide-react";
import { SparkleBurst } from "@/components/pixel/SparkleBurst";
import { ElementSprite } from "@/components/sprites/ElementSprite";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { PHASE_MEANING, nextTideWindow, tideDay } from "@/lib/cycle";
import { diffKeys, formatHHMM, formatShort, nowTime, parseKey, type DateKey } from "@/lib/dates";
import {
  ASPECTS,
  ELEMENTS,
  ELEMENT_INFO,
  LEVEL_MEANINGS,
  TIME_BLOCKS,
  type Element,
  type ElementLog,
  type TimeBlock,
} from "@/lib/elements";
import {
  addDose,
  beginTide,
  endTide,
  getDay,
  removeLastDose,
  removeTide,
  reopenTide,
  setDoseTime,
  setElements,
  setFlow,
  setJournal,
  tideAt,
  togglePotion,
} from "@/lib/grimoire";
import { dispatch } from "@/lib/store";
import { doseLog, dosesOn } from "@/lib/potions";
import { FLOWS, type DayEntry, type Grimoire, type Potion, type PotionLog } from "@/lib/types";
import { SkyBadge, TideBadge } from "./Badges";
import { formatRange } from "./CalendarView";
import { DateNav } from "./DateNav";
import { Section } from "./Section";
import { DrawSection, SkyCard } from "./SkyAndDraw";
import { SymptomsSection } from "./SymptomsSection";

type Props = {
  g: Grimoire;
  date: DateKey;
  today: DateKey;
  onNavigate: (d: DateKey) => void;
  onOpenJournal: () => void;
  onOpenCabinet: () => void;
};

/** A tide that ended this many days before a date can still be extended to it. */
const EXTEND_WINDOW_DAYS = 3;

export function DayView({ g, date, today, onNavigate, onOpenJournal, onOpenCabinet }: Props) {
  const tide = tideDay(date, g.tides, g.settings, today);
  const day = getDay(g, date);
  const future = date > today;
  const tideWindow = g.settings.cycleTracking ? nextTideWindow(g.tides, g.settings, today) : null;

  return (
    <div className="space-y-4">
      <DateNav date={date} today={today} onNavigate={onNavigate} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        {g.settings.cycleTracking && (
          <TideBadge
            tide={tide}
            size={48}
            lines={tide ? [`${tide.predicted ? "Predicted · " : ""}Day ${tide.cycleDay}`, PHASE_MEANING[tide.phase]] : ["No tide logged yet"]}
          />
        )}
        <SkyBadge date={date} />
      </div>

      <SkyCard date={date} hemisphere={g.settings.hemisphere} />

      {future ? (
        <p className="pixel-frame p-4 text-center font-journal text-xl text-silver-300">
          This day hasn&apos;t come yet.{tide ? " Its tide is only a prediction." : ""}
          {tideWindow && date >= tideWindow.earliest && date <= tideWindow.latest && (
            <span className="mt-2 block text-gold-300">
              Your next tide may begin around now ({formatRange(tideWindow.earliest, tideWindow.latest)}, most likely{" "}
              {formatShort(parseKey(tideWindow.likely))}).
            </span>
          )}
        </p>
      ) : (
        <>
          <DrawSection date={date} today={today} day={day} />
          {g.settings.cycleTracking && <TideSection g={g} date={date} today={today} day={day} />}
          <ElementsSection date={date} day={day} />
          <SymptomsSection g={g} date={date} day={day} />
          <PotionsSection g={g} date={date} today={today} day={day} onOpenCabinet={onOpenCabinet} />
          <Section title="Journal">
            <textarea
              value={day.journal}
              onChange={(e) => dispatch((x) => setJournal(x, date, e.target.value))}
              placeholder="Write about your day…"
              aria-label="Journal entry"
              rows={5}
              className="pixel-frame pixel-frame--parchment block w-[calc(100%-8px)] resize-y p-3 font-journal text-xl leading-snug placeholder:text-parchment-700 focus:outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <button type="button" onClick={onOpenJournal} className="pixel-button pixel-button--ghost">
                <BookOpen size={16} /> Open in the Book &amp; Quill
              </button>
              {day.journal && <span className="font-journal text-base text-silver-500">✒️ Saved as you write</span>}
            </div>
          </Section>
        </>
      )}
    </div>
  );
}

// ── Tide ─────────────────────────────────────────────────────

function TideSection({ g, date, today, day }: { g: Grimoire; date: DateKey; today: DateKey; day: DayEntry }) {
  const current = tideAt(g.tides, date);
  const isToday = date === today;

  if (!current) {
    // A tide that ended just before this day can be stretched to include it.
    const justEnded = g.tides.some((t) => t.end && t.end < date && diffKeys(date, t.end) <= EXTEND_WINDOW_DAYS);
    return (
      <Section title="Tide">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => dispatch((x) => beginTide(x, date))} className="pixel-button pixel-button--gold">
            {isToday ? "My tide has begun" : "My tide began this day"}
          </button>
          {justEnded && (
            <button type="button" onClick={() => dispatch((x) => endTide(x, date))} className="pixel-button pixel-button--ghost">
              It was still flowing
            </button>
          )}
        </div>
      </Section>
    );
  }

  const isStart = current.start === date;
  const isLastDay = current.end === date;

  return (
    <Section title="Tide">
      <p className="font-journal text-lg text-silver-300">
        {isStart ? "Your tide began this day. " : ""}How heavy was the flow?
      </p>
      <div className="flex flex-wrap gap-1">
        {FLOWS.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={day.flow === f.id}
            onClick={() => dispatch((x) => setFlow(x, date, day.flow === f.id ? undefined : f.id))}
            className={`px-2 py-1 text-sm ${day.flow === f.id ? "bg-blood text-white" : "bg-midnight-950 text-silver-300"}`}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {isLastDay ? (
          <>
            <span className="font-journal text-lg text-silver-300">The last day of this tide.</span>
            <button type="button" onClick={() => dispatch((x) => reopenTide(x, current.id))} className="pixel-button pixel-button--ghost">
              Undo
            </button>
          </>
        ) : (
          <button type="button" onClick={() => dispatch((x) => endTide(x, date))} className="pixel-button pixel-button--ghost">
            {isToday && !current.end ? "My tide has ended" : "This was the last day"}
          </button>
        )}
        {isStart && (
          <button
            type="button"
            onClick={() => dispatch((x) => removeTide(x, current.id))}
            className="pixel-button pixel-button--ghost"
            title="Tapped “begun” by mistake? Remove this tide."
          >
            Remove this tide
          </button>
        )}
      </div>
    </Section>
  );
}

// ── Elements ─────────────────────────────────────────────────

function ElementsSection({ date, day }: { date: DateKey; day: DayEntry }) {
  const [block, setBlock] = useState<TimeBlock>("morning");
  const [legend, setLegend] = useState<Element | null>(null);
  const logs = day.elements[block];

  const setLogs = (fn: (l: ElementLog[]) => ElementLog[]) => dispatch((x) => setElements(x, date, block, fn(getDay(x, date).elements[block])));

  const toggle = (element: Element) =>
    setLogs((l) =>
      l.some((e) => e.element === element) ? l.filter((e) => e.element !== element) : [...l, { element, intensity: 3, aspect: "light" }],
    );

  const edit = (element: Element, patch: Partial<ElementLog>) =>
    setLogs((l) => l.map((e) => (e.element === element ? { ...e, ...patch } : e)));

  return (
    <Section title="Elements">
      <div role="tablist" aria-label="Time of day" className="grid grid-cols-3 gap-1">
        {TIME_BLOCKS.map((b) => {
          const count = day.elements[b.id].length;
          return (
            <button
              key={b.id}
              role="tab"
              type="button"
              aria-selected={block === b.id}
              onClick={() => setBlock(b.id)}
              className={`py-1 text-sm ${block === b.id ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-500"}`}
            >
              {b.label}
              {count > 0 && <span className="ml-1 text-gold-300">·{count}</span>}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-4 gap-1">
        {ELEMENTS.map((e) => {
          const on = logs.some((x) => x.element === e);
          return (
            <button
              key={e}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(e)}
              className={`flex flex-col items-center gap-1 py-2 ${on ? "bg-midnight-600" : "bg-midnight-950 opacity-60 hover:opacity-100"}`}
            >
              <ElementSprite element={e} size={28} />
              <span className={`text-xs ${ELEMENT_INFO[e].text}`}>{ELEMENT_INFO[e].name}</span>
            </button>
          );
        })}
      </div>

      {logs.length === 0 && (
        <p className="font-journal text-lg text-silver-500">Tap the elements you felt this {block}. You can pick more than one.</p>
      )}

      {logs.map((log) => {
        const info = ELEMENT_INFO[log.element];
        return (
          <div key={log.element} className="space-y-2 bg-midnight-950 p-2">
            <div className="flex items-center justify-between">
              <span className={`flex items-center gap-2 ${info.text}`}>
                <ElementSprite element={log.element} size={18} /> {info.name}
                <span className="font-journal text-lg text-silver-100">· {info.levels[log.intensity - 1]}</span>
              </span>
              <button
                type="button"
                aria-label={`What the ${info.name} numbers mean`}
                aria-expanded={legend === log.element}
                onClick={() => setLegend(legend === log.element ? null : log.element)}
                className="text-silver-500 hover:text-gold-300"
              >
                {legend === log.element ? <X size={18} /> : <HelpCircle size={18} />}
              </button>
            </div>

            <div className="flex gap-1" role="radiogroup" aria-label={`${info.name} intensity`}>
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={log.intensity === n}
                  aria-label={`${n}: ${info.levels[n - 1]}`}
                  onClick={() => edit(log.element, { intensity: n })}
                  className={`h-7 flex-1 font-journal text-xl ${n <= log.intensity ? `${info.bg} text-midnight-950` : "bg-midnight-800 text-silver-500"}`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex gap-1" role="radiogroup" aria-label={`${info.name} aspect`}>
              {ASPECTS.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  role="radio"
                  aria-checked={log.aspect === a.id}
                  onClick={() => edit(log.element, { aspect: a.id })}
                  className={`flex-1 py-1 text-xs ${log.aspect === a.id ? "bg-violet-500 text-violet-100" : "bg-midnight-800 text-silver-500"}`}
                >
                  {a.glyph} {a.id === "light" ? info.light : a.id === "shadow" ? info.shadow : "Mixed"}
                </button>
              ))}
            </div>

            {legend === log.element && (
              <ol className="space-y-1 border-t-4 border-midnight-700 pt-2 font-journal text-base leading-tight text-silver-300">
                {info.levels.map((name, i) => (
                  <li key={name}>
                    <span className={info.text}>
                      {i + 1} · {name}
                    </span>{" "}
                    — {LEVEL_MEANINGS[i]}
                  </li>
                ))}
              </ol>
            )}
          </div>
        );
      })}
    </Section>
  );
}

// ── Potions ──────────────────────────────────────────────────

function PotionsSection({
  g,
  date,
  today,
  day,
  onOpenCabinet,
}: {
  g: Grimoire;
  date: DateKey;
  today: DateKey;
  day: DayEntry;
  onOpenCabinet: () => void;
}) {
  // Retired potions still appear on days they were taken, so history stays complete.
  const loggedIds = new Set(day.potionLogs.map((l) => l.potionId));
  const potions = g.potions.filter((p) => !p.archived || loggedIds.has(p.id));
  // Today uses the real clock; past days default to the dose's scheduled time (editable).
  const timeFor = (scheduled?: string) => (date === today ? nowTime() : scheduled || "12:00");

  if (potions.length === 0) {
    return (
      <Section title="Potions">
        <p className="font-journal text-lg text-silver-500">Your cabinet is empty.</p>
        <button type="button" onClick={onOpenCabinet} className="pixel-button pixel-button--ghost">
          Visit the Cabinet
        </button>
      </Section>
    );
  }

  return (
    <Section title="Potions">
      <div className="space-y-2">
        {potions.map((p) => (
          <PotionRow
            key={p.id}
            potion={p}
            date={date}
            day={day}
            onToggle={(slot, scheduled) => dispatch((x) => togglePotion(x, date, p.id, timeFor(scheduled), slot))}
            onAdd={() => dispatch((x) => addDose(x, date, p.id, timeFor(p.times[0])))}
            onRemove={() => dispatch((x) => removeLastDose(x, date, p.id))}
            onTime={(logId, time) => dispatch((x) => setDoseTime(x, date, logId, time))}
          />
        ))}
      </div>
      {date !== today && <p className="font-journal text-base text-silver-500">Tap a taken time to correct it.</p>}
    </Section>
  );
}

/** A dose time that becomes an editable time field when tapped. */
function TimeChip({ log, onTime }: { log: PotionLog; onTime: (logId: string, time: string) => void }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          type="time"
          autoFocus
          aria-label={`Time taken for ${log.name}`}
          defaultValue={log.time}
          onChange={(e) => e.target.value && onTime(log.id, e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setEditing(false)}
          className="bg-midnight-800 px-1 font-journal text-base text-silver-100"
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          aria-label="Done changing time"
          className="bg-gold-500 px-1.5 text-sm text-midnight-950"
        >
          ✓
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      aria-label={`Taken at ${formatHHMM(log.time)}. Change time`}
      className="underline decoration-dotted underline-offset-2 hover:text-gold-300"
    >
      {formatHHMM(log.time)}
    </button>
  );
}

type RowProps = {
  potion: Potion;
  date: DateKey;
  day: DayEntry;
  onToggle: (slot: number, scheduledTime: string) => void;
  onAdd: () => void;
  onRemove: () => void;
  onTime: (logId: string, time: string) => void;
};

function PotionRow({ potion, date, day, onToggle, onAdd, onRemove, onTime }: RowProps) {
  const doses = potion.archived ? [] : dosesOn(potion, date);
  const extras = day.potionLogs.filter((l) => l.potionId === potion.id && l.extra);
  const takenCount = doses.filter((d) => doseLog(day, potion.id, d.slot)).length;
  const allTaken = doses.length > 0 && takenCount === doses.length;
  // A retired or off-day potion can still show doses that were logged.
  const strayChecks = day.potionLogs.filter((l) => l.potionId === potion.id && !l.extra && !doses.some((d) => d.slot === (l.slot ?? 0)));
  const status = potion.archived
    ? "retired"
    : potion.schedule === "as-needed"
      ? "as needed"
      : doses.length === 0
        ? "not scheduled today"
        : doses.length > 1
          ? `${takenCount} of ${doses.length} doses`
          : allTaken
            ? "taken"
            : formatHHMM(doses[0].time);

  return (
    <div className={`p-2 ${allTaken ? "bg-midnight-600" : "bg-midnight-950"}`}>
      <div className="flex items-center gap-2">
        <VesselSprite vessel={potion.vessel} color={potion.color} size={32} dim={doses.length > 0 && !allTaken} />
        <span className="min-w-0 flex-1">
          <span className={`block leading-tight ${allTaken ? "text-gold-300" : "text-silver-100"}`}>{potion.name}</span>
          <span className="block font-journal text-base leading-tight text-silver-500">
            {potion.dose && `${potion.dose} · `}
            {status}
          </span>
        </span>

        <div className="flex shrink-0 items-center bg-midnight-800" role="group" aria-label={`${doses.length ? "Extra doses" : "Doses"} of ${potion.name}`}>
          {extras.length > 0 && (
            <>
              <button
                type="button"
                onClick={onRemove}
                aria-label={`Remove the last ${doses.length ? "extra " : ""}dose of ${potion.name}`}
                title="Remove the last dose"
                className="grid size-7 place-items-center text-silver-300 hover:text-blood"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span aria-live="polite" className="min-w-4 text-center font-journal text-xl text-gold-300">
                {extras.length}
              </span>
            </>
          )}
          {!potion.archived && (
            <button
              type="button"
              onClick={onAdd}
              aria-label={`Log ${doses.length ? "an extra" : "a"} dose of ${potion.name}`}
              title={doses.length ? "Log an extra dose" : "Log a dose"}
              className="flex h-7 min-w-7 items-center justify-center gap-0.5 text-xs text-silver-300 hover:text-gold-300 sm:px-2"
            >
              <Plus size={14} strokeWidth={3} />
              {extras.length === 0 && <span className="hidden sm:inline">{doses.length ? "Extra" : "Take"}</span>}
            </button>
          )}
        </div>
      </div>

      {doses.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {doses.map((d) => (
            <DoseChip key={d.slot} potion={potion} time={d.time} log={doseLog(day, potion.id, d.slot)} onToggle={() => onToggle(d.slot, d.time)} onTime={onTime} />
          ))}
        </div>
      )}

      {(strayChecks.length > 0 || extras.length > 0) && (
        <p className="mt-1 flex flex-wrap gap-x-2 font-journal text-base leading-tight text-silver-500">
          {strayChecks.length > 0 && (
            <span>
              Taken{" "}
              {strayChecks.map((l, i) => (
                <span key={l.id}>
                  {i > 0 && " · "}
                  <TimeChip log={l} onTime={onTime} />
                </span>
              ))}
            </span>
          )}
          {extras.length > 0 && (
            <span>
              {doses.length ? "Extra" : "Doses"}:{" "}
              {extras.map((l, i) => (
                <span key={l.id}>
                  {i > 0 && " · "}
                  <TimeChip log={l} onTime={onTime} />
                </span>
              ))}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

/** One scheduled dose: tap to check it off (with a sparkle); a taken dose shows its editable time. */
function DoseChip({
  potion,
  time,
  log,
  onToggle,
  onTime,
}: {
  potion: Potion;
  time: string;
  log?: PotionLog;
  onToggle: () => void;
  onTime: (logId: string, time: string) => void;
}) {
  const [burst, setBurst] = useState(0);
  const taken = Boolean(log);
  return (
    <span className={`flex items-center gap-1 pr-2 ${taken ? "bg-gold-500/20" : "bg-midnight-800"}`}>
      <button
        type="button"
        aria-pressed={taken}
        aria-label={`${taken ? "Unmark" : "Mark"} the ${formatHHMM(time)} dose of ${potion.name} as taken`}
        onClick={() => {
          if (!taken) setBurst((b) => b + 1);
          onToggle();
        }}
        className="flex items-center gap-1.5 py-1 pl-1"
      >
        <span
          key={burst}
          className={`relative grid size-6 place-items-center text-sm ${burst ? "glow-pulse" : ""} ${taken ? "bg-gold-500 text-midnight-950" : "bg-midnight-950 text-transparent"}`}
        >
          ✓
          <SparkleBurst burstKey={burst} />
        </span>
        <span className={`font-journal text-lg ${taken ? "text-gold-300" : "text-silver-300"}`}>{formatHHMM(time)}</span>
      </button>
      {log && (
        <span className="font-journal text-base text-silver-500">
          · <TimeChip log={log} onTime={onTime} />
        </span>
      )}
    </span>
  );
}
