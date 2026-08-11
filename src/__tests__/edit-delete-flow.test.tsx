import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';

import WardrobeScreen from '@/app/index';
import { AppProviders } from '@/context/providers';
import { Garment } from '@/types/garment';

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

    await waitFor(() => expect(screen.getByTestId('wardrobe-tag-filter')).toBeOnTheScreen());
    const filterRow = screen.getByTestId('wardrobe-tag-filter');
    await waitFor(() => expect(filterRow).toBeOnTheScreen());
    expect(screen.getAllByText('lana').length).toBeGreaterThan(0);
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
