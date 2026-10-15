"use client";

import React, { Suspense, lazy, useRef, useEffect } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

interface SplineRuntimeApp {
  _eventManager?: {
    updateUseWindowEvents?: (enable: boolean) => void;
    eventContext?: {
      domRect: DOMRect | { left: number; top: number; width: number; height: number };
      useWindowEvents?: boolean;
    };
  };
  eventManager?: {
    updateUseWindowEvents?: (enable: boolean) => void;
    eventContext?: {
      domRect: DOMRect | { left: number; top: number; width: number; height: number };
      useWindowEvents?: boolean;
    };
  };
  setGlobalEvents?: (enable: boolean) => void;
  _controls?: {
    updateUseWindowEvents?: (enable: boolean) => void;
  };
  requestRender?: () => void;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineAppRef = useRef<SplineRuntimeApp | null>(null);

  useEffect(() => {
    const updateDomRect = () => {
      const container = containerRef.current;
      const app = splineAppRef.current;
      if (!container || !app) return;
      const canvas = container.querySelector("canvas");
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      if (app.eventManager?.eventContext) {
        app.eventManager.eventContext.domRect = rect;
      }
      if (app._eventManager?.eventContext) {
        app._eventManager.eventContext.domRect = rect;
      }
    };

    const handleGlobalMove = (e: MouseEvent | PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const canvas = container.querySelector("canvas");
      if (!canvas) return;

      // Keep domRect in sync with viewport scroll and 3D tilt
      const app = splineAppRef.current;
      const rect = canvas.getBoundingClientRect();
      if (app?.eventManager?.eventContext) {
        app.eventManager.eventContext.domRect = rect;
      }
      if (app?._eventManager?.eventContext) {
        app._eventManager.eventContext.domRect = rect;
      }

      // If the pointer is already directly over the canvas, let the native listener handle it
      if (e.target === canvas) return;

      const pointerEvent = e as PointerEvent;

      // Forward synthetic pointermove to canvas with accurate pageX & pageY for Spline's raycaster
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

      if (splineAppRef.current?.requestRender) {
        splineAppRef.current.requestRender();
      }
    };

    window.addEventListener("pointermove", handleGlobalMove, { passive: true });
    window.addEventListener("mousemove", handleGlobalMove, { passive: true });
    window.addEventListener("scroll", updateDomRect, { passive: true });

    return () => {
      window.removeEventListener("pointermove", handleGlobalMove);
      window.removeEventListener("mousemove", handleGlobalMove);
      window.removeEventListener("scroll", updateDomRect);
    };
  }, []);

  const handleSplineLoad = (app: SplineRuntimeApp) => {
    splineAppRef.current = app;
    try {
      if (typeof app.setGlobalEvents === "function") {
        app.setGlobalEvents(true);
      }
      if (app._controls?.updateUseWindowEvents) {
        app._controls.updateUseWindowEvents(true);
      }
      const canvas = containerRef.current?.querySelector("canvas");
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        if (app.eventManager?.eventContext) {
          app.eventManager.eventContext.domRect = rect;
        }
        if (app._eventManager?.eventContext) {
          app._eventManager.eventContext.domRect = rect;
        }
      }
    } catch {
      // safe fallback
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className || ""}`}>
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
    </div>
  );
}

