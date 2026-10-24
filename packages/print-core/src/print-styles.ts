import { getPaperDimensions } from '@pixture/layout-engine';
import { SheetConfig } from './project-schema.js';

let printStyleElement: HTMLStyleElement | null = null;

export function preparePrintStyle(config: SheetConfig) {
  const paperDim = getPaperDimensions(
    config.paperId,
    config.orientation,
    config.customWidthMm,
    config.customHeightMm
  );

  if (!printStyleElement) {
    printStyleElement = document.createElement('style');
    printStyleElement.id = 'pixture-print-styles';
    document.head.appendChild(printStyleElement);
  }

  const css = `
@media print {
  @page {
    size: ${paperDim.widthMm}mm ${paperDim.heightMm}mm;
    margin: 0;
  }
  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  /* Hide all UI elements except print target */
  body > *:not(#print-root) {
    display: none !important;
  }
  #print-root {
    display: block !important;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .print-page {
    page-break-after: always;
    break-after: page;
    width: ${paperDim.widthMm}mm;
    height: ${paperDim.heightMm}mm;
    position: relative;
    overflow: hidden;
    background: #ffffff;
  }
}
  `.trim();

  printStyleElement.textContent = css;
}

export function triggerBrowserPrint(config: SheetConfig) {
  preparePrintStyle(config);
  window.print();
}
