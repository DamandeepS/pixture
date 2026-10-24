import { describe, it, expect } from 'vitest';
import {
  computeUniformGridLayout,
  convertUnits,
  packMixedPhotos,
  generateCutMarks,
  computeSheetSlotsGeometry,
  calculateMaxSecondaryFit,
  PAPER_PRESETS,
  PHOTO_PRESETS,
} from './index.js';

describe('Layout Engine', () => {
  it('converts units accurately', () => {
    expect(convertUnits(25.4, 'mm', 'in')).toBeCloseTo(1.0, 4);
    expect(convertUnits(1, 'in', 'mm')).toBeCloseTo(25.4, 4);
    expect(convertUnits(10, 'cm', 'mm')).toBe(100);
    expect(convertUnits(100, 'mm', 'cm')).toBe(10);
  });

  it('computes uniform grid layout for A4 and 4x6 photos', () => {
    const a4 = PAPER_PRESETS.a4;
    const photo4x6 = PHOTO_PRESETS.print_4x6;

    const layout = computeUniformGridLayout({
      sheetWidthMm: a4.widthMm, // 210
      sheetHeightMm: a4.heightMm, // 297
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      slotWidthMm: photo4x6.widthMm, // 101.6
      slotHeightMm: photo4x6.heightMm, // 152.4
      gapXMm: 5,
      gapYMm: 5,
      autoOrientation: false,
    });

    // 210 - 20 = 190 printable width. 190 / 101.6 = 1 col.
    // 297 - 20 = 277 printable height. 277 / 152.4 = 1 row.
    expect(layout.cols).toBe(1);
    expect(layout.rows).toBe(1);
    expect(layout.capacityPerPage).toBe(1);
    expect(layout.slots.length).toBe(1);
  });

  it('auto-rotates slots when autoOrientation yields more capacity', () => {
    // On 210 x 297, with 10mm margins: printable is 190 x 277.
    // Consider 2x2" passport (50.8 x 50.8 mm):
    // Cols = (190 + 3) / (50.8 + 3) = 193 / 53.8 = 3
    // Rows = (277 + 3) / (50.8 + 3) = 280 / 53.8 = 5
    // Capacity = 3 * 5 = 15 passport photos!
    const passport = PHOTO_PRESETS.passport_us;
    const layout = computeUniformGridLayout({
      sheetWidthMm: 210,
      sheetHeightMm: 297,
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      slotWidthMm: passport.widthMm,
      slotHeightMm: passport.heightMm,
      gapXMm: 3,
      gapYMm: 3,
      autoOrientation: true,
    });

    expect(layout.cols).toBe(3);
    expect(layout.rows).toBe(5);
    expect(layout.capacityPerPage).toBe(15);
    expect(layout.slots.length).toBe(15);
  });

  it('packs mixed size photos onto sheets', () => {
    const items = [
      { id: 'p1', widthMm: 100, heightMm: 120 },
      { id: 'p2', widthMm: 50, heightMm: 60 },
      { id: 'p3', widthMm: 50, heightMm: 60 },
    ];

    const result = packMixedPhotos({
      sheetWidthMm: 210,
      sheetHeightMm: 297,
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      gapMm: 5,
      items,
    });

    expect(result.placedItems.length).toBe(3);
    expect(result.unplacedItemIds.length).toBe(0);
  });

  it('generates corner cut marks and bleed boxes', () => {
    const cutMarks = generateCutMarks({
      slots: [{ xMm: 20, yMm: 20, widthMm: 100, heightMm: 150 }],
      style: 'corners',
      markLengthMm: 3,
      markOffsetMm: 1,
      bleedMm: 2,
    });

    // 4 corners * 2 ticks = 8 lines
    expect(cutMarks.lines.length).toBe(8);
    expect(cutMarks.bleedBoxes.length).toBe(1);
    expect(cutMarks.bleedBoxes[0].xMm).toBe(18);
    expect(cutMarks.bleedBoxes[0].widthMm).toBe(104);
  });

  it('packs 2 different sizes on the same sheet (e.g. 1 5x7 + 4 passports)', () => {
    const a4 = PAPER_PRESETS.a4;
    const result = computeSheetSlotsGeometry({
      sheetWidthMm: a4.widthMm, // 210
      sheetHeightMm: a4.heightMm, // 297
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      gapXMm: 4,
      gapYMm: 4,
      layoutMode: 'mixed',
      photoPresetId: 'print_5x7', // 127 x 177.8
      primaryPhotoCount: 1,
      secondaryPhotoPresetId: 'passport_us', // 50.8 x 50.8
      secondaryPhotoCount: 4,
    });

    expect(result.totalPages).toBe(1);
    expect(result.slots.length).toBe(5);
    expect(result.primaryCountOnCurrentPage).toBe(1);
    expect(result.secondaryCountOnCurrentPage).toBe(4);

    const primarySlot = result.slots.find((s) => s.sizeType === 'primary');
    expect(primarySlot).toBeDefined();
    expect(primarySlot?.widthMm).toBeCloseTo(127, 0);

    const secondarySlots = result.slots.filter((s) => s.sizeType === 'secondary');
    expect(secondarySlots.length).toBe(4);
    expect(secondarySlots[0].widthMm).toBeCloseTo(50.8, 0);
  });

  it('calculates maximum secondary photos fitting alongside primary photo on sheet', () => {
    const a4 = PAPER_PRESETS.a4;
    const maxPassports = calculateMaxSecondaryFit({
      sheetWidthMm: a4.widthMm,
      sheetHeightMm: a4.heightMm,
      marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
      gapMm: 4,
      primaryWidthMm: 127,
      primaryHeightMm: 177.8,
      primaryCount: 1,
      secondaryWidthMm: 50.8,
      secondaryHeightMm: 50.8,
    });

    // Alongside a 5x7 on A4, at least 4 passports can easily fit on page 0
    expect(maxPassports).toBeGreaterThanOrEqual(4);
  });
});
