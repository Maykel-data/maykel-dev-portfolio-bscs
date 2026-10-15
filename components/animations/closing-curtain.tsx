"use client";

// High-performance 120fps+ top-to-bottom opening curtain.
// Cascades smoothly from top to bottom with GPU hardware acceleration.

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import gsap from "gsap";

const ROWS = 5;
const STAGGER_DELAY = 0.055;
const REVEAL_DURATION = 0.64;
const BLOCK_OFFSET_PERCENT = 101;

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export default function ClosingCurtain({ children }: { children: ReactNode }) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [done, setDone] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (done) return;

    // Respect reduced motion: skip the curtain entirely.
    if (prefersReducedMotion()) {
      setDone(true);
      return;
    }

    const rows = rowRefs.current.filter(Boolean) as HTMLDivElement[];

    // Ensure every block starts fully covering (pre-paint) with GPU acceleration
    rows.forEach((row) => {
      const [left, right] = Array.from(row.children) as HTMLElement[];
      if (!left || !right) return;
      gsap.set([left, right], { xPercent: 0, autoAlpha: 1, force3D: true });
    });

    const timeline = gsap.timeline({
      onComplete: () => setDone(true),
    });

    // Cascade TOP TO BOTTOM: row 0 (top) opens first, cascading down to bottom
    rows.forEach((row, index) => {
      const [left, right] = Array.from(row.children) as HTMLElement[];
      if (!left || !right) return;
      const delay = index * STAGGER_DELAY;

      timeline.to(
        left,
        {
          xPercent: -BLOCK_OFFSET_PERCENT,
          duration: REVEAL_DURATION,
          ease: "power3.out",
          force3D: true,
        },
        delay,
      );
      timeline.set(left, { autoAlpha: 0 }, delay + REVEAL_DURATION);

      timeline.to(
        right,
        {
          xPercent: BLOCK_OFFSET_PERCENT,
          duration: REVEAL_DURATION,
          ease: "power3.out",
          force3D: true,
        },
        delay,
      );
      timeline.set(right, { autoAlpha: 0 }, delay + REVEAL_DURATION);
    });

    return () => {
      timeline.kill();
    };
  }, [done]);

  return (
    <div className="relative h-full w-full">
      {!done && (
        <div
          id="intro-curtain"
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[999] overflow-hidden"
        >
          {Array.from({ length: ROWS }, (_, index) => (
            <div
              key={index}
              ref={(node) => {
                rowRefs.current[index] = node;
              }}
              className="absolute left-0 w-full overflow-hidden border-b border-[rgba(255,180,84,0.06)]"
              style={{
                top: `${(index * 100) / ROWS}%`,
                height: `calc(${100 / ROWS}% + 2px)`,
              }}
            >
              <span className="absolute top-0 left-0 h-full w-[51%] bg-surface-2 will-change-transform [transform:translateZ(0)]" />
              <span className="absolute top-0 right-0 h-full w-[51%] bg-surface-2 will-change-transform [transform:translateZ(0)]" />
            </div>
          ))}
        </div>
      )}
      <div className="relative h-full w-full">{children}</div>
      <noscript>
        {/* Without JS the curtain can never open — hide it. */}
        <style>{`#intro-curtain{display:none !important}`}</style>
      </noscript>
    </div>
  );
}
