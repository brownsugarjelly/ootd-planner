'use client';

import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { getSupabaseClient, supabaseConfigured } from './supabase/client';
import * as cloud from './cloudDb';
import {
  ALL_CATEGORIES,
  CATEGORY_DEFAULT_TRANSFORM,
  CATEGORY_LAYER_BAND,
  DEFAULT_SETTINGS,
  emptyOutfitLayers,
  isRequiredCategory,
  type AppSettings,
  type ClothingCategory,
  type ClothingItem,
  type ClothingItemInput,
  type ColorMatchMode,
  type OutfitLayer,
  type OutfitLayers,
  type SavedOutfit,
} from './types';
import { generateOutfit } from './randomizer';
import { runUploadPipeline } from './aiPipeline';
import { buildWardrobeExport, downloadWardrobeExport, parseWardrobeExport, urlToBlob } from './importExportWardrobe';

export interface WardrobeFilters {
  query: string;
  categories: ClothingCategory[];
  materials: string[];
  occasions: string[];
  seasons: string[];
  patterns: string[];
  colors: string[];
  brands: string[];
  tags: string[];
  favoritesOnly: boolean;
  includeArchived: boolean;
}

const EMPTY_FILTERS: WardrobeFilters = {
  query: '',
  categories: [],
  materials: [],
  occasions: [],
  seasons: [],
  patterns: [],
  colors: [],
  brands: [],
  tags: [],
  favoritesOnly: false,
  includeArchived: false,
};

export type UploadStatus = 'removing-background' | 'classifying' | 'saving' | 'done' | 'error';

export interface UploadTask {
  id: string;
  fileName: string;
  status: UploadStatus;
  error?: string;
}

interface WardrobeState {
  // --- auth ---
  configured: boolean;
  authReady: boolean;
  session: Session | null;
  authError: string | null;
  initAuth: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<string | null>;
  signUpWithPassword: (email: string, password: string) => Promise<string | null>;
  signInWithMagicLink: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;

  // --- data ---
  ready: boolean;
  items: ClothingItem[];
  outfits: SavedOutfit[];
  settings: AppSettings;
  loadWardrobe: () => Promise<void>;

  // --- uploads ---
  uploadTasks: UploadTask[];
  uploadItems: (files: File[]) => Promise<void>;
  updateItem: (id: string, patch: Partial<ClothingItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  duplicateItem: (id: string) => Promise<void>;
  toggleFavoriteItem: (id: string) => Promise<void>;
  toggleArchiveItem: (id: string) => Promise<void>;

  // --- filters ---
  filters: WardrobeFilters;
  setFilters: (patch: Partial<WardrobeFilters>) => void;
  resetFilters: () => void;

  // --- outfit builder (multi-layer) ---
  layers: OutfitLayers;
  selectedStickerLayerId: string | null;
  activeOutfitId: string | null;
  addLayer: (category: ClothingCategory, itemId: string) => void;
  removeLayer: (layerId: string) => void;
  toggleLayerHidden: (layerId: string) => void;
  duplicateLayer: (layerId: string) => void;
  moveLayer: (layerId: string, direction: 'up' | 'down') => void;
  bringLayerForward: (layerId: string) => void;
  sendLayerBackward: (layerId: string) => void;
  updateStickerTransform: (layerId: string, patch: Partial<OutfitLayer['transform']>) => void;
  selectSticker: (layerId: string | null) => void;
  clearOutfit: () => void;

  colorMode: ColorMatchMode;
  targetColor: string | null;
  setColorMode: (mode: ColorMatchMode) => void;
  setTargetColor: (hex: string | null) => void;
  randomizeOutfit: () => void;

  setBackground: (hex: string) => Promise<void>;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  resetPreferences: () => Promise<void>;

  saveCurrentOutfit: (name: string, notes: string, thumbnailBlob?: Blob) => Promise<void>;
  loadOutfit: (id: string) => void;
  deleteOutfitById: (id: string) => Promise<void>;
  toggleFavoriteOutfit: (id: string) => Promise<void>;

  exportWardrobe: () => Promise<void>;
  importWardrobe: (file: File) => Promise<{ itemCount: number; outfitCount: number }>;
  wipeAllData: () => Promise<void>;
}

let taskCounter = 0;

export const useWardrobeStore = create<WardrobeState>((set, get) => ({
  configured: supabaseConfigured,
  authReady: false,
  session: null,
  authError: null,

  initAuth: async () => {
    const client = getSupabaseClient();
    if (!client) {
      set({ authReady: true });
      return;
    }
    const { data } = await client.auth.getSession();
    set({ session: data.session, authReady: true });
    if (data.session) get().loadWardrobe();

    client.auth.onAuthStateChange((_event, session) => {
      set({ session });
      if (session) {
        get().loadWardrobe();
      } else {
        set({ items: [], outfits: [], settings: DEFAULT_SETTINGS, ready: false, layers: emptyOutfitLayers() });
      }
    });
  },

  signInWithPassword: async (email, password) => {
    const client = getSupabaseClient();
    if (!client) return 'Backend is not configured yet.';
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error?.message ?? null;
  },

  signUpWithPassword: async (email, password) => {
    const client = getSupabaseClient();
    if (!client) return 'Backend is not configured yet.';
    const { error } = await client.auth.signUp({ email, password });
    return error?.message ?? null;
  },

  signInWithMagicLink: async (email) => {
    const client = getSupabaseClient();
    if (!client) return 'Backend is not configured yet.';
    const { error } = await client.auth.signInWithOtp({ email });
    return error?.message ?? null;
  },

  signOut: async () => {
    const client = getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
  },

  ready: false,
  items: [],
  outfits: [],
  settings: DEFAULT_SETTINGS,

  loadWardrobe: async () => {
    const [items, outfits, settings] = await Promise.all([
      cloud.getAllClothingItems(),
      cloud.getAllOutfits(),
      cloud.getSettings(),
    ]);
    set({ items, outfits, settings, ready: true });
  },

  uploadTasks: [],

  uploadItems: async (files) => {
    for (const file of files) {
      const taskId = `task-${taskCounter++}`;
      set((state) => ({
        uploadTasks: [...state.uploadTasks, { id: taskId, fileName: file.name, status: 'removing-background' }],
      }));

      try {
        set((state) => ({
          uploadTasks: state.uploadTasks.map((t) => (t.id === taskId ? { ...t, status: 'classifying' } : t)),
        }));
        // eslint-disable-next-line no-await-in-loop
        const pipeline = await runUploadPipeline(file);

        set((state) => ({
          uploadTasks: state.uploadTasks.map((t) => (t.id === taskId ? { ...t, status: 'saving' } : t)),
        }));

        const c = pipeline.classification;
        const input: ClothingItemInput = {
          name: c?.suggestedName || file.name.replace(/\.[^/.]+$/, ''),
          category: c?.category ?? 'tops',
          garmentType: c?.garmentType,
          imageUrl: '',
          primaryColor: pipeline.primaryColor,
          secondaryColor: pipeline.secondaryColor ?? undefined,
          material: c?.material ?? undefined,
          season: c?.season ?? 'all-season',
          occasion: c?.occasion ?? [],
          pattern: 'solid',
          favorite: false,
          archived: false,
          tags: c?.tags ?? [],
          aiProcessed: Boolean(c),
        };

        // eslint-disable-next-line no-await-in-loop
        const saved = await cloud.addClothingItem(input, pipeline.processedBlob, file);
        set((state) => ({
          items: [...state.items, saved],
          uploadTasks: state.uploadTasks.map((t) => (t.id === taskId ? { ...t, status: 'done' } : t)),
        }));
      } catch (err) {
        set((state) => ({
          uploadTasks: state.uploadTasks.map((t) =>
            t.id === taskId
              ? { ...t, status: 'error', error: err instanceof Error ? err.message : 'Upload failed.' }
              : t,
          ),
        }));
      }
    }
    setTimeout(() => {
      set((state) => ({ uploadTasks: state.uploadTasks.filter((t) => t.status !== 'done') }));
    }, 3000);
  },

  updateItem: async (id, patch) => {
    const updated = await cloud.updateClothingItem(id, patch);
    set((state) => ({ items: state.items.map((i) => (i.id === id ? updated : i)) }));
  },

  deleteItem: async (id) => {
    await cloud.deleteClothingItem(id);
    set((state) => ({
      items: state.items.filter((i) => i.id !== id),
      layers: Object.fromEntries(
        ALL_CATEGORIES.map((cat) => [cat, state.layers[cat].filter((l) => l.itemId !== id)]),
      ) as OutfitLayers,
    }));
  },

  duplicateItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    const copy = await cloud.duplicateClothingItem(item);
    set((state) => ({ items: [...state.items, copy] }));
  },

  toggleFavoriteItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    await get().updateItem(id, { favorite: !item.favorite });
  },

  toggleArchiveItem: async (id) => {
    const item = get().items.find((i) => i.id === id);
    if (!item) return;
    await get().updateItem(id, { archived: !item.archived });
  },

  filters: EMPTY_FILTERS,
  setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
  resetFilters: () => set({ filters: EMPTY_FILTERS }),

  layers: emptyOutfitLayers(),
  selectedStickerLayerId: null,
  activeOutfitId: null,

  addLayer: (category, itemId) => {
    const state = get();
    const bandLayers = state.layers[category];
    const maxOrder =
      bandLayers.length > 0 ? Math.max(...bandLayers.map((l) => l.order)) : CATEGORY_LAYER_BAND[category] - 1;
    const newLayer: OutfitLayer = {
      layerId: uuidv4(),
      itemId,
      category,
      order: maxOrder + 1,
      hidden: false,
      transform: { ...CATEGORY_DEFAULT_TRANSFORM[category] },
    };
    set({
      layers: { ...state.layers, [category]: [...bandLayers, newLayer] },
      selectedStickerLayerId: newLayer.layerId,
    });
  },

  removeLayer: (layerId) => {
    const state = get();
    const next = { ...state.layers };
    for (const cat of ALL_CATEGORIES) {
      next[cat] = next[cat].filter((l) => l.layerId !== layerId);
    }
    set({
      layers: next,
      selectedStickerLayerId: state.selectedStickerLayerId === layerId ? null : state.selectedStickerLayerId,
    });
  },

  toggleLayerHidden: (layerId) => {
    const state = get();
    const next = { ...state.layers };
    for (const cat of ALL_CATEGORIES) {
      next[cat] = next[cat].map((l) => (l.layerId === layerId ? { ...l, hidden: !l.hidden } : l));
    }
    set({ layers: next });
  },

  duplicateLayer: (layerId) => {
    const state = get();
    for (const cat of ALL_CATEGORIES) {
      const found = state.layers[cat].find((l) => l.layerId === layerId);
      if (found) {
        const copy: OutfitLayer = {
          ...found,
          layerId: uuidv4(),
          order: found.order + 0.5,
          transform: {
            ...found.transform,
            x: Math.min(0.95, found.transform.x + 0.04),
            y: Math.min(0.95, found.transform.y + 0.04),
          },
        };
        set({
          layers: { ...state.layers, [cat]: [...state.layers[cat], copy] },
          selectedStickerLayerId: copy.layerId,
        });
        return;
      }
    }
  },

  moveLayer: (layerId, direction) => {
    const state = get();
    for (const cat of ALL_CATEGORIES) {
      const list = [...state.layers[cat]].sort((a, b) => a.order - b.order);
      const idx = list.findIndex((l) => l.layerId === layerId);
      if (idx === -1) continue;
      const swapIdx = direction === 'up' ? idx + 1 : idx - 1;
      if (swapIdx < 0 || swapIdx >= list.length) return;
      const a = list[idx] as OutfitLayer;
      const b = list[swapIdx] as OutfitLayer;
      const aOrder = a.order;
      const bOrder = b.order;
      const updatedList = list.map((l) => {
        if (l.layerId === a.layerId) return { ...l, order: bOrder };
        if (l.layerId === b.layerId) return { ...l, order: aOrder };
        return l;
      });
      set({ layers: { ...state.layers, [cat]: updatedList } });
      return;
    }
  },

  bringLayerForward: (layerId) => {
    const state = get();
    for (const cat of ALL_CATEGORIES) {
      const list = [...state.layers[cat]].sort((a, b) => a.order - b.order);
      const idx = list.findIndex((l) => l.layerId === layerId);
      if (idx === -1) continue;
      if (idx === list.length - 1) return;
      const a = list[idx] as OutfitLayer;
      const b = list[idx + 1] as OutfitLayer;
      const updated = list.map((l) => {
        if (l.layerId === a.layerId) return { ...l, order: b.order };
        if (l.layerId === b.layerId) return { ...l, order: a.order };
        return l;
      });
      set({ layers: { ...state.layers, [cat]: updated } });
      return;
    }
  },

  sendLayerBackward: (layerId) => {
    const state = get();
    for (const cat of ALL_CATEGORIES) {
      const list = [...state.layers[cat]].sort((a, b) => a.order - b.order);
      const idx = list.findIndex((l) => l.layerId === layerId);
      if (idx === -1) continue;
      if (idx <= 0) return;
      const a = list[idx] as OutfitLayer;
      const b = list[idx - 1] as OutfitLayer;
      const updated = list.map((l) => {
        if (l.layerId === a.layerId) return { ...l, order: b.order };
        if (l.layerId === b.layerId) return { ...l, order: a.order };
        return l;
      });
      set({ layers: { ...state.layers, [cat]: updated } });
      return;
    }
  },

  updateStickerTransform: (layerId, patch) => {
    const state = get();
    for (const cat of ALL_CATEGORIES) {
      const idx = state.layers[cat].findIndex((l) => l.layerId === layerId);
      if (idx === -1) continue;
      const list = state.layers[cat].map((l) =>
        l.layerId === layerId ? { ...l, transform: { ...l.transform, ...patch } } : l,
      );
      set({ layers: { ...state.layers, [cat]: list } });
      return;
    }
  },

  selectSticker: (layerId) => set({ selectedStickerLayerId: layerId }),

  clearOutfit: () => set({ layers: emptyOutfitLayers(), activeOutfitId: null, selectedStickerLayerId: null }),

  colorMode: 'random',
  targetColor: null,
  setColorMode: (mode) => set({ colorMode: mode }),
  setTargetColor: (hex) => set({ targetColor: hex }),

  randomizeOutfit: () => {
    const state = get();
    const itemsByCategory = Object.fromEntries(
      ALL_CATEGORIES.map((c) => [c, state.items.filter((i) => i.category === c && !i.archived)]),
    ) as Record<ClothingCategory, ClothingItem[]>;
    const layers = generateOutfit({
      itemsByCategory,
      mode: state.colorMode,
      settings: state.settings.randomizer,
      baseColorHex: state.targetColor ?? undefined,
    });
    set({ layers, activeOutfitId: null, selectedStickerLayerId: null });
  },

  setBackground: async (hex) => {
    const settings = { ...get().settings, background: { type: 'solid' as const, color: hex } };
    await cloud.saveSettings(settings);
    set({ settings });
  },

  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    await cloud.saveSettings(settings);
    set({ settings });
  },

  resetPreferences: async () => {
    await cloud.saveSettings(DEFAULT_SETTINGS);
    set({ settings: DEFAULT_SETTINGS });
  },

  saveCurrentOutfit: async (name, notes, thumbnailBlob) => {
    const state = get();
    const thumbnailUrl = thumbnailBlob
      ? await cloud.uploadOutfitThumbnail(thumbnailBlob).catch(() => undefined)
      : undefined;
    const activeId = state.activeOutfitId;
    if (activeId) {
      const updated = await cloud.updateOutfit(activeId, {
        name,
        notes,
        layers: state.layers,
        background: state.settings.background,
        ...(thumbnailUrl ? { thumbnailUrl } : {}),
      });
      set((s) => ({ outfits: s.outfits.map((o) => (o.id === activeId ? updated : o)) }));
      return;
    }
    const created = await cloud.addOutfit({
      name,
      notes,
      layers: state.layers,
      background: state.settings.background,
      favorite: false,
      thumbnailUrl,
    });
    set((s) => ({ outfits: [...s.outfits, created], activeOutfitId: created.id }));
  },

  loadOutfit: (id) => {
    const outfit = get().outfits.find((o) => o.id === id);
    if (!outfit) return;
    set((state) => ({
      layers: outfit.layers,
      activeOutfitId: outfit.id,
      selectedStickerLayerId: null,
      settings: { ...state.settings, background: outfit.background },
    }));
  },

  deleteOutfitById: async (id) => {
    await cloud.deleteOutfit(id);
    set((state) => ({
      outfits: state.outfits.filter((o) => o.id !== id),
      activeOutfitId: state.activeOutfitId === id ? null : state.activeOutfitId,
    }));
  },

  toggleFavoriteOutfit: async (id) => {
    const outfit = get().outfits.find((o) => o.id === id);
    if (!outfit) return;
    const updated = await cloud.updateOutfit(id, { favorite: !outfit.favorite });
    set((state) => ({ outfits: state.outfits.map((o) => (o.id === id ? updated : o)) }));
  },

  exportWardrobe: async () => {
    const { items, outfits, settings } = get();
    const file = buildWardrobeExport(items, outfits, settings);
    downloadWardrobeExport(file, `wardrobe-backup-${new Date().toISOString().slice(0, 10)}.json`);
  },

  importWardrobe: async (file) => {
    const text = await file.text();
    const parsed = parseWardrobeExport(JSON.parse(text));

    const idMap = new Map<string, string>();

    for (const item of parsed.items) {
      // eslint-disable-next-line no-await-in-loop
      const blob = await urlToBlob(item.imageUrl).catch(() => null);
      if (!blob) continue;
      // eslint-disable-next-line no-await-in-loop
      const saved = await cloud.addClothingItem(
        {
          name: item.name,
          category: item.category,
          garmentType: item.garmentType,
          imageUrl: '',
          primaryColor: item.primaryColor,
          secondaryColor: item.secondaryColor,
          material: item.material,
          season: item.season,
          occasion: item.occasion,
          pattern: item.pattern,
          brand: item.brand,
          favorite: item.favorite,
          archived: item.archived,
          notes: item.notes,
          tags: item.tags,
          aiProcessed: item.aiProcessed,
          width: item.width,
          height: item.height,
        },
        blob,
      );
      idMap.set(item.id, saved.id);
      set((state) => ({ items: [...state.items, saved] }));
    }

    for (const outfit of parsed.outfits) {
      const remappedLayers = emptyOutfitLayers();
      for (const cat of ALL_CATEGORIES) {
        remappedLayers[cat] = outfit.layers[cat]
          .map((l) => ({ ...l, layerId: uuidv4(), itemId: idMap.get(l.itemId) ?? l.itemId }))
          .filter((l) => idMap.has(l.itemId));
      }
      // eslint-disable-next-line no-await-in-loop
      const saved = await cloud.addOutfit({
        name: outfit.name,
        layers: remappedLayers,
        background: outfit.background,
        notes: outfit.notes,
        favorite: outfit.favorite,
        thumbnailUrl: outfit.thumbnailUrl,
      });
      set((state) => ({ outfits: [...state.outfits, saved] }));
    }

    if (parsed.settings) {
      await cloud.saveSettings(parsed.settings);
      set({ settings: parsed.settings });
    }

    return { itemCount: parsed.items.length, outfitCount: parsed.outfits.length };
  },

  wipeAllData: async () => {
    await cloud.wipeAllCloudData();
    set({ items: [], outfits: [], settings: DEFAULT_SETTINGS, layers: emptyOutfitLayers(), activeOutfitId: null });
  },
}));

export function requiredCategoriesFilled(items: ClothingItem[], layers: OutfitLayers): boolean {
  return ALL_CATEGORIES.filter(isRequiredCategory).every((c) => {
    const hasAny = items.some((i) => i.category === c && !i.archived);
    return !hasAny || layers[c].some((l) => !l.hidden);
  });
}
