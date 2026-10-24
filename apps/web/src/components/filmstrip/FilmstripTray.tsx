import React, { useRef, useState } from 'react';
import {
  Upload,
  Trash2,
  CopyCheck,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { useProject } from '../../state/ProjectContext.js';
import { useI18n } from '@pixture/i18n';

export function FilmstripTray() {
  const {
    photos,
    addUploadedPhotos,
    removePhoto,
    fillPageWithPhoto,
    autoPackAllPhotos,
    selectedSlotIndex,
    assignPhotoToSlot,
    loadSamplePhotos,
    announce,
  } = useProject();

  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const array = Array.from(files);
    addUploadedPhotos(array);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <section
      aria-label="Uploaded Photos Filmstrip"
      className="h-28 border-t border-md-outline-variant bg-md-surface px-4 py-2 flex items-center gap-4 shrink-0 select-none z-20"
    >
      {/* Upload Drop Zone / Button */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`h-full min-w-[140px] px-3 border-2 border-dashed rounded-md-lg flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragOver
            ? 'border-md-primary bg-md-primary-container/40 scale-95'
            : 'border-md-outline hover:border-md-primary hover:bg-md-surface-container'
        }`}
        title={t('dropPhotosHere')}
      >
        <Upload className="w-5 h-5 text-md-primary mb-1" />
        <span className="text-xs font-semibold text-md-on-surface text-center leading-tight">
          {t('addPhotos')}
        </span>
        <span className="text-[10px] text-md-on-surface-variant text-center opacity-70">
          PNG, JPG, WebP
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          aria-hidden="true"
        />
      </div>

      <div className="h-16 w-[1px] bg-md-outline-variant shrink-0"></div>

      {/* Action shortcuts: Auto-Pack & Fill */}
      {photos.length > 0 && (
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => {
              autoPackAllPhotos();
              announce('Auto-pack executed.');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md-full bg-md-surface-container hover:bg-md-surface-container-high border border-md-outline-variant text-xs font-semibold text-md-on-surface transition-colors"
            title="Automatically distribute all photos into pages"
          >
            <Sparkles className="w-3.5 h-3.5 text-google-blue" />
            <span>{t('autoPack')}</span>
          </button>
          <span className="text-[10px] font-medium text-md-on-surface-variant text-center">
            {photos.length} photo{photos.length > 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Scrolling Filmstrip Gallery */}
      <div className="flex-1 h-full flex items-center gap-3 overflow-x-auto py-1">
        {photos.length === 0 ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-md-on-surface-variant text-xs opacity-70">
              <ImageIcon className="w-4 h-4" />
              <span>{t('dropPhotosHere')}</span>
            </div>
            <button
              onClick={loadSamplePhotos}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md-full bg-md-primary-container text-md-on-primary-container border border-md-primary/40 hover:border-md-primary font-semibold text-xs transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-google-yellow" />
              <span>{t('loadSamplePhotos')}</span>
            </button>
          </div>
        ) : (
          photos.map((photo) => (
            <div
              key={photo.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('text/plain', photo.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              onClick={() => {
                if (selectedSlotIndex !== null) {
                  assignPhotoToSlot(selectedSlotIndex, photo.id);
                  announce(`Assigned photo to slot ${selectedSlotIndex + 1}`);
                }
              }}
              className="h-full min-w-[76px] w-[76px] relative group rounded-md-md border border-md-outline-variant overflow-hidden bg-md-surface-container cursor-grab active:cursor-grabbing hover:shadow-md-2 hover:border-md-primary transition-all shrink-0 flex flex-col"
              title={`${photo.name} (${photo.width}×${photo.height}px). Drag onto canvas or click to assign.`}
            >
              <img
                src={photo.dataUrl}
                alt={photo.name}
                className="w-full flex-1 object-cover pointer-events-none select-none"
              />

              {/* Bottom filename badge */}
              <div className="bg-md-surface/90 backdrop-blur-sm px-1 py-0.5 text-[9px] truncate text-center text-md-on-surface font-mono">
                {photo.name}
              </div>

              {/* Hover Actions: 1-click Fill Page & Delete */}
              <div className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 bg-black/75 p-0.5 rounded-md-full transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fillPageWithPhoto(photo.id);
                  }}
                  className="p-1 hover:bg-white/20 rounded-md-full text-white transition-colors"
                  title={t('fillPage')}
                >
                  <CopyCheck className="w-3 h-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removePhoto(photo.id);
                  }}
                  className="p-1 hover:bg-white/20 rounded-md-full text-google-red transition-colors"
                  title={t('removePhoto')}
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
