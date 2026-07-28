'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { FieldLabel, TextField, TextAreaField } from '@/components/ui/Field';
import { useWardrobeStore } from '@/lib/store';
import { nodeToThumbnailBlob } from '@/lib/exportUtils';

interface SaveOutfitModalProps {
  open: boolean;
  onClose: () => void;
  canvasNode: HTMLElement | null;
}

export function SaveOutfitModal({ open, onClose, canvasNode }: SaveOutfitModalProps) {
  const saveCurrentOutfit = useWardrobeStore((s) => s.saveCurrentOutfit);
  const activeOutfitId = useWardrobeStore((s) => s.activeOutfitId);
  const outfits = useWardrobeStore((s) => s.outfits);
  const active = outfits.find((o) => o.id === activeOutfitId);

  const [name, setName] = useState(active?.name ?? '');
  const [notes, setNotes] = useState(active?.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const thumbnail = canvasNode ? await nodeToThumbnailBlob(canvasNode) : undefined;
    await saveCurrentOutfit(name.trim(), notes.trim(), thumbnail);
    setSaving(false);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={active ? 'Update outfit' : 'Save outfit'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!name.trim() || saving}>
            {saving ? 'Saving…' : active ? 'Update outfit' : 'Save outfit'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FieldLabel label="Outfit name" htmlFor="outfit-name">
          <TextField
            id="outfit-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sunday brunch look"
            autoFocus
          />
        </FieldLabel>
        <FieldLabel label="Notes (optional)" htmlFor="outfit-notes">
          <TextAreaField
            id="outfit-notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Great for a warm afternoon…"
          />
        </FieldLabel>
      </div>
    </Modal>
  );
}
