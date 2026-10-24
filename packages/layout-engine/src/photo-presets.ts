export interface PhotoPreset {
  id: string;
  name: string;
  category: 'id' | 'standard' | 'square' | 'retro' | 'custom';
  widthMm: number;
  heightMm: number;
  aspectRatio: number;
  description?: string;
  hasPolaroidBorder?: boolean;
}

export const PHOTO_PRESETS: Record<string, PhotoPreset> = {
  // ID / Passport Presets
  passport_us: {
    id: 'passport_us',
    name: 'US Passport / Visa (2 × 2 in)',
    category: 'id',
    widthMm: 50.8,
    heightMm: 50.8,
    aspectRatio: 1,
    description: 'Official US 2x2 inch passport/visa standard',
  },
  passport_uk_eu: {
    id: 'passport_uk_eu',
    name: 'UK / EU / Schengen (35 × 45 mm)',
    category: 'id',
    widthMm: 35.0,
    heightMm: 45.0,
    aspectRatio: 35 / 45,
    description: 'European standard biometric passport photo',
  },
  passport_in: {
    id: 'passport_in',
    name: 'India Passport / PAN (35 × 45 mm)',
    category: 'id',
    widthMm: 35.0,
    heightMm: 45.0,
    aspectRatio: 35 / 45,
    description: 'Standard Indian Passport & Visa dimension',
  },
  passport_30x40: {
    id: 'passport_30x40',
    name: '30 × 40 mm (Global ID)',
    category: 'id',
    widthMm: 30.0,
    heightMm: 40.0,
    aspectRatio: 30 / 40,
    description: 'Driver license & employee badge size',
  },
  stamp_size: {
    id: 'stamp_size',
    name: 'Stamp Size (20 × 25 mm)',
    category: 'id',
    widthMm: 20.0,
    heightMm: 25.0,
    aspectRatio: 20 / 25,
    description: 'Small stamp size for application forms',
  },

  // Standard Photo Prints
  print_wallet: {
    id: 'print_wallet',
    name: 'Wallet (2.5 × 3.5 in / 64 × 89 mm)',
    category: 'standard',
    widthMm: 63.5,
    heightMm: 88.9,
    aspectRatio: 63.5 / 88.9,
    description: 'Traditional wallet photo size',
  },
  print_3_5x5: {
    id: 'print_3_5x5',
    name: '3.5 × 5 in (9 × 13 cm)',
    category: 'standard',
    widthMm: 88.9,
    heightMm: 127.0,
    aspectRatio: 88.9 / 127.0,
    description: 'Classic photo album print',
  },
  print_4x6: {
    id: 'print_4x6',
    name: '4 × 6 in (10 × 15 cm)',
    category: 'standard',
    widthMm: 101.6,
    heightMm: 152.4,
    aspectRatio: 101.6 / 152.4,
    description: 'Most popular snapshot print size',
  },
  print_5x7: {
    id: 'print_5x7',
    name: '5 × 7 in (13 × 18 cm)',
    category: 'standard',
    widthMm: 127.0,
    heightMm: 177.8,
    aspectRatio: 127.0 / 177.8,
    description: 'Framed desktop portrait',
  },
  print_8x10: {
    id: 'print_8x10',
    name: '8 × 10 in (20 × 25 cm)',
    category: 'standard',
    widthMm: 203.2,
    heightMm: 254.0,
    aspectRatio: 203.2 / 254.0,
    description: 'Large portrait frame',
  },

  // Square Prints
  square_3x3: {
    id: 'square_3x3',
    name: 'Square 3 × 3 in (7.6 × 7.6 cm)',
    category: 'square',
    widthMm: 76.2,
    heightMm: 76.2,
    aspectRatio: 1,
    description: 'Instagram-style square print',
  },
  square_4x4: {
    id: 'square_4x4',
    name: 'Square 4 × 4 in (10 × 10 cm)',
    category: 'square',
    widthMm: 101.6,
    heightMm: 101.6,
    aspectRatio: 1,
    description: 'Square wall collage print',
  },

  // Retro / Polaroid
  polaroid_vintage: {
    id: 'polaroid_vintage',
    name: 'Retro Polaroid (89 × 108 mm)',
    category: 'retro',
    widthMm: 88.9,
    heightMm: 108.0,
    aspectRatio: 88.9 / 108.0,
    description: 'Vintage instant camera look with bottom caption space',
    hasPolaroidBorder: true,
  },
};
