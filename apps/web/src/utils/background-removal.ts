/**
 * Background removal utility using @imgly/background-removal
 * Runs 100% locally in the browser via WebAssembly and ONNX Runtime.
 */

export interface BgColorPreset {
  id: string;
  name: string;
  color: string; // 'transparent' or hex code
  isBordered?: boolean;
}

export const BG_COLOR_PRESETS: BgColorPreset[] = [
  { id: 'transparent', name: 'Transparent', color: 'transparent' },
  { id: 'white', name: 'White (Passport)', color: '#ffffff', isBordered: true },
  { id: 'offwhite', name: 'Off-White', color: '#f2f4f7', isBordered: true },
  { id: 'passport_blue', name: 'Passport Blue', color: '#4a90e2' },
  { id: 'navy', name: 'Navy Blue', color: '#0f2b5c' },
  { id: 'passport_red', name: 'Passport Red', color: '#d32f2f' },
];

/**
 * Removes the background of an image using in-browser AI segmentation.
 * Returns a base64 transparent PNG dataUrl.
 */
export async function removeImageBackground(
  imageSource: string | Blob,
  onProgress?: (percent: number, status: string) => void
): Promise<string> {
  const { removeBackground } = await import('@imgly/background-removal');

  const blob = await removeBackground(imageSource, {
    progress: (key: string, current: number, total: number) => {
      let stageText = 'Processing image...';
      let pct = 0;

      if (key.includes('fetch')) {
        stageText = 'Downloading AI model (first time only)...';
        pct = Math.round((current / (total || 1)) * 40);
      } else if (key.includes('decode')) {
        stageText = 'Reading photo pixels...';
        pct = 45;
      } else if (key.includes('inference')) {
        stageText = 'AI detecting subject & edges...';
        pct = 75;
      } else if (key.includes('mask') || key.includes('encode')) {
        stageText = 'Generating cut-out...';
        pct = 90;
      }

      onProgress?.(pct, stageText);
    },
    output: {
      format: 'image/png',
      quality: 0.95,
    },
  });

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert blob to data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Composites a transparent cut-out image onto a plain background color.
 * If bgColor is 'transparent', returns the cutout as-is.
 */
export function compositeWithBackgroundColor(
  cutoutDataUrl: string,
  bgColor: string
): Promise<string> {
  if (bgColor === 'transparent') {
    return Promise.resolve(cutoutDataUrl);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const width = img.naturalWidth || img.width || 800;
      const height = img.naturalHeight || img.height || 600;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        resolve(cutoutDataUrl);
        return;
      }

      // 1. Fill solid background color
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      // 2. Draw cutout foreground on top
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Could not load cutout image for background composition'));
    img.src = cutoutDataUrl;
  });
}
