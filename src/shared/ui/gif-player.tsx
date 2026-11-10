"use client";

import { useEffect, useRef, useState } from "react";
import { PauseIcon, PlayIcon } from "@solar-icons/react/bold";
import { decodeGif, type DecodedGif } from "@/shared/lib/gif";
import { cn } from "@/shared/lib/format";

/* Decoded GIFs per URL for this page lifetime (a few hundred KB each, kept small). */
const cache = new Map<string, Promise<DecodedGif>>();
function load(src: string): Promise<DecodedGif> {
  let p = cache.get(src);
  if (!p) {
    p = fetch(src, { mode: "cors" })
      .then((r) => {
        if (!r.ok) throw new Error(`media ${r.status}`);
        return r.arrayBuffer();
      })
      .then(decodeGif);
    p.catch(() => cache.delete(src));
    cache.set(src, p);
    if (cache.size > 24) cache.delete(cache.keys().next().value!);
  }
  return p;
}

type Props = { src: string; alt: string; className?: string; controls?: boolean };

/**
 * Plays an animated GIF on a canvas. Some mobile browsers render GIFs as a
 * single still frame (iOS "Auto-Play Animated Images" off, data savers);
 * decoding and drawing the frames ourselves always animates, and adds pause
 * and slow motion for studying technique. Pauses while off screen. Falls
 * back to a plain <img> if the file cannot be fetched or decoded.
 * Mount with `key={src}` when the source can change.
 */
export function GifPlayer({ src, alt, className, controls = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gif, setGif] = useState<DecodedGif | null>(null);
  const [failed, setFailed] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [slow, setSlow] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let alive = true;
    load(src).then(
      (g) => alive && setGif(g),
      () => alive && setFailed(true),
    );
    return () => {
      alive = false;
    };
  }, [src]);

  // Pause while scrolled away or the tab is hidden: saves battery on a phone.
  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [gif]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!gif || !ctx) return;
    const images = gif.frames.map((f) => new ImageData(f.pixels as Uint8ClampedArray<ArrayBuffer>, gif.width, gif.height));
    let i = 0;
    ctx.putImageData(images[0], 0, 0);
    if (!playing || !visible || images.length < 2) return;
    // Timers follow each frame's own delay exactly; rAF can be throttled (low-power mode).
    const speed = slow ? 2 : 1;
    let timer = setTimeout(function step() {
      i = (i + 1) % images.length;
      if (document.visibilityState === "visible") ctx.putImageData(images[i], 0, 0);
      timer = setTimeout(step, gif.frames[i].delayMs * speed);
    }, gif.frames[0].delayMs * speed);
    return () => clearTimeout(timer);
  }, [gif, playing, visible, slow]);

  if (failed) {
    // eslint-disable-next-line @next/next/no-img-element -- remote dataset media, cached by the SW
    return <img src={src} alt={alt} crossOrigin="anonymous" className={cn("object-contain", className)} />;
  }

  return (
    <div className={cn("relative", className)}>
      <canvas
        ref={canvasRef}
        width={gif?.width ?? 180}
        height={gif?.height ?? 180}
        role="img"
        aria-label={alt}
        className={cn("size-full object-contain transition-opacity duration-300", gif ? "opacity-100" : "opacity-0")}
      />
      {!gif && (
        <div className="absolute inset-0 grid place-items-center" role="status" aria-label="در حال بارگذاری انیمیشن">
          <span className="size-6 animate-spin rounded-full border-2 border-black/10 border-t-black/40" />
        </div>
      )}
      {controls && gif && gif.frames.length > 1 && (
        <div className="absolute bottom-2 inset-s-2 flex gap-1.5">
          <button
            type="button"
            onClick={() => setPlaying((v) => !v)}
            aria-label={playing ? "توقف" : "پخش"}
            className="grid h-8 min-w-8 place-items-center rounded-full bg-black/60 px-2 text-sm text-white backdrop-blur transition active:scale-95"
          >
            {playing ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
          </button>
          <button
            type="button"
            onClick={() => setSlow((v) => !v)}
            aria-pressed={slow}
            aria-label="حرکت آهسته"
            className={cn(
              "h-8 rounded-full px-2.5 text-xs font-medium backdrop-blur transition active:scale-95",
              slow ? "bg-accent text-accent-foreground" : "bg-black/60 text-white",
            )}
          >
            <bdi>0.5×</bdi>
          </button>
        </div>
      )}
    </div>
  );
}
