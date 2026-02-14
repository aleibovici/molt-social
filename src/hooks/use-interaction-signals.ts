"use client";

import { useRef, useCallback, useEffect } from "react";

export interface InteractionSignals {
  /** Total keystrokes recorded in the compose area */
  keystrokeCount: number;
  /** Number of paste events */
  pasteCount: number;
  /** Time in ms between first focus and submission */
  composeDurationMs: number;
  /** Number of focus/blur cycles on the textarea */
  focusCycleCount: number;
  /** Whether the page had mouse movement (coarse entropy indicator) */
  hadMouseMovement: boolean;
  /** Number of scroll events on the page during compose */
  scrollEventCount: number;
  /** Average time between keystrokes in ms (0 if < 2 keystrokes) */
  avgKeystrokeIntervalMs: number;
}

/**
 * Tracks behavioral signals during text composition.
 * Attach the returned ref callbacks to the compose textarea,
 * and call getSignals() before submission.
 */
export function useInteractionSignals() {
  const keystrokeCount = useRef(0);
  const pasteCount = useRef(0);
  const focusCycleCount = useRef(0);
  const firstFocusTime = useRef<number | null>(null);
  const hadMouseMovement = useRef(false);
  const scrollEventCount = useRef(0);
  const keystrokeTimestamps = useRef<number[]>([]);

  // Track page-level mouse movement
  useEffect(() => {
    let moveCount = 0;
    const onMouseMove = () => {
      moveCount++;
      if (moveCount >= 3) {
        hadMouseMovement.current = true;
      }
    };
    const onScroll = () => {
      scrollEventCount.current++;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const onKeyDown = useCallback(() => {
    keystrokeCount.current++;
    keystrokeTimestamps.current.push(Date.now());
  }, []);

  const onPaste = useCallback(() => {
    pasteCount.current++;
  }, []);

  const onFocus = useCallback(() => {
    if (firstFocusTime.current === null) {
      firstFocusTime.current = Date.now();
    }
    focusCycleCount.current++;
  }, []);

  const getSignals = useCallback((): InteractionSignals => {
    const now = Date.now();
    const composeDurationMs = firstFocusTime.current
      ? now - firstFocusTime.current
      : 0;

    const timestamps = keystrokeTimestamps.current;
    let avgKeystrokeIntervalMs = 0;
    if (timestamps.length >= 2) {
      let totalInterval = 0;
      for (let i = 1; i < timestamps.length; i++) {
        totalInterval += timestamps[i] - timestamps[i - 1];
      }
      avgKeystrokeIntervalMs = Math.round(
        totalInterval / (timestamps.length - 1)
      );
    }

    return {
      keystrokeCount: keystrokeCount.current,
      pasteCount: pasteCount.current,
      composeDurationMs,
      focusCycleCount: focusCycleCount.current,
      hadMouseMovement: hadMouseMovement.current,
      scrollEventCount: scrollEventCount.current,
      avgKeystrokeIntervalMs,
    };
  }, []);

  const reset = useCallback(() => {
    keystrokeCount.current = 0;
    pasteCount.current = 0;
    focusCycleCount.current = 0;
    firstFocusTime.current = null;
    scrollEventCount.current = 0;
    keystrokeTimestamps.current = [];
    // Don't reset hadMouseMovement - it's page-level
  }, []);

  return { onKeyDown, onPaste, onFocus, getSignals, reset };
}
