import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';

import WardrobeScreen from '@/app/index';
import { WardrobeProvider } from '@/context/wardrobe-context';
import { Garment } from '@/types/garment';

const GARMENTS: Garment[] = [
  {
    id: '1',
    name: 'Camisa vaquera',
    imageUris: ['file:///documents/garments/1.jpg'],
    description: '',
    tags: ['casual', 'invierno'],
    createdAt: 1_700_000_000_000,
  },
  {
    id: '2',
    name: 'Pantalón corto',
    imageUris: [],
    description: '',
    tags: ['verano'],
    createdAt: 1_700_000_001_000,
  },
  {
    id: '3',
    name: 'Camiseta blanca',
    imageUris: [],
    description: '',
    tags: ['verano', 'casual'],
    createdAt: 1_700_000_002_000,
  },
];

function renderScreen() {
  return render(
    <WardrobeProvider>
      <WardrobeScreen />
    </WardrobeProvider>,
  );
}

/** Presses a chip inside the tag filter row (tag names also appear on the cards). */
async function pressTagFilter(tag: string) {
  const filterRow = screen.getByTestId('wardrobe-tag-filter');
  await fireEvent.press(within(filterRow).getByText(tag));
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

    const filterRow = screen.getByTestId('wardrobe-tag-filter');

    expect(within(filterRow).getByText('casual')).toBeOnTheScreen();
    expect(within(filterRow).getByText('invierno')).toBeOnTheScreen();
    expect(within(filterRow).getByText('verano')).toBeOnTheScreen();
    // 'casual' and 'verano' appear on two garments each but only once as a filter.
    expect(within(filterRow).getAllByText('casual')).toHaveLength(1);
    expect(within(filterRow).getAllByText('verano')).toHaveLength(1);
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
    expect(screen.queryByTestId('wardrobe-tag-filter')).not.toBeOnTheScreen();
  });
});
