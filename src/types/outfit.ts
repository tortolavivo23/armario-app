/**
 * A saved combination of garments already in the wardrobe. Outfits only store
 * garment ids, so editing a garment is reflected everywhere it is worn.
 */
export type Outfit = {
  id: string;
  name: string;
  /**
   * Garments that make up the outfit, in the order they were added. A garment
   * appears at most once, but may belong to any number of outfits.
   */
  garmentIds: string[];
  /** Free-form notes. Only shown on the detail screen. Empty when unused. */
  description: string;
  tags: string[];
  createdAt: number;
};

/** Drops repeats while keeping the original order. */
export function uniqueGarmentIds(ids: string[]): string[] {
  return Array.from(new Set(ids));
}
