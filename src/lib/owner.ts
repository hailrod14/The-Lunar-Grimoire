/*
 * The Grimoire's owner, greeted on the cover. Set in code for now; leave it
 * empty for no greeting. (The cover is visible while locked, so this name is too.)
 */
export const OWNER_NAME = "Hailey";

/** "Good evening, Hailey" for the hour of the day (0–23). */
export function greeting(hour: number, name = OWNER_NAME): string | null {
  if (!name) return null;
  const part = hour < 5 ? "Sweet dreams" : hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : hour < 22 ? "Good evening" : "Sweet dreams";
  return `${part}, ${name}`;
}
