# Wardrobe — a local, AI-free outfit planner

A dress-up-game-style wardrobe planner. You upload real (ideally transparent PNG)
photos of your own clothes, and the app layers them into outfits on a canvas —
no avatar, no body, no face, no AI at runtime. Every matching, randomizing, and
filtering feature is plain deterministic code running against metadata you
control. Everything lives in your browser (IndexedDB); there is no backend,
no login, and no network calls once the app is loaded.

---

## 1. Architecture

- **Framework:** Next.js 14 (App Router), statically exported (`output: 'export'`)
  — the build produces a plain `out/` folder of HTML/CSS/JS that can be hosted
  anywhere (Vercel, Netlify, GitHub Pages, S3, or opened from disk).
- **Language:** TypeScript, `strict` mode.
- **Styling:** Tailwind CSS with a custom design-token palette (see
  `tailwind.config.js`) — a warm "atelier" theme (cream canvas, rose "thread"
  accent, sage green) with a serif display face (Fraunces) and Inter for body
  text, self-hosted via `@fontsource` so there are no runtime font requests.
- **State:** Zustand (`src/lib/store.ts`) is the single source of truth for
  wardrobe items, saved outfits, the current outfit selection, filters, and
  settings. It's a thin, typed wrapper around the persistence layer.
- **Persistence:** IndexedDB via the `idb` library (`src/lib/db.ts`). Clothing
  images are stored as `Blob`s directly (not base64), which is far more
  space- and CPU-efficient in IndexedDB. Object URLs are (re)created at
  runtime and never persisted.
- **No AI, no backend:** there is no server, no API route, no model call
  anywhere in this codebase. The "color matching" and "randomizer" are
  conventional metadata scoring and weighted-random selection, fully
  inspectable in `src/lib/colorMatch.ts` and `src/lib/randomizer.ts`.

## 2. Folder structure

```
wardrobe-planner/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx        # root layout, metadata, global.css import
│  │  ├─ page.tsx           # mounts <AppShell />
│  │  └─ globals.css        # design tokens, fonts, base styles
│  ├─ components/
│  │  ├─ layout/            # AppShell, AppHeader, BottomNav, CollapsiblePanel
│  │  ├─ wardrobe/           # left panel: upload, search, filters, grid, edit modal
│  │  ├─ outfit/              # center canvas + right panel: nav, randomizer,
│  │  │                        color matching, color picker, background,
│  │  │                        info, save/load, export
│  │  ├─ settings/            # settings modal (theme, backup, reset)
│  │  └─ ui/                   # Button, Modal, Toggle, Field, Chip, Section, EmptyState
│  ├─ hooks/                  # useMediaQuery/useBreakpoint, useApplyTheme, useSwipe
│  └─ lib/
│     ├─ types.ts             # all domain types (single source of truth)
│     ├─ constants.ts         # category metadata, preset tags, dropdown options
│     ├─ colorUtils.ts        # hex/HSL conversion, distance, classification
│     ├─ colorMatch.ts        # the 19 deterministic color-matching modes
│     ├─ randomizer.ts        # outfit generation + prev/next cycling logic
│     ├─ imageUtils.ts        # thumbnailing, dimension reading, blob<->dataURL
│     ├─ exportUtils.ts       # PNG/JPEG/PDF export of the outfit canvas
│     ├─ importExportWardrobe.ts # wardrobe backup file (JSON) import/export
│     ├─ filterItems.ts       # pure search/filter predicate over clothing items
│     ├─ db.ts                # IndexedDB layer (idb)
│     └─ store.ts             # Zustand store wiring UI state to db.ts
├─ public/
├─ tailwind.config.js
├─ next.config.js             # static export config
└─ package.json
```

## 3. Data model / "database" schema

IndexedDB database `wardrobe-planner`, object stores:

**`clothing`** (keyPath `id`, indexes on `category`, `dateAdded`)
```
id, name, category, imageBlob, thumbnailBlob,
primaryColor, secondaryColor, material, season, occasion[], pattern,
brand?, favorite, archived, notes?, tags[], dateAdded, lastEdited,
width, height
```

**`outfits`** (keyPath `id`, index on `dateCreated`)
```
id, name, selection { [category]: clothingItemId | null },
background { type: 'solid', color }, thumbnailBlob?, notes?, favorite,
dateCreated, dateEdited
```

**`kv`** — a single key, `app-settings`, storing the `AppSettings` object
(theme, animations, background, randomizer defaults, high contrast).

Categories (`src/lib/types.ts`):
- **Required (always exist, can't be set to "None"):** `hijab`, `clothes`,
  `pants`, `shoes`.
- **Optional (support "None"):** `hijabAccessories`, `clothesAccessories`,
  `pantsAccessories`, `shoesAccessories`, `bag`.

## 4. Component hierarchy (simplified)

```
AppShell
├─ AppHeader
├─ (desktop/tablet) CollapsiblePanel(left) → WardrobePanel
│    ├─ UploadZone, SearchBar, FilterPanel, WardrobeGrid → ClothingCard
│    └─ EditItemModal
├─ OutfitCanvas                 # layered <img> stack, aspect-locked, exportable node
├─ (desktop/tablet) CollapsiblePanel(right) → OutfitControlsPanel
│    ├─ CategoryNavigator (prev/next per category)
│    ├─ RandomizerPanel
│    ├─ ColorMatchingPanel (19 modes)
│    ├─ ColorPickerTool (target-color suggestions)
│    ├─ BackgroundPicker
│    ├─ OutfitInfoPanel
│    ├─ ExportMenu (PNG/JPEG/PDF)
│    ├─ SaveOutfitModal
│    └─ LoadOutfitModal
├─ (mobile) BottomNav switches between WardrobePanel / OutfitCanvas / OutfitControlsPanel
└─ SettingsModal (theme, animations, high contrast, backup import/export, reset/wipe)
```

## 5. Color-matching algorithm (deterministic, no AI)

Every clothing item stores a `primaryColor` hex. `src/lib/colorUtils.ts`
converts hex ↔ HSL and provides hue-distance and classification helpers
(`isNeutral`, `isWarmHue`, `isEarthTone`, `isPastel`, etc). `src/lib/colorMatch.ts`
implements all 19 modes (Random, Monochrome, Analogous, Complementary,
Split-Complementary, Triadic, Tetradic, Neutral, Warm, Cool, Earth Tone,
Pastel, Dark/Light Palette, High/Low Contrast, Color Pop, Black & White,
Minimalist) as scoring functions: for a given mode and a category's position
in the outfit, each candidate item's HSL is scored 0–1, tag metadata gives a
small bonus (e.g. an item tagged "Earth Tone" scores higher in Earth Tone
mode), and the top few candidates are picked with weighted randomness for
variety. The Color Picker tool (`ColorPickerTool.tsx`) instead ranks the
whole wardrobe by raw distance to a user-chosen hex.

## 6. Randomization logic

`src/lib/randomizer.ts`:
- Decides which optional categories to include this round (respecting the
  "include accessories" toggle and max accessory count).
- Derives a seed hue either from the user's target color or a random item.
- For every category to fill, ranks the available pool with the active
  color-match mode and picks among the top 3 with weighted randomness.
- `cycleCategorySelection` implements the ◀ ▶ wrap-around navigation used by
  both the on-screen buttons and touch swipe gestures.

## 7. Image layering system

`OutfitCanvas.tsx` renders one `<img>` per selected category, absolutely
positioned inside an aspect-locked (3:4) frame, ordered by
`CATEGORY_LAYER_ORDER` (pants → pants accessories → clothes → clothes
accessories → shoes → shoes accessories → bag → hijab → hijab accessories).
The frame's background color is the user's chosen solid color. This same DOM
node is what gets rasterized for PNG/JPEG/PDF export and outfit thumbnails.

## 8. Responsive implementation

- **Desktop (≥1200px):** fixed three-column layout, both side panels
  collapsible via the small chevron handles.
- **Tablet (768–1199px):** same three-column layout with narrower panels,
  still collapsible — this is the "collapsible panels" tablet behavior.
- **Mobile (<768px):** a single active panel at a time, switched with a
  bottom tab bar (Wardrobe / Outfit / Controls); category rows in the
  controls panel support left/right swipe to cycle items; all interactive
  targets are ≥44×44px.
- Left/Right arrow keys cycle the "Clothes" layer from anywhere outside a
  text field, for keyboard users.

## 9. Import/export

- **Outfit export:** `src/lib/exportUtils.ts` rasterizes the canvas node with
  `html-to-image` and downloads PNG/JPEG, or wraps the same raster in a
  single-page PDF via `jsPDF`.
- **Wardrobe backup:** `src/lib/importExportWardrobe.ts` serializes every
  item and outfit (images inlined as data URLs) plus settings into one JSON
  file for backup, and can re-import that file later, fully offline.

## 10. Accessibility

- All interactive controls have `aria-label`/`aria-pressed`/`aria-expanded`
  as appropriate; the outfit canvas has a descriptive `aria-label` listing
  the current pieces.
- Visible focus rings everywhere (`focus-visible:ring-2`), a documented
  "High contrast" setting that thickens borders and focus outlines, and a
  reduced-motion class plus respect for `prefers-reduced-motion`.
- Modal dialogs trap focus, restore focus to the trigger on close, and close
  on <kbd>Esc</kbd>.

---

## Install & run locally

Requires Node.js 18.18+ (Node 20+ recommended).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Build

```bash
npm run build
```

This produces a fully static site in `out/` (thanks to `output: 'export'`
in `next.config.js`) — no Node server is required to serve it.

## Deploy

**Vercel:** push this folder to a Git repo and import it in Vercel; it will
detect Next.js automatically. No environment variables are needed.

**Any static host (Netlify, GitHub Pages, S3/CloudFront, etc.):**
```bash
npm run build
# upload the contents of ./out
```

**Local file / offline use:** after `npm run build`, you can serve `out/`
with any static file server (e.g. `npx serve out`), or host it on a local
network — the app needs no backend and, after the first load, no internet
connection.

---

## What this app intentionally does *not* do

- No AI/ML model of any kind is called at runtime.
- No avatar, body, or face — only the uploaded clothing images are ever
  rendered.
- No hair category — hijab is a required category instead, per the brief.
- No account, login, or cloud sync — everything is local to the browser via
  IndexedDB.
