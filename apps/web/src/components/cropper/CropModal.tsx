import React, { useRef, useState, useEffect } from 'react';
import {
  X,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  Check,
  RotateCcw,
  Sliders,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext.js';
import { useI18n } from '@pixture/i18n';
import {
  PhotoSlotAdjustment,
  DEFAULT_ADJUSTMENTS,
  buildCssFilterString,
} from '@pixture/print-core';
import { PHOTO_PRESETS } from '@pixture/layout-engine';

export function CropModal() {
  const {
    isCropModalOpen,
    setIsCropModalOpen,
    selectedSlotIndex,
    pages,
    photos,
    currentPageIndex,
    updateSlotAdjustments,
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

  // Compute aspect ratio of the target slot
  const slotAspect = (() => {
    const preset = PHOTO_PRESETS[config.photoPresetId] || PHOTO_PRESETS.print_4x6;
    const w = config.customPhotoWidthMm || preset.widthMm;
    const h = config.customPhotoHeightMm || preset.heightMm;
    return w / h;
  })();

  // Pan drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initCropX: localAdj.cropX,
      initCropY: localAdj.cropY,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    const rect = containerRef.current.getBoundingClientRect();
    const deltaXNormalized = dx / rect.width;
    const deltaYNormalized = dy / rect.height;

    const newCropX = Math.max(0, Math.min(1, dragStartRef.current.initCropX + deltaXNormalized));
    const newCropY = Math.max(0, Math.min(1, dragStartRef.current.initCropY + deltaYNormalized));

    setLocalAdj((prev) => ({ ...prev, cropX: newCropX, cropY: newCropY }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!isCropModalOpen || !photo) {
    return null;
  }

  const isRotated90 = localAdj.rotation === 90 || localAdj.rotation === 270;
  const boxW = slotAspect >= 1 ? 340 : 340 * slotAspect;
  const boxH = slotAspect >= 1 ? 340 / slotAspect : 340;
  const rotScale = isRotated90
    ? localAdj.fitMode === 'contain'
      ? Math.min(boxW / boxH, boxH / boxW)
      : Math.max(boxW / boxH, boxH / boxW)
    : 1;
  const effectiveZoom = localAdj.zoom * rotScale;

  return (
    <dialog
      open
      aria-modal="true"
      aria-labelledby="crop-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-transparent w-full h-full max-w-none max-h-none m-0 border-none select-none animate-in fade-in duration-150"
    >
      {/* Backdrop overlay */}
      <button
        type="button"
        onClick={handleClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm cursor-default"
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
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              className={`relative overflow-hidden bg-white shadow-md-2 border-2 border-md-primary flex items-center justify-center ${
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              }`}
              style={{
                width: `${boxW}px`,
                height: `${boxH}px`,
              }}
            >
              {/* Image being cropped */}
              <img
                src={photo.dataUrl}
                alt={photo.name}
                draggable={false}
                className="max-w-none pointer-events-none select-none transition-transform"
                style={{
                  width:
                    localAdj.fitMode === 'contain' && !isRotated90
                      ? '100%'
                      : `${100 * effectiveZoom}%`,
                  height:
                    localAdj.fitMode === 'contain' && !isRotated90
                      ? '100%'
                      : `${100 * effectiveZoom}%`,
                  objectFit: localAdj.fitMode === 'contain' ? 'contain' : 'cover',
                  objectPosition: `${localAdj.cropX * 100}% ${localAdj.cropY * 100}%`,
                  transform: `rotate(${localAdj.rotation}deg) scale(${localAdj.flipH ? -1 : 1}, ${localAdj.flipV ? -1 : 1})`,
                  filter: buildCssFilterString(localAdj),
                }}
              />

              {/* Rule of Thirds Grid overlay */}
              <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 opacity-30">
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
              Click & drag image inside the frame to adjust framing.
            </p>
          </div>

          {/* Right 1 Col: Controls & Color Sliders */}
          <div className="space-y-4 flex flex-col justify-between text-xs">
            <div className="space-y-4">
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
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-md-surface-container border-t border-md-outline-variant shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-md-full border border-md-outline-variant hover:bg-md-surface-container-high text-xs font-semibold text-md-on-surface transition-colors"
          >
            {t('cancel')}
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
    </dialog>
  );
}
