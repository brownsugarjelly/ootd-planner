'use client';

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { Shirt, ZoomIn, ZoomOut } from 'lucide-react';
import { ALL_CATEGORIES, type ClothingItem, type OutfitLayer } from '@/lib/types';
import { useWardrobeStore } from '@/lib/store';
import { usePinchPan } from '@/hooks/usePinchPan';
import { StickerLayer } from './StickerLayer';

interface LayerWithItem {
  layer: OutfitLayer;
  item: ClothingItem;
}

function attachItems(layers: OutfitLayer[], items: ClothingItem[]): LayerWithItem[] {
  const result: LayerWithItem[] = [];
  for (const layer of layers) {
    const item = items.find((i) => i.id === layer.itemId);
    if (item) result.push({ layer, item });
  }
  return result;
}

export const OutfitCanvas = forwardRef<HTMLDivElement>(function OutfitCanvas(_props, ref) {
  const items = useWardrobeStore((s) => s.items);
  const layers = useWardrobeStore((s) => s.layers);
  const background = useWardrobeStore((s) => s.settings.background);
  const selectedStickerLayerId = useWardrobeStore((s) => s.selectedStickerLayerId);
  const selectSticker = useWardrobeStore((s) => s.selectSticker);

  const frameRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => frameRef.current as HTMLDivElement);

  const { state: pinchPan, handlers } = usePinchPan();

  const allLayers = attachItems(
    ALL_CATEGORIES.flatMap((c) => layers[c]),
    items,
  )
    .filter((l) => !l.layer.hidden)
    .sort((a, b) => a.layer.order - b.layer.order);

  const hasAnyLayer = allLayers.length > 0;
  const hasAnyWardrobe = items.length > 0;

  function zoomBy(deltaScale: number) {
    handlers.onWheel({
      deltaY: -deltaScale * 300,
      ctrlKey: true,
      preventDefault: () => undefined,
    } as unknown as React.WheelEvent);
  }

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden p-4 sm:p-8">
      <div className="relative flex h-full w-full max-w-md touch-none items-center justify-center" {...handlers}>
        <div
          ref={frameRef}
          role="img"
          aria-label={
            hasAnyLayer ? `Outfit preview: ${allLayers.map((l) => l.item.name).join(', ')}` : 'Outfit preview: empty'
          }
          onPointerDown={() => selectSticker(null)}
          className="relative aspect-[3/4] w-full overflow-hidden rounded-xl2 shadow-soft dark:shadow-soft-dark ring-1 ring-line dark:ring-dusk-line transition-colors duration-300"
          style={{
            backgroundColor: background.color,
            transform: `translate(${pinchPan.x}px, ${pinchPan.y}px) scale(${pinchPan.scale})`,
          }}
        >
          {allLayers.map(({ layer, item }) => (
            <StickerLayer
              key={layer.layerId}
              layer={layer}
              item={item}
              canvasRef={frameRef}
              selected={selectedStickerLayerId === layer.layerId}
            />
          ))}

          {!hasAnyLayer && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
              <div className="rounded-full bg-white/70 p-4 text-thread-500 dark:bg-black/20">
                <Shirt size={28} aria-hidden="true" />
              </div>
              <p className="font-display text-base text-ink/70 dark:text-dusk-text/70">
                {hasAnyWardrobe
                  ? 'Add pieces from the wardrobe to build a look'
                  : 'Upload clothing to start dressing'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex gap-1 sm:bottom-8 sm:right-8">
        <button
          type="button"
          onClick={() => zoomBy(-0.2)}
          aria-label="Zoom out"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink-muted shadow-softer hover:text-ink dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-muted dark:hover:text-dusk-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
        >
          <ZoomOut size={13} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.2)}
          aria-label="Zoom in"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-ink-muted shadow-softer hover:text-ink dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-muted dark:hover:text-dusk-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400"
        >
          <ZoomIn size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
