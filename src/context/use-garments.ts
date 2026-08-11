import { useCallback, useMemo } from 'react';

import { createId } from '@/lib/id';
import { deletePersistedImage, persistImage } from '@/lib/persist-image';
import { usePersistentState } from '@/lib/use-persistent-state';
import { Garment, migrateGarment } from '@/types/garment';

const STORAGE_KEY = 'wardrobe-garments';

export type GarmentInput = {
  name: string;
  /** Mix of already-persisted uris and freshly picked ones, in display order. */
  imageUris: string[];
  description: string;
  tags: string[];
  wardrobeId: string | null;
};

type UseGarmentsOptions = {
  /** Registers the tags a garment introduces, so they get a colour. */
  registerTags: (names: string[]) => void;
  /** Called after a garment is deleted, so outfits can drop it. */
  onGarmentRemoved: (id: string) => void;
};

export function useGarments({ registerTags, onGarmentRemoved }: UseGarmentsOptions) {
  const [garments, setGarments, isLoading] = usePersistentState<Garment[]>(STORAGE_KEY, [], (stored) =>
    stored.map(migrateGarment),
  );

  const addGarment = useCallback(
    async ({ name, imageUris, description, tags, wardrobeId }: GarmentInput) => {
      const persistedUris = await Promise.all(imageUris.map((uri) => persistImage(uri)));
      const garment: Garment = {
        id: createId(),
        name,
        imageUris: persistedUris,
        description,
        tags,
        wardrobeId,
        createdAt: Date.now(),
      };
      registerTags(tags);
      setGarments((current) => [garment, ...current]);
    },
    [setGarments, registerTags],
  );

  const updateGarment = useCallback(
    async (id: string, { name, imageUris, description, tags, wardrobeId }: GarmentInput) => {
      registerTags(tags);

      // Copying images is async, so it happens before the update rather than
      // inside the updater, which has to stay pure.
      const existing = garments.find((item) => item.id === id);
      if (!existing) return;

      // Uris already in the garment are kept as they are; anything else was
      // just picked and still needs copying into app storage.
      const persistedUris = await Promise.all(
        imageUris.map((uri) => (existing.imageUris.includes(uri) ? uri : persistImage(uri))),
      );

      existing.imageUris
        .filter((uri) => !imageUris.includes(uri))
        .forEach((uri) => deletePersistedImage(uri));

      setGarments((current) =>
        current.map((item) =>
          item.id === id
            ? { ...item, name, description, tags, imageUris: persistedUris, wardrobeId }
            : item,
        ),
      );
    },
    [garments, setGarments, registerTags],
  );

  const removeGarment = useCallback(
    async (id: string) => {
      setGarments((current) => {
        const garment = current.find((item) => item.id === id);
        garment?.imageUris.forEach((uri) => deletePersistedImage(uri));
        return current.filter((item) => item.id !== id);
      });
      onGarmentRemoved(id);
    },
    [setGarments, onGarmentRemoved],
  );

  /** Files a garment into a wardrobe, or unfiles it with `null`. */
  const moveGarment = useCallback(
    (id: string, wardrobeId: string | null) =>
      setGarments((current) =>
        current.map((garment) => (garment.id === id ? { ...garment, wardrobeId } : garment)),
      ),
    [setGarments],
  );

  /** Unfiles every garment of a wardrobe that no longer exists. */
  const unfileWardrobe = useCallback(
    (wardrobeId: string) =>
      setGarments((current) =>
        current.map((garment) =>
          garment.wardrobeId === wardrobeId ? { ...garment, wardrobeId: null } : garment,
        ),
      ),
    [setGarments],
  );

  return useMemo(
    () => ({
      garments,
      isLoading,
      addGarment,
      updateGarment,
      removeGarment,
      moveGarment,
      unfileWardrobe,
    }),
    [garments, isLoading, addGarment, updateGarment, removeGarment, moveGarment, unfileWardrobe],
  );
}
