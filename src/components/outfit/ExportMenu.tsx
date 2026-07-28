'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { exportOutfitAsJpeg, exportOutfitAsPdf, exportOutfitAsPng } from '@/lib/exportUtils';

interface ExportMenuProps {
  canvasNode: HTMLElement | null;
}

export function ExportMenu({ canvasNode }: ExportMenuProps) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(format: 'png' | 'jpeg' | 'pdf') {
    if (!canvasNode) return;
    setBusy(format);
    try {
      if (format === 'png') await exportOutfitAsPng(canvasNode);
      if (format === 'jpeg') await exportOutfitAsJpeg(canvasNode);
      if (format === 'pdf') await exportOutfitAsPdf(canvasNode);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1" onClick={() => run('png')} disabled={busy !== null}>
        <Download size={13} aria-hidden="true" />
        {busy === 'png' ? '…' : 'PNG'}
      </Button>
      <Button variant="outline" size="sm" className="flex-1" onClick={() => run('jpeg')} disabled={busy !== null}>
        <Download size={13} aria-hidden="true" />
        {busy === 'jpeg' ? '…' : 'JPEG'}
      </Button>
      <Button variant="outline" size="sm" className="flex-1" onClick={() => run('pdf')} disabled={busy !== null}>
        <Download size={13} aria-hidden="true" />
        {busy === 'pdf' ? '…' : 'PDF'}
      </Button>
    </div>
  );
}
