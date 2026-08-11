/**
 * A named subdivision of the collection — "invierno", "casa del pueblo", "el
 * armario de arriba". A garment belongs to at most one of these, or to none.
 */
export type Wardrobe = {
  id: string;
  name: string;
  createdAt: number;
};

/**
 * What the wardrobe screen is showing: everything, only the garments nobody
 * filed yet, or one wardrobe by id.
 */
export type WardrobeFilter = 'all' | 'unfiled' | (string & {});

export const AllWardrobes = 'all';
export const Unfiled = 'unfiled';

/** Whether a garment belongs in the view the filter describes. */
export function matchesWardrobe(garmentWardrobeId: string | null, filter: WardrobeFilter) {
  if (filter === AllWardrobes) return true;
  if (filter === Unfiled) return garmentWardrobeId == null;
  return garmentWardrobeId === filter;
}
