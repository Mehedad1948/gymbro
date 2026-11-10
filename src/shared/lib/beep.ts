/*
 * Short, clear "time's up" chime made with Web Audio (no asset to cache).
 * Three soft-edged sine tones, ~0.7 s in total: loud enough over gym music,
 * gentle envelope so it is not harsh. Browsers only allow audio after a user
 * gesture, so call `unlockAudio()` from a tap before `chime()` is needed.
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

export function chime(): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.02;
  const notes = [
    { f: 880, at: 0 },
    { f: 880, at: 0.22 },
    { f: 1175, at: 0.44 },
  ];
  for (const { f, at } of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = f;
    const start = t0 + at;
    const len = at === 0.44 ? 0.3 : 0.16;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.7, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, start + len);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + len + 0.02);
  }
}
