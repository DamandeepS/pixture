import { PhotoAsset } from '@pixture/print-core';

/**
 * Generates an SVG data URL for a rich sample photo
 */
function createSampleSvg(
  title: string,
  category: 'portrait' | 'landscape' | 'nature',
  bgGradient: [string, string],
  accentColor: string
): string {
  const width = 1200;
  const height = category === 'portrait' ? 1600 : 800;

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgGradient[0]}" />
      <stop offset="100%" stop-color="${bgGradient[1]}" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0.2" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${width}" height="${height}" fill="url(#bg)" />
  <rect width="${width}" height="${height}" fill="url(#glow)" />

  ${
    category === 'portrait'
      ? `
    <!-- Studio Portrait Silhouette -->
    <circle cx="600" cy="550" r="280" fill="${accentColor}" opacity="0.9" />
    <!-- Head & Shoulders -->
    <circle cx="600" cy="520" r="160" fill="#ffffff" opacity="0.95" />
    <path d="M 320 1200 C 320 850, 440 760, 600 760 C 760 760, 880 850, 880 1200 Z" fill="#ffffff" opacity="0.9" />
    <circle cx="540" cy="500" r="14" fill="#333333" />
    <circle cx="660" cy="500" r="14" fill="#333333" />
    <path d="M 560 580 Q 600 620 640 580" stroke="#333333" stroke-width="8" stroke-linecap="round" fill="none" />
  `
      : `
    <!-- Landscape Mountains & Sun -->
    <circle cx="350" cy="300" r="140" fill="#fbbc04" opacity="0.85" />
    <polygon points="100,800 450,380 750,800" fill="${accentColor}" opacity="0.9" />
    <polygon points="500,800 850,320 1150,800" fill="${accentColor}" opacity="0.75" />
    <polygon points="750,800 1000,450 1250,800" fill="#ffffff" opacity="0.4" />
  `
  }

  <!-- Photo Title Card -->
  <rect x="60" y="${height - 120}" width="${width - 120}" height="80" rx="16" fill="#000000" opacity="0.4" />
  <text x="${width / 2}" y="${height - 70}" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">
    ${title}
  </text>
</svg>
  `.trim();

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const SAMPLE_PHOTOS: PhotoAsset[] = [
  {
    id: 'sample_portrait_1',
    name: 'Studio Portrait (Passport)',
    dataUrl: createSampleSvg('Studio Portrait', 'portrait', ['#1a73e8', '#0d47a1'], '#4285f4'),
    width: 1200,
    height: 1600,
    type: 'image/svg+xml',
    sizeBytes: 15420,
  },
  {
    id: 'sample_landscape_1',
    name: 'Golden Mountain Sunset',
    dataUrl: createSampleSvg(
      'Golden Mountain Sunset',
      'landscape',
      ['#ea4335', '#b71c1c'],
      '#f28b82'
    ),
    width: 1200,
    height: 800,
    type: 'image/svg+xml',
    sizeBytes: 14890,
  },
  {
    id: 'sample_nature_1',
    name: 'Emerald Forest Hills',
    dataUrl: createSampleSvg(
      'Emerald Forest Hills',
      'landscape',
      ['#188038', '#0d652d'],
      '#81c995'
    ),
    width: 1200,
    height: 800,
    type: 'image/svg+xml',
    sizeBytes: 14210,
  },
  {
    id: 'sample_portrait_2',
    name: 'Casual Travel Portrait',
    dataUrl: createSampleSvg('Travel Portrait', 'portrait', ['#f9ab00', '#e37400'], '#fdd663'),
    width: 1200,
    height: 1600,
    type: 'image/svg+xml',
    sizeBytes: 15120,
  },
];
