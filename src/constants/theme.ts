/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#F7F8FA',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#ECEEF1',
    textSecondary: '#697077',
    border: '#E3E6EA',
  },
  dark: {
    text: '#ECEDEE',
    background: '#0B0C0E',
    backgroundElement: '#17191C',
    backgroundSelected: '#24272B',
    textSecondary: '#9BA1A6',
    border: '#2A2E33',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Accent = '#208AEF';
export const AccentSoft = 'rgba(32, 138, 239, 0.12)';
export const Danger = '#E5484D';
export const DangerSoft = 'rgba(229, 72, 77, 0.12)';

export const Radius = {
  small: 10,
  medium: 14,
  large: 20,
  pill: 999,
} as const;

/**
 * Palette offered when colouring a tag. Picking from a fixed set instead of a
 * free colour picker keeps the wardrobe visually coherent, and every entry is
 * legible against both the light and the dark background.
 */
export const TagColors = [
  '#208AEF', // azul
  '#12A594', // verde azulado
  '#30A46C', // verde
  '#FFB224', // ámbar
  '#F76B15', // naranja
  '#E5484D', // rojo
  '#E93D82', // rosa
  '#8E4EC6', // morado
  '#5B5BD6', // índigo
  '#7C7C86', // gris
] as const;

export const DefaultTagColor = TagColors[9];

/** Translucent version of a tag colour, used as a chip background. */
export function tagTint(color: string, opacity = 0.14) {
  const hex = color.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const CardShadow = Platform.select({
  android: { elevation: 3 },
  default: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
}) as object;

/** Minimum card width used to decide how many grid columns fit. */
export const MinCardWidth = 165;
