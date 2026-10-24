import { pixtureTailwindConfig } from '@pixture/design-tokens';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/*/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [pixtureTailwindConfig],
  theme: {
    extend: {},
  },
  plugins: [],
};
