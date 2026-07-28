'use client';

import { useRef } from 'react';
import type { TouchEvent } from 'react';

interface SwipeHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

export function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, threshold = 48): SwipeHandlers {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);

  return {
    onTouchStart: (e) => {
      startX.current = e.touches[0]?.clientX ?? null;
      startY.current = e.touches[0]?.clientY ?? null;
    },
    onTouchEnd: (e) => {
      if (startX.current === null || startY.current === null) return;
      const endX = e.changedTouches[0]?.clientX ?? startX.current;
      const endY = e.changedTouches[0]?.clientY ?? startY.current;
      const dx = endX - startX.current;
      const dy = endY - startY.current;
      if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0) onSwipeLeft();
        else onSwipeRight();
      }
      startX.current = null;
      startY.current = null;
    },
  };
}
