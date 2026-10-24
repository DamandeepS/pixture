export type CutMarkStyle = 'corners' | 'dashed' | 'hairline' | 'none';

export interface CutMarkLine {
  x1Mm: number;
  y1Mm: number;
  x2Mm: number;
  y2Mm: number;
  style: 'solid' | 'dashed';
}

export interface CutMarksConfig {
  slots: Array<{ xMm: number; yMm: number; widthMm: number; heightMm: number }>;
  style: CutMarkStyle;
  markLengthMm?: number;
  markOffsetMm?: number; // Distance outside the photo boundary (avoids ink on photo)
  bleedMm?: number;
}

export interface CutMarksResult {
  lines: CutMarkLine[];
  bleedBoxes: Array<{
    xMm: number;
    yMm: number;
    widthMm: number;
    heightMm: number;
  }>;
}

export function generateCutMarks(config: CutMarksConfig): CutMarksResult {
  const { slots, style, markLengthMm = 3.0, markOffsetMm = 1.0, bleedMm = 0 } = config;

  if (style === 'none' || slots.length === 0) {
    return { lines: [], bleedBoxes: [] };
  }

  const lines: CutMarkLine[] = [];
  const bleedBoxes = slots.map((s) => ({
    xMm: s.xMm - bleedMm,
    yMm: s.yMm - bleedMm,
    widthMm: s.widthMm + bleedMm * 2,
    heightMm: s.heightMm + bleedMm * 2,
  }));

  // Corner tick marks must start outside the bleed area so no ink overlaps the ticks
  const effectiveOffset = markOffsetMm + bleedMm;

  for (const slot of slots) {
    const { xMm: x, yMm: y, widthMm: w, heightMm: h } = slot;

    if (style === 'corners') {
      // Top-Left corner
      lines.push({
        x1Mm: x - markLengthMm - effectiveOffset,
        y1Mm: y,
        x2Mm: x - effectiveOffset,
        y2Mm: y,
        style: 'solid',
      });
      lines.push({
        x1Mm: x,
        y1Mm: y - markLengthMm - effectiveOffset,
        x2Mm: x,
        y2Mm: y - effectiveOffset,
        style: 'solid',
      });

      // Top-Right corner
      lines.push({
        x1Mm: x + w + effectiveOffset,
        y1Mm: y,
        x2Mm: x + w + markLengthMm + effectiveOffset,
        y2Mm: y,
        style: 'solid',
      });
      lines.push({
        x1Mm: x + w,
        y1Mm: y - markLengthMm - effectiveOffset,
        x2Mm: x + w,
        y2Mm: y - effectiveOffset,
        style: 'solid',
      });

      // Bottom-Left corner
      lines.push({
        x1Mm: x - markLengthMm - effectiveOffset,
        y1Mm: y + h,
        x2Mm: x - effectiveOffset,
        y2Mm: y + h,
        style: 'solid',
      });
      lines.push({
        x1Mm: x,
        y1Mm: y + h + effectiveOffset,
        x2Mm: x,
        y2Mm: y + h + markLengthMm + effectiveOffset,
        style: 'solid',
      });

      // Bottom-Right corner
      lines.push({
        x1Mm: x + w + effectiveOffset,
        y1Mm: y + h,
        x2Mm: x + w + markLengthMm + effectiveOffset,
        y2Mm: y + h,
        style: 'solid',
      });
      lines.push({
        x1Mm: x + w,
        y1Mm: y + h + effectiveOffset,
        x2Mm: x + w,
        y2Mm: y + h + markLengthMm + effectiveOffset,
        style: 'solid',
      });
    } else if (style === 'dashed') {
      // Dashed rectangle along border
      lines.push({ x1Mm: x, y1Mm: y, x2Mm: x + w, y2Mm: y, style: 'dashed' });
      lines.push({ x1Mm: x + w, y1Mm: y, x2Mm: x + w, y2Mm: y + h, style: 'dashed' });
      lines.push({ x1Mm: x + w, y1Mm: y + h, x2Mm: x, y2Mm: y + h, style: 'dashed' });
      lines.push({ x1Mm: x, y1Mm: y + h, x2Mm: x, y2Mm: y, style: 'dashed' });
    } else if (style === 'hairline') {
      // Solid hairline perimeter
      lines.push({ x1Mm: x, y1Mm: y, x2Mm: x + w, y2Mm: y, style: 'solid' });
      lines.push({ x1Mm: x + w, y1Mm: y, x2Mm: x + w, y2Mm: y + h, style: 'solid' });
      lines.push({ x1Mm: x + w, y1Mm: y + h, x2Mm: x, y2Mm: y + h, style: 'solid' });
      lines.push({ x1Mm: x, y1Mm: y + h, x2Mm: x, y2Mm: y, style: 'solid' });
    }
  }

  return {
    lines,
    bleedBoxes,
  };
}
