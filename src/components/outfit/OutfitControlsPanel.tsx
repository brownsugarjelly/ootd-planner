'use client';

import { useState } from 'react';
import { Save, FolderOpen, RotateCcw } from 'lucide-react';
import { Section } from '@/components/ui/Section';
import { Button } from '@/components/ui/Button';
import { CategoryLayerStack } from './CategoryLayerStack';
import { RandomizerPanel } from './RandomizerPanel';
import { ColorMatchingPanel } from './ColorMatchingPanel';
import { ColorPickerTool } from './ColorPickerTool';
import { BackgroundPicker } from './BackgroundPicker';
import { OutfitInfoPanel } from './OutfitInfoPanel';
import { ExportMenu } from './ExportMenu';
import { SaveOutfitModal } from './SaveOutfitModal';
import { LoadOutfitModal } from './LoadOutfitModal';
import { useWardrobeStore } from '@/lib/store';

interface OutfitControlsPanelProps {
  canvasNode: HTMLElement | null;
}

export function OutfitControlsPanel({ canvasNode }: OutfitControlsPanelProps) {
  const clearOutfit = useWardrobeStore((s) => s.clearOutfit);
  const [saveOpen, setSaveOpen] = useState(false);
  const [loadOpen, setLoadOpen] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-y-auto px-4 pb-8">
      <div className="sticky top-0 z-10 -mx-4 mb-1 flex gap-2 bg-canvas/95 px-4 py-3 backdrop-blur dark:bg-dusk-bg/95">
        <Button variant="primary" size="sm" className="flex-1" onClick={() => setSaveOpen(true)}>
          <Save size={14} aria-hidden="true" />
          Save Outfit
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={() => setLoadOpen(true)}>
          <FolderOpen size={14} aria-hidden="true" />
          Load Outfit
        </Button>
        <Button variant="ghost" size="icon" onClick={clearOutfit} aria-label="Clear current outfit">
          <RotateCcw size={15} aria-hidden="true" />
        </Button>
      </div>

      <Section title="Pieces">
        <CategoryLayerStack />
      </Section>

      <Section title="Randomize">
        <RandomizerPanel />
      </Section>

      <Section title="Color matching" defaultOpen={false}>
        <ColorMatchingPanel />
      </Section>

      <Section title="Color picker" defaultOpen={false}>
        <ColorPickerTool />
      </Section>

      <Section title="Background" defaultOpen={false}>
        <BackgroundPicker />
      </Section>

      <Section title="Outfit info" defaultOpen={false}>
        <OutfitInfoPanel />
      </Section>

      <Section title="Export">
        <ExportMenu canvasNode={canvasNode} />
      </Section>

      <SaveOutfitModal open={saveOpen} onClose={() => setSaveOpen(false)} canvasNode={canvasNode} />
      <LoadOutfitModal open={loadOpen} onClose={() => setLoadOpen(false)} />
    </div>
  );
}
