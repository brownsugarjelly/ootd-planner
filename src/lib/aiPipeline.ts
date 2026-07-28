// Orchestrates everything that happens to a photo right after upload:
// 1. Remove the background client-side (WASM, free, no API key).
// 2. Extract dominant/secondary colors deterministically from pixels.
// 3. Ask Claude (server route) to classify/tag/name the garment.
// None of this generates or alters the garment's appearance — it only
// reads and organizes what the user already uploaded.

import { removeImageBackground } from './bgRemoval';
import { extractDominantColors } from './colorExtraction';
import type { AiClassificationResult, ClothingCategory, Material, Occasion, Season } from './types';
import { ALL_CATEGORIES } from './types';
import { MATERIALS, OCCASIONS, SEASONS } from './constants';

export interface PipelineResult {
  processedBlob: Blob;
  primaryColor: string;
  secondaryColor: string | null;
  classification: AiClassificationResult | null;
  classificationError: string | null;
}

function blobToBase64(blob: Blob): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const [header, base64] = dataUrl.split(',');
      const mediaType = header?.match(/data:(.*?);base64/)?.[1] ?? 'image/png';
      resolve({ base64: base64 ?? '', mediaType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function sanitizeClassification(raw: unknown): AiClassificationResult | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;

  const category = ALL_CATEGORIES.includes(r.category as ClothingCategory)
    ? (r.category as ClothingCategory)
    : 'tops';
  const material = MATERIALS.includes(r.material as Material) ? (r.material as Material) : null;
  const season = SEASONS.includes(r.season as Season) ? (r.season as Season) : null;
  const occasion = Array.isArray(r.occasion)
    ? (r.occasion.filter((o) => OCCASIONS.includes(o)) as Occasion[])
    : [];
  const tags = Array.isArray(r.tags) ? r.tags.filter((t): t is string => typeof t === 'string').slice(0, 8) : [];

  return {
    suggestedName:
      typeof r.suggestedName === 'string' && r.suggestedName.trim() ? r.suggestedName.trim() : 'New item',
    category,
    garmentType: typeof r.garmentType === 'string' ? r.garmentType : '',
    material,
    tags,
    occasion,
    season,
    confidence: typeof r.confidence === 'number' ? r.confidence : 0.5,
  };
}

/**
 * Runs the full pipeline. Background removal and color extraction always
 * run (fully client-side); classification is best-effort and will simply
 * come back null with an error message if ANTHROPIC_API_KEY isn't set on
 * the server yet — the caller should fall back to sensible defaults.
 */
export async function runUploadPipeline(file: File): Promise<PipelineResult> {
  const processedBlob = await removeImageBackground(file).catch(() => file);
  const objectUrl = URL.createObjectURL(processedBlob);

  let primaryColor = '#B8B2A6';
  let secondaryColor: string | null = null;
  try {
    const colors = await extractDominantColors(objectUrl);
    primaryColor = colors.primary;
    secondaryColor = colors.secondary;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }

  let classification: AiClassificationResult | null = null;
  let classificationError: string | null = null;
  try {
    const { base64, mediaType } = await blobToBase64(processedBlob);
    const res = await fetch('/api/analyze-clothing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, mediaType }),
    });
    const json = await res.json();
    if (!res.ok) {
      classificationError = json.error ?? 'Classification failed.';
    } else {
      classification = sanitizeClassification(json.result);
    }
  } catch (err) {
    classificationError = err instanceof Error ? err.message : 'Classification failed.';
  }

  return { processedBlob, primaryColor, secondaryColor, classification, classificationError };
}
