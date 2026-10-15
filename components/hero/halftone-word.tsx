"use client";

// Halftone wordmark — the text engine of the "Halftone Wordmark Footer"
// (21st.dev), extracted as a standalone interactive word: the name is set
// enormous and printed as a field of halftone dots. Each dot is sized by
// how much of the letter covers its cell, so the type keeps its edges at any
// scale. Dots part around the pointer on springs and warm toward the accent;
// a click sends a shock ring through the letters. The footer chrome
// (columns, links, rules) is intentionally not ported — text part only.
//
// Adaptations for this portfolio:
// - transparent background mode so the page and spotlight show through
// - auto height from the measured cap height (no fixed-crop guessing)
// - font family resolved from the page's computed style (works with next/font)

import * as React from "react"

export interface HalftoneWordProps {
  /** The giant word printed in dots. Lowercase reads best. */
  word: string
  /** Accessible label for the word; pass null to rely on surrounding context. */
  srLabel?: string | null
  /** Canvas background. "transparent" lets the page show through. */
  background?: string
  /** Dot color at rest. */
  ink?: string
  /** The color a dot warms toward as it is pushed off its place. */
  warm?: string
  /** Distance between dot centres, in CSS px. Defaults to 6. */
  dotGap?: number
  /** How far the pointer pushes, in CSS px. Defaults to 80. */
  radius?: number
  /** How much of the word's cap height hangs below the bottom edge, 0–0.6. */
  crop?: number
  /** Print grain over the dots, 0–1. Defaults to 0.35. */
  grain?: number
  /** Pointer and click response. Defaults to true. */
  interactive?: boolean
  /** Face override. Defaults to the page's computed sans stack. */
  fontFamily?: string
  /** Weight of the wordmark. Heavy weights print best. */
  fontWeight?: number
  /** Root height. A definite CSS length; omit to auto-size to the letters. */
  height?: string
  className?: string
}

/** Hex → [r, g, b] in 0–255, or null for anything that isn't #rgb / #rrggbb. */
function hex(hex: string) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || "").trim())
  if (!m) return null
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1]
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Dot radius for a cell coverage in [0, 1]: area-true, so tone stays even. */
function radiusFor(coverage: number, gap: number) {
  const c = coverage < 0 ? 0 : coverage > 1 ? 1 : coverage
  return Math.sqrt(c) * gap * 0.56
}

/** One step of a dot's spring back to home, plus the push from a pointer. */
function springStep(
  x: number, y: number, vx: number, vy: number,
  hx: number, hy: number, px: number, py: number, r: number,
) {
  const dx = x - px
  const dy = y - py
  const d2 = dx * dx + dy * dy
  if (r > 0 && d2 < r * r) {
    const d = Math.sqrt(d2) + 0.001
    const f = (1 - d / r) * 2.6
    vx += (dx / d) * f
    vy += (dy / d) * f
  }
  vx = (vx + (hx - x) * 0.05) * 0.84
  vy = (vy + (hy - y) * 0.05) * 0.84
  return [x + vx, y + vy, vx, vy] as const
}

/** How warm a dot is drawn: 0 at home, 1 once it is `span` px or more away. */
function warmth(x: number, y: number, hx: number, hy: number, span: number) {
  const d = Math.hypot(x - hx, y - hy)
  return span > 0 ? Math.min(1, d / span) : 0
}

/** Font size that sets `measured` (width at 100px) to fill `width` exactly. */
function fitSize(measured: number, width: number) {
  return measured > 0 ? (width / measured) * 100 : 0
}

const HTW_CSS = `
.htw-root {
  position: relative; width: 100%; overflow: hidden; isolation: isolate;
  -webkit-font-smoothing: antialiased;
}
.htw-root canvas { position: absolute; inset: 0; width: 100%; height: 100%; display: block; max-width: none; }
.htw-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); white-space: nowrap; }
`

export default function HalftoneWord({
  word,
  srLabel,
  background = "transparent",
  ink = "#eae7de",
  warm = "#ffb454",
  dotGap = 6,
  radius = 80,
  crop = 0,
  grain = 0.35,
  interactive = true,
  fontFamily,
  fontWeight = 700,
  height,
  className = "",
}: HalftoneWordProps) {
  const rootRef = React.useRef<HTMLDivElement | null>(null)
  const canvasRef = React.useRef(null as HTMLCanvasElement | null)
  const opts = React.useRef({ background, ink, warm, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, word })
  const key = [word, dotGap, crop, grain, fontWeight, background, ink, warm, fontFamily ?? ""].join("|")

  React.useEffect(() => {
    opts.current = { background, ink, warm, dotGap, radius, crop, grain, interactive, fontFamily, fontWeight, word }
    const root = rootRef.current
    const canvas = canvasRef.current
    if (!root || !canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    let w = 0
    let h = 0
    let dpr = 1
    let px = -1e5
    let py = -1e5
    let raf = 0
    let visible = true
    let awake = true
    let ring = { x: 0, y: 0, t: -1 }
    // Flat arrays: x, y, vx, vy, hx, hy, r per dot.
    let dots = new Float32Array(0)
    let count = 0
    let grainTile = null as HTMLCanvasElement | null
    const inkRgb = hex(opts.current.ink) || [234, 231, 222]
    const warmRgb = hex(opts.current.warm) || [255, 180, 84]

    const resolveFamily = () => {
      if (opts.current.fontFamily) return opts.current.fontFamily
      // Use the page's real stack so next/font faces are picked up.
      return getComputedStyle(document.documentElement).fontFamily || "sans-serif"
    }

    const layout = () => {
      const o = opts.current
      const rect = root.getBoundingClientRect()
      w = Math.max(1, Math.round(rect.width))
      h = Math.max(1, Math.round(rect.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)

      // Set the word once, at a size that fills the width, on a 1x mask.
      const mask = document.createElement("canvas")
      mask.width = w
      mask.height = h
      const m = mask.getContext("2d", { willReadFrequently: true })
      if (!m) return
      const family = resolveFamily()
      m.font = o.fontWeight + " 100px " + family
      const text = o.word || " "
      const fit = fitSize(m.measureText(text).width, w * 1.02)
      m.font = o.fontWeight + " " + fit + "px " + family
      const box = m.measureText(text)
      const cap = box.actualBoundingBoxAscent || fit * 0.72
      const c = Math.max(0, Math.min(0.6, o.crop))
      m.fillStyle = "#000"
      m.textBaseline = "alphabetic"
      m.fillText(text, (w - box.width) / 2, h + cap * c)
      const img = m.getImageData(0, 0, w, h).data

      // Auto height: size the root to the letters so there is no dead space.
      if (!height) {
        const wanted = Math.ceil(cap * (1 + c) + 10)
        if (Math.abs(rect.height - wanted) > 1) root.style.height = wanted + "px"
      }

      const gap = Math.max(3, o.dotGap)
      const cols = Math.ceil(w / gap)
      const rows = Math.ceil(h / gap)
      const tmp: number[] = []
      for (let gy = 0; gy < rows; gy++) {
        for (let gx = 0; gx < cols; gx++) {
          // Coverage: average alpha over a 3×3 sample of the cell.
          let sum = 0
          for (let sy = 0; sy < 3; sy++) {
            for (let sx = 0; sx < 3; sx++) {
              const x = Math.min(w - 1, Math.floor(gx * gap + ((sx + 0.5) * gap) / 3))
              const y = Math.min(h - 1, Math.floor(gy * gap + ((sy + 0.5) * gap) / 3))
              sum += img[(y * w + x) * 4 + 3]
            }
          }
          const cov = sum / (9 * 255)
          if (cov < 0.06) continue
          const hx = gx * gap + gap / 2
          const hy = gy * gap + gap / 2
          tmp.push(hx, hy, 0, 0, hx, hy, radiusFor(cov, gap))
        }
      }
      dots = new Float32Array(tmp)
      count = tmp.length / 7

      // A fixed tile of print grain, drawn once and laid over every frame.
      grainTile = document.createElement("canvas")
      grainTile.width = 256
      grainTile.height = 256
      const g = grainTile.getContext("2d")
      if (g) {
        const id = g.createImageData(256, 256)
        for (let i = 0; i < id.data.length; i += 4) {
          const v = Math.random() * 255
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v
          id.data[i + 3] = Math.random() < 0.5 ? 0 : 255
        }
        g.putImageData(id, 0, 0)
      }
      awake = true
    }

    const draw = (now: number) => {
      const o = opts.current
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (o.background !== "transparent") {
        ctx.fillStyle = o.background
        ctx.fillRect(0, 0, w, h)
      }

      const r = o.interactive && !reduced ? Math.max(0, o.radius) : 0
      const ringAge = ring.t < 0 ? 1e9 : now - ring.t
      const ringR = ringAge * 0.9
      let moving = false
      for (let i = 0; i < count; i++) {
        const j = i * 7
        let x = dots[j]
        let y = dots[j + 1]
        let vx = dots[j + 2]
        let vy = dots[j + 3]
        const hx = dots[j + 4]
        const hy = dots[j + 5]
        if (!reduced) {
          if (ringAge < 900) {
            const dx = hx - ring.x
            const dy = hy - ring.y
            const d = Math.sqrt(dx * dx + dy * dy) + 0.001
            const band = 1 - Math.min(1, Math.abs(d - ringR) / 26)
            if (band > 0) {
              const f = band * 3.2 * (1 - ringAge / 900)
              vx += (dx / d) * f
              vy += (dy / d) * f
            }
          }
          const s = springStep(x, y, vx, vy, hx, hy, px, py, r)
          x = s[0]
          y = s[1]
          vx = s[2]
          vy = s[3]
          if (Math.abs(vx) + Math.abs(vy) > 0.02 || Math.abs(x - hx) + Math.abs(y - hy) > 0.05) moving = true
          else {
            x = hx
            y = hy
            vx = 0
            vy = 0
          }
          dots[j] = x
          dots[j + 1] = y
          dots[j + 2] = vx
          dots[j + 3] = vy
        }
        const k = warmth(x, y, hx, hy, 28)
        ctx.fillStyle =
          k > 0.02
            ? "rgb(" +
              Math.round(inkRgb[0] + (warmRgb[0] - inkRgb[0]) * k) + "," +
              Math.round(inkRgb[1] + (warmRgb[1] - inkRgb[1]) * k) + "," +
              Math.round(inkRgb[2] + (warmRgb[2] - inkRgb[2]) * k) + ")"
            : o.ink
        ctx.beginPath()
        ctx.arc(x, y, dots[j + 6], 0, 6.2832)
        ctx.fill()
      }

      if (grainTile && o.grain > 0) {
        ctx.globalAlpha = Math.min(1, o.grain) * 0.09
        ctx.globalCompositeOperation = "overlay"
        const pattern = ctx.createPattern(grainTile, "repeat")
        if (pattern) {
          ctx.fillStyle = pattern
          ctx.fillRect(0, 0, w, h)
        }
        ctx.globalAlpha = 1
        ctx.globalCompositeOperation = "source-over"
      }
      // Sleep once everything is home and nothing is pushing.
      awake = moving || ringAge < 900 || px > -1e4
    }

    const loop = (now: number) => {
      raf = 0
      if (!visible) return
      draw(now)
      if (awake) raf = requestAnimationFrame(loop)
    }
    const wake = () => {
      awake = true
      if (!raf && visible) raf = requestAnimationFrame(loop)
    }

    const toLocal = (e: PointerEvent) => {
      const b = canvas.getBoundingClientRect()
      return [e.clientX - b.left, e.clientY - b.top]
    }
    const onMove = (e: PointerEvent) => {
      if (!opts.current.interactive) return
      const p = toLocal(e)
      px = p[0]
      py = p[1]
      wake()
    }
    const onLeave = () => {
      px = -1e5
      py = -1e5
      wake()
    }
    const onDown = (e: PointerEvent) => {
      if (!opts.current.interactive || reduced) return
      if ((e.target as HTMLElement).closest("a,button")) return
      const p = toLocal(e)
      ring = { x: p[0], y: p[1], t: performance.now() }
      wake()
    }

    layout()
    draw(performance.now())
    wake()

    root.addEventListener("pointermove", onMove)
    root.addEventListener("pointerleave", onLeave)
    root.addEventListener("pointerdown", onDown)
    const ro = new ResizeObserver(() => {
      layout()
      wake()
    })
    ro.observe(root)
    const io = new IntersectionObserver((entries) => {
      visible = entries[0] ? entries[0].isIntersecting : true
      if (visible) wake()
    })
    io.observe(root)
    // A web font that lands late re-sets the word in its real face.
    let alive = true
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        if (!alive) return
        layout()
        wake()
      })
    }

    return () => {
      alive = false
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      root.removeEventListener("pointermove", onMove)
      root.removeEventListener("pointerleave", onLeave)
      root.removeEventListener("pointerdown", onDown)
    }
  }, [key])

  return (
    <div
      ref={rootRef}
      className={"htw-root " + className}
      style={height ? { height } : undefined}
    >
      <style>{HTW_CSS}</style>
      <canvas ref={canvasRef} aria-hidden="true" />
      {srLabel !== null ? <span className="htw-sr">{srLabel ?? word}</span> : null}
    </div>
  )
}
