import { useCallback, useMemo } from 'react';

import { createId } from '@/lib/id';
import { usePersistentState } from '@/lib/use-persistent-state';
import { Outfit, uniqueGarmentIds } from '@/types/outfit';

const STORAGE_KEY = 'wardrobe-outfits';

export type OutfitInput = {
  name: string;
  garmentIds: string[];
  description: string;
  tags: string[];
};

type UseOutfitsOptions = {
  /** Registers the tags an outfit introduces, so they get a colour. */
  registerTags: (names: string[]) => void;
};

export function useOutfits({ registerTags }: UseOutfitsOptions) {
  const [outfits, setOutfits, isLoading] = usePersistentState<Outfit[]>(STORAGE_KEY, []);

  const addOutfit = useCallback(
    async ({ name, garmentIds, description, tags }: OutfitInput) => {
      const outfit: Outfit = {
        id: createId(),
        name,
        // A garment can be worn in many outfits, but only once within one.
        garmentIds: uniqueGarmentIds(garmentIds),
        description,
        tags,
        createdAt: Date.now(),
      };
      registerTags(tags);
      setOutfits((current) => [outfit, ...current]);
    },
    [setOutfits, registerTags],
  );

  const updateOutfit = useCallback(
    async (id: string, { name, garmentIds, description, tags }: OutfitInput) => {
      registerTags(tags);
      setOutfits((current) =>
        current.map((outfit) =>
          outfit.id === id
            ? { ...outfit, name, garmentIds: uniqueGarmentIds(garmentIds), description, tags }
            : outfit,
        ),
      );
    },
    [setOutfits, registerTags],
  );

  const removeOutfit = useCallback(
    // Only the combination goes away; the garments stay in the wardrobe.
    async (id: string) => setOutfits((current) => current.filter((outfit) => outfit.id !== id)),
    [setOutfits],
  );

  /**
   * Drops a deleted garment from every outfit wearing it. Outfits reference
   * garments rather than copying them, so this keeps them from pointing at
   * something that is gone.
   */
  const dropGarment = useCallback(
    (garmentId: string) =>
      setOutfits((current) =>
        current.map((outfit) =>
          outfit.garmentIds.includes(garmentId)
            ? { ...outfit, garmentIds: outfit.garmentIds.filter((item) => item !== garmentId) }
            : outfit,
        ),
      ),
    [setOutfits],
  );

  return useMemo(
    () => ({ outfits, isLoading, addOutfit, updateOutfit, removeOutfit, dropGarment }),
    [outfits, isLoading, addOutfit, updateOutfit, removeOutfit, dropGarment],
  );
}
