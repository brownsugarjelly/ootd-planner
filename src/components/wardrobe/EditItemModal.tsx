'use client';

import { useEffect, useState } from 'react';
import { Heart, Archive, Copy, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldLabel, TextField, TextAreaField, SelectField } from '@/components/ui/Field';
import { Chip } from '@/components/ui/Chip';
import { useWardrobeStore } from '@/lib/store';
import { ALL_CATEGORIES, type ClothingItem, type Occasion } from '@/lib/types';
import { CATEGORY_META, MATERIALS, OCCASIONS, PATTERNS, PRESET_TAGS, SEASONS, humanize } from '@/lib/constants';

interface EditItemModalProps {
  item: ClothingItem | null;
  onClose: () => void;
}

export function EditItemModal({ item, onClose }: EditItemModalProps) {
  const updateItem = useWardrobeStore((s) => s.updateItem);
  const deleteItem = useWardrobeStore((s) => s.deleteItem);
  const duplicateItem = useWardrobeStore((s) => s.duplicateItem);
  const toggleFavoriteItem = useWardrobeStore((s) => s.toggleFavoriteItem);
  const toggleArchiveItem = useWardrobeStore((s) => s.toggleArchiveItem);

  const [draft, setDraft] = useState<ClothingItem | null>(item);
  const [tagInput, setTagInput] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    setDraft(item);
    setConfirmDelete(false);
    setTagInput('');
  }, [item]);

  if (!item || !draft) return null;

  function patch(p: Partial<ClothingItem>) {
    setDraft((d) => (d ? { ...d, ...p } : d));
  }

  function commitTag(raw: string) {
    const value = raw.trim();
    if (!value || !draft) return;
    if (!draft.tags.includes(value)) {
      patch({ tags: [...draft.tags, value] });
    }
    setTagInput('');
  }

  function toggleOccasion(o: Occasion) {
    if (!draft) return;
    patch({
      occasion: draft.occasion.includes(o) ? draft.occasion.filter((x) => x !== o) : [...draft.occasion, o],
    });
  }

  async function handleSave() {
    if (!item || !draft) return;
    await updateItem(item.id, {
      name: draft.name,
      category: draft.category,
      garmentType: draft.garmentType,
      primaryColor: draft.primaryColor,
      secondaryColor: draft.secondaryColor,
      material: draft.material,
      season: draft.season,
      occasion: draft.occasion,
      pattern: draft.pattern,
      brand: draft.brand,
      notes: draft.notes,
      tags: draft.tags,
    });
    onClose();
  }

  async function handleDelete() {
    if (!item) return;
    await deleteItem(item.id);
    onClose();
  }

  async function handleDuplicate() {
    if (!item) return;
    await duplicateItem(item.id);
    onClose();
  }

  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title="Edit clothing item"
      maxWidthClass="max-w-xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="flex gap-4">
          <div className="h-28 w-24 shrink-0 overflow-hidden rounded-xl border border-line bg-canvas-soft dark:border-dusk-line dark:bg-dusk-surface2">
            <img
              src={item.thumbnailUrl ?? item.imageUrl}
              alt={item.name}
              className="h-full w-full object-contain p-1.5"
            />
          </div>
          <div className="flex flex-1 flex-col gap-3">
            <FieldLabel label="Name" htmlFor="edit-name">
              <TextField id="edit-name" value={draft.name} onChange={(e) => patch({ name: e.target.value })} />
            </FieldLabel>
            <FieldLabel label="Category" htmlFor="edit-category">
              <SelectField
                id="edit-category"
                value={draft.category}
                onChange={(e) => patch({ category: e.target.value as ClothingItem['category'] })}
              >
                {ALL_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_META[c].label}
                  </option>
                ))}
              </SelectField>
            </FieldLabel>
            <FieldLabel label="Garment type" htmlFor="edit-garment-type">
              <TextField
                id="edit-garment-type"
                value={draft.garmentType ?? ''}
                placeholder="e.g. hoodie, cargo pants"
                onChange={(e) => patch({ garmentType: e.target.value || undefined })}
              />
            </FieldLabel>
            {!draft.aiProcessed && (
              <p className="text-xs text-ink-muted dark:text-dusk-muted">
                AI classification wasn&apos;t available for this item — details below are defaults, edit as needed.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={draft.favorite ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              toggleFavoriteItem(item.id);
              patch({ favorite: !draft.favorite });
            }}
          >
            <Heart size={13} aria-hidden="true" className={draft.favorite ? 'fill-current' : ''} />
            Favorite
          </Button>
          <Button
            variant={draft.archived ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              toggleArchiveItem(item.id);
              patch({ archived: !draft.archived });
            }}
          >
            <Archive size={13} aria-hidden="true" />
            {draft.archived ? 'Archived' : 'Archive'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleDuplicate}>
            <Copy size={13} aria-hidden="true" />
            Duplicate
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Primary color" htmlFor="edit-primary-color">
            <div className="flex items-center gap-2">
              <input
                id="edit-primary-color"
                type="color"
                value={draft.primaryColor}
                onChange={(e) => patch({ primaryColor: e.target.value })}
                className="h-9 w-9 cursor-pointer rounded-lg border border-line bg-transparent p-0.5 dark:border-dusk-line"
              />
              <TextField
                value={draft.primaryColor}
                onChange={(e) => patch({ primaryColor: e.target.value })}
                maxLength={7}
              />
            </div>
          </FieldLabel>
          <FieldLabel label="Secondary color" htmlFor="edit-secondary-color">
            <div className="flex items-center gap-2">
              <input
                id="edit-secondary-color"
                type="color"
                value={draft.secondaryColor ?? '#FFFFFF'}
                onChange={(e) => patch({ secondaryColor: e.target.value })}
                className="h-9 w-9 cursor-pointer rounded-lg border border-line bg-transparent p-0.5 dark:border-dusk-line"
              />
              <TextField
                value={draft.secondaryColor ?? ''}
                placeholder="Optional"
                onChange={(e) => patch({ secondaryColor: e.target.value || undefined })}
                maxLength={7}
              />
            </div>
          </FieldLabel>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <FieldLabel label="Material" htmlFor="edit-material">
            <SelectField
              id="edit-material"
              value={draft.material ?? ''}
              onChange={(e) => patch({ material: (e.target.value || undefined) as ClothingItem['material'] })}
            >
              <option value="">—</option>
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {humanize(m)}
                </option>
              ))}
            </SelectField>
          </FieldLabel>
          <FieldLabel label="Season" htmlFor="edit-season">
            <SelectField
              id="edit-season"
              value={draft.season}
              onChange={(e) => patch({ season: e.target.value as ClothingItem['season'] })}
            >
              {SEASONS.map((s) => (
                <option key={s} value={s}>
                  {humanize(s)}
                </option>
              ))}
            </SelectField>
          </FieldLabel>
          <FieldLabel label="Pattern" htmlFor="edit-pattern">
            <SelectField
              id="edit-pattern"
              value={draft.pattern}
              onChange={(e) => patch({ pattern: e.target.value as ClothingItem['pattern'] })}
            >
              {PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {humanize(p)}
                </option>
              ))}
            </SelectField>
          </FieldLabel>
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-ink-muted dark:text-dusk-muted">Occasion</p>
          <div className="flex flex-wrap gap-1.5">
            {OCCASIONS.map((o) => (
              <Chip
                key={o}
                label={humanize(o)}
                size="sm"
                active={draft.occasion.includes(o)}
                onClick={() => toggleOccasion(o)}
              />
            ))}
          </div>
        </div>

        <FieldLabel label="Brand (optional)" htmlFor="edit-brand">
          <TextField
            id="edit-brand"
            value={draft.brand ?? ''}
            onChange={(e) => patch({ brand: e.target.value || undefined })}
          />
        </FieldLabel>

        <div>
          <p className="mb-2 text-xs font-medium text-ink-muted dark:text-dusk-muted">Tags</p>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {draft.tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                size="sm"
                onRemove={() => patch({ tags: draft.tags.filter((t) => t !== tag) })}
              />
            ))}
          </div>
          <TextField
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitTag(tagInput);
              }
            }}
            placeholder="Type a tag and press Enter"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PRESET_TAGS.filter((t) => !draft.tags.includes(t))
              .slice(0, 10)
              .map((t) => (
                <Chip key={t} label={t} size="sm" onClick={() => commitTag(t)} />
              ))}
          </div>
        </div>

        <FieldLabel label="Notes (optional)" htmlFor="edit-notes">
          <TextAreaField
            id="edit-notes"
            rows={2}
            value={draft.notes ?? ''}
            onChange={(e) => patch({ notes: e.target.value || undefined })}
          />
        </FieldLabel>

        <div className="rounded-xl border border-thread-200 bg-thread-50 p-3 dark:border-thread-800 dark:bg-thread-900/20">
          {!confirmDelete ? (
            <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
              <Trash2 size={13} aria-hidden="true" />
              Delete item
            </Button>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-thread-700 dark:text-thread-200">Delete this item permanently?</p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleDelete}>
                  Confirm delete
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
