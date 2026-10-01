"use client";

import { useEffect, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { dateKey, formatLong } from "@/lib/dates";
import { eraseEverything, prepareUnlock, useGrimoireState } from "@/lib/store";
import { CombinationLock } from "./CombinationLock";
import { CoverDecor, LEATHER } from "./Cover";

/** After this many wrong tries, wait before the next one. */
const FREE_TRIES = 5;
const COOLDOWN_SECONDS = 30;
/** Time for the shackle to spring open before the book appears. */
const OPEN_DELAY_MS = 650;
const MIN_DIGITS = 4;
const MAX_DIGITS = 8;

/**
 * Shown in place of the Grimoire while it's sealed with a PIN: the closed
 * book, strapped shut with a brass combination lock.
 */
export function LockScreen() {
  const state = useGrimoireState();
  const known = state?.status === "locked" ? state.sealed.digits : undefined;
  const [chosen, setChosen] = useState(MIN_DIGITS);
  const digits = known ?? chosen;

  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(0);
  const [forgot, setForgot] = useState<"no" | "asking" | "confirming">("no");

  const waiting = Math.max(0, Math.ceil((waitUntil - now) / 1000));
  useEffect(() => {
    if (!waitUntil) return;
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [waitUntil]);

  const tryCode = async (code: string) => {
    if (busy || waiting) return false;
    setBusy(true);
    const open = await prepareUnlock(code);
    setBusy(false);
    if (open) {
      setTimeout(open, OPEN_DELAY_MS);
      return true;
    }
    const tries = wrong + 1;
    setWrong(tries);
    if (tries >= FREE_TRIES) setWaitUntil(Date.now() + COOLDOWN_SECONDS * 1000);
    return false;
  };

  return (
    <main className="mx-auto max-w-2xl px-4 py-4">
      <div className="pixel-frame pixel-frame--gold">
        <div className="cover-gilt relative min-h-[85dvh] overflow-hidden text-center" style={LEATHER}>
          <CoverDecor clasp={false} />

          {/* The strap: across the cover from the fore-edge to the lock */}
          <span
            aria-hidden
            className="absolute top-[58%] right-0 left-1/2 h-14 border-y-4 border-dashed border-gold-900 bg-(--cover-spine) shadow-[0_4px_0_rgb(0_0_0/0.3)]"
          />

          <div className="relative flex min-h-[85dvh] flex-col items-center justify-center gap-6 pt-10 pr-8 pb-8 pl-12">
            <div className="space-y-1">
              <h1 className="pixel-title text-3xl leading-tight">
                The Lunar
                <br />
                Grimoire
              </h1>
              <p className="font-journal text-lg text-gold-300">{formatLong(new Date(`${dateKey(new Date())}T12:00:00`))}</p>
            </div>

            <div className="w-full space-y-3">
              <p className="font-journal text-lg text-gold-100">Roll the wheels to your code, then press Open.</p>
              <CombinationLock key={digits} digits={digits} disabled={busy || waiting > 0} onTry={tryCode} />
            </div>

            {known === undefined && (
              <div className="flex items-center gap-2 bg-black/30 px-3 py-1" role="group" aria-label="How many digits is your code?">
                <span className="font-journal text-base text-gold-100">Digits in your code</span>
                <button
                  type="button"
                  aria-label="One fewer wheel"
                  disabled={chosen <= MIN_DIGITS}
                  onClick={() => setChosen((n) => n - 1)}
                  className="grid size-8 place-items-center text-gold-300 disabled:opacity-40"
                >
                  <Minus size={16} strokeWidth={3} />
                </button>
                <span className="font-journal text-xl text-gold-300">{chosen}</span>
                <button
                  type="button"
                  aria-label="One more wheel"
                  disabled={chosen >= MAX_DIGITS}
                  onClick={() => setChosen((n) => n + 1)}
                  className="grid size-8 place-items-center text-gold-300 disabled:opacity-40"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              </div>
            )}

            <p role="status" className="min-h-6 bg-black/30 px-3 font-journal text-lg empty:bg-transparent">
              {busy ? (
                <span className="text-gold-100">Turning the lock…</span>
              ) : waiting > 0 ? (
                <span className="text-gold-300">The lock is stiff. Try again in {waiting} seconds.</span>
              ) : wrong > 0 ? (
                <span className="text-gold-100">The lock holds fast. That isn&apos;t the code.</span>
              ) : null}
            </p>

            {forgot === "no" ? (
              <button type="button" onClick={() => setForgot("asking")} className="font-journal text-lg text-gold-300 underline">
                Forgot your code?
              </button>
            ) : (
              <div className="pixel-frame pixel-frame--parchment w-full space-y-2 p-3 text-left font-journal text-lg">
                <p>
                  Without the code this Grimoire can&apos;t be opened. That&apos;s what keeps it private. You can erase it and start fresh,
                  then restore a backup file or your synced copy if you have one.
                </p>
                {forgot === "asking" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setForgot("confirming")} className="pixel-button pixel-button--ghost">
                      Erase and start fresh…
                    </button>
                    <button type="button" onClick={() => setForgot("no")} className="pixel-button pixel-button--ghost">
                      Never mind
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => void eraseEverything()} className="bg-blood px-3 py-2 text-white">
                      Yes, erase everything
                    </button>
                    <button type="button" onClick={() => setForgot("no")} className="pixel-button pixel-button--ghost">
                      Keep trying
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
