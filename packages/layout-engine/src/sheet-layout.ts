import { MarginsMm, computeUniformGridLayout } from './uniform-grid.js';
import { packMixedPhotos, PackItemInput } from './bin-packer.js';
import { PHOTO_PRESETS } from './photo-presets.js';

export interface SheetSlotGeometry {
  index: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  isRotated: boolean;
  sizeType: 'primary' | 'secondary';
  pageIndex: number;
  presetId?: string;
  sizeLabel?: string;
}

export interface ComputeSlotsGeometryOptions {
  sheetWidthMm: number;
  sheetHeightMm: number;
  marginsMm: MarginsMm;
  gapXMm: number;
  gapYMm: number;
  layoutMode: 'uniform' | 'mixed';
  autoOrientation?: boolean;
  allowAutoRotate?: boolean;

  // Primary size
  photoPresetId: string;
  customPhotoWidthMm?: number;
  customPhotoHeightMm?: number;
  primaryPhotoCount?: number;

  // Secondary size (for 2 different sizes layout)
  secondaryPhotoPresetId?: string;
  customSecondaryWidthMm?: number;
  customSecondaryHeightMm?: number;
  secondaryPhotoCount?: number;

  currentPageIndex?: number;
}

export interface ComputeSlotsGeometryResult {
  slots: SheetSlotGeometry[];
  allPlacedSlots: SheetSlotGeometry[];
  totalPages: number;
  unplacedCount: number;
  primaryCountOnCurrentPage: number;
  secondaryCountOnCurrentPage: number;
}

export function computeSheetSlotsGeometry(options: ComputeSlotsGeometryOptions): ComputeSlotsGeometryResult {
  const {
    sheetWidthMm,
    sheetHeightMm,
    marginsMm,
    gapXMm,
    gapYMm,
    layoutMode,
    autoOrientation = false,
    allowAutoRotate = true,
    photoPresetId,
    customPhotoWidthMm,
    customPhotoHeightMm,
    primaryPhotoCount = 1,
    secondaryPhotoPresetId = 'passport_us',
    customSecondaryWidthMm,
    customSecondaryHeightMm,
    secondaryPhotoCount = 4,
    currentPageIndex = 0,
  } = options;

  // Primary size
  const primPreset = PHOTO_PRESETS[photoPresetId] || PHOTO_PRESETS.print_4x6;
  const primW = customPhotoWidthMm || primPreset.widthMm;
  const primH = customPhotoHeightMm || primPreset.heightMm;

  if (layoutMode === 'uniform') {
    const grid = computeUniformGridLayout({
      sheetWidthMm,
      sheetHeightMm,
      marginsMm,
      slotWidthMm: primW,
      slotHeightMm: primH,
      gapXMm,
      gapYMm,
      autoOrientation,
      allowAutoRotate: primPreset.allowAutoRotate !== false && allowAutoRotate,
    });

    const slots: SheetSlotGeometry[] = grid.slots.map((s) => ({
      index: s.index,
      xMm: s.xMm,
      yMm: s.yMm,
      widthMm: s.widthMm,
      heightMm: s.heightMm,
      isRotated: s.isRotated,
      sizeType: 'primary',
      pageIndex: 0,
      presetId: photoPresetId,
      sizeLabel: primPreset.name,
    }));

    return {
      slots,
      allPlacedSlots: slots,
      totalPages: 1,
      unplacedCount: 0,
      primaryCountOnCurrentPage: slots.length,
      secondaryCountOnCurrentPage: 0,
    };
  }

  // Mixed 2 different sizes mode
  const secPreset = PHOTO_PRESETS[secondaryPhotoPresetId] || PHOTO_PRESETS.passport_us;
  const secW = customSecondaryWidthMm || secPreset.widthMm;
  const secH = customSecondaryHeightMm || secPreset.heightMm;

  const items: PackItemInput[] = [];

  for (let i = 0; i < Math.max(0, primaryPhotoCount); i++) {
    items.push({
      id: `prim_${i}`,
      widthMm: primW,
      heightMm: primH,
    });
  }

  for (let i = 0; i < Math.max(0, secondaryPhotoCount); i++) {
    items.push({
      id: `sec_${i}`,
      widthMm: secW,
      heightMm: secH,
    });
  }

  const packResult = packMixedPhotos({
    sheetWidthMm,
    sheetHeightMm,
    marginsMm,
    gapMm: gapXMm,
    items,
  });

  const allPlacedSlots: SheetSlotGeometry[] = packResult.placedItems.map((item, idx) => {
    const isPrimary = item.id.startsWith('prim_');
    return {
      index: idx,
      xMm: item.xMm,
      yMm: item.yMm,
      widthMm: item.widthMm,
      heightMm: item.heightMm,
      isRotated: false,
      sizeType: isPrimary ? 'primary' : 'secondary',
      pageIndex: item.pageIndex,
      presetId: isPrimary ? photoPresetId : secondaryPhotoPresetId,
      sizeLabel: isPrimary ? primPreset.name : secPreset.name,
    };
  });

  const pageSlots = allPlacedSlots.filter((s) => s.pageIndex === currentPageIndex);

  // Re-index slots for the current page so indices match 0..N-1 on this page
  const reindexedPageSlots = pageSlots.map((s, idx) => ({
    ...s,
    index: idx,
  }));

  const primaryCountOnCurrentPage = reindexedPageSlots.filter((s) => s.sizeType === 'primary').length;
  const secondaryCountOnCurrentPage = reindexedPageSlots.filter((s) => s.sizeType === 'secondary').length;

  return {
    slots: reindexedPageSlots,
    allPlacedSlots,
    totalPages: Math.max(1, packResult.pagesCount),
    unplacedCount: packResult.unplacedItemIds.length,
    primaryCountOnCurrentPage,
    secondaryCountOnCurrentPage,
  };
}

/**
 * Calculates the maximum quantity of secondary photos that can fit on Page 0
 * alongside the chosen primary photos
 */
export function calculateMaxSecondaryFit(options: {
  sheetWidthMm: number;
  sheetHeightMm: number;
  marginsMm: MarginsMm;
  gapMm: number;
  primaryWidthMm: number;
  primaryHeightMm: number;
  primaryCount: number;
  secondaryWidthMm: number;
  secondaryHeightMm: number;
}): number {
  const {
    sheetWidthMm,
    sheetHeightMm,
    marginsMm,
    gapMm,
    primaryWidthMm,
    primaryHeightMm,
    primaryCount,
    secondaryWidthMm,
    secondaryHeightMm,
  } = options;

  let bestCount = 0;

  for (let n = 1; n <= 40; n++) {
    const items: PackItemInput[] = [];
    for (let i = 0; i < primaryCount; i++) {
      items.push({ id: `prim_${i}`, widthMm: primaryWidthMm, heightMm: primaryHeightMm });
    }
    for (let i = 0; i < n; i++) {
      items.push({ id: `sec_${i}`, widthMm: secondaryWidthMm, heightMm: secondaryHeightMm });
    }

    const res = packMixedPhotos({
      sheetWidthMm,
      sheetHeightMm,
      marginsMm,
      gapMm,
      items,
    });

    const allFitOnPage0 =
      res.placedItems.length === items.length && res.placedItems.every((item) => item.pageIndex === 0);

    if (allFitOnPage0) {
      bestCount = n;
    } else {
      break;
    }
  }

  return bestCount;
}
