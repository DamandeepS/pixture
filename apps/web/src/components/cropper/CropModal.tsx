import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  Check,
  Copy,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext.js';
import { useI18n } from '@pixture/i18n';
import {
  PhotoSlotAdjustment,
  DEFAULT_ADJUSTMENTS,
  buildCssFilterString,
  computeSlotPhotoLayout,
} from '@pixture/print-core';
import {
  PHOTO_PRESETS,
  computeSheetSlotsGeometry,
  getPaperDimensions,
} from '@pixture/layout-engine';

export function CropModal() {
  const {
    isCropModalOpen,
    setIsCropModalOpen,
    selectedSlotIndex,
    pages,
    photos,
    currentPageIndex,
    updateSlotAdjustments,
    duplicateSlotPhoto,
    config,
  } = useProject();

  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[currentPageIndex] || pages[0];
  const selectedAssignment =
    selectedSlotIndex !== null
      ? currentPage?.slots.find((s) => s.slotIndex === selectedSlotIndex)
      : null;
  const photo = selectedAssignment?.photoId
    ? photos.find((p) => p.id === selectedAssignment.photoId)
    : null;

  // Local adjustments state
  const [localAdj, setLocalAdj] = useState<PhotoSlotAdjustment>(DEFAULT_ADJUSTMENTS);
  const [isDragging, setIsDragging] = useState(false);
  const [prevSlotKey, setPrevSlotKey] = useState<string | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; initCropX: number; initCropY: number }>({
    x: 0,
    y: 0,
    initCropX: 0.5,
    initCropY: 0.5,
  });

  // Synchronize local adjustments during render when modal opens or slot changes
  const currentSlotKey = isCropModalOpen ? `${selectedSlotIndex}-${photo?.id}` : null;
  if (currentSlotKey !== prevSlotKey) {
    setPrevSlotKey(currentSlotKey);
    if (selectedAssignment?.adjustments) {
      setLocalAdj({ ...selectedAssignment.adjustments });
    }
  }

  // Handle ESC key to close
  useEffect(() => {
    if (!isCropModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsCropModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCropModalOpen, setIsCropModalOpen]);

  const handleClose = () => {
    setIsCropModalOpen(false);
  };

  const handleApply = () => {
    if (selectedSlotIndex !== null) {
      updateSlotAdjustments(selectedSlotIndex, localAdj);
    }
    handleClose();
  };

  // Find exact slot geometry to match aspect ratio (uniform or mixed layout)
  const selectedSlotGeom = useMemo(() => {
    if (selectedSlotIndex === null) return null;
    const paperDim = getPaperDimensions(
      config.paperId,
      config.orientation,
      config.customWidthMm,
      config.customHeightMm
    );
    const result = computeSheetSlotsGeometry({
      sheetWidthMm: paperDim.widthMm,
      sheetHeightMm: paperDim.heightMm,
      marginsMm: config.marginsMm,
      gapXMm: config.gapXMm,
      gapYMm: config.gapYMm,
      layoutMode: config.layoutMode,
      autoOrientation: config.autoOrientation,
      photoPresetId: config.photoPresetId,
      customPhotoWidthMm: config.customPhotoWidthMm,
      customPhotoHeightMm: config.customPhotoHeightMm,
      primaryPhotoCount: config.primaryPhotoCount ?? 1,
      secondaryPhotoPresetId: config.secondaryPhotoPresetId ?? 'passport_us',
      secondaryPhotoCount: config.secondaryPhotoCount ?? 4,
      customSecondaryWidthMm: config.customSecondaryWidthMm,
      customSecondaryHeightMm: config.customSecondaryHeightMm,
      currentPageIndex,
    });
    return result.slots.find((s) => s.index === selectedSlotIndex) || null;
  }, [config, currentPageIndex, selectedSlotIndex]);

  // Compute aspect ratio of the target slot
  const slotAspect = useMemo(() => {
    if (selectedSlotGeom) {
      return selectedSlotGeom.widthMm / selectedSlotGeom.heightMm;
    }
    const preset = PHOTO_PRESETS[config.photoPresetId] || PHOTO_PRESETS.print_4x6;
    const w = config.customPhotoWidthMm || preset.widthMm;
    const h = config.customPhotoHeightMm || preset.heightMm;
    return w / h;
  }, [selectedSlotGeom, config]);

  // Compute viewport box size (max 340px)
  const maxBoxDim = 340;
  const boxW = slotAspect >= 1 ? maxBoxDim : Math.round(maxBoxDim * slotAspect);
  const boxH = slotAspect >= 1 ? Math.round(maxBoxDim / slotAspect) : maxBoxDim;

  // Compute photo positioning and excess dimensions
  const layout = computeSlotPhotoLayout({
    innerW: boxW,
    innerH: boxH,
    photoWidth: photo?.width || 1,
    photoHeight: photo?.height || 1,
    adj: localAdj,
  });

  // Pan drag handling - Start on mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initCropX: localAdj.cropX,
      initCropY: localAdj.cropY,
    };
  };

  // Pan drag handling - Start on touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    setIsDragging(true);
    dragStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      initCropX: localAdj.cropX,
      initCropY: localAdj.cropY,
    };
  };

  // Drag tracking registered on window while dragging
  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (clientX: number, clientY: number) => {
      const dx = clientX - dragStartRef.current.x;
      const dy = clientY - dragStartRef.current.y;

      const rad = (localAdj.rotation * Math.PI) / 180;
      const cos = Math.cos(rad);
      const sin = Math.sin(rad);

      let deltaImgX = dx * cos + dy * sin;
      let deltaImgY = -dx * sin + dy * cos;

      if (localAdj.flipH) deltaImgX = -deltaImgX;
      if (localAdj.flipV) deltaImgY = -deltaImgY;

      const newCropX =
        layout.excessX > 0
          ? Math.max(0, Math.min(1, dragStartRef.current.initCropX - deltaImgX / layout.excessX))
          : 0.5;

      const newCropY =
        layout.excessY > 0
          ? Math.max(0, Math.min(1, dragStartRef.current.initCropY - deltaImgY / layout.excessY))
          : 0.5;

      setLocalAdj((prev) => ({
        ...prev,
        cropX: newCropX,
        cropY: newCropY,
      }));
    };

    const handleWindowMouseMove = (e: MouseEvent) => {
      handlePointerMove(e.clientX, e.clientY);
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [
    isDragging,
    localAdj.rotation,
    localAdj.flipH,
    localAdj.flipV,
    layout.excessX,
    layout.excessY,
  ]);

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = -e.deltaY * 0.002;
    setLocalAdj((prev) => ({
      ...prev,
      zoom: Math.max(1.0, Math.min(3.5, Number((prev.zoom + delta).toFixed(2)))),
    }));
  };

  if (!isCropModalOpen || !photo) {
    return null;
  }

  const hasPannableOverflow = layout.excessX > 0 || layout.excessY > 0;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150"
    >
      {/* Backdrop overlay */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed inset-0 bg-transparent cursor-default border-none -z-10"
        aria-label="Close modal"
        tabIndex={-1}
      />

      <div className="relative rounded-md-2xl shadow-2xl bg-md-surface p-0 w-full max-w-3xl overflow-hidden text-md-on-surface border border-md-outline-variant flex flex-col max-h-[90vh] z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant shrink-0">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-md-primary" />
            <h2 id="crop-dialog-title" className="text-base font-bold text-md-on-surface">
              {t('dialogCropTitle')}
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-md-full hover:bg-md-surface-container text-md-on-surface-variant transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {/* Left 2 Cols: Interactive Pan & Crop Viewport */}
          <div className="md:col-span-2 flex flex-col items-center justify-center bg-md-surface-container-high rounded-md-xl p-4 min-h-[360px] relative overflow-hidden">
            {/* Framed Crop Box with matching slot aspect ratio */}
            <div
              ref={containerRef}
              role="region"
              aria-label="Crop interactive viewport"
              tabIndex={0}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onWheel={handleWheel}
              className={`relative overflow-hidden bg-white shadow-md-2 border-2 border-md-primary flex items-center justify-center select-none ${
                isDragging
                  ? 'cursor-grabbing'
                  : hasPannableOverflow
                    ? 'cursor-grab'
                    : 'cursor-default'
              }`}
              style={{
                width: `${boxW}px`,
                height: `${boxH}px`,
                touchAction: 'none',
              }}
            >
              {/* Transformed anchor container */}
              <div
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  width: `${layout.targetW}px`,
                  height: `${layout.targetH}px`,
                  transform: `translate(-50%, -50%) rotate(${localAdj.rotation}deg) scale(${localAdj.flipH ? -1 : 1}, ${localAdj.flipV ? -1 : 1})`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <img
                  src={photo.dataUrl}
                  alt={photo.name}
                  draggable={false}
                  style={{
                    position: 'absolute',
                    left: '50%',
                    top: '50%',
                    width: `${layout.drawW}px`,
                    height: `${layout.drawH}px`,
                    maxWidth: 'none',
                    maxHeight: 'none',
                    transform: `translate(calc(-50% + ${layout.panOffsetX}px), calc(-50% + ${layout.panOffsetY}px))`,
                    filter: buildCssFilterString(localAdj),
                    pointerEvents: 'none',
                    userSelect: 'none',
                  }}
                />
              </div>

              {/* Rule of Thirds Grid overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30 z-10">
                <div className="border-r border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div className="border-r border-b border-white/60"></div>
                <div></div>
              </div>
            </div>

            <p className="text-[11px] text-md-on-surface-variant mt-3 text-center">
              {hasPannableOverflow
                ? 'Click & drag image inside the frame to adjust framing. Scroll to zoom.'
                : 'Zoom in or switch to Fill mode to pan & adjust framing.'}
            </p>
          </div>

          {/* Right 1 Col: Controls & Color Sliders */}
          <div className="space-y-4 flex flex-col justify-between text-xs">
            <div className="space-y-4">
              {/* Fit Mode Toggle */}
              <div className="space-y-1.5">
                <label className="font-semibold text-md-on-surface block">{t('fitMode')}</label>
                <div className="flex gap-1.5 p-1 bg-md-surface-container rounded-md-md">
                  <button
                    type="button"
                    onClick={() => setLocalAdj((prev) => ({ ...prev, fitMode: 'cover' }))}
                    className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors ${
                      localAdj.fitMode === 'cover'
                        ? 'bg-md-primary text-white shadow-sm'
                        : 'text-md-on-surface-variant hover:text-md-on-surface'
                    }`}
                  >
                    {t('fitCover')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalAdj((prev) => ({ ...prev, fitMode: 'contain' }))}
                    className={`flex-1 py-1 rounded text-[11px] font-semibold transition-colors ${
                      localAdj.fitMode === 'contain'
                        ? 'bg-md-primary text-white shadow-sm'
                        : 'text-md-on-surface-variant hover:text-md-on-surface'
                    }`}
                  >
                    {t('fitContain')}
                  </button>
                </div>
              </div>

              {/* Zoom Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between font-semibold text-md-on-surface">
                  <span className="flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5" />
                    {t('zoom')}
                  </span>
                  <span className="font-mono text-md-on-surface-variant">
                    {localAdj.zoom.toFixed(1)}×
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.05"
                  value={localAdj.zoom}
                  onChange={(e) =>
                    setLocalAdj((prev) => ({ ...prev, zoom: Number(e.target.value) }))
                  }
                  className="w-full accent-md-primary"
                />
              </div>

              {/* Transform Buttons: Rotate & Flip */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    setLocalAdj((prev) => ({ ...prev, rotation: (prev.rotation + 90) % 360 }))
                  }
                  className="flex flex-col items-center justify-center p-2 rounded-md-md border border-md-outline-variant hover:bg-md-surface-container transition-colors"
                  title={t('rotate90')}
                >
                  <RotateCw className="w-4 h-4 mb-0.5 text-md-on-surface-variant" />
                  <span className="text-[10px] font-medium">{localAdj.rotation}°</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocalAdj((prev) => ({ ...prev, flipH: !prev.flipH }))}
                  className={`flex flex-col items-center justify-center p-2 rounded-md-md border transition-colors ${
                    localAdj.flipH
                      ? 'border-md-primary bg-md-primary-container text-md-on-primary-container'
                      : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                  }`}
                  title={t('flipHorizontal')}
                >
                  <FlipHorizontal className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-medium">Flip H</span>
                </button>

                <button
                  type="button"
                  onClick={() => setLocalAdj((prev) => ({ ...prev, flipV: !prev.flipV }))}
                  className={`flex flex-col items-center justify-center p-2 rounded-md-md border transition-colors ${
                    localAdj.flipV
                      ? 'border-md-primary bg-md-primary-container text-md-on-primary-container'
                      : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                  }`}
                  title={t('flipVertical')}
                >
                  <FlipVertical className="w-4 h-4 mb-0.5" />
                  <span className="text-[10px] font-medium">Flip V</span>
                </button>
              </div>

              {/* Color Sliders */}
              <div className="space-y-2.5 pt-2 border-t border-md-outline-variant">
                {/* Brightness */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-md-on-surface-variant">
                    <span>{t('brightness')}</span>
                    <span>{localAdj.brightness}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={localAdj.brightness}
                    onChange={(e) =>
                      setLocalAdj((prev) => ({ ...prev, brightness: Number(e.target.value) }))
                    }
                    className="w-full accent-md-primary"
                  />
                </div>

                {/* Contrast */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-md-on-surface-variant">
                    <span>{t('contrast')}</span>
                    <span>{localAdj.contrast}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={localAdj.contrast}
                    onChange={(e) =>
                      setLocalAdj((prev) => ({ ...prev, contrast: Number(e.target.value) }))
                    }
                    className="w-full accent-md-primary"
                  />
                </div>

                {/* Saturation */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-md-on-surface-variant">
                    <span>{t('saturation')}</span>
                    <span>{localAdj.saturation}</span>
                  </div>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    value={localAdj.saturation}
                    onChange={(e) =>
                      setLocalAdj((prev) => ({ ...prev, saturation: Number(e.target.value) }))
                    }
                    className="w-full accent-md-primary"
                  />
                </div>

                {/* Grayscale */}
                <label className="flex items-center justify-between cursor-pointer pt-1">
                  <span className="font-medium text-xs text-md-on-surface">{t('grayscale')}</span>
                  <input
                    type="checkbox"
                    checked={localAdj.grayscale}
                    onChange={(e) =>
                      setLocalAdj((prev) => ({ ...prev, grayscale: e.target.checked }))
                    }
                    className="w-4 h-4 rounded text-md-primary focus:ring-md-primary"
                  />
                </label>
              </div>
            </div>

            {/* Reset button */}
            <button
              type="button"
              onClick={() => {
                if (selectedAssignment?.adjustments) {
                  setLocalAdj({ ...selectedAssignment.adjustments });
                }
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-md-md border border-md-outline-variant hover:bg-md-surface-container font-medium text-xs text-md-on-surface-variant transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('resetCrop')}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 bg-md-surface-container border-t border-md-outline-variant shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-md-full border border-md-outline-variant hover:bg-md-surface-container-high text-xs font-semibold text-md-on-surface transition-colors"
          >
            {t('cancel')}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedSlotIndex !== null) {
                  updateSlotAdjustments(selectedSlotIndex, localAdj);
                  duplicateSlotPhoto(selectedSlotIndex);
                }
                handleClose();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-md-full border border-md-primary/40 hover:border-md-primary text-md-primary hover:bg-md-primary-container/30 text-xs font-semibold transition-colors"
              title={t('applyAndDuplicate')}
            >
              <Copy className="w-4 h-4" />
              <span>{t('applyAndDuplicate')}</span>
            </button>

            <button
              type="button"
              onClick={handleApply}
              className="flex items-center gap-1.5 px-5 py-2 rounded-md-full bg-md-primary hover:bg-[#1557b0] text-xs font-semibold text-white shadow-md-1 hover:shadow-md-2 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>{t('apply')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
