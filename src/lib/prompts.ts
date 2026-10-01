import { tideDay, type Phase } from "./cycle";
import { parseKey, type DateKey } from "./dates";
import { skyMoonPhase } from "./moon";
import type { Grimoire } from "./types";
import { skyDay } from "./wheel";

/*
 * Journal prompts for the day: one for a sabbat or a new or full moon when
 * there is one, then prompts suited to where you are in your tide (or the
 * sky's moon if you aren't tracking). Plus a small ritual for new and full moons.
 */

const BY_PHASE: Record<Phase, string[]> = {
  dark: [
    "What does your body need most today, and how can you give it a little of that?",
    "What are you ready to release with this tide?",
    "Write a kind letter to yourself, as you'd write to a dear friend who's tired.",
    "What would rest look like today if it didn't have to be earned?",
    "Which feelings came up today? Name them without judging them.",
    "What small comfort helped today?",
    "What can wait until you feel stronger?",
    "If your body could speak tonight, what would it say?",
  ],
  waxing: [
    "What new thing is calling to you this week?",
    "Plant an intention: what would you like to grow this cycle?",
    "What would you try if you knew it couldn't go wrong?",
    "What gave you a spark of energy today?",
    "Who would you like to reach out to, and why?",
    "What's one small step toward something you want?",
    "What are you curious about right now?",
    "Picture yourself a month from now. What are you doing, and how do you feel?",
  ],
  full: [
    "What are you proud of this cycle, however small?",
    "Where do you feel most like yourself lately?",
    "What are three things you're grateful for tonight?",
    "What has bloomed since your last tide?",
    "What would you celebrate if you gave yourself permission?",
    "Who made you feel seen recently? Tell them, or tell your Grimoire.",
    "What's illuminated now that was hidden before?",
    "Where in your life is there abundance right now?",
  ],
  waning: [
    "What's weighing on you, and is it yours to carry?",
    "What do you need to say no to this week?",
    "What drained you today, and what refilled you?",
    "What are you noticing that you usually push aside?",
    "What boundaries would make next week gentler?",
    "What can you finish, and what can you let go unfinished?",
    "What would make your space feel cozier tonight?",
    "What truth have you been circling around lately?",
  ],
};

const NEW_MOON = "The moon is new: what intention would you like to plant for the month ahead?";
const FULL_MOON = "The moon is full: what has come to light, and what are you ready to release?";

const SABBAT_PROMPTS: Record<string, string> = {
  samhain: "Samhain: who or what from your past would you like to honour tonight?",
  yule: "Yule: what light are you carrying through the darkest days?",
  imbolc: "Imbolc: what quiet hope is stirring beneath the frost?",
  ostara: "Ostara: where would you like more balance between rest and action?",
  beltane: "Beltane: what makes you feel most alive and joyful?",
  litha: "Litha: what's at its fullest in your life right now?",
  lughnasadh: "Lughnasadh: what's ready to be harvested from your efforts?",
  mabon: "Mabon: what are you thankful for as the year turns toward dark?",
};

export const RITUALS: Record<"new" | "full", string> = {
  new: "Write three wishes for the coming month on a slip of paper. Fold it toward you and keep it somewhere safe until the full moon.",
  full: "Set a glass of water in the moonlight to charge overnight. Write down one thing you're releasing, then tear it up or let it go.",
};

/** Where the day falls: your tide's phase, or the sky's moon if you're not tracking. */
export function phaseOfDay(g: Grimoire, date: DateKey, today: DateKey): Phase {
  if (g.settings.cycleTracking) {
    const tide = tideDay(date, g.tides, g.settings, today);
    if (tide) return tide.phase;
  }
  const p = skyMoonPhase(parseKey(date));
  if (p < 0.07 || p > 0.93) return "dark";
  if (p < 0.43) return "waxing";
  if (p < 0.57) return "full";
  return "waning";
}

/** A stable shuffle seed per day, so the day's first prompt doesn't change each visit. */
const seed = (date: DateKey) => [...date].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

/** The day's prompts, most special first. */
export function promptsFor(g: Grimoire, date: DateKey, today: DateKey): string[] {
  const { sabbat, moon } = skyDay(date, g.settings.hemisphere);
  const special = [sabbat ? SABBAT_PROMPTS[sabbat.id] : null, moon ? (moon.kind === "new" ? NEW_MOON : FULL_MOON) : null].filter(
    (x): x is string => Boolean(x),
  );
  const list = BY_PHASE[phaseOfDay(g, date, today)];
  const start = seed(date) % list.length;
  return [...special, ...list.slice(start), ...list.slice(0, start)];
}
