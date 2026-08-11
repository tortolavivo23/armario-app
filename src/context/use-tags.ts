import { useCallback, useMemo } from 'react';

import { DefaultTagColor, TagColors } from '@/constants/theme';
import { usePersistentState } from '@/lib/use-persistent-state';
import { Tag } from '@/types/tag';

const STORAGE_KEY = 'wardrobe-tags';

export type TagChanges = {
  group?: string | null;
  color?: string;
};

/** Spreads auto-created tags across the palette so a fresh wardrobe is not all grey. */
function nextColor(existing: Tag[]) {
  return TagColors[existing.length % TagColors.length];
}

function normalizeGroup(group: string | null | undefined) {
  const trimmed = group?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

/**
 * The tag catalogue: the colour and group behind each tag name. Garments and
 * outfits keep storing plain names, so this can be missing without breaking
 * them.
 */
export function useTags() {
  const [tags, setTags, isLoading] = usePersistentState<Tag[]>(STORAGE_KEY, []);

  const getTag = useCallback(
    (name: string): Tag =>
      tags.find((tag) => tag.name === name) ?? { name, group: null, color: DefaultTagColor },
    [tags],
  );

  // Tags typed into a garment or an outfit form are registered here so they get
  // a colour without the user having to visit the tag manager first.
  const registerTags = useCallback(
    (names: string[]) => {
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
    },
    [setTags],
  );

  const upsertTag = useCallback(
    (name: string, changes: TagChanges) => {
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
    [setTags],
  );

  /** Forgets the tag's colour and group. It stays on the records that use it. */
  const removeTag = useCallback(
    (name: string) => setTags((current) => current.filter((tag) => tag.name !== name)),
    [setTags],
  );

  return useMemo(
    () => ({ tags, isLoading, getTag, registerTags, upsertTag, removeTag }),
    [tags, isLoading, getTag, registerTags, upsertTag, removeTag],
  );
}
