/*
 * The daily draw: one card from the tarot's Major Arcana (upright or
 * reversed), or one rune from the Elder Futhark. Meanings are short
 * reflections, written for this app.
 */

export type Deck = "tarot" | "runes";
export type Draw = { deck: Deck; card: number; reversed: boolean };

export type TarotCard = { numeral: string; name: string; upright: string; reversed: string };

export const MAJOR_ARCANA: TarotCard[] = [
  { numeral: "0", name: "The Fool", upright: "A fresh start. Leap with an open heart and trust the path to appear.", reversed: "Pause before the leap. Is this courage, or carelessness?" },
  { numeral: "I", name: "The Magician", upright: "You have every tool you need. Focus your will and make it real.", reversed: "Scattered energy. Gather yourself before you act." },
  { numeral: "II", name: "The High Priestess", upright: "Listen inward. Your intuition already knows.", reversed: "Noise drowns out your inner voice. Seek quiet." },
  { numeral: "III", name: "The Empress", upright: "Abundance and nurture. Tend yourself as you would a garden.", reversed: "Pouring from an empty cup. Replenish first." },
  { numeral: "IV", name: "The Emperor", upright: "Structure and steady boundaries bring security.", reversed: "Rigid control, or none at all. Find the balance." },
  { numeral: "V", name: "The Hierophant", upright: "Tradition, teachers, and shared wisdom guide you.", reversed: "Question the rules that no longer fit you." },
  { numeral: "VI", name: "The Lovers", upright: "Connection and a choice made from the heart.", reversed: "Something is out of alignment. Choose what's true." },
  { numeral: "VII", name: "The Chariot", upright: "Momentum through determination. Steer with intent.", reversed: "Pulled in two directions. Pick one road." },
  { numeral: "VIII", name: "Strength", upright: "Gentle courage. Soft hands can tame wild things.", reversed: "Self-doubt whispers. Be kind to yourself today." },
  { numeral: "IX", name: "The Hermit", upright: "Turn inward. Solitude lights the lantern.", reversed: "Withdrawn too long. Let someone in." },
  { numeral: "X", name: "Wheel of Fortune", upright: "The wheel turns. Change is coming; move with it.", reversed: "Resisting the turn. What can you release?" },
  { numeral: "XI", name: "Justice", upright: "Truth, fairness, and the consequences of choices.", reversed: "Something feels unbalanced. Be honest about it." },
  { numeral: "XII", name: "The Hanged One", upright: "Surrender and see from a new angle.", reversed: "Stalling for its own sake. It's time to move." },
  { numeral: "XIII", name: "Death", upright: "An ending that clears the way. Let it close.", reversed: "Clinging to what's already over." },
  { numeral: "XIV", name: "Temperance", upright: "Balance, patience, and blending opposites.", reversed: "Too much, or too little. Find the middle." },
  { numeral: "XV", name: "The Devil", upright: "Notice what binds you: habits, fears, desires.", reversed: "A chain loosens. Freedom is within reach." },
  { numeral: "XVI", name: "The Tower", upright: "Sudden change shakes what was built on sand.", reversed: "Upheaval narrowly avoided, or quietly happening." },
  { numeral: "XVII", name: "The Star", upright: "Hope and healing. Calm waters after the storm.", reversed: "Faith runs thin. Small kindnesses restore it." },
  { numeral: "XVIII", name: "The Moon", upright: "Dreams and uncertainty. Not all is as it seems.", reversed: "Confusion lifts; the path grows clearer." },
  { numeral: "XIX", name: "The Sun", upright: "Joy, warmth, and simple delight. Let yourself shine.", reversed: "The light is behind a cloud, but it's still there." },
  { numeral: "XX", name: "Judgement", upright: "Awakening and a clear call. Answer it.", reversed: "Self-criticism blocks the call. Forgive yourself." },
  { numeral: "XXI", name: "The World", upright: "Completion. A cycle closes, whole and well.", reversed: "Almost there. Tie up the last loose thread." },
];

export type Rune = { name: string; sound: string; meaning: string; strokes: [number, number, number, number][] };

/** Strokes are line segments on a 6 × 10 grid: [x1, y1, x2, y2]. */
export const ELDER_FUTHARK: Rune[] = [
  { name: "Fehu", sound: "f", meaning: "Wealth and what you've earned. Tend your resources with care.", strokes: [[1, 0, 1, 10], [1, 4, 5, 1], [1, 7, 5, 4]] },
  { name: "Uruz", sound: "u", meaning: "Raw strength and vitality. Your body knows its power.", strokes: [[1, 10, 1, 0], [1, 0, 5, 3], [5, 3, 5, 10]] },
  { name: "Thurisaz", sound: "th", meaning: "A thorn: protection, or an obstacle. Act with care.", strokes: [[1, 0, 1, 10], [1, 3, 5, 5], [5, 5, 1, 7]] },
  { name: "Ansuz", sound: "a", meaning: "Messages and wisdom. Listen closely to what's said.", strokes: [[1, 0, 1, 10], [1, 0, 5, 3], [1, 3, 5, 6]] },
  { name: "Raidho", sound: "r", meaning: "A journey, inner or outer. Keep a steady rhythm.", strokes: [[1, 0, 1, 10], [1, 0, 5, 2.5], [5, 2.5, 1, 5], [1, 5, 5, 10]] },
  { name: "Kenaz", sound: "k", meaning: "A torch: insight and creative fire.", strokes: [[5, 0, 1, 5], [1, 5, 5, 10]] },
  { name: "Gebo", sound: "g", meaning: "A gift, given and received. Balance in exchange.", strokes: [[0, 0, 6, 10], [6, 0, 0, 10]] },
  { name: "Wunjo", sound: "w", meaning: "Joy and belonging. Let yourself be glad.", strokes: [[1, 0, 1, 10], [1, 0, 5, 2.5], [5, 2.5, 1, 5]] },
  { name: "Hagalaz", sound: "h", meaning: "Hail: disruption that clears the air.", strokes: [[1, 0, 1, 10], [5, 0, 5, 10], [1, 4, 5, 6]] },
  { name: "Naudhiz", sound: "n", meaning: "Need. Name what you truly lack, and be patient.", strokes: [[3, 0, 3, 10], [1, 3, 5, 7]] },
  { name: "Isa", sound: "i", meaning: "Ice: stillness. Pause; not every season is for growing.", strokes: [[3, 0, 3, 10]] },
  { name: "Jera", sound: "j", meaning: "The harvest. What you planted is ripening.", strokes: [[2, 1, 0, 4], [0, 4, 2, 7], [4, 3, 6, 6], [6, 6, 4, 9]] },
  { name: "Eihwaz", sound: "ei", meaning: "The yew: endurance through change.", strokes: [[3, 0, 3, 10], [3, 0, 5, 2], [3, 10, 1, 8]] },
  { name: "Perthro", sound: "p", meaning: "Mystery and chance. Not everything needs knowing yet.", strokes: [[1, 0, 1, 10], [1, 0, 5, 3], [1, 10, 5, 7]] },
  { name: "Algiz", sound: "z", meaning: "Protection. You are sheltered; reach upward.", strokes: [[3, 0, 3, 10], [3, 4, 0, 0], [3, 4, 6, 0]] },
  { name: "Sowilo", sound: "s", meaning: "The sun: success, clarity, and wholeness.", strokes: [[4, 0, 1, 4], [1, 4, 5, 6], [5, 6, 2, 10]] },
  { name: "Tiwaz", sound: "t", meaning: "Courage and honour. Stand for what's right.", strokes: [[3, 0, 3, 10], [3, 0, 0, 3], [3, 0, 6, 3]] },
  { name: "Berkano", sound: "b", meaning: "The birch: renewal, nurture, new growth.", strokes: [[1, 0, 1, 10], [1, 0, 5, 2.5], [5, 2.5, 1, 5], [1, 5, 5, 7.5], [5, 7.5, 1, 10]] },
  { name: "Ehwaz", sound: "e", meaning: "Partnership and trust. Move forward together.", strokes: [[0, 0, 0, 10], [6, 0, 6, 10], [0, 0, 3, 4], [3, 4, 6, 0]] },
  { name: "Mannaz", sound: "m", meaning: "Humanity and the self. You are part of something larger.", strokes: [[0, 0, 0, 10], [6, 0, 6, 10], [0, 0, 6, 5], [6, 0, 0, 5]] },
  { name: "Laguz", sound: "l", meaning: "Water and flow. Trust your feelings to carry you.", strokes: [[1, 0, 1, 10], [1, 0, 5, 3]] },
  { name: "Ingwaz", sound: "ng", meaning: "A seed at rest: potential gathering before it grows.", strokes: [[3, 0, 0, 5], [0, 5, 3, 10], [3, 10, 6, 5], [6, 5, 3, 0]] },
  { name: "Dagaz", sound: "d", meaning: "Daybreak: a breakthrough, light after dark.", strokes: [[0, 0, 0, 10], [6, 0, 6, 10], [0, 0, 6, 10], [6, 0, 0, 10]] },
  { name: "Othala", sound: "o", meaning: "Home and heritage. What roots you, and what you'll pass on.", strokes: [[3, 0, 0, 3], [0, 3, 3, 6], [3, 6, 6, 3], [6, 3, 3, 0], [3, 6, 0, 10], [3, 6, 6, 10]] },
];

/** Draw at random: a Major Arcana card (reversed one time in three) or a rune. */
export function drawFrom(deck: Deck, random = Math.random): Draw {
  if (deck === "tarot") return { deck, card: Math.floor(random() * MAJOR_ARCANA.length), reversed: random() < 1 / 3 };
  return { deck, card: Math.floor(random() * ELDER_FUTHARK.length), reversed: false };
}

export function isValidDraw(v: unknown): v is Draw {
  const d = v as Draw;
  if (typeof d !== "object" || d === null || (d.deck !== "tarot" && d.deck !== "runes")) return false;
  const size = d.deck === "tarot" ? MAJOR_ARCANA.length : ELDER_FUTHARK.length;
  return Number.isInteger(d.card) && d.card >= 0 && d.card < size && typeof d.reversed === "boolean";
}
