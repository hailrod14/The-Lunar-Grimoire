"use client";

import { useEffect, useState } from "react";
import { Cloud, CloudOff, Eye, EyeOff, LoaderCircle, LogIn, RefreshCw } from "lucide-react";
import {
  choosePassphrase,
  deleteCloudCopy,
  enterPassphrase,
  signIn,
  startSync,
  stopSyncing,
  syncNow,
  useSyncStatus,
  type SyncStatus,
} from "@/lib/sync";
import { Section } from "./Section";

const MIN_PASSPHRASE = 8;

/** "at 9:42 am" today, or "Tue at 9:42 am". */
function syncedWhen(iso: string | undefined): string {
  if (!iso) return "";
  const at = new Date(iso);
  const time = at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return at.toDateString() === new Date().toDateString() ? `at ${time}` : `${at.toLocaleDateString(undefined, { weekday: "short" })} at ${time}`;
}

function PassphraseInput({
  value,
  onChange,
  label,
  autoComplete,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  autoComplete: "new-password" | "current-password";
}) {
  const [shown, setShown] = useState(false);
  return (
    <label className="block space-y-1">
      <span className="text-sm text-silver-300">{label}</span>
      <span className="flex items-stretch gap-1">
        <input
          type={shown ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          spellCheck={false}
          className="block min-w-0 flex-1 bg-midnight-950 px-3 py-2 font-journal text-lg text-silver-100 outline-2 outline-violet-500 focus:outline-gold-300"
        />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          aria-label={shown ? "Hide passphrase" : "Show passphrase"}
          className="bg-midnight-950 px-3 text-silver-300 hover:text-gold-300"
        >
          {shown ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </span>
    </label>
  );
}

function Message({ status }: { status: SyncStatus }) {
  if (!status.message) return null;
  return (
    <p role="alert" className="font-journal text-lg text-gold-300">
      {status.message}
    </p>
  );
}

function SignedInAs({ email }: { email?: string }) {
  if (!email) return null;
  return <p className="font-journal text-base text-silver-500">Signed in as {email}</p>;
}

function ChoosePassphrase({ status }: { status: SyncStatus }) {
  const [pass, setPass] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const tooShort = pass.length < MIN_PASSPHRASE;
  const mismatch = again !== "" && again !== pass;
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        if (tooShort || pass !== again) return;
        setBusy(true);
        await choosePassphrase(pass);
        setBusy(false);
      }}
    >
      <SignedInAs email={status.email} />
      <p className="font-journal text-lg text-silver-300">
        Choose a sync passphrase. Your Grimoire is locked with it on this device before it&apos;s uploaded, so no one else, not even
        Google, can read it. You&apos;ll enter it once on each of your devices.
      </p>
      <PassphraseInput value={pass} onChange={setPass} label={`Passphrase (at least ${MIN_PASSPHRASE} characters)`} autoComplete="new-password" />
      <PassphraseInput value={again} onChange={setAgain} label="The same passphrase again" autoComplete="new-password" />
      {mismatch && <p className="font-journal text-lg text-gold-300">Those don&apos;t match yet.</p>}
      <p className="font-journal text-base text-silver-500">
        A few unrelated words make a strong, memorable passphrase. If it&apos;s forgotten, the synced copy can&apos;t be opened, though each
        device keeps its own Grimoire.
      </p>
      <Message status={status} />
      <button type="submit" disabled={busy || tooShort || pass !== again} className="pixel-button pixel-button--gold disabled:opacity-40">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Cloud size={16} />} Start syncing
      </button>
    </form>
  );
}

function EnterPassphrase({ status, adopt, onDone }: { status: SyncStatus; adopt: boolean; onDone?: () => void }) {
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);
  const [wrong, setWrong] = useState(false);
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const ok = await enterPassphrase(pass, adopt);
        setBusy(false);
        setWrong(!ok);
        if (ok) onDone?.();
      }}
    >
      <SignedInAs email={status.email} />
      <p className="font-journal text-lg text-silver-300">
        {adopt
          ? "Enter the sync passphrase you chose on your other device."
          : "Enter your sync passphrase. Anything already on this device will be combined with your synced Grimoire."}
      </p>
      <PassphraseInput value={pass} onChange={(v) => (setPass(v), setWrong(false))} label="Sync passphrase" autoComplete="current-password" />
      {wrong && (
        <p role="alert" className="font-journal text-lg text-gold-300">
          That passphrase doesn&apos;t open it. Check for typos and capital letters.
        </p>
      )}
      <Message status={status} />
      <button type="submit" disabled={busy || !pass} className="pixel-button pixel-button--gold disabled:opacity-40">
        {busy ? <LoaderCircle size={16} className="animate-spin" /> : <Cloud size={16} />} Open my Grimoire
      </button>
    </form>
  );
}

function Active({ status }: { status: SyncStatus }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const label =
    status.phase === "syncing"
      ? "Syncing…"
      : status.phase === "offline"
        ? "Offline. Changes will sync when you're back online."
        : status.phase === "error"
          ? "Sync hit a snag."
          : `Synced ${syncedWhen(status.syncedAt)}`;
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-2 font-journal text-xl text-silver-100" aria-live="polite">
        {status.phase === "syncing" ? (
          <LoaderCircle size={18} className="animate-spin text-gold-300" />
        ) : status.phase === "synced" ? (
          <Cloud size={18} className="text-gold-300" />
        ) : (
          <CloudOff size={18} className="text-silver-300" />
        )}
        {label}
      </p>
      <SignedInAs email={status.email} />
      <Message status={status} />
      <p className="font-journal text-base text-silver-500">
        Changes sync on their own within moments, and whenever you open the Grimoire. Entries made on two devices at once are combined.
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void syncNow()} disabled={status.phase === "syncing"} className="pixel-button pixel-button--ghost disabled:opacity-40">
          <RefreshCw size={16} /> Sync now
        </button>
        <button type="button" onClick={() => void stopSyncing()} className="pixel-button pixel-button--ghost">
          Stop syncing here
        </button>
      </div>
      {confirmDelete ? (
        <div className="space-y-2 bg-midnight-950 p-3">
          <p className="font-journal text-lg text-silver-100">
            Delete the synced copy from the cloud? Each device keeps its own Grimoire, but they&apos;ll stop syncing.
          </p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void deleteCloudCopy().then(() => setConfirmDelete(false))} className="pixel-button pixel-button--gold">
              Delete cloud copy
            </button>
            <button type="button" onClick={() => setConfirmDelete(false)} className="pixel-button pixel-button--ghost">
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setConfirmDelete(true)} className="font-journal text-lg text-violet-300 underline">
          Delete the cloud copy…
        </button>
      )}
    </div>
  );
}

/** The body of the sync settings, also used during first-run setup (`adopt`). */
export function SyncPanel({ adopt = false, onDone }: { adopt?: boolean; onDone?: () => void }) {
  const status = useSyncStatus();
  useEffect(() => {
    void startSync(true);
  }, []);

  switch (status.phase) {
    case "unavailable":
      return <p className="font-journal text-lg text-silver-300">Sync isn&apos;t switched on for this copy of the app yet.</p>;
    case "idle":
    case "loading":
      return (
        <p className="flex items-center gap-2 font-journal text-lg text-silver-300">
          <LoaderCircle size={16} className="animate-spin" /> Opening…
        </p>
      );
    case "signed-out":
      return (
        <div className="space-y-3">
          <p className="font-journal text-lg text-silver-300">
            {adopt
              ? "Sign in with the Google account you sync with on your other device."
              : "Keep your Grimoire on your phone and computer at once. Sign in with Google, then choose a passphrase that encrypts everything before it leaves this device."}
          </p>
          <Message status={status} />
          <button type="button" onClick={() => void signIn()} className="pixel-button pixel-button--gold">
            <LogIn size={16} /> Sign in with Google
          </button>
        </div>
      );
    case "choose-passphrase":
      return adopt ? (
        <div className="space-y-2">
          <SignedInAs email={status.email} />
          <p className="font-journal text-lg text-silver-300">
            There&apos;s no synced Grimoire for this account yet. Set this one up first, then turn on sync in Settings → Sync.
          </p>
          <button type="button" onClick={() => void stopSyncing()} className="pixel-button pixel-button--ghost">
            Use a different account
          </button>
        </div>
      ) : (
        <ChoosePassphrase status={status} />
      );
    case "enter-passphrase":
      return <EnterPassphrase status={status} adopt={adopt} onDone={onDone} />;
    default:
      return <Active status={status} />;
  }
}

export function SyncSettings() {
  return (
    <Section title="Sync across devices">
      <SyncPanel />
    </Section>
  );
}
