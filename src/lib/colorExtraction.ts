// Extracts dominant/secondary colors directly from a garment image's pixels.
// This is plain canvas + histogram quantization — not AI — because reading
// actual pixel data is more accurate than asking a vision model to guess a
// hex code, and it's free and instant.

import { rgbToHex } from './colorUtils';

interface Bucket {
  count: number;
  rSum: number;
  gSum: number;
  bSum: number;
}

/** Quantize a channel 0-255 into 8 buckets to group similar colors together. */
function bucketIndex(v: number): number {
  return Math.min(7, Math.floor(v / 32));
}

export interface ExtractedColors {
  primary: string;
  secondary: string | null;
}

export async function extractDominantColors(imageUrl: string): Promise<ExtractedColors> {
  const img = await loadImage(imageUrl);
  const canvas = document.createElement('canvas');
  const maxDim = 160; // downsample — we only need a representative sample
  const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { primary: '#B8B2A6', secondary: null };
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  } catch {
    // Canvas may be tainted if the image isn't same-origin/CORS-enabled.
    return { primary: '#B8B2A6', secondary: null };
  }

  const buckets = new Map<string, Bucket>();

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] as number;
    const g = data[i + 1] as number;
    const b = data[i + 2] as number;
    const a = data[i + 3] as number;
    if (a < 40) continue; // skip transparent background pixels
    const key = `${bucketIndex(r)}-${bucketIndex(g)}-${bucketIndex(b)}`;
    const existing = buckets.get(key);
    if (existing) {
      existing.count += 1;
      existing.rSum += r;
      existing.gSum += g;
      existing.bSum += b;
    } else {
      buckets.set(key, { count: 1, rSum: r, gSum: g, bSum: b });
    }
  }

  const sorted = Array.from(buckets.values()).sort((a, b) => b.count - a.count);

  if (sorted.length === 0) return { primary: '#B8B2A6', secondary: null };

  const top = sorted[0] as Bucket;
  const primary = rgbToHex({ r: top.rSum / top.count, g: top.gSum / top.count, b: top.bSum / top.count });

  const totalCounted = sorted.reduce((sum, b) => sum + b.count, 0);
  const second = sorted[1];
  const secondary =
    second && second.count / totalCounted > 0.12
      ? rgbToHex({ r: second.rSum / second.count, g: second.gSum / second.count, b: second.bSum / second.count })
      : null;

  return { primary, secondary };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
