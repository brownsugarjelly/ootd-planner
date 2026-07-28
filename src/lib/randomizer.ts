// Builds a full multi-layer outfit. Used by the "Randomize" button and the
// Color Matching panel. Still pure scoring + weighted-random pick — no AI.

import { v4 as uuidv4 } from 'uuid';
import {
  ALL_CATEGORIES,
  CATEGORY_DEFAULT_TRANSFORM,
  CATEGORY_LAYER_BAND,
  OPTIONAL_CATEGORIES,
  REQUIRED_CATEGORIES,
  emptyOutfitLayers,
  isStickerCategory,
  type ClothingCategory,
  type ClothingItem,
  type ColorMatchMode,
  type OutfitLayer,
  type OutfitLayers,
  type RandomizerSettings,
} from './types';
import { categoryPosition, deriveBaseHue, rankItemsForMode } from './colorMatch';
import { hexToHsl } from './colorUtils';

export interface GenerateOutfitParams {
  itemsByCategory: Record<ClothingCategory, ClothingItem[]>;
  mode: ColorMatchMode;
  settings: RandomizerSettings;
  baseColorHex?: string;
}

function applyFavoriteFilter(items: ClothingItem[], settings: RandomizerSettings): ClothingItem[] {
  let pool = items.filter((i) => !i.archived);
  if (settings.favoritesOnly) pool = pool.filter((i) => i.favorite);
  else if (settings.excludeFavorites) pool = pool.filter((i) => !i.favorite);
  return pool;
}

function weightedTopPick(ranked: { item: ClothingItem; score: number }[]): ClothingItem | null {
  if (ranked.length === 0) return null;
  const topPool = ranked.slice(0, Math.min(3, ranked.length));
  const totalWeight = topPool.reduce((sum, r) => sum + r.score + 0.05, 0);
  let roll = Math.random() * totalWeight;
  for (const candidate of topPool) {
    roll -= candidate.score + 0.05;
    if (roll <= 0) return candidate.item;
  }
  return topPool[0]?.item ?? null;
}

function chooseOptionalCategories(
  itemsByCategory: Record<ClothingCategory, ClothingItem[]>,
  settings: RandomizerSettings,
): ClothingCategory[] {
  if (!settings.includeAccessories) return [];
  const available = OPTIONAL_CATEGORIES.filter((c) => (itemsByCategory[c]?.length ?? 0) > 0);
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  const count = Math.min(settings.maxAccessoryCount, shuffled.length);
  return shuffled.slice(0, count);
}

/** Spreads freshly-placed accessory stickers out a bit so they don't all stack on the default spot. */
function scatteredTransform(index: number) {
  const positions = [
    { x: 0.5, y: 0.28 },
    { x: 0.72, y: 0.45 },
    { x: 0.28, y: 0.45 },
    { x: 0.5, y: 0.62 },
    { x: 0.65, y: 0.72 },
  ];
  const p = positions[index % positions.length] as { x: number; y: number };
  return { ...CATEGORY_DEFAULT_TRANSFORM.accessories, x: p.x, y: p.y };
}

export function generateOutfit(params: GenerateOutfitParams): OutfitLayers {
  const { itemsByCategory, mode, settings, baseColorHex } = params;
  const layers = emptyOutfitLayers();

  const includedOptional = new Set(chooseOptionalCategories(itemsByCategory, settings));
  const categoriesToFill: ClothingCategory[] = ALL_CATEGORIES.filter(
    (c) => (REQUIRED_CATEGORIES as ClothingCategory[]).includes(c) || includedOptional.has(c),
  );

  const seedPool =
    itemsByCategory.tops && itemsByCategory.tops.length > 0
      ? itemsByCategory.tops
      : Object.values(itemsByCategory).flat();
  const baseHue = baseColorHex ? hexToHsl(baseColorHex).h : deriveBaseHue(applyFavoriteFilter(seedPool, settings));
  const baseLightness = baseColorHex
    ? hexToHsl(baseColorHex).l
    : seedPool.length > 0
      ? hexToHsl((seedPool[0] as ClothingItem).primaryColor).l
      : 0.5;
  const popIndex = Math.floor(Math.random() * categoriesToFill.length);

  let accessoryIndex = 0;

  for (const category of categoriesToFill) {
    const pool = applyFavoriteFilter(itemsByCategory[category] ?? [], settings);
    if (pool.length === 0) continue;

    const isAccessory = isStickerCategory(category);
    const picksNeeded = isAccessory ? Math.min(2, pool.length) : 1;

    const ranked = rankItemsForMode(pool, mode, {
      baseHue,
      baseLightness,
      index: categoryPosition(category),
      popIndex,
    });

    const chosen: ClothingItem[] = [];
    const remaining = [...ranked];
    for (let i = 0; i < picksNeeded && remaining.length > 0; i += 1) {
      const pick = weightedTopPick(remaining);
      if (!pick) break;
      chosen.push(pick);
      const idx = remaining.findIndex((r) => r.item.id === pick.id);
      if (idx >= 0) remaining.splice(idx, 1);
    }

    chosen.forEach((item, i) => {
      const layer: OutfitLayer = {
        layerId: uuidv4(),
        itemId: item.id,
        category,
        order: CATEGORY_LAYER_BAND[category] + i,
        hidden: false,
        transform: isAccessory ? scatteredTransform(accessoryIndex++) : { ...CATEGORY_DEFAULT_TRANSFORM[category] },
      };
      layers[category].push(layer);
    });
  }

  return layers;
}
