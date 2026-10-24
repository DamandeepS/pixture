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
  const {
    slots,
    style,
    markLengthMm = 3.0,
    markOffsetMm = 1.0,
    bleedMm = 0,
  } = config;

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

  for (const slot of slots) {
    const { xMm: x, yMm: y, widthMm: w, heightMm: h } = slot;

    if (style === 'corners') {
      // Top-Left corner
      lines.push({
        x1Mm: x - markLengthMm - markOffsetMm,
        y1Mm: y,
        x2Mm: x - markOffsetMm,
        y2Mm: y,
        style: 'solid',
      });
      lines.push({
        x1Mm: x,
        y1Mm: y - markLengthMm - markOffsetMm,
        x2Mm: x,
        y2Mm: y - markOffsetMm,
        style: 'solid',
      });

      // Top-Right corner
      lines.push({
        x1Mm: x + w + markOffsetMm,
        y1Mm: y,
        x2Mm: x + w + markLengthMm + markOffsetMm,
        y2Mm: y,
        style: 'solid',
      });
      lines.push({
        x1Mm: x + w,
        y1Mm: y - markLengthMm - markOffsetMm,
        x2Mm: x + w,
        y2Mm: y - markOffsetMm,
        style: 'solid',
      });

      // Bottom-Left corner
      lines.push({
        x1Mm: x - markLengthMm - markOffsetMm,
        y1Mm: y + h,
        x2Mm: x - markOffsetMm,
        y2Mm: y + h,
        style: 'solid',
      });
      lines.push({
        x1Mm: x,
        y1Mm: y + h + markOffsetMm,
        x2Mm: x,
        y2Mm: y + h + markLengthMm + markOffsetMm,
        style: 'solid',
      });

      // Bottom-Right corner
      lines.push({
        x1Mm: x + w + markOffsetMm,
        y1Mm: y + h,
        x2Mm: x + w + markLengthMm + markOffsetMm,
        y2Mm: y + h,
        style: 'solid',
      });
      lines.push({
        x1Mm: x + w,
        y1Mm: y + h + markOffsetMm,
        x2Mm: x + w,
        y2Mm: y + h + markLengthMm + markOffsetMm,
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
