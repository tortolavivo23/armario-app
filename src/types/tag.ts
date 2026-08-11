/**
 * Tags are identified by their lowercase name, which is what `Garment.tags`
 * stores. This entry adds the presentation metadata on top of that name, so a
 * garment saved before the catalogue existed keeps working.
 */
export type Tag = {
  name: string;
  /** Free-text group such as "estación" or "tipo". `null` means ungrouped. */
  group: string | null;
  /** One of `TagColors`. */
  color: string;
};
