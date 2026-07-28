// All persistence now goes through Supabase (Postgres + Storage) instead of
// IndexedDB, so a signed-in user's wardrobe follows them across devices.
// Row <-> domain-object mapping lives here; nothing else in the app talks
// to Supabase directly except the auth screen.

import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient } from './supabase/client';
import { createThumbnail } from './imageUtils';
import {
  DEFAULT_SETTINGS,
  emptyOutfitLayers,
  type AppSettings,
  type ClothingItem,
  type ClothingItemInput,
  type OutfitLayers,
  type SavedOutfit,
} from './types';

const BUCKET = 'wardrobe';

function requireClient() {
  const client = getSupabaseClient();
  if (!client) throw new Error('Supabase is not configured yet.');
  return client;
}

async function currentUserId(): Promise<string> {
  const client = requireClient();
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) throw new Error('Not signed in.');
  return data.user.id;
}

async function uploadImage(blob: Blob, userId: string, prefix: string): Promise<string> {
  const client = requireClient();
  const path = `${userId}/${prefix}-${uuidv4()}.png`;
  const { error } = await client.storage.from(BUCKET).upload(path, blob, {
    contentType: 'image/png',
    upsert: false,
  });
  if (error) throw error;
  const { data } = client.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ---------- Row <-> domain mapping ----------

interface ClothingRow {
  id: string;
  owner_id: string;
  name: string;
  category: string;
  garment_type: string | null;
  image_url: string;
  original_image_url: string | null;
  thumbnail_url: string | null;
  primary_color: string;
  secondary_color: string | null;
  material: string | null;
  season: string;
  occasion: string[];
  pattern: string;
  brand: string | null;
  favorite: boolean;
  archived: boolean;
  notes: string | null;
  tags: string[];
  ai_processed: boolean;
  width: number;
  height: number;
  date_added: string;
  last_edited: string;
}

function rowToItem(row: ClothingRow): ClothingItem {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    category: row.category as ClothingItem['category'],
    garmentType: row.garment_type ?? undefined,
    imageUrl: row.image_url,
    originalImageUrl: row.original_image_url ?? undefined,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color ?? undefined,
    material: (row.material as ClothingItem['material']) ?? undefined,
    season: row.season as ClothingItem['season'],
    occasion: (row.occasion ?? []) as ClothingItem['occasion'],
    pattern: row.pattern as ClothingItem['pattern'],
    brand: row.brand ?? undefined,
    favorite: row.favorite,
    archived: row.archived,
    notes: row.notes ?? undefined,
    tags: row.tags ?? [],
    aiProcessed: row.ai_processed,
    width: row.width,
    height: row.height,
    dateAdded: row.date_added,
    lastEdited: row.last_edited,
  };
}

function itemToRowPatch(patch: Partial<ClothingItem>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (patch.name !== undefined) out.name = patch.name;
  if (patch.category !== undefined) out.category = patch.category;
  if (patch.garmentType !== undefined) out.garment_type = patch.garmentType;
  if (patch.imageUrl !== undefined) out.image_url = patch.imageUrl;
  if (patch.originalImageUrl !== undefined) out.original_image_url = patch.originalImageUrl;
  if (patch.thumbnailUrl !== undefined) out.thumbnail_url = patch.thumbnailUrl;
  if (patch.primaryColor !== undefined) out.primary_color = patch.primaryColor;
  if (patch.secondaryColor !== undefined) out.secondary_color = patch.secondaryColor;
  if (patch.material !== undefined) out.material = patch.material;
  if (patch.season !== undefined) out.season = patch.season;
  if (patch.occasion !== undefined) out.occasion = patch.occasion;
  if (patch.pattern !== undefined) out.pattern = patch.pattern;
  if (patch.brand !== undefined) out.brand = patch.brand;
  if (patch.favorite !== undefined) out.favorite = patch.favorite;
  if (patch.archived !== undefined) out.archived = patch.archived;
  if (patch.notes !== undefined) out.notes = patch.notes;
  if (patch.tags !== undefined) out.tags = patch.tags;
  if (patch.aiProcessed !== undefined) out.ai_processed = patch.aiProcessed;
  out.last_edited = new Date().toISOString();
  return out;
}

interface OutfitRow {
  id: string;
  owner_id: string;
  name: string;
  layers: OutfitLayers;
  background: SavedOutfit['background'];
  thumbnail_url: string | null;
  notes: string | null;
  favorite: boolean;
  date_created: string;
  date_edited: string;
}

function rowToOutfit(row: OutfitRow): SavedOutfit {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    layers: row.layers ?? emptyOutfitLayers(),
    background: row.background,
    thumbnailUrl: row.thumbnail_url ?? undefined,
    notes: row.notes ?? undefined,
    favorite: row.favorite,
    dateCreated: row.date_created,
    dateEdited: row.date_edited,
  };
}

// ---------- Clothing items ----------

export async function addClothingItem(
  input: ClothingItemInput,
  imageBlob: Blob,
  originalBlob?: Blob,
): Promise<ClothingItem> {
  const client = requireClient();
  const userId = await currentUserId();

  const thumbnailBlob = await createThumbnail(imageBlob).catch(() => undefined);
  const [imageUrl, originalImageUrl, thumbnailUrl] = await Promise.all([
    uploadImage(imageBlob, userId, 'item'),
    originalBlob ? uploadImage(originalBlob, userId, 'original') : Promise.resolve(undefined),
    thumbnailBlob ? uploadImage(thumbnailBlob, userId, 'thumb') : Promise.resolve(undefined),
  ]);

  const now = new Date().toISOString();
  const { data, error } = await client
    .from('clothing_items')
    .insert({
      owner_id: userId,
      name: input.name,
      category: input.category,
      garment_type: input.garmentType,
      image_url: imageUrl,
      original_image_url: originalImageUrl,
      thumbnail_url: thumbnailUrl,
      primary_color: input.primaryColor,
      secondary_color: input.secondaryColor,
      material: input.material,
      season: input.season,
      occasion: input.occasion,
      pattern: input.pattern,
      brand: input.brand,
      favorite: input.favorite,
      archived: input.archived,
      notes: input.notes,
      tags: input.tags,
      ai_processed: input.aiProcessed,
      width: input.width ?? 600,
      height: input.height ?? 800,
      date_added: now,
      last_edited: now,
    })
    .select()
    .single();

  if (error) throw error;
  return rowToItem(data as ClothingRow);
}

export async function updateClothingItem(id: string, patch: Partial<ClothingItem>): Promise<ClothingItem> {
  const client = requireClient();
  const { data, error } = await client
    .from('clothing_items')
    .update(itemToRowPatch(patch))
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return rowToItem(data as ClothingRow);
}

export async function duplicateClothingItem(item: ClothingItem): Promise<ClothingItem> {
  const client = requireClient();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('clothing_items')
    .insert({
      owner_id: userId,
      name: `${item.name} (Copy)`,
      category: item.category,
      garment_type: item.garmentType,
      image_url: item.imageUrl,
      original_image_url: item.originalImageUrl,
      thumbnail_url: item.thumbnailUrl,
      primary_color: item.primaryColor,
      secondary_color: item.secondaryColor,
      material: item.material,
      season: item.season,
      occasion: item.occasion,
      pattern: item.pattern,
      brand: item.brand,
      favorite: item.favorite,
      archived: item.archived,
      notes: item.notes,
      tags: item.tags,
      ai_processed: item.aiProcessed,
      width: item.width,
      height: item.height,
      date_added: now,
      last_edited: now,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToItem(data as ClothingRow);
}

export async function deleteClothingItem(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('clothing_items').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllClothingItems(): Promise<ClothingItem[]> {
  const client = requireClient();
  const { data, error } = await client.from('clothing_items').select('*').order('date_added', { ascending: true });
  if (error) throw error;
  return (data as ClothingRow[]).map(rowToItem);
}

// ---------- Outfits ----------

export async function addOutfit(
  input: Omit<SavedOutfit, 'id' | 'ownerId' | 'dateCreated' | 'dateEdited'>,
): Promise<SavedOutfit> {
  const client = requireClient();
  const userId = await currentUserId();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('outfits')
    .insert({
      owner_id: userId,
      name: input.name,
      layers: input.layers,
      background: input.background,
      thumbnail_url: input.thumbnailUrl,
      notes: input.notes,
      favorite: input.favorite,
      date_created: now,
      date_edited: now,
    })
    .select()
    .single();
  if (error) throw error;
  return rowToOutfit(data as OutfitRow);
}

export async function updateOutfit(id: string, patch: Partial<SavedOutfit>): Promise<SavedOutfit> {
  const client = requireClient();
  const rowPatch: Record<string, unknown> = { date_edited: new Date().toISOString() };
  if (patch.name !== undefined) rowPatch.name = patch.name;
  if (patch.layers !== undefined) rowPatch.layers = patch.layers;
  if (patch.background !== undefined) rowPatch.background = patch.background;
  if (patch.thumbnailUrl !== undefined) rowPatch.thumbnail_url = patch.thumbnailUrl;
  if (patch.notes !== undefined) rowPatch.notes = patch.notes;
  if (patch.favorite !== undefined) rowPatch.favorite = patch.favorite;

  const { data, error } = await client.from('outfits').update(rowPatch).eq('id', id).select().single();
  if (error) throw error;
  return rowToOutfit(data as OutfitRow);
}

export async function deleteOutfit(id: string): Promise<void> {
  const client = requireClient();
  const { error } = await client.from('outfits').delete().eq('id', id);
  if (error) throw error;
}

export async function getAllOutfits(): Promise<SavedOutfit[]> {
  const client = requireClient();
  const { data, error } = await client.from('outfits').select('*').order('date_created', { ascending: true });
  if (error) throw error;
  return (data as OutfitRow[]).map(rowToOutfit);
}

export async function uploadOutfitThumbnail(blob: Blob): Promise<string> {
  const userId = await currentUserId();
  return uploadImage(blob, userId, 'outfit-thumb');
}

// ---------- Settings ----------

export async function getSettings(): Promise<AppSettings> {
  const client = requireClient();
  const userId = await currentUserId();
  const { data, error } = await client.from('user_settings').select('data').eq('owner_id', userId).maybeSingle();
  if (error) throw error;
  if (!data) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...(data.data as Partial<AppSettings>) };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const client = requireClient();
  const userId = await currentUserId();
  const { error } = await client.from('user_settings').upsert({ owner_id: userId, data: settings });
  if (error) throw error;
}

// ---------- Full wipe ----------

export async function wipeAllCloudData(): Promise<void> {
  const client = requireClient();
  const userId = await currentUserId();
  await Promise.all([
    client.from('clothing_items').delete().eq('owner_id', userId),
    client.from('outfits').delete().eq('owner_id', userId),
    client.from('user_settings').delete().eq('owner_id', userId),
  ]);
}

export { uploadImage };
