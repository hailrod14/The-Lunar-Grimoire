"use client";

import { useRef, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { StarGlyph } from "@/components/sprites/Glyphs";
import { PixelMoon } from "@/components/sprites/PixelMoon";

/*
 * A brass combination lock with rolling number wheels, like a luggage lock
 * or a fine lockable diary. Roll each wheel by swiping it, tapping its
 * arrows, or (with a keyboard) arrow keys and typing digits.
 */

/** Height of one digit on a wheel, in pixels. */
const ROW = 30;
/** How far a finger travels to roll one number. */
const SWIPE_STEP = 18;

const digitOf = (pos: number) => ((pos % 10) + 10) % 10;

function Wheel({
  index,
  count,
  pos,
  disabled,
  onRoll,
  onKey,
  wheelRef,
}: {
  index: number;
  count: number;
  pos: number;
  disabled: boolean;
  onRoll: (pos: number) => void;
  onKey: (e: React.KeyboardEvent) => void;
  wheelRef: (el: HTMLDivElement | null) => void;
}) {
  const drag = useRef<{ y: number; start: number } | null>(null);
  const value = digitOf(pos);

  return (
    <div className="flex w-[clamp(1.6rem,7.5vw,2.75rem)] flex-col items-center">
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onClick={() => onRoll(pos + 1)}
        className="grid h-7 w-full place-items-center text-[#ffd866] hover:text-[#fff4c2] disabled:opacity-40"
      >
        <ChevronUp size={18} strokeWidth={3} />
      </button>
      <div
        ref={wheelRef}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Wheel ${index + 1} of ${count}`}
        aria-valuemin={0}
        aria-valuemax={9}
        aria-valuenow={value}
        aria-disabled={disabled}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          if (disabled) return;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Rolling still works while the finger stays on the wheel.
          }
          drag.current = { y: e.clientY, start: pos };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const steps = Math.round((drag.current.y - e.clientY) / SWIPE_STEP);
          if (drag.current.start + steps !== pos) onRoll(drag.current.start + steps);
        }}
        onPointerUp={() => (drag.current = null)}
        onPointerCancel={() => (drag.current = null)}
        className="relative w-full cursor-ns-resize touch-none overflow-hidden bg-[#f6ead0] shadow-[inset_0_0_0_2px_#5c3d0c] select-none focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-[#fff4c2]"
        style={{ height: ROW * 3 }}
      >
        {[-2, -1, 0, 1, 2].map((k) => {
          const at = pos + k;
          return (
            <span
              key={at}
              aria-hidden
              className="absolute inset-x-0 grid place-items-center font-display text-2xl text-[#2a1a05] transition-transform duration-150 ease-out"
              style={{ height: ROW, transform: `translateY(${(k + 1) * ROW}px)` }}
            >
              {digitOf(at)}
            </span>
          );
        })}
        {/* The drum curves away above and below the window */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgb(42 26 5 / 0.75), rgb(42 26 5 / 0.15) 32%, transparent 38%, transparent 62%, rgb(42 26 5 / 0.15) 68%, rgb(42 26 5 / 0.75))",
          }}
        />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 h-0.5 bg-[#b07a1c]/60" style={{ top: ROW }} />
        <span aria-hidden className="pointer-events-none absolute inset-x-0 h-0.5 bg-[#b07a1c]/60" style={{ top: ROW * 2 - 2 }} />
      </div>
      <button
        type="button"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onClick={() => onRoll(pos - 1)}
        className="grid h-7 w-full place-items-center text-[#ffd866] hover:text-[#fff4c2] disabled:opacity-40"
      >
        <ChevronDown size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

type Props = {
  digits: number;
  disabled: boolean;
  /** Resolves true if the lock opened. */
  onTry: (code: string) => Promise<boolean>;
};

export function CombinationLock({ digits, disabled, onTry }: Props) {
  const [positions, setPositions] = useState<number[]>(() => Array(digits).fill(0));
  const [state, setState] = useState<"shut" | "rattle" | "open">("shut");
  const wheels = useRef<(HTMLDivElement | null)[]>([]);

  // The number of wheels can change (e.g. choosing how many digits the code has).
  const pos = Array.from({ length: digits }, (_, i) => positions[i] ?? 0);
  const roll = (i: number, p: number) => setPositions(pos.map((x, j) => (j === i ? p : x)));
  const code = pos.map(digitOf).join("");

  const tryOpen = async () => {
    if (disabled || state === "open") return;
    const opened = await onTry(code);
    setState(opened ? "open" : "rattle");
    if (!opened) setTimeout(() => setState("shut"), 500);
  };

  const onKey = (i: number) => (e: React.KeyboardEvent) => {
    if (disabled) return;
    const go = (j: number) => wheels.current[Math.max(0, Math.min(digits - 1, j))]?.focus();
    if (e.key === "ArrowUp") roll(i, pos[i] + 1);
    else if (e.key === "ArrowDown") roll(i, pos[i] - 1);
    else if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft" || e.key === "Backspace") go(i - 1);
    else if (e.key === "Enter") void tryOpen();
    else if (/^\d$/.test(e.key)) {
      // Roll the short way round to the typed number, then move on.
      const target = Number(e.key);
      const diff = ((target - digitOf(pos[i]) + 15) % 10) - 5;
      roll(i, pos[i] + diff);
      go(i + 1);
    } else return;
    e.preventDefault();
  };

  return (
    <div className="cover-gilt flex flex-col items-center">
      {/* The shackle: rises out of the lock when the code is right */}
      <div
        aria-hidden
        className="relative z-0 -mb-3 h-16 w-28 transition-transform duration-300 ease-out"
        style={{ transform: state === "open" ? "translateY(-18px)" : undefined }}
      >
        <div className="absolute inset-0 border-[10px] border-b-0 border-[#b07a1c] shadow-[inset_4px_4px_0_#ffd866]" />
        <div className="absolute inset-x-[10px] top-[10px] bottom-0 border-[3px] border-b-0 border-[#5c3d0c]/40" />
      </div>

      {/* The lock body: a brass plate with rivets, an engraved moon, and the wheels */}
      <div
        className={`relative z-10 w-fit max-w-full bg-[#f2b33d] px-4 pt-3 pb-4 shadow-[inset_-6px_-6px_0_#b07a1c,inset_6px_6px_0_#ffd866,0_6px_0_#5c3d0c] ${state === "rattle" ? "lock-rattle" : ""}`}
      >
        {[
          "top-2 left-2",
          "top-2 right-2",
          "bottom-2 left-2",
          "bottom-2 right-2",
        ].map((at) => (
          <span key={at} aria-hidden className={`absolute size-2 bg-[#ffd866] shadow-[2px_2px_0_#5c3d0c] ${at}`} />
        ))}
        <p aria-hidden className="flex items-center justify-center gap-2 pb-2">
          <PixelMoon phase={0.18} variant="tide" size={14} resolution={10} />
          <StarGlyph size={10} />
          <PixelMoon phase={0.82} variant="tide" size={14} resolution={10} />
        </p>
        <div className="flex justify-center gap-1.5 bg-[#5c3d0c] px-2 py-1 shadow-[inset_3px_3px_0_#2a1a05]" role="group" aria-label={`Combination lock, ${digits} wheels`}>
          {pos.map((p, i) => (
            <Wheel
              key={i}
              index={i}
              count={digits}
              pos={p}
              disabled={disabled || state === "open"}
              onRoll={(next) => roll(i, next)}
              onKey={onKey(i)}
              wheelRef={(el) => {
                wheels.current[i] = el;
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => void tryOpen()}
          disabled={disabled || state === "open"}
          className="mx-auto mt-3 block bg-[#b07a1c] px-6 py-2 font-display text-lg tracking-wider text-[#fff4c2] shadow-[inset_-3px_-3px_0_#5c3d0c,inset_3px_3px_0_#ffd866] hover:brightness-110 active:translate-y-px disabled:opacity-60"
        >
          {state === "open" ? "Unlocked" : "Open"}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {state === "open" ? "Unlocked." : ""}
      </p>
    </div>
  );
}
