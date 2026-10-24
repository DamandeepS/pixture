import { useState, useRef } from 'react';
import {
  Printer,
  Download,
  FileImage,
  Undo2,
  Redo2,
  RotateCcw,
  Globe,
  Save,
  FolderOpen,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useProject } from '../../state/ProjectContext.js';
import { useI18n, SUPPORTED_LOCALES, LocaleCode } from '@pixture/i18n';
import {
  triggerBrowserPrint,
  exportProjectToPdf,
  downloadPdf,
  renderSheetToCanvas,
} from '@pixture/print-core';
import {
  getPaperDimensions,
  computeSheetSlotsGeometry,
} from '@pixture/layout-engine';

export function AppBar() {
  const {
    projectName,
    setProjectName,
    activeUnit,
    setUnit,
    canUndo,
    canRedo,
    undo,
    redo,
    resetProject,
    config,
    pages,
    photos,
    currentPageIndex,
    exportProjectJson,
    importProjectJson,
    announce,
  } = useProject();

  const { locale, setLocale, t } = useI18n();
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Compute current slots geometry for export
  const getSlotsGeometry = () => {
    const paperDim = getPaperDimensions(
      config.paperId,
      config.orientation,
      config.customWidthMm,
      config.customHeightMm
    );

    const res = computeSheetSlotsGeometry({
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

    return res.slots;
  };

  const handlePrint = () => {
    announce(t('print'));
    triggerBrowserPrint(config);
  };

  const handleExportPdf = async () => {
    try {
      setIsExporting(true);
      announce(t('exportPdf'));
      const slotsGeometry = getSlotsGeometry();
      const pdfBytes = await exportProjectToPdf({
        config,
        pages,
        photos,
        slotsGeometry,
      });

      downloadPdf(pdfBytes, `${projectName.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      confetti({ particleCount: 60, spread: 55, origin: { y: 0.2 } });
      announce(t('announcementExportReady'));
    } catch (err) {
      console.error('Failed to export PDF', err);
      alert('Failed to generate PDF. Please check console for details.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPng = async () => {
    try {
      setIsExporting(true);
      announce(t('exportPng'));
      const slotsGeometry = getSlotsGeometry();
      const currentPage = pages[currentPageIndex] || pages[0];

      const canvas = await renderSheetToCanvas({
        config,
        page: currentPage,
        photos,
        dpi: 300,
        slotsGeometry,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${projectName.toLowerCase().replace(/\s+/g, '-')}-page-${currentPageIndex + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({ particleCount: 50, spread: 50, origin: { y: 0.2 } });
      announce(t('announcementExportReady'));
    } catch (err) {
      console.error('Failed to export PNG', err);
      alert('Failed to generate PNG image.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const content = reader.result as string;
      const ok = importProjectJson(content);
      if (ok) {
        announce('Project opened.');
      } else {
        alert('Invalid .pixture project file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-16 border-b border-md-outline-variant bg-md-surface px-4 flex items-center justify-between shrink-0 select-none z-20">
      {/* Brand & Project Name */}
      <div className="flex items-center gap-3">
        {/* Google-inspired Pinwheel Logo */}
        <div className="flex items-center gap-2 group cursor-pointer" title="Pixture">
          <div className="w-9 h-9 relative flex items-center justify-center bg-md-surface-container rounded-md-xl shadow-md-1 group-hover:shadow-md-2 transition-shadow">
            <div className="w-5 h-5 grid grid-cols-2 gap-0.5">
              <div className="bg-google-blue rounded-tl-sm"></div>
              <div className="bg-google-red rounded-tr-sm"></div>
              <div className="bg-google-yellow rounded-bl-sm"></div>
              <div className="bg-google-green rounded-br-sm"></div>
            </div>
          </div>
          <span className="font-semibold text-lg text-md-on-surface tracking-tight flex items-center gap-1.5">
            Pixture
            <span className="text-[10px] font-bold uppercase tracking-wider text-md-primary bg-md-primary-container px-1.5 py-0.5 rounded-md-xs">
              Studio
            </span>
          </span>
        </div>

        <div className="h-5 w-[1px] bg-md-outline-variant mx-1"></div>

        {/* Project Name editable */}
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="text-sm font-medium text-md-on-surface bg-transparent hover:bg-md-surface-container px-2 py-1 rounded-md-md border border-transparent hover:border-md-outline-variant focus:border-md-primary focus:bg-md-surface focus:outline-none transition-colors max-w-[200px]"
          aria-label="Project Title"
        />
      </div>

      {/* Center Controls: Undo, Redo, Unit Toggle */}
      <div className="flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-md-surface-container-high rounded-md-full p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-md-full hover:bg-md-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-md-on-surface-variant"
            title={`${t('undo')} (Ctrl+Z)`}
            aria-label={t('undo')}
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-md-full hover:bg-md-surface disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-md-on-surface-variant"
            title={`${t('redo')} (Ctrl+Y)`}
            aria-label={t('redo')}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>

        {/* Unit Selector Pill */}
        <div className="flex items-center bg-md-surface-container-high rounded-md-full p-0.5 text-xs font-medium">
          {(['mm', 'cm', 'in'] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => setUnit(unit)}
              className={`px-2.5 py-1 rounded-md-full transition-all ${
                activeUnit === unit
                  ? 'bg-md-primary text-white shadow-md-1 font-semibold'
                  : 'text-md-on-surface-variant hover:text-md-on-surface'
              }`}
              aria-label={`Switch unit to ${unit}`}
            >
              {unit}
            </button>
          ))}
        </div>

        {/* Locale Selector */}
        <div className="relative group">
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-md-full bg-md-surface-container-high text-xs font-medium text-md-on-surface hover:bg-md-surface-container cursor-pointer">
            <Globe className="w-3.5 h-3.5 text-md-on-surface-variant" />
            <span>{SUPPORTED_LOCALES.find((l) => l.code === locale)?.nativeName}</span>
          </div>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as LocaleCode)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="Language selector"
          >
            {SUPPORTED_LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} ({l.label})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right Actions: Save, Open, Export, Print */}
      <div className="flex items-center gap-2">
        {/* Reset */}
        <button
          onClick={resetProject}
          className="p-2 rounded-md-full hover:bg-md-surface-container text-md-on-surface-variant transition-colors"
          title={t('reset')}
          aria-label={t('reset')}
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Save / Open Project File */}
        <button
          onClick={exportProjectJson}
          className="p-2 rounded-md-full hover:bg-md-surface-container text-md-on-surface-variant transition-colors"
          title={t('saveProject')}
          aria-label={t('saveProject')}
        >
          <Save className="w-4 h-4" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-md-full hover:bg-md-surface-container text-md-on-surface-variant transition-colors"
          title={t('loadProject')}
          aria-label={t('loadProject')}
        >
          <FolderOpen className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pixture,application/json"
          onChange={handleImportFile}
          className="hidden"
          aria-hidden="true"
        />

        <div className="h-5 w-[1px] bg-md-outline-variant mx-1"></div>

        {/* Export PNG */}
        <button
          onClick={handleExportPng}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md-full bg-md-surface-container border border-md-outline-variant hover:bg-md-surface-container-high transition-colors text-md-on-surface"
        >
          <FileImage className="w-3.5 h-3.5" />
          <span>{t('exportPng')}</span>
        </button>

        {/* Export PDF */}
        <button
          onClick={handleExportPdf}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md-full bg-md-surface-container border border-md-outline-variant hover:bg-md-surface-container-high transition-colors text-md-on-surface"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{t('exportPdf')}</span>
        </button>

        {/* Primary Print Button */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-md-full bg-md-primary hover:bg-[#1557b0] text-white shadow-md-1 hover:shadow-md-2 active:scale-95 transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>{t('print')}</span>
          <Sparkles className="w-3 h-3 opacity-80" />
        </button>
      </div>
    </header>
  );
}
