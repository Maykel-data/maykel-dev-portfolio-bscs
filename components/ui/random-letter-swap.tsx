"use client";

import { useEffect, useRef, type CSSProperties } from "react";

import { cn } from "@/lib/utils";

const GLYPHS = "!<>-_\\/[]{}=+*^?#";

interface RandomLetterSwapProps {
  /** Plain text label; always the final settled output. */
  label: string;
  className?: string;
  style?: CSSProperties;
  /** Milliseconds each character takes to resolve in the settle sweep. */
  speed?: number;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

/**
 * Navigation-label typography effect: on hover / keyboard focus the label's
 * characters cycle through random glyphs and resolve left-to-right into the
 * final text. Each character sits in a fixed-width slot reserved by its final
 * glyph, so the swap never shifts the surrounding layout. Screen readers only
 * ever see the stable label.
 */
function RandomLetterSwap({
  label,
  className,
  style,
  speed = 22,
}: RandomLetterSwapProps) {
  const hostRef = useRef<HTMLSpanElement | null>(null);
  const liveSlots = useRef<(HTMLSpanElement | null)[]>([]);
  const rafRef = useRef(0);

  useEffect(() => {
    const chars = Array.from(label);
    const slots = liveSlots.current;

    const settleAll = () => {
      slots.forEach((node, i) => {
        if (node) node.textContent = chars[i] ?? "";
      });
    };

    const scramble = () => {
      cancelAnimationFrame(rafRef.current);
      if (chars.length === 0) return;
      if (prefersReducedMotion()) return settleAll();

      const total = chars.length * speed;
      const noiseLen = GLYPHS.length;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const head = Math.floor(elapsed / speed);
        for (let i = 0; i < chars.length; i++) {
          const node = slots[i];
          if (!node) continue;
          const glyph = chars[i];
          if (/\s/.test(glyph) || i < head) {
            node.textContent = glyph;
          } else {
            node.textContent = GLYPHS[(Math.random() * noiseLen) | 0];
          }
        }
        if (elapsed < total) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    // Bind to the interactive ancestor (link/button) so the whole hit area
    // triggers the effect, not just the text itself.
    const host = hostRef.current?.closest("a,button") ?? hostRef.current;
    if (!(host instanceof HTMLElement)) return;

    const onFocus = (event: FocusEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.matches(":focus-visible")) {
        scramble();
      }
    };

    host.addEventListener("pointerenter", scramble);
    host.addEventListener("focusin", onFocus);
    return () => {
      cancelAnimationFrame(rafRef.current);
      host.removeEventListener("pointerenter", scramble);
      host.removeEventListener("focusin", onFocus);
    };
  }, [label, speed]);

  return (
    <span
      ref={hostRef}
      data-slot="random-letter-swap"
      className={cn("inline-block whitespace-pre", className)}
      style={style}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true">
        {Array.from(label).map((char, i) => (
          <span key={i} className="relative inline-block">
            <span className="invisible">{char === " " ? "\u00A0" : char}</span>
            <span
              ref={(node) => {
                liveSlots.current[i] = node;
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              {char}
            </span>
          </span>
        ))}
      </span>
    </span>
  );
}

export { RandomLetterSwap, type RandomLetterSwapProps };
