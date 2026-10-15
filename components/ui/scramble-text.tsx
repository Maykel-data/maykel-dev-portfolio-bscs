"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type ComponentProps,
  type Ref,
} from "react";

import {
  useEntrance,
  type EntranceTrigger,
} from "@/components/ui/scramble-text-utils/use-entrance";
import { cn } from "@/lib/utils";

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]) {
  return (node: T | null) => {
    for (const ref of refs) {
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    }
  };
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true
  );
}

const DEFAULT_CHARS = "01<>[]{}/\\|=~^#*+-";

interface ScrambleTextProps extends Omit<ComponentProps<"span">, "children"> {
  /** Plain text. */
  children: string;
  /** Milliseconds per character sweep. Lower = faster & smoother. Default: 16. */
  speed?: number;
  /** Wait before it starts, in ms. */
  delay?: number;
  /** The noise it cycles through before the text settles. */
  characters?: string;
  /** "load" starts as soon as the page runs; "in-view" when the text scrolls into view. */
  trigger?: EntranceTrigger;
  /** In-view: play the first time only. */
  once?: boolean;
  /** Takes over from `trigger`: `false` holds it blank, `true` runs it. */
  play?: boolean;
}

/**
 * Ultra-smooth 60fps+ terminal text decoder.
 * Uses a high-framerate progressive sweep window so characters resolve cleanly from left to right
 * without jarring whole-paragraph jitter or 22fps frame throttling.
 */
function ScrambleText({
  children: text,
  speed = 16,
  delay = 0,
  characters = DEFAULT_CHARS,
  trigger = "load",
  once = true,
  play,
  className,
  ref,
  ...props
}: ScrambleTextProps) {
  const [observe, phase] = useEntrance<HTMLSpanElement>({
    trigger,
    once,
    play,
  });
  const mergedRef = useMemo(() => mergeRefs(ref, observe), [ref, observe]);
  const output = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = output.current;
    if (!node) return;

    const write = (value: string) => {
      const child = node.firstChild;
      if (child?.nodeType === Node.TEXT_NODE) child.nodeValue = value;
      else node.textContent = value;
      node.style.visibility = "visible";
    };

    const settle = () => write(text);
    if (phase === "static" || prefersReducedMotion()) return settle();
    if (phase === "armed") return write("");

    const glyphs = Array.from(text);
    const totalLength = glyphs.length;
    if (totalLength === 0) return settle();

    const charSpeed = Math.max(speed, 6);
    const totalDuration = totalLength * charSpeed;
    const noise = characters || DEFAULT_CHARS;
    const noiseLen = noise.length;

    let animId = 0;
    const startTime = performance.now() + delay;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      if (elapsed < 0) {
        animId = requestAnimationFrame(tick);
        return;
      }

      if (elapsed >= totalDuration) {
        settle();
        return;
      }

      // Smooth progress from 0 to totalLength
      const progress = elapsed / totalDuration;
      const head = Math.floor(progress * totalLength);

      // Construct frame:
      // - 0 to head: locked final character
      // - head to head + 3: active scrambling cipher glyphs at full 60fps
      // - head + 3 to end: calm waiting glyphs
      const frameChars = new Array(totalLength);
      for (let i = 0; i < totalLength; i++) {
        const glyph = glyphs[i];
        if (/\s/.test(glyph)) {
          frameChars[i] = glyph;
        } else if (i < head) {
          frameChars[i] = glyph;
        } else if (i <= head + 3) {
          frameChars[i] = noise[Math.floor(Math.random() * noiseLen)];
        } else {
          frameChars[i] = noise[(i + Math.floor(now / 90)) % noiseLen];
        }
      }

      write(frameChars.join(""));
      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [phase, text, speed, delay, characters]);

  return (
    <span
      ref={mergedRef}
      data-slot="scramble-text"
      data-state={phase}
      className={cn("inline-block whitespace-pre-wrap", className)}
      {...props}
    >
      <span className="sr-only">{text}</span>
      <span
        ref={output}
        aria-hidden="true"
        data-slot="scramble-text-output"
        className={cn(
          phase === "play" && "[@media(scripting:enabled)]:invisible",
        )}
      >
        {text}
      </span>
    </span>
  );
}

export { ScrambleText, type ScrambleTextProps };
export default ScrambleText;
