-- Reminder times per group (a group is everyone's devices for one Grimoire).
CREATE TABLE IF NOT EXISTS groups (id TEXT PRIMARY KEY, tz TEXT NOT NULL, reminders TEXT NOT NULL, updated INTEGER NOT NULL);
-- Each device's browser push address.
CREATE TABLE IF NOT EXISTS devices (id TEXT PRIMARY KEY, grp TEXT NOT NULL, endpoint TEXT NOT NULL, updated INTEGER NOT NULL);
CREATE INDEX IF NOT EXISTS devices_grp ON devices (grp);
-- Which reminders were already checked off today (opaque ids), so they're skipped.
CREATE TABLE IF NOT EXISTS taken (grp TEXT NOT NULL, day TEXT NOT NULL, keys TEXT NOT NULL, PRIMARY KEY (grp, day));
-- Which reminders already rang today, so none rings twice.
CREATE TABLE IF NOT EXISTS sent (grp TEXT NOT NULL, day TEXT NOT NULL, k TEXT NOT NULL, PRIMARY KEY (grp, day, k));
