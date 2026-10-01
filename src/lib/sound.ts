"use client";

import { audioContext, pinkNoise } from "./audio";
import { getGrimoire } from "./store";

/*
 * A gentle page turn, synthesized so there are no audio files to download.
 *
 * Real page turns are mostly moving air, not paper scraping, so the sound is
 * soft pink noise shaped into two breaths: the page lifting, then a quieter
 * one as it settles. A slow flutter, slowing as the page falls, gives the bend
 * of the paper. Its brightness centres around 600 Hz with almost nothing
 * above 2 kHz (the old sound sat near 2.7 kHz, which is what made it a "wipe").
 */

type Kind = "page" | "cover";

type Shape = {
  seconds: number;
  /** [peak time, width] of the lift. */
  lift: [number, number];
  /** [peak time, width, level relative to the lift] of the settle. */
  settle: [number, number, number];
  /** Flutter rate in Hz, from the start of the turn to the end. */
  flutter: [number, number];
  lowCut: number;
  highCut: number;
  volume: number;
};

const SHAPES: Record<Kind, Shape> = {
  page: { seconds: 0.5, lift: [0.08, 0.05], settle: [0.27, 0.09, 0.5], flutter: [26, 9], lowCut: 250, highCut: 1800, volume: 0.2 },
  cover: { seconds: 0.8, lift: [0.14, 0.08], settle: [0.42, 0.13, 0.6], flutter: [14, 5], lowCut: 160, highCut: 1100, volume: 0.2 },
};

const cache = new WeakMap<BaseAudioContext, Partial<Record<Kind, AudioBuffer>>>();

/** The shaped noise for a turn, built once per kind and reused. */
function turnBuffer(ac: BaseAudioContext, kind: Kind): AudioBuffer {
  const saved = cache.get(ac) ?? {};
  if (saved[kind]) return saved[kind]!;

  const shape = SHAPES[kind];
  const buffer = pinkNoise(ac, shape.seconds);
  const data = buffer.getChannelData(0);
  const swell = (t: number, peak: number, width: number) => Math.exp(-(((t - peak) / width) ** 2));
  let phase = 0;
  for (let i = 0; i < data.length; i++) {
    const t = i / ac.sampleRate;
    const progress = t / shape.seconds;
    const envelope = swell(t, ...shape.lift) + shape.settle[2] * swell(t, shape.settle[0], shape.settle[1]);
    phase += (2 * Math.PI * (shape.flutter[0] + (shape.flutter[1] - shape.flutter[0]) * progress)) / ac.sampleRate;
    data[i] *= envelope * (1 + 0.35 * Math.sin(phase));
  }

  cache.set(ac, { ...saved, [kind]: buffer });
  return buffer;
}

/** Schedule a page turn on any audio context (also used to measure the sound offline). */
export function schedulePageTurn(ac: BaseAudioContext, destination: AudioNode, when: number, kind: Kind, rate = 1) {
  const shape = SHAPES[kind];
  const source = ac.createBufferSource();
  source.buffer = turnBuffer(ac, kind);
  source.playbackRate.value = rate;

  const lowpass = ac.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = shape.highCut;
  lowpass.Q.value = 0.5;
  const highpass = ac.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = shape.lowCut;
  const gain = ac.createGain();
  gain.gain.value = shape.volume;

  source.connect(highpass).connect(lowpass).connect(gain).connect(destination);
  source.start(when);

  if (kind === "cover") {
    // The cover comes to rest with a soft, low thump.
    const at = when + 0.5;
    const thump = ac.createOscillator();
    thump.frequency.setValueAtTime(90, at);
    thump.frequency.exponentialRampToValueAtTime(50, at + 0.25);
    const thumpGain = ac.createGain();
    thumpGain.gain.setValueAtTime(0.0001, at);
    thumpGain.gain.exponentialRampToValueAtTime(0.1, at + 0.03);
    thumpGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.3);
    thump.connect(thumpGain).connect(destination);
    thump.start(at);
    thump.stop(at + 0.32);
  }
}

/** Play a page turn, unless page sounds are turned off. `force` plays it anyway (for previews). */
export function playPageTurn(kind: Kind = "page", force = false) {
  try {
    if (!force && !getGrimoire().settings.soundEnabled) return;
    const ac = audioContext();
    if (!ac) return;
    // A touch of variation so repeated turns don't sound mechanical.
    schedulePageTurn(ac, ac.destination, ac.currentTime + 0.01, kind, 0.92 + Math.random() * 0.16);
  } catch {
    // Sound is a nicety; never let it break a page turn.
  }
}
