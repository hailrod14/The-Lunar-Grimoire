"use client";

import { useState } from "react";
import { BookOpen, ChevronLeft, ChevronRight, HelpCircle, Minus, Plus, X } from "lucide-react";
import { SparkleBurst } from "@/components/pixel/SparkleBurst";
import { ElementSprite } from "@/components/sprites/ElementSprite";
import { VesselSprite } from "@/components/sprites/VesselSprite";
import { addDays, diffDays, formatLong, formatTime } from "@/lib/dates";
import {
  ASPECTS,
  ELEMENTS,
  ELEMENT_INFO,
  LEVEL_MEANINGS,
  TIME_BLOCKS,
  type ElementLog,
  type TimeBlock,
} from "@/lib/elements";
import type { Element } from "@/components/sprites/ElementSprite";
import { SkyBadge, TideBadge } from "./Badges";
import { FLOWS, PHASE_MEANING, TODAY, displayTime, tideFor, type DayMock, type Potion } from "./mockData";

type Props = {
  date: Date;
  day: DayMock;
  potions: Potion[];
  update: (fn: (d: DayMock) => DayMock) => void;
  onNavigate: (d: Date) => void;
  onOpenJournal: () => void;
};

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="pixel-frame space-y-3 p-3">
      <h3 className="text-lg text-gold-300">{title}</h3>
      {children}
    </section>
  );
}

export function DateNav({ date, onNavigate }: { date: Date; onNavigate: (d: Date) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <button type="button" aria-label="Previous day" onClick={() => onNavigate(addDays(date, -1))} className="p-1 text-gold-300">
        <ChevronLeft strokeWidth={3} />
      </button>
      <h2 className="pixel-title text-center text-xl leading-tight">
        {diffDays(date, TODAY) === 0 ? "Today · " : ""}
        {formatLong(date)}
      </h2>
      <button type="button" aria-label="Next day" onClick={() => onNavigate(addDays(date, 1))} className="p-1 text-gold-300">
        <ChevronRight strokeWidth={3} />
      </button>
    </div>
  );
}

export function DayView({ date, day, potions, update, onNavigate, onOpenJournal }: Props) {
  const tide = tideFor(date);
  const isFuture = diffDays(date, TODAY) > 0;

  return (
    <div className="space-y-4">
      <DateNav date={date} onNavigate={onNavigate} />
      <div className="flex flex-wrap items-start justify-between gap-2">
        <TideBadge tide={tide} size={48} detail={PHASE_MEANING[tide.phase]} />
        <SkyBadge date={date} />
      </div>

      {isFuture ? (
        <p className="pixel-frame p-4 text-center font-journal text-xl text-silver-300">
          This day hasn&apos;t come yet. Its tide is only a prediction.
        </p>
      ) : (
        <>
          <TideSection day={day} update={update} />
          <ElementsSection day={day} update={update} />
          <PotionsSection day={day} potions={potions} update={update} />
          <Section title="Journal">
            <textarea
              value={day.journal}
              onChange={(e) => update((d) => ({ ...d, journal: e.target.value }))}
              placeholder="Write about your day…"
              rows={5}
              className="pixel-frame pixel-frame--parchment block w-[calc(100%-8px)] resize-y p-3 font-journal text-xl leading-snug placeholder:text-parchment-700 focus:outline-none"
            />
            <button type="button" onClick={onOpenJournal} className="pixel-button pixel-button--ghost">
              <BookOpen size={16} /> Open in the Book &amp; Quill
            </button>
          </Section>
        </>
      )}
    </div>
  );
}

function TideSection({ day, update }: { day: DayMock; update: Props["update"] }) {
  const bleeding = Boolean(day.flow);
  return (
    <Section title="Tide">
      {bleeding ? (
        <>
          <p className="font-journal text-lg text-silver-300">Flow today</p>
          <div className="flex flex-wrap gap-1">
            {FLOWS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={day.flow === f.id}
                onClick={() => update((d) => ({ ...d, flow: f.id }))}
                className={`px-2 py-1 text-sm ${day.flow === f.id ? "bg-blood text-white" : "bg-midnight-950 text-silver-300"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => update((d) => ({ ...d, flow: undefined }))} className="pixel-button pixel-button--ghost">
            My tide has ended
          </button>
        </>
      ) : (
        <button type="button" onClick={() => update((d) => ({ ...d, flow: "medium" }))} className="pixel-button pixel-button--gold">
          My tide has begun
        </button>
      )}
    </Section>
  );
}

function ElementsSection({ day, update }: { day: DayMock; update: Props["update"] }) {
  const [block, setBlock] = useState<TimeBlock>("morning");
  const [legend, setLegend] = useState<Element | null>(null);
  const logs = day.elements[block];

  const setLogs = (fn: (l: ElementLog[]) => ElementLog[]) =>
    update((d) => ({ ...d, elements: { ...d.elements, [block]: fn(d.elements[block]) } }));

  const toggle = (element: Element) =>
    setLogs((l) =>
      l.some((x) => x.element === element) ? l.filter((x) => x.element !== element) : [...l, { element, intensity: 3, aspect: "light" }],
    );

  const edit = (element: Element, patch: Partial<ElementLog>) =>
    setLogs((l) => l.map((x) => (x.element === element ? { ...x, ...patch } : x)));

  return (
    <Section title="Elements">
      <div role="tablist" className="grid grid-cols-3 gap-1">
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
                onClick={() => setLegend(legend === log.element ? null : log.element)}
                className="text-silver-500 hover:text-gold-300"
              >
                {legend === log.element ? <X size={18} /> : <HelpCircle size={18} />}
              </button>
            </div>

            <div className="flex gap-1" role="radiogroup" aria-label="Intensity">
              {([1, 2, 3, 4, 5] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={log.intensity === n}
                  aria-label={`${n}: ${info.levels[n - 1]}`}
                  onClick={() => edit(log.element, { intensity: n })}
                  className={`h-7 flex-1 text-sm ${n <= log.intensity ? `${info.bg} text-midnight-950` : "bg-midnight-800 text-silver-500"}`}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="flex gap-1" role="radiogroup" aria-label="Aspect">
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

function PotionsSection({ day, potions, update }: { day: DayMock; potions: Potion[]; update: Props["update"] }) {
  const addExtra = (potionId: string) =>
    update((d) => ({ ...d, extras: [...d.extras, { potionId, time: formatTime(new Date()) }] }));

  /** Undo the most recent extra dose of this potion. */
  const removeExtra = (potionId: string) =>
    update((d) => {
      const last = d.extras.findLastIndex((x) => x.potionId === potionId);
      return last < 0 ? d : { ...d, extras: d.extras.filter((_, i) => i !== last) };
    });

  return (
    <Section title="Potions">
      <div className="space-y-2">
        {potions.map((p) => (
          <PotionRow
            key={p.id}
            potion={p}
            takenAt={day.taken[p.id]}
            extras={day.extras.filter((x) => x.potionId === p.id).map((x) => x.time)}
            onToggle={() =>
              update((d) => {
                const taken = { ...d.taken };
                if (taken[p.id]) delete taken[p.id];
                else taken[p.id] = formatTime(new Date());
                return { ...d, taken };
              })
            }
            onExtra={() => addExtra(p.id)}
            onRemoveExtra={() => removeExtra(p.id)}
          />
        ))}
      </div>
    </Section>
  );
}

function PotionRow({
  potion,
  takenAt,
  extras,
  onToggle,
  onExtra,
  onRemoveExtra,
}: {
  potion: Potion;
  takenAt?: string;
  extras: string[];
  onToggle: () => void;
  onExtra: () => void;
  onRemoveExtra: () => void;
}) {
  const [burst, setBurst] = useState(0);
  const daily = potion.schedule === "daily";
  const taken = Boolean(takenAt);

  return (
    <div className={`p-2 ${taken ? "bg-midnight-600" : "bg-midnight-950"}`}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!daily}
          aria-pressed={daily ? taken : undefined}
          aria-label={daily ? `${taken ? "Unmark" : "Mark"} ${potion.name} as taken` : undefined}
          onClick={() => {
            if (!taken) setBurst((b) => b + 1);
            onToggle();
          }}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span key={burst} className={`relative shrink-0 ${burst ? "glow-pulse" : ""}`}>
            <VesselSprite vessel={potion.vessel} color={potion.color} size={32} dim={daily && !taken} />
            <SparkleBurst burstKey={burst} />
          </span>
          <span className="min-w-0">
            <span className={`block leading-tight ${taken ? "text-gold-300" : "text-silver-100"}`}>{potion.name}</span>
            <span className="block font-journal text-base leading-tight text-silver-500">
              {potion.dose} · {taken ? `taken ${takenAt}` : displayTime(potion.time)}
            </span>
          </span>
        </button>
        <div className="flex shrink-0 items-center bg-midnight-800" role="group" aria-label={`${daily ? "Extra doses" : "Doses"} of ${potion.name}`}>
          {extras.length > 0 && (
            <>
              <button
                type="button"
                onClick={onRemoveExtra}
                aria-label={`Remove the last ${daily ? "extra " : ""}dose of ${potion.name}`}
                title="Remove the last dose"
                className="grid size-7 place-items-center text-silver-300 hover:text-blood"
              >
                <Minus size={14} strokeWidth={3} />
              </button>
              <span aria-live="polite" className="min-w-4 text-center text-sm text-gold-300">
                {extras.length}
              </span>
            </>
          )}
          <button
            type="button"
            onClick={onExtra}
            aria-label={`Log ${daily ? "an extra" : "a"} dose of ${potion.name}`}
            title={daily ? "Log an extra dose" : "Log a dose"}
            className="flex h-7 min-w-7 items-center justify-center gap-0.5 text-xs text-silver-300 hover:text-gold-300 sm:px-2"
          >
            <Plus size={14} strokeWidth={3} />
            {extras.length === 0 && <span className="hidden sm:inline">{daily ? "Extra" : "Take"}</span>}
          </button>
        </div>
        {daily && (
          <span
            aria-hidden
            className={`grid size-6 shrink-0 place-items-center text-sm ${taken ? "bg-gold-500 text-midnight-950" : "bg-midnight-800 text-transparent"}`}
          >
            ✓
          </span>
        )}
      </div>
      {extras.length > 0 && (
        <p className="mt-1 font-journal text-base leading-tight text-silver-500">
          {daily ? "Extra doses" : "Taken"}: {extras.join(" · ")}
        </p>
      )}
    </div>
  );
}
