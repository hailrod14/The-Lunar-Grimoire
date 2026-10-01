"use client";

import { audioContext, brownNoise } from "./audio";
import { getGrimoire } from "./store";

/*
 * Cozy forest-witch music, generated live so it never loops and needs no
 * files. A slow D-minor progression on warm pads and a low bass; a music box
 * wandering a pentatonic melody; and the forest around the cabin: wind in
 * the trees, crickets, a crackling hearth, and now and then an owl. All of
 * it sits in a soft reverb, as if heard from inside a wooden room.
 */

const BPM = 62;
const BEAT = 60 / BPM;
const BAR = BEAT * 4;
/** Notes are scheduled this far ahead so timing stays steady. */
const LOOKAHEAD = 1.5;
/** Overall loudness at full volume; music should sit well under the page sounds. */
const MAX_LEVEL = 0.35;

const hz = (midi: number) => 440 * 2 ** ((midi - 69) / 12);

/** Each chord lasts two bars: Dm9 → B♭maj7 → Fmaj7 → Am7. */
const PROGRESSION = [
  { bass: 38, pad: [62, 65, 69, 72, 76] },
  { bass: 34, pad: [58, 62, 65, 69] },
  { bass: 41, pad: [57, 60, 64, 65, 67] },
  { bass: 33, pad: [57, 60, 64, 67] },
];
/** D minor pentatonic (plus E) for the music box, high and sparkly. */
const MELODY = [74, 76, 77, 79, 81, 84, 86, 88];

const rand = (lo: number, hi: number) => lo + Math.random() * (hi - lo);
const chance = (p: number) => Math.random() < p;

class ForestMusic {
  private ac: AudioContext;
  private master: GainNode;
  private reverb: ConvolverNode;
  private sources: AudioScheduledSourceNode[] = [];
  private timer: ReturnType<typeof setInterval>;
  private nextBar: number;
  private bar = 0;
  private lastNote = MELODY[2];
  private nextOwl: number;
  private ambienceUntil: number;

  constructor(ac: AudioContext, volume: number) {
    this.ac = ac;
    const now = ac.currentTime;

    this.master = ac.createGain();
    this.master.gain.setValueAtTime(0.0001, now);
    this.master.gain.linearRampToValueAtTime(volume * MAX_LEVEL, now + 4); // fade in gently
    this.master.connect(ac.destination);

    this.reverb = ac.createConvolver();
    this.reverb.buffer = this.impulse(3.2);
    const wet = ac.createGain();
    wet.gain.value = 0.55;
    this.reverb.connect(wet).connect(this.master);

    this.startWind();
    this.nextBar = now + 0.2;
    this.nextOwl = now + rand(20, 45);
    this.ambienceUntil = now;
    this.timer = setInterval(() => this.schedule(), 250);
    this.schedule();
  }

  setVolume(volume: number) {
    this.master.gain.setTargetAtTime(Math.max(0.0001, volume * MAX_LEVEL), this.ac.currentTime, 0.4);
  }

  stop() {
    clearInterval(this.timer);
    const now = this.ac.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(0.0001, now, 0.5);
    setTimeout(() => {
      for (const s of this.sources) {
        try {
          s.stop();
        } catch {
          // Already stopped.
        }
      }
      this.master.disconnect();
    }, 2500);
  }

  // ── Scheduling ─────────────────────────────────────────────

  private schedule() {
    const horizon = this.ac.currentTime + LOOKAHEAD;
    while (this.nextBar < horizon) {
      this.scheduleBar(this.nextBar, this.bar);
      this.nextBar += BAR;
      this.bar++;
    }
    // Forest sounds, sprinkled through the time just scheduled.
    while (this.ambienceUntil < horizon) {
      const t = this.ambienceUntil;
      if (chance(0.06)) this.crickets(t + rand(0, 0.25));
      if (chance(0.5)) this.crackle(t + rand(0, 0.25));
      this.ambienceUntil += 0.25;
    }
    if (this.nextOwl < horizon) {
      this.owl(this.nextOwl);
      this.nextOwl += rand(40, 90);
    }
  }

  private scheduleBar(t: number, bar: number) {
    const chord = PROGRESSION[Math.floor(bar / 2) % PROGRESSION.length];
    if (bar % 2 === 0) {
      for (const note of chord.pad) this.pad(hz(note), t, BAR * 2);
      this.bass(hz(chord.bass), t, BAR * 2);
    }
    // The music box: a few notes per bar, leaning on chord tones, moving in small steps.
    for (let eighth = 0; eighth < 8; eighth++) {
      const onBeat = eighth % 2 === 0;
      if (!chance(onBeat ? 0.32 : 0.16)) continue;
      const swing = onBeat ? 0 : BEAT * 0.08;
      this.musicBox(hz(this.pickNote(chord.pad)), t + eighth * (BEAT / 2) + swing, rand(0.5, 1));
    }
  }

  private pickNote(chordTones: number[]): number {
    const fits = (m: number) => chordTones.some((c) => (m - c) % 12 === 0);
    const near = MELODY.filter((m) => Math.abs(m - this.lastNote) <= 5);
    const choices = near.filter(fits);
    const pool = choices.length && chance(0.7) ? choices : near;
    this.lastNote = pool[Math.floor(Math.random() * pool.length)];
    return this.lastNote;
  }

  // ── Voices ─────────────────────────────────────────────────

  private voice(destination: AudioNode, reverbSend: number) {
    const gain = this.ac.createGain();
    gain.connect(destination);
    if (reverbSend > 0) {
      const send = this.ac.createGain();
      send.gain.value = reverbSend;
      gain.connect(send).connect(this.reverb);
    }
    return gain;
  }

  /** Warm, slowly swelling chord tones: two softly detuned oscillators through a dark filter. */
  private pad(freq: number, t: number, length: number) {
    const filter = this.ac.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1000;
    const gain = this.voice(this.master, 0.6);
    filter.connect(gain);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.03, t + 2.5);
    gain.gain.setValueAtTime(0.03, t + length - 0.5);
    gain.gain.linearRampToValueAtTime(0.0001, t + length + 2.5);
    for (const [type, cents] of [["sine", -5], ["triangle", 6]] as const) {
      const osc = this.ac.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = cents;
      osc.connect(filter);
      osc.start(t);
      osc.stop(t + length + 2.6);
    }
  }

  private bass(freq: number, t: number, length: number) {
    const gain = this.voice(this.master, 0.2);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(0.06, t + 1.5);
    gain.gain.linearRampToValueAtTime(0.0001, t + length + 1);
    const osc = this.ac.createOscillator();
    osc.frequency.value = freq;
    osc.connect(gain);
    osc.start(t);
    osc.stop(t + length + 1.1);
  }

  /** A music-box tine: a pure tone with a faint bright overtone and a long, ringing decay. */
  private musicBox(freq: number, t: number, velocity: number) {
    const gain = this.voice(this.master, 0.9);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.07 * velocity, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    for (const [ratio, level] of [[1, 1], [4.2, 0.12]] as const) {
      const osc = this.ac.createOscillator();
      osc.frequency.value = freq * ratio;
      const partial = this.ac.createGain();
      partial.gain.value = level;
      osc.connect(partial).connect(gain);
      osc.start(t);
      osc.stop(t + 2.5);
    }
  }

  // ── The forest ─────────────────────────────────────────────

  /** Wind in the trees: dark noise whose loudness and colour drift slowly. */
  private startWind() {
    const source = this.ac.createBufferSource();
    source.buffer = brownNoise(this.ac, 6, 2);
    source.loop = true;
    const filter = this.ac.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 420;
    filter.Q.value = 0.7;
    const gain = this.voice(this.master, 0.3);
    gain.gain.value = 0.05;
    source.connect(filter).connect(gain);

    for (const [target, rate, depth] of [[gain.gain, 0.05, 0.03], [filter.frequency, 0.031, 160]] as const) {
      const lfo = this.ac.createOscillator();
      lfo.frequency.value = rate;
      const amount = this.ac.createGain();
      amount.gain.value = depth;
      lfo.connect(amount).connect(target);
      lfo.start();
      this.sources.push(lfo);
    }
    source.start();
    this.sources.push(source);
  }

  /** A short run of cricket chirps, off to one side. */
  private crickets(t: number) {
    const pan = this.ac.createStereoPanner();
    pan.pan.value = rand(-0.8, 0.8);
    const gain = this.voice(pan, 0.4);
    pan.connect(this.master);
    gain.gain.value = 0;
    const osc = this.ac.createOscillator();
    osc.frequency.value = rand(4200, 4700);
    osc.connect(gain);
    const chirps = Math.floor(rand(2, 5));
    let at = t;
    for (let c = 0; c < chirps; c++) {
      for (let pulse = 0; pulse < 3; pulse++) {
        gain.gain.setValueAtTime(0.008, at);
        gain.gain.setValueAtTime(0, at + 0.012);
        at += 0.025;
      }
      at += rand(0.18, 0.3);
    }
    osc.start(t);
    osc.stop(at + 0.05);
  }

  /** A pop from the hearth. */
  private crackle(t: number) {
    const source = this.ac.createBufferSource();
    source.buffer = brownNoise(this.ac, 0.03);
    const filter = this.ac.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = rand(900, 2200);
    const gain = this.voice(this.master, 0.15);
    gain.gain.value = rand(0.04, 0.12);
    source.connect(filter).connect(gain);
    source.start(t);
  }

  /** Two soft hoots from somewhere in the trees. */
  private owl(t: number) {
    const pan = this.ac.createStereoPanner();
    pan.pan.value = rand(-0.6, 0.6);
    pan.connect(this.master);
    for (const [offset, length] of [[0, 0.32], [0.55, 0.55]] as const) {
      const at = t + offset;
      const gain = this.voice(pan, 1);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.035, at + 0.06);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
      const osc = this.ac.createOscillator();
      osc.frequency.setValueAtTime(400, at);
      osc.frequency.exponentialRampToValueAtTime(350, at + length);
      osc.connect(gain);
      osc.start(at);
      osc.stop(at + length + 0.05);
    }
  }

  /** A soft, roomy reverb tail made from decaying noise. */
  private impulse(seconds: number): AudioBuffer {
    const length = Math.floor(this.ac.sampleRate * seconds);
    const buffer = this.ac.createBuffer(2, length, this.ac.sampleRate);
    for (let c = 0; c < 2; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 2.5;
    }
    return buffer;
  }
}

// ── Public controls ──────────────────────────────────────────

let music: ForestMusic | null = null;
let waitingForTap: (() => void) | null = null;
let pausedByHiding = false;

function onVisibility() {
  const ac = audioContext();
  if (!ac || !music) return;
  if (document.hidden) {
    pausedByHiding = true;
    void ac.suspend();
  } else if (pausedByHiding) {
    pausedByHiding = false;
    void ac.resume();
  }
}

/** Start the music. Browsers only allow sound after a tap, so this waits for one if needed. */
export function startMusic() {
  if (music || waitingForTap) return;
  const begin = () => {
    waitingForTap = null;
    const ac = audioContext();
    if (!ac || music) return;
    music = new ForestMusic(ac, getGrimoire()?.settings.musicVolume ?? 0.5);
    document.addEventListener("visibilitychange", onVisibility);
  };
  const activated = (navigator as Navigator & { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive;
  if (activated) return begin();
  waitingForTap = () => {
    window.removeEventListener("pointerdown", waitingForTap!);
    window.removeEventListener("keydown", waitingForTap!);
    begin();
  };
  window.addEventListener("pointerdown", waitingForTap);
  window.addEventListener("keydown", waitingForTap);
}

export function stopMusic() {
  if (waitingForTap) {
    window.removeEventListener("pointerdown", waitingForTap);
    window.removeEventListener("keydown", waitingForTap);
    waitingForTap = null;
  }
  music?.stop();
  music = null;
  document.removeEventListener("visibilitychange", onVisibility);
}

export function setMusicVolume(volume: number) {
  music?.setVolume(volume);
}
