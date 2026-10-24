import {
  SheetConfig,
  PhotoAsset,
  SheetPage,
  DEFAULT_SHEET_CONFIG,
} from '@pixture/print-core';
import { Unit } from '@pixture/layout-engine';

export interface ProjectState {
  projectName: string;
  config: SheetConfig;
  photos: PhotoAsset[];
  pages: SheetPage[];
  currentPageIndex: number;
  selectedSlotIndex: number | null;
  activePanelTab: 'sheet' | 'cutmarks' | 'inspector';
  showCutMarksOnCanvas: boolean;
  activeUnit: Unit;
  zoomScale: number;
  isCropModalOpen: boolean;
  announcement: string;
  canUndo: boolean;
  canRedo: boolean;
}

export const INITIAL_STATE: ProjectState = {
  projectName: 'My Photo Print',
  config: { ...DEFAULT_SHEET_CONFIG },
  photos: [],
  pages: [
    {
      id: 'page_1',
      pageNumber: 1,
      slots: [],
    },
  ],
  currentPageIndex: 0,
  selectedSlotIndex: null,
  activePanelTab: 'sheet',
  showCutMarksOnCanvas: true,
  activeUnit: 'mm',
  zoomScale: 1.0,
  isCropModalOpen: false,
  announcement: '',
  canUndo: false,
  canRedo: false,
};
