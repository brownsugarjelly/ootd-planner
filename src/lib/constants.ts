import type { ClothingCategory, Material, Occasion, Pattern, Season } from './types';

export interface CategoryMeta {
  id: ClothingCategory;
  label: string;
  singular: string;
  required: boolean;
  examples: string[];
  icon: string; // lucide-react icon name, resolved in the UI layer
}

export const CATEGORY_META: Record<ClothingCategory, CategoryMeta> = {
  hijab: {
    id: 'hijab',
    label: 'Hijab',
    singular: 'Hijab',
    required: true,
    examples: ['Chiffon wrap', 'Instant hijab', 'Pashmina', 'Turban'],
    icon: 'Heart',
  },
  tops: {
    id: 'tops',
    label: 'Tops',
    singular: 'Top',
    required: true,
    examples: ['Shirt', 'Hoodie', 'Sweater', 'Blouse', 'Jacket', 'Coat'],
    icon: 'Shirt',
  },
  bottoms: {
    id: 'bottoms',
    label: 'Bottoms',
    singular: 'Bottom',
    required: true,
    examples: ['Jeans', 'Cargo pants', 'Skirt', 'Shorts', 'Trousers'],
    icon: 'Rows3',
  },
  shoes: {
    id: 'shoes',
    label: 'Shoes',
    singular: 'Shoes',
    required: true,
    examples: ['Sneakers', 'Boots', 'Heels', 'Flats', 'Sandals'],
    icon: 'Footprints',
  },
  bag: {
    id: 'bag',
    label: 'Bag',
    singular: 'Bag',
    required: false,
    examples: ['Tote', 'Backpack', 'Sling bag', 'Handbag'],
    icon: 'ShoppingBag',
  },
  accessories: {
    id: 'accessories',
    label: 'Accessories',
    singular: 'Accessory',
    required: false,
    examples: ['Sunglasses', 'Necklace', 'Belt', 'Pin', 'Hair clip', 'Phone', 'Keychain', 'Water bottle'],
    icon: 'Star',
  },
};

export const PRESET_TAGS: string[] = [
  'Cotton',
  'Linen',
  'Silk',
  'Denim',
  'Leather',
  'Formal',
  'Casual',
  'Office',
  'Wedding',
  'Party',
  'Winter',
  'Summer',
  'Oversized',
  'Minimalist',
  'Streetwear',
  'Vintage',
  'Sport',
  'Elegant',
  'Pink',
  'Blue',
  'Cream',
  'Brown',
  'Black',
  'White',
  'Earth Tone',
  'Pastel',
  'Warm Tone',
  'Cool Tone',
];

export const MATERIALS: Material[] = [
  'cotton',
  'linen',
  'silk',
  'denim',
  'leather',
  'wool',
  'polyester',
  'chiffon',
  'knit',
  'satin',
  'velvet',
  'other',
];

export const SEASONS: Season[] = ['spring', 'summer', 'autumn', 'winter', 'all-season'];

export const OCCASIONS: Occasion[] = [
  'casual',
  'office',
  'formal',
  'party',
  'wedding',
  'sport',
  'loungewear',
  'outdoor',
  'travel',
];

export const PATTERNS: Pattern[] = [
  'solid',
  'striped',
  'floral',
  'plaid',
  'polka-dot',
  'animal-print',
  'geometric',
  'graphic',
  'textured',
  'other',
];

export const BACKGROUND_PRESETS: { name: string; color: string }[] = [
  { name: 'White', color: '#FFFFFF' },
  { name: 'Cream', color: '#F5F2ED' },
  { name: 'Gray', color: '#D8D4CE' },
  { name: 'Pink', color: '#F3D9DE' },
  { name: 'Blue', color: '#D8E3EC' },
  { name: 'Green', color: '#DCE6D4' },
  { name: 'Black', color: '#1B1917' },
];

export function humanize(value: string): string {
  return value
    .replace(/-/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
