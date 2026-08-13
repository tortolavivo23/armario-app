import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import WardrobeScreen from '@/app/index';
import { GarmentForm } from '@/components/garment-form';
import { AppProviders } from '@/context/providers';
import { useWardrobe } from '@/context/wardrobe-context';
import { deletePersistedImage, persistImage } from '@/lib/persist-image';
import { Garment, migrateGarment } from '@/types/garment';

const GARMENT: Garment = {
  id: 'a',
  name: 'Camisa vaquera',
  imageUris: ['file:///documents/garments/1.jpg', 'file:///documents/garments/2.jpg'],
  description: 'Talla M, comprada en Lisboa.',
  tags: [],
  wardrobeId: null,
  createdAt: 1,
};

async function renderContext() {
  const view = await renderHook(() => useWardrobe(), { wrapper: AppProviders });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

async function renderForm(initialValues?: React.ComponentProps<typeof GarmentForm>['initialValues']) {
  const onSubmit = jest.fn().mockResolvedValue(undefined);
  await render(
    <AppProviders>
      <GarmentForm
        title="Nueva prenda"
        submitLabel="Guardar"
        savingLabel="Guardando…"
        initialValues={initialValues}
        onSubmit={onSubmit}
      />
    </AppProviders>,
  );
  return { onSubmit };
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('migrating stored garments', () => {
  // Regression: garments written before the multi-photo change kept a single
  // `imageUri` and had no description.
  it('turns a legacy imageUri into a one-item list', () => {
    const migrated = migrateGarment({
      id: 'a',
      name: 'Camisa',
      imageUri: 'file:///a.jpg',
      tags: [],
      wardrobeId: null,
      createdAt: 1,
    } as never);

    expect(migrated.imageUris).toEqual(['file:///a.jpg']);
    expect(migrated.description).toBe('');
  });

  it('turns a legacy null imageUri into an empty list', () => {
    const migrated = migrateGarment({
      id: 'a',
      name: 'Camisa',
      imageUri: null,
      tags: [],
      wardrobeId: null,
      createdAt: 1,
    } as never);

    expect(migrated.imageUris).toEqual([]);
  });

  it('leaves an already-migrated garment untouched', () => {
    expect(migrateGarment(GARMENT)).toEqual(GARMENT);
  });

  it('migrates on load so the legacy shape never reaches the UI', async () => {
    await AsyncStorage.setItem(
      'wardrobe-garments',
      JSON.stringify([{ id: 'a', name: 'Camisa', imageUri: 'file:///a.jpg', tags: [], createdAt: 1 }]),
    );

    const { result } = await renderContext();

    expect(result.current.garments[0].imageUris).toEqual(['file:///a.jpg']);
    expect(result.current.garments[0].description).toBe('');
  });
});

describe('several photos per garment', () => {
  it('persists every picked photo', async () => {
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addGarment({
        name: 'Camisa',
        imageUris: ['file:///picked/1.jpg', 'file:///picked/2.jpg'],
        description: '',
        tags: [],
        wardrobeId: null,
      });
    });

    expect(persistImage).toHaveBeenCalledTimes(2);
    expect(result.current.garments[0].imageUris).toHaveLength(2);
  });

  it('only copies the newly added photo when editing', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify([GARMENT]));
    const { result } = await renderContext();

    await act(async () => {
      await result.current.updateGarment('a', {
        name: GARMENT.name,
        imageUris: [...GARMENT.imageUris, 'file:///picked/new.jpg'],
        description: GARMENT.description,
        tags: [],
        wardrobeId: null,
      });
    });

    expect(persistImage).toHaveBeenCalledTimes(1);
    expect(result.current.garments[0].imageUris).toHaveLength(3);
  });

  it('deletes only the photos dropped from the garment', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify([GARMENT]));
    const { result } = await renderContext();

    await act(async () => {
      await result.current.updateGarment('a', {
        name: GARMENT.name,
        imageUris: [GARMENT.imageUris[0]],
        description: GARMENT.description,
        tags: [],
        wardrobeId: null,
      });
    });

    expect(deletePersistedImage).toHaveBeenCalledTimes(1);
    expect(deletePersistedImage).toHaveBeenCalledWith(GARMENT.imageUris[1]);
  });

  it('deletes every photo when the garment is removed', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify([GARMENT]));
    const { result } = await renderContext();

    await act(async () => {
      await result.current.removeGarment('a');
    });

    expect(deletePersistedImage).toHaveBeenCalledTimes(2);
  });

  it('keeps the photo order, since the first one is the cover', async () => {
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addGarment({
        name: 'Camisa',
        imageUris: ['file:///picked/a.jpg', 'file:///picked/b.jpg'],
        description: '',
        tags: [],
        wardrobeId: null,
      });
    });

    expect(result.current.garments[0].imageUris[0]).toContain('a.jpg');
  });

  it('appends photos from a multi-selection in the form', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///picked/1.jpg' }, { uri: 'file:///picked/2.jpg' }],
    } as never);

    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Camisa');
    await fireEvent.press(screen.getByTestId('garment-form-image'));
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].imageUris).toEqual([
      'file:///picked/1.jpg',
      'file:///picked/2.jpg',
    ]);
  });

  it('removes a single photo from the form', async () => {
    const { onSubmit } = await renderForm({
      name: 'Camisa',
      imageUris: ['file:///a.jpg', 'file:///b.jpg'],
      description: '',
      tags: [],
      wardrobeId: null,
    });

    await fireEvent.press(screen.getByTestId('garment-form-remove-image-0'));
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].imageUris).toEqual(['file:///b.jpg']);
  });

  it('shows only the cover in the grid, with a photo counter', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify([GARMENT]));
    await render(
      <AppProviders>
        <WardrobeScreen />
      </AppProviders>,
    );

    await screen.findByText('Camisa vaquera');
    expect(screen.getByText('2 📷')).toBeOnTheScreen();
  });

  it('opens a swipeable gallery in the detail view', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify([GARMENT]));
    await render(
      <AppProviders>
        <WardrobeScreen />
      </AppProviders>,
    );

    await fireEvent.press(await screen.findByText('Camisa vaquera'));

    expect(await screen.findByTestId('garment-gallery')).toBeOnTheScreen();
    expect(screen.getByText('1/2')).toBeOnTheScreen();
  });
});

describe('garment description', () => {
  it('saves the description with the garment', async () => {
    const { result } = await renderContext();

    await act(async () => {
      await result.current.addGarment({
        name: 'Camisa',
        imageUris: [],
        description: 'Talla M',
        tags: [],
        wardrobeId: null,
      });
    });

    expect(result.current.garments[0].description).toBe('Talla M');
  });

  it('trims the description typed into the form', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Camisa');
    await fireEvent.changeText(screen.getByTestId('garment-form-description'), '  Talla M  ');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].description).toBe('Talla M');
  });

  it('pre-fills the description when editing', async () => {
    await renderForm({
      name: GARMENT.name,
      imageUris: [],
      description: GARMENT.description,
      tags: [],
      wardrobeId: null,
    });

    expect(screen.getByTestId('garment-form-description').props.value).toBe(GARMENT.description);
  });

  it('shows the description in the detail view but not in the grid', async () => {
    await AsyncStorage.setItem('wardrobe-garments', JSON.stringify([GARMENT]));
    await render(
      <AppProviders>
        <WardrobeScreen />
      </AppProviders>,
    );

    await screen.findByText('Camisa vaquera');
    expect(screen.queryByText(GARMENT.description)).not.toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Camisa vaquera'));

    expect(await screen.findByTestId('garment-detail-description')).toBeOnTheScreen();
    expect(screen.getByText(GARMENT.description)).toBeOnTheScreen();
  });

  it('hides the description block when there is none', async () => {
    await AsyncStorage.setItem(
      'wardrobe-garments',
      JSON.stringify([{ ...GARMENT, description: '' }]),
    );
    await render(
      <AppProviders>
        <WardrobeScreen />
      </AppProviders>,
    );

    await fireEvent.press(await screen.findByText('Camisa vaquera'));
    await screen.findByTestId('garment-detail-menu-button');

    expect(screen.queryByTestId('garment-detail-description')).not.toBeOnTheScreen();
  });
});

describe('tag autocomplete', () => {
  async function renderFormWithCatalogue() {
    await AsyncStorage.setItem(
      'wardrobe-tags',
      JSON.stringify([
        { name: 'pantalón', group: null, color: '#208AEF' },
        { name: 'pana', group: null, color: '#12A594' },
        { name: 'camisa', group: null, color: '#30A46C' },
      ]),
    );
    return renderForm();
  }

  it('suggests existing tags from the first letter typed', async () => {
    const { onSubmit } = await renderFormWithCatalogue();
    await waitFor(() => expect(screen.getByTestId('garment-form-tag-input')).toBeOnTheScreen());

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'p');

    const suggestions = await screen.findByTestId('garment-form-tag-suggestions');
    expect(suggestions).toBeOnTheScreen();
    expect(screen.getByTestId('garment-form-suggestion-pantalón')).toBeOnTheScreen();
    expect(screen.getByTestId('garment-form-suggestion-pana')).toBeOnTheScreen();
    expect(screen.queryByTestId('garment-form-suggestion-camisa')).not.toBeOnTheScreen();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('adds the whole tag when a suggestion is tapped', async () => {
    const { onSubmit } = await renderFormWithCatalogue();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Vaquero');
    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'p');
    await fireEvent.press(await screen.findByTestId('garment-form-suggestion-pantalón'));
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].tags).toEqual(['pantalón']);
  });

  it('clears the input after taking a suggestion', async () => {
    await renderFormWithCatalogue();

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'p');
    await fireEvent.press(await screen.findByTestId('garment-form-suggestion-pana'));

    expect(screen.getByTestId('garment-form-tag-input').props.value).toBe('');
  });

  it('hides suggestions when the input is empty', async () => {
    await renderFormWithCatalogue();

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'p');
    await screen.findByTestId('garment-form-tag-suggestions');

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), '');

    await waitFor(() =>
      expect(screen.queryByTestId('garment-form-tag-suggestions')).not.toBeOnTheScreen(),
    );
  });

  it('does not suggest a tag already on the garment', async () => {
    await renderFormWithCatalogue();

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'pana');
    await fireEvent(screen.getByTestId('garment-form-tag-input'), 'submitEditing');

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'pan');

    await waitFor(() =>
      expect(screen.queryByTestId('garment-form-suggestion-pana')).not.toBeOnTheScreen(),
    );
    expect(screen.getByTestId('garment-form-suggestion-pantalón')).toBeOnTheScreen();
  });

  it('matches anywhere in the name, not just the start', async () => {
    await renderFormWithCatalogue();

    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'mis');

    expect(await screen.findByTestId('garment-form-suggestion-camisa')).toBeOnTheScreen();
  });
});
