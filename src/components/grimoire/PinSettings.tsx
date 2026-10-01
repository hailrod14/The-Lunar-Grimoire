"use client";

import { useState } from "react";
import { updateSettings } from "@/lib/grimoire";
import { changePin, dispatch, lockNow, removePin, setPin, useGrimoireState } from "@/lib/store";
import type { Grimoire } from "@/lib/types";
import { Choice } from "./Controls";
import { Section } from "./Section";

const AUTO_LOCK = [
  { minutes: 0, label: "As soon as I leave" },
  { minutes: 1, label: "After 1 minute away" },
  { minutes: 5, label: "After 5 minutes away" },
  { minutes: 15, label: "After 15 minutes away" },
];

const validPin = (pin: string) => /^\d{4,8}$/.test(pin);

function PinField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-silver-300">{label}</span>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
        className="block w-[calc(100%-8px)] bg-midnight-950 px-3 py-2 text-center font-journal text-2xl tracking-[0.4em] text-gold-300 shadow-[0_0_0_4px_var(--color-violet-500)] focus:outline-none"
      />
    </label>
  );
}

type Mode = "idle" | "setting" | "changing" | "removing";

export function PinSettings({ g }: { g: Grimoire }) {
  const state = useGrimoireState();
  const pinSet = state?.status === "open" && state.pinSet;
  const [mode, setMode] = useState<Mode>("idle");
  const [current, setCurrent] = useState("");
  const [first, setFirst] = useState("");
  const [second, setSecond] = useState("");
  const [understood, setUnderstood] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ tone: "good" | "bad"; text: string } | null>(null);

  const reset = (next: Mode = "idle") => {
    setMode(next);
    setCurrent("");
    setFirst("");
    setSecond("");
    setUnderstood(false);
  };

  const run = async (work: () => Promise<string | null>) => {
    setBusy(true);
    setMessage(null);
    const error = await work();
    setBusy(false);
    if (error) setMessage({ tone: "bad", text: error });
  };

  const newPinError = () => (!validPin(first) ? "Use 4 to 8 digits." : first !== second ? "The two PINs don't match." : null);

  return (
    <Section title="Privacy lock">
      {!pinSet ? (
        <p className="font-journal text-lg text-silver-300">
          Seal your Grimoire with a PIN. It&apos;s then <strong className="text-gold-300">encrypted on this device</strong>, so
          nothing can be read without the PIN, not even by someone who inspects the browser&apos;s storage.
        </p>
      ) : (
        <>
          <p className="font-journal text-lg text-silver-300">🔒 Sealed with a PIN and encrypted on this device.</p>
          <p className="text-sm text-silver-300">Lock automatically</p>
          {AUTO_LOCK.map((o) => (
            <Choice key={o.minutes} selected={g.settings.autoLockMinutes === o.minutes} onClick={() => dispatch((x) => updateSettings(x, { autoLockMinutes: o.minutes }))}>
              {o.label}
            </Choice>
          ))}
        </>
      )}

      {mode === "setting" && (
        <form
          className="space-y-3 bg-midnight-950 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const error = newPinError() ?? (understood ? null : "Please confirm you understand the warning.");
              if (error) return error;
              await setPin(first);
              reset();
              setMessage({ tone: "good", text: "Sealed. Your Grimoire is now encrypted with your PIN." });
              return null;
            });
          }}
        >
          <p className="font-journal text-lg text-gold-300">
            ⚠️ If you forget this PIN, your Grimoire can&apos;t be opened or recovered. Only a backup file can bring it back.
            Export one below first.
          </p>
          <PinField label="New PIN (4–8 digits)" value={first} onChange={setFirst} />
          <PinField label="The same PIN again" value={second} onChange={setSecond} />
          <label className="flex items-start gap-2 font-journal text-lg text-silver-300">
            <input type="checkbox" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} className="mt-1.5 accent-gold-500" />
            I understand a forgotten PIN can&apos;t be recovered.
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="pixel-button pixel-button--gold">
              {busy ? "Sealing…" : "Seal with this PIN"}
            </button>
            <button type="button" onClick={() => reset()} className="pixel-button pixel-button--ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "changing" && (
        <form
          className="space-y-3 bg-midnight-950 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              const error = newPinError();
              if (error) return error;
              if (!(await changePin(current, first))) return "Your current PIN isn't right.";
              reset();
              setMessage({ tone: "good", text: "PIN changed." });
              return null;
            });
          }}
        >
          <PinField label="Current PIN" value={current} onChange={setCurrent} />
          <PinField label="New PIN (4–8 digits)" value={first} onChange={setFirst} />
          <PinField label="The new PIN again" value={second} onChange={setSecond} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="pixel-button pixel-button--gold">
              {busy ? "Resealing…" : "Change PIN"}
            </button>
            <button type="button" onClick={() => reset()} className="pixel-button pixel-button--ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "removing" && (
        <form
          className="space-y-3 bg-midnight-950 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            void run(async () => {
              if (!(await removePin(current))) return "That isn't the PIN.";
              reset();
              setMessage({ tone: "good", text: "PIN removed. Your Grimoire is no longer encrypted." });
              return null;
            });
          }}
        >
          <p className="font-journal text-lg text-silver-300">Your Grimoire will be saved unencrypted again.</p>
          <PinField label="Current PIN" value={current} onChange={setCurrent} />
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="pixel-button pixel-button--gold">
              {busy ? "Unsealing…" : "Remove PIN"}
            </button>
            <button type="button" onClick={() => reset()} className="pixel-button pixel-button--ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === "idle" &&
        (pinSet ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void lockNow()} className="pixel-button pixel-button--gold">
              🔒 Lock now
            </button>
            <button type="button" onClick={() => reset("changing")} className="pixel-button pixel-button--ghost">
              Change PIN
            </button>
            <button type="button" onClick={() => reset("removing")} className="pixel-button pixel-button--ghost">
              Remove PIN
            </button>
          </div>
        ) : (
          <button type="button" onClick={() => reset("setting")} className="pixel-button pixel-button--gold">
            🔒 Set a PIN
          </button>
        ))}

      {message && (
        <p role="status" className={`font-journal text-lg ${message.tone === "good" ? "text-earth" : "text-fire"}`}>
          {message.text}
        </p>
      )}
    </Section>
  );
}
