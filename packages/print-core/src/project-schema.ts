import { MarginsMm, CutMarkStyle } from '@pixture/layout-engine';

export interface PhotoAsset {
  id: string;
  name: string;
  dataUrl: string; // base64 or object URL
  width: number;
  height: number;
  type: string;
  sizeBytes: number;
}

export interface PhotoSlotAdjustment {
  cropX: number; // 0 to 1 normalized
  cropY: number; // 0 to 1 normalized
  zoom: number; // 1.0 to 5.0
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  fitMode: 'cover' | 'contain';
  brightness: number; // -100 to 100
  contrast: number; // -100 to 100
  saturation: number; // -100 to 100
  grayscale: boolean;
  hasWhiteBorder: boolean;
  whiteBorderWidthMm: number;
  isPolaroid: boolean;
  polaroidCaption?: string;
}

export const DEFAULT_ADJUSTMENTS: PhotoSlotAdjustment = {
  cropX: 0.5,
  cropY: 0.5,
  zoom: 1.0,
  rotation: 0,
  flipH: false,
  flipV: false,
  fitMode: 'cover',
  brightness: 0,
  contrast: 0,
  saturation: 0,
  grayscale: false,
  hasWhiteBorder: false,
  whiteBorderWidthMm: 2.0,
  isPolaroid: false,
  polaroidCaption: '',
};

export interface SheetConfig {
  paperId: string;
  customWidthMm?: number;
  customHeightMm?: number;
  orientation: 'portrait' | 'landscape';
  photoPresetId: string;
  customPhotoWidthMm?: number;
  customPhotoHeightMm?: number;
  marginsMm: MarginsMm;
  gapXMm: number;
  gapYMm: number;
  layoutMode: 'uniform' | 'mixed';
  autoOrientation: boolean;
  cutMarkStyle: CutMarkStyle;
  cutMarkColor: string;
  bleedMm: number;
}

export const DEFAULT_SHEET_CONFIG: SheetConfig = {
  paperId: 'a4',
  orientation: 'portrait',
  photoPresetId: 'print_4x6',
  marginsMm: { top: 10, right: 10, bottom: 10, left: 10 },
  gapXMm: 4,
  gapYMm: 4,
  layoutMode: 'uniform',
  autoOrientation: true,
  cutMarkStyle: 'corners',
  cutMarkColor: '#202124',
  bleedMm: 0,
};

export interface PageSlotAssignment {
  slotIndex: number;
  photoId: string | null;
  adjustments: PhotoSlotAdjustment;
  customWidthMm?: number; // For mixed layout mode
  customHeightMm?: number;
}

export interface SheetPage {
  id: string;
  pageNumber: number;
  slots: PageSlotAssignment[];
}

export interface PixtureProject {
  version: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  config: SheetConfig;
  photos: PhotoAsset[];
  pages: SheetPage[];
}
