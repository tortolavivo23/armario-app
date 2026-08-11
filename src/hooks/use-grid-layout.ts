import { useWindowDimensions } from 'react-native';

import { MaxContentWidth, MinCardWidth, Spacing } from '@/constants/theme';

export const GridPadding = Spacing.four;
export const GridGap = Spacing.three;

/**
 * How many cards fit across, and how wide each one is.
 *
 * The width is worked out exactly rather than left to `flex`, so a lone card in
 * the last row does not stretch across it.
 */
export function useGridLayout() {
  const { width, height } = useWindowDimensions();

  const availableWidth = Math.min(width, MaxContentWidth) - GridPadding * 2;
  const numColumns = Math.max(2, Math.floor(availableWidth / MinCardWidth));
  const cardWidth = (availableWidth - GridGap * (numColumns - 1)) / numColumns;
  const isLandscape = width > height;

  return {
    width,
    height,
    isLandscape,
    numColumns,
    cardWidth,
    /** Shorter cards in landscape, where vertical space is scarce. */
    imageAspectRatio: isLandscape ? 3 / 2 : 1,
  };
}
