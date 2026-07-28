// Deterministic color-matching engine. Every mode here is pure metadata
// comparison against a clothing item's stored primary/secondary color —
// no AI, no model calls, just HSL math and simple heuristics.

import type { ClothingCategory, ClothingItem, ColorMatchMode, Pattern } from './types';
import {
  clamp01,
  hexToHsl,
  hueDistance,
  isBlackOrWhite,
  isCoolHue,
  isDarkTone,
  isEarthTone,
  isLightTone,
  isNeutral,
  isPastel,
  isWarmHue,
  type HSL,
} from './colorUtils';
import { ALL_CATEGORIES } from './types';

export interface ColorMatchModeMeta {
  id: ColorMatchMode;
  label: string;
  description: string;
}

export const COLOR_MATCH_MODES: ColorMatchModeMeta[] = [
  { id: 'random', label: 'Random', description: 'No color logic — pure surprise.' },
  { id: 'monochrome', label: 'Monochrome', description: 'One hue, varied in shade.' },
  { id: 'analogous', label: 'Analogous', description: 'Neighboring hues on the color wheel.' },
  { id: 'complementary', label: 'Complementary', description: 'Opposite hues for bold pairing.' },
  { id: 'split-complementary', label: 'Split Complementary', description: 'A hue plus both neighbors of its opposite.' },
  { id: 'triadic', label: 'Triadic', description: 'Three hues evenly spaced apart.' },
  { id: 'tetradic', label: 'Tetradic', description: 'Two complementary pairs together.' },
  { id: 'neutral', label: 'Neutral', description: 'Low-saturation, quiet tones.' },
  { id: 'warm', label: 'Warm', description: 'Reds, oranges, and warm yellows.' },
  { id: 'cool', label: 'Cool', description: 'Blues, greens, and violets.' },
  { id: 'earth-tone', label: 'Earth Tone', description: 'Browns, tans, and olive.' },
  { id: 'pastel', label: 'Pastel', description: 'Soft, light, gentle colors.' },
  { id: 'dark-palette', label: 'Dark Palette', description: 'Deep, moody shades throughout.' },
  { id: 'light-palette', label: 'Light Palette', description: 'Bright, airy shades throughout.' },
  { id: 'high-contrast', label: 'High Contrast', description: 'Alternating light and dark pieces.' },
  { id: 'low-contrast', label: 'Low Contrast', description: 'Similar tonal values throughout.' },
  { id: 'color-pop', label: 'Color Pop', description: 'Neutral base with one vivid accent.' },
  { id: 'black-white', label: 'Black & White', description: 'Strictly monochrome, no color.' },
  { id: 'minimalist', label: 'Minimalist', description: 'Solid, quiet, and restrained.' },
];

interface ModeContext {
  baseHue: number;
  baseLightness: number;
  index: number;
  popIndex: number;
}

function toleranceScore(distDeg: number, toleranceDeg: number): number {
  return clamp01(1 - distDeg / toleranceDeg);
}

/** Score a single HSL color's fit for a mode, in [0, 1]. Higher is better. */
export function scoreHslForMode(hsl: HSL, mode: ColorMatchMode, ctx: ModeContext): number {
  const { baseHue, baseLightness, index } = ctx;
  switch (mode) {
    case 'random':
      return Math.random();
    case 'monochrome':
      return toleranceScore(hueDistance(hsl.h, baseHue), 40);
    case 'analogous':
      return toleranceScore(hueDistance(hsl.h, baseHue), 32);
    case 'complementary': {
      const target = index % 2 === 0 ? baseHue : baseHue + 180;
      return toleranceScore(hueDistance(hsl.h, target), 28);
    }
    case 'split-complementary': {
      const targets = [baseHue, baseHue + 150, baseHue + 210];
      const target = targets[index % 3] as number;
      return toleranceScore(hueDistance(hsl.h, target), 26);
    }
    case 'triadic': {
      const targets = [baseHue, baseHue + 120, baseHue + 240];
      const target = targets[index % 3] as number;
      return toleranceScore(hueDistance(hsl.h, target), 26);
    }
    case 'tetradic': {
      const targets = [baseHue, baseHue + 90, baseHue + 180, baseHue + 270];
      const target = targets[index % 4] as number;
      return toleranceScore(hueDistance(hsl.h, target), 24);
    }
    case 'neutral':
      return isNeutral(hsl) ? 1 : clamp01(1 - hsl.s) * 0.55;
    case 'warm':
      return isWarmHue(hsl.h) ? 0.75 + clamp01(hsl.s) * 0.25 : 0.08;
    case 'cool':
      return isCoolHue(hsl.h) ? 0.75 + clamp01(hsl.s) * 0.25 : 0.08;
    case 'earth-tone':
      return isEarthTone(hsl) ? 1 : 0.1;
    case 'pastel':
      return isPastel(hsl) ? 1 : hsl.l >= 0.6 && hsl.s < 0.6 ? 0.4 : 0.05;
    case 'dark-palette':
      return isDarkTone(hsl) ? 1 : clamp01(1 - hsl.l) * 0.5;
    case 'light-palette':
      return isLightTone(hsl) ? 1 : clamp01(hsl.l) * 0.5;
    case 'high-contrast': {
      const targetL = index % 2 === 0 ? 0.85 : 0.15;
      return clamp01(1 - Math.abs(hsl.l - targetL));
    }
    case 'low-contrast':
      return clamp01(1 - Math.abs(hsl.l - baseLightness) * 1.4);
    case 'color-pop':
      return index === ctx.popIndex ? clamp01(hsl.s) : isNeutral(hsl) ? 1 : clamp01(1 - hsl.s) * 0.5;
    case 'black-white':
      return isBlackOrWhite(hsl) ? 1 : clamp01(1 - hsl.s) * 0.35;
    case 'minimalist':
      return hsl.s <= 0.3 ? 0.8 : clamp01(1 - hsl.s) * 0.4;
    default:
      return 0.5;
  }
}

function tagBonus(item: ClothingItem, mode: ColorMatchMode): number {
  const tags = item.tags.map((t) => t.toLowerCase());
  const has = (t: string) => tags.includes(t.toLowerCase());
  let bonus = 0;
  if (mode === 'minimalist' && (has('Minimalist') || item.pattern === 'solid')) bonus += 0.15;
  if (mode === 'earth-tone' && has('Earth Tone')) bonus += 0.15;
  if (mode === 'pastel' && has('Pastel')) bonus += 0.15;
  if (mode === 'warm' && has('Warm Tone')) bonus += 0.15;
  if (mode === 'cool' && has('Cool Tone')) bonus += 0.15;
  if (mode === 'black-white' && (has('Black') || has('White'))) bonus += 0.1;
  return bonus;
}

export interface ScoredItem {
  item: ClothingItem;
  score: number;
}

/** Rank a list of candidate items for a category against a color-match mode. */
export function rankItemsForMode(
  items: ClothingItem[],
  mode: ColorMatchMode,
  ctx: ModeContext,
): ScoredItem[] {
  return items
    .map((item) => {
      const hsl = hexToHsl(item.primaryColor);
      const base = scoreHslForMode(hsl, mode, ctx);
      const bonus = tagBonus(item, mode);
      return { item, score: clamp01(base + bonus) };
    })
    .sort((a, b) => b.score - a.score);
}

/** Pick a random hue [0, 360) seeded from a set of items, or fully random if empty. */
export function deriveBaseHue(seedItems: ClothingItem[]): number {
  if (seedItems.length === 0) return Math.floor(Math.random() * 360);
  const pick = seedItems[Math.floor(Math.random() * seedItems.length)] as ClothingItem;
  return hexToHsl(pick.primaryColor).h;
}

export function categoryPosition(category: ClothingCategory): number {
  return ALL_CATEGORIES.indexOf(category);
}

/** Rank items by closeness to a user-picked target hex color. */
export function rankItemsByColorDistance(items: ClothingItem[], targetHex: string): ScoredItem[] {
  const targetHsl = hexToHsl(targetHex);
  return items
    .map((item) => {
      const hsl = hexToHsl(item.primaryColor);
      const hueTerm = hueDistance(hsl.h, targetHsl.h) / 180;
      const satTerm = Math.abs(hsl.s - targetHsl.s);
      const lightTerm = Math.abs(hsl.l - targetHsl.l);
      const distance = hueTerm * 0.55 + satTerm * 0.2 + lightTerm * 0.25;
      return { item, score: clamp01(1 - distance) };
    })
    .sort((a, b) => b.score - a.score);
}

export type { ModeContext };
export type { Pattern };
