'use client';

import { useRef } from 'react';
import type { PointerEvent } from 'react';

interface LongPressHandlers {
  onPointerDown: (e: PointerEvent) => void;
  onPointerUp: (e: PointerEvent) => void;
  onPointerLeave: (e: PointerEvent) => void;
  onPointerMove: (e: PointerEvent) => void;
}

/**
 * Fires onLongPress after `delayMs` of holding, provided the pointer hasn't
 * moved more than a few pixels (so it doesn't fire mid-swipe/drag). A plain
 * tap under the delay still triggers onTap once, on release.
 */
export function useLongPress(onLongPress: () => void, onTap?: () => void, delayMs = 480): LongPressHandlers {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);

  function clear() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  return {
    onPointerDown: (e) => {
      firedRef.current = false;
      startRef.current = { x: e.clientX, y: e.clientY };
      clear();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        onLongPress();
      }, delayMs);
    },
    onPointerMove: (e) => {
      if (!startRef.current) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      if (Math.hypot(dx, dy) > 10) clear();
    },
    onPointerUp: () => {
      clear();
      if (!firedRef.current) onTap?.();
    },
    onPointerLeave: () => {
      clear();
    },
  };
}
