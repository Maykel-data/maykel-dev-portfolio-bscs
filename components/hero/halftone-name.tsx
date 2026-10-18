"use client";

// Halftone Name — an interactive typographic headline engine tailored for
// names and hero titles. Renders multi-line text as a pure field of halftone
// dots with spring physics, mouse displacement, amber warming, shockwave ripple,
// and 100% transparent floating background (no box, no border, no grain rectangle).
//
// Based on the Halftone Wordmark engine (21st.dev), adapted specifically
// for high-impact editorial hero headlines.

import * as React from "react";

export interface HalftoneNameProps {
  /** Array of lines to render, or a newline-separated string. */
  lines?: string[];
  /** Optional accessible label for screen readers. Defaults to joined lines. */
  srLabel?: string;
  /** Canvas background. Defaults to "transparent" (completely borderless and floating). */
  background?: string;
  /** Dot color at rest. Defaults to warm ivory (#eae7de). */
  ink?: string;
  /** The color a dot warms toward when displaced. Defaults to amber (#ffb454). */
  warm?: string;
  /** Distance between dot centres in CSS px. Defaults to 3.8. */
  dotGap?: number;
  /** How far the pointer pushes dots in CSS px. Defaults to 80. */
  radius?: number;
  /** Maximum font size in px on desktop. Defaults to 84. */
  maxFontSize?: number;
  /** Pointer and click response. Defaults to true. */
  interactive?: boolean;
  /** Font family override. Defaults to theme sans-serif. */
  fontFamily?: string;
  /** Font weight for the name. Defaults to 700. */
  fontWeight?: number;
  /** Alignment of lines on the canvas: 'left' | 'center'. Defaults to 'left'. */
  align?: "left" | "center";
  /** Optional extra class names. */
  className?: string;
}

/** Hex → [r, g, b] in 0–255. */
function parseHex(hex: string): [number, number, number] | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim());
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Dot radius for a cell coverage in [0, 1]. Area-true so tone stays even. */
function dotRadius(coverage: number, gap: number): number {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage;
  return Math.sqrt(c) * gap * 0.58;
}

/** Spring physics step for a displaced dot. */
function springStep(
  x: number,
  y: number,
  vx: number,
  vy: number,
  hx: number,
  hy: number,
  px: number,
  py: number,
  r: number
): [number, number, number, number] {
  const dx = x - px;
  const dy = y - py;
  const d2 = dx * dx + dy * dy;
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001;
    const f = (1 - d / r) * 2.8;
    vx += (dx / d) * f;
    vy += (dy / d) * f;
  }
  vx = (vx + (hx - x) * 0.06) * 0.82;
  vy = (vy + (hy - y) * 0.06) * 0.82;
  return [x + vx, y + vy, vx, vy];
}

/** Color warmth factor: 0 at home, 1 when displaced by `span` px or more. */
function warmthFactor(
  x: number,
  y: number,
  hx: number,
  hy: number,
  span: number
): number {
  const d = Math.hypot(x - hx, y - hy);
  return span > 0 ? Math.min(1, d / span) : 0;
}

const HN_CSS = `
.hn-root {
  position: relative;
  width: 100%;
  overflow: visible;
  isolation: isolate;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  -webkit-font-smoothing: antialiased;
  cursor: default;
  user-select: none;
}
.hn-root canvas {
  position: absolute;
  display: block;
  max-width: none;
  background: transparent !important;
  pointer-events: none;
}
.hn-sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
`;

export default function HalftoneName({
  lines = ["Michael Jhosh T.", "Abundabar"],
  srLabel,
  background = "transparent",
  ink = "#eae7de",
  warm = "#ffb454",
  dotGap = 3.8,
  radius = 80,
  maxFontSize = 84,
  interactive = true,
  fontFamily,
  fontWeight = 700,
  align = "left",
  className = "",
}: HalftoneNameProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const linesKey = lines.join("::");
  const accessibleText = srLabel ?? lines.join(" ");

  const opts = React.useRef({
    lines,
    background,
    ink,
    warm,
    dotGap,
    radius,
    maxFontSize,
    interactive,
    fontFamily,
    fontWeight,
    align,
  });

  const key = [
    linesKey,
    dotGap,
    maxFontSize,
    fontWeight,
    background,
    ink,
    warm,
    fontFamily ?? "",
    align,
  ].join("|");

  React.useEffect(() => {
    opts.current = {
      lines,
      background,
      ink,
      warm,
      dotGap,
      radius,
      maxFontSize,
      interactive,
      fontFamily,
      fontWeight,
      align,
    };

    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let tw = 0;
    let th = 0;
    let pad = 0;
    let dpr = 1;
    let px = -1e5;
    let py = -1e5;
    let raf = 0;
    let visible = true;
    let awake = true;
    let ring = { x: 0, y: 0, t: -1 };

    // Flat array per dot: [x, y, vx, vy, hx, hy, radius]
    let dots = new Float32Array(0);
    let count = 0;
    const inkRgb = parseHex(opts.current.ink) || [234, 231, 222];
    const warmRgb = parseHex(opts.current.warm) || [255, 180, 84];

    const resolveFamily = () => {
      if (opts.current.fontFamily) return opts.current.fontFamily;
      // Inherit theme font-sans from document root
      return (
        getComputedStyle(document.documentElement).fontFamily ||
        '"IBM Plex Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      );
    };

    const layout = () => {
      const o = opts.current;
      const rect = root.getBoundingClientRect();
      tw = Math.max(1, Math.round(rect.width));
      if (tw < 10) return;
      pad = Math.min(96, Math.max(0, o.radius || 0) + 16);
      w = tw + pad * 2;

      const family = resolveFamily();

      // Step 1: Measure lines to compute optimal font size and layout heights
      const measureCanvas = document.createElement("canvas");
      const mc = measureCanvas.getContext("2d");
      if (!mc) return;

      mc.font = `${o.fontWeight} 100px ${family}`;

      // Find the longest line at 100px
      let maxLen100 = 1;
      const lineLengths100 = o.lines.map((line) => {
        const len = mc.measureText(line).width;
        if (len > maxLen100) maxLen100 = len;
        return len;
      });

      // Target font size: fit longest line comfortably, scaled up to maxFontSize (84px) on desktop
      const paddingX = 4;
      const availableWidth = tw - paddingX * 2;
      const fittedSize = (availableWidth * 0.98 / maxLen100) * 100;
      const maxLimit = o.maxFontSize ?? 84;
      const fontSize = Math.min(maxLimit, Math.max(34, Math.floor(fittedSize)));

      mc.font = `${o.fontWeight} ${fontSize}px ${family}`;
      const sampleMetrics = mc.measureText("Mg");
      const cap = sampleMetrics.actualBoundingBoxAscent || fontSize * 0.74;
      const descent = sampleMetrics.actualBoundingBoxDescent || fontSize * 0.22;
      const lineSpacing = fontSize * 0.16;
      const lineStep = cap + descent + lineSpacing;

      // Compute total required height for all lines with safe breathing margin
      const computedHeight = Math.ceil(
        cap + (o.lines.length - 1) * lineStep + descent + 14
      );

      // Guard against layout loops: only set style.height if different
      if (Math.abs(rect.height - computedHeight) > 1) {
        root.style.height = `${computedHeight}px`;
      }
      th = computedHeight;
      h = th + pad * 2;

      canvas.style.left = `${-pad}px`;
      canvas.style.top = `${-pad}px`;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);

      // Step 2: Draw the text on a 1x mask canvas
      const mask = document.createElement("canvas");
      mask.width = w;
      mask.height = h;
      const m = mask.getContext("2d", { willReadFrequently: true });
      if (!m) return;

      m.font = `${o.fontWeight} ${fontSize}px ${family}`;
      m.fillStyle = "#000000";
      m.textBaseline = "alphabetic";

      o.lines.forEach((line, idx) => {
        const lineY = pad + cap + 6 + idx * lineStep;
        let lineX = paddingX + pad;
        if (o.align === "center") {
          const lineWidth = (lineLengths100[idx] / 100) * fontSize;
          lineX = pad + Math.max(0, (tw - lineWidth) / 2);
        }
        m.fillText(line, lineX, lineY);
      });

      const img = m.getImageData(0, 0, w, h).data;

      // Step 3: Sample mask into halftone dots
      const gap = Math.max(2.8, o.dotGap);
      const cols = Math.ceil(w / gap);
      const rows = Math.ceil(h / gap);
      const tmp: number[] = [];

      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // Average alpha over 3x3 subgrid for smooth anti-aliased dot sizes
          let sum = 0;
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(
                w - 1,
                Math.floor(gx * gap + ((sx + 0.5) * gap) / 3)
              );
              const y = Math.min(
                h - 1,
                Math.floor(gy * gap + ((sy + 0.5) * gap) / 3)
              );
              sum += img[(y * w + x) * 4 + 3];
            }
          }
          const coverage = sum / (9 * 255);
          if (coverage < 0.05) continue;

          const hx = gx * gap + gap / 2;
          const hy = gy * gap + gap / 2;
          tmp.push(hx, hy, 0, 0, hx, hy, dotRadius(coverage, gap));
        }
      }

      dots = new Float32Array(tmp);
      count = tmp.length / 7;

      awake = true;
    };

    const draw = (now: number) => {
      const o = opts.current;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Cleanly wipe the canvas so pixels outside dots are 100% transparent.
      // Absolutely no fillRect, no grain overlay, no gray box.
      ctx.clearRect(0, 0, w, h);

      if (o.background && o.background !== "transparent") {
        ctx.fillStyle = o.background;
        ctx.fillRect(0, 0, w, h);
      }

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0;
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t;
      const ringR = ringAge * 0.9;
      const fade0 = Math.max(24, (o.radius || 80) * 0.55);
      const fadeSpan = fade0;
      let moving = false;

      for (let i = 0; i < count; i++) {
        const j = i * 7;
        let x = dots[j];
        let y = dots[j + 1];
        let vx = dots[j + 2];
        let vy = dots[j + 3];
        const hx = dots[j + 4];
        const hy = dots[j + 5];

        if (!reduced) {
          // Shockwave ripple on click
          if (ringAge < 900) {
            const dx = hx - ring.x;
            const dy = hy - ring.y;
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 26);
            if (band > 0) {
              const f = band * 3.4 * (1 - ringAge / 900);
              vx += (dx / d) * f;
              vy += (dy / d) * f;
            }
          }

          const s = springStep(x, y, vx, vy, hx, hy, px, py, r);
          x = s[0];
          y = s[1];
          vx = s[2];
          vy = s[3];

          if (
            Math.abs(vx) + Math.abs(vy) > 0.02 ||
            Math.abs(x - hx) + Math.abs(y - hy) > 0.05
          ) {
            moving = true;
          } else {
            x = hx;
            y = hy;
            vx = 0;
            vy = 0;
          }

          dots[j] = x;
          dots[j + 1] = y;
          dots[j + 2] = vx;
          dots[j + 3] = vy;
        }

        const disp = Math.abs(x - hx) + Math.abs(y - hy);
        const alpha =
          disp <= fade0 ? 1 : Math.max(0, 1 - (disp - fade0) / fadeSpan);
        if (alpha <= 0) continue;

        // Warm color transition based on displacement from rest
        const k = warmthFactor(x, y, hx, hy, 28);
        ctx.globalAlpha = alpha;
        ctx.fillStyle =
          k > 0.02
            ? `rgb(${Math.round(inkRgb[0] + (warmRgb[0] - inkRgb[0]) * k)}, ${Math.round(
                inkRgb[1] + (warmRgb[1] - inkRgb[1]) * k
              )}, ${Math.round(inkRgb[2] + (warmRgb[2] - inkRgb[2]) * k)})`
            : o.ink;

        ctx.beginPath();
        ctx.arc(x, y, dots[j + 6], 0, 6.2832);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Sleep loop when all dots are resting (any pointermove re-wakes it)
      awake = moving || ringAge < 900;
    };

    const loop = (now: number) => {
      raf = 0;
      if (!visible) return;
      draw(now);
      if (awake) raf = requestAnimationFrame(loop);
    };

    const wake = () => {
      awake = true;
      if (!raf && visible) raf = requestAnimationFrame(loop);
    };

    const toLocal = (e: PointerEvent): [number, number] => {
      const b = root.getBoundingClientRect();
      return [e.clientX - b.left + pad, e.clientY - b.top + pad];
    };

    const onMove = (e: PointerEvent) => {
      if (!opts.current.interactive || reduced) return;
      const b = root.getBoundingClientRect();
      const lx = e.clientX - b.left;
      const ly = e.clientY - b.top;
      const z = Math.max(60, (opts.current.radius || 0) + 40);
      const near = lx >= -z && lx <= tw + z && ly >= -z && ly <= th + z;
      if (near) {
        px = lx + pad;
        py = ly + pad;
        wake();
      } else if (px > -1e4) {
        px = -1e5;
        py = -1e5;
        wake();
      }
    };

    const onLeave = () => {
      px = -1e5;
      py = -1e5;
      wake();
    };

    const onDown = (e: PointerEvent) => {
      if (!opts.current.interactive || reduced) return;
      const p = toLocal(e);
      ring = { x: p[0], y: p[1], t: performance.now() };
      wake();
    };

    layout();
    draw(performance.now());
    wake();

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("blur", onLeave);
    root.addEventListener("pointerdown", onDown);

    const ro = new ResizeObserver(() => {
      layout();
      wake();
    });
    ro.observe(root);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true;
      if (visible) wake();
    });
    io.observe(root);

    let alive = true;
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return;
        layout();
        wake();
      });
    }

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      root.removeEventListener("pointerdown", onDown);
    };
  }, [key]);

  return (
    <div
      ref={rootRef}
      className={`hn-root ${className}`}
      style={{ minHeight: "80px" }}
    >
      <style>{HN_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      <span className="hn-sr">{accessibleText}</span>
    </div>
  );
}
