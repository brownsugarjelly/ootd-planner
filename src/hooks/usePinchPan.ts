'use client';

import { useCallback, useRef, useState } from 'react';
import type { PointerEvent, WheelEvent } from 'react';

export interface PinchPanState {
  scale: number;
  x: number;
  y: number;
}

const MIN_SCALE = 0.6;
const MAX_SCALE = 3;

/**
 * Two-finger pinch to zoom, one-finger (or mouse) drag to pan, and mouse
 * wheel to zoom on desktop. Returns the current transform plus the pointer
 * handlers to spread onto the viewport element, and a reset() helper.
 */
export function usePinchPan() {
  const [state, setState] = useState<PinchPanState>({ scale: 1, x: 0, y: 0 });
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const lastDistance = useRef<number | null>(null);
  const lastPan = useRef<{ x: number; y: number } | null>(null);

  const reset = useCallback(() => setState({ scale: 1, x: 0, y: 0 }), []);

  function distanceBetween(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  const onPointerDown = useCallback((e: PointerEvent) => {
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) {
      lastPan.current = { x: e.clientX, y: e.clientY };
    }
    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      lastDistance.current = distanceBetween(pts[0] as { x: number; y: number }, pts[1] as { x: number; y: number });
    }
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      const pts = Array.from(pointers.current.values());
      const dist = distanceBetween(pts[0] as { x: number; y: number }, pts[1] as { x: number; y: number });
      if (lastDistance.current) {
        const ratio = dist / lastDistance.current;
        setState((s) => ({ ...s, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, s.scale * ratio)) }));
      }
      lastDistance.current = dist;
    } else if (pointers.current.size === 1 && lastPan.current) {
      const dx = e.clientX - lastPan.current.x;
      const dy = e.clientY - lastPan.current.y;
      lastPan.current = { x: e.clientX, y: e.clientY };
      setState((s) => ({ ...s, x: s.x + dx, y: s.y + dy }));
    }
  }, []);

  const endPointer = useCallback((e: PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) lastDistance.current = null;
    if (pointers.current.size === 1) {
      const remaining = Array.from(pointers.current.values())[0];
      lastPan.current = remaining ? { x: remaining.x, y: remaining.y } : null;
    } else if (pointers.current.size === 0) {
      lastPan.current = null;
    }
  }, []);

  const onWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && Math.abs(e.deltaY) < 2) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setState((s) => ({ ...s, scale: Math.min(MAX_SCALE, Math.max(MIN_SCALE, s.scale + s.scale * delta)) }));
  }, []);

  return {
    state,
    reset,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: endPointer,
      onPointerCancel: endPointer,
      onPointerLeave: endPointer,
      onWheel,
    },
  };
}
