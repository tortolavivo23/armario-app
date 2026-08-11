export type Garment = {
  id: string;
  name: string;
  /** Every photo of the garment. The first one is the cover shown in the grid. */
  imageUris: string[];
  /** Free-form notes. Only shown on the detail screen. Empty when unused. */
  description: string;
  tags: string[];
  createdAt: number;
};

/** Shape written before a garment could hold several photos and a description. */
type LegacyGarment = Omit<Garment, 'imageUris' | 'description'> & {
  imageUri?: string | null;
  imageUris?: string[];
  description?: string;
};

/** Upgrades a stored garment to the current shape. */
export function migrateGarment(stored: Garment | LegacyGarment): Garment {
  const legacy = stored as LegacyGarment;
  const { imageUri, ...rest } = legacy;

  return {
    ...rest,
    imageUris: legacy.imageUris ?? (imageUri ? [imageUri] : []),
    description: legacy.description ?? '',
  };
}
