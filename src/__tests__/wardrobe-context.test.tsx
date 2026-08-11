import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';

import { AppProviders } from '@/context/providers';
import { useWardrobe } from '@/context/wardrobe-context';
import { deletePersistedImage, persistImage } from '@/lib/persist-image';
import { Garment } from '@/types/garment';

const STORAGE_KEY = 'wardrobe-garments';

const STORED: Garment[] = [
  {
    id: 'a',
    name: 'Camisa vaquera',
    imageUris: ['file:///documents/garments/a.jpg'],
    description: '',
    tags: ['casual'],
    createdAt: 1_700_000_000_000,
  },
  {
    id: 'b',
    name: 'Bufanda',
    imageUris: [],
    description: '',
    tags: [],
    createdAt: 1_700_000_001_000,
  },
];

async function renderWardrobe() {
  const view = await renderHook(() => useWardrobe(), { wrapper: AppProviders });
  await waitFor(() => expect(view.result.current.isLoading).toBe(false));
  return view;
}

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('WardrobeProvider loading', () => {
  it('starts empty when nothing is stored', async () => {
    const { result } = await renderWardrobe();

    expect(result.current.garments).toEqual([]);
  });

  it('restores garments persisted in AsyncStorage', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));

    const { result } = await renderWardrobe();

    expect(result.current.garments).toHaveLength(2);
    expect(result.current.garments[0].name).toBe('Camisa vaquera');
  });
});

describe('addGarment', () => {
  it('prepends the new garment so the newest shows first', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.addGarment({ name: 'Gorro', imageUris: [], description: '', tags: ['invierno'] });
    });

    expect(result.current.garments[0].name).toBe('Gorro');
    expect(result.current.garments).toHaveLength(3);
  });

  // Regression: adding a garment without a photo used to be impossible.
  it('accepts a garment with no image and stores an empty list', async () => {
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.addGarment({ name: 'Gorro', imageUris: [], description: '', tags: [] });
    });

    expect(result.current.garments[0].imageUris).toEqual([]);
    expect(persistImage).not.toHaveBeenCalled();
  });

  it('copies a picked image into app storage', async () => {
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.addGarment({ name: 'Gorro', imageUris: ['file:///picked.jpg'], description: '', tags: [] });
    });

    expect(persistImage).toHaveBeenCalledTimes(1);
    expect(result.current.garments[0].imageUris[0]).toMatch(/^file:\/\/\/documents\/garments\//);
  });

  it('writes the updated list back to AsyncStorage', async () => {
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.addGarment({ name: 'Gorro', imageUris: [], description: '', tags: [] });
    });

    await waitFor(async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      expect(JSON.parse(raw ?? '[]')).toHaveLength(1);
    });
  });

  it('gives each garment a distinct id', async () => {
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.addGarment({ name: 'Uno', imageUris: [], description: '', tags: [] });
      await result.current.addGarment({ name: 'Dos', imageUris: [], description: '', tags: [] });
    });

    const ids = result.current.garments.map((g) => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('updateGarment', () => {
  it('changes the name and tags while keeping id and createdAt', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.updateGarment('a', {
        name: 'Camisa azul',
        imageUris: ['file:///documents/garments/a.jpg'],
        description: '',
        tags: ['formal', 'azul'],
      });
    });

    const updated = result.current.garments.find((g) => g.id === 'a');
    expect(updated).toMatchObject({
      id: 'a',
      name: 'Camisa azul',
      tags: ['formal', 'azul'],
      createdAt: 1_700_000_000_000,
    });
  });

  it('keeps the existing image when the uri is unchanged', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.updateGarment('a', {
        name: 'Camisa azul',
        imageUris: ['file:///documents/garments/a.jpg'],
        description: '',
        tags: [],
      });
    });

    expect(persistImage).not.toHaveBeenCalled();
    expect(deletePersistedImage).not.toHaveBeenCalled();
  });

  it('replaces the old image file when a new photo is picked', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.updateGarment('a', {
        name: 'Camisa vaquera',
        imageUris: ['file:///picked/new.jpg'],
        description: '',
        tags: [],
      });
    });

    expect(deletePersistedImage).toHaveBeenCalledWith('file:///documents/garments/a.jpg');
    expect(persistImage).toHaveBeenCalledTimes(1);
  });

  it('removes the image when it is cleared', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.updateGarment('a', { name: 'Camisa', imageUris: [], description: '', tags: [] });
    });

    expect(deletePersistedImage).toHaveBeenCalledWith('file:///documents/garments/a.jpg');
    expect(result.current.garments.find((g) => g.id === 'a')?.imageUris).toEqual([]);
  });

  it('adds an image to a garment that had none', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.updateGarment('b', {
        name: 'Bufanda',
        imageUris: ['file:///picked/new.jpg'],
        description: '',
        tags: [],
      });
    });

    expect(deletePersistedImage).not.toHaveBeenCalled();
    expect(result.current.garments.find((g) => g.id === 'b')?.imageUris[0]).toMatch(/garments/);
  });

  it('ignores an unknown id', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.updateGarment('does-not-exist', {
        name: 'X',
        imageUris: [],
        description: '',
        tags: [],
      });
    });

    expect(result.current.garments).toHaveLength(2);
  });
});

describe('removeGarment', () => {
  it('drops the garment and deletes its image file', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.removeGarment('a');
    });

    expect(result.current.garments.map((g) => g.id)).toEqual(['b']);
    expect(deletePersistedImage).toHaveBeenCalledWith('file:///documents/garments/a.jpg');
  });

  it('does not try to delete a file for an image-less garment', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(STORED));
    const { result } = await renderWardrobe();

    await act(async () => {
      await result.current.removeGarment('b');
    });

    expect(result.current.garments.map((g) => g.id)).toEqual(['a']);
    expect(deletePersistedImage).not.toHaveBeenCalled();
  });
});
