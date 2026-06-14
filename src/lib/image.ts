// Normalize a photo before it is sent for analysis. A modern phone photo can be
// 12 megapixels and several megabytes, which makes the request slow and costly
// for no benefit, since the model does not need that resolution to read a letter.
// We downscale to a sensible maximum and recompress as JPEG. PDF renders skip
// this, since they are already sized when rasterized.

const MAX_DIM = 2200;
const SMALL_ENOUGH = 1_400_000; // ~1.4 MB data URL, already fine to send as-is

export function normalizeImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const longest = Math.max(img.width, img.height);
      const scale = Math.min(1, MAX_DIM / longest);
      if (scale === 1 && dataUrl.length < SMALL_ENOUGH) return resolve(dataUrl);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.width * scale));
      canvas.height = Math.max(1, Math.round(img.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
