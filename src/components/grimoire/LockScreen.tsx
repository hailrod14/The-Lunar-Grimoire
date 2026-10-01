"use client";

import { useEffect, useState } from "react";
import { Delete } from "lucide-react";
import { PixelMoon } from "@/components/sprites/PixelMoon";
import { eraseEverything, unlock } from "@/lib/store";

const MAX_PIN = 8;
/** After this many wrong tries, wait before the next one. */
const FREE_TRIES = 5;
const COOLDOWN_SECONDS = 30;

/** Shown in place of the Grimoire while it's sealed with a PIN. */
export function LockScreen() {
  const [pin, setPin] = useState("");
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

  const press = (digit: string) => setPin((p) => (p.length < MAX_PIN ? p + digit : p));

  const submit = async () => {
    if (busy || waiting || pin.length < 4) return;
    setBusy(true);
    const ok = await unlock(pin);
    setBusy(false);
    if (ok) return;
    const tries = wrong + 1;
    setWrong(tries);
    setPin("");
    if (tries >= FREE_TRIES) setWaitUntil(Date.now() + COOLDOWN_SECONDS * 1000);
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-6">
      <div className="pixel-frame pixel-frame--gold space-y-5 p-5 text-center">
        <div className="flex flex-col items-center gap-2">
          <PixelMoon phase={0.02} variant="tide" size={72} resolution={20} title="A sealed Grimoire" />
          <h1 className="pixel-title text-2xl">The Grimoire is sealed</h1>
          <p className="font-journal text-lg text-silver-300">Enter your PIN to open it.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="space-y-4"
        >
          <input
            type="password"
            inputMode="numeric"
            autoComplete="off"
            autoFocus
            aria-label="PIN"
            value={pin}
            disabled={busy || waiting > 0}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, MAX_PIN))}
            className="block w-full bg-midnight-950 py-2 text-center font-journal text-3xl tracking-[0.5em] text-gold-300 shadow-[0_0_0_4px_var(--color-violet-500)] focus:outline-none"
          />

          <div className="grid grid-cols-3 gap-2" aria-label="Number pad">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
              <button key={d} type="button" onClick={() => press(d)} disabled={busy || waiting > 0} className="pixel-button pixel-button--ghost m-0 h-12 font-journal text-2xl">
                {d}
              </button>
            ))}
            <button type="button" aria-label="Delete last digit" onClick={() => setPin((p) => p.slice(0, -1))} className="pixel-button pixel-button--ghost m-0 h-12">
              <Delete size={18} />
            </button>
            <button type="button" onClick={() => press("0")} disabled={busy || waiting > 0} className="pixel-button pixel-button--ghost m-0 h-12 font-journal text-2xl">
              0
            </button>
            <button type="submit" disabled={busy || waiting > 0 || pin.length < 4} className="pixel-button pixel-button--gold m-0 h-12 disabled:opacity-40">
              Open
            </button>
          </div>
        </form>

        <p role="status" className="min-h-6 font-journal text-lg">
          {busy ? (
            <span className="text-silver-300">Unsealing…</span>
          ) : waiting > 0 ? (
            <span className="text-gold-300">Too many tries. Wait {waiting} seconds.</span>
          ) : wrong > 0 ? (
            <span className="text-fire">That isn&apos;t the PIN.</span>
          ) : null}
        </p>

        {forgot === "no" ? (
          <button type="button" onClick={() => setForgot("asking")} className="font-journal text-lg text-violet-300 underline">
            Forgot your PIN?
          </button>
        ) : (
          <div className="space-y-2 bg-midnight-950 p-3 text-left font-journal text-lg text-silver-300">
            <p>
              Without the PIN this Grimoire can&apos;t be opened. That&apos;s what keeps it private. You can erase it and start
              fresh, then restore a backup file if you have one.
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
    </main>
  );
}
