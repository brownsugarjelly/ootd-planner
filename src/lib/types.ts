// Core domain types for the wardrobe planner.
// v2: cloud-synced, multi-layer outfits, freeform accessory stickers.
// AI is used only to help classify/organize an uploaded photo (background
// removal + tagging) — never to generate clothing or outfits.

/** The four categories that must always exist and can never be fully empty. */
export type RequiredCategory = 'hijab' | 'tops' | 'bottoms' | 'shoes';

/** The two optional categories. */
export type OptionalCategory = 'bag' | 'accessories';

export type ClothingCategory = RequiredCategory | OptionalCategory;

export const REQUIRED_CATEGORIES: RequiredCategory[] = ['hijab', 'tops', 'bottoms', 'shoes'];
export const OPTIONAL_CATEGORIES: OptionalCategory[] = ['bag', 'accessories'];
export const ALL_CATEGORIES: ClothingCategory[] = [...REQUIRED_CATEGORIES, ...OPTIONAL_CATEGORIES];

export function isRequiredCategory(category: ClothingCategory): category is RequiredCategory {
  return (REQUIRED_CATEGORIES as string[]).includes(category);
}

/** Only "accessories" get freeform sticker placement; everything else stacks centered. */
export function isStickerCategory(category: ClothingCategory): boolean {
  return category === 'accessories';
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter' | 'all-season';
export type Occasion =
  | 'casual'
  | 'office'
  | 'formal'
  | 'party'
  | 'wedding'
  | 'sport'
  | 'loungewear'
  | 'outdoor'
  | 'travel';
export type Pattern =
  | 'solid'
  | 'striped'
  | 'floral'
  | 'plaid'
  | 'polka-dot'
  | 'animal-print'
  | 'geometric'
  | 'graphic'
  | 'textured'
  | 'other';
export type Material =
  | 'cotton'
  | 'linen'
  | 'silk'
  | 'denim'
  | 'leather'
  | 'wool'
  | 'polyester'
  | 'chiffon'
  | 'knit'
  | 'satin'
  | 'velvet'
  | 'other';

/** Base draw order per category — individual layer instances stack within this band. */
export const CATEGORY_LAYER_BAND: Record<ClothingCategory, number> = {
  bottoms: 100,
  tops: 200,
  shoes: 300,
  bag: 400,
  hijab: 500,
  accessories: 600,
};

export interface ClothingItem {
  id: string;
  ownerId: string;
  name: string;
  category: ClothingCategory;
  garmentType?: string; // e.g. "hoodie", "cargo pants" — from AI or user
  imageUrl: string; // processed (background-removed) transparent PNG, in cloud storage
  originalImageUrl?: string; // the untouched upload, kept for reference
  thumbnailUrl?: string;
  primaryColor: string; // hex, deterministically extracted from pixels
  secondaryColor?: string; // hex
  material?: Material;
  season: Season;
  occasion: Occasion[];
  pattern: Pattern;
  brand?: string;
  favorite: boolean;
  archived: boolean;
  notes?: string;
  tags: string[];
  aiProcessed: boolean; // whether the AI pipeline has finished on this item
  dateAdded: string; // ISO
  lastEdited: string; // ISO
  width: number;
  height: number;
}

export type ClothingItemInput = Omit<
  ClothingItem,
  'id' | 'ownerId' | 'dateAdded' | 'lastEdited' | 'width' | 'height'
> & { width?: number; height?: number };

/** A 2D affine transform for a freeform sticker (accessories only). */
export interface StickerTransform {
  x: number; // center, in canvas-fraction units (0-1) so it scales with canvas size
  y: number;
  scale: number; // 1 = original rendered size
  rotation: number; // degrees
  flipX: boolean;
}

export const DEFAULT_STICKER_TRANSFORM: StickerTransform = {
  x: 0.5,
  y: 0.5,
  scale: 1,
  rotation: 0,
  flipX: false,
};

/** Starting position/size per category — sensible defaults the user can then drag/resize freely. */
export const CATEGORY_DEFAULT_TRANSFORM: Record<ClothingCategory, StickerTransform> = {
  hijab: { x: 0.5, y: 0.13, scale: 1, rotation: 0, flipX: false },
  tops: { x: 0.5, y: 0.42, scale: 1, rotation: 0, flipX: false },
  bottoms: { x: 0.5, y: 0.7, scale: 1, rotation: 0, flipX: false },
  shoes: { x: 0.5, y: 0.92, scale: 1, rotation: 0, flipX: false },
  bag: { x: 0.78, y: 0.6, scale: 0.8, rotation: 0, flipX: false },
  accessories: { x: 0.5, y: 0.28, scale: 1, rotation: 0, flipX: false },
};

/** Rendered width at scale=1, as a fraction of canvas width — bigger for garments, smaller for accessories. */
export const CATEGORY_BASE_WIDTH_FRACTION: Record<ClothingCategory, number> = {
  hijab: 0.5,
  tops: 0.68,
  bottoms: 0.6,
  shoes: 0.42,
  bag: 0.32,
  accessories: 0.3,
};

/** One worn instance of a clothing item within the current outfit. Every
 * layer — clothing or accessory — carries a freeform transform so it can be
 * dragged/rotated/resized on the canvas. */
export interface OutfitLayer {
  layerId: string;
  itemId: string;
  category: ClothingCategory;
  order: number;
  hidden: boolean;
  transform: StickerTransform;
}

/** The full set of layers currently worn, keyed by category for convenience. */
export type OutfitLayers = Record<ClothingCategory, OutfitLayer[]>;

export function emptyOutfitLayers(): OutfitLayers {
  return {
    hijab: [],
    tops: [],
    bottoms: [],
    shoes: [],
    bag: [],
    accessories: [],
  };
}

export interface SavedOutfit {
  id: string;
  ownerId: string;
  name: string;
  layers: OutfitLayers;
  background: BackgroundSetting;
  thumbnailUrl?: string;
  notes?: string;
  favorite: boolean;
  dateCreated: string;
  dateEdited: string;
}

export interface BackgroundSetting {
  type: 'solid';
  color: string; // hex
}

export type ThemeMode = 'light' | 'dark' | 'system';

export interface RandomizerSettings {
  includeAccessories: boolean;
  maxAccessoryCount: number;
  excludeFavorites: boolean;
  favoritesOnly: boolean;
}

export interface AppSettings {
  theme: ThemeMode;
  animationsEnabled: boolean;
  background: BackgroundSetting;
  randomizer: RandomizerSettings;
  highContrast: boolean;
}

export const DEFAULT_BACKGROUND: BackgroundSetting = { type: 'solid', color: '#F5F2ED' };

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  animationsEnabled: true,
  background: DEFAULT_BACKGROUND,
  randomizer: {
    includeAccessories: true,
    maxAccessoryCount: 3,
    excludeFavorites: false,
    favoritesOnly: false,
  },
  highContrast: false,
};

/** The 19 deterministic color-matching modes. Pure metadata comparison — no AI. */
export type ColorMatchMode =
  | 'random'
  | 'monochrome'
  | 'analogous'
  | 'complementary'
  | 'split-complementary'
  | 'triadic'
  | 'tetradic'
  | 'neutral'
  | 'warm'
  | 'cool'
  | 'earth-tone'
  | 'pastel'
  | 'dark-palette'
  | 'light-palette'
  | 'high-contrast'
  | 'low-contrast'
  | 'color-pop'
  | 'black-white'
  | 'minimalist';

export interface WardrobeExportFile {
  formatVersion: 2;
  exportedAt: string;
  items: Array<Omit<ClothingItem, 'ownerId'>>;
  outfits: Array<Omit<SavedOutfit, 'ownerId'>>;
  settings: AppSettings;
}

/** Structured result the AI classification route returns for one photo. */
export interface AiClassificationResult {
  suggestedName: string;
  category: ClothingCategory;
  garmentType: string;
  material: Material | null;
  tags: string[];
  occasion: Occasion[];
  season: Season | null;
  confidence: number; // 0-1, purely informational
}
