// Which reminders are due right now for one group, in its own time zone.
// Pure functions, shared by the worker and its tests.

/** How late a reminder may still go out (covers a delayed or skipped cron run). */
export const GRACE_MINUTES = 5;

/** The local date, "HH:MM", and weekday (0 = Sunday) of an instant in a time zone. */
export function localNow(at, timeZone) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
      hourCycle: "h23",
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`, weekday };
}

const minutes = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3));

/**
 * Reminders whose time has just come (within the grace period), on a day they
 * apply, that haven't been taken or already sent today.
 * reminders: [{ k, time: "HH:MM", days: number[] (empty = every day) }]
 */
export function dueNow(reminders, now, taken, sent) {
  const nowMin = minutes(now.time);
  return reminders.filter((r) => {
    const late = nowMin - minutes(r.time);
    return (
      late >= 0 &&
      late <= GRACE_MINUTES &&
      (r.days.length === 0 || r.days.includes(now.weekday)) &&
      !taken.includes(r.k) &&
      !sent.includes(r.k)
    );
  });
}

// ── Validating what the app sends ─────────────────────────────

export const isId = (v) => typeof v === "string" && /^[A-Za-z0-9_-]{16,64}$/.test(v);

/** Only real browser push services, so the worker can't be pointed at anything else. */
const PUSH_HOSTS = [/\.googleapis\.com$/, /\.mozilla\.com$/, /\.notify\.windows\.com$/, /^web\.push\.apple\.com$/];
export function isPushEndpoint(v) {
  try {
    const url = new URL(v);
    return url.protocol === "https:" && v.length <= 1000 && PUSH_HOSTS.some((h) => h.test(url.hostname));
  } catch {
    return false;
  }
}

export function isTimeZone(v) {
  try {
    return typeof v === "string" && v.length <= 64 && Boolean(new Intl.DateTimeFormat("en-US", { timeZone: v }));
  } catch {
    return false;
  }
}

export function cleanReminders(v) {
  if (!Array.isArray(v) || v.length > 60) return null;
  const out = [];
  for (const r of v) {
    if (typeof r?.k !== "string" || r.k.length > 100 || typeof r.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) return null;
    const days = Array.isArray(r.days) ? r.days.filter((d) => Number.isInteger(d) && d >= 0 && d <= 6) : [];
    out.push({ k: r.k, time: r.time, days });
  }
  return out;
}

export const cleanKeys = (v) => (Array.isArray(v) && v.length <= 120 && v.every((k) => typeof k === "string" && k.length <= 100) ? v : null);
export const isDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
