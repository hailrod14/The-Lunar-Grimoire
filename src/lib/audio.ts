"use client";

/*
 * One shared Web Audio context for page sounds and music. Browsers keep
 * audio suspended until the person taps something, so callers resume it
 * from within a tap.
 */

let context: AudioContext | null = null;

export function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor = window.AudioContext ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

/** Brown noise: white noise with the hiss rolled off, soft like air or distant wind. */
export function brownNoise(ac: BaseAudioContext, seconds: number, channels = 1): AudioBuffer {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(channels, length, ac.sampleRate);
  for (let c = 0; c < channels; c++) {
    const data = buffer.getChannelData(c);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
  }
  return buffer;
}

/** Pink noise: between hiss and rumble, the colour of moving air. (Paul Kellet's refined filter.) */
export function pinkNoise(ac: BaseAudioContext, seconds: number): AudioBuffer {
  const length = Math.floor(ac.sampleRate * seconds);
  const buffer = ac.createBuffer(1, length, ac.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0; // prettier-ignore
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + white * 0.0555179;
    b1 = 0.99332 * b1 + white * 0.0750759;
    b2 = 0.969 * b2 + white * 0.153852;
    b3 = 0.8665 * b3 + white * 0.3104856;
    b4 = 0.55 * b4 + white * 0.5329522;
    b5 = -0.7616 * b5 - white * 0.016898;
    data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
    b6 = white * 0.115926;
  }
  return buffer;
}
