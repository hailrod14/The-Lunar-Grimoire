"use client";

import { getGrimoire } from "./store";

/*
 * Page-turn sounds, synthesized with the Web Audio API so there are no
 * audio files to download. A page is a short, bright rustle of paper; the
 * cover is a heavier rustle that ends in a soft thud as it lands.
 */

let context: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  // Browsers start audio suspended until a tap; turns always come from one.
  if (context.state === "suspended") void context.resume();
  return context;
}

/** Paper noise: white noise with an uneven, crackly texture. */
function rustle(ac: AudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let grain = 1;
  for (let i = 0; i < length; i++) {
    if (i % 220 === 0) grain = 0.35 + Math.random() * 0.65; // a new fibre every ~5 ms
    data[i] = (Math.random() * 2 - 1) * grain;
  }
  return buffer;
}

export function playPageTurn(kind: "page" | "cover" = "page") {
  try {
    if (!getGrimoire().settings.soundEnabled) return;
    const ac = audio();
    if (!ac) return;
    const now = ac.currentTime;
    const cover = kind === "cover";
    const seconds = cover ? 0.55 : 0.38;

    const source = ac.createBufferSource();
    source.buffer = rustle(ac, seconds);
    const band = ac.createBiquadFilter();
    band.type = "bandpass";
    band.Q.value = 0.9;
    band.frequency.setValueAtTime(cover ? 1400 : 3200, now);
    band.frequency.exponentialRampToValueAtTime(cover ? 380 : 1100, now + seconds);
    const gain = ac.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(cover ? 0.32 : 0.18, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    source.connect(band).connect(gain).connect(ac.destination);
    source.start(now);
    source.stop(now + seconds);

    if (cover) {
      // The cover settles with a low, soft thud.
      const thud = ac.createOscillator();
      thud.type = "sine";
      const at = now + seconds * 0.7;
      thud.frequency.setValueAtTime(120, at);
      thud.frequency.exponentialRampToValueAtTime(55, at + 0.22);
      const thudGain = ac.createGain();
      thudGain.gain.setValueAtTime(0.0001, at);
      thudGain.gain.exponentialRampToValueAtTime(0.35, at + 0.02);
      thudGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.25);
      thud.connect(thudGain).connect(ac.destination);
      thud.start(at);
      thud.stop(at + 0.26);
    }
  } catch {
    // Sound is a nicety; never let it break a page turn.
  }
}
