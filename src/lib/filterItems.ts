import type { ClothingItem } from './types';
import type { WardrobeFilters } from './store';

export function filterClothingItems(items: ClothingItem[], filters: WardrobeFilters): ClothingItem[] {
  const q = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (!filters.includeArchived && item.archived) return false;
    if (filters.favoritesOnly && !item.favorite) return false;
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) return false;
    if (filters.materials.length > 0 && (!item.material || !filters.materials.includes(item.material))) return false;
    if (filters.seasons.length > 0 && !filters.seasons.includes(item.season)) return false;
    if (filters.patterns.length > 0 && !filters.patterns.includes(item.pattern)) return false;
    if (filters.occasions.length > 0 && !item.occasion.some((o) => filters.occasions.includes(o))) return false;
    if (filters.brands.length > 0 && (!item.brand || !filters.brands.includes(item.brand))) return false;
    if (filters.tags.length > 0 && !filters.tags.every((t) => item.tags.includes(t))) return false;
    if (filters.colors.length > 0 && !filters.colors.includes(item.primaryColor)) return false;

    if (q) {
      const haystack = [
        item.name,
        item.material ?? '',
        item.brand ?? '',
        ...item.occasion,
        ...item.tags,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }

    return true;
  });
}

export function collectBrands(items: ClothingItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.brand).filter((b): b is string => Boolean(b)))).sort();
}

export function collectAllTags(items: ClothingItem[]): string[] {
  return Array.from(new Set(items.flatMap((i) => i.tags))).sort();
}
