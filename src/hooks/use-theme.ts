/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/context/theme-context';

export function useTheme() {
  return Colors[useColorScheme()];
}
