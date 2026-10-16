"use client";

// Scroll-linked "screen tilting up" section, adapted from Aceternity UI's
// Container Scroll Animation. Adjusted for this portfolio:
// - single dark theme (no light/dark classes)
// - gentler transforms, reduced-motion aware
// - the card content is composed at the section level

import React, { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";

export function ContainerScroll({
  titleComponent,
  children,
}: {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const scaleRange: [number, number] = reducedMotion
    ? [1, 1]
    : isMobile
      ? [0.85, 1]
      : [1.05, 1];

  const rotate = useTransform(scrollYProgress, [0, 1], reducedMotion ? [0, 0] : [16, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], scaleRange);

  return (
    <div
      ref={containerRef}
      className="relative flex min-h-[50rem] items-center justify-center p-2 pt-16 md:min-h-[60rem] md:p-10 md:pt-20"
    >
      {/* overflow-x-clip: the 3D-tilted card's perspective-projected bounds
          exceed the viewport around ~1024px and create page-level horizontal
          scroll (audit-confirmed). Scoped here only - the clipped part was
          already outside the visible area. */}
      <div
        className="relative w-full overflow-x-clip py-4 md:py-8"
        style={{ perspective: "1000px" }}
      >
        <Header titleComponent={titleComponent} />
        <Card rotate={rotate} scale={scale}>
          {children}
        </Card>
      </div>
    </div>
  );
}

function Header({
  titleComponent,
}: {
  titleComponent: string | React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-4xl text-center px-4 mb-6 md:mb-8">
      {titleComponent}
    </div>
  );
}

function Card({
  rotate,
  scale,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: rotate,
        scale,
        boxShadow:
          "0 0 #00000066, 0 9px 24px #00000059, 0 37px 37px #0000004d, 0 84px 50px #0000002e, 0 149px 60px #0000000f",
      }}
      className="mx-auto mt-4 h-[32rem] w-full max-w-5xl rounded-[28px] border border-line bg-surface p-2 shadow-2xl md:mt-6 md:h-[42rem] md:p-4"
    >
      <div className="h-full w-full overflow-hidden rounded-[20px] bg-surface-2 md:p-4">
        {children}
      </div>
    </motion.div>
  );
}
