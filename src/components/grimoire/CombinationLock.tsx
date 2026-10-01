"use client";

import { useRef, useState } from "react";
import { PixelSprite } from "@/components/pixel/PixelSprite";
import { LOCK_PALETTE, lockBody, lockShackle } from "@/lib/lockArt";

/*
 * A crescent-moon combination lock hanging on the cover's strap, with one
 * rolling number wheel per digit. Roll a wheel by swiping it, or tap the
 * number showing above or below to roll to it; with a keyboard, arrow keys
 * roll and typed digits set it.
 */

/** One wheel's width and one digit's height, in pixels. */
const WHEEL = 22;
const ROW = 20;
const GAP = 2;
/** How far a finger travels to roll one number. */
const SWIPE_STEP = 14;
/** One pixel of lock art, in screen pixels (the UI's pixel size). */
const ART = 4;

const digitOf = (pos: number) => ((pos % 10) + 10) % 10;

/** The moon's size in art pixels: big enough that the wheels fit across its face. */
/** The lock's width and its shackle's height, in screen pixels. */
export function lockMetrics(digits: number) {
  const size = lockSize(digits);
  return { width: size * ART, shackleHeight: Math.round(size * 0.36) * ART };
}

export function lockSize(digits: number) {
  const slot = digits * WHEEL + (digits - 1) * GAP + 10;
  return Math.max(38, Math.ceil(slot / 0.66 / ART));
}

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
  const drag = useRef<{ y: number; start: number; moved: boolean } | null>(null);
  return (
    <div style={{ width: WHEEL }}>
      <div
        ref={wheelRef}
        role="spinbutton"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Wheel ${index + 1} of ${count}`}
        aria-valuemin={0}
        aria-valuemax={9}
        aria-valuenow={digitOf(pos)}
        aria-disabled={disabled}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          if (disabled) return;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Rolling still works while the finger stays on the wheel.
          }
          drag.current = { y: e.clientY, start: pos, moved: false };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const steps = Math.round((drag.current.y - e.clientY) / SWIPE_STEP);
          if (steps) drag.current.moved = true;
          if (drag.current.start + steps !== pos) onRoll(drag.current.start + steps);
        }}
        onPointerUp={(e) => {
          // A tap (not a swipe) on the number above or below rolls the wheel to it.
          if (drag.current && !drag.current.moved && !disabled) {
            const y = e.clientY - e.currentTarget.getBoundingClientRect().top;
            if (y < ROW) onRoll(pos - 1);
            else if (y > ROW * 2) onRoll(pos + 1);
          }
          drag.current = null;
        }}
        onPointerCancel={() => (drag.current = null)}
        className="relative cursor-ns-resize touch-none overflow-hidden bg-[#f6ead0] select-none focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#fff4c2]"
        style={{ height: ROW * 3 }}
      >
        {[-2, -1, 0, 1, 2].map((k) => (
          <span
            key={pos + k}
            aria-hidden
            className="absolute inset-x-0 grid place-items-center font-display text-lg leading-none text-[#2a1a05] transition-transform duration-150 ease-out"
            style={{ height: ROW, transform: `translateY(${(k + 1) * ROW}px)` }}
          >
            {digitOf(pos + k)}
          </span>
        ))}
        {/* The drum curves away above and below the window */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgb(42 26 5 / 0.8), rgb(42 26 5 / 0.2) 30%, transparent 36%, transparent 64%, rgb(42 26 5 / 0.2) 70%, rgb(42 26 5 / 0.8))",
          }}
        />
      </div>
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

  const size = lockSize(digits);
  const body = lockBody(size);
  const shackleWidth = Math.round(size * 0.5) & ~1;
  const shackleHeight = Math.round(size * 0.36);
  const shackle = lockShackle(shackleWidth, shackleHeight);

  const pos = Array.from({ length: digits }, (_, i) => positions[i] ?? 0);
  const roll = (i: number, p: number) => setPositions(pos.map((x, j) => (j === i ? p : x)));
  const code = pos.map(digitOf).join("");

  const tryOpen = async () => {
    if (disabled || state === "open") return;
    const opened = await onTry(code);
    setState(opened ? "open" : "rattle");
    if (!opened) setTimeout(() => setState("shut"), 450);
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
      const diff = ((Number(e.key) - digitOf(pos[i]) + 15) % 10) - 5;
      roll(i, pos[i] + diff);
      go(i + 1);
    } else return;
    e.preventDefault();
  };

  const width = size * ART;
  const shut = disabled || state === "open";

  return (
    <div
      className={`relative flex flex-col items-center ${state === "rattle" ? "lock-rattle" : ""} ${state === "open" ? "lock-fall" : ""}`}
      style={{ width }}
    >
      {/* The shackle springs up when the code is right (drawn above the strap, so the strap passes through it) */}
      <div
        aria-hidden
        className="relative z-20 transition-transform duration-300 ease-out"
        style={{ marginBottom: -ART * 3, transform: state === "open" ? `translateY(-${ART * 4}px)` : undefined }}
      >
        <PixelSprite rows={shackle} palette={LOCK_PALETTE} size={shackleWidth * ART} />
      </div>

      {/* The moon, with the wheels set across its face */}
      <div className="relative z-30" style={{ width, height: width, filter: "drop-shadow(0 4px 0 rgb(0 0 0 / 0.35))" }}>
        <PixelSprite rows={body} palette={LOCK_PALETTE} size={width} />
        <div className="absolute inset-0 grid place-items-center">
          <div
            className="flex bg-[#2a1a05] p-[3px] shadow-[0_0_0_2px_#ffd866,0_0_0_4px_#5c3d0c]"
            style={{ gap: GAP }}
            role="group"
            aria-label={`Combination lock, ${digits} wheels`}
          >
            {pos.map((p, i) => (
              <Wheel
                key={i}
                index={i}
                count={digits}
                pos={p}
                disabled={shut}
                onRoll={(next) => roll(i, next)}
                onKey={onKey(i)}
                wheelRef={(el) => {
                  wheels.current[i] = el;
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* A little brass tag hanging below: press it to try the code */}
      <span aria-hidden className="h-2 w-1 bg-[#b07a1c]" />
      <button
        type="button"
        onClick={() => void tryOpen()}
        disabled={shut}
        className="bg-[#f2b33d] px-4 py-1 font-display text-base tracking-wider text-[#2a1a05] shadow-[inset_-3px_-3px_0_#b07a1c,inset_3px_3px_0_#fff4c2,0_3px_0_#5c3d0c] hover:brightness-110 active:translate-y-px disabled:opacity-70"
      >
        {state === "open" ? "Unlocked" : "Open"}
      </button>
      <p className="sr-only" aria-live="polite">
        {state === "open" ? "Unlocked." : ""}
      </p>
    </div>
  );
}
