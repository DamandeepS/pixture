export interface PaperSize {
  id: string;
  name: string;
  widthMm: number;
  heightMm: number;
  isStandardPhotoPaper?: boolean;
}

export const PAPER_PRESETS: Record<string, PaperSize> = {
  a4: {
    id: 'a4',
    name: 'A4',
    widthMm: 210,
    heightMm: 297,
  },
  a3: {
    id: 'a3',
    name: 'A3',
    widthMm: 297,
    heightMm: 420,
  },
  a5: {
    id: 'a5',
    name: 'A5',
    widthMm: 148,
    heightMm: 210,
  },
  letter: {
    id: 'letter',
    name: 'US Letter (8.5 × 11 in)',
    widthMm: 215.9,
    heightMm: 279.4,
  },
  legal: {
    id: 'legal',
    name: 'US Legal (8.5 × 14 in)',
    widthMm: 215.9,
    heightMm: 355.6,
  },
  photo_4x6: {
    id: 'photo_4x6',
    name: '4 × 6 in (10 × 15 cm)',
    widthMm: 101.6,
    heightMm: 152.4,
    isStandardPhotoPaper: true,
  },
  photo_5x7: {
    id: 'photo_5x7',
    name: '5 × 7 in (13 × 18 cm)',
    widthMm: 127.0,
    heightMm: 177.8,
    isStandardPhotoPaper: true,
  },
  photo_8x10: {
    id: 'photo_8x10',
    name: '8 × 10 in (20 × 25 cm)',
    widthMm: 203.2,
    heightMm: 254.0,
    isStandardPhotoPaper: true,
  },
};

export function getPaperDimensions(
  paperId: string,
  orientation: 'portrait' | 'landscape',
  customWidthMm?: number,
  customHeightMm?: number
): { widthMm: number; heightMm: number } {
  let w: number;
  let h: number;

  if (paperId === 'custom' && customWidthMm && customHeightMm) {
    w = customWidthMm;
    h = customHeightMm;
  } else {
    const preset = PAPER_PRESETS[paperId] || PAPER_PRESETS.a4;
    w = preset.widthMm;
    h = preset.heightMm;
  }

  if (orientation === 'landscape') {
    return {
      widthMm: Math.max(w, h),
      heightMm: Math.min(w, h),
    };
  }

  return {
    widthMm: Math.min(w, h),
    heightMm: Math.max(w, h),
  };
}
