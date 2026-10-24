import { useMemo, useRef } from 'react';
import {
  FileText,
  Scissors,
  Sliders,
  Crop,
  RotateCw,
  Trash2,
  Copy,
  Info,
  Upload,
  Plus,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext.js';
import { useI18n } from '@pixture/i18n';
import {
  PAPER_PRESETS,
  PHOTO_PRESETS,
  formatMeasurement,
  computeUniformGridLayout,
  getPaperDimensions,
  CutMarkStyle,
} from '@pixture/layout-engine';

export function ToolPanel() {
  const {
    config,
    updateConfig,
    pages,
    photos,
    currentPageIndex,
    selectedSlotIndex,
    activePanelTab: activeTab,
    setActivePanelTab: setActiveTab,
    assignPhotoToSlot,
    updateSlotAdjustments,
    addUploadedPhotos,
    setIsCropModalOpen,
    activeUnit,
  } = useProject();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useI18n();

  const currentPage = pages[currentPageIndex] || pages[0];
  const selectedAssignment = selectedSlotIndex !== null
    ? currentPage?.slots.find((s) => s.slotIndex === selectedSlotIndex)
    : null;
  const selectedPhoto = selectedAssignment?.photoId
    ? photos.find((p) => p.id === selectedAssignment.photoId)
    : null;
  const adj = selectedAssignment?.adjustments;

  // Compute live capacity info for Sheet tab
  const capacityInfo = useMemo(() => {
    const paperDim = getPaperDimensions(
      config.paperId,
      config.orientation,
      config.customWidthMm,
      config.customHeightMm
    );

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

    return {
      capacity: grid.capacityPerPage,
      cols: grid.cols,
      rows: grid.rows,
      isRotated: grid.isRotated,
    };
  }, [config]);

  return (
    <aside
      aria-label="Configuration and inspector panel"
      className="w-[360px] min-w-[360px] max-w-[360px] border-l border-md-outline-variant bg-md-surface flex flex-col shrink-0 select-none z-20 h-full overflow-hidden"
    >
      {/* Segmented Tab Header */}
      <div className="p-3 border-b border-md-outline-variant">
        <div className="flex bg-md-surface-container rounded-md-full p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('sheet')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md-full transition-all whitespace-nowrap ${
              activeTab === 'sheet'
                ? 'bg-md-primary text-white shadow-md-1'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>{t('tabSheet')}</span>
          </button>

          <button
            onClick={() => setActiveTab('cutmarks')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md-full transition-all whitespace-nowrap ${
              activeTab === 'cutmarks'
                ? 'bg-md-primary text-white shadow-md-1'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <Scissors className="w-3.5 h-3.5 shrink-0" />
            <span>{t('tabCutMarks')}</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-md-full transition-all whitespace-nowrap ${
              activeTab === 'inspector'
                ? 'bg-md-primary text-white shadow-md-1'
                : 'text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 shrink-0" />
            <span>{t('tabInspector')}</span>
          </button>
        </div>
      </div>

      {/* Tab Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0 p-4 space-y-5 text-xs text-md-on-surface">
        {/* TAB 1: SHEET & PAPER */}
        {activeTab === 'sheet' && (
          <>
            {/* Live Capacity Card */}
            <div className="bg-md-primary-container/40 border border-md-primary-container p-3 rounded-md-lg flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-md-primary">
                  Page Capacity
                </div>
                <div className="text-base font-bold text-md-on-surface">
                  {capacityInfo.capacity} Photos / Sheet
                </div>
                <div className="text-[11px] text-md-on-surface-variant">
                  {capacityInfo.cols} cols × {capacityInfo.rows} rows
                  {capacityInfo.isRotated && ' (auto-rotated 90°)'}
                </div>
              </div>
              <div className="w-10 h-10 rounded-md-full bg-md-primary flex items-center justify-center text-white font-bold text-sm shadow-md-1">
                {capacityInfo.capacity}
              </div>
            </div>

            {/* Paper Size */}
            <div className="space-y-1.5">
              <label className="font-semibold text-md-on-surface block">
                {t('paperSize')}
              </label>
              <select
                value={config.paperId}
                onChange={(e) => updateConfig({ paperId: e.target.value })}
                className="w-full bg-md-surface-container border border-md-outline-variant rounded-md-md px-2.5 py-2 text-xs text-md-on-surface focus:outline-none focus:border-md-primary"
              >
                {Object.values(PAPER_PRESETS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Paper Orientation */}
            <div className="space-y-1.5">
              <label className="font-semibold text-md-on-surface block">
                {t('orientation')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig({ orientation: 'portrait' })}
                  className={`py-2 px-3 rounded-md-md border text-center transition-all ${
                    config.orientation === 'portrait'
                      ? 'bg-md-primary-container border-md-primary text-md-on-primary-container font-semibold'
                      : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                  }`}
                >
                  {t('portrait')}
                </button>
                <button
                  onClick={() => updateConfig({ orientation: 'landscape' })}
                  className={`py-2 px-3 rounded-md-md border text-center transition-all ${
                    config.orientation === 'landscape'
                      ? 'bg-md-primary-container border-md-primary text-md-on-primary-container font-semibold'
                      : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                  }`}
                >
                  {t('landscape')}
                </button>
              </div>
            </div>

            {/* Target Photo Size Preset */}
            <div className="space-y-1.5">
              <label className="font-semibold text-md-on-surface block">
                {t('photoSize')}
              </label>
              <select
                value={config.photoPresetId}
                onChange={(e) => updateConfig({ photoPresetId: e.target.value })}
                className="w-full bg-md-surface-container border border-md-outline-variant rounded-md-md px-2.5 py-2 text-xs text-md-on-surface focus:outline-none focus:border-md-primary"
              >
                <optgroup label="Passport & Official ID">
                  {Object.values(PHOTO_PRESETS)
                    .filter((p) => p.category === 'id')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Standard Photo Prints">
                  {Object.values(PHOTO_PRESETS)
                    .filter((p) => p.category === 'standard')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Square & Retro">
                  {Object.values(PHOTO_PRESETS)
                    .filter((p) => p.category === 'square' || p.category === 'retro')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>

            {/* Layout Mode */}
            <div className="space-y-1.5">
              <label className="font-semibold text-md-on-surface block">
                {t('layoutMode')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => updateConfig({ layoutMode: 'uniform' })}
                  className={`py-2 px-2 rounded-md-md border text-center transition-all ${
                    config.layoutMode === 'uniform'
                      ? 'bg-md-primary-container border-md-primary text-md-on-primary-container font-semibold'
                      : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                  }`}
                >
                  {t('uniformGrid')}
                </button>
                <button
                  onClick={() => updateConfig({ layoutMode: 'mixed' })}
                  className={`py-2 px-2 rounded-md-md border text-center transition-all ${
                    config.layoutMode === 'mixed'
                      ? 'bg-md-primary-container border-md-primary text-md-on-primary-container font-semibold'
                      : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                  }`}
                >
                  {t('mixedPacking')}
                </button>
              </div>
            </div>

            {/* Margins */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-md-on-surface">
                  {t('margins')} ({activeUnit})
                </label>
                <span className="text-md-on-surface-variant font-mono">
                  {formatMeasurement(config.marginsMm.top, activeUnit)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={config.marginsMm.top}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateConfig({
                    marginsMm: { top: val, right: val, bottom: val, left: val },
                  });
                }}
                className="w-full accent-md-primary"
              />
            </div>

            {/* Inter-photo Spacing / Padding */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-md-on-surface">
                  {t('spacing')} ({activeUnit})
                </label>
                <span className="text-md-on-surface-variant font-mono">
                  {formatMeasurement(config.gapXMm, activeUnit)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={config.gapXMm}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  updateConfig({ gapXMm: val, gapYMm: val });
                }}
                className="w-full accent-md-primary"
              />
            </div>

            {/* Auto-Orientation toggle */}
            <label className="flex items-center gap-2.5 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={config.autoOrientation}
                onChange={(e) => updateConfig({ autoOrientation: e.target.checked })}
                className="w-4 h-4 rounded text-md-primary focus:ring-md-primary"
              />
              <span className="font-medium text-xs text-md-on-surface">
                {t('autoRotateOptimization')}
              </span>
            </label>
          </>
        )}

        {/* TAB 2: CUT MARKS & BLEED */}
        {activeTab === 'cutmarks' && (
          <>
            <div className="bg-md-surface-container p-3 rounded-md-lg flex items-start gap-2.5">
              <Info className="w-4 h-4 text-google-blue shrink-0 mt-0.5" />
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed break-words min-w-0 flex-1">
                Cut marks ensure clean alignment with scissors or a paper trimmer. Corner tick marks stay outside the photo so no ink shows after trimming.
              </p>
            </div>

            {/* Cut Mark Style */}
            <div className="space-y-1.5">
              <label className="font-semibold text-md-on-surface block">
                {t('cutMarkStyle')}
              </label>
              <div className="space-y-2">
                {[
                  { id: 'corners', label: t('markCorners') },
                  { id: 'dashed', label: t('markDashed') },
                  { id: 'hairline', label: t('markHairline') },
                  { id: 'none', label: t('markNone') },
                ].map((style) => (
                  <label
                    key={style.id}
                    className={`flex items-center justify-between p-2.5 rounded-md-md border cursor-pointer transition-all ${
                      config.cutMarkStyle === style.id
                        ? 'border-md-primary bg-md-primary-container/30 font-semibold text-md-on-primary-container'
                        : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                    }`}
                  >
                    <span>{style.label}</span>
                    <input
                      type="radio"
                      name="cutMarkStyle"
                      value={style.id}
                      checked={config.cutMarkStyle === style.id}
                      onChange={() => updateConfig({ cutMarkStyle: style.id as CutMarkStyle })}
                      className="text-md-primary focus:ring-md-primary"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Mark Color Swatches */}
            <div className="space-y-1.5">
              <label className="font-semibold text-md-on-surface block">
                {t('markColor')}
              </label>
              <div className="flex items-center gap-2">
                {[
                  { hex: '#202124', name: 'Charcoal' },
                  { hex: '#9aa0a6', name: 'Light Gray' },
                  { hex: '#1a73e8', name: 'Google Blue' },
                  { hex: '#ea4335', name: 'Google Red' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => updateConfig({ cutMarkColor: c.hex })}
                    className={`w-7 h-7 rounded-md-full border-2 transition-all ${
                      config.cutMarkColor === c.hex
                        ? 'border-md-primary scale-110 shadow-md-1'
                        : 'border-transparent hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {/* Bleed Margin */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="font-semibold text-md-on-surface">
                  {t('bleed')} ({activeUnit})
                </label>
                <span className="text-md-on-surface-variant font-mono text-xs font-semibold">
                  {formatMeasurement(config.bleedMm, activeUnit, 1)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                step="0.5"
                value={config.bleedMm}
                onChange={(e) => updateConfig({ bleedMm: Number(e.target.value) })}
                className="w-full accent-md-primary cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-md-on-surface-variant font-mono">
                <span>{formatMeasurement(0, activeUnit, 0)}</span>
                <span>{formatMeasurement(2.5, activeUnit, 1)}</span>
                <span>{formatMeasurement(5, activeUnit, 0)}</span>
              </div>
            </div>
          </>
        )}

        {/* TAB 3: PHOTO INSPECTOR */}
        {activeTab === 'inspector' && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0 && selectedSlotIndex !== null) {
                  addUploadedPhotos(Array.from(e.target.files), selectedSlotIndex);
                }
                e.target.value = '';
              }}
              className="hidden"
              aria-hidden="true"
            />

            {selectedSlotIndex === null ? (
              <div className="py-12 text-center text-md-on-surface-variant flex flex-col items-center justify-center gap-2">
                <Sliders className="w-8 h-8 opacity-40 mb-1" />
                <p className="text-xs max-w-[200px] leading-relaxed">
                  {t('noPhotoSelected')}
                </p>
              </div>
            ) : !selectedPhoto || !adj ? (
              <div className="space-y-4">
                <div className="p-3 bg-md-surface-container rounded-md-lg">
                  <div className="font-semibold text-xs text-md-on-surface">
                    Slot #{selectedSlotIndex + 1} (Empty)
                  </div>
                  <p className="text-[11px] text-md-on-surface-variant mt-1 leading-relaxed break-words">
                    Add a photo to this slot by uploading or choosing from your photos.
                  </p>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md-full bg-md-primary text-white font-semibold shadow-md-1 hover:bg-[#1557b0] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Upload Photo to this Slot</span>
                </button>

                {photos.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-semibold text-[11px] text-md-on-surface-variant uppercase tracking-wider">
                      Or Choose From Uploaded Photos:
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      {photos.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => assignPhotoToSlot(selectedSlotIndex, p.id)}
                          className="aspect-square rounded-md-sm border border-md-outline-variant hover:border-md-primary hover:scale-105 transition-all overflow-hidden bg-md-surface-container group/btn relative"
                          title={p.name}
                        >
                          <img src={p.dataUrl} alt={p.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/btn:opacity-100 flex items-center justify-center text-white text-[10px] font-bold">
                            <Plus className="w-4 h-4" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Photo thumbnail & name */}
                <div className="flex items-center gap-3 p-2.5 bg-md-surface-container rounded-md-lg min-w-0">
                  <img
                    src={selectedPhoto.dataUrl}
                    alt={selectedPhoto.name}
                    className="w-12 h-12 object-cover rounded-md-sm border border-md-outline-variant shrink-0"
                  />
                  <div className="overflow-hidden min-w-0 flex-1">
                    <div className="font-semibold text-xs truncate text-md-on-surface">
                      {selectedPhoto.name}
                    </div>
                    <div className="text-[10px] text-md-on-surface-variant font-mono">
                      {selectedPhoto.width} × {selectedPhoto.height} px
                    </div>
                  </div>
                </div>

                {/* Primary Crop & Adjust Button */}
                <button
                  onClick={() => setIsCropModalOpen(true)}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md-full bg-md-primary text-white font-semibold shadow-md-1 hover:bg-[#1557b0] transition-colors"
                >
                  <Crop className="w-4 h-4" />
                  <span>{t('cropAndAdjust')}</span>
                </button>

                {/* Fitting Mode: Fill vs Fit */}
                <div className="space-y-1.5">
                  <label className="font-semibold text-md-on-surface block">
                    {t('fitMode')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => updateSlotAdjustments(selectedSlotIndex, { fitMode: 'cover' })}
                      className={`py-1.5 px-2 rounded-md-md border text-center transition-all ${
                        adj.fitMode === 'cover'
                          ? 'bg-md-primary-container border-md-primary text-md-on-primary-container font-semibold'
                          : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                      }`}
                    >
                      {t('fitCover')}
                    </button>
                    <button
                      onClick={() => updateSlotAdjustments(selectedSlotIndex, { fitMode: 'contain' })}
                      className={`py-1.5 px-2 rounded-md-md border text-center transition-all ${
                        adj.fitMode === 'contain'
                          ? 'bg-md-primary-container border-md-primary text-md-on-primary-container font-semibold'
                          : 'border-md-outline-variant hover:bg-md-surface-container text-md-on-surface-variant'
                      }`}
                    >
                      {t('fitContain')}
                    </button>
                  </div>
                </div>

                {/* Rotate 90 Button */}
                <button
                  onClick={() => {
                    const nextRot = (adj.rotation + 90) % 360;
                    updateSlotAdjustments(selectedSlotIndex, { rotation: nextRot });
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-md-md border border-md-outline-variant hover:bg-md-surface-container font-medium text-xs text-md-on-surface transition-colors"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>{t('rotate90')} ({adj.rotation}°)</span>
                </button>

                {/* White Border Toggle */}
                <label className="flex items-center justify-between cursor-pointer pt-1">
                  <span className="font-medium text-xs text-md-on-surface">
                    {t('whiteBorder')}
                  </span>
                  <input
                    type="checkbox"
                    checked={adj.hasWhiteBorder}
                    onChange={(e) => updateSlotAdjustments(selectedSlotIndex, { hasWhiteBorder: e.target.checked })}
                    className="w-4 h-4 rounded text-md-primary focus:ring-md-primary"
                  />
                </label>

                {/* Polaroid Mode Toggle */}
                <div className="space-y-2 pt-1 border-t border-md-outline-variant">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="font-medium text-xs text-md-on-surface">
                      {t('polaroidMode')}
                    </span>
                    <input
                      type="checkbox"
                      checked={adj.isPolaroid}
                      onChange={(e) => updateSlotAdjustments(selectedSlotIndex, { isPolaroid: e.target.checked })}
                      className="w-4 h-4 rounded text-md-primary focus:ring-md-primary"
                    />
                  </label>

                  {adj.isPolaroid && (
                    <input
                      type="text"
                      placeholder="Write a retro caption..."
                      value={adj.polaroidCaption || ''}
                      onChange={(e) => updateSlotAdjustments(selectedSlotIndex, { polaroidCaption: e.target.value })}
                      className="w-full bg-md-surface-container border border-md-outline-variant rounded-md-md px-2.5 py-1.5 text-xs text-md-on-surface focus:outline-none focus:border-md-primary font-caveat text-sm"
                    />
                  )}
                </div>

                {/* Color Adjustments */}
                <div className="space-y-3 pt-2 border-t border-md-outline-variant">
                  <div className="font-semibold text-xs text-md-on-surface">
                    {t('colorAdjustments')}
                  </div>

                  {/* Brightness */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-md-on-surface-variant">
                      <span>{t('brightness')}</span>
                      <span>{adj.brightness > 0 ? `+${adj.brightness}` : adj.brightness}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={adj.brightness}
                      onChange={(e) => updateSlotAdjustments(selectedSlotIndex, { brightness: Number(e.target.value) })}
                      className="w-full accent-md-primary"
                    />
                  </div>

                  {/* Contrast */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-md-on-surface-variant">
                      <span>{t('contrast')}</span>
                      <span>{adj.contrast > 0 ? `+${adj.contrast}` : adj.contrast}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={adj.contrast}
                      onChange={(e) => updateSlotAdjustments(selectedSlotIndex, { contrast: Number(e.target.value) })}
                      className="w-full accent-md-primary"
                    />
                  </div>

                  {/* Black & White Toggle */}
                  <label className="flex items-center justify-between cursor-pointer pt-1">
                    <span className="font-medium text-xs text-md-on-surface">
                      {t('grayscale')}
                    </span>
                    <input
                      type="checkbox"
                      checked={adj.grayscale}
                      onChange={(e) => updateSlotAdjustments(selectedSlotIndex, { grayscale: e.target.checked })}
                      className="w-4 h-4 rounded text-md-primary focus:ring-md-primary"
                    />
                  </label>
                </div>

                {/* Slot Actions: Duplicate, Remove */}
                <div className="flex items-center gap-2 pt-3 border-t border-md-outline-variant">
                  <button
                    onClick={() => {
                      // Duplicate photo to next empty slot
                      const nextSlotIdx = currentPage.slots.findIndex((s) => !s.photoId);
                      if (nextSlotIdx !== -1) {
                        assignPhotoToSlot(nextSlotIdx, selectedPhoto.id);
                      }
                    }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md-md border border-md-outline-variant hover:bg-md-surface-container font-medium text-xs transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{t('duplicatePhoto')}</span>
                  </button>

                  <button
                    onClick={() => assignPhotoToSlot(selectedSlotIndex, null)}
                    className="p-1.5 rounded-md-md border border-md-error/30 text-md-error hover:bg-md-error-container transition-colors"
                    title={t('removePhoto')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
