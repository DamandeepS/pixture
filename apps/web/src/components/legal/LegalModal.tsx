import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  Scale,
  FileText,
  Heart,
  X,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  Database,
  EyeOff,
} from 'lucide-react';
import { useI18n } from '@pixture/i18n';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms' | 'license' | 'attributions';
}

export function LegalModal({ isOpen, onClose, defaultTab = 'privacy' }: LegalModalProps) {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'license' | 'attributions'>(
    defaultTab
  );
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  // Synchronize state during render when modal opens
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setActiveTab(defaultTab);
    }
  }

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-dialog-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      {/* Backdrop overlay button */}
      <button
        type="button"
        onClick={onClose}
        className="fixed inset-0 bg-transparent cursor-default border-none -z-10"
        aria-label={t('close')}
        tabIndex={-1}
      />

      {/* Modal card container */}
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-md-surface rounded-2xl shadow-2xl border border-md-outline-variant overflow-hidden z-10">
        {/* Header with Title and Close Button */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-md-outline-variant bg-md-surface-container-low">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-google-green/10 flex items-center justify-center text-google-green">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 id="legal-dialog-title" className="text-lg font-bold text-md-on-surface">
                {t('legalAndPrivacy')}
              </h2>
              <p className="text-xs text-md-on-surface-variant">
                Pixture v{__APP_VERSION__} • Open Source Photography & Print Utility
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-md-surface-container text-md-on-surface-variant transition-colors"
            aria-label={t('close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 100% On-Device Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border-b border-emerald-200 dark:border-emerald-800/40 px-6 py-3 flex items-start gap-3">
          <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Lock className="w-3.5 h-3.5" />
          </div>
          <div className="text-xs text-emerald-900 dark:text-emerald-200">
            <span className="font-semibold block">{t('onDeviceGuarantee')}</span>
            <span className="opacity-90">{t('onDeviceDescription')}</span>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-md-outline-variant bg-md-surface px-6 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'privacy'
                ? 'border-md-primary text-md-primary'
                : 'border-transparent text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{t('privacyPolicy')}</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'terms'
                ? 'border-md-primary text-md-primary'
                : 'border-transparent text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>{t('termsOfService')}</span>
          </button>

          <button
            onClick={() => setActiveTab('license')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'license'
                ? 'border-md-primary text-md-primary'
                : 'border-transparent text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>{t('openSourceLicense')}</span>
          </button>

          <button
            onClick={() => setActiveTab('attributions')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'attributions'
                ? 'border-md-primary text-md-primary'
                : 'border-transparent text-md-on-surface-variant hover:text-md-on-surface'
            }`}
          >
            <Heart className="w-4 h-4" />
            <span>{t('attributions')}</span>
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-md-on-surface-variant leading-relaxed">
          {/* TAB 1: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-md-on-surface mb-1">
                  Zero-Knowledge, Client-Side Privacy Policy
                </h3>
                <p className="text-xs text-md-on-surface-variant/80">
                  Last Updated: October 2026 • Effective Worldwide
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-md-surface-container border border-md-outline-variant/60 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-google-blue flex items-center justify-center">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-md-on-surface">100% Client-Side</h4>
                  <p className="text-[11px] leading-normal text-md-on-surface-variant">
                    Photos are processed entirely within your browser memory using HTML5 Canvas and
                    WebAssembly. No photos are ever uploaded to any server.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-md-surface-container border border-md-outline-variant/60 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-google-green flex items-center justify-center">
                    <EyeOff className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-md-on-surface">Zero Telemetry</h4>
                  <p className="text-[11px] leading-normal text-md-on-surface-variant">
                    No third-party trackers, no cookies, no analytics beacons (no Google Analytics,
                    no Facebook Pixels), and no user profiling.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-md-surface-container border border-md-outline-variant/60 flex flex-col gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                    <Database className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-md-on-surface">Local Storage</h4>
                  <p className="text-[11px] leading-normal text-md-on-surface-variant">
                    Session state is stored solely in your browser's private IndexedDB on your local
                    disk. You can wipe it anytime by resetting or clearing site data.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-md-on-surface">
                  Biometric Photos & Identity Documents
                </h4>
                <p className="text-xs">
                  Pixture does not perform facial recognition, facial geometry extraction, or
                  biometric scanning. Sensitive government documents such as passport and visa
                  photographs remain strictly in local memory and are never transmitted over the
                  internet.
                </p>

                <h4 className="text-sm font-semibold text-md-on-surface">
                  GDPR & CCPA Compliance by Design
                </h4>
                <p className="text-xs">
                  Under the European Union General Data Protection Regulation (GDPR Article 25) and
                  California Consumer Privacy Act (CCPA), Pixture practices complete data
                  minimization. Because no personal data or photos are ever collected or stored
                  remotely, there is zero risk of server data breaches.
                </p>

                <h4 className="text-sm font-semibold text-md-on-surface">
                  Offline Mode (Airplane Mode)
                </h4>
                <p className="text-xs">
                  You can verify our privacy guarantee at any time: disconnect your device from
                  Wi-Fi or turn on Airplane Mode, and Pixture will continue to generate photo
                  sheets, crop, adjust, and export high-resolution PDFs and PNGs seamlessly.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-md-on-surface mb-1">
                  Terms of Service & Usage Disclaimers
                </h3>
                <p className="text-xs text-md-on-surface-variant/80">
                  Please read carefully before printing or cutting photographs
                </p>
              </div>

              {/* Passport Warning Box */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-xs space-y-1 text-amber-900 dark:text-amber-200">
                  <span className="font-bold block text-sm">
                    Official Passport & Visa Photo Acceptance Disclaimer
                  </span>
                  <p>
                    While Pixture provides predefined templates adhering to published standard
                    dimensional specifications (e.g. US 2×2", UK/EU 35×45mm, India 35×45mm):
                  </p>
                  <ul className="list-disc pl-4 space-y-0.5 pt-1">
                    <li>
                      Government passport agencies and consulates enforce strict biometric rules
                      beyond physical dimensions (including neutral facial expression, eye level
                      height, lighting uniformity, plain light background, and matte vs. glossy
                      paper finish).
                    </li>
                    <li>
                      You are solely responsible for reviewing and verifying the official guidelines
                      of your issuing government authority. Pixture accepts no liability for
                      rejected passport or visa applications or associated travel delays.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Hardware Printing Box */}
              <div className="p-4 rounded-xl bg-md-surface-container border border-md-outline-variant/60 space-y-2">
                <div className="flex items-center gap-2 text-md-on-surface font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-google-blue" />
                  <span>Printing & Physical Cutter Tolerances</span>
                </div>
                <p className="text-xs">
                  Actual printed dimensions are subject to printer feed roller tolerances, paper
                  expansion under heat/humidity, printer margin scaling (ensure your print dialog is
                  set to <strong>"Actual Size" / 100% Scale</strong>), and cutter blade alignment.
                  We strongly recommend making a test print on plain paper and checking with a
                  physical ruler before cutting final photo sheets.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-md-on-surface">
                  Photo Ownership & Copyright
                </h4>
                <p className="text-xs">
                  You retain 100% intellectual property ownership of all photos you load into
                  Pixture. By using Pixture, you represent that you own or possess the legal right
                  and permission to duplicate, crop, and print the uploaded images.
                </p>

                <h4 className="text-sm font-semibold text-md-on-surface">
                  Limitation of Liability
                </h4>
                <p className="text-xs">
                  The software is provided "AS IS", without warranty of any kind. Under no
                  circumstances shall the authors or contributors be liable for any direct,
                  indirect, incidental, or consequential damages arising from the use or inability
                  to use the software.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: MIT LICENSE */}
          {activeTab === 'license' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-md-on-surface mb-1">
                  The MIT License (MIT)
                </h3>
                <p className="text-xs text-md-on-surface-variant/80">
                  Copyright (c) 2026 Pixture Contributors
                </p>
              </div>

              <div className="p-4 rounded-xl bg-md-surface-container font-mono text-[11px] leading-relaxed text-md-on-surface border border-md-outline-variant/70 overflow-x-auto whitespace-pre-wrap select-all">
                {`MIT License

Copyright (c) 2026 Pixture Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
              </div>
            </div>
          )}

          {/* TAB 4: ATTRIBUTIONS */}
          {activeTab === 'attributions' && (
            <div className="space-y-4 animate-fade-in">
              <div>
                <h3 className="text-base font-bold text-md-on-surface mb-1">
                  Open Source Credits & Attributions
                </h3>
                <p className="text-xs text-md-on-surface-variant/80">
                  Pixture is built upon exceptional open-source software libraries:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">React & React-DOM</div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Meta Platforms, Inc. • MIT License
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">Vite</div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Evan You & Vite Contributors • MIT License
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">Tailwind CSS</div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Tailwind Labs, Inc. • MIT License
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">pdf-lib</div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Andrew Dillon • MIT License
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">Lucide Icons</div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Lucide Project Authors • ISC License
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">idb-keyval</div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Jake Archibald • Apache 2.0 License
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">canvas-confetti</div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Kiril Vatev • ISC License
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-md-surface-container border border-md-outline-variant/60">
                  <div className="font-semibold text-md-on-surface">
                    Google Material Design 3 Tokens
                  </div>
                  <div className="text-[11px] text-md-on-surface-variant">
                    Google LLC • Apache 2.0 License
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-md-outline-variant bg-md-surface-container-low flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-md-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-google-green animate-pulse"></span>
            <span>Zero Remote Storage • Pure Client-Side Application</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold rounded-full bg-md-primary text-white hover:bg-[#1557b0] transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
