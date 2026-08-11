export type Garment = {
  id: string;
  name: string;
  /** Every photo of the garment. The first one is the cover shown in the grid. */
  imageUris: string[];
  /** Free-form notes. Only shown on the detail screen. Empty when unused. */
  description: string;
  tags: string[];
  /** The wardrobe it is filed into, or `null` while it is unfiled. */
  wardrobeId: string | null;
  createdAt: number;
};

/** Shape written before a garment could hold several photos, a description or a wardrobe. */
type LegacyGarment = Omit<Garment, 'imageUris' | 'description' | 'wardrobeId'> & {
  imageUri?: string | null;
  imageUris?: string[];
  description?: string;
  wardrobeId?: string | null;
};

/** Upgrades a stored garment to the current shape. */
export function migrateGarment(stored: Garment | LegacyGarment): Garment {
  const legacy = stored as LegacyGarment;
  const { imageUri, ...rest } = legacy;

  return {
    ...rest,
    imageUris: legacy.imageUris ?? (imageUri ? [imageUri] : []),
    description: legacy.description ?? '',
    wardrobeId: legacy.wardrobeId ?? null,
  };
}
