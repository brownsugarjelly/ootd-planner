// Runs background removal entirely in the browser via @imgly/background-removal
// (a WASM segmentation model). The library is loaded directly from a CDN at
// runtime via a webpack-ignored dynamic import, rather than being bundled —
// its onnxruntime-web dependency ships WASM/ESM assets that are incompatible
// with webpack's static bundling. This keeps everything client-side and free;
// no server, no per-call API cost, no API key.

type RemoveBackgroundFn = (
  image: Blob | string,
  config?: Record<string, unknown>,
) => Promise<Blob>;

let cached: RemoveBackgroundFn | null = null;

const CDN_URL = 'https://esm.sh/@imgly/background-removal@1.5.5';

async function loadRemoveBackground(): Promise<RemoveBackgroundFn> {
  if (cached) return cached;
  const importer = new Function('url', 'return import(/* webpackIgnore: true */ url)') as (
    url: string,
  ) => Promise<{ removeBackground: RemoveBackgroundFn }>;
  const mod = await importer(CDN_URL);
  cached = mod.removeBackground;
  return cached as RemoveBackgroundFn;
}

export async function removeImageBackground(file: File | Blob): Promise<Blob> {
  const removeBackground = await loadRemoveBackground();
  // Let the library use its own default CDN (staticimgly.com) for the
  // WASM/ONNX model assets — only the JS wrapper itself is loaded from
  // esm.sh above, to sidestep webpack bundling issues.
  return removeBackground(file, {
    output: { format: 'image/png', quality: 0.92 },
  });
}
