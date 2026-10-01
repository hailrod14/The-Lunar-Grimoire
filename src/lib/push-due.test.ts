import { describe, expect, it } from "vitest";
import { cleanReminders, dueNow, isPushEndpoint, isTimeZone, localNow } from "../../push/due.js";

describe("the reminder bell", () => {
  it("reads the clock in each group's own time zone", () => {
    const at = new Date("2026-10-01T13:00:00Z");
    expect(localNow(at, "America/New_York")).toEqual({ date: "2026-10-01", time: "09:00", weekday: 4 });
    expect(localNow(at, "Australia/Sydney")).toEqual({ date: "2026-10-01", time: "23:00", weekday: 4 });
  });

  it("rings at the time, a little late if the clock skipped, but never twice or once taken", () => {
    const reminders = [
      { k: "iron:0", time: "09:00", days: [] },
      { k: "mag:0", time: "09:00", days: [1] },
      { k: "late:0", time: "08:50", days: [] },
    ];
    const at = (time: string) => ({ date: "2026-10-01", time, weekday: 4 });
    expect(dueNow(reminders, at("08:59"), [], []).map((r) => r.k)).toEqual([]);
    expect(dueNow(reminders, at("09:00"), [], []).map((r) => r.k)).toEqual(["iron:0"]);
    expect(dueNow(reminders, at("09:04"), [], []).map((r) => r.k)).toEqual(["iron:0"]);
    expect(dueNow(reminders, at("09:06"), [], []).map((r) => r.k)).toEqual([]);
    expect(dueNow(reminders, at("09:01"), [], ["iron:0"])).toEqual([]);
    expect(dueNow(reminders, at("09:01"), ["iron:0"], [])).toEqual([]);
  });

  it("accepts only real push services, zones, and well-formed schedules", () => {
    expect(isPushEndpoint("https://fcm.googleapis.com/fcm/send/abc")).toBe(true);
    expect(isPushEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc")).toBe(true);
    expect(isPushEndpoint("https://evil.example.com/fcm.googleapis.com")).toBe(false);
    expect(isPushEndpoint("http://fcm.googleapis.com/x")).toBe(false);
    expect(isTimeZone("America/New_York")).toBe(true);
    expect(isTimeZone("Mars/Olympus")).toBe(false);
    expect(cleanReminders([{ k: "a", time: "25:00", days: [] }])).toBeNull();
    expect(cleanReminders([{ k: "a", time: "07:30", days: [1, 9] }])).toEqual([{ k: "a", time: "07:30", days: [1] }]);
  });
});
