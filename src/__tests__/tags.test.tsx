import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@testing-library/react-native';

import WardrobeScreen from '@/app/index';
import { DefaultTagColor, TagColors } from '@/constants/theme';
import { AppProviders } from '@/context/providers';
import { useWardrobe } from '@/context/wardrobe-context';
import { Garment } from '@/types/garment';
import { Tag } from '@/types/tag';

const GARMENTS: Garment[] = [
  {
    id: 'a',
    name: 'Camisa vaquera',
    imageUris: [],
    description: '',
    tags: ['invierno', 'camisa'],
    wardrobeId: null,
    createdAt: 1,
  },
  {
    id: 'b',
    name: 'Pantalón corto',
    imageUris: [],
    description: '',
    tags: ['verano', 'pantalón'],
    wardrobeId: null,
    createdAt: 2,
  },
];

const TAGS: Tag[] = [
  { name: 'invierno', group: 'estación', color: TagColors[0] },
  { name: 'verano', group: 'estación', color: TagColors[3] },
  { name: 'camisa', group: 'tipo', color: TagColors[2] },
  { name: 'pantalón', group: null, color: TagColors[5] },
];

async function seed(tags: Tag[] = TAGS) {
  await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(GARMENTS));
  await AsyncStorage.setItem('wardrobe-tags', JSON.stringify(tags));
}

/** Opens the tag manager the way a user does: overflow menu -> "Gestionar etiquetas". */
async function openTagsManager() {
  await render(
    <AppProviders>
      <WardrobeScreen />
    </AppProviders>,
  );
  await fireEvent.press(await screen.findByTestId('overflow-menu-button'));
  await fireEvent.press(await screen.findByTestId('menu-manage-tags'));
  await screen.findByTestId('tags-manager-close');
}

async function renderWardrobe() {
  await render(
    <AppProviders>
      <WardrobeScreen />
    </AppProviders>,
  );
  await screen.findByText('Camisa vaquera');
}

async function renderContext() {
  const view = await renderHook(() => useWardrobe(), { wrapper: AppProviders });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('tag catalogue', () => {
  it('restores stored tags with their group and colour', async () => {
    await seed();
    const { result } = await renderContext();

    expect(result.current.getTag('invierno')).toEqual({
      name: 'invierno',
      group: 'estación',
      color: TagColors[0],
    });
  });

  it('falls back to a neutral colour for a tag with no catalogue entry', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(GARMENTS));
    const { result } = await renderContext();

    expect(result.current.getTag('desconocida')).toEqual({
      name: 'desconocida',
      group: null,
      color: DefaultTagColor,
    });
  });

  it('registers a tag automatically when a garment introduces it', async () => {
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addGarment({
        name: 'Gorro',
        imageUris: [],
        description: '',
        tags: ['lana'],
        wardrobeId: null,
      });
    });

    expect(result.current.tags.map((tag) => tag.name)).toContain('lana');
  });

  it('gives auto-registered tags different colours', async () => {
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addGarment({
        name: 'Gorro',
        imageUris: [],
        description: '',
        tags: ['lana', 'invierno', 'punto'],
        wardrobeId: null,
      });
    });

    const colors = result.current.tags.map((tag) => tag.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('does not duplicate a tag that already exists', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addGarment({
        name: 'Gorro',
        imageUris: [],
        description: '',
        tags: ['invierno'],
        wardrobeId: null,
      });
    });

    expect(result.current.tags.filter((tag) => tag.name === 'invierno')).toHaveLength(1);
  });

  it('assigns a group and a colour through upsertTag', async () => {
    await seed([]);
    const { result } = await renderContext();

    await act(async () => {
      result.current.upsertTag('camisa', { group: 'tipo', color: TagColors[4] });
    });

    expect(result.current.getTag('camisa')).toEqual({
      name: 'camisa',
      group: 'tipo',
      color: TagColors[4],
    });
  });

  it('treats a blank group as ungrouped', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.upsertTag('invierno', { group: '   ', color: TagColors[0] });
    });

    expect(result.current.getTag('invierno').group).toBeNull();
  });

  it('keeps the colour when only the group changes', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.upsertTag('invierno', { group: 'temporada' });
    });

    expect(result.current.getTag('invierno')).toEqual({
      name: 'invierno',
      group: 'temporada',
      color: TagColors[0],
    });
  });

  it('persists the catalogue to AsyncStorage', async () => {
    await seed([]);
    const { result } = await renderContext();

    await act(async () => {
      result.current.upsertTag('camisa', { group: 'tipo', color: TagColors[1] });
    });

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('wardrobe-tags');
      expect(JSON.parse(raw ?? '[]')).toContainEqual({
        name: 'camisa',
        group: 'tipo',
        color: TagColors[1],
      });
    });
  });

  it('removeTag forgets the metadata but leaves the tag on its garments', async () => {
    await seed();
    const { result } = await renderContext();

    await act(async () => {
      result.current.removeTag('invierno');
    });

    expect(result.current.tags.map((tag) => tag.name)).not.toContain('invierno');
    expect(result.current.garments.find((g) => g.id === 'a')?.tags).toContain('invierno');
    expect(result.current.getTag('invierno').color).toBe(DefaultTagColor);
  });
});

describe('overflow menu', () => {
  it('keeps the tag manager out of the way until the menu is opened', async () => {
    await seed();
    await renderWardrobe();

    expect(screen.queryByTestId('menu-manage-tags')).not.toBeOnTheScreen();
    expect(screen.queryByTestId('tags-manager')).not.toBeOnTheScreen();
    expect(screen.getByTestId('overflow-menu-button')).toBeOnTheScreen();
  });

  it('opens the tag manager from the menu', async () => {
    await seed();
    await renderWardrobe();

    await fireEvent.press(screen.getByTestId('overflow-menu-button'));
    await fireEvent.press(await screen.findByTestId('menu-manage-tags'));

    expect(await screen.findByTestId('tags-manager')).toBeOnTheScreen();
  });

  it('closes the menu without opening anything when the backdrop is tapped', async () => {
    await seed();
    await renderWardrobe();

    await fireEvent.press(screen.getByTestId('overflow-menu-button'));
    await fireEvent.press(await screen.findByTestId('overflow-menu-backdrop'));

    await waitFor(() => expect(screen.queryByTestId('menu-manage-tags')).not.toBeOnTheScreen());
    expect(screen.queryByTestId('tags-manager')).not.toBeOnTheScreen();
  });

  it('closes the tag manager again', async () => {
    await seed();
    await openTagsManager();

    await fireEvent.press(screen.getByTestId('tags-manager-close'));

    await waitFor(() => expect(screen.queryByTestId('tags-manager')).not.toBeOnTheScreen());
    expect(screen.getByText('Camisa vaquera')).toBeOnTheScreen();
  });
});

describe('tag manager', () => {
  it('lists the tags under their group headings', async () => {
    await seed();
    await openTagsManager();

    // Scoped to the manager: the wardrobe filter behind it shows headings too.
    const manager = within(screen.getByTestId('tags-manager'));
    expect(manager.getByText('ESTACIÓN')).toBeOnTheScreen();
    expect(manager.getByText('TIPO')).toBeOnTheScreen();
    expect(manager.getByText('SIN GRUPO')).toBeOnTheScreen();
  });

  it('includes tags that garments use but the catalogue does not know', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(GARMENTS));
    await openTagsManager();

    expect(screen.getByTestId('tags-manager-tag-camisa')).toBeOnTheScreen();
    expect(screen.getByTestId('tags-manager-tag-verano')).toBeOnTheScreen();
  });

  it('shows the onboarding state when there are no tags at all', async () => {
    await openTagsManager();

    expect(screen.getByText('Todavía no hay etiquetas')).toBeOnTheScreen();
  });

  it('opens the editor and saves a new group and colour', async () => {
    await seed();
    await openTagsManager();

    await fireEvent.press(screen.getByTestId('tags-manager-tag-pantalón'));
    await screen.findByTestId('tag-editor-group');

    await fireEvent.changeText(screen.getByTestId('tag-editor-group'), 'tipo');
    await fireEvent.press(screen.getByTestId(`tag-editor-color-${TagColors[6]}`));
    await fireEvent.press(screen.getByTestId('tag-editor-save'));

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('wardrobe-tags');
      expect(JSON.parse(raw ?? '[]')).toContainEqual({
        name: 'pantalón',
        group: 'tipo',
        color: TagColors[6],
      });
    });
  });

  it('reloads the editor for the tag actually being edited', async () => {
    await seed();
    await openTagsManager();

    // "pantalón" has no group; give it one and save.
    await fireEvent.press(screen.getByTestId('tags-manager-tag-pantalón'));
    await screen.findByTestId('tag-editor-group');
    await fireEvent.changeText(screen.getByTestId('tag-editor-group'), 'tipo');
    await fireEvent.press(screen.getByTestId('tag-editor-save'));
    await waitFor(() => expect(screen.queryByTestId('tag-editor-group')).not.toBeOnTheScreen());

    // The editor only hides between tags, so it used to reopen still showing
    // "tipo" and the colour of the tag before.
    await fireEvent.press(screen.getByTestId('tags-manager-tag-invierno'));
    await screen.findByTestId('tag-editor-group');

    expect(screen.getByTestId('tag-editor-group').props.value).toBe('estación');
    expect(
      within(screen.getByTestId(`tag-editor-color-${TagColors[0]}`)).getByText('✓'),
    ).toBeOnTheScreen();
  });

  it('changing only the colour leaves the tag in its own group', async () => {
    await seed();
    await openTagsManager();

    await fireEvent.press(screen.getByTestId('tags-manager-tag-pantalón'));
    await screen.findByTestId('tag-editor-group');
    await fireEvent.changeText(screen.getByTestId('tag-editor-group'), 'tipo');
    await fireEvent.press(screen.getByTestId('tag-editor-save'));
    await waitFor(() => expect(screen.queryByTestId('tag-editor-group')).not.toBeOnTheScreen());

    await fireEvent.press(screen.getByTestId('tags-manager-tag-invierno'));
    await screen.findByTestId('tag-editor-group');
    await fireEvent.press(screen.getByTestId(`tag-editor-color-${TagColors[7]}`));
    await fireEvent.press(screen.getByTestId('tag-editor-save'));

    // The stale group in the box used to be saved along with the colour, moving
    // "invierno" out of "estación" without the change ever being asked for.
    await waitFor(async () => {
      const raw = await AsyncStorage.getItem('wardrobe-tags');
      expect(JSON.parse(raw ?? '[]')).toContainEqual({
        name: 'invierno',
        group: 'estación',
        color: TagColors[7],
      });
    });
  });

  it('offers the groups already in use as shortcuts', async () => {
    await seed();
    await openTagsManager();

    await fireEvent.press(screen.getByTestId('tags-manager-tag-pantalón'));
    await screen.findByTestId('tag-editor-group');

    await fireEvent.press(screen.getByTestId('tag-editor-group-estación'));

    expect(screen.getByTestId('tag-editor-group').props.value).toBe('estación');
  });
});

describe('tag filter grouping on the wardrobe screen', () => {
  /** The chips live in a sheet now, so every test here opens it first. */
  async function openTagFilter() {
    await fireEvent.press(screen.getByTestId('wardrobe-tag-filter-button'));
    return within(await screen.findByTestId('wardrobe-tag-filter'));
  }

  it('shows a heading per group', async () => {
    await seed();
    await renderWardrobe();

    const filter = await openTagFilter();
    expect(filter.getByText('ESTACIÓN')).toBeOnTheScreen();
    expect(filter.getByText('TIPO')).toBeOnTheScreen();
    expect(filter.getByText('OTRAS')).toBeOnTheScreen();
  });

  it('drops the headings when every tag shares one group', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify(GARMENTS));
    await AsyncStorage.setItem(
      'wardrobe-tags',
      JSON.stringify(TAGS.map((tag) => ({ ...tag, group: 'todo' }))),
    );
    await renderWardrobe();

    const filter = await openTagFilter();
    expect(filter.queryByText('TODO')).not.toBeOnTheScreen();
    expect(filter.getByText('invierno')).toBeOnTheScreen();
  });

  it('still filters correctly when the chips are grouped', async () => {
    await seed();
    await renderWardrobe();

    const filter = await openTagFilter();
    await fireEvent.press(filter.getByText('verano'));

    await waitFor(() => expect(screen.queryByText('Camisa vaquera')).not.toBeOnTheScreen());
    expect(screen.getByText('Pantalón corto')).toBeOnTheScreen();
  });
});
