export type Unit = 'mm' | 'cm' | 'in';

const MM_PER_INCH = 25.4;

export function convertUnits(value: number, from: Unit, to: Unit): number {
  if (from === to) return value;

  // Convert from source to millimeters
  let inMm: number;
  switch (from) {
    case 'mm':
      inMm = value;
      break;
    case 'cm':
      inMm = value * 10;
      break;
    case 'in':
      inMm = value * MM_PER_INCH;
      break;
  }

  // Convert from millimeters to target
  switch (to) {
    case 'mm':
      return inMm;
    case 'cm':
      return inMm / 10;
    case 'in':
      return inMm / MM_PER_INCH;
  }
}

/**
 * Converts millimeters to pixels at a given DPI (default 300 for print, 96 for screen)
 */
export function mmToPixels(mm: number, dpi: number = 300): number {
  return Math.round((mm / MM_PER_INCH) * dpi);
}

/**
 * Converts pixels to millimeters at a given DPI
 */
export function pixelsToMm(px: number, dpi: number = 300): number {
  return (px / dpi) * MM_PER_INCH;
}

/**
 * Formats a measurement with localized unit abbreviation
 */
export function formatMeasurement(
  valueInMm: number,
  targetUnit: Unit,
  precision: number = 1
): string {
  const converted = convertUnits(valueInMm, 'mm', targetUnit);
  const rounded = Number(converted.toFixed(precision));
  return `${rounded} ${targetUnit}`;
}
