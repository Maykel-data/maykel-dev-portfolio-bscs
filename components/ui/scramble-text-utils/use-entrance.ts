"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type EntranceTrigger = "load" | "in-view";
export type EntrancePhase = "armed" | "play" | "static";

export interface UseEntranceOptions {
  trigger?: EntranceTrigger;
  once?: boolean;
  play?: boolean;
}

/**
 * Hook to manage entrance animation lifecycle cleanly in React 19.
 * Computes phase directly from state and inputs without cascading renders.
 */
export function useEntrance<T extends HTMLElement = HTMLElement>({
  trigger = "load",
  once = true,
  play,
}: UseEntranceOptions = {}): [(node: T | null) => void, EntrancePhase] {
  const [inView, setInView] = useState(false);
  const nodeRef = useRef<T | null>(null);

  const refCallback = useCallback((node: T | null) => {
    nodeRef.current = node;
  }, []);

  useEffect(() => {
    if (trigger !== "in-view" || play !== undefined) return;

    const element = nodeRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) {
              observer.disconnect();
            }
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [trigger, once, play]);

  let phase: EntrancePhase = "play";
  if (play !== undefined) {
    phase = play ? "play" : "armed";
  } else if (trigger === "in-view") {
    phase = inView ? "play" : "armed";
  } else {
    phase = "play";
  }

  return [refCallback, phase];
}
