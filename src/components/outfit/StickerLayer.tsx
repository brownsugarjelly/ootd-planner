'use client';

import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { RotateCw } from 'lucide-react';
import clsx from 'clsx';
import { CATEGORY_BASE_WIDTH_FRACTION, type ClothingItem, type OutfitLayer } from '@/lib/types';
import { useWardrobeStore } from '@/lib/store';

interface StickerLayerProps {
  layer: OutfitLayer;
  item: ClothingItem;
  canvasRef: React.RefObject<HTMLDivElement>;
  selected: boolean;
}

export function StickerLayer({ layer, item, canvasRef, selected }: StickerLayerProps) {
  const transform = layer.transform;
  const updateTransform = useWardrobeStore((s) => s.updateStickerTransform);
  const selectSticker = useWardrobeStore((s) => s.selectSticker);

  const dragState = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const rotateState = useRef<{ centerX: number; centerY: number; startAngle: number; origRotation: number } | null>(
    null,
  );
  const resizeState = useRef<{ centerX: number; centerY: number; startDist: number; origScale: number } | null>(null);

  const getCanvasRect = useCallback(() => canvasRef.current?.getBoundingClientRect() ?? null, [canvasRef]);

  function onBodyPointerDown(e: ReactPointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    selectSticker(layer.layerId);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, origX: transform.x, origY: transform.y };
  }

  function onBodyPointerMove(e: ReactPointerEvent) {
    if (!dragState.current) return;
    const rect = getCanvasRect();
    if (!rect) return;
    const dx = (e.clientX - dragState.current.startX) / rect.width;
    const dy = (e.clientY - dragState.current.startY) / rect.height;
    updateTransform(layer.layerId, {
      x: Math.min(1, Math.max(0, dragState.current.origX + dx)),
      y: Math.min(1, Math.max(0, dragState.current.origY + dy)),
    });
  }

  function onBodyPointerUp(e: ReactPointerEvent) {
    dragState.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function onRotatePointerDown(e: ReactPointerEvent) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = getCanvasRect();
    if (!rect) return;
    const centerX = rect.left + transform.x * rect.width;
    const centerY = rect.top + transform.y * rect.height;
    const startAngle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    rotateState.current = { centerX, centerY, startAngle, origRotation: transform.rotation };
  }

  function onRotatePointerMove(e: ReactPointerEvent) {
    if (!rotateState.current) return;
    const { centerX, centerY, startAngle, origRotation } = rotateState.current;
    const angle = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI;
    updateTransform(layer.layerId, { rotation: Math.round(origRotation + (angle - startAngle)) });
  }

  function onRotatePointerUp(e: ReactPointerEvent) {
    rotateState.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function onResizePointerDown(e: ReactPointerEvent) {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = getCanvasRect();
    if (!rect) return;
    const centerX = rect.left + transform.x * rect.width;
    const centerY = rect.top + transform.y * rect.height;
    const startDist = Math.hypot(e.clientX - centerX, e.clientY - centerY);
    resizeState.current = { centerX, centerY, startDist, origScale: transform.scale };
  }

  function onResizePointerMove(e: ReactPointerEvent) {
    if (!resizeState.current) return;
    const { startDist, origScale } = resizeState.current;
    const dist = Math.hypot(e.clientX - resizeState.current.centerX, e.clientY - resizeState.current.centerY);
    const ratio = startDist > 0 ? dist / startDist : 1;
    updateTransform(layer.layerId, { scale: Math.min(3, Math.max(0.25, origScale * ratio)) });
  }

  function onResizePointerUp(e: ReactPointerEvent) {
    resizeState.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  const widthPercent = CATEGORY_BASE_WIDTH_FRACTION[layer.category] * transform.scale * 100;

  return (
    <div
      className="absolute"
      style={{
        left: `${transform.x * 100}%`,
        top: `${transform.y * 100}%`,
        width: `${widthPercent}%`,
        zIndex: layer.order,
      }}
    >
      <div
        style={{
          transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scaleX(${transform.flipX ? -1 : 1})`,
        }}
      >
        <button
          type="button"
          onPointerDown={onBodyPointerDown}
          onPointerMove={onBodyPointerMove}
          onPointerUp={onBodyPointerUp}
          onPointerCancel={onBodyPointerUp}
          className={clsx(
            'block w-full touch-none rounded-md border-0 bg-transparent p-0 focus-visible:outline-none',
            selected && 'ring-2 ring-thread-500 ring-offset-2 ring-offset-transparent',
          )}
          style={{ cursor: 'grab' }}
          aria-label={`${item.name} sticker — drag to move, tap to select`}
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            className="pointer-events-none w-full select-none"
            draggable={false}
          />
        </button>

        {selected && (
          <div
            onPointerDown={onRotatePointerDown}
            onPointerMove={onRotatePointerMove}
            onPointerUp={onRotatePointerUp}
            onPointerCancel={onRotatePointerUp}
            className="absolute -top-7 left-1/2 flex h-6 w-6 -translate-x-1/2 touch-none items-center justify-center rounded-full border border-thread-400 bg-white text-thread-600 shadow-softer dark:bg-dusk-surface2"
            role="slider"
            aria-label="Rotate accessory"
            aria-valuenow={transform.rotation}
            tabIndex={0}
          >
            <RotateCw size={12} aria-hidden="true" />
          </div>
        )}

        {selected && (
          <div
            onPointerDown={onResizePointerDown}
            onPointerMove={onResizePointerMove}
            onPointerUp={onResizePointerUp}
            onPointerCancel={onResizePointerUp}
            className="absolute -bottom-2 -right-2 h-5 w-5 touch-none cursor-nwse-resize rounded-full border-2 border-white bg-thread-500 shadow-softer"
            role="slider"
            aria-label="Resize accessory"
            aria-valuenow={Math.round(transform.scale * 100)}
            tabIndex={0}
          />
        )}
      </div>

    </div>
  );
}
