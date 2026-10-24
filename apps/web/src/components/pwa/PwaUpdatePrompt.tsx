import { useEffect } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, Sparkles, CheckCircle2, X } from 'lucide-react';

export function PwaUpdatePrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_swUrl, registration) {
      if (registration) {
        // Check for updates every 30 minutes
        setInterval(
          () => {
            registration.update();
          },
          30 * 60 * 1000
        );

        // Check for updates when the user switches back to this tab
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });
      }
    },
    onRegisterError(error) {
      console.warn('PWA ServiceWorker registration failed:', error);
    },
  });

  // Auto-dismiss "offline ready" toast after 4 seconds
  useEffect(() => {
    if (offlineReady) {
      const timer = setTimeout(() => {
        setOfflineReady(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [offlineReady, setOfflineReady]);

  if (!needRefresh && !offlineReady) {
    return null;
  }

  return (
    <aside
      aria-label="PWA Status Notifications"
      className="fixed bottom-24 right-6 z-50 flex flex-col gap-2 max-w-sm pointer-events-auto select-none"
    >
      {/* Offline Ready Toast */}
      {offlineReady && !needRefresh && (
        <div
          role="status"
          className="flex items-center gap-2.5 px-4 py-3 bg-md-surface-container-high text-md-on-surface rounded-2xl shadow-md-3 border border-emerald-500/30 text-xs animate-in slide-in-from-bottom duration-200"
        >
          <div className="w-6 h-6 rounded-full bg-[#e6f4ea] text-google-green flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <span className="font-semibold block">Ready for Offline Use</span>
            <span className="text-[11px] text-md-on-surface-variant">
              Pixture can now run without an internet connection.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setOfflineReady(false)}
            className="p-1 rounded-full hover:bg-md-surface-container text-md-on-surface-variant transition-colors"
            aria-label="Dismiss offline notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* New Version Update Prompt */}
      {needRefresh && (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col gap-3 p-4 bg-md-surface-container-high text-md-on-surface rounded-2xl shadow-md-3 border border-md-primary/40 text-xs animate-in slide-in-from-bottom duration-200"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-md-primary/10 text-md-primary flex items-center justify-center shrink-0 mt-0.5">
              <RefreshCw className="w-4 h-4 animate-spin-slow" />
            </div>

            <div className="flex-1 space-y-0.5">
              <div className="font-bold text-sm text-md-on-surface flex items-center gap-1.5">
                <span>Update Available</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-md-primary/10 text-md-primary font-mono font-semibold">
                  v{__APP_VERSION__}
                </span>
              </div>
              <p className="text-[11px] text-md-on-surface-variant leading-relaxed">
                A new version has been downloaded. Update now to use the latest features without
                losing your current project layout.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="p-1 rounded-full hover:bg-md-surface-container text-md-on-surface-variant transition-colors"
              aria-label="Dismiss update notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1 border-t border-md-outline-variant/60">
            <button
              type="button"
              onClick={() => setNeedRefresh(false)}
              className="px-3 py-1.5 rounded-full text-xs font-medium text-md-on-surface-variant hover:bg-md-surface-container transition-colors"
            >
              Later
            </button>

            <button
              type="button"
              onClick={() => updateServiceWorker(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-md-primary text-white text-xs font-semibold hover:bg-[#1557b0] active:scale-95 transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Update Now</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
