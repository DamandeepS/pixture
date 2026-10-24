import { useEffect } from 'react';
import { I18nProvider } from '@pixture/i18n';
import { ProjectProvider, useProject } from './state/ProjectContext.js';
import { AppBar } from './components/app-bar/AppBar.js';
import { SheetCanvas } from './components/canvas/SheetCanvas.js';
import { FilmstripTray } from './components/filmstrip/FilmstripTray.js';
import { ToolPanel } from './components/panels/ToolPanel.js';
import { CropModal } from './components/cropper/CropModal.js';
import { PrintContainer } from './components/print/PrintContainer.js';
import { A11yAnnouncer } from './components/common/A11yAnnouncer.js';
import { triggerBrowserPrint } from '@pixture/print-core';

function StudioWorkspace() {
  const { undo, redo, setSelectedSlotIndex, config } = useProject();

  // Global keyboard shortcuts
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
      } else if (e.key === 'Escape') {
        setSelectedSlotIndex(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, setSelectedSlotIndex, config]);

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
