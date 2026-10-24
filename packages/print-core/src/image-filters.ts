import { PhotoSlotAdjustment } from './project-schema.js';

/**
 * Creates CSS filter string from PhotoSlotAdjustment values
 */
export function buildCssFilterString(adj: PhotoSlotAdjustment): string {
  const filters: string[] = [];

  // Brightness: 0 is 100%, -100 is 0%, +100 is 200%
  const b = 100 + adj.brightness;
  filters.push(`brightness(${b}%)`);

  // Contrast: 0 is 100%, -100 is 0%, +100 is 200%
  const c = 100 + adj.contrast;
  filters.push(`contrast(${c}%)`);

  // Saturation: 0 is 100%, -100 is 0%, +100 is 200%
  const s = 100 + adj.saturation;
  filters.push(`saturate(${s}%)`);

  if (adj.grayscale) {
    filters.push('grayscale(100%)');
  }

  return filters.join(' ');
}

/**
 * Loads an image from data URL asynchronously
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Failed to load image: ' + String(e)));
    img.src = src;
  });
}

/**
 * Renders a photo with cropping, zoom, rotation, and color filters into a 2D canvas context
 */
export function drawPhotoToContext(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  adj: PhotoSlotAdjustment,
  destX: number,
  destY: number,
  destW: number,
  destH: number,
  pxPerMm: number
) {
  ctx.save();

  // Create clipping region for the destination slot
  ctx.beginPath();
  ctx.rect(destX, destY, destW, destH);
  ctx.clip();

  // Draw white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(destX, destY, destW, destH);

  let innerX = destX;
  let innerY = destY;
  let innerW = destW;
  let innerH = destH;

  // Handle Polaroid styling (vintage instant camera frame)
  if (adj.isPolaroid) {
    const sideMargin = Math.round(5 * pxPerMm);
    const topMargin = Math.round(5 * pxPerMm);
    const bottomMargin = Math.round(20 * pxPerMm);

    innerX = destX + sideMargin;
    innerY = destY + topMargin;
    innerW = Math.max(10, destW - sideMargin * 2);
    innerH = Math.max(10, destH - topMargin - bottomMargin);

    // Render photo sub-rect
    ctx.save();
    ctx.beginPath();
    ctx.rect(innerX, innerY, innerW, innerH);
    ctx.clip();
  } else if (adj.hasWhiteBorder) {
    const borderPx = Math.round(adj.whiteBorderWidthMm * pxPerMm);
    innerX = destX + borderPx;
    innerY = destY + borderPx;
    innerW = Math.max(10, destW - borderPx * 2);
    innerH = Math.max(10, destH - borderPx * 2);

    ctx.save();
    ctx.beginPath();
    ctx.rect(innerX, innerY, innerW, innerH);
    ctx.clip();
  } else {
    ctx.save();
  }

  // Apply CSS color filters
  ctx.filter = buildCssFilterString(adj);

  // Position at center of inner area
  const centerX = innerX + innerW / 2;
  const centerY = innerY + innerH / 2;

  ctx.translate(centerX, centerY);

  // Apply rotation
  if (adj.rotation !== 0) {
    ctx.rotate((adj.rotation * Math.PI) / 180);
  }

  // Apply flip
  const scaleX = adj.flipH ? -1 : 1;
  const scaleY = adj.flipV ? -1 : 1;
  if (scaleX !== 1 || scaleY !== 1) {
    ctx.scale(scaleX, scaleY);
  }

  // When rotated 90 or 270 degrees, the destination dimensions in the image's local space swap
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const isRotated90 = adj.rotation === 90 || adj.rotation === 270;
  const targetW = isRotated90 ? innerH : innerW;
  const targetH = isRotated90 ? innerW : innerH;
  const slotAspect = targetW / targetH;

  let drawW: number;
  let drawH: number;

  if (adj.fitMode === 'contain') {
    if (imgAspect > slotAspect) {
      drawW = targetW;
      drawH = targetW / imgAspect;
    } else {
      drawH = targetH;
      drawW = targetH * imgAspect;
    }
  } else {
    // Cover mode
    if (imgAspect > slotAspect) {
      drawH = targetH;
      drawW = targetH * imgAspect;
    } else {
      drawW = targetW;
      drawH = targetW / imgAspect;
    }
  }

  // Apply zoom factor
  drawW *= adj.zoom;
  drawH *= adj.zoom;

  // Pan offsets: (adj.cropX - 0.5) shifts within the excess dimension
  const excessX = Math.max(0, drawW - targetW);
  const excessY = Math.max(0, drawH - targetH);
  const panOffsetX = (adj.cropX - 0.5) * -excessX * 2;
  const panOffsetY = (adj.cropY - 0.5) * -excessY * 2;

  ctx.drawImage(img, -drawW / 2 + panOffsetX, -drawH / 2 + panOffsetY, drawW, drawH);

  ctx.restore(); // Restore clip from border / polaroid

  // Render Polaroid caption if present
  if (adj.isPolaroid && adj.polaroidCaption) {
    ctx.save();
    ctx.fillStyle = '#202124';
    ctx.font = `${Math.round(4 * pxPerMm)}px "Caveat", "Indie Flower", cursive, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(adj.polaroidCaption, destX + destW / 2, destY + destH - Math.round(10 * pxPerMm));
    ctx.restore();
  }

  ctx.restore(); // Restore main slot clip
}
