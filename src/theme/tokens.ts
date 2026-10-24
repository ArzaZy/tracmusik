// ============================================================
// TracMusic Design Tokens
// Purple/white identity, glass morphism, premium feel
// ============================================================

export const palette = {
  // Brand
  purple50:  '#F3EEFF',
  purple100: '#E4D3FF',
  purple200: '#C9A6FF',
  purple300: '#A97AFF',
  purple400: '#8B54F7',
  purple500: '#7035E0',  // Primary brand
  purple600: '#5820C9',
  purple700: '#3F0FA8',
  purple800: '#2C0880',
  purple900: '#1A0458',

  // Neutrals (cool-tinted, not warm)
  white:      '#FFFFFF',
  neutral50:  '#F8F7FF',
  neutral100: '#EFECFF',
  neutral200: '#DDD9F0',
  neutral300: '#B8B3CC',
  neutral400: '#8B86A0',
  neutral500: '#605C75',
  neutral600: '#48445A',
  neutral700: '#302D40',
  neutral800: '#1E1B2E',
  neutral900: '#100D1E',
  neutral950: '#080612',
  black:      '#000000',

  // Semantic
  success:    '#34D399',
  warning:    '#FBBF24',
  error:      '#F87171',
  info:       '#60A5FA',

  // Transparent tints for glass surfaces
  glassDark:   'rgba(16, 13, 30, 0.72)',
  glassLight:  'rgba(248, 247, 255, 0.72)',
  glassWhite:  'rgba(255, 255, 255, 0.12)',
  glassPurple: 'rgba(112, 53, 224, 0.18)',
} as const;

export const typography = {
  // Sizes
  size: {
    xs:   11,
    sm:   13,
    base: 15,
    md:   17,
    lg:   20,
    xl:   24,
    '2xl': 28,
    '3xl': 34,
    '4xl': 40,
  },
  // Weights (React Native uses string for weight)
  weight: {
    regular:   '400' as const,
    medium:    '500' as const,
    semibold:  '600' as const,
    bold:      '700' as const,
    heavy:     '800' as const,
  },
  // Line heights (multiplier)
  lineHeight: {
    tight:   1.2,
    normal:  1.45,
    relaxed: 1.6,
  },
  // Letter spacing
  tracking: {
    tight:  -0.5,
    normal: 0,
    wide:   0.3,
    wider:  0.8,
  },
} as const;

export const spacing = {
  '0':    0,
  '0.5':  2,
  '1':    4,
  '1.5':  6,
  '2':    8,
  '2.5':  10,
  '3':    12,
  '3.5':  14,
  '4':    16,
  '5':    20,
  '6':    24,
  '7':    28,
  '8':    32,
  '10':   40,
  '12':   48,
  '14':   56,
  '16':   64,
  '20':   80,
  '24':   96,
} as const;

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#7035E0',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  purple: {
    shadowColor: '#7035E0',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },
} as const;

export const animation = {
  duration: {
    instant:  100,
    fast:     200,
    normal:   300,
    slow:     500,
    verySlow: 800,
  },
  spring: {
    gentle: { damping: 20, stiffness: 150, mass: 1 },
    snappy: { damping: 14, stiffness: 300, mass: 0.8 },
    bouncy: { damping: 10, stiffness: 200, mass: 1 },
  },
} as const;
