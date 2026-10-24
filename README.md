# Pixture 🎨📸

[![Quality Gates & CI](https://github.com/DamandeepS/pixture/actions/workflows/ci.yml/badge.svg)](https://github.com/DamandeepS/pixture/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Privacy: 100% On-Device](https://img.shields.io/badge/Privacy-100%25%20On--Device-success.svg)](PRIVACY.md)

> Precision Photo Printing, Auto-Grid Layout, Cropping & Cut Markings with Google Material 3 Design.

Pixture is a client-side photo printing and imposition layout web application built with a Google-inspired Material 3 aesthetic. It lets you compose photos onto standard or custom paper sizes, calculates maximum yield, provides precision cropping and color adjustments, and exports print-ready sheets with accurate cut marks.

---

## Features

- **Google-Inspired Studio Layout**:
  - Top action bar with Google 4-color branding, project management, and direct print/export actions.
  - Interactive canvas stage with physical rulers ($mm$, $cm$, $in$) and live sheet scaling.
  - Bottom filmstrip photo tray with drag-and-drop upload and direct drag-to-slot assignment.
  - Right configuration panel for Paper, Cut Marks, and Photo Inspector.
- **Auto-Grid & Imposition Layout Engine**:
  - **Uniform Grid Mode**: Auto-calculates capacity based on paper size, target photo size, margins, and inter-photo spacing.
  - **Smart Auto-Orientation**: Automatically rotates slots 90° if it yields more photos per sheet.
  - **Mixed-Size Packing Mode**: 2D Guillotine bin packing algorithm to mix photos of different dimensions on a single page.
  - **Multi-Page Overflow**: Automatically paginates when photos exceed single sheet capacity.
- **Predefined Presets**:
  - **Paper Sizes**: A4, A3, A5, US Letter, US Legal, 4×6" (10×15 cm), 5×7" (13×18 cm), 8×10", and Custom dimensions.
  - **Photo Presets**: US Passport (2×2 in), UK/EU/Schengen Passport (35×45 mm), India Passport/PAN (35×45 mm), Stamp size, Wallet (2.5×3.5 in), 3.5×5 in, 4×6 in, 5×7 in, 8×10 in, Square (3×3 in, 4×4 in), and Retro Polaroid.
- **Cut Markings & Bleed**:
  - Corner tick marks (traditional L-marks outside the photo area preventing ink on trimmed edges).
  - Dashed cutting lines.
  - Solid hairlines.
  - Configurable Bleed margins (0 to 5 mm).
  - Custom cut mark colors and weights.
- **Interactive Cropper & Color Adjustments**:
  - Accessible native `<dialog>` modal with focus trapping and ESC light-dismiss.
  - Interactive pan and zoom slider ($1\times$ to $3.5\times$).
  - 90° rotation and horizontal/vertical flip.
  - Fitting modes: Cover (edge bleed) vs Contain (letterbox).
  - Color adjustment sliders: Brightness, Contrast, Saturation, and 1-click Black & White toggle.
  - Border styles: Classic white photo border and Retro Polaroid style with custom handwritten captions.
- **Print & Export**:
  - **Direct 100% Scale Browser Print** (`window.print()`): Injects exact `@page` CSS eliminating browser scaling distortions.
  - **300 DPI Print-Ready PDF**: Vector PDF with embedded high-resolution photos and vector hairline cut marks using `pdf-lib`.
  - **300 DPI PNG Export**: High-resolution raster download for commercial lab printing.
- **Productivity & Persistence**:
  - 1-Click "Fill Page" (e.g. duplicate 1 photo to fill all available slots on the sheet, ideal for passport/ID photos).
  - "Auto-Pack" all uploaded photos across multiple sheets.
  - Browser Auto-Save via IndexedDB (`idb-keyval`).
  - Project file export and import (`.pixture` JSON).
  - Full Undo / Redo history with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`).
- **Accessibility (A11Y) & Internationalization (i18n)**:
  - Multi-locale support: English, Spanish, French, German, Hindi, and Japanese.
  - ARIA live region announcements, keyboard navigable slots, high-contrast focus rings, skip-to-canvas link.

---

## Monorepo Architecture

Pixture is organized as a Turborepo monorepo with npm workspaces:

```
pixture/
├── packages/
│   ├── design-tokens/       # Google Material 3 tokens & Tailwind preset
│   ├── layout-engine/       # Pure TypeScript grid math, bin packing & cut marks
│   ├── print-core/          # 300 DPI canvas rendering & PDF-Lib vector export
│   └── i18n/                # Multi-language localization dictionaries & hooks
├── apps/
│   └── web/                 # React 19 + Vite + Tailwind CSS Studio application
├── turbo.json
└── package.json
```

---

## Getting Started

### Prerequisites
- Node.js >= 20
- npm >= 10

### Installation
```bash
git clone <repo-url>
cd pixture
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build
```bash
npm run build
```

### Test
```bash
npm run test
```

---

## Privacy & Security

- **100% Client-Side:** Photos never leave your device. All rendering, cropping, color adjustments, and exports occur locally in browser memory.
- **Zero Telemetry:** No cookies, no trackers, and no external analytics beacons.
- **Biometric Safety:** No facial recognition or data harvesting.
- See [PRIVACY.md](PRIVACY.md), [TERMS.md](TERMS.md), and [SECURITY.md](SECURITY.md) for complete details.

---

## License

This project is licensed under the [MIT License](LICENSE) - see the [LICENSE](LICENSE) and [NOTICE](NOTICE) files for details.

