// The Lunar Grimoire's reminder bell. It knows only reminder times, opaque
// reminder ids, and where to ring (a browser push address). It never sees
// medication names or anything else from the Grimoire. Each push carries no
// content: the phone's own copy of the app decides what the notification says.

import { cleanKeys, cleanReminders, dueNow, isDate, isId, isPushEndpoint, isTimeZone, localNow } from "./due.js";

const ALLOWED_ORIGINS = ["https://hailrod14.github.io", "http://localhost:3000"];

const cors = (origin) => ({
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
  Vary: "Origin",
});

const json = (body, status, origin) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...cors(origin) } });

const worker = {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? "";
    const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(allowed) });
    if (request.method !== "POST") return json({ error: "Not found" }, 404, allowed);
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Bad request" }, 400, allowed);
    }
    const now = Date.now();
    const path = new URL(request.url).pathname;

    if (path === "/subscribe") {
      if (!isId(body.device) || !isId(body.group) || !isPushEndpoint(body.endpoint)) return json({ error: "Bad request" }, 400, allowed);
      await env.DB.prepare("INSERT INTO devices (id, grp, endpoint, updated) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(id) DO UPDATE SET grp = ?2, endpoint = ?3, updated = ?4")
        .bind(body.device, body.group, body.endpoint, now)
        .run();
      return json({ ok: true }, 200, allowed);
    }
    if (path === "/unsubscribe") {
      if (!isId(body.device)) return json({ error: "Bad request" }, 400, allowed);
      await env.DB.prepare("DELETE FROM devices WHERE id = ?1").bind(body.device).run();
      return json({ ok: true }, 200, allowed);
    }
    if (path === "/schedule") {
      const reminders = cleanReminders(body.reminders);
      if (!isId(body.group) || !isTimeZone(body.tz) || !reminders) return json({ error: "Bad request" }, 400, allowed);
      await env.DB.prepare("INSERT INTO groups (id, tz, reminders, updated) VALUES (?1, ?2, ?3, ?4) ON CONFLICT(id) DO UPDATE SET tz = ?2, reminders = ?3, updated = ?4")
        .bind(body.group, body.tz, JSON.stringify(reminders), now)
        .run();
      return json({ ok: true }, 200, allowed);
    }
    if (path === "/taken") {
      const keys = cleanKeys(body.keys);
      if (!isId(body.group) || !isDate(body.date) || !keys) return json({ error: "Bad request" }, 400, allowed);
      await env.DB.prepare("INSERT INTO taken (grp, day, keys) VALUES (?1, ?2, ?3) ON CONFLICT(grp, day) DO UPDATE SET keys = ?3")
        .bind(body.group, body.date, JSON.stringify(keys))
        .run();
      return json({ ok: true }, 200, allowed);
    }
    return json({ error: "Not found" }, 404, allowed);
  },

  async scheduled(_event, env, ctx) {
    ctx.waitUntil(ring(env));
  },
};

export default worker;

async function ring(env) {
  const at = new Date();
  const { results: groups } = await env.DB.prepare("SELECT id, tz, reminders FROM groups").all();
  for (const group of groups) {
    const now = localNow(at, group.tz);
    const taken = JSON.parse((await env.DB.prepare("SELECT keys FROM taken WHERE grp = ?1 AND day = ?2").bind(group.id, now.date).first())?.keys ?? "[]");
    const sentRows = (await env.DB.prepare("SELECT k FROM sent WHERE grp = ?1 AND day = ?2").bind(group.id, now.date).all()).results;
    const due = dueNow(JSON.parse(group.reminders), now, taken, sentRows.map((r) => r.k));
    if (!due.length) continue;

    for (const r of due) await env.DB.prepare("INSERT OR IGNORE INTO sent (grp, day, k) VALUES (?1, ?2, ?3)").bind(group.id, now.date, r.k).run();
    const { results: devices } = await env.DB.prepare("SELECT id, endpoint FROM devices WHERE grp = ?1").bind(group.id).all();
    for (const device of devices) {
      const status = await push(device.endpoint, env).catch(() => 0);
      if (status === 404 || status === 410) await env.DB.prepare("DELETE FROM devices WHERE id = ?1").bind(device.id).run();
    }
  }
  // Forget old bookkeeping.
  const weekAgo = new Date(at.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
  await env.DB.prepare("DELETE FROM sent WHERE day < ?1").bind(weekAgo).run();
  await env.DB.prepare("DELETE FROM taken WHERE day < ?1").bind(weekAgo).run();
}

// ── Web Push with VAPID (RFC 8292), no payload ────────────────

const b64url = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const text = (s) => new TextEncoder().encode(s);

async function push(endpoint, env) {
  const header = b64url(text(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const claims = b64url(text(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: env.VAPID_SUBJECT })));
  const key = await crypto.subtle.importKey("jwk", JSON.parse(env.VAPID_PRIVATE_JWK), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, text(`${header}.${claims}`));
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { Authorization: `vapid t=${header}.${claims}.${b64url(signature)}, k=${env.VAPID_PUBLIC}`, TTL: "3600", Urgency: "high", "Content-Length": "0" },
  });
  return response.status;
}
