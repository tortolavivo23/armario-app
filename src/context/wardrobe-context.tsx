import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DefaultTagColor, TagColors } from '@/constants/theme';
import { deletePersistedImage, persistImage } from '@/lib/persist-image';
import { Garment, migrateGarment } from '@/types/garment';
import { Tag } from '@/types/tag';

const STORAGE_KEY = 'wardrobe-garments';
const TAGS_STORAGE_KEY = 'wardrobe-tags';

type GarmentInput = {
  name: string;
  /** Mix of already-persisted uris and freshly picked ones, in display order. */
  imageUris: string[];
  description: string;
  tags: string[];
};

type TagInput = {
  group?: string | null;
  color?: string;
};

type WardrobeContextValue = {
  garments: Garment[];
  tags: Tag[];
  isLoading: boolean;
  addGarment: (garment: GarmentInput) => Promise<void>;
  updateGarment: (id: string, garment: GarmentInput) => Promise<void>;
  removeGarment: (id: string) => Promise<void>;
  /** Returns the catalogue entry for a tag name, inventing a default one if it is unknown. */
  getTag: (name: string) => Tag;
  /** Creates the tag if new, otherwise patches the fields given. */
  upsertTag: (name: string, changes: TagInput) => void;
  /** Forgets the tag's colour and group. It stays on the garments that use it. */
  removeTag: (name: string) => void;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

/** Spreads auto-created tags across the palette so a fresh wardrobe is not all grey. */
function nextColor(existing: Tag[]) {
  return TagColors[existing.length % TagColors.length];
}

function normalizeGroup(group: string | null | undefined) {
  const trimmed = group?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(TAGS_STORAGE_KEY)])
      .then(([rawGarments, rawTags]) => {
        if (rawGarments) setGarments(JSON.parse(rawGarments).map(migrateGarment));
        if (rawTags) setTags(JSON.parse(rawTags));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(garments));
  }, [garments, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
  }, [tags, isLoading]);

  // Tags typed into a garment form are registered here so they get a colour
  // without the user having to visit the tag screen first.
  const registerTags = useCallback((names: string[]) => {
    setTags((current) => {
      const known = new Set(current.map((tag) => tag.name));
      const added = names
        .filter((name) => !known.has(name))
        .filter((name, index, list) => list.indexOf(name) === index);

      if (added.length === 0) return current;

      return added.reduce<Tag[]>(
        (acc, name) => [...acc, { name, group: null, color: nextColor(acc) }],
        current,
      );
    });
  }, []);

  const getTag = useCallback(
    (name: string): Tag =>
      tags.find((tag) => tag.name === name) ?? { name, group: null, color: DefaultTagColor },
    [tags],
  );

  const value = useMemo<WardrobeContextValue>(
    () => ({
      garments,
      tags,
      isLoading,
      getTag,
      upsertTag: (name, changes) => {
        setTags((current) => {
          const existing = current.find((tag) => tag.name === name);

          if (!existing) {
            return [
              ...current,
              {
                name,
                group: normalizeGroup(changes.group),
                color: changes.color ?? nextColor(current),
              },
            ];
          }

          return current.map((tag) =>
            tag.name === name
              ? {
                  ...tag,
                  group: 'group' in changes ? normalizeGroup(changes.group) : tag.group,
                  color: changes.color ?? tag.color,
                }
              : tag,
          );
        });
      },
      removeTag: (name) => {
        setTags((current) => current.filter((tag) => tag.name !== name));
      },
      addGarment: async ({ name, imageUris, description, tags: garmentTags }) => {
        const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const persistedUris = await Promise.all(imageUris.map((uri) => persistImage(uri)));
        const garment: Garment = {
          id,
          name,
          imageUris: persistedUris,
          description,
          tags: garmentTags,
          createdAt: Date.now(),
        };
        registerTags(garmentTags);
        setGarments((current) => [garment, ...current]);
      },
      updateGarment: async (id, { name, imageUris, description, tags: garmentTags }) => {
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

        registerTags(garmentTags);
        setGarments((current) =>
          current.map((item) =>
            item.id === id
              ? { ...item, name, description, tags: garmentTags, imageUris: persistedUris }
              : item,
          ),
        );
      },
      removeGarment: async (id) => {
        setGarments((current) => {
          const garment = current.find((item) => item.id === id);
          garment?.imageUris.forEach((uri) => deletePersistedImage(uri));
          return current.filter((item) => item.id !== id);
        });
      },
    }),
    [garments, tags, isLoading, getTag, registerTags],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) throw new Error('useWardrobe must be used within a WardrobeProvider');
  return context;
}
