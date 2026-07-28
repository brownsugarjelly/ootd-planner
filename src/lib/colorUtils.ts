// Deterministic color math only — hex/HSL conversion, distance, and
// classification helpers. No network calls, no AI, no external services.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number; // 0-360
  s: number; // 0-1
  l: number; // 0-1
}

export function hexToRgb(hex: string): RGB {
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const int = parseInt(clean, 16);
  if (Number.isNaN(int) || clean.length !== 6) {
    return { r: 200, g: 200, b: 200 };
  }
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) {
    return { h: 0, s: 0, l };
  }
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case rn:
      h = ((gn - bn) / d + (gn < bn ? 6 : 0)) * 60;
      break;
    case gn:
      h = ((bn - rn) / d + 2) * 60;
      break;
    default:
      h = ((rn - gn) / d + 4) * 60;
      break;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let tt = t;
    if (tt < 0) tt += 1;
    if (tt > 1) tt -= 1;
    if (tt < 1 / 6) return p + (q - p) * 6 * tt;
    if (tt < 1 / 2) return q;
    if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hn = h / 360;
  const r = hue2rgb(p, q, hn + 1 / 3);
  const g = hue2rgb(p, q, hn);
  const b = hue2rgb(p, q, hn - 1 / 3);
  return { r: r * 255, g: g * 255, b: b * 255 };
}

export function hexToHsl(hex: string): HSL {
  return rgbToHsl(hexToRgb(hex));
}

export function hslToHex(hsl: HSL): string {
  return rgbToHex(hslToRgb(hsl));
}

/** Shortest angular distance between two hues, in degrees [0, 180]. */
export function hueDistance(a: number, b: number): number {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

/** Rough perceptual distance between two hex colors, in a 0-1 range. */
export function colorDistance(hexA: string, hexB: string): number {
  const a = hexToHsl(hexA);
  const b = hexToHsl(hexB);
  const hueTerm = hueDistance(a.h, b.h) / 180; // 0-1
  const satTerm = Math.abs(a.s - b.s);
  const lightTerm = Math.abs(a.l - b.l);
  return hueTerm * 0.5 + satTerm * 0.25 + lightTerm * 0.25;
}

export function isNeutral(hsl: HSL): boolean {
  return hsl.s <= 0.16 || hsl.l <= 0.08 || hsl.l >= 0.94;
}

export function isWarmHue(h: number): boolean {
  return h <= 65 || h >= 300;
}

export function isCoolHue(h: number): boolean {
  return h > 95 && h < 300;
}

export function isEarthTone(hsl: HSL): boolean {
  const warmEarth = hsl.h >= 18 && hsl.h <= 55 && hsl.s >= 0.12 && hsl.s <= 0.75 && hsl.l >= 0.15 && hsl.l <= 0.7;
  const oliveEarth = hsl.h > 55 && hsl.h <= 95 && hsl.s >= 0.1 && hsl.s <= 0.55 && hsl.l >= 0.15 && hsl.l <= 0.6;
  return warmEarth || oliveEarth;
}

export function isPastel(hsl: HSL): boolean {
  return hsl.l >= 0.75 && hsl.s >= 0.12 && hsl.s <= 0.55;
}

export function isDarkTone(hsl: HSL): boolean {
  return hsl.l <= 0.32;
}

export function isLightTone(hsl: HSL): boolean {
  return hsl.l >= 0.78;
}

export function isBlackOrWhite(hsl: HSL): boolean {
  return hsl.s <= 0.12 && (hsl.l <= 0.18 || hsl.l >= 0.88);
}

/** Clamp a value between 0 and 1. */
export function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

/** Readable label for a hex color's closest family, used in outfit info panels. */
export function colorFamilyName(hex: string): string {
  const hsl = hexToHsl(hex);
  if (isBlackOrWhite(hsl)) return hsl.l >= 0.5 ? 'White' : 'Black';
  if (hsl.s <= 0.14) return 'Gray';
  const h = hsl.h;
  const families: [number, string][] = [
    [15, 'Red'],
    [45, 'Orange'],
    [65, 'Yellow'],
    [90, 'Chartreuse'],
    [150, 'Green'],
    [190, 'Teal'],
    [220, 'Blue'],
    [255, 'Indigo'],
    [290, 'Purple'],
    [330, 'Magenta'],
    [360, 'Red'],
  ];
  for (const [max, name] of families) {
    if (h <= max) return name;
  }
  return 'Red';
}
