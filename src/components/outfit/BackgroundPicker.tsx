'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { BACKGROUND_PRESETS } from '@/lib/constants';
import { hexToRgb, rgbToHex } from '@/lib/colorUtils';
import { useWardrobeStore } from '@/lib/store';
import { FieldLabel, TextField } from '@/components/ui/Field';

export function BackgroundPicker() {
  const background = useWardrobeStore((s) => s.settings.background);
  const setBackground = useWardrobeStore((s) => s.setBackground);
  const [hexDraft, setHexDraft] = useState(background.color);

  const rgb = hexToRgb(background.color);

  function commitHex(value: string) {
    const clean = value.startsWith('#') ? value : `#${value}`;
    if (/^#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})$/.test(clean)) {
      setBackground(clean.toUpperCase());
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-7 gap-2">
        {BACKGROUND_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            onClick={() => {
              setBackground(preset.color);
              setHexDraft(preset.color);
            }}
            title={preset.name}
            aria-label={`Set background to ${preset.name}`}
            aria-pressed={background.color.toLowerCase() === preset.color.toLowerCase()}
            className={clsx(
              'h-8 w-8 rounded-full border-2 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-thread-400',
              background.color.toLowerCase() === preset.color.toLowerCase()
                ? 'border-thread-500 scale-105'
                : 'border-line dark:border-dusk-line',
            )}
            style={{ backgroundColor: preset.color }}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldLabel label="Custom HEX" htmlFor="bg-hex">
          <div className="flex items-center gap-2">
            <span
              className="h-8 w-8 shrink-0 rounded-lg border border-line dark:border-dusk-line"
              style={{ backgroundColor: background.color }}
              aria-hidden="true"
            />
            <TextField
              id="bg-hex"
              value={hexDraft}
              onChange={(e) => setHexDraft(e.target.value)}
              onBlur={(e) => commitHex(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && commitHex(hexDraft)}
              maxLength={7}
            />
          </div>
        </FieldLabel>
        <FieldLabel label="RGB" htmlFor="bg-rgb-r">
          <div className="flex items-center gap-1.5">
            {(['r', 'g', 'b'] as const).map((channel) => (
              <TextField
                key={channel}
                id={`bg-rgb-${channel}`}
                type="number"
                min={0}
                max={255}
                aria-label={channel.toUpperCase()}
                value={rgb[channel]}
                onChange={(e) => {
                  const next = { ...rgb, [channel]: Number(e.target.value) };
                  const hex = rgbToHex(next);
                  setHexDraft(hex);
                  setBackground(hex);
                }}
                className="px-2 text-center"
              />
            ))}
          </div>
        </FieldLabel>
      </div>
    </div>
  );
}
