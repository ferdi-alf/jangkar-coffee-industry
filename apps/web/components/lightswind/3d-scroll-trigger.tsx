// ThreeDScrollTrigger.tsx
"use client";

import React, {
  useRef,
  useEffect,
  useMemo,
  useContext,
} from "react";
import { cn } from "@/lib/utils";

/* -------------------------
   Utility: wrap (backward compatibility)
   ------------------------- */
export const wrap = (min: number, max: number, v: number) => {
  const rangeSize = max - min;
  return ((((v - min) % rangeSize) + rangeSize) % rangeSize) + min;
};

/* -----------------------------------
   Context for passive scroll velocity
   ----------------------------------- */
interface ScrollVelocityContextType {
  getVelocity: () => number;
}

const ThreeDScrollTriggerContext =
  React.createContext<ScrollVelocityContextType>({
    getVelocity: () => 0,
  });

/* --------------------------
   Container that tracks scroll velocity passively without re-renders
   -------------------------- */
export function ThreeDScrollTriggerContainer({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const velocityRef = useRef(0);
  const lastScrollY = useRef(0);
  const lastTime = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    lastTime.current = performance.now();

    const handleScroll = () => {
      const now = performance.now();
      const dt = Math.max(1, now - lastTime.current);
      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY.current;

      // Normalized velocity in px/ms
      const rawVelocity = deltaY / dt;
      // Smooth damp with previous velocity
      velocityRef.current = velocityRef.current * 0.4 + rawVelocity * 0.6;

      lastScrollY.current = currentScrollY;
      lastTime.current = now;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const contextValue = useMemo(
    () => ({
      getVelocity: () => velocityRef.current,
    }),
    []
  );

  return (
    <ThreeDScrollTriggerContext.Provider value={contextValue}>
      <div className={cn("relative w-full overflow-hidden", className)} {...props}>
        {children}
      </div>
    </ThreeDScrollTriggerContext.Provider>
  );
}

/* --------------------------
   Props
   -------------------------- */
export interface ThreeDScrollTriggerRowProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  baseVelocity?: number; // Speed multiplier
  direction?: 1 | -1;
  resetIntervalMs?: number;
}

/* --------------------------
   High-FPS GPU-Accelerated Row
   -------------------------- */
export function ThreeDScrollTriggerRow({
  children,
  baseVelocity = 5,
  direction = 1,
  className,
  ...props
}: ThreeDScrollTriggerRowProps) {
  const context = useContext(ThreeDScrollTriggerContext);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const singleBlockRef = useRef<HTMLDivElement | null>(null);

  const xRef = useRef(0);
  const unitWidthRef = useRef(0);
  const localVelocityRef = useRef(0);
  const isInViewRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // Measure single block width with ResizeObserver
  useEffect(() => {
    const measure = () => {
      if (singleBlockRef.current) {
        unitWidthRef.current =
          singleBlockRef.current.offsetWidth ||
          singleBlockRef.current.scrollWidth;
      }
    };
    measure();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined" && singleBlockRef.current) {
      ro = new ResizeObserver(measure);
      ro.observe(singleBlockRef.current);
    }
    return () => ro?.disconnect();
  }, [children]);

  // Viewport intersection observer: 0 CPU when scrolled away
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      isInViewRef.current = true;
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        isInViewRef.current = entry.isIntersecting;
      },
      { rootMargin: "150px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Butter-smooth Direct-GPU RAF Animation Loop (0 React re-renders)
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (now: number) => {
      if (!isInViewRef.current) {
        lastTime = now;
        rafIdRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      // Extract and smoothly decay external scroll velocity
      const extVelocity = context?.getVelocity() || 0;
      localVelocityRef.current =
        localVelocityRef.current * Math.pow(0.86, dt * 60) +
        extVelocity * 0.14;

      const unitWidth = unitWidthRef.current;
      if (unitWidth > 0) {
        // Base cruising speed: ~22px/sec per baseVelocity unit
        const baseSpeed = baseVelocity * 22;
        // Natural scroll velocity boost in the direction of the row
        const scrollBoost = localVelocityRef.current * 160 * direction;

        const moveDelta = (baseSpeed * direction + scrollBoost) * dt;
        xRef.current += moveDelta;

        // Mathematical seamless wrapping (continuous for all numbers)
        xRef.current = ((xRef.current % unitWidth) + unitWidth) % unitWidth;

        // Direct hardware-accelerated transform on GPU compositor
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${-xRef.current}px, 0, 0)`;
        }
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [baseVelocity, direction, context]);

  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children]
  );

  return (
    <div
      ref={containerRef}
      className={cn("w-full overflow-hidden whitespace-nowrap", className)}
      {...props}
    >
      <div
        ref={trackRef}
        className="inline-flex will-change-transform transform-gpu select-none"
        style={{
          transform: "translate3d(0, 0, 0)",
          contain: "layout paint",
        }}
      >
        <div ref={singleBlockRef} className="inline-flex shrink-0">
          {childrenArray}
        </div>
        <div className="inline-flex shrink-0" aria-hidden="true">
          {childrenArray}
        </div>
        <div className="inline-flex shrink-0" aria-hidden="true">
          {childrenArray}
        </div>
      </div>
    </div>
  );
}

export default ThreeDScrollTriggerRow;