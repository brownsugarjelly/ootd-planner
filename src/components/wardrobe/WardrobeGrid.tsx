'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeGrid } from 'react-window';
import { Shirt } from 'lucide-react';
import { ClothingCard } from './ClothingCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useWardrobeStore } from '@/lib/store';
import { ALL_CATEGORIES, type ClothingItem } from '@/lib/types';

interface WardrobeGridProps {
  items: ClothingItem[];
  onEdit: (item: ClothingItem) => void;
}

const CARD_MIN_WIDTH = 132;
const CARD_HEIGHT = 168;
const GAP = 10;

export function WardrobeGrid({ items, onEdit }: WardrobeGridProps) {
  const layers = useWardrobeStore((s) => s.layers);
  const addLayer = useWardrobeStore((s) => s.addLayer);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const columnCount = 3;
  const columnWidth = columnCount > 0 ? (containerWidth - GAP * (columnCount - 1)) / columnCount : CARD_MIN_WIDTH;
  const rowCount = Math.ceil(items.length / columnCount);

  const wornItemIds = useMemo(() => {
    const set = new Set<string>();
    for (const cat of ALL_CATEGORIES) {
      for (const layer of layers[cat]) {
        if (!layer.hidden) set.add(layer.itemId);
      }
    }
    return set;
  }, [layers]);

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Shirt}
        title="No clothing matches yet"
        description="Try clearing filters or uploading a new item."
      />
    );
  }

  if (items.length <= 40 || containerWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="grid gap-2.5"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}
      >
        {items.map((item) => (
          <ClothingCard
            key={item.id}
            item={item}
            selected={wornItemIds.has(item.id)}
            onSelect={() => addLayer(item.category, item.id)}
            onEdit={() => onEdit(item)}
          />
        ))}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={{ height: 'min(70vh, 900px)' }}>
      <FixedSizeGrid
        columnCount={columnCount}
        columnWidth={columnWidth + GAP}
        rowCount={rowCount}
        rowHeight={CARD_HEIGHT + GAP}
        width={containerWidth}
        height={Math.min(900, typeof window !== 'undefined' ? window.innerHeight * 0.7 : 700)}
      >
        {({ columnIndex, rowIndex, style }) => {
          const index = rowIndex * columnCount + columnIndex;
          const item = items[index];
          if (!item) return null;
          return (
            <div style={{ ...style, paddingRight: GAP, paddingBottom: GAP }}>
              <ClothingCard
                item={item}
                selected={wornItemIds.has(item.id)}
                onSelect={() => addLayer(item.category, item.id)}
                onEdit={() => onEdit(item)}
              />
            </div>
          );
        }}
      </FixedSizeGrid>
    </div>
  );
}
