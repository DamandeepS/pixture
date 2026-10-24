import { MarginsMm } from './uniform-grid.js';

export interface PackItemInput {
  id: string;
  widthMm: number;
  heightMm: number;
}

export interface PlacedPackItem {
  id: string;
  pageIndex: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
}

interface FreeRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MixedPackingConfig {
  sheetWidthMm: number;
  sheetHeightMm: number;
  marginsMm: MarginsMm;
  gapMm: number;
  items: PackItemInput[];
}

export interface MixedPackingResult {
  pagesCount: number;
  placedItems: PlacedPackItem[];
  unplacedItemIds: string[];
}

/**
 * 2D Guillotine Rectangle Bin-Packing algorithm for mixed-size photo sheets
 */
export function packMixedPhotos(config: MixedPackingConfig): MixedPackingResult {
  const { sheetWidthMm, sheetHeightMm, marginsMm, gapMm, items } = config;

  const printableW = Math.max(0, sheetWidthMm - marginsMm.left - marginsMm.right);
  const printableH = Math.max(0, sheetHeightMm - marginsMm.top - marginsMm.bottom);

  if (printableW <= 0 || printableH <= 0 || items.length === 0) {
    return {
      pagesCount: 1,
      placedItems: [],
      unplacedItemIds: items.map((i) => i.id),
    };
  }

  // Sort items by area / max dimension descending for optimal packing
  const sortedItems = [...items].sort((a, b) => {
    const areaA = a.widthMm * a.heightMm;
    const areaB = b.widthMm * b.heightMm;
    return areaB - areaA;
  });

  const placedItems: PlacedPackItem[] = [];
  const unplacedItemIds: string[] = [];

  let currentPage = 0;
  let remainingItems = [...sortedItems];

  const MAX_PAGES = 50; // Safety guard against runaway loops

  while (remainingItems.length > 0 && currentPage < MAX_PAGES) {
    let freeRectangles: FreeRect[] = [
      {
        x: marginsMm.left,
        y: marginsMm.top,
        w: printableW,
        h: printableH,
      },
    ];

    const nextRemaining: PackItemInput[] = [];

    for (const item of remainingItems) {
      const itemW = item.widthMm;
      const itemH = item.heightMm;

      // Find best-fitting free rectangle (minimizing leftover area)
      let bestRectIdx = -1;
      let minLeftoverArea = Number.POSITIVE_INFINITY;

      for (let i = 0; i < freeRectangles.length; i++) {
        const free = freeRectangles[i];
        if (itemW <= free.w && itemH <= free.h) {
          const leftoverArea = free.w * free.h - itemW * itemH;
          if (leftoverArea < minLeftoverArea) {
            minLeftoverArea = leftoverArea;
            bestRectIdx = i;
          }
        }
      }

      if (bestRectIdx !== -1) {
        const targetRect = freeRectangles[bestRectIdx];

        placedItems.push({
          id: item.id,
          pageIndex: currentPage,
          xMm: targetRect.x,
          yMm: targetRect.y,
          widthMm: itemW,
          heightMm: itemH,
        });

        // Split target rectangle using Guillotine split (horizontal vs vertical)
        const chosen = freeRectangles.splice(bestRectIdx, 1)[0];
        const rightW = chosen.w - itemW - gapMm;
        const bottomH = chosen.h - itemH - gapMm;

        const newRects: FreeRect[] = [];

        // Short-axis split rule
        if (rightW > 0) {
          newRects.push({
            x: chosen.x + itemW + gapMm,
            y: chosen.y,
            w: rightW,
            h: itemH,
          });
        }
        if (bottomH > 0) {
          newRects.push({
            x: chosen.x,
            y: chosen.y + itemH + gapMm,
            w: chosen.w,
            h: bottomH,
          });
        }

        freeRectangles.push(...newRects);
      } else {
        // Does not fit on current page
        nextRemaining.push(item);
      }
    }

    if (nextRemaining.length === remainingItems.length) {
      // No item could fit on a fresh page - items are larger than the printable page!
      unplacedItemIds.push(...nextRemaining.map((i) => i.id));
      break;
    }

    remainingItems = nextRemaining;
    currentPage++;
  }

  return {
    pagesCount: Math.max(1, currentPage),
    placedItems,
    unplacedItemIds,
  };
}
