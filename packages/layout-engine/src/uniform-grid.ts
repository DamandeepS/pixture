export interface MarginsMm {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface GridConfig {
  sheetWidthMm: number;
  sheetHeightMm: number;
  marginsMm: MarginsMm;
  slotWidthMm: number;
  slotHeightMm: number;
  gapXMm: number;
  gapYMm: number;
  autoOrientation?: boolean;
  allowAutoRotate?: boolean;
}

export interface GridSlot {
  index: number;
  col: number;
  row: number;
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
  isRotated: boolean;
}

export interface UniformGridLayoutResult {
  cols: number;
  rows: number;
  capacityPerPage: number;
  actualSlotWidthMm: number;
  actualSlotHeightMm: number;
  isRotated: boolean;
  slots: GridSlot[];
  printableWidthMm: number;
  printableHeightMm: number;
  gridTotalWidthMm: number;
  gridTotalHeightMm: number;
  offsetX: number;
  offsetY: number;
}

export function computeUniformGridLayout(config: GridConfig): UniformGridLayoutResult {
  const {
    sheetWidthMm,
    sheetHeightMm,
    marginsMm,
    slotWidthMm,
    slotHeightMm,
    gapXMm,
    gapYMm,
    autoOrientation = false,
    allowAutoRotate = true,
  } = config;

  const printableW = Math.max(0, sheetWidthMm - marginsMm.left - marginsMm.right);
  const printableH = Math.max(0, sheetHeightMm - marginsMm.top - marginsMm.bottom);

  // Evaluate normal orientation
  const calcFit = (w: number, h: number) => {
    if (w <= 0 || h <= 0 || printableW < w || printableH < h) {
      return { cols: 0, rows: 0, capacity: 0 };
    }
    const cols = Math.floor((printableW + gapXMm) / (w + gapXMm));
    const rows = Math.floor((printableH + gapYMm) / (h + gapYMm));
    return {
      cols: Math.max(0, cols),
      rows: Math.max(0, rows),
      capacity: Math.max(0, cols * rows),
    };
  };

  const normalFit = calcFit(slotWidthMm, slotHeightMm);
  const rotatedFit = calcFit(slotHeightMm, slotWidthMm);

  let useRotated = false;
  let finalCols = normalFit.cols;
  let finalRows = normalFit.rows;
  let finalCapacity = normalFit.capacity;
  let finalW = slotWidthMm;
  let finalH = slotHeightMm;

  if (autoOrientation && allowAutoRotate && rotatedFit.capacity > normalFit.capacity) {
    useRotated = true;
    finalCols = rotatedFit.cols;
    finalRows = rotatedFit.rows;
    finalCapacity = rotatedFit.capacity;
    finalW = slotHeightMm;
    finalH = slotWidthMm;
  }

  const gridTotalW = finalCols > 0 ? finalCols * finalW + (finalCols - 1) * gapXMm : 0;
  const gridTotalH = finalRows > 0 ? finalRows * finalH + (finalRows - 1) * gapYMm : 0;

  // Center grid within printable area
  const offsetX = marginsMm.left + Math.max(0, (printableW - gridTotalW) / 2);
  const offsetY = marginsMm.top + Math.max(0, (printableH - gridTotalH) / 2);

  const slots: GridSlot[] = [];
  let index = 0;

  for (let r = 0; r < finalRows; r++) {
    for (let c = 0; c < finalCols; c++) {
      slots.push({
        index,
        col: c,
        row: r,
        xMm: offsetX + c * (finalW + gapXMm),
        yMm: offsetY + r * (finalH + gapYMm),
        widthMm: finalW,
        heightMm: finalH,
        isRotated: useRotated,
      });
      index++;
    }
  }

  return {
    cols: finalCols,
    rows: finalRows,
    capacityPerPage: finalCapacity,
    actualSlotWidthMm: finalW,
    actualSlotHeightMm: finalH,
    isRotated: useRotated,
    slots,
    printableWidthMm: printableW,
    printableHeightMm: printableH,
    gridTotalWidthMm: gridTotalW,
    gridTotalHeightMm: gridTotalH,
    offsetX,
    offsetY,
  };
}
