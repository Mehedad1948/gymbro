/** Seconds per rep phase, from a tempo string like "3-1-1" or "3-1-1-0". */
export type Tempo = {
  /** Lowering / lengthening phase. */
  eccentric: number;
  /** Pause in the stretched (bottom) position. */
  pause: number;
  /** Lifting / shortening phase. */
  concentric: number;
  /** Pause at the top; only in 4-digit tempos. */
  top?: number;
};

export function parseTempo(tempo: string): Tempo | undefined {
  const m = /^(\d)-(\d)-(\d)(?:-(\d))?$/.exec(tempo);
  if (!m) return undefined;
  const [eccentric, pause, concentric] = [m[1], m[2], m[3]].map(Number);
  return m[4] === undefined ? { eccentric, pause, concentric } : { eccentric, pause, concentric, top: Number(m[4]) };
}

