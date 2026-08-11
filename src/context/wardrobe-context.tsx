import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { GarmentInput, useGarments } from './use-garments';
import { OutfitInput, useOutfits } from './use-outfits';
import { TagChanges, useTags } from './use-tags';
import { useWardrobes } from './use-wardrobes';

import { Garment } from '@/types/garment';
import { Outfit } from '@/types/outfit';
import { Tag } from '@/types/tag';
import { Wardrobe, WardrobeFilter } from '@/types/wardrobe';

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
  addOutfit: (outfit: OutfitInput) => Promise<void>;
  updateOutfit: (id: string, outfit: OutfitInput) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
  /** Creates the wardrobe and returns it, so the caller can switch to it. */
  addWardrobe: (name: string) => Wardrobe;
  renameWardrobe: (id: string, name: string) => void;
  /** Deletes the wardrobe. Its garments stay, unfiled. */
  removeWardrobe: (id: string) => void;
  /** Files a garment into a wardrobe, or unfiles it with `null`. */
  moveGarment: (id: string, wardrobeId: string | null) => void;
  /** Returns the catalogue entry for a tag name, inventing a default one if it is unknown. */
  getTag: (name: string) => Tag;
  /** Creates the tag if new, otherwise patches the fields given. */
  upsertTag: (name: string, changes: TagChanges) => void;
  /** Forgets the tag's colour and group. It stays on the garments that use it. */
  removeTag: (name: string) => void;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

/**
 * Wires the four stores together. Each one owns its own storage key and rules;
 * what lives here is only the handful of ways they affect each other:
 *
 * - a deleted garment has to leave the outfits wearing it;
 * - a deleted wardrobe has to unfile its garments;
 * - tags typed anywhere get registered in the catalogue.
 */
export function WardrobeProvider({ children }: { children: ReactNode }) {
  const tags = useTags();
  const outfits = useOutfits({ registerTags: tags.registerTags });
  const garments = useGarments({
    registerTags: tags.registerTags,
    onGarmentRemoved: outfits.dropGarment,
  });
  const wardrobes = useWardrobes({ onWardrobeRemoved: garments.unfileWardrobe });

  const value = useMemo<WardrobeContextValue>(
    () => ({
      garments: garments.garments,
      outfits: outfits.outfits,
      tags: tags.tags,
      wardrobes: wardrobes.wardrobes,
      activeWardrobe: wardrobes.activeWardrobe,
      setActiveWardrobe: wardrobes.setActiveWardrobe,
      isLoading:
        garments.isLoading || outfits.isLoading || tags.isLoading || wardrobes.isLoading,
      addGarment: garments.addGarment,
      updateGarment: garments.updateGarment,
      removeGarment: garments.removeGarment,
      moveGarment: garments.moveGarment,
      addOutfit: outfits.addOutfit,
      updateOutfit: outfits.updateOutfit,
      removeOutfit: outfits.removeOutfit,
      addWardrobe: wardrobes.addWardrobe,
      renameWardrobe: wardrobes.renameWardrobe,
      removeWardrobe: wardrobes.removeWardrobe,
      getTag: tags.getTag,
      upsertTag: tags.upsertTag,
      removeTag: tags.removeTag,
    }),
    [garments, outfits, tags, wardrobes],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) throw new Error('useWardrobe must be used within a WardrobeProvider');
  return context;
}
