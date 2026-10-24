import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Crop,
  RotateCw,
  Image as ImageIcon,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext.js';
import { useI18n } from '@pixture/i18n';
import {
  getPaperDimensions,
  computeUniformGridLayout,
  packMixedPhotos,
  PHOTO_PRESETS,
  generateCutMarks,
  CutMarkStyle,
} from '@pixture/layout-engine';
import { buildCssFilterString } from '@pixture/print-core';
import { Ruler } from './Ruler.js';

export function SheetCanvas() {
  const {
    config,
    pages,
    photos,
    currentPageIndex,
    selectedSlotIndex,
    setSelectedSlotIndex,
    setIsCropModalOpen,
    assignPhotoToSlot,
    updateSlotAdjustments,
    addNewPage,
    removeCurrentPage,
    goToPage,
    activeUnit,
    zoomScale,
    setZoomScale,
    announce,
  } = useProject();

  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScale, setAutoScale] = useState(1.0);
  const [dragOverSlotIndex, setDragOverSlotIndex] = useState<number | null>(null);

  // Compute paper physical dimensions in mm
  const paperDim = useMemo(() => {
    return getPaperDimensions(
      config.paperId,
      config.orientation,
      config.customWidthMm,
      config.customHeightMm
    );
  }, [config.paperId, config.orientation, config.customWidthMm, config.customHeightMm]);

  // Compute layout slots geometry
  const slotsGeometry = useMemo(() => {
    if (config.layoutMode === 'mixed') {
      const itemsToPack = photos.map((p) => {
        const preset = PHOTO_PRESETS[config.photoPresetId] || PHOTO_PRESETS.print_4x6;
        return {
          id: p.id,
          widthMm: config.customPhotoWidthMm || preset.widthMm,
          heightMm: config.customPhotoHeightMm || preset.heightMm,
        };
      });

      const packResult = packMixedPhotos({
        sheetWidthMm: paperDim.widthMm,
        sheetHeightMm: paperDim.heightMm,
        marginsMm: config.marginsMm,
        gapMm: config.gapXMm,
        items: itemsToPack,
      });

      const pagePlaced = packResult.placedItems.filter((i) => i.pageIndex === currentPageIndex);
      return pagePlaced.map((item, idx) => ({
        index: idx,
        xMm: item.xMm,
        yMm: item.yMm,
        widthMm: item.widthMm,
        heightMm: item.heightMm,
        isRotated: false,
      }));
    }

    const photoPreset = PHOTO_PRESETS[config.photoPresetId] || PHOTO_PRESETS.print_4x6;
    const photoW = config.customPhotoWidthMm || photoPreset.widthMm;
    const photoH = config.customPhotoHeightMm || photoPreset.heightMm;

    const grid = computeUniformGridLayout({
      sheetWidthMm: paperDim.widthMm,
      sheetHeightMm: paperDim.heightMm,
      marginsMm: config.marginsMm,
      slotWidthMm: photoW,
      slotHeightMm: photoH,
      gapXMm: config.gapXMm,
      gapYMm: config.gapYMm,
      autoOrientation: config.autoOrientation,
    });

    return grid.slots;
  }, [config, paperDim, photos, currentPageIndex]);

  // Fit scale calculation based on viewport
  useEffect(() => {
    function calculateFit() {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const padding = 80;
      const availableW = clientWidth - padding;
      const availableH = clientHeight - padding;

      // Base scale: 1mm = ~2.5 pixels on a standard display
      const basePxPerMm = 2.5;
      const sheetW = paperDim.widthMm * basePxPerMm;
      const sheetH = paperDim.heightMm * basePxPerMm;

      const scaleX = availableW / sheetW;
      const scaleY = availableH / sheetH;
      const fit = Math.min(scaleX, scaleY, 1.6);
      setAutoScale(Math.max(0.4, fit));
    }

    calculateFit();
    window.addEventListener('resize', calculateFit);
    return () => window.removeEventListener('resize', calculateFit);
  }, [paperDim]);

  const effectiveScale = autoScale * zoomScale;
  const pxPerMm = 2.5 * effectiveScale;

  const sheetPixelW = paperDim.widthMm * pxPerMm;
  const sheetPixelH = paperDim.heightMm * pxPerMm;

  // Cut marks lines
  const cutMarks = useMemo(() => {
    return generateCutMarks({
      slots: slotsGeometry,
      style: config.cutMarkStyle as CutMarkStyle,
      bleedMm: config.bleedMm,
    });
  }, [slotsGeometry, config.cutMarkStyle, config.bleedMm]);

  const currentPage = pages[currentPageIndex] || pages[0];

  // Drag and drop handlers
  const handleSlotDragOver = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverSlotIndex !== slotIdx) {
      setDragOverSlotIndex(slotIdx);
    }
  };

  const handleSlotDragLeave = () => {
    setDragOverSlotIndex(null);
  };

  const handleSlotDrop = (e: React.DragEvent, slotIdx: number) => {
    e.preventDefault();
    setDragOverSlotIndex(null);

    // Check for photoId transfer
    const photoId = e.dataTransfer.getData('text/plain');
    if (photoId) {
      assignPhotoToSlot(slotIdx, photoId);
      announce(t('announcementPhotoAdded', { name: photoId }));
    }
  };

  const photoMap = useMemo(() => {
    const map = new Map();
    for (const p of photos) {
      map.set(p.id, p);
    }
    return map;
  }, [photos]);

  return (
    <main
      id="main-canvas"
      ref={containerRef}
      className="flex-1 bg-md-surface-container-low relative overflow-auto flex flex-col items-center justify-start p-8 select-none focus:outline-none"
      tabIndex={-1}
      aria-label="Photo sheet canvas editor"
    >
      {/* Floating Canvas Controls (Zoom & Page switcher) */}
      <div className="sticky top-0 z-30 mb-4 flex items-center justify-between w-full max-w-4xl px-4 pointer-events-none">
        {/* Page Switcher */}
        <div className="flex items-center gap-2 bg-md-surface/90 backdrop-blur-md px-3 py-1.5 rounded-md-full shadow-md-2 border border-md-outline-variant pointer-events-auto">
          <button
            onClick={() => goToPage(currentPageIndex - 1)}
            disabled={currentPageIndex <= 0}
            className="p-1 rounded-md-full hover:bg-md-surface-container disabled:opacity-30 transition-colors"
            title="Previous Page"
            aria-label="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold text-md-on-surface px-1">
            {t('pageOf', { current: currentPageIndex + 1, total: pages.length })}
          </span>
          <button
            onClick={() => goToPage(currentPageIndex + 1)}
            disabled={currentPageIndex >= pages.length - 1}
            className="p-1 rounded-md-full hover:bg-md-surface-container disabled:opacity-30 transition-colors"
            title="Next Page"
            aria-label="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-md-outline-variant mx-1"></div>

          <button
            onClick={addNewPage}
            className="flex items-center gap-1 text-xs font-medium text-md-primary hover:bg-md-primary-container px-2 py-0.5 rounded-md-full transition-colors"
            title={t('addPage')}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{t('addPage')}</span>
          </button>

          {pages.length > 1 && (
            <button
              onClick={removeCurrentPage}
              className="p-1 text-md-error hover:bg-md-error-container rounded-md-full transition-colors ml-1"
              title={t('deletePage')}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-md-surface/90 backdrop-blur-md px-3 py-1.5 rounded-md-full shadow-md-2 border border-md-outline-variant pointer-events-auto">
          <button
            onClick={() => setZoomScale((z) => Math.max(0.5, z - 0.15))}
            className="p-1 rounded-md-full hover:bg-md-surface-container transition-colors text-md-on-surface-variant"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono font-medium text-md-on-surface px-1.5 min-w-[45px] text-center">
            {Math.round(zoomScale * 100)}%
          </span>
          <button
            onClick={() => setZoomScale((z) => Math.min(2.5, z + 0.15))}
            className="p-1 rounded-md-full hover:bg-md-surface-container transition-colors text-md-on-surface-variant"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomScale(1.0)}
            className="p-1 rounded-md-full hover:bg-md-surface-container transition-colors text-md-on-surface-variant ml-1"
            title="Reset Zoom"
            aria-label="Reset Zoom"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Ruler & Paper Canvas Area */}
      <div className="relative flex flex-col items-start shadow-md-3 rounded-md-sm bg-md-surface border border-md-outline-variant transition-transform duration-100 ease-out">
        {/* Horizontal Top Ruler */}
        <div className="flex">
          {/* Top-left corner box */}
          <div className="w-6 h-6 bg-md-surface-container border-b border-r border-md-outline-variant flex items-center justify-center text-[8px] font-mono font-bold text-md-on-surface-variant">
            {activeUnit}
          </div>
          <Ruler
            orientation="horizontal"
            lengthMm={paperDim.widthMm}
            scalePxPerMm={pxPerMm}
            unit={activeUnit}
          />
        </div>

        <div className="flex">
          {/* Vertical Left Ruler */}
          <Ruler
            orientation="vertical"
            lengthMm={paperDim.heightMm}
            scalePxPerMm={pxPerMm}
            unit={activeUnit}
          />

          {/* Actual Sheet Paper */}
          <div
            className="relative bg-white overflow-hidden shadow-inner cursor-default"
            style={{
              width: `${sheetPixelW}px`,
              height: `${sheetPixelH}px`,
            }}
            onClick={() => setSelectedSlotIndex(null)}
          >
            {/* Margin Guideline */}
            <div
              className="absolute border border-dashed border-google-blue/30 pointer-events-none"
              style={{
                left: `${config.marginsMm.left * pxPerMm}px`,
                top: `${config.marginsMm.top * pxPerMm}px`,
                width: `${(paperDim.widthMm - config.marginsMm.left - config.marginsMm.right) * pxPerMm}px`,
                height: `${(paperDim.heightMm - config.marginsMm.top - config.marginsMm.bottom) * pxPerMm}px`,
              }}
              aria-hidden="true"
            />

            {/* Cut Markings Lines */}
            {config.cutMarkStyle !== 'none' && (
              <svg
                className="absolute inset-0 pointer-events-none z-10"
                width={sheetPixelW}
                height={sheetPixelH}
                aria-hidden="true"
              >
                {cutMarks.lines.map((line, idx) => (
                  <line
                    key={idx}
                    x1={line.x1Mm * pxPerMm}
                    y1={line.y1Mm * pxPerMm}
                    x2={line.x2Mm * pxPerMm}
                    y2={line.y2Mm * pxPerMm}
                    stroke={config.cutMarkColor || '#202124'}
                    strokeWidth={Math.max(1, 0.15 * pxPerMm)}
                    strokeDasharray={line.style === 'dashed' ? `${4 * pxPerMm},${4 * pxPerMm}` : undefined}
                  />
                ))}
              </svg>
            )}

            {/* Photo Slots */}
            {slotsGeometry.map((slotGeom) => {
              const isSelected = selectedSlotIndex === slotGeom.index;
              const isDragOver = dragOverSlotIndex === slotGeom.index;
              const assignment = currentPage?.slots.find((s) => s.slotIndex === slotGeom.index);
              const photo = assignment?.photoId ? photoMap.get(assignment.photoId) : null;
              const adj = assignment?.adjustments;

              const slotLeft = slotGeom.xMm * pxPerMm;
              const slotTop = slotGeom.yMm * pxPerMm;
              const slotW = slotGeom.widthMm * pxPerMm;
              const slotH = slotGeom.heightMm * pxPerMm;

              return (
                <div
                  key={slotGeom.index}
                  role="button"
                  tabIndex={0}
                  aria-label={`Photo Slot ${slotGeom.index + 1}${photo ? `: ${photo.name}` : ': Empty'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedSlotIndex(slotGeom.index);
                    announce(t('announcementSlotSelected', { index: slotGeom.index + 1 }));
                  }}
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    if (photo) {
                      setSelectedSlotIndex(slotGeom.index);
                      setIsCropModalOpen(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedSlotIndex(slotGeom.index);
                      if (photo) setIsCropModalOpen(true);
                    } else if (e.key === 'Delete' || e.key === 'Backspace') {
                      if (photo) {
                        e.preventDefault();
                        assignPhotoToSlot(slotGeom.index, null);
                      }
                    }
                  }}
                  onDragOver={(e) => handleSlotDragOver(e, slotGeom.index)}
                  onDragLeave={handleSlotDragLeave}
                  onDrop={(e) => handleSlotDrop(e, slotGeom.index)}
                  className={`absolute group cursor-pointer transition-all duration-150 overflow-hidden ${
                    isSelected
                      ? 'ring-2 ring-md-primary ring-offset-2 z-20 shadow-md-2'
                      : 'hover:ring-1 hover:ring-md-primary/50'
                  } ${
                    isDragOver
                      ? 'ring-2 ring-google-green bg-google-green/10 scale-[1.02] z-30'
                      : ''
                  }`}
                  style={{
                    left: `${slotLeft}px`,
                    top: `${slotTop}px`,
                    width: `${slotW}px`,
                    height: `${slotH}px`,
                    backgroundColor: photo ? '#ffffff' : '#f8f9fa',
                  }}
                >
                  {/* Empty Slot Placeholder */}
                  {!photo && (
                    <div className="w-full h-full border border-dashed border-md-outline flex flex-col items-center justify-center p-2 text-center text-md-on-surface-variant hover:border-md-primary hover:text-md-primary transition-colors">
                      <ImageIcon className="w-5 h-5 mb-1 opacity-40" />
                      <span className="text-[10px] font-medium leading-tight opacity-70">
                        {t('addPhotos')}
                      </span>
                    </div>
                  )}

                  {/* Filled Slot Photo Rendering */}
                  {photo && adj && (
                    <div className="w-full h-full relative overflow-hidden flex items-center justify-center">
                      <div
                        className="relative overflow-hidden w-full h-full flex items-center justify-center"
                        style={{
                          padding: adj.isPolaroid
                            ? `${5 * pxPerMm}px ${5 * pxPerMm}px ${20 * pxPerMm}px ${5 * pxPerMm}px`
                            : adj.hasWhiteBorder
                              ? `${adj.whiteBorderWidthMm * pxPerMm}px`
                              : 0,
                          backgroundColor: '#ffffff',
                        }}
                      >
                        <img
                          src={photo.dataUrl}
                          alt={photo.name}
                          className="max-w-none pointer-events-none select-none transition-transform"
                          style={{
                            width: adj.fitMode === 'contain' ? '100%' : `${100 * adj.zoom}%`,
                            height: adj.fitMode === 'contain' ? '100%' : `${100 * adj.zoom}%`,
                            objectFit: adj.fitMode === 'contain' ? 'contain' : 'cover',
                            objectPosition: `${adj.cropX * 100}% ${adj.cropY * 100}%`,
                            transform: `rotate(${adj.rotation}deg) scale(${adj.flipH ? -1 : 1}, ${adj.flipV ? -1 : 1})`,
                            filter: buildCssFilterString(adj),
                          }}
                        />

                        {adj.isPolaroid && adj.polaroidCaption && (
                          <div
                            className="absolute bottom-1 w-full text-center font-caveat text-md-on-surface truncate px-1"
                            style={{ fontSize: `${Math.max(10, 3.5 * pxPerMm)}px` }}
                          >
                            {adj.polaroidCaption}
                          </div>
                        )}
                      </div>

                      {/* Hover / Selected Overlay Toolbar */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 flex items-center gap-1 bg-black/70 backdrop-blur-sm p-1 rounded-md-full text-white transition-opacity z-20">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSlotIndex(slotGeom.index);
                            setIsCropModalOpen(true);
                          }}
                          className="p-1 hover:bg-white/20 rounded-md-full transition-colors"
                          title={t('cropAndAdjust')}
                          aria-label={t('cropAndAdjust')}
                        >
                          <Crop className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextRot = ((adj.rotation + 90) % 360);
                            updateSlotAdjustments(slotGeom.index, { rotation: nextRot });
                          }}
                          className="p-1 hover:bg-white/20 rounded-md-full transition-colors"
                          title={t('rotate90')}
                          aria-label={t('rotate90')}
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            assignPhotoToSlot(slotGeom.index, null);
                          }}
                          className="p-1 hover:bg-white/20 rounded-md-full text-google-red transition-colors"
                          title={t('removePhoto')}
                          aria-label={t('removePhoto')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
