import { Minus, Plus } from "lucide-react";

/** A full-width option button that stays highlighted when chosen. */
export function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`w-full px-3 py-2 text-left ${selected ? "bg-violet-500 text-violet-100" : "bg-midnight-950 text-silver-300 hover:bg-midnight-700"}`}
    >
      {children}
    </button>
  );
}

export function Stepper({ label, value, min, max, unit, onChange }: { label: string; value: number; min: number; max: number; unit: string; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2" role="group" aria-label={label}>
      <button type="button" aria-label={`Fewer ${unit}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="pixel-button pixel-button--ghost px-3 disabled:opacity-40">
        <Minus size={16} strokeWidth={3} />
      </button>
      <span aria-live="polite" className="min-w-24 text-center font-journal text-3xl text-gold-300">
        {value} <span className="font-journal text-xl text-silver-300">{unit}</span>
      </span>
      <button type="button" aria-label={`More ${unit}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="pixel-button pixel-button--ghost px-3 disabled:opacity-40">
        <Plus size={16} strokeWidth={3} />
      </button>
    </div>
  );
}
