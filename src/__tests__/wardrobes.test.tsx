import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';

import WardrobeScreen from '@/app/index';
import { AppProviders } from '@/context/providers';
import { useWardrobe } from '@/context/wardrobe-context';
import { Garment } from '@/types/garment';
import { Wardrobe } from '@/types/wardrobe';

const WARDROBES: Wardrobe[] = [
  { id: 'w1', name: 'Invierno', createdAt: 1 },
  { id: 'w2', name: 'Verano', createdAt: 2 },
];

const GARMENTS: Garment[] = [
  {
    id: 'a',
    name: 'Abrigo',
    imageUris: [],
    description: '',
    tags: ['lana'],
    wardrobeId: 'w1',
    createdAt: 1,
  },
  {
    id: 'b',
    name: 'Bermudas',
    imageUris: [],
    description: '',
    tags: ['playa'],
    wardrobeId: 'w2',
    createdAt: 2,
  },
  {
    id: 'c',
    name: 'Calcetines',
    imageUris: [],
    description: '',
    tags: [],
    wardrobeId: null,
    createdAt: 3,
  },
];

async function seed({ garments = GARMENTS, wardrobes = WARDROBES, active = null } = {}) {
  await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(garments));
  await AsyncStorage.setItem('wardrobe-list', JSON.stringify(wardrobes));
  if (active) await AsyncStorage.setItem('wardrobe-active', active);
}

async function renderScreen() {
  await render(
    <AppProviders>
      <WardrobeScreen />
    </AppProviders>,
  );
  await waitFor(() => expect(screen.getByTestId('wardrobe-list')).toBeOnTheScreen());
}

async function renderContext() {
  const view = await renderHook(() => useWardrobe(), { wrapper: AppProviders });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

/** Opens the dropdown hanging off the screen title. */
async function openSwitcher() {
  await fireEvent.press(screen.getByTestId('wardrobe-switcher'));
  await screen.findByTestId('wardrobe-option-all');
}

/** Opens the wardrobe manager the way a user does: ⋯ menu -> "Gestionar armarios". */
async function openManager() {
  await fireEvent.press(screen.getByTestId('overflow-menu-button'));
  await fireEvent.press(await screen.findByTestId('menu-manage-wardrobes'));
  await screen.findByTestId('wardrobes-manager-close');
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('wardrobe storage', () => {
  it('creates a wardrobe and gives it back so the caller can switch to it', async () => {
    const { result } = await renderContext();

    let created: Wardrobe | undefined;
    await act(async () => {
      created = result.current.addWardrobe('Invierno');
    });

    expect(created?.name).toBe('Invierno');
    expect(result.current.wardrobes).toHaveLength(1);
  });

  it('renames a wardrobe without touching its garments', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.renameWardrobe('w1', 'Invierno 2026');
    });

    expect(result.current.wardrobes.find((w) => w.id === 'w1')?.name).toBe('Invierno 2026');
    expect(result.current.garments.find((g) => g.id === 'a')?.wardrobeId).toBe('w1');
  });

  it('ignores a rename to a blank name', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.renameWardrobe('w1', '   ');
    });

    expect(result.current.wardrobes.find((w) => w.id === 'w1')?.name).toBe('Invierno');
  });

  it('Regression: deleting a wardrobe keeps its garments, only unfiling them', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.removeWardrobe('w1');
    });

    expect(result.current.wardrobes.map((w) => w.id)).toEqual(['w2']);
    expect(result.current.garments).toHaveLength(3);
    expect(result.current.garments.find((g) => g.id === 'a')?.wardrobeId).toBeNull();
    // The other wardrobe's garments are left alone.
    expect(result.current.garments.find((g) => g.id === 'b')?.wardrobeId).toBe('w2');
  });

  it('Regression: deleting the wardrobe being viewed falls back to Todos', async () => {
    await seed({ active: 'w1' });
    const { result } = await renderContext();
    expect(result.current.activeWardrobe).toBe('w1');

    await act(async () => {
      result.current.removeWardrobe('w1');
    });

    expect(result.current.activeWardrobe).toBe('all');
  });

  it('leaves the view alone when another wardrobe is deleted', async () => {
    await seed({ active: 'w2' });
    const { result } = await renderContext();

    await act(async () => {
      result.current.removeWardrobe('w1');
    });

    expect(result.current.activeWardrobe).toBe('w2');
  });

  it('moves a garment between wardrobes', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.moveGarment('a', 'w2');
    });

    expect(result.current.garments.find((g) => g.id === 'a')?.wardrobeId).toBe('w2');
  });

  it('unfiles a garment', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.moveGarment('a', null);
    });

    expect(result.current.garments.find((g) => g.id === 'a')?.wardrobeId).toBeNull();
  });

  it('persists the wardrobes and the active one', async () => {
    const { result } = await renderContext();

    await act(async () => {
      const created = result.current.addWardrobe('Invierno');
      result.current.setActiveWardrobe(created.id);
    });

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('wardrobe-list');
      expect(JSON.parse(raw ?? '[]')).toHaveLength(1);
      expect(await AsyncStorage.getItem('wardrobe-active')).toBe(result.current.wardrobes[0].id);
    });
  });

  it('restores the wardrobe you were looking at', async () => {
    await seed({ active: 'w2' });
    const { result } = await renderContext();

    expect(result.current.activeWardrobe).toBe('w2');
  });

  it('Regression: a stored wardrobe that no longer exists falls back to Todos', async () => {
    await seed({ wardrobes: [], active: 'w1' });
    const { result } = await renderContext();

    expect(result.current.activeWardrobe).toBe('all');
  });

  it('Regression: garments saved before wardrobes existed load as unfiled', async () => {
    await AsyncStorage.setItem(
      'wardrobe-garments',
      JSON.stringify([{ id: 'old', name: 'Camisa', imageUri: null, tags: [], createdAt: 1 }]),
    );
    const { result } = await renderContext();

    expect(result.current.garments[0]).toMatchObject({ name: 'Camisa', wardrobeId: null });
  });
});

describe('switching wardrobes from the title', () => {
  it('shows every garment under Todos', async () => {
    await seed();
    await renderScreen();

    expect(await screen.findByText('Abrigo')).toBeOnTheScreen();
    expect(screen.getByText('Bermudas')).toBeOnTheScreen();
    expect(screen.getByText('Calcetines')).toBeOnTheScreen();
  });

  it('lists Todos first, then the unfiled bucket, then the wardrobes', async () => {
    await seed();
    await renderScreen();
    await openSwitcher();

    expect(screen.getByTestId('wardrobe-option-all')).toBeOnTheScreen();
    expect(screen.getByTestId('wardrobe-option-unfiled')).toBeOnTheScreen();
    expect(screen.getByTestId('wardrobe-option-w1')).toBeOnTheScreen();
    expect(screen.getByTestId('wardrobe-option-w2')).toBeOnTheScreen();
  });

  it('hides the unfiled bucket when there are no wardrobes at all', async () => {
    await seed({ wardrobes: [] });
    await renderScreen();
    await openSwitcher();

    expect(screen.queryByTestId('wardrobe-option-unfiled')).not.toBeOnTheScreen();
  });

  it('shows only that wardrobe once one is picked', async () => {
    await seed();
    await renderScreen();
    await openSwitcher();

    await fireEvent.press(screen.getByTestId('wardrobe-option-w1'));

    await waitFor(() => expect(screen.queryByText('Bermudas')).not.toBeOnTheScreen());
    expect(screen.getByText('Abrigo')).toBeOnTheScreen();
    expect(screen.queryByText('Calcetines')).not.toBeOnTheScreen();
  });

  it('puts the wardrobe name in the title', async () => {
    await seed();
    await renderScreen();
    await openSwitcher();

    await fireEvent.press(screen.getByTestId('wardrobe-option-w1'));

    await waitFor(() =>
      expect(within(screen.getByTestId('wardrobe-switcher')).getByText('Invierno')).toBeOnTheScreen(),
    );
  });

  it('shows only the unfiled garments under Sin armario', async () => {
    await seed();
    await renderScreen();
    await openSwitcher();

    await fireEvent.press(screen.getByTestId('wardrobe-option-unfiled'));

    await waitFor(() => expect(screen.queryByText('Abrigo')).not.toBeOnTheScreen());
    expect(screen.getByText('Calcetines')).toBeOnTheScreen();
  });

  it('narrows the tag filter to the tags of the wardrobe in view', async () => {
    await seed();
    await renderScreen();
    await openSwitcher();

    await fireEvent.press(screen.getByTestId('wardrobe-option-w1'));

    await waitFor(() => expect(screen.getByTestId('wardrobe-tag-filter')).toBeOnTheScreen());
    const filter = within(screen.getByTestId('wardrobe-tag-filter'));
    expect(filter.getByText('lana')).toBeOnTheScreen();
    expect(filter.queryByText('playa')).not.toBeOnTheScreen();
  });

  it('says the wardrobe is empty rather than that there are no garments', async () => {
    await seed({ garments: [GARMENTS[1]] });
    await renderScreen();
    await openSwitcher();

    await fireEvent.press(screen.getByTestId('wardrobe-option-w1'));

    expect(await screen.findByText('Este armario está vacío')).toBeOnTheScreen();
  });

  it('creates a wardrobe from the dropdown and switches to it', async () => {
    await seed({ wardrobes: [] });
    await renderScreen();
    await openSwitcher();

    await fireEvent.press(screen.getByTestId('wardrobe-add'));
    await fireEvent.changeText(await screen.findByTestId('wardrobe-create-input'), 'Trabajo');
    await fireEvent.press(screen.getByTestId('wardrobe-create-submit'));

    await waitFor(() =>
      expect(within(screen.getByTestId('wardrobe-switcher')).getByText('Trabajo')).toBeOnTheScreen(),
    );
  });

  it('closes without changing anything when the backdrop is tapped', async () => {
    await seed();
    await renderScreen();
    await openSwitcher();

    await fireEvent.press(screen.getByTestId('wardrobe-switcher-backdrop'));

    await waitFor(() => expect(screen.queryByTestId('wardrobe-option-w1')).not.toBeOnTheScreen());
    expect(screen.getByText('Bermudas')).toBeOnTheScreen();
  });
});

describe('managing wardrobes from the ⋯ menu', () => {
  it('lists the wardrobes with how many garments each holds', async () => {
    await seed();
    await renderScreen();
    await openManager();

    const manager = within(screen.getByTestId('wardrobes-manager'));
    expect(manager.getByText('Invierno')).toBeOnTheScreen();
    expect(manager.getByText('Verano')).toBeOnTheScreen();
    expect(manager.getAllByText('1 prenda')).toHaveLength(2);
  });

  it('shows the onboarding state when there are none', async () => {
    await seed({ wardrobes: [] });
    await renderScreen();
    await openManager();

    expect(screen.getByText('Todavía no hay armarios')).toBeOnTheScreen();
  });

  it('renames one', async () => {
    await seed();
    await renderScreen();
    await openManager();

    await fireEvent.press(screen.getByTestId('wardrobes-manager-rename-w1'));
    await fireEvent.changeText(await screen.findByTestId('wardrobe-rename-input'), 'Invierno 2026');
    await fireEvent.press(screen.getByTestId('wardrobe-rename-submit'));

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('wardrobe-list');
      expect(JSON.parse(raw ?? '[]')[0].name).toBe('Invierno 2026');
    });
  });

  it('pre-fills the rename dialog with the current name', async () => {
    await seed();
    await renderScreen();
    await openManager();

    await fireEvent.press(screen.getByTestId('wardrobes-manager-rename-w2'));

    expect(await screen.findByTestId('wardrobe-rename-input')).toHaveProp('value', 'Verano');
  });

  it('warns how many garments a deletion affects', async () => {
    await seed();
    await renderScreen();
    await openManager();

    await fireEvent.press(screen.getByTestId('wardrobes-manager-delete-w1'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar armario',
      expect.stringContaining('Su prenda seguirá en tu armario, sin asignar.'),
      expect.any(Array),
    );
  });

  it('deletes it once confirmed, and the garment survives unfiled', async () => {
    await seed();
    await renderScreen();
    await openManager();

    await fireEvent.press(screen.getByTestId('wardrobes-manager-delete-w1'));
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
    await act(async () => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });

    await waitFor(() =>
      expect(screen.queryByTestId('wardrobes-manager-item-w1')).not.toBeOnTheScreen(),
    );
    const raw = await AsyncStorage.getItem('wardrobe-garments');
    const stored: Garment[] = JSON.parse(raw ?? '[]');
    expect(stored.find((g) => g.id === 'a')).toMatchObject({ name: 'Abrigo', wardrobeId: null });
  });

  it('keeps it when the confirmation is dismissed', async () => {
    await seed();
    await renderScreen();
    await openManager();

    await fireEvent.press(screen.getByTestId('wardrobes-manager-delete-w1'));
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
    buttons?.find((button) => button.style === 'cancel')?.onPress?.();

    expect(screen.getByTestId('wardrobes-manager-item-w1')).toBeOnTheScreen();
  });

  it('creates one from the manager too', async () => {
    await seed({ wardrobes: [] });
    await renderScreen();
    await openManager();

    await fireEvent.press(screen.getByTestId('wardrobes-manager-add'));
    await fireEvent.changeText(await screen.findByTestId('wardrobe-create-input'), 'Trabajo');
    await fireEvent.press(screen.getByTestId('wardrobe-create-submit'));

    expect(await screen.findByText('Trabajo')).toBeOnTheScreen();
  });
});
