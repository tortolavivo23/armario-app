import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, waitFor } from '@testing-library/react-native';
import { Dimensions, StyleSheet } from 'react-native';

import WardrobeScreen from '@/app/index';
import { MaxContentWidth, MinCardWidth, Spacing } from '@/constants/theme';
import { WardrobeProvider } from '@/context/wardrobe-context';
import { Garment } from '@/types/garment';

const GRID_PADDING = Spacing.four;
const GRID_GAP = Spacing.three;

function makeGarments(count: number): Garment[] {
  return Array.from({ length: count }, (_, index) => ({
    id: String(index),
    name: `Prenda ${index}`,
    imageUri: null,
    tags: [],
    createdAt: index,
  }));
}

function mockScreenSize(width: number, height: number) {
  jest
    .spyOn(Dimensions, 'get')
    .mockReturnValue({ width, height, scale: 2, fontScale: 1 } as never);
}

/** Reads the resolved `width` of the card wrapping a given garment name. */
function cardWidthFor(name: string) {
  // Pressable (card root) -> ThemedView -> ... -> Text with the garment name.
  const card = screen.getByText(name).parent?.parent?.parent;
  const style = StyleSheet.flatten(card?.props.style);
  return style?.width as number | undefined;
}

async function renderWardrobe(garments: Garment[]) {
  await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(garments));
  await render(
    <WardrobeProvider>
      <WardrobeScreen />
    </WardrobeProvider>,
  );
  await waitFor(() => expect(screen.getByText(garments[0].name)).toBeOnTheScreen());
}

function expectedLayout(screenWidth: number) {
  const available = Math.min(screenWidth, MaxContentWidth) - GRID_PADDING * 2;
  const columns = Math.max(2, Math.floor(available / MinCardWidth));
  const cardWidth = (available - GRID_GAP * (columns - 1)) / columns;
  return { available, columns, cardWidth };
}

beforeEach(async () => {
  jest.restoreAllMocks();
  await AsyncStorage.clear();
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('responsive garment grid', () => {
  // Regression: a single card used to stretch across the whole row because the
  // card style was `flex: 1` instead of an explicit width.
  it('gives a lone card the same width as a full row of cards', async () => {
    mockScreenSize(412, 915);
    const { cardWidth } = expectedLayout(412);

    await renderWardrobe(makeGarments(1));

    expect(cardWidthFor('Prenda 0')).toBeCloseTo(cardWidth, 5);
  });

  it('never lets a card fill the whole content width', async () => {
    mockScreenSize(412, 915);
    const { available } = expectedLayout(412);

    await renderWardrobe(makeGarments(3));

    expect(cardWidthFor('Prenda 0')).toBeLessThan(available);
  });

  it('uses two columns on a portrait phone', async () => {
    mockScreenSize(412, 915);
    const { columns } = expectedLayout(412);

    expect(columns).toBe(2);

    await renderWardrobe(makeGarments(4));
    expect(cardWidthFor('Prenda 0')).toBeCloseTo(expectedLayout(412).cardWidth, 5);
  });

  it('adds columns when the device is rotated to landscape', async () => {
    const portrait = expectedLayout(412);
    const landscape = expectedLayout(915);

    expect(landscape.columns).toBeGreaterThan(portrait.columns);

    mockScreenSize(915, 412);
    await renderWardrobe(makeGarments(6));

    expect(cardWidthFor('Prenda 0')).toBeCloseTo(landscape.cardWidth, 5);
  });

  it('caps the content width on very wide screens', async () => {
    const wide = expectedLayout(2000);

    expect(wide.available).toBe(MaxContentWidth - GRID_PADDING * 2);
  });

  it('keeps every card at least the minimum readable width', async () => {
    for (const width of [360, 412, 600, 800, 915, 1280]) {
      const { cardWidth } = expectedLayout(width);
      expect(cardWidth).toBeGreaterThanOrEqual(120);
    }
  });

  it('makes the columns and gaps add up to the available width', () => {
    for (const width of [360, 412, 600, 800, 915, 1280]) {
      const { available, columns, cardWidth } = expectedLayout(width);
      const total = cardWidth * columns + GRID_GAP * (columns - 1);
      expect(total).toBeCloseTo(available, 5);
    }
  });
});
