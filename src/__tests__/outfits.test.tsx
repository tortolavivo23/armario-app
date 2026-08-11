import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react-native';
import { Alert } from 'react-native';

import OutfitsScreen from '@/app/outfits';
import { TagColors } from '@/constants/theme';
import { AppProviders } from '@/context/providers';
import { useWardrobe } from '@/context/wardrobe-context';
import { Garment } from '@/types/garment';
import { Outfit } from '@/types/outfit';
import { Tag } from '@/types/tag';

const GARMENTS: Garment[] = [
  {
    id: 'a',
    name: 'Camisa vaquera',
    imageUris: ['file:///documents/garments/a.jpg'],
    description: '',
    tags: ['camisa'],
    createdAt: 1,
  },
  {
    id: 'b',
    name: 'Pantalón corto',
    imageUris: [],
    description: '',
    tags: ['verano'],
    createdAt: 2,
  },
  {
    id: 'c',
    name: 'Zapatillas',
    imageUris: [],
    description: '',
    tags: [],
    createdAt: 3,
  },
];

const OUTFITS: Outfit[] = [
  {
    id: 'o1',
    name: 'Domingo de terraza',
    garmentIds: ['a', 'b'],
    description: 'Para cuando aprieta el calor.',
    tags: ['verano', 'casual'],
    createdAt: 1_700_000_000_000,
  },
  {
    id: 'o2',
    name: 'Reunión de oficina',
    garmentIds: ['a'],
    description: '',
    tags: ['trabajo'],
    createdAt: 1_700_000_001_000,
  },
];

const TAGS: Tag[] = [
  { name: 'verano', group: 'estación', color: TagColors[3] },
  { name: 'casual', group: 'ocasión', color: TagColors[1] },
  { name: 'trabajo', group: 'ocasión', color: TagColors[7] },
];

async function seed({ outfits = OUTFITS, garments = GARMENTS, tags = TAGS } = {}) {
  await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(garments));
  await AsyncStorage.setItem('wardrobe-outfits', JSON.stringify(outfits));
  await AsyncStorage.setItem('wardrobe-tags', JSON.stringify(tags));
}

async function renderScreen() {
  await render(
    <AppProviders>
      <OutfitsScreen />
    </AppProviders>,
  );
  await waitFor(() => expect(screen.getByTestId('outfits-list')).toBeOnTheScreen());
}

async function renderContext() {
  const view = await renderHook(() => useWardrobe(), { wrapper: AppProviders });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

/** Opens the detail modal of an outfit by tapping its card. */
async function openDetail(name: string) {
  await fireEvent.press(screen.getByText(name));
  await screen.findByTestId('outfit-detail-edit');
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('outfit storage', () => {
  it('saves an outfit with its garments, description and tags', async () => {
    await seed({ outfits: [] });
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addOutfit({
        name: 'Boda',
        garmentIds: ['a', 'c'],
        description: 'Con la americana azul.',
        tags: ['formal'],
      });
    });

    const outfit = result.current.outfits.find((o) => o.name === 'Boda');
    expect(outfit).toMatchObject({
      name: 'Boda',
      garmentIds: ['a', 'c'],
      description: 'Con la americana azul.',
      tags: ['formal'],
    });
  });

  it('Regression: never stores the same garment twice in one outfit', async () => {
    await seed({ outfits: [] });
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addOutfit({
        name: 'Repetida',
        garmentIds: ['a', 'b', 'a'],
        description: '',
        tags: [],
      });
    });

    expect(result.current.outfits[0].garmentIds).toEqual(['a', 'b']);
  });

  it('lets one garment belong to several outfits', async () => {
    await seed();
    const { result } = await renderContext();

    const wearingA = result.current.outfits.filter((o) => o.garmentIds.includes('a'));
    expect(wearingA.map((o) => o.id)).toEqual(['o1', 'o2']);
  });

  it('updates an outfit and still drops repeated garments', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      await result.current.updateOutfit('o1', {
        name: 'Domingo de playa',
        garmentIds: ['b', 'c', 'b'],
        description: 'Nueva nota.',
        tags: ['verano'],
      });
    });

    expect(result.current.outfits.find((o) => o.id === 'o1')).toMatchObject({
      name: 'Domingo de playa',
      garmentIds: ['b', 'c'],
      description: 'Nueva nota.',
      tags: ['verano'],
    });
  });

  it('removes an outfit without touching the garments', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      await result.current.removeOutfit('o1');
    });

    expect(result.current.outfits.map((o) => o.id)).toEqual(['o2']);
    expect(result.current.garments).toHaveLength(3);
  });

  it('Regression: drops a deleted garment from the outfits wearing it', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      await result.current.removeGarment('a');
    });

    expect(result.current.outfits.find((o) => o.id === 'o1')?.garmentIds).toEqual(['b']);
    expect(result.current.outfits.find((o) => o.id === 'o2')?.garmentIds).toEqual([]);
  });

  it('persists outfits under their own storage key', async () => {
    await seed({ outfits: [] });
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addOutfit({
        name: 'Boda',
        garmentIds: ['a'],
        description: '',
        tags: [],
      });
    });

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('wardrobe-outfits');
      expect(JSON.parse(raw ?? '[]')).toHaveLength(1);
    });
  });

  it('restores the stored outfits on load', async () => {
    await seed();
    const { result } = await renderContext();

    expect(result.current.outfits.map((o) => o.name)).toEqual([
      'Domingo de terraza',
      'Reunión de oficina',
    ]);
  });

  it('starts with no outfits when nothing was ever saved', async () => {
    const { result } = await renderContext();

    expect(result.current.outfits).toEqual([]);
  });

  it('registers the tags of an outfit in the shared catalogue', async () => {
    await seed({ outfits: [], tags: [] });
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addOutfit({
        name: 'Boda',
        garmentIds: ['a'],
        description: '',
        tags: ['formal'],
      });
    });

    expect(result.current.tags.map((tag) => tag.name)).toContain('formal');
    expect(result.current.getTag('formal').color).toBe(TagColors[0]);
  });
});

describe('outfits screen', () => {
  it('lists the saved outfits with how many garments each one has', async () => {
    await seed();
    await renderScreen();

    expect(await screen.findByText('Domingo de terraza')).toBeOnTheScreen();
    expect(screen.getByText('Reunión de oficina')).toBeOnTheScreen();
    expect(screen.getByText('2 prendas')).toBeOnTheScreen();
    expect(screen.getByText('1 prenda')).toBeOnTheScreen();
  });

  it('invites you to create one when there are none', async () => {
    await seed({ outfits: [] });
    await renderScreen();

    expect(await screen.findByText('Todavía no hay outfits')).toBeOnTheScreen();
  });

  it('points at the wardrobe when there are not even garments', async () => {
    await seed({ outfits: [], garments: [] });
    await renderScreen();

    expect(
      await screen.findByText(/Añade alguna prenda para empezar/),
    ).toBeOnTheScreen();
  });

  it('filters by name', async () => {
    await seed();
    await renderScreen();
    await screen.findByText('Domingo de terraza');

    await fireEvent.changeText(screen.getByTestId('outfits-search'), 'oficina');

    await waitFor(() => expect(screen.queryByText('Domingo de terraza')).not.toBeOnTheScreen());
    expect(screen.getByText('Reunión de oficina')).toBeOnTheScreen();
  });

  it('filters by tag, grouped under its heading', async () => {
    await seed();
    await renderScreen();
    await screen.findByText('Domingo de terraza');

    const filter = screen.getByTestId('outfits-tag-filter');
    expect(within(filter).getByText('ESTACIÓN')).toBeOnTheScreen();
    await fireEvent.press(within(filter).getByText('trabajo'));

    await waitFor(() => expect(screen.queryByText('Domingo de terraza')).not.toBeOnTheScreen());
    expect(screen.getByText('Reunión de oficina')).toBeOnTheScreen();
  });

  it('clears the filters again', async () => {
    await seed();
    await renderScreen();
    await screen.findByText('Domingo de terraza');

    await fireEvent.changeText(screen.getByTestId('outfits-search'), 'oficina');
    await waitFor(() => expect(screen.getByTestId('outfits-clear-filters')).toBeOnTheScreen());
    await fireEvent.press(screen.getByTestId('outfits-clear-filters'));

    await waitFor(() => expect(screen.getByText('Domingo de terraza')).toBeOnTheScreen());
  });

  it('says so when nothing matches', async () => {
    await seed();
    await renderScreen();
    await screen.findByText('Domingo de terraza');

    await fireEvent.changeText(screen.getByTestId('outfits-search'), 'esquí');

    expect(await screen.findByText('Sin resultados')).toBeOnTheScreen();
  });
});

describe('outfit detail', () => {
  it('shows the description, the garments and the tags', async () => {
    await seed();
    await renderScreen();
    await openDetail('Domingo de terraza');

    const detail = within(screen.getByTestId('outfit-detail'));
    expect(detail.getByTestId('outfit-detail-description')).toHaveTextContent(
      'Para cuando aprieta el calor.',
    );
    expect(detail.getByTestId('outfit-detail-garment-a')).toBeOnTheScreen();
    expect(detail.getByTestId('outfit-detail-garment-b')).toBeOnTheScreen();
    expect(detail.getByText('PRENDAS (2)')).toBeOnTheScreen();
  });

  it('hides the description block when the outfit has none', async () => {
    await seed();
    await renderScreen();
    await openDetail('Reunión de oficina');

    expect(screen.queryByTestId('outfit-detail-description')).not.toBeOnTheScreen();
  });

  it('opens one of its garments without leaving the tab', async () => {
    await seed();
    await renderScreen();
    await openDetail('Domingo de terraza');

    await fireEvent.press(screen.getByTestId('outfit-detail-garment-a'));

    expect(await screen.findByTestId('garment-detail-edit')).toBeOnTheScreen();
  });

  it('asks for confirmation before deleting and keeps the garments', async () => {
    await seed();
    await renderScreen();
    await openDetail('Domingo de terraza');

    await fireEvent.press(screen.getByTestId('outfit-detail-delete'));

    expect(Alert.alert).toHaveBeenCalledWith(
      'Eliminar outfit',
      expect.stringContaining('Domingo de terraza'),
      expect.any(Array),
    );

    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
    await act(async () => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });

    await waitFor(() => expect(screen.queryByText('Domingo de terraza')).not.toBeOnTheScreen());
    const raw = await AsyncStorage.getItem('wardrobe-garments');
    expect(JSON.parse(raw ?? '[]')).toHaveLength(3);
  });
});

describe('creating an outfit', () => {
  it('opens an empty form from the header button', async () => {
    await seed({ outfits: [] });
    await renderScreen();

    await fireEvent.press(screen.getByTestId('outfits-new'));

    expect(await screen.findByTestId('outfit-form-name')).toHaveProp('value', '');
    expect(screen.getByTestId('outfit-form-garment-count')).toHaveTextContent('0 seleccionadas');
  });

  it('refuses to save without a garment', async () => {
    await seed({ outfits: [] });
    await renderScreen();
    await fireEvent.press(screen.getByTestId('outfits-new'));
    await screen.findByTestId('outfit-form-name');

    await fireEvent.changeText(screen.getByTestId('outfit-form-name'), 'Sin prendas');

    expect(screen.getByTestId('outfit-form-hint')).toBeOnTheScreen();
    expect(screen.getByTestId('outfit-form-submit')).toBeDisabled();
  });

  it('saves a new outfit and shows it in the list', async () => {
    await seed({ outfits: [] });
    await renderScreen();
    await fireEvent.press(screen.getByTestId('outfits-new'));
    await screen.findByTestId('outfit-form-name');

    await fireEvent.changeText(screen.getByTestId('outfit-form-name'), 'Finde en el pueblo');
    await fireEvent.press(screen.getByTestId('outfit-form-garment-a'));
    await fireEvent.press(screen.getByTestId('outfit-form-garment-c'));
    await fireEvent.changeText(screen.getByTestId('outfit-form-description'), 'Con abrigo.');
    await fireEvent.press(screen.getByTestId('outfit-form-submit'));

    await waitFor(() => expect(screen.getByText('Finde en el pueblo')).toBeOnTheScreen());
    const raw = await AsyncStorage.getItem('wardrobe-outfits');
    expect(JSON.parse(raw ?? '[]')[0]).toMatchObject({
      name: 'Finde en el pueblo',
      garmentIds: ['a', 'c'],
      description: 'Con abrigo.',
    });
  });

  it('Regression: tapping a garment twice deselects it instead of duplicating it', async () => {
    await seed({ outfits: [] });
    await renderScreen();
    await fireEvent.press(screen.getByTestId('outfits-new'));
    await screen.findByTestId('outfit-form-name');

    await fireEvent.press(screen.getByTestId('outfit-form-garment-a'));
    expect(screen.getByTestId('outfit-form-garment-count')).toHaveTextContent('1 seleccionadas');

    await fireEvent.press(screen.getByTestId('outfit-form-garment-a'));
    expect(screen.getByTestId('outfit-form-garment-count')).toHaveTextContent('0 seleccionadas');
  });

  it('narrows the garment list with its own search box', async () => {
    await seed({ outfits: [] });
    await renderScreen();
    await fireEvent.press(screen.getByTestId('outfits-new'));
    await screen.findByTestId('outfit-form-name');

    await fireEvent.changeText(screen.getByTestId('outfit-form-garment-search'), 'zapa');

    expect(screen.getByTestId('outfit-form-garment-c')).toBeOnTheScreen();
    expect(screen.queryByTestId('outfit-form-garment-a')).not.toBeOnTheScreen();
  });

  it('suggests tags that already exist', async () => {
    await seed({ outfits: [] });
    await renderScreen();
    await fireEvent.press(screen.getByTestId('outfits-new'));
    await screen.findByTestId('outfit-form-tag-input');

    await fireEvent.changeText(screen.getByTestId('outfit-form-tag-input'), 'v');

    expect(await screen.findByTestId('outfit-form-suggestion-verano')).toBeOnTheScreen();
  });

  it('adds a tag from a suggestion', async () => {
    await seed({ outfits: [] });
    await renderScreen();
    await fireEvent.press(screen.getByTestId('outfits-new'));
    await screen.findByTestId('outfit-form-tag-input');

    await fireEvent.changeText(screen.getByTestId('outfit-form-tag-input'), 'v');
    await fireEvent.press(await screen.findByTestId('outfit-form-suggestion-verano'));

    expect(screen.getByTestId('outfit-form-tag-verano')).toBeOnTheScreen();
    expect(screen.getByTestId('outfit-form-tag-input')).toHaveProp('value', '');
  });
});

describe('editing an outfit', () => {
  it('opens the form pre-filled with the outfit', async () => {
    await seed();
    await renderScreen();
    await openDetail('Domingo de terraza');

    await fireEvent.press(screen.getByTestId('outfit-detail-edit'));

    expect(await screen.findByTestId('outfit-form-name')).toHaveProp(
      'value',
      'Domingo de terraza',
    );
    expect(screen.getByTestId('outfit-form-garment-count')).toHaveTextContent('2 seleccionadas');
  });

  it('saves a new name and a removed garment', async () => {
    await seed();
    await renderScreen();
    await openDetail('Domingo de terraza');
    await fireEvent.press(screen.getByTestId('outfit-detail-edit'));
    await screen.findByTestId('outfit-form-name');

    await fireEvent.changeText(screen.getByTestId('outfit-form-name'), 'Domingo de playa');
    await fireEvent.press(screen.getByTestId('outfit-form-garment-b'));
    await fireEvent.press(screen.getByTestId('outfit-form-submit'));

    await waitFor(() => expect(screen.getByText('Domingo de playa')).toBeOnTheScreen());
    const raw = await AsyncStorage.getItem('wardrobe-outfits');
    const stored: Outfit[] = JSON.parse(raw ?? '[]');
    expect(stored.find((o) => o.id === 'o1')).toMatchObject({
      name: 'Domingo de playa',
      garmentIds: ['a'],
    });
  });

  it('discards the changes when the form is cancelled', async () => {
    await seed();
    await renderScreen();
    await openDetail('Domingo de terraza');
    await fireEvent.press(screen.getByTestId('outfit-detail-edit'));
    await screen.findByTestId('outfit-form-name');

    await fireEvent.changeText(screen.getByTestId('outfit-form-name'), 'Nombre descartado');
    await fireEvent.press(screen.getByTestId('outfit-form-cancel'));

    await waitFor(() => expect(screen.queryByTestId('outfit-form-name')).not.toBeOnTheScreen());
    expect(screen.getByText('Domingo de terraza')).toBeOnTheScreen();
    expect(screen.queryByText('Nombre descartado')).not.toBeOnTheScreen();
  });

  it('Regression: the create form is empty again after saving one outfit', async () => {
    await seed({ outfits: [] });
    await renderScreen();

    await fireEvent.press(screen.getByTestId('outfits-new'));
    await screen.findByTestId('outfit-form-name');
    await fireEvent.changeText(screen.getByTestId('outfit-form-name'), 'Primero');
    await fireEvent.press(screen.getByTestId('outfit-form-garment-a'));
    await fireEvent.press(screen.getByTestId('outfit-form-submit'));
    await waitFor(() => expect(screen.getByText('Primero')).toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('outfits-new'));

    expect(await screen.findByTestId('outfit-form-name')).toHaveProp('value', '');
    expect(screen.getByTestId('outfit-form-garment-count')).toHaveTextContent('0 seleccionadas');
  });
});
