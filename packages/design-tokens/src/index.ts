export * from './tokens.js';
export * from './tailwind-preset.js';

/**
 * Returns CSS custom variables string for embedding in root style tags
 */
export function getCssVariables(): string {
  return `
:root {
  --md-primary: #1a73e8;
  --md-on-primary: #ffffff;
  --md-primary-container: #d2e3fc;
  --md-on-primary-container: #041e49;

  --md-secondary: #5f6368;
  --md-on-secondary: #ffffff;
  --md-secondary-container: #e8eaed;
  --md-on-secondary-container: #1f1f1f;

  --md-tertiary: #188038;
  --md-on-tertiary: #ffffff;
  --md-tertiary-container: #ceead6;
  --md-on-tertiary-container: #0d652d;

  --md-error: #d93025;
  --md-on-error: #ffffff;
  --md-error-container: #fce8e6;
  --md-on-error-container: #c5221f;

  --md-surface: #ffffff;
  --md-surface-dim: #ded8e1;
  --md-surface-bright: #fef7ff;
  --md-surface-container-lowest: #ffffff;
  --md-surface-container-low: #f7f9fc;
  --md-surface-container: #f0f4f9;
  --md-surface-container-high: #e9eef6;
  --md-surface-container-highest: #e1e3e1;

  --md-on-surface: #1f1f1f;
  --md-on-surface-variant: #444746;
  --md-outline: #747775;
  --md-outline-variant: #c4c7c5;

  --google-blue: #4285f4;
  --google-red: #ea4335;
  --google-yellow: #f9ab00;
  --google-green: #1e8e3e;
}
  `.trim();
}
