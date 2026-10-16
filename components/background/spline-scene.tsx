"use client";

import React, { Suspense, lazy, useEffect, useRef, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

interface SplineRuntimeApp {
  requestRender?: () => void;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineAppRef = useRef<SplineRuntimeApp | null>(null);
  // The 3D scene is expensive (runtime + ~1.4 MB of cross-origin assets), so
  // it only mounts - and therefore only downloads - once its container gets
  // close to the viewport. It stays mounted afterwards.
  const [nearViewport, setNearViewport] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || nearViewport) return;
    if (typeof IntersectionObserver === "undefined") {
      // Ancient-browser fallback: defer one tick so we never setState
      // synchronously inside the effect body.
      const t = window.setTimeout(() => setNearViewport(true), 0);
      return () => window.clearTimeout(t);
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          io.disconnect();
          setNearViewport(true);
        }
      },
      { rootMargin: "0px 0px 500px 0px" },
    );
    io.observe(container);
    return () => io.disconnect();
  }, [nearViewport]);

  // Pointer forwarding is scoped to this card. The previous implementation
  // listened on window, measured canvas geometry on every pointer move and
  // every scroll, and dispatched synthetic events page-wide. Native canvas
  // hover-tracking covers the canvas itself; this only extends the follow to
  // the surrounding panel, with no layout reads at all.
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !nearViewport) return;
    const reduced = window
      .matchMedia("(prefers-reduced-motion: reduce)")
      .matches;

    const onMove = (e: MouseEvent | PointerEvent) => {
      if (reduced) return;
      const canvas = container.querySelector("canvas");
      if (!canvas || e.target === canvas) return;
      const pointerEvent = e as PointerEvent;
      const pointerEv = new PointerEvent("pointermove", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        pointerId: pointerEvent.pointerId || 1,
        pointerType: pointerEvent.pointerType || "mouse",
        isPrimary: true,
        buttons: e.buttons,
      });
      Object.defineProperty(pointerEv, "pageX", { value: e.pageX, configurable: true });
      Object.defineProperty(pointerEv, "pageY", { value: e.pageY, configurable: true });
      canvas.dispatchEvent(pointerEv);

      const mouseEv = new MouseEvent("mousemove", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        buttons: e.buttons,
      });
      Object.defineProperty(mouseEv, "pageX", { value: e.pageX, configurable: true });
      Object.defineProperty(mouseEv, "pageY", { value: e.pageY, configurable: true });
      canvas.dispatchEvent(mouseEv);

      splineAppRef.current?.requestRender?.();
    };

    container.addEventListener("pointermove", onMove, { passive: true });
    container.addEventListener("mousemove", onMove, { passive: true });
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("mousemove", onMove);
    };
  }, [nearViewport]);

  const handleSplineLoad = (app: SplineRuntimeApp) => {
    // Window-level ("global") Spline events stay off: the robot tracks the
    // cursor over its own card, which the scoped listeners above cover.
    splineAppRef.current = app;
  };

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
      {nearViewport ? (
        <Suspense
          fallback={
            <div className="flex h-full w-full items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
            </div>
          }
        >
          <Spline
            scene={scene}
            onLoad={handleSplineLoad}
            className="h-full w-full pointer-events-auto"
          />
        </Suspense>
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          aria-hidden="true"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      )}
    </div>
  );
}
