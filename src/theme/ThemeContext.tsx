import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { palette, typography, spacing, radius, shadow, animation } from './tokens';

// ---- Theme Mode ----
export type ThemeMode = 'light' | 'dark' | 'system';

// ---- Color Scheme ----
export interface ColorScheme {
  // Backgrounds
  bg:          string;
  bgSecondary: string;
  bgTertiary:  string;
  surface:     string;
  surfaceHigh: string;
  glass:       string;
  glassStrong: string;

  // Text
  textPrimary:   string;
  textSecondary: string;
  textTertiary:  string;
  textOnAccent:  string;

  // Accent (purple by default, user-customizable)
  accent:       string;
  accentLight:  string;
  accentDim:    string;

  // UI
  border:      string;
  borderLight: string;
  separator:   string;
  placeholder: string;

  // Semantic
  success: string;
  warning: string;
  error:   string;
  info:    string;

  // Player
  playerBg:    string;
  tabBarBg:    string;
}

function buildDarkScheme(accent: string): ColorScheme {
  return {
    bg:          palette.neutral950,
    bgSecondary: palette.neutral900,
    bgTertiary:  palette.neutral800,
    surface:     'rgba(30, 27, 46, 0.90)',
    surfaceHigh: 'rgba(48, 45, 64, 0.85)',
    glass:       'rgba(16, 13, 30, 0.70)',
    glassStrong: 'rgba(8, 6, 18, 0.88)',

    textPrimary:   '#FFFFFF',
    textSecondary: palette.neutral300,
    textTertiary:  palette.neutral500,
    textOnAccent:  '#FFFFFF',

    accent:      accent,
    accentLight: accent + '33',  // 20% opacity
    accentDim:   accent + '22',  // 13% opacity

    border:      'rgba(255,255,255,0.10)',
    borderLight: 'rgba(255,255,255,0.06)',
    separator:   'rgba(255,255,255,0.08)',
    placeholder: palette.neutral600,

    success: palette.success,
    warning: palette.warning,
    error:   palette.error,
    info:    palette.info,

    playerBg: palette.neutral950,
    tabBarBg: 'rgba(10, 8, 20, 0.92)',
  };
}

function buildLightScheme(accent: string): ColorScheme {
  return {
    bg:          '#F4F2FF',
    bgSecondary: '#ECEAFF',
    bgTertiary:  '#E0DCFF',
    surface:     'rgba(255, 255, 255, 0.88)',
    surfaceHigh: 'rgba(255, 255, 255, 0.95)',
    glass:       'rgba(244, 242, 255, 0.75)',
    glassStrong: 'rgba(255, 255, 255, 0.90)',

    textPrimary:   palette.neutral900,
    textSecondary: palette.neutral600,
    textTertiary:  palette.neutral400,
    textOnAccent:  '#FFFFFF',

    accent:      accent,
    accentLight: accent + '22',
    accentDim:   accent + '14',

    border:      'rgba(0,0,0,0.08)',
    borderLight: 'rgba(0,0,0,0.04)',
    separator:   'rgba(0,0,0,0.06)',
    placeholder: palette.neutral300,

    success: '#059669',
    warning: '#D97706',
    error:   '#DC2626',
    info:    '#2563EB',

    playerBg: '#1A0458',
    tabBarBg: 'rgba(244, 242, 255, 0.92)',
  };
}

// ---- Theme Object ----
export interface Theme {
  colors: ColorScheme;
  typography: typeof typography;
  spacing: typeof spacing;
  radius: typeof radius;
  shadow: typeof shadow;
  animation: typeof animation;
  isDark: boolean;
}

// ---- Context ----
interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  accentColor: string;
  setMode: (mode: ThemeMode) => void;
  setAccentColor: (color: string) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY_MODE   = '@tracmusic/theme_mode';
const STORAGE_KEY_ACCENT = '@tracmusic/accent_color';
const DEFAULT_ACCENT     = palette.purple500;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState]             = useState<ThemeMode>('system');
  const [accentColor, setAccentState]    = useState(DEFAULT_ACCENT);

  // Load persisted preferences
  useEffect(() => {
    (async () => {
      try {
        const [savedMode, savedAccent] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEY_MODE),
          AsyncStorage.getItem(STORAGE_KEY_ACCENT),
        ]);
        if (savedMode) setModeState(savedMode as ThemeMode);
        if (savedAccent) setAccentState(savedAccent);
      } catch {
        // Ignore storage errors gracefully
      }
    })();
  }, []);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setModeState(newMode);
    try { await AsyncStorage.setItem(STORAGE_KEY_MODE, newMode); } catch {}
  }, []);

  const setAccentColor = useCallback(async (color: string) => {
    setAccentState(color);
    try { await AsyncStorage.setItem(STORAGE_KEY_ACCENT, color); } catch {}
  }, []);

  // Resolve actual dark/light
  const isDark =
    mode === 'dark' ||
    (mode === 'system' && systemScheme === 'dark');

  const colors = isDark
    ? buildDarkScheme(accentColor)
    : buildLightScheme(accentColor);

  const theme: Theme = {
    colors,
    typography,
    spacing,
    radius,
    shadow,
    animation,
    isDark,
  };

  return (
    <ThemeContext.Provider value={{ theme, mode, accentColor, setMode, setAccentColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
