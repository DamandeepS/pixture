/**
 * Google Material Design 3 Tokens for Pixture
 */

export const colors = {
  // Primary (Google Blue)
  primary: '#1a73e8',
  onPrimary: '#ffffff',
  primaryContainer: '#d2e3fc',
  onPrimaryContainer: '#041e49',

  // Secondary (Google Slate / Charcoal)
  secondary: '#5f6368',
  onSecondary: '#ffffff',
  secondaryContainer: '#e8eaed',
  onSecondaryContainer: '#1f1f1f',

  // Tertiary (Google Green)
  tertiary: '#188038',
  onTertiary: '#ffffff',
  tertiaryContainer: '#ceead6',
  onTertiaryContainer: '#0d652d',

  // Error (Google Red)
  error: '#d93025',
  onError: '#ffffff',
  errorContainer: '#fce8e6',
  onErrorContainer: '#c5221f',

  // Neutral / Surface Tones (Material 3 Surface Hierarchy)
  surface: '#ffffff',
  surfaceDim: '#ded8e1',
  surfaceBright: '#fef7ff',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#f7f9fc',
  surfaceContainer: '#f0f4f9',
  surfaceContainerHigh: '#e9eef6',
  surfaceContainerHighest: '#e1e3e1',

  onSurface: '#1f1f1f',
  onSurfaceVariant: '#444746',
  outline: '#747775',
  outlineVariant: '#c4c7c5',

  // Google Accent Colors
  googleYellow: '#f9ab00',
  googleGreen: '#1e8e3e',
  googleRed: '#ea4335',
  googleBlue: '#4285f4',
} as const;

export const radii = {
  none: '0px',
  xs: '4px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const;

export const elevations = {
  0: 'none',
  1: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
  2: '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
  3: '0 4px 8px 3px rgba(60,64,67,0.15), 0 1px 3px 0 rgba(60,64,67,0.3)',
  4: '0 6px 10px 4px rgba(60,64,67,0.15), 0 2px 3px 0 rgba(60,64,67,0.3)',
} as const;

export const typography = {
  fontFamily: {
    sans: 'Google Sans, Roboto, -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif',
    mono: 'Roboto Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  },
  fontSize: {
    displayLg: ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.02em', fontWeight: '400' }],
    headlineLg: ['2rem', { lineHeight: '2.5rem', letterSpacing: '0', fontWeight: '400' }],
    headlineMd: ['1.75rem', { lineHeight: '2.25rem', letterSpacing: '0', fontWeight: '400' }],
    headlineSm: ['1.5rem', { lineHeight: '2rem', letterSpacing: '0', fontWeight: '400' }],
    titleLg: ['1.375rem', { lineHeight: '1.75rem', letterSpacing: '0', fontWeight: '500' }],
    titleMd: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.009em', fontWeight: '500' }],
    titleSm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.007em', fontWeight: '500' }],
    bodyLg: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0.031em', fontWeight: '400' }],
    bodyMd: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.016em', fontWeight: '400' }],
    bodySm: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em', fontWeight: '400' }],
    labelLg: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.007em', fontWeight: '500' }],
    labelMd: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.031em', fontWeight: '500' }],
    labelSm: ['0.6875rem', { lineHeight: '0.875rem', letterSpacing: '0.031em', fontWeight: '500' }],
  },
} as const;

export const tokens = {
  colors,
  radii,
  elevations,
  typography,
} as const;

export type DesignTokens = typeof tokens;
