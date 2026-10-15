"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { motion, useSpring, useTransform, type SpringOptions } from "framer-motion";
import { cn } from "@/lib/utils";

type SpotlightProps = {
  className?: string;
  size?: number;
  springOptions?: SpringOptions;
};

/**
  * Global spotlight that tracks mouse position everywhere across the whole viewport/system.
  * Never gets clipped by section boundaries, never vanishes on scroll, and leaves no horizontal seams.
  */
export function GlobalSpotlight({
  className,
  size = 540,
  springOptions = { bounce: 0, damping: 28, stiffness: 220 },
}: SpotlightProps) {
  const [isVisible, setIsVisible] = useState(false);
  const mouseX = useSpring(-1000, springOptions);
  const mouseY = useSpring(-1000, springOptions);

  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`);
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    window.addEventListener("mousemove", onMouseMove, { passive: true });
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("mouseenter", onMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-10 overflow-hidden"
    >
      <motion.div
        className={cn(
          "pointer-events-none fixed rounded-full blur-2xl transition-opacity duration-300",
          "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.22),rgba(255,180,84,0.06)_40%,rgba(255,255,255,0)_70%)]",
          isVisible ? "opacity-100" : "opacity-0",
          className,
        )}
        style={{
          width: size,
          height: size,
          left: spotlightLeft,
          top: spotlightTop,
        }}
      />
    </div>
  );
}

/**
 * A soft white glow that follows the pointer within its parent element.
 */
export function Spotlight({
  className,
  size = 200,
  springOptions = { bounce: 0 },
}: SpotlightProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [parentElement, setParentElement] = useState<HTMLElement | null>(null);

  const mouseX = useSpring(0, springOptions);
  const mouseY = useSpring(0, springOptions);

  const spotlightLeft = useTransform(mouseX, (x) => `${x - size / 2}px`);
  const spotlightTop = useTransform(mouseY, (y) => `${y - size / 2}px`);

  useEffect(() => {
    if (containerRef.current) {
      const parent = containerRef.current.parentElement;
      if (parent) {
        parent.style.position = "relative";
        parent.style.overflow = "hidden";
        setParentElement(parent);
      }
    }
  }, []);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!parentElement) return;
      const { left, top } = parentElement.getBoundingClientRect();
      mouseX.set(event.clientX - left);
      mouseY.set(event.clientY - top);
    },
    [mouseX, mouseY, parentElement],
  );

  useEffect(() => {
    if (!parentElement) return;

    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);

    parentElement.addEventListener("mousemove", handleMouseMove);
    parentElement.addEventListener("mouseenter", onEnter);
    parentElement.addEventListener("mouseleave", onLeave);

    return () => {
      parentElement.removeEventListener("mousemove", handleMouseMove);
      parentElement.removeEventListener("mouseenter", onEnter);
      parentElement.removeEventListener("mouseleave", onLeave);
    };
  }, [parentElement, handleMouseMove]);

  return (
    <motion.div
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute rounded-full blur-xl transition-opacity duration-200",
        "bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.55),rgba(255,255,255,0)_70%)]",
        isHovered ? "opacity-100" : "opacity-0",
        className,
      )}
      style={{
        width: size,
        height: size,
        left: spotlightLeft,
        top: spotlightTop,
      }}
    />
  );
}

