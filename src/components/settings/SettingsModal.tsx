'use client';

import { useRef, useState } from 'react';
import { Sun, Moon, Monitor, Download, Upload, RotateCcw, AlertTriangle, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Toggle } from '@/components/ui/Toggle';
import { useWardrobeStore } from '@/lib/store';
import type { ThemeMode } from '@/lib/types';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

export function SettingsModal({ open, onClose }: SettingsModalProps) {
  const settings = useWardrobeStore((s) => s.settings);
  const updateSettings = useWardrobeStore((s) => s.updateSettings);
  const resetPreferences = useWardrobeStore((s) => s.resetPreferences);
  const exportWardrobe = useWardrobeStore((s) => s.exportWardrobe);
  const importWardrobe = useWardrobeStore((s) => s.importWardrobe);
  const wipeAllData = useWardrobeStore((s) => s.wipeAllData);
  const session = useWardrobeStore((s) => s.session);
  const signOut = useWardrobeStore((s) => s.signOut);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [confirmWipe, setConfirmWipe] = useState(false);

  async function handleImportFile(file: File) {
    setImportStatus('Importing…');
    try {
      const { itemCount, outfitCount } = await importWardrobe(file);
      setImportStatus(`Imported ${itemCount} items and ${outfitCount} outfits.`);
    } catch (err) {
      setImportStatus(err instanceof Error ? err.message : 'Import failed. Check the file and try again.');
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Settings" maxWidthClass="max-w-lg">
      <div className="flex flex-col gap-6">
        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
            Account
          </p>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas-soft px-3 py-2.5 dark:border-dusk-line dark:bg-dusk-surface2">
            <span className="min-w-0 truncate text-sm text-ink dark:text-dusk-text">{session?.user.email}</span>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut size={13} aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
            Appearance
          </p>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => updateSettings({ theme: value })}
                aria-pressed={settings.theme === value}
                className={clsx(
                  'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition-colors',
                  settings.theme === value
                    ? 'border-thread-500 bg-thread-50 text-thread-700 dark:border-thread-400 dark:bg-thread-900/40 dark:text-thread-200'
                    : 'border-line bg-white text-ink-muted hover:text-ink dark:border-dusk-line dark:bg-dusk-surface2 dark:text-dusk-muted dark:hover:text-dusk-text',
                )}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <Toggle
            label="Animations"
            description="Smooth transitions across the app"
            checked={settings.animationsEnabled}
            onChange={(v) => updateSettings({ animationsEnabled: v })}
          />
          <Toggle
            label="High contrast"
            description="Stronger borders and focus outlines"
            checked={settings.highContrast}
            onChange={(v) => updateSettings({ highContrast: v })}
          />
        </section>

        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
            Backup
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="md" onClick={exportWardrobe}>
              <Download size={15} aria-hidden="true" />
              Export wardrobe backup
            </Button>
            <Button variant="outline" size="md" onClick={() => fileInputRef.current?.click()}>
              <Upload size={15} aria-hidden="true" />
              Import wardrobe backup
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImportFile(file);
                e.target.value = '';
              }}
            />
            {importStatus && <p className="text-xs text-ink-muted dark:text-dusk-muted">{importStatus}</p>}
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted dark:text-dusk-muted">
            Reset
          </p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="md" onClick={resetPreferences}>
              <RotateCcw size={15} aria-hidden="true" />
              Reset preferences to default
            </Button>

            {!confirmWipe ? (
              <Button variant="danger" size="md" onClick={() => setConfirmWipe(true)}>
                <AlertTriangle size={15} aria-hidden="true" />
                Erase all wardrobe data
              </Button>
            ) : (
              <div className="rounded-xl border border-thread-200 bg-thread-50 p-3 dark:border-thread-800 dark:bg-thread-900/20">
                <p className="mb-2 text-xs text-thread-700 dark:text-thread-200">
                  This permanently deletes every clothing item and saved outfit in your account. Export a backup
                  first if you want to keep it.
                </p>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmWipe(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      wipeAllData();
                      setConfirmWipe(false);
                      onClose();
                    }}
                  >
                    Erase everything
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </Modal>
  );
}
