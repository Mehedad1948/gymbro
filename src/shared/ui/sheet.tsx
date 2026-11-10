"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/format";

const DURATION = 340;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Props = {
  open: boolean;
  onClose: () => void;
  /** id of the element that names the sheet (its title). */
  labelledBy: string;
  children: ReactNode;
  /** Sticky action row at the bottom. */
  footer?: ReactNode;
};

/**
 * Bottom sheet: slides up over a dimmed backdrop, closes on backdrop tap,
 * Escape or a downward swipe on the grab handle. Locks page scroll while open.
 */
export function Sheet({ open, onClose, labelledBy, children, footer }: Props) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; pointer: number } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Mount immediately on open; unmount after the exit transition.
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (open) {
      // Two frames so the closed styles paint before transitioning to open.
      let inner = 0;
      const outer = requestAnimationFrame(() => {
        inner = requestAnimationFrame(() => setEntered(true));
      });
      return () => {
        cancelAnimationFrame(outer);
        cancelAnimationFrame(inner);
      };
    }
    const t = setTimeout(() => {
      setMounted(false);
      setEntered(false);
      setDragY(0);
    }, DURATION);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    panelRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!mounted) return null;
  const shown = open && entered;

  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] transition-opacity motion-reduce:transition-none"
        style={{ opacity: shown ? 1 : 0, transitionDuration: `${DURATION}ms` }}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[92dvh] max-w-lg flex-col rounded-t-3xl border-t border-border bg-surface shadow-2xl outline-none motion-reduce:transition-none"
        style={{
          transform: shown ? `translateY(${dragY}px)` : "translateY(100%)",
          transition: dragging ? "none" : `transform ${DURATION}ms ${EASE}`,
        }}
      >
        <div
          className="flex shrink-0 cursor-grab touch-none justify-center pb-1 pt-3 active:cursor-grabbing"
          onPointerDown={(e) => {
            drag.current = { startY: e.clientY, pointer: e.pointerId };
            setDragging(true);
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (drag.current?.pointer !== e.pointerId) return;
            setDragY(Math.max(0, e.clientY - drag.current.startY));
          }}
          onPointerUp={(e) => {
            if (drag.current?.pointer !== e.pointerId) return;
            drag.current = null;
            setDragging(false);
            if (dragY > 90) onClose();
            else setDragY(0);
          }}
          onPointerCancel={() => {
            drag.current = null;
            setDragging(false);
            setDragY(0);
          }}
        >
          <span className="h-1.5 w-10 rounded-full bg-muted/40" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4">{children}</div>
        {footer && (
          <div
            className={cn("shrink-0 border-t border-border bg-surface px-4 pt-3")}
            style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
