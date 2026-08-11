import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { createId } from '@/lib/id';
import { usePersistentState } from '@/lib/use-persistent-state';
import { AllWardrobes, Unfiled, Wardrobe, WardrobeFilter } from '@/types/wardrobe';

const STORAGE_KEY = 'wardrobe-list';
const ACTIVE_STORAGE_KEY = 'wardrobe-active';

type UseWardrobesOptions = {
  /** Called after a wardrobe is deleted, so its garments can be unfiled. */
  onWardrobeRemoved: (id: string) => void;
};

/**
 * The wardrobes themselves plus which one is being viewed.
 *
 * The active filter is stored as a bare string rather than JSON: it is one, and
 * keeping it unquoted makes the stored value readable.
 */
export function useWardrobes({ onWardrobeRemoved }: UseWardrobesOptions) {
  const [wardrobes, setWardrobes, isLoading] = usePersistentState<Wardrobe[]>(STORAGE_KEY, []);
  const [activeWardrobe, setActiveWardrobe] = useState<WardrobeFilter>(AllWardrobes);
  const [isActiveLoaded, setIsActiveLoaded] = useState(false);

  // Restoring the view has to wait for the wardrobes: one deleted on another
  // launch must not leave the screen stuck on an empty view.
  useEffect(() => {
    if (isLoading || isActiveLoaded) return;

    let cancelled = false;
    AsyncStorage.getItem(ACTIVE_STORAGE_KEY)
      .then((stored) => {
        if (cancelled || !stored) return;
        const stillThere = stored === Unfiled || wardrobes.some((w) => w.id === stored);
        if (stillThere) setActiveWardrobe(stored);
      })
      .finally(() => {
        if (!cancelled) setIsActiveLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoading, isActiveLoaded, wardrobes]);

  useEffect(() => {
    if (!isActiveLoaded) return;
    AsyncStorage.setItem(ACTIVE_STORAGE_KEY, activeWardrobe);
  }, [activeWardrobe, isActiveLoaded]);

  /** Creates the wardrobe and returns it, so the caller can switch to it. */
  const addWardrobe = useCallback(
    (name: string) => {
      const wardrobe: Wardrobe = { id: createId(), name: name.trim(), createdAt: Date.now() };
      setWardrobes((current) => [...current, wardrobe]);
      return wardrobe;
    },
    [setWardrobes],
  );

  const renameWardrobe = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (trimmed.length === 0) return;
      setWardrobes((current) =>
        current.map((wardrobe) => (wardrobe.id === id ? { ...wardrobe, name: trimmed } : wardrobe)),
      );
    },
    [setWardrobes],
  );

  /** Deletes the wardrobe. Its garments stay, unfiled. */
  const removeWardrobe = useCallback(
    (id: string) => {
      setWardrobes((current) => current.filter((wardrobe) => wardrobe.id !== id));
      onWardrobeRemoved(id);

      // Nothing would be left to look at on a deleted wardrobe's screen.
      setActiveWardrobe((current) => (current === id ? AllWardrobes : current));
    },
    [setWardrobes, onWardrobeRemoved],
  );

  return useMemo(
    () => ({
      wardrobes,
      isLoading,
      activeWardrobe,
      setActiveWardrobe,
      addWardrobe,
      renameWardrobe,
      removeWardrobe,
    }),
    [wardrobes, isLoading, activeWardrobe, addWardrobe, renameWardrobe, removeWardrobe],
  );
}
