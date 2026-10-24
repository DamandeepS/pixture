import { useEffect, useState } from 'react';
import { I18nProvider } from '@pixture/i18n';
import { ProjectProvider, useProject } from './state/ProjectContext.js';
import { AppBar } from './components/app-bar/AppBar.js';
import { SheetCanvas } from './components/canvas/SheetCanvas.js';
import { FilmstripTray } from './components/filmstrip/FilmstripTray.js';
import { ToolPanel } from './components/panels/ToolPanel.js';
import { CropModal } from './components/cropper/CropModal.js';
import { PrintContainer } from './components/print/PrintContainer.js';
import { A11yAnnouncer } from './components/common/A11yAnnouncer.js';
import { PwaUpdatePrompt } from './components/pwa/PwaUpdatePrompt.js';
import { triggerBrowserPrint } from '@pixture/print-core';
import { Upload, Image as ImageIcon } from 'lucide-react';

function StudioWorkspace() {
  const {
    undo,
    redo,
    setSelectedSlotIndex,
    selectedSlotIndex,
    duplicateSlotPhoto,
    config,
    addUploadedPhotos,
    announce,
  } = useProject();

  const [isDraggingFiles, setIsDraggingFiles] = useState(false);

  // Global keyboard shortcuts, clipboard paste, and window-level drag & drop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger shortcuts when typing in inputs or textareas
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        triggerBrowserPrint(config);
      } else if ((e.metaKey || e.ctrlKey) && (e.key === 'd' || e.key === 'D')) {
        if (selectedSlotIndex !== null) {
          e.preventDefault();
          duplicateSlotPhoto(selectedSlotIndex);
        }
      } else if (e.key === 'Escape') {
        setSelectedSlotIndex(null);
      }
    };

    // Global Clipboard Paste Handler (CMD+V / CTRL+V)
    const handlePaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const blob = item.getAsFile();
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(11, 19);
            const ext = blob.type.split('/')[1] || 'png';
            const fileName =
              blob.name && blob.name !== 'image.png'
                ? blob.name
                : `Pasted-Photo-${timestamp}.${ext}`;
            const namedFile = new File([blob], fileName, { type: blob.type });
            imageFiles.push(namedFile);
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addUploadedPhotos(imageFiles, selectedSlotIndex ?? undefined);
        announce(
          selectedSlotIndex !== null
            ? `Photo pasted into slot ${selectedSlotIndex + 1}`
            : `${imageFiles.length} photo(s) pasted from clipboard`
        );
      }
    };

    // Global drag & drop counter for external files
    let dragCounter = 0;

    const handleDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        dragCounter++;
        setIsDraggingFiles(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          setIsDraggingFiles(false);
        }
      }
    };

    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        dragCounter = 0;
        setIsDraggingFiles(false);

        const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
        if (files.length > 0) {
          addUploadedPhotos(files, selectedSlotIndex ?? undefined);
          announce(
            selectedSlotIndex !== null
              ? `${files[0].name} placed into slot ${selectedSlotIndex + 1}`
              : `${files.length} photo(s) dropped and added to sheet`
          );
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('paste', handlePaste);
    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('paste', handlePaste);
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [
    undo,
    redo,
    setSelectedSlotIndex,
    selectedSlotIndex,
    duplicateSlotPhoto,
    config,
    addUploadedPhotos,
    announce,
  ]);

  return (
    <div className="h-screen w-screen flex flex-col bg-md-surface overflow-hidden">
      <A11yAnnouncer />
      <AppBar />

      {/* Main Studio Middle Area */}
      <div className="flex-1 flex overflow-hidden relative">
        <SheetCanvas />
        <ToolPanel />
      </div>

      {/* Bottom Photo Filmstrip Tray */}
      <FilmstripTray />

      {/* Accessible Crop & Adjustment Modal */}
      <CropModal />

      {/* Dedicated Clean Print Portal */}
      <PrintContainer />

      {/* Progressive Web App (PWA) Live Background Update Prompt */}
      <PwaUpdatePrompt />

      {/* Full-Window Drag & Drop Overlay */}
      {isDraggingFiles && (
        <div
          className="fixed inset-0 z-50 bg-md-primary/10 backdrop-blur-sm border-4 border-dashed border-md-primary m-4 rounded-3xl flex flex-col items-center justify-center gap-4 text-md-primary pointer-events-none animate-in fade-in duration-150 select-none"
          role="presentation"
        >
          <div className="w-20 h-20 rounded-full bg-white shadow-md-3 flex items-center justify-center text-md-primary animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <div className="text-center bg-white/95 backdrop-blur-md px-6 py-4 rounded-2xl shadow-md-2 border border-md-outline-variant/60">
            <h3 className="text-lg font-bold text-md-on-surface flex items-center justify-center gap-2">
              <ImageIcon className="w-5 h-5 text-md-primary" />
              <span>Drop photos anywhere to add</span>
            </h3>
            <p className="text-xs text-md-on-surface-variant mt-1">
              {selectedSlotIndex !== null
                ? `Will place directly into selected slot ${selectedSlotIndex + 1}`
                : 'Will add to photo tray & auto-fit into available slots'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <I18nProvider defaultLocale="en">
      <ProjectProvider>
        <StudioWorkspace />
      </ProjectProvider>
    </I18nProvider>
  );
}

export default App;
