import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import WardrobeScreen from '@/app/index';
import { AppProviders } from '@/context/providers';
import { Garment } from '@/types/garment';

const GARMENTS: Garment[] = [
  {
    id: '1',
    name: 'Camisa vaquera',
    imageUris: ['file:///documents/garments/1.jpg'],
    description: '',
    tags: ['casual', 'invierno'],
    wardrobeId: null,
    createdAt: 1_700_000_000_000,
  },
  {
    id: '2',
    name: 'Pantalón corto',
    imageUris: [],
    description: '',
    tags: ['verano'],
    wardrobeId: null,
    createdAt: 1_700_000_001_000,
  },
  {
    id: '3',
    name: 'Camiseta blanca',
    imageUris: [],
    description: '',
    tags: ['verano', 'casual'],
    wardrobeId: null,
    createdAt: 1_700_000_002_000,
  },
];

function renderScreen() {
  return render(
    <AppProviders>
      <WardrobeScreen />
    </AppProviders>,
  );
}

/** Opens the tag filter sheet and returns queries scoped to its chips. */
async function openTagFilter() {
  await fireEvent.press(screen.getByTestId('wardrobe-tag-filter-button'));
  return within(await screen.findByTestId('wardrobe-tag-filter'));
}

/** Opens the sheet, presses a chip and dismisses it, as a user would. */
async function pressTagFilter(tag: string) {
  const sheet = await openTagFilter();
  await fireEvent.press(sheet.getByText(tag));
  await fireEvent.press(screen.getByTestId('wardrobe-tag-filter-close'));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(GARMENTS));
});

describe('WardrobeScreen', () => {
  it('lists every stored garment', async () => {
    await renderScreen();

    expect(await screen.findByText('Camisa vaquera')).toBeOnTheScreen();
    expect(screen.getByText('Pantalón corto')).toBeOnTheScreen();
    expect(screen.getByText('Camiseta blanca')).toBeOnTheScreen();
  });

  it('filters garments by name as the user types', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await fireEvent.changeText(screen.getByTestId('wardrobe-search'), 'camis');

    await waitFor(() => expect(screen.queryByText('Pantalón corto')).not.toBeOnTheScreen());
    expect(screen.getByText('Camisa vaquera')).toBeOnTheScreen();
    expect(screen.getByText('Camiseta blanca')).toBeOnTheScreen();
  });

  it('matches names case-insensitively', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await fireEvent.changeText(screen.getByTestId('wardrobe-search'), 'PANTALÓN');

    await waitFor(() => expect(screen.queryByText('Camisa vaquera')).not.toBeOnTheScreen());
    expect(screen.getByText('Pantalón corto')).toBeOnTheScreen();
  });

  // Regression: the tag filter row was missing because it lived in a horizontal
  // ScrollView that collapsed to zero height.
  it('renders one filter chip per distinct tag', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    const sheet = await openTagFilter();

    expect(sheet.getByText('casual')).toBeOnTheScreen();
    expect(sheet.getByText('invierno')).toBeOnTheScreen();
    expect(sheet.getByText('verano')).toBeOnTheScreen();
    // 'casual' and 'verano' appear on two garments each but only once as a filter.
    expect(sheet.getAllByText('casual')).toHaveLength(1);
    expect(sheet.getAllByText('verano')).toHaveLength(1);
  });

  it('keeps the chips out of the header until the filter button is pressed', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    expect(screen.getByTestId('wardrobe-tag-filter-button')).toBeOnTheScreen();
    expect(screen.queryByTestId('wardrobe-tag-filter')).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('wardrobe-tag-filter-button'));

    expect(await screen.findByTestId('wardrobe-tag-filter')).toBeOnTheScreen();
  });

  it('counts the active filters on the button and drops them from the sheet', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await pressTagFilter('verano');
    await pressTagFilter('casual');

    expect(within(screen.getByTestId('wardrobe-tag-filter-button')).getByText('2')).toBeOnTheScreen();

    await openTagFilter();
    await fireEvent.press(screen.getByTestId('wardrobe-tag-filter-clear'));

    await waitFor(() => expect(screen.getByText('Camisa vaquera')).toBeOnTheScreen());
    expect(within(screen.getByTestId('wardrobe-tag-filter-button')).queryByText('2')).toBeNull();
  });

  it('filters garments by a selected tag', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await pressTagFilter('verano');

    await waitFor(() => expect(screen.queryByText('Camisa vaquera')).not.toBeOnTheScreen());
    expect(screen.getByText('Pantalón corto')).toBeOnTheScreen();
    expect(screen.getByText('Camiseta blanca')).toBeOnTheScreen();
  });

  it('combines multiple tags with AND, not OR', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await pressTagFilter('verano');
    await pressTagFilter('casual');

    // Only "Camiseta blanca" carries both tags.
    await waitFor(() => expect(screen.queryByText('Pantalón corto')).not.toBeOnTheScreen());
    expect(screen.getByText('Camiseta blanca')).toBeOnTheScreen();
    expect(screen.queryByText('Camisa vaquera')).not.toBeOnTheScreen();
  });

  it('combines the text search with tag filters', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await pressTagFilter('casual');
    await fireEvent.changeText(screen.getByTestId('wardrobe-search'), 'vaquera');

    await waitFor(() => expect(screen.queryByText('Camiseta blanca')).not.toBeOnTheScreen());
    expect(screen.getByText('Camisa vaquera')).toBeOnTheScreen();
  });

  it('shows an empty-results message and can clear the filters', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await fireEvent.changeText(screen.getByTestId('wardrobe-search'), 'no existe');

    expect(await screen.findByText('Sin resultados')).toBeOnTheScreen();

    await fireEvent.press(screen.getByTestId('wardrobe-clear-filters'));

    await waitFor(() => expect(screen.getByText('Camisa vaquera')).toBeOnTheScreen());
    expect(screen.queryByText('Sin resultados')).not.toBeOnTheScreen();
  });

  it('deselecting a tag restores the full list', async () => {
    await renderScreen();
    await screen.findByText('Camisa vaquera');

    await pressTagFilter('invierno');
    await waitFor(() => expect(screen.queryByText('Pantalón corto')).not.toBeOnTheScreen());

    await pressTagFilter('invierno');
    await waitFor(() => expect(screen.getByText('Pantalón corto')).toBeOnTheScreen());
  });
});

describe('WardrobeScreen with no garments', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('shows the onboarding empty state and hides the filters', async () => {
    await renderScreen();

    expect(await screen.findByText('Todavía no hay prendas')).toBeOnTheScreen();
    expect(screen.queryByTestId('wardrobe-search')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('wardrobe-tag-filter-button')).not.toBeOnTheScreen();
  });
});
