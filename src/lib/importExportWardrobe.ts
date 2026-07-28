// Backup/restore for the cloud wardrobe. Export bundles item/outfit rows
// (including their current cloud image URLs) and settings into one JSON
// file. Import re-fetches each image and re-uploads it into the signed-in
// account's own storage, so a backup can also be used to move data between
// accounts.

import type { AppSettings, ClothingItem, SavedOutfit, WardrobeExportFile } from './types';

export function buildWardrobeExport(
  items: ClothingItem[],
  outfits: SavedOutfit[],
  settings: AppSettings,
): WardrobeExportFile {
  return {
    formatVersion: 2,
    exportedAt: new Date().toISOString(),
    items: items.map(({ ownerId: _ownerId, ...rest }) => rest),
    outfits: outfits.map(({ ownerId: _ownerId, ...rest }) => rest),
    settings,
  };
}

export function downloadWardrobeExport(file: WardrobeExportFile, fileName = 'wardrobe-backup.json'): void {
  const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export interface ParsedWardrobeImport {
  items: Array<Omit<ClothingItem, 'ownerId'>>;
  outfits: Array<Omit<SavedOutfit, 'ownerId'>>;
  settings: AppSettings;
}

export function parseWardrobeExport(json: unknown): ParsedWardrobeImport {
  const file = json as WardrobeExportFile;
  if (!file || file.formatVersion !== 2 || !Array.isArray(file.items)) {
    throw new Error('This file is not a recognized wardrobe backup (expected format v2).');
  }
  return { items: file.items, outfits: file.outfits ?? [], settings: file.settings };
}

export async function urlToBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not download image from backup (${res.status}).`);
  return res.blob();
}
