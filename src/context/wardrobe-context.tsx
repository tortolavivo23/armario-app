import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { DefaultTagColor, TagColors } from '@/constants/theme';
import { deletePersistedImage, persistImage } from '@/lib/persist-image';
import { Garment, migrateGarment } from '@/types/garment';
import { Outfit, uniqueGarmentIds } from '@/types/outfit';
import { Tag } from '@/types/tag';
import { AllWardrobes, Wardrobe, WardrobeFilter } from '@/types/wardrobe';

const STORAGE_KEY = 'wardrobe-garments';
const TAGS_STORAGE_KEY = 'wardrobe-tags';
const OUTFITS_STORAGE_KEY = 'wardrobe-outfits';
const WARDROBES_STORAGE_KEY = 'wardrobe-list';
const ACTIVE_WARDROBE_STORAGE_KEY = 'wardrobe-active';

type GarmentInput = {
  name: string;
  /** Mix of already-persisted uris and freshly picked ones, in display order. */
  imageUris: string[];
  description: string;
  tags: string[];
  wardrobeId: string | null;
};

type OutfitInput = {
  name: string;
  garmentIds: string[];
  description: string;
  tags: string[];
};

type TagInput = {
  group?: string | null;
  color?: string;
};

type WardrobeContextValue = {
  garments: Garment[];
  outfits: Outfit[];
  tags: Tag[];
  wardrobes: Wardrobe[];
  /** Which wardrobe the collection is being viewed through. */
  activeWardrobe: WardrobeFilter;
  setActiveWardrobe: (filter: WardrobeFilter) => void;
  isLoading: boolean;
  addGarment: (garment: GarmentInput) => Promise<void>;
  updateGarment: (id: string, garment: GarmentInput) => Promise<void>;
  removeGarment: (id: string) => Promise<void>;
  /** Creates the wardrobe and returns it, so the caller can switch to it. */
  addWardrobe: (name: string) => Wardrobe;
  renameWardrobe: (id: string, name: string) => void;
  /** Deletes the wardrobe. Its garments stay, unfiled. */
  removeWardrobe: (id: string) => void;
  /** Files a garment into a wardrobe, or unfiles it with `null`. */
  moveGarment: (id: string, wardrobeId: string | null) => void;
  addOutfit: (outfit: OutfitInput) => Promise<void>;
  updateOutfit: (id: string, outfit: OutfitInput) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
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
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [wardrobes, setWardrobes] = useState<Wardrobe[]>([]);
  const [activeWardrobe, setActiveWardrobe] = useState<WardrobeFilter>(AllWardrobes);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(TAGS_STORAGE_KEY),
      AsyncStorage.getItem(OUTFITS_STORAGE_KEY),
      AsyncStorage.getItem(WARDROBES_STORAGE_KEY),
      AsyncStorage.getItem(ACTIVE_WARDROBE_STORAGE_KEY),
    ])
      .then(([rawGarments, rawTags, rawOutfits, rawWardrobes, rawActive]) => {
        if (rawGarments) setGarments(JSON.parse(rawGarments).map(migrateGarment));
        if (rawTags) setTags(JSON.parse(rawTags));
        if (rawOutfits) setOutfits(JSON.parse(rawOutfits));

        const storedWardrobes: Wardrobe[] = rawWardrobes ? JSON.parse(rawWardrobes) : [];
        setWardrobes(storedWardrobes);

        // A wardrobe deleted on another launch must not leave the screen stuck
        // on an empty view.
        const isStillThere =
          rawActive === 'unfiled' || storedWardrobes.some((w) => w.id === rawActive);
        if (rawActive && isStillThere) setActiveWardrobe(rawActive);
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

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(OUTFITS_STORAGE_KEY, JSON.stringify(outfits));
  }, [outfits, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(WARDROBES_STORAGE_KEY, JSON.stringify(wardrobes));
  }, [wardrobes, isLoading]);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(ACTIVE_WARDROBE_STORAGE_KEY, activeWardrobe);
  }, [activeWardrobe, isLoading]);

  // Tags typed into a garment or an outfit form are registered here so they get
  // a colour without the user having to visit the tag manager first.
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
      outfits,
      tags,
      wardrobes,
      activeWardrobe,
      setActiveWardrobe,
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
      addGarment: async ({ name, imageUris, description, tags: garmentTags, wardrobeId }) => {
        const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const persistedUris = await Promise.all(imageUris.map((uri) => persistImage(uri)));
        const garment: Garment = {
          id,
          name,
          imageUris: persistedUris,
          description,
          tags: garmentTags,
          wardrobeId,
          createdAt: Date.now(),
        };
        registerTags(garmentTags);
        setGarments((current) => [garment, ...current]);
      },
      updateGarment: async (id, { name, imageUris, description, tags: garmentTags, wardrobeId }) => {
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
              ? {
                  ...item,
                  name,
                  description,
                  tags: garmentTags,
                  imageUris: persistedUris,
                  wardrobeId,
                }
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

        // Outfits reference garments rather than copying them, so a deleted
        // garment has to be dropped from the outfits wearing it.
        setOutfits((current) =>
          current.map((outfit) =>
            outfit.garmentIds.includes(id)
              ? { ...outfit, garmentIds: outfit.garmentIds.filter((item) => item !== id) }
              : outfit,
          ),
        );
      },
      addOutfit: async ({ name, garmentIds, description, tags: outfitTags }) => {
        const outfit: Outfit = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          name,
          // A garment can be worn in many outfits, but only once within one.
          garmentIds: uniqueGarmentIds(garmentIds),
          description,
          tags: outfitTags,
          createdAt: Date.now(),
        };
        registerTags(outfitTags);
        setOutfits((current) => [outfit, ...current]);
      },
      updateOutfit: async (id, { name, garmentIds, description, tags: outfitTags }) => {
        registerTags(outfitTags);
        setOutfits((current) =>
          current.map((outfit) =>
            outfit.id === id
              ? {
                  ...outfit,
                  name,
                  garmentIds: uniqueGarmentIds(garmentIds),
                  description,
                  tags: outfitTags,
                }
              : outfit,
          ),
        );
      },
      removeOutfit: async (id) => {
        // Only the combination goes away; the garments stay in the wardrobe.
        setOutfits((current) => current.filter((outfit) => outfit.id !== id));
      },
      addWardrobe: (name) => {
        const wardrobe: Wardrobe = {
          id: `${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
          name: name.trim(),
          createdAt: Date.now(),
        };
        setWardrobes((current) => [...current, wardrobe]);
        return wardrobe;
      },
      renameWardrobe: (id, name) => {
        const trimmed = name.trim();
        if (trimmed.length === 0) return;
        setWardrobes((current) =>
          current.map((wardrobe) =>
            wardrobe.id === id ? { ...wardrobe, name: trimmed } : wardrobe,
          ),
        );
      },
      removeWardrobe: (id) => {
        setWardrobes((current) => current.filter((wardrobe) => wardrobe.id !== id));

        // The clothes outlive the wardrobe: they only lose their filing.
        setGarments((current) =>
          current.map((garment) =>
            garment.wardrobeId === id ? { ...garment, wardrobeId: null } : garment,
          ),
        );

        // Nothing would be left to look at on a deleted wardrobe's screen.
        setActiveWardrobe((current) => (current === id ? AllWardrobes : current));
      },
      moveGarment: (id, wardrobeId) => {
        setGarments((current) =>
          current.map((garment) => (garment.id === id ? { ...garment, wardrobeId } : garment)),
        );
      },
    }),
    [garments, outfits, tags, wardrobes, activeWardrobe, isLoading, getTag, registerTags],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) throw new Error('useWardrobe must be used within a WardrobeProvider');
  return context;
}
