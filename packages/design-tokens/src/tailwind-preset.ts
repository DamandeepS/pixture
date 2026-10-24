import { colors, radii, elevations, typography } from './tokens.js';

export const pixtureTailwindConfig = {
  theme: {
    extend: {
      colors: {
        'md-primary': colors.primary,
        'md-on-primary': colors.onPrimary,
        'md-primary-container': colors.primaryContainer,
        'md-on-primary-container': colors.onPrimaryContainer,

        'md-secondary': colors.secondary,
        'md-on-secondary': colors.onSecondary,
        'md-secondary-container': colors.secondaryContainer,
        'md-on-secondary-container': colors.onSecondaryContainer,

        'md-tertiary': colors.tertiary,
        'md-on-tertiary': colors.onTertiary,
        'md-tertiary-container': colors.tertiaryContainer,
        'md-on-tertiary-container': colors.onTertiaryContainer,

        'md-error': colors.error,
        'md-on-error': colors.onError,
        'md-error-container': colors.errorContainer,
        'md-on-error-container': colors.onErrorContainer,

        'md-surface': colors.surface,
        'md-surface-dim': colors.surfaceDim,
        'md-surface-bright': colors.surfaceBright,
        'md-surface-container-lowest': colors.surfaceContainerLowest,
        'md-surface-container-low': colors.surfaceContainerLow,
        'md-surface-container': colors.surfaceContainer,
        'md-surface-container-high': colors.surfaceContainerHigh,
        'md-surface-container-highest': colors.surfaceContainerHighest,

        'md-on-surface': colors.onSurface,
        'md-on-surface-variant': colors.onSurfaceVariant,
        'md-outline': colors.outline,
        'md-outline-variant': colors.outlineVariant,

        'google-blue': colors.googleBlue,
        'google-red': colors.googleRed,
        'google-yellow': colors.googleYellow,
        'google-green': colors.googleGreen,
      },
      borderRadius: {
        'md-none': radii.none,
        'md-xs': radii.xs,
        'md-sm': radii.sm,
        'md-md': radii.md,
        'md-lg': radii.lg,
        'md-xl': radii.xl,
        'md-2xl': radii['2xl'],
        'md-full': radii.full,
      },
      boxShadow: {
        'md-0': elevations[0],
        'md-1': elevations[1],
        'md-2': elevations[2],
        'md-3': elevations[3],
        'md-4': elevations[4],
      },
      fontFamily: {
        sans: [typography.fontFamily.sans],
        mono: [typography.fontFamily.mono],
      },
    },
  },
};

export default pixtureTailwindConfig;
