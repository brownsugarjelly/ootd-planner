// Renders the outfit canvas DOM node to an image and triggers a download.
// PNG/JPEG use html-to-image; PDF wraps the same raster into a single page
// with jsPDF. No server round-trip.

import { toJpeg, toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

function triggerDownload(href: string, fileName: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportOutfitAsPng(node: HTMLElement, fileName = 'outfit.png'): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  triggerDownload(dataUrl, fileName);
}

export async function exportOutfitAsJpeg(node: HTMLElement, fileName = 'outfit.jpg'): Promise<void> {
  const dataUrl = await toJpeg(node, { pixelRatio: 2, quality: 0.95, cacheBust: true });
  triggerDownload(dataUrl, fileName);
}

export async function exportOutfitAsPdf(node: HTMLElement, fileName = 'outfit.pdf'): Promise<void> {
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
  const rect = node.getBoundingClientRect();
  const orientation = rect.width >= rect.height ? 'landscape' : 'portrait';
  const pdf = new jsPDF({ orientation, unit: 'pt', format: [rect.width, rect.height] });
  pdf.addImage(dataUrl, 'PNG', 0, 0, rect.width, rect.height);
  pdf.save(fileName);
}

export async function nodeToThumbnailBlob(node: HTMLElement, maxDim = 480): Promise<Blob | undefined> {
  try {
    const dataUrl = await toPng(node, { pixelRatio: 1, cacheBust: true, width: maxDim });
    const res = await fetch(dataUrl);
    return await res.blob();
  } catch {
    return undefined;
  }
}
