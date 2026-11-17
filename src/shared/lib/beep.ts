/*
 * "Rest is over" alarm made with Web Audio (no asset to cache).
 *
 * Two rounds of a rising bell arpeggio (C6 E6 G6 → C7), ~2.3 s in total.
 * Each note is a fundamental plus two quiet overtones with a fast attack and a
 * natural decay, so it cuts through gym noise on a phone speaker (which is
 * loudest around 1–3 kHz) without sounding like a harsh beep. A compressor
 * lifts the perceived loudness without clipping. It plays once, never loops.
 *
 * Browsers only allow audio after a user gesture, so call `unlockAudio()` from
 * a tap first. The alarm is scheduled on the audio clock ahead of time
 * (`scheduleAlarm`), because the audio thread keeps running when the page's
 * JS timers are throttled with the screen off.
 */

let ctx: AudioContext | undefined;

export function unlockAudio(): void {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
  } catch {
    /* no Web Audio */
  }
}

const ROUND = [
  { f: 1046.5, at: 0, len: 0.42 },
  { f: 1318.5, at: 0.15, len: 0.42 },
  { f: 1568, at: 0.3, len: 0.42 },
  { f: 2093, at: 0.45, len: 0.85 },
];
const ROUND_GAP = 1.25;
const ROUNDS = 2;
const PARTIALS = [
  { mult: 1, gain: 0.55 },
  { mult: 2, gain: 0.18 },
  { mult: 3, gain: 0.06 },
];

export type AlarmHandle = {
  /** Silences it, whether still pending or already ringing. */
  cancel: () => void;
  /** Plays it now instead if the audio clock was suspended and it never sounded. */
  ensurePlayed: () => void;
};

const NOOP: AlarmHandle = { cancel: () => undefined, ensurePlayed: () => undefined };

/** Schedules the alarm `delaySec` from now on the audio clock. */
export function scheduleAlarm(delaySec: number): AlarmHandle {
  if (!ctx) return NOOP;
  const c = ctx;
  let out: GainNode | undefined;
  let startAt = 0;
  let cancelled = false;

  const play = (delay: number) => {
    out?.disconnect();
    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 8;
    comp.ratio.value = 4;
    comp.attack.value = 0.002;
    comp.release.value = 0.15;
    out = c.createGain();
    out.gain.value = 1;
    out.connect(comp).connect(c.destination);
    startAt = c.currentTime + Math.max(0.02, delay);
    for (let r = 0; r < ROUNDS; r++) {
      for (const n of ROUND) {
        const t = startAt + r * ROUND_GAP + n.at;
        for (const p of PARTIALS) {
          const osc = c.createOscillator();
          const g = c.createGain();
          osc.type = "sine";
          osc.frequency.value = n.f * p.mult;
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(p.gain, t + 0.008);
          // Overtones die faster than the fundamental, like a real bell.
          g.gain.exponentialRampToValueAtTime(0.0001, t + n.len / p.mult ** 0.5);
          osc.connect(g).connect(out);
          osc.start(t);
          osc.stop(t + n.len + 0.05);
        }
      }
    }
  };

  try {
    if (c.state === "suspended") void c.resume();
    play(delaySec);
  } catch {
    return NOOP;
  }

  return {
    cancel() {
      cancelled = true;
      try {
        out?.disconnect();
      } catch {
        /* already gone */
      }
    },
    ensurePlayed() {
      if (cancelled) return;
      // A suspended context freezes its clock, so the alarm is still in the future: play it now.
      if (c.currentTime < startAt - 0.25) {
        try {
          if (c.state === "suspended") void c.resume();
          play(0);
        } catch {
          /* ignore */
        }
      }
    },
  };
}

