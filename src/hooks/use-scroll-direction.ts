"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Returns "down" when the user is scrolling down (past a threshold),
 * "up" when scrolling up. Useful for hiding/showing sticky headers.
 */
export function useScrollDirection(threshold = 10): "up" | "down" {
  const [direction, setDirection] = useState<"up" | "down">("up");
  const lastY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;

      requestAnimationFrame(() => {
        const y = window.scrollY;
        const diff = y - lastY.current;

        if (Math.abs(diff) >= threshold) {
          setDirection(diff > 0 ? "down" : "up");
          lastY.current = y;
        }

        ticking.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return direction;
}
