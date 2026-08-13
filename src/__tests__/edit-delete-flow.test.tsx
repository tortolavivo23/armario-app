import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';

import WardrobeScreen from '@/app/index';
import { AppProviders } from '@/context/providers';
import { Garment } from '@/types/garment';
import { Outfit } from '@/types/outfit';

const GARMENTS: Garment[] = [
  {
    id: 'a',
    name: 'Camisa vaquera',
    imageUris: ['file:///documents/garments/a.jpg'],
    description: '',
    tags: ['casual'],
    wardrobeId: null,
    createdAt: 1_700_000_000_000,
  },
  {
    id: 'b',
    name: 'Bufanda',
    imageUris: [],
    description: '',
    tags: [],
    wardrobeId: null,
    createdAt: 1_700_000_001_000,
  },
];

async function renderWardrobe() {
  await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(GARMENTS));
  await render(
    <AppProviders>
      <WardrobeScreen />
    </AppProviders>,
  );
  await screen.findByText('Camisa vaquera');
}

/** Opens the detail modal for a garment by tapping its card. */
async function openDetail(name: string) {
  await fireEvent.press(screen.getByText(name));
  await screen.findByTestId('garment-detail-edit');
}

/** Presses "Eliminar" and then runs the destructive button of the confirmation Alert. */
async function confirmDeleteAlert() {
  await fireEvent.press(screen.getByTestId('garment-detail-delete'));
  const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
  buttons?.find((button) => button.style === 'destructive')?.onPress?.();
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('garment detail modal', () => {
  it('opens with the garment name and its tags', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');

    expect(screen.getByTestId('garment-detail-edit')).toBeOnTheScreen();
    expect(screen.getAllByText('casual').length).toBeGreaterThan(0);
  });

  it('says so when a garment has no tags', async () => {
    await renderWardrobe();
    await openDetail('Bufanda');

    expect(screen.getByText('Esta prenda no tiene etiquetas.')).toBeOnTheScreen();
  });

  it('closes without changing anything', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');

    await fireEvent.press(screen.getByTestId('garment-detail-close'));

    await waitFor(() => expect(screen.queryByTestId('garment-detail-edit')).not.toBeOnTheScreen());
    expect(screen.getByText('Camisa vaquera')).toBeOnTheScreen();
  });
});

describe('editing an existing garment', () => {
  it('opens the edit form pre-filled with the garment', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');

    await fireEvent.press(screen.getByTestId('garment-detail-edit'));

    const nameInput = await screen.findByTestId('garment-form-name');
    expect(nameInput.props.value).toBe('Camisa vaquera');
  });

  it('saves a new name and shows it in the list', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');
    await fireEvent.press(screen.getByTestId('garment-detail-edit'));
    await screen.findByTestId('garment-form-name');

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Camisa azul');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(screen.getByText('Camisa azul')).toBeOnTheScreen());
    expect(screen.queryByText('Camisa vaquera')).not.toBeOnTheScreen();
  });

  it('persists the edit to AsyncStorage', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');
    await fireEvent.press(screen.getByTestId('garment-detail-edit'));
    await screen.findByTestId('garment-form-name');

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Camisa azul');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('wardrobe-garments');
      const stored: Garment[] = JSON.parse(raw ?? '[]');
      expect(stored.find((g) => g.id === 'a')?.name).toBe('Camisa azul');
    });
  });

  it('adds a tag to an existing garment and exposes it as a filter', async () => {
    await renderWardrobe();
    await openDetail('Bufanda');
    await fireEvent.press(screen.getByTestId('garment-detail-edit'));
    await screen.findByTestId('garment-form-tag-input');

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'lana');
    await fireEvent(screen.getByTestId('garment-form-tag-input'), 'submitEditing');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(screen.getByTestId('wardrobe-tag-filter-button')).toBeOnTheScreen());
    await fireEvent.press(screen.getByTestId('wardrobe-tag-filter-button'));

    const sheet = within(await screen.findByTestId('wardrobe-tag-filter'));
    expect(sheet.getByText('lana')).toBeOnTheScreen();
  });

  it('closes the edit form without saving when cancelled', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');
    await fireEvent.press(screen.getByTestId('garment-detail-edit'));
    await screen.findByTestId('garment-form-name');

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Nombre descartado');
    await fireEvent.press(screen.getByTestId('garment-form-cancel'));

    await waitFor(() => expect(screen.queryByTestId('garment-form-name')).not.toBeOnTheScreen());
    expect(screen.getByText('Camisa vaquera')).toBeOnTheScreen();
    expect(screen.queryByText('Nombre descartado')).not.toBeOnTheScreen();
  });
});

describe('deleting a garment', () => {
  it('asks for confirmation before deleting', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');

    await fireEvent.press(screen.getByTestId('garment-detail-delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar prenda',
      expect.stringContaining('Camisa vaquera'),
      expect.any(Array),
    );
  });

  it('removes the garment once the deletion is confirmed', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');
    await confirmDeleteAlert();

    await waitFor(() => expect(screen.queryByText('Camisa vaquera')).not.toBeOnTheScreen());
    expect(screen.getByText('Bufanda')).toBeOnTheScreen();
  });

  it('keeps the garment when the confirmation is dismissed', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');

    await fireEvent.press(screen.getByTestId('garment-detail-delete'));
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
    buttons?.find((button) => button.style === 'cancel')?.onPress?.();

    // The name shows both on the card and in the still-open detail modal.
    expect(screen.getAllByText('Camisa vaquera').length).toBeGreaterThan(0);
    expect(screen.getByTestId('garment-detail-delete')).toBeOnTheScreen();
  });
});

describe('the outfits a garment appears in', () => {
  const OUTFITS: Outfit[] = [
    {
      id: 'o1',
      name: 'Domingo de terraza',
      garmentIds: ['a', 'b'],
      description: '',
      tags: [],
      createdAt: 1,
    },
    { id: 'o2', name: 'Reunión de oficina', garmentIds: ['a'], description: '', tags: [], createdAt: 2 },
  ];

  async function renderWithOutfits() {
    await AsyncStorage.setItem('wardrobe-outfits', JSON.stringify(OUTFITS));
    await renderWardrobe();
  }

  it('lists them in the detail view', async () => {
    await renderWithOutfits();
    await openDetail('Camisa vaquera');

    const section = within(await screen.findByTestId('garment-detail-outfits'));
    expect(section.getByText('Domingo de terraza')).toBeOnTheScreen();
    expect(section.getByText('Reunión de oficina')).toBeOnTheScreen();
  });

  it('leaves the section out for a garment no outfit wears', async () => {
    // Only 'a' is worn here, so 'b' has nothing to show.
    await AsyncStorage.setItem(
      'wardrobe-outfits',
      JSON.stringify([{ ...OUTFITS[1], garmentIds: ['a'] }]),
    );
    await renderWardrobe();
    await openDetail('Bufanda');

    expect(screen.queryByTestId('garment-detail-outfits')).not.toBeOnTheScreen();
  });

  // Deleting a garment quietly pulled it out of the outfits wearing it.
  it('counts them in the delete confirmation', async () => {
    await renderWithOutfits();
    await openDetail('Camisa vaquera');

    await fireEvent.press(screen.getByTestId('garment-detail-delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar prenda',
      expect.stringContaining('Se quitará de 2 outfits.'),
      expect.any(Array),
    );
  });

  it('names the outfit when there is only one', async () => {
    await renderWithOutfits();
    await openDetail('Bufanda');

    await fireEvent.press(screen.getByTestId('garment-detail-delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar prenda',
      expect.stringContaining('Se quitará del outfit «Domingo de terraza».'),
      expect.any(Array),
    );
  });

  it('says nothing extra when no outfit wears it', async () => {
    await renderWardrobe();
    await openDetail('Camisa vaquera');

    await fireEvent.press(screen.getByTestId('garment-detail-delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar prenda',
      '¿Seguro que quieres eliminar "Camisa vaquera"?',
      expect.any(Array),
    );
  });
});
