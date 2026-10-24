import { PDFDocument, rgb } from 'pdf-lib';
import {
  getPaperDimensions,
  generateCutMarks,
  CutMarkStyle,
} from '@pixture/layout-engine';
import { SheetConfig, SheetPage, PhotoAsset } from './project-schema.js';
import { renderSheetToCanvas } from './canvas-renderer.js';

const PT_PER_MM = 72 / 25.4;

export interface ExportPdfOptions {
  config: SheetConfig;
  pages: SheetPage[];
  photos: PhotoAsset[];
  slotsGeometry: Array<{
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
  }>;
  onProgress?: (progress0to1: number) => void;
}

export async function exportProjectToPdf(options: ExportPdfOptions): Promise<Uint8Array> {
  const { config, pages, photos, slotsGeometry, onProgress } = options;

  const pdfDoc = await PDFDocument.create();

  const paperDim = getPaperDimensions(
    config.paperId,
    config.orientation,
    config.customWidthMm,
    config.customHeightMm
  );

  const pageW_pt = paperDim.widthMm * PT_PER_MM;
  const pageH_pt = paperDim.heightMm * PT_PER_MM;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];

    // Render page to 300 DPI canvas
    const canvas = await renderSheetToCanvas({
      config,
      page,
      photos,
      dpi: 300,
      slotsGeometry,
    });

    const pngDataUrl = canvas.toDataURL('image/png');
    const pngImage = await pdfDoc.embedPng(pngDataUrl);

    // Add page with exact paper dimensions
    const pdfPage = pdfDoc.addPage([pageW_pt, pageH_pt]);

    // Draw the 300 DPI rendered sheet filling the whole page
    pdfPage.drawImage(pngImage, {
      x: 0,
      y: 0,
      width: pageW_pt,
      height: pageH_pt,
    });

    // Draw vector cut marks on top if enabled (ONLY for filled photo slots)
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

        // Parse cut mark color
        const colorHex = config.cutMarkColor || '#5f6368';
        const r = parseInt(colorHex.slice(1, 3), 16) / 255 || 0.3;
        const g = parseInt(colorHex.slice(3, 5), 16) / 255 || 0.3;
        const b = parseInt(colorHex.slice(5, 7), 16) / 255 || 0.3;
        const lineColor = rgb(r, g, b);

        for (const line of cutMarks.lines) {
          // PDF coordinates start at bottom-left, so invert Y
          const x1 = line.x1Mm * PT_PER_MM;
          const y1 = pageH_pt - line.y1Mm * PT_PER_MM;
          const x2 = line.x2Mm * PT_PER_MM;
          const y2 = pageH_pt - line.y2Mm * PT_PER_MM;

          pdfPage.drawLine({
            start: { x: x1, y: y1 },
            end: { x: x2, y: y2 },
            thickness: 0.5, // 0.5 pt hairline
            color: lineColor,
          });
        }
      }
    }

    if (onProgress) {
      onProgress((i + 1) / pages.length);
    }
  }

  return await pdfDoc.save();
}

/**
 * Downloads a Uint8Array as a PDF file in browser
 */
export function downloadPdf(bytes: Uint8Array, filename: string = 'pixture-print.pdf') {
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
