"use client";

// Built using Hyperiux Vault: https://vault.hyperiux.com
// Optimized for Maykel's portfolio:
// 1. Guaranteed QCU visibility across mobile and desktop via percentage-based travel.
// 2. Direct 1:1 scrub (scrub: true) + linear easing for zero-lag rapid reverse scrolling.
// 3. Robust clamp height ensuring sticky pinning never unpins early.

import {
  type CSSProperties,
  type ReactNode,
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
  (window as unknown as { ScrollTrigger: typeof ScrollTrigger; gsap: typeof gsap }).ScrollTrigger =
    ScrollTrigger;
  (window as unknown as { ScrollTrigger: typeof ScrollTrigger; gsap: typeof gsap }).gsap = gsap;
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

export default function EducationTimeline({
  items,
  title = "Education",
  periodLabel = "2017 — Present",
  textColor = "var(--foreground, #ffffff)",
  mutedTextColor = "var(--muted-foreground, #a1a1aa)",
  activeColor = "#ff5f00",
  visual,
}: EducationTimelineProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const wholeSliderRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const { top, bottom } = splitLanes(items);

  const sectionStyle: CSSProperties = {
    color: textColor,
    backgroundColor: "transparent",
  };
  const activeStyle: CSSProperties = {
    backgroundColor: activeColor,
  };
  const mutedTextStyle: CSSProperties = {
    color: mutedTextColor,
  };

  useGSAP(
    () => {
      const section = sectionRef.current;
      const slider = wholeSliderRef.current;
      if (!section || !slider) return;

      // Compute exact horizontal travel so QCU is centered in the viewport
      const getSlideDistance = () => {
        if (!slider) return 0;
        const qcu = slider.querySelector<HTMLElement>(".milestone-qcu");
        if (!qcu) {
          return Math.max(0, slider.scrollWidth - window.innerWidth + 80);
        }
        const currentX = (gsap.getProperty(slider, "x") as number) || 0;
        const sliderLeft = slider.getBoundingClientRect().left - currentX;
        const qcuLeft = qcu.getBoundingClientRect().left - currentX;
        const qcuCenter = qcuLeft - sliderLeft + qcu.offsetWidth / 2;
        const viewportCenter = window.innerWidth / 2;
        return Math.max(0, qcuCenter - viewportCenter);
      };

      if (reducedMotion) {
        gsap.set(slider, { x: 0 });
        gsap.set(".journey-line", { scaleX: 1 });
        items.forEach((item) => {
          gsap.set(`.jl-${item.id}`, { scaleY: 1 });
          gsap.set(`.jd-${item.id}`, { scale: 1 });
          gsap.set(`.content-${item.id}`, { opacity: 1, y: 0 });
        });
        return;
      }

      // Initial state: hide connector lines, dots, and content with GPU acceleration
      items.forEach((item, index) => {
        const isTop = index % 2 === 0;
        gsap.set(`.jl-${item.id}`, {
          scaleY: 0,
          transformOrigin: isTop ? "bottom center" : "top center",
          force3D: true,
        });
        gsap.set(`.jd-${item.id}`, { scale: 0, force3D: true });
        gsap.set(`.content-${item.id}`, { opacity: 0, y: 14, force3D: true });
      });
      gsap.set(".journey-line", {
        scaleX: 0,
        transformOrigin: "left center",
        force3D: true,
      });
      gsap.set(slider, { x: 0, force3D: true });

      // Master Timeline: 1:1 scrub with linear easing ensures instant, zero-lag reverse scroll
      const masterTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
        defaults: {
          ease: "none",
        },
      });

      // 1. Horizontal track travel: completes by progress 0.64 so QCU sits centered
      // during the generous 36% scroll buffer before unpinning.
      masterTl.fromTo(
        slider,
        { x: 0 },
        {
          x: () => -getSlideDistance(),
          duration: 0.64,
          ease: "none",
          force3D: true,
        },
        0,
      );

      // 2. Central timeline progress line: scaleX uses GPU transform (no layout reflow)
      masterTl.fromTo(
        ".journey-line",
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.64,
          ease: "none",
          force3D: true,
        },
        0,
      );

      // 3. Staggered milestone reveals along the timeline
      // Belmonte: 0.06, Fatima: 0.28, QCU: 0.50 (fully revealed by 0.58)
      const revealPoints = [0.06, 0.28, 0.50];

      items.forEach((item, index) => {
        const atTime = revealPoints[index] ?? 0.08 + index * 0.22;
        const lineSelector = `.jl-${item.id}`;
        const dotSelector = `.jd-${item.id}`;
        const contentSelector = `.content-${item.id}`;

        masterTl
          .to(
            lineSelector,
            {
              scaleY: 1,
              duration: 0.07,
              ease: "none",
              force3D: true,
            },
            atTime,
          )
          .to(
            dotSelector,
            {
              scale: 1,
              duration: 0.07,
              ease: "none",
              force3D: true,
            },
            atTime,
          )
          .to(
            contentSelector,
            {
              opacity: 1,
              y: 0,
              duration: 0.08,
              ease: "none",
              force3D: true,
            },
            atTime + 0.01,
          );
      });

      // 4. Dedicated reading buffer / stationary hold:
      // Holds the timeline at totalDuration = 1.0, so the remaining 36% of the scroll track
      // keeps QCU proudly stationary in the center before unpinning.
      masterTl.to({}, { duration: 0.36 });

      const handleResize = () => {
        ScrollTrigger.refresh();
      };
      window.addEventListener("resize", handleResize);

      // Refresh ScrollTrigger after initial mount and when preceding dynamic sections settle
      const t1 = setTimeout(() => ScrollTrigger.refresh(), 200);
      const t2 = setTimeout(() => ScrollTrigger.refresh(), 800);
      const t3 = setTimeout(() => ScrollTrigger.refresh(), 2000);

      return () => {
        window.removeEventListener("resize", handleResize);
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    },
    { dependencies: [reducedMotion, items.length], scope: sectionRef },
  );

  return (
    <section
      ref={sectionRef}
      id="education"
      className="relative w-full"
      style={{
        ...sectionStyle,
        height: "clamp(2600px, 340vh, 3800px)",
      }}
    >
      <div className="sticky top-0 flex h-screen w-full flex-col justify-center overflow-hidden pt-16">
        <div
          ref={wholeSliderRef}
          className="flex h-[32vw] min-h-[380px] max-h-[75vh] w-max items-center gap-[4vw] px-[5vw] pr-[20vw] max-[768px]:h-[80vh] max-[768px]:gap-[5vw] max-[768px]:px-[6vw] max-[768px]:pr-[24vw] will-change-transform"
        >
          {/* Visual card */}
          <div className="h-full w-[26vw] min-w-[240px] max-w-[340px] shrink-0 overflow-hidden rounded-[1.2vw] border border-line/60 bg-surface/70 backdrop-blur-md max-[768px]:h-[42vw] max-[768px]:w-[68vw] max-[768px]:rounded-2xl">
            {visual ?? (
              <div
                className="relative flex h-full w-full flex-col justify-between p-6 max-[768px]:p-5"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(234,231,222,0.08) 1px, transparent 1.2px)",
                  backgroundSize: "20px 20px",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-mono text-[0.85vw] tracking-wider text-muted-foreground uppercase max-[768px]:text-[3vw]">
                    <span className="inline-block size-2 rounded-full bg-amber-500 animate-pulse" />
                    Milestones
                  </span>
                  <span className="rounded-full border border-line bg-surface/80 px-2.5 py-0.5 font-mono text-[0.75vw] text-foreground/80 max-[768px]:text-[2.8vw]">
                    QCU
                  </span>
                </div>

                <div className="space-y-1">
                  <p className="font-mono text-[0.85vw] text-amber-400 max-[768px]:text-[3vw]">
                    {periodLabel}
                  </p>
                  <p className="font-sans text-[1.25vw] font-semibold leading-tight text-foreground max-[768px]:text-[4.2vw]">
                    Academic Journey
                  </p>
                  <p className="font-sans text-[0.85vw] text-muted-foreground max-[768px]:text-[3vw]">
                    BS Computer Science
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Timeline Track */}
          <div className="relative h-full w-max">
            {/* Center rail */}
            <div className="absolute top-1/2 left-0 flex h-fit w-full -translate-y-1/2 items-center pointer-events-none">
              <div
                className="h-[0.8vw] w-[0.8vw] rounded-full max-[768px]:h-[2vw] max-[768px]:w-[2vw] shrink-0"
                style={activeStyle}
              />
              <div
                className="journey-line h-px w-full origin-left rounded-full will-change-transform"
                style={activeStyle}
              />
              <div
                className="h-[0.8vw] w-[0.8vw] rounded-full max-[768px]:h-[2vw] max-[768px]:w-[2vw] shrink-0"
                style={activeStyle}
              />
            </div>

            {/* Upper Lane */}
            <div className="flex h-1/2 w-max items-center justify-start gap-[1vw] max-[768px]:gap-[2vw]">
              <div className="flex h-full min-w-max items-center pt-[2vw] pr-[2.5vw] max-[768px]:h-fit max-[768px]:pt-[4vw] max-[768px]:pr-[4vw]">
                <h2 className="main-education-title whitespace-nowrap font-sans text-[3.2vw] font-bold tracking-tight text-foreground max-[768px]:text-[8vw]">
                  {title}
                </h2>
              </div>

              {/* Upper Milestones (Belmonte & QCU) */}
              <div className="flex h-full w-max gap-x-[16vw] max-[768px]:gap-x-[24vw]">
                {top.map((item) => (
                  <div
                    key={`top-${item.id}`}
                    className={`milestone-${item.id} relative flex h-full w-[30vw] min-w-[280px] max-w-[420px] shrink-0 flex-col justify-end pb-[2vw] px-[2vw] max-[768px]:w-[74vw] max-[768px]:min-w-[240px] max-[768px]:max-w-[340px] max-[768px]:pb-[4vw] max-[768px]:pl-[4vw] max-[768px]:pr-[2vw] will-change-transform`}
                  >
                    <div className="absolute top-0 bottom-0 left-0 h-full w-full pointer-events-none">
                      <div
                        className={`jd-${item.id} relative size-[0.9vw] -translate-x-1/2 aspect-square rounded-full max-[768px]:size-[2.4vw]`}
                        style={activeStyle}
                      />
                      <div
                        className={`jl-${item.id} h-[94%] w-px origin-bottom rounded-full`}
                        style={activeStyle}
                      />
                    </div>

                    <div className={`content-${item.id} space-y-[0.6vw] pl-[1.5vw] max-[768px]:space-y-[1.5vw] max-[768px]:pl-[3.5vw]`}>
                      <h3 className="font-sans text-[1.8vw] font-semibold leading-[1.15] text-foreground max-[768px]:text-[4.8vw]">
                        {item.title}
                      </h3>
                      <p className="font-mono text-[0.9vw] text-amber-400/90 max-[768px]:text-[3.2vw]">
                        {item.period}
                      </p>
                      <p
                        className="w-[92%] text-[1.2vw] leading-[1.35] text-muted-foreground max-[768px]:w-[95%] max-[768px]:text-[3.8vw] max-[768px]:leading-[1.4]"
                        style={mutedTextStyle}
                      >
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lower Lane */}
            <div className="flex h-1/2 w-max items-center justify-start">
              <div className="flex h-full min-w-max items-center pt-[2vw] pr-[2.5vw] max-[768px]:h-fit max-[768px]:pt-[4vw] max-[768px]:pr-[4vw]">
                <p
                  className="whitespace-nowrap font-mono text-[1.4vw] tracking-wider text-muted-foreground max-[768px]:text-[3.8vw]"
                  style={mutedTextStyle}
                >
                  {periodLabel}
                </p>
              </div>

              {/* Lower Milestones (Fatima) - positioned halfway between Belmonte and QCU */}
              <div className="ml-[14vw] flex h-full w-max gap-x-[16vw] max-[768px]:ml-[49vw] max-[768px]:gap-x-[24vw]">
                {bottom.map((item) => (
                  <div
                    key={`bottom-${item.id}`}
                    className={`milestone-${item.id} relative flex h-full w-[28vw] min-w-[280px] max-w-[420px] shrink-0 flex-col justify-start pt-[2vw] px-[2vw] max-[768px]:w-[74vw] max-[768px]:min-w-[240px] max-[768px]:max-w-[340px] max-[768px]:pt-[4vw] max-[768px]:pl-[4vw] max-[768px]:pr-[2vw] will-change-transform`}
                  >
                    <div className="absolute bottom-[-1%] left-0 h-full w-full pointer-events-none">
                      <div
                        className={`jl-${item.id} h-[94%] w-px origin-top rounded-full max-[768px]:h-full`}
                        style={activeStyle}
                      />
                      <div
                        className={`jd-${item.id} relative size-[0.9vw] -translate-x-1/2 aspect-square rounded-full max-[768px]:size-[2.4vw]`}
                        style={activeStyle}
                      />
                    </div>

                    <div className={`content-${item.id} flex h-full w-full flex-col justify-end space-y-[0.6vw] pl-[1.5vw] max-[768px]:space-y-[1.5vw] max-[768px]:pl-[3.5vw]`}>
                      <h3 className="font-sans text-[1.8vw] font-semibold leading-[1.15] text-foreground max-[768px]:text-[4.8vw]">
                        {item.title}
                      </h3>
                      <p className="font-mono text-[0.9vw] text-amber-400/90 max-[768px]:text-[3.2vw]">
                        {item.period}
                      </p>
                      <p
                        className="w-[92%] text-[1.2vw] leading-[1.35] text-muted-foreground max-[768px]:w-[95%] max-[768px]:text-[3.8vw] max-[768px]:leading-[1.4]"
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

