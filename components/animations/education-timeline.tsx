"use client";

// Pinned horizontal timeline, adapted from Hyperiux Vault's Timeline
// (https://vault.hyperiux.com) with 3D rolling perspective typography,
// extended pause/buffer at the end, and safe vertical clearance under the navbar.

import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, SplitText);
}

/* Inline stand-in for @gsap/react's useGSAP */
function useGSAP(
  callback: () => void | (() => void),
  options?: {
    dependencies?: unknown[];
    scope?: { current: Element | null } | Element | null;
  },
) {
  const deps = options?.dependencies ?? [];
  const scope = options?.scope;
  const ctxRef = useRef<gsap.Context | null>(null);
  const cleanupRef = useRef<(() => void) | undefined>(undefined);

  useLayoutEffect(() => {
    const el =
      scope && typeof scope === "object" && "current" in scope
        ? scope.current
        : (scope as Element | null);
    ctxRef.current = gsap.context(() => {}, el ?? undefined);
    return () => {
      cleanupRef.current?.();
      cleanupRef.current = undefined;
      ctxRef.current?.revert();
      ctxRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useLayoutEffect(() => {
    if (!ctxRef.current) return;
    cleanupRef.current?.();
    const ret = ctxRef.current.add(callback);
    cleanupRef.current = typeof ret === "function" ? ret : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

export type TimelineItem = {
  id: string;
  /** Shown in mono under the title, e.g. "2023 — Present". */
  period: string;
  title: string;
  detail: string;
};

export type EducationTimelineProps = {
  items: TimelineItem[];
  title?: string;
  periodLabel?: string;
  textColor?: string;
  mutedTextColor?: string;
  activeColor?: string;
  /** Optional visual shown at the start of the track. */
  visual?: ReactNode;
  /** Reveal animation duration, in seconds. */
  duration?: number;
};

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQueryList = window.matchMedia(REDUCED_MOTION_QUERY);
  mediaQueryList.addEventListener("change", callback);
  return () => mediaQueryList.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.(REDUCED_MOTION_QUERY)?.matches ?? false;
}

function getServerReducedMotionSnapshot() {
  return false;
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotionSnapshot,
    getServerReducedMotionSnapshot,
  );
}

/** Milestones alternate between the upper and lower lane. */
function splitLanes(items: TimelineItem[]) {
  const top = items.filter((_, index) => index % 2 === 0);
  const bottom = items.filter((_, index) => index % 2 === 1);
  return { top, bottom };
}

/**
 * Reveal windows along the scrub:
 * Compressed to 0% - 50% of the section's scroll so that from 50% to 100%,
 * the final milestone (Quezon City University) stays completely stationary
 * and pinned in view for comfortable reading before scrolling away.
 */
function revealWindows(count: number): ReadonlyArray<readonly [number, number]> {
  if (count <= 1) return [[10, 45]];
  const seg = 44 / count;
  return Array.from({ length: count }, (_, i) => {
    const start = 4 + i * seg;
    const end = Math.min(52, start + seg + 4);
    return [start, end] as const;
  });
}

export default function EducationTimeline({
  items,
  title = "Education",
  periodLabel = "",
  textColor = "var(--foreground)",
  mutedTextColor = "var(--muted-foreground)",
  activeColor = "var(--brand, #f59e0b)",
  visual,
  duration = 1.0,
}: EducationTimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const normalizedDuration = Math.max(0.2, duration);

  const { top, bottom } = splitLanes(items);
  const topIds = new Set(top.map((item) => item.id));

  const sectionStyle: CSSProperties = { color: textColor, backgroundColor: "transparent" };
  const activeStyle: CSSProperties = { backgroundColor: activeColor };
  const mutedTextStyle: CSSProperties = { color: mutedTextColor };

  // Slide track sideways, completing by ~52% of the scroll track
  // so the remaining 48% acts as a solid PAUSE/HOLD buffer.
  useGSAP(
    () => {
      const section = sectionRef.current;
      const track = wholeSliderRef.current;
      if (!section || !track) return;

      const isMobile = window.innerWidth < 600;
      const lineWidth = isMobile ? "75%" : "100%";
      const slideEnd = isMobile ? "62% bottom" : "52% bottom";

      const distance = () =>
        Math.max(0, track.scrollWidth - window.innerWidth + (isMobile ? 40 : 140));

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: slideEnd,
          scrub: true,
        },
        defaults: { ease: "none" },
      });

      tl.fromTo(track, { x: 0 }, { x: () => -distance() });

      if (reducedMotion) {
        gsap.set(".journey-line", { width: lineWidth });
        return;
      }

      gsap.to(".journey-line", {
        width: lineWidth,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: isMobile ? "top 25%" : "top 20%",
          end: slideEnd,
          scrub: true,
        },
      });
    },
    { dependencies: [reducedMotion, items.length], scope: sectionRef },
  );

  // Reveal milestones in chronological order with 3D rolling typography animation
  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section || items.length === 0) return;

      if (reducedMotion) {
        items.forEach((item) => {
          gsap.set(`.jl-${item.id}`, { scaleY: 1 });
          gsap.set(`.jd-${item.id}`, { scale: 1 });
          gsap.set(`.title-${item.id}`, { opacity: 1, clearProps: "transform" });
          gsap.set(`.description-${item.id}`, { opacity: 1, clearProps: "transform" });
          gsap.set(`.period-${item.id}`, { opacity: 1 });
        });
        return;
      }

      items.forEach((item) => {
        gsap.set(`.jl-${item.id}`, { scaleY: 0, transformOrigin: "bottom bottom" });
        gsap.set(`.jd-${item.id}`, { scale: 0 });
        gsap.set(`.title-${item.id}`, { opacity: 1 });
        gsap.set(`.description-${item.id}`, { opacity: 1 });
        gsap.set(`.period-${item.id}`, { opacity: 0 });
        if (!topIds.has(item.id)) {
          gsap.set(`.jl-${item.id}`, { transformOrigin: "top top" });
        }
      });

      // Split text for 3D rolling kinetic animation on characters
      const titleSplits: InstanceType<typeof SplitText>[] = [];
      const descSplits: InstanceType<typeof SplitText>[] = [];

      items.forEach((item) => {
        titleSplits.push(
          new SplitText(`.title-${item.id}`, { type: "chars, words" }),
        );
        descSplits.push(
          new SplitText(`.description-${item.id}`, { type: "lines, words", mask: "lines" }),
        );
      });

      // Split main title for kinetic roll
      const mainTitleSplit = new SplitText(".main-education-title", { type: "chars" });
      gsap.fromTo(
        mainTitleSplit.chars || [],
        { rotateX: 90, opacity: 0, transformOrigin: "50% 100%" },
        {
          rotateX: 0,
          opacity: 1,
          stagger: 0.04,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
          },
        },
      );

      const windows = revealWindows(items.length);

      items.forEach((item, index) => {
        const [startPos, endPos] = windows[index];
        const chars = titleSplits[index]?.chars || [];
        const lines = descSplits[index]?.lines || [];

        // Set perspective container for 3D character roll
        gsap.set(`.title-${item.id}`, { perspective: 1000, transformStyle: "preserve-3d" });

        const timeline = gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: `${startPos}% 25%`,
            end: `${endPos}% 45%`,
            scrub: true,
          },
        });

        // 1. Connection line and dot reveal
        timeline
          .to(`.jl-${item.id}`, { scaleY: 1, duration: normalizedDuration * 0.4 })
          .to(`.jd-${item.id}`, { scale: 1, duration: normalizedDuration * 0.4 }, "<")
          // 2. 3D Kinetic Roll on characters (TextRoll style)
          .fromTo(
            chars,
            {
              rotateX: 90,
              y: topIds.has(item.id) ? 20 : -20,
              opacity: 0,
              transformOrigin: topIds.has(item.id) ? "50% 100%" : "50% 0%",
            },
            {
              rotateX: 0,
              y: 0,
              opacity: 1,
              stagger: 0.02,
              duration: normalizedDuration * 0.8,
              ease: "power2.out",
            },
            "-=0.2",
          )
          // 3. Period fade in
          .to(`.period-${item.id}`, { opacity: 1, duration: 0.3 }, "<")
          // 4. Description line slide up
          .fromTo(
            lines,
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: normalizedDuration * 0.6, ease: "power2.out" },
            "-=0.3",
          );
      });

      const handleResize = () => ScrollTrigger.refresh();
      window.addEventListener("resize", handleResize);

      return () => {
        titleSplits.forEach((s) => s?.revert?.());
        descSplits.forEach((s) => s?.revert?.());
        mainTitleSplit?.revert?.();
        window.removeEventListener("resize", handleResize);
      };
    },
    { dependencies: [normalizedDuration, reducedMotion, items.length], scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="education"
      // Extended height to provide the requested pause at the end
      className="relative h-[280vh] w-full max-[600px]:h-[360vh]"
      style={sectionStyle}
    >
      {/* Sticky container vertically centered with clean clearance under header */}
      <div className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden pt-16 max-[600px]:pt-10">
        <div
          ref={wholeSliderRef}
          className="mr-[2vw] flex h-[30vw] min-h-[380px] max-h-[72vh] w-max items-center gap-[5vw] px-[5vw] pr-[16vw] max-[600px]:h-[80vh] max-[600px]:px-[7vw]"
        >
          {/* Visual anchor at the start of the track */}
          <div className="h-full w-[30vw] shrink-0 overflow-hidden rounded-[1vw] border border-line bg-surface max-[600px]:h-[65vw] max-[600px]:w-[85vw] max-[600px]:rounded-[5vw]">
            {visual ?? (
              <div
                className="flex h-full w-full flex-col items-center justify-center gap-3"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(234,231,222,0.10) 1px, transparent 1.3px)",
                  backgroundSize: "22px 22px",
                }}
              >
                <span className="font-mono text-[1vw] tracking-[0.18em] text-muted-foreground max-[600px]:text-[3.4vw]">
                  {periodLabel}
                </span>
              </div>
            )}
          </div>

          <div className="relative h-full w-max shrink-0">
            {/* Center rail */}
            <div className="absolute top-1/2 left-0 flex h-fit w-full -translate-y-1/2 items-center">
              <div
                className="h-[0.8vw] w-[0.8vw] rounded-full max-[600px]:h-[2vw] max-[600px]:w-[2vw]"
                style={activeStyle}
              />
              <div className="journey-line h-px w-[0%] rounded-full" style={activeStyle} />
              <div
                className="h-[0.8vw] w-[0.8vw] rounded-full max-[600px]:h-[2vw] max-[600px]:w-[2vw]"
                style={activeStyle}
              />
            </div>

            {/* Upper lane */}
            <div className="flex h-1/2 w-max items-center justify-start gap-[0.5vw]">
              <div className="h-full w-[20vw] shrink-0 pt-[2vw] max-[600px]:h-fit max-[600px]:pt-[5vw]">
                <h2 className="main-education-title w-[65%] text-[3vw] leading-[0.95] max-[600px]:text-[8.5vw] [perspective:1000px] [transform-style:preserve-3d]">
                  {title}
                </h2>
              </div>

              <div className="flex h-full w-max gap-x-[12vw] max-[600px]:gap-x-[36vw]">
                {top.map((item) => (
                  <div
                    key={`top-${item.id}`}
                    className="relative h-full w-[32vw] shrink-0 px-[3vw] max-[600px]:flex max-[600px]:w-[70vw] max-[600px]:flex-col max-[600px]:px-[7vw]"
                  >
                    <div className="absolute top-0 bottom-0 left-0 h-full w-full">
                      <div
                        className={`jd-${item.id} relative size-[1vw] translate-x-[-50%] aspect-square rounded-full max-[600px]:size-[2.5vw]`}
                        style={activeStyle}
                      />
                      <div
                        className={`jl-${item.id} h-[94%] w-px origin-bottom rounded-full`}
                        style={activeStyle}
                      />
                    </div>

                    {/* Original clean layout - NO BOXES */}
                    <div className="space-y-[0.6vw] pb-3">
                      <h3
                        className={`title-${item.id} text-[2vw] leading-[1.05] max-[600px]:text-[5.4vw] inline-block [perspective:1000px] [transform-style:preserve-3d]`}
                      >
                        {item.title}
                      </h3>
                      <p className={`period-${item.id} font-mono text-[0.95vw] text-muted-foreground max-[600px]:text-[3.2vw]`}>
                        {item.period}
                      </p>
                      <p
                        className={`description-${item.id} w-[92%] text-[1.35vw] leading-[1.3] max-[600px]:w-[92%] max-[600px]:text-[4.2vw]`}
                        style={mutedTextStyle}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lower lane */}
            <div className="flex h-1/2 w-max items-center justify-start">
              <div className="h-full w-[30vw] shrink-0 pt-[2vw] max-[600px]:h-fit max-[600px]:w-[30%] max-[600px]:pt-[5vw]">
                <p
                  className="text-[1.65vw] leading-none max-[600px]:text-[4.2vw]"
                  style={mutedTextStyle}
                >
                  {periodLabel}
                </p>
              </div>

              <div className="ml-[4vw] flex h-full w-max gap-x-[16vw] max-[600px]:ml-[7vw] max-[600px]:gap-x-[36vw]">
                {bottom.map((item) => (
                  <div
                    key={`bottom-${item.id}`}
                    className="relative h-full w-[28vw] shrink-0 px-[3vw] max-[600px]:w-[70vw] max-[600px]:px-[7vw]"
                  >
                    <div className="absolute bottom-[-1%] left-0 h-full w-full">
                      <div
                        className={`jl-${item.id} h-[94%] w-px origin-top rounded-full max-[600px]:h-full`}
                        style={activeStyle}
                      />
                      <div
                        className={`jd-${item.id} relative size-[1vw] translate-x-[-50%] aspect-square rounded-full max-[600px]:size-[2.5vw]`}
                        style={activeStyle}
                      />
                    </div>

                    {/* Original clean layout - NO BOXES */}
                    <div className="flex h-full w-full flex-col justify-end space-y-[0.6vw] pt-3">
                      <h3
                        className={`title-${item.id} text-[2vw] leading-[1.05] max-[600px]:text-[5.4vw] inline-block [perspective:1000px] [transform-style:preserve-3d]`}
                      >
                        {item.title}
                      </h3>
                      <p className={`period-${item.id} font-mono text-[0.95vw] text-muted-foreground max-[600px]:text-[3.2vw]`}>
                        {item.period}
                      </p>
                      <p
                        className={`description-${item.id} w-[92%] text-[1.35vw] leading-[1.3] max-[600px]:w-[92%] max-[600px]:text-[4.2vw]`}
                        style={mutedTextStyle}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
