import {
  mmToPixels,
  generateCutMarks,
  getPaperDimensions,
  CutMarkStyle,
} from '@pixture/layout-engine';
import {
  SheetConfig,
  PhotoAsset,
  SheetPage,
} from './project-schema.js';
import { drawPhotoToContext, loadImage } from './image-filters.js';

export interface RenderSheetOptions {
  config: SheetConfig;
  page: SheetPage;
  photos: PhotoAsset[];
  dpi?: number;
  slotsGeometry: Array<{
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
  }>;
}

export async function renderSheetToCanvas(options: RenderSheetOptions): Promise<HTMLCanvasElement> {
  const { config, page, photos, dpi = 300, slotsGeometry } = options;

  const paperDim = getPaperDimensions(
    config.paperId,
    config.orientation,
    config.customWidthMm,
    config.customHeightMm
  );

  const pxPerMm = mmToPixels(1, dpi);
  const totalW = Math.round(paperDim.widthMm * pxPerMm);
  const totalH = Math.round(paperDim.heightMm * pxPerMm);

  const canvas = document.createElement('canvas');
  canvas.width = totalW;
  canvas.height = totalH;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // 1. Draw crisp white paper background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, totalW, totalH);

  // Map photo assets by ID
  const photoMap = new Map<string, PhotoAsset>();
  for (const p of photos) {
    photoMap.set(p.id, p);
  }

  // Cache loaded HTMLImageElements
  const loadedImages = new Map<string, HTMLImageElement>();
  for (const slotAssignment of page.slots) {
    if (slotAssignment.photoId && !loadedImages.has(slotAssignment.photoId)) {
      const asset = photoMap.get(slotAssignment.photoId);
      if (asset) {
        try {
          const img = await loadImage(asset.dataUrl);
          loadedImages.set(asset.id, img);
        } catch (e) {
          console.error(`Failed to load photo asset ${asset.id}`, e);
        }
      }
    }
  }

  // 2. Draw photo slots
  const bleed = config.bleedMm || 0;

  for (let i = 0; i < slotsGeometry.length; i++) {
    const geom = slotsGeometry[i];
    const assignment = page.slots.find((s) => s.slotIndex === i);

    const slotX = Math.round((geom.xMm - bleed) * pxPerMm);
    const slotY = Math.round((geom.yMm - bleed) * pxPerMm);
    const slotW = Math.round((geom.widthMm + bleed * 2) * pxPerMm);
    const slotH = Math.round((geom.heightMm + bleed * 2) * pxPerMm);

    if (assignment && assignment.photoId) {
      const img = loadedImages.get(assignment.photoId);
      if (img) {
        drawPhotoToContext(
          ctx,
          img,
          assignment.adjustments,
          slotX,
          slotY,
          slotW,
          slotH,
          pxPerMm
        );
      }
    }
  }

  // 3. Draw Cut Marks (ONLY for filled photo slots)
  if (config.cutMarkStyle !== 'none') {
    const filledSlotsGeometry = slotsGeometry.filter((_, idx) => {
      const assignment = page.slots.find((s) => s.slotIndex === idx);
      return assignment && assignment.photoId;
    });

    if (filledSlotsGeometry.length > 0) {
      const cutMarks = generateCutMarks({
        slots: filledSlotsGeometry,
        style: config.cutMarkStyle as CutMarkStyle,
        bleedMm: config.bleedMm,
        markLengthMm: 2.0,
        markOffsetMm: 0.5,
      });

      ctx.save();
      ctx.strokeStyle = config.cutMarkColor || '#5f6368';
      ctx.lineWidth = Math.max(1, Math.round(0.12 * pxPerMm)); // Crisp hairline in print

      for (const line of cutMarks.lines) {
        ctx.beginPath();
        if (line.style === 'dashed') {
          ctx.setLineDash([Math.round(2 * pxPerMm), Math.round(2 * pxPerMm)]);
        } else {
          ctx.setLineDash([]);
        }
        ctx.moveTo(Math.round(line.x1Mm * pxPerMm), Math.round(line.y1Mm * pxPerMm));
        ctx.lineTo(Math.round(line.x2Mm * pxPerMm), Math.round(line.y2Mm * pxPerMm));
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  return canvas;
}
