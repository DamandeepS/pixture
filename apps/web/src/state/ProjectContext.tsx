import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { get, set } from 'idb-keyval';
import {
  SheetConfig,
  PhotoAsset,
  SheetPage,
  PhotoSlotAdjustment,
  DEFAULT_ADJUSTMENTS,
  PixtureProject,
  PageSlotAssignment,
} from '@pixture/print-core';
import {
  Unit,
  computeUniformGridLayout,
  getPaperDimensions,
  PHOTO_PRESETS,
  computeSheetSlotsGeometry,
} from '@pixture/layout-engine';
import { ProjectState, INITIAL_STATE } from './project-store.js';
import { SAMPLE_PHOTOS } from '../utils/samplePhotos.js';

interface ProjectContextValue extends ProjectState {
  setProjectName: (name: string) => void;
  updateConfig: (patch: Partial<SheetConfig>) => void;
  setUnit: (unit: Unit) => void;
  setZoomScale: (zoom: number | ((prev: number) => number)) => void;
  setSelectedSlotIndex: (idx: number | null) => void;
  setActivePanelTab: (tab: 'sheet' | 'cutmarks' | 'inspector') => void;
  setShowCutMarksOnCanvas: (show: boolean | ((prev: boolean) => boolean)) => void;
  setIsCropModalOpen: (open: boolean) => void;
  addUploadedPhotos: (files: File[], targetSlotIndex?: number) => Promise<void>;
  loadSamplePhotos: () => void;
  removePhoto: (photoId: string) => void;
  assignPhotoToSlot: (slotIndex: number, photoId: string | null) => void;
  updateSlotAdjustments: (slotIndex: number, adjustments: Partial<PhotoSlotAdjustment>) => void;
  fillPageWithPhoto: (photoId: string) => void;
  autoPackAllPhotos: () => void;
  addNewPage: () => void;
  removeCurrentPage: () => void;
  goToPage: (index: number) => void;
  undo: () => void;
  redo: () => void;
  resetProject: () => void;
  exportProjectJson: () => void;
  importProjectJson: (jsonString: string) => boolean;
  announce: (msg: string) => void;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

const STORAGE_KEY = 'pixture_active_project_v2';

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ProjectState>(() => {
    // Start with sample photos populated so the first impression is gorgeous and ready to interact
    const initialSlots: PageSlotAssignment[] = SAMPLE_PHOTOS.map((photo, idx) => ({
      slotIndex: idx,
      photoId: photo.id,
      adjustments: { ...DEFAULT_ADJUSTMENTS },
    }));

    return {
      ...INITIAL_STATE,
      photos: [...SAMPLE_PHOTOS],
      pages: [
        {
          id: 'page_1',
          pageNumber: 1,
          slots: initialSlots,
        },
      ],
      selectedSlotIndex: 0,
      activePanelTab: 'inspector',
    };
  });

  const historyRef = useRef<{
    past: ProjectState[];
    future: ProjectState[];
  }>({ past: [], future: [] });

  const recordHistory = useCallback((prevState: ProjectState) => {
    historyRef.current.past.push({ ...prevState });
    if (historyRef.current.past.length > 30) {
      historyRef.current.past.shift();
    }
    historyRef.current.future = [];
  }, []);

  // Load from IndexedDB on startup
  useEffect(() => {
    async function loadSaved() {
      try {
        const saved = await get<Partial<ProjectState>>(STORAGE_KEY);
        if (saved && saved.pages && saved.config) {
          setState((prev) => ({
            ...prev,
            projectName: saved.projectName || prev.projectName,
            config: saved.config || prev.config,
            photos: saved.photos && saved.photos.length > 0 ? saved.photos : prev.photos,
            pages: saved.pages && saved.pages.length > 0 ? saved.pages : prev.pages,
            activeUnit: saved.activeUnit || prev.activeUnit,
          }));
        }
      } catch (err) {
        console.warn('Could not load project from IndexedDB', err);
      }
    }
    loadSaved();
  }, []);

  // Auto-save to IndexedDB (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      set(STORAGE_KEY, {
        projectName: state.projectName,
        config: state.config,
        photos: state.photos,
        pages: state.pages,
        activeUnit: state.activeUnit,
      }).catch((err) => console.warn('Auto-save error', err));
    }, 1000);
    return () => clearTimeout(timer);
  }, [state.projectName, state.config, state.photos, state.pages, state.activeUnit]);

  const announce = useCallback((msg: string) => {
    setState((prev) => ({ ...prev, announcement: msg }));
  }, []);

  const setProjectName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, projectName: name }));
  }, []);

  const updateConfig = useCallback((patch: Partial<SheetConfig>) => {
    setState((prev) => {
      recordHistory(prev);
      return {
        ...prev,
        config: { ...prev.config, ...patch },
        canUndo: true,
        canRedo: false,
      };
    });
  }, [recordHistory]);

  const setUnit = useCallback((unit: Unit) => {
    setState((prev) => ({ ...prev, activeUnit: unit }));
  }, []);

  const setZoomScale = useCallback((zoomOrFn: number | ((prev: number) => number)) => {
    setState((prev) => ({
      ...prev,
      zoomScale: typeof zoomOrFn === 'function' ? zoomOrFn(prev.zoomScale) : zoomOrFn,
    }));
  }, []);

  const setSelectedSlotIndex = useCallback((idx: number | null) => {
    setState((prev) => ({
      ...prev,
      selectedSlotIndex: idx,
      activePanelTab: idx !== null ? 'inspector' : prev.activePanelTab,
    }));
  }, []);

  const setActivePanelTab = useCallback((tab: 'sheet' | 'cutmarks' | 'inspector') => {
    setState((prev) => ({ ...prev, activePanelTab: tab }));
  }, []);

  const setShowCutMarksOnCanvas = useCallback((showOrFn: boolean | ((prev: boolean) => boolean)) => {
    setState((prev) => ({
      ...prev,
      showCutMarksOnCanvas: typeof showOrFn === 'function' ? showOrFn(prev.showCutMarksOnCanvas) : showOrFn,
    }));
  }, []);

  const setIsCropModalOpen = useCallback((open: boolean) => {
    setState((prev) => ({ ...prev, isCropModalOpen: open }));
  }, []);

  const addUploadedPhotos = useCallback(async (files: File[], targetSlotIndex?: number) => {
    const newAssets: PhotoAsset[] = [];

    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const { w, h } = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => resolve({ w: 800, h: 600 });
        img.src = dataUrl;
      });

      newAssets.push({
        id: 'photo_' + Math.random().toString(36).slice(2, 10),
        name: file.name,
        dataUrl,
        width: w,
        height: h,
        type: file.type,
        sizeBytes: file.size,
      });
    }

    if (newAssets.length === 0) return;

    setState((prev) => {
      recordHistory(prev);

      const updatedPhotos = [...prev.photos, ...newAssets];
      let updatedPages = [...prev.pages];

      const curPage = { ...updatedPages[prev.currentPageIndex] };
      const curSlots = [...curPage.slots];

      if (targetSlotIndex !== undefined) {
        // Assign first uploaded photo directly to the target slot
        const firstPhoto = newAssets[0];
        const existingSlot = curSlots.find((s) => s.slotIndex === targetSlotIndex);
        if (existingSlot) {
          existingSlot.photoId = firstPhoto.id;
        } else {
          curSlots.push({
            slotIndex: targetSlotIndex,
            photoId: firstPhoto.id,
            adjustments: { ...DEFAULT_ADJUSTMENTS },
          });
        }

        // Fill remaining uploaded photos into other empty slots
        let remainingIdx = 1;
        for (let i = 0; i < 50 && remainingIdx < newAssets.length; i++) {
          if (i === targetSlotIndex) continue;
          let slot = curSlots.find((s) => s.slotIndex === i);
          if (!slot) {
            curSlots.push({
              slotIndex: i,
              photoId: newAssets[remainingIdx].id,
              adjustments: { ...DEFAULT_ADJUSTMENTS },
            });
            remainingIdx++;
          } else if (!slot.photoId) {
            slot.photoId = newAssets[remainingIdx].id;
            remainingIdx++;
          }
        }
      } else {
        // Auto-assign to empty slots
        const paperDim = getPaperDimensions(
          prev.config.paperId,
          prev.config.orientation,
          prev.config.customWidthMm,
          prev.config.customHeightMm
        );

        const photoPreset = PHOTO_PRESETS[prev.config.photoPresetId] || PHOTO_PRESETS.print_4x6;
        const photoW = prev.config.customPhotoWidthMm || photoPreset.widthMm;
        const photoH = prev.config.customPhotoHeightMm || photoPreset.heightMm;

        const grid = computeUniformGridLayout({
          sheetWidthMm: paperDim.widthMm,
          sheetHeightMm: paperDim.heightMm,
          marginsMm: prev.config.marginsMm,
          slotWidthMm: photoW,
          slotHeightMm: photoH,
          gapXMm: prev.config.gapXMm,
          gapYMm: prev.config.gapYMm,
          autoOrientation: prev.config.autoOrientation,
        });

        let assetIdx = 0;
        for (let i = 0; i < grid.capacityPerPage && assetIdx < newAssets.length; i++) {
          let slot = curSlots.find((s) => s.slotIndex === i);
          if (!slot) {
            curSlots.push({
              slotIndex: i,
              photoId: newAssets[assetIdx].id,
              adjustments: { ...DEFAULT_ADJUSTMENTS },
            });
            assetIdx++;
          } else if (!slot.photoId) {
            slot.photoId = newAssets[assetIdx].id;
            assetIdx++;
          }
        }
      }

      curPage.slots = curSlots;
      updatedPages[prev.currentPageIndex] = curPage;

      return {
        ...prev,
        photos: updatedPhotos,
        pages: updatedPages,
        selectedSlotIndex: targetSlotIndex !== undefined ? targetSlotIndex : prev.selectedSlotIndex,
        activePanelTab: 'inspector',
        canUndo: true,
        canRedo: false,
        announcement: `${newAssets.length} photo(s) added.`,
      };
    });
  }, [recordHistory]);

  const loadSamplePhotos = useCallback(() => {
    setState((prev) => {
      recordHistory(prev);
      const updatedPhotos = [...SAMPLE_PHOTOS];
      const curPage = { ...prev.pages[0] };
      const curSlots: PageSlotAssignment[] = [];

      for (let i = 0; i < 4; i++) {
        curSlots.push({
          slotIndex: i,
          photoId: updatedPhotos[i % updatedPhotos.length].id,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
        });
      }
      curPage.slots = curSlots;

      return {
        ...prev,
        photos: updatedPhotos,
        pages: [curPage, ...prev.pages.slice(1)],
        currentPageIndex: 0,
        selectedSlotIndex: 0,
        activePanelTab: 'inspector',
        canUndo: true,
        canRedo: false,
        announcement: 'Sample photos loaded.',
      };
    });
  }, [recordHistory]);

  const removePhoto = useCallback((photoId: string) => {
    setState((prev) => {
      recordHistory(prev);
      const updatedPhotos = prev.photos.filter((p) => p.id !== photoId);
      const updatedPages = prev.pages.map((page) => ({
        ...page,
        slots: page.slots.map((slot) =>
          slot.photoId === photoId ? { ...slot, photoId: null } : slot
        ),
      }));
      return {
        ...prev,
        photos: updatedPhotos,
        pages: updatedPages,
        canUndo: true,
        canRedo: false,
      };
    });
  }, [recordHistory]);

  const assignPhotoToSlot = useCallback((slotIndex: number, photoId: string | null) => {
    setState((prev) => {
      recordHistory(prev);
      const curPage = { ...prev.pages[prev.currentPageIndex] };
      const curSlots = [...curPage.slots];
      const existingIdx = curSlots.findIndex((s) => s.slotIndex === slotIndex);

      if (existingIdx !== -1) {
        curSlots[existingIdx] = {
          ...curSlots[existingIdx],
          photoId,
        };
      } else {
        curSlots.push({
          slotIndex,
          photoId,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
        });
      }

      const updatedPages = [...prev.pages];
      updatedPages[prev.currentPageIndex] = { ...curPage, slots: curSlots };

      return {
        ...prev,
        pages: updatedPages,
        selectedSlotIndex: slotIndex,
        activePanelTab: 'inspector',
        canUndo: true,
        canRedo: false,
      };
    });
  }, [recordHistory]);

  const updateSlotAdjustments = useCallback((slotIndex: number, patch: Partial<PhotoSlotAdjustment>) => {
    setState((prev) => {
      recordHistory(prev);
      const curPage = { ...prev.pages[prev.currentPageIndex] };
      const curSlots = [...curPage.slots];
      const existingIdx = curSlots.findIndex((s) => s.slotIndex === slotIndex);

      if (existingIdx !== -1) {
        curSlots[existingIdx] = {
          ...curSlots[existingIdx],
          adjustments: { ...curSlots[existingIdx].adjustments, ...patch },
        };
      } else {
        curSlots.push({
          slotIndex,
          photoId: null,
          adjustments: { ...DEFAULT_ADJUSTMENTS, ...patch },
        });
      }

      const updatedPages = [...prev.pages];
      updatedPages[prev.currentPageIndex] = { ...curPage, slots: curSlots };

      return {
        ...prev,
        pages: updatedPages,
        canUndo: true,
        canRedo: false,
      };
    });
  }, [recordHistory]);

  const fillPageWithPhoto = useCallback((photoId: string) => {
    setState((prev) => {
      recordHistory(prev);

      const paperDim = getPaperDimensions(
        prev.config.paperId,
        prev.config.orientation,
        prev.config.customWidthMm,
        prev.config.customHeightMm
      );

      const photoPreset = PHOTO_PRESETS[prev.config.photoPresetId] || PHOTO_PRESETS.print_4x6;
      const photoW = prev.config.customPhotoWidthMm || photoPreset.widthMm;
      const photoH = prev.config.customPhotoHeightMm || photoPreset.heightMm;

      const grid = computeUniformGridLayout({
        sheetWidthMm: paperDim.widthMm,
        sheetHeightMm: paperDim.heightMm,
        marginsMm: prev.config.marginsMm,
        slotWidthMm: photoW,
        slotHeightMm: photoH,
        gapXMm: prev.config.gapXMm,
        gapYMm: prev.config.gapYMm,
        autoOrientation: prev.config.autoOrientation,
        allowAutoRotate: photoPreset.allowAutoRotate !== false,
      });

      const newSlots: PageSlotAssignment[] = [];
      for (let i = 0; i < grid.capacityPerPage; i++) {
        newSlots.push({
          slotIndex: i,
          photoId,
          adjustments: { ...DEFAULT_ADJUSTMENTS },
        });
      }

      const curPage = { ...prev.pages[prev.currentPageIndex], slots: newSlots };
      const updatedPages = [...prev.pages];
      updatedPages[prev.currentPageIndex] = curPage;

      return {
        ...prev,
        pages: updatedPages,
        canUndo: true,
        canRedo: false,
        announcement: `Page filled with photo (${grid.capacityPerPage} slots).`,
      };
    });
  }, [recordHistory]);

  const autoPackAllPhotos = useCallback(() => {
    setState((prev) => {
      recordHistory(prev);

      if (prev.photos.length === 0) return prev;

      const paperDim = getPaperDimensions(
        prev.config.paperId,
        prev.config.orientation,
        prev.config.customWidthMm,
        prev.config.customHeightMm
      );

      const res = computeSheetSlotsGeometry({
        sheetWidthMm: paperDim.widthMm,
        sheetHeightMm: paperDim.heightMm,
        marginsMm: prev.config.marginsMm,
        gapXMm: prev.config.gapXMm,
        gapYMm: prev.config.gapYMm,
        layoutMode: prev.config.layoutMode,
        autoOrientation: prev.config.autoOrientation,
        photoPresetId: prev.config.photoPresetId,
        customPhotoWidthMm: prev.config.customPhotoWidthMm,
        customPhotoHeightMm: prev.config.customPhotoHeightMm,
        primaryPhotoCount: prev.config.primaryPhotoCount ?? 1,
        secondaryPhotoPresetId: prev.config.secondaryPhotoPresetId ?? 'passport_us',
        secondaryPhotoCount: prev.config.secondaryPhotoCount ?? 4,
        customSecondaryWidthMm: prev.config.customSecondaryWidthMm,
        customSecondaryHeightMm: prev.config.customSecondaryHeightMm,
        currentPageIndex: 0,
      });

      const capacity = Math.max(1, res.slots.length);
      const totalPagesNeeded = Math.max(1, Math.ceil(prev.photos.length / capacity));

      const newPages: SheetPage[] = [];

      for (let p = 0; p < totalPagesNeeded; p++) {
        const pageSlots: PageSlotAssignment[] = [];
        const slice = prev.photos.slice(p * capacity, (p + 1) * capacity);

        for (let i = 0; i < capacity; i++) {
          const photo = slice[i];
          pageSlots.push({
            slotIndex: i,
            photoId: photo ? photo.id : null,
            adjustments: { ...DEFAULT_ADJUSTMENTS },
          });
        }

        newPages.push({
          id: `page_${p + 1}`,
          pageNumber: p + 1,
          slots: pageSlots,
        });
      }

      return {
        ...prev,
        pages: newPages,
        currentPageIndex: 0,
        canUndo: true,
        canRedo: false,
        announcement: `Auto-packed ${prev.photos.length} photos across ${totalPagesNeeded} page(s).`,
      };
    });
  }, [recordHistory]);

  const addNewPage = useCallback(() => {
    setState((prev) => {
      recordHistory(prev);
      const newPageNumber = prev.pages.length + 1;
      const newPage: SheetPage = {
        id: `page_${newPageNumber}_${Date.now()}`,
        pageNumber: newPageNumber,
        slots: [],
      };
      return {
        ...prev,
        pages: [...prev.pages, newPage],
        currentPageIndex: prev.pages.length,
        canUndo: true,
        canRedo: false,
        announcement: `Added Page ${newPageNumber}.`,
      };
    });
  }, [recordHistory]);

  const removeCurrentPage = useCallback(() => {
    setState((prev) => {
      if (prev.pages.length <= 1) return prev;
      recordHistory(prev);

      const filtered = prev.pages.filter((_, idx) => idx !== prev.currentPageIndex);
      const renumbered = filtered.map((page, idx) => ({
        ...page,
        pageNumber: idx + 1,
      }));

      const nextIndex = Math.min(prev.currentPageIndex, renumbered.length - 1);

      return {
        ...prev,
        pages: renumbered,
        currentPageIndex: nextIndex,
        selectedSlotIndex: null,
        canUndo: true,
        canRedo: false,
        announcement: `Removed page.`,
      };
    });
  }, [recordHistory]);

  const goToPage = useCallback((index: number) => {
    setState((prev) => ({
      ...prev,
      currentPageIndex: Math.max(0, Math.min(index, prev.pages.length - 1)),
      selectedSlotIndex: null,
    }));
  }, []);

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (history.past.length === 0) return;

    const previous = history.past.pop()!;
    setState((current) => {
      history.future.push({ ...current });
      return {
        ...previous,
        canUndo: history.past.length > 0,
        canRedo: true,
      };
    });
  }, []);

  const redo = useCallback(() => {
    const history = historyRef.current;
    if (history.future.length === 0) return;

    const next = history.future.pop()!;
    setState((current) => {
      history.past.push({ ...current });
      return {
        ...next,
        canUndo: true,
        canRedo: history.future.length > 0,
      };
    });
  }, []);

  const resetProject = useCallback(() => {
    setState((prev) => {
      recordHistory(prev);
      return {
        ...INITIAL_STATE,
        photos: [...SAMPLE_PHOTOS],
        canUndo: true,
        canRedo: false,
      };
    });
  }, [recordHistory]);

  const exportProjectJson = useCallback(() => {
    const project: PixtureProject = {
      version: '1.0.0',
      projectName: state.projectName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      config: state.config,
      photos: state.photos,
      pages: state.pages,
    };

    const blob = new Blob([JSON.stringify(project, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${state.projectName.toLowerCase().replace(/\s+/g, '-')}.pixture`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const importProjectJson = useCallback((jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString) as PixtureProject;
      if (!parsed.config || !parsed.pages) {
        throw new Error('Invalid project file format');
      }

      setState((prev) => {
        recordHistory(prev);
        return {
          ...prev,
          projectName: parsed.projectName || 'Imported Project',
          config: parsed.config,
          photos: parsed.photos || [],
          pages: parsed.pages || [],
          currentPageIndex: 0,
          selectedSlotIndex: null,
          canUndo: true,
          canRedo: false,
          announcement: 'Project loaded successfully.',
        };
      });
      return true;
    } catch (err) {
      console.error('Failed to import project', err);
      return false;
    }
  }, [recordHistory]);

  return (
    <ProjectContext.Provider
      value={{
        ...state,
        setProjectName,
        updateConfig,
        setUnit,
        setZoomScale,
        setSelectedSlotIndex,
        setActivePanelTab,
        setShowCutMarksOnCanvas,
        setIsCropModalOpen,
        addUploadedPhotos,
        loadSamplePhotos,
        removePhoto,
        assignPhotoToSlot,
        updateSlotAdjustments,
        fillPageWithPhoto,
        autoPackAllPhotos,
        addNewPage,
        removeCurrentPage,
        goToPage,
        undo,
        redo,
        resetProject,
        exportProjectJson,
        importProjectJson,
        announce,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject(): ProjectContextValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return ctx;
}
