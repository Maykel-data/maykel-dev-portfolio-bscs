"use client";

import React, { Suspense, lazy, useEffect, useRef, useState } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

interface SplineSceneProps {
  scene: string;
  className?: string;
}

interface SplineRuntimeApp {
  requestRender?: () => void;
  stop?: () => void;
  play?: () => void;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const splineAppRef = useRef<SplineRuntimeApp | null>(null);
  const [mounted, setMounted] = useState(false);

  // Mount immediately on client hydration so WebGPU/WebGL shaders compile at page load
  useEffect(() => {
    setMounted(true);
  }, []);

  const [isScrolling, setIsScrolling] = useState(false);

  // Suppress pointer events during active scroll to free 100% of GPU for 120fps scrolling
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        setIsScrolling(false);
      }, 120);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSplineLoad = (app: SplineRuntimeApp) => {
    splineAppRef.current = app;
  };

  return (
    <div
      ref={containerRef}
      className={`relative ${className || ""} ${isScrolling ? "pointer-events-none" : ""}`}
    >
      {mounted ? (
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
            renderOnDemand={true}
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
