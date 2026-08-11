import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';

import { Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';

const UNGROUPED = '__ungrouped__';

type TagFilterProps = {
  /** Every tag that can be filtered on, already sorted. */
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  testID: string;
};

/**
 * Filter chips laid out under their group heading, so "estación" and "tipo"
 * read as separate rows instead of one long jumble.
 */
export function TagFilter({ tags, selected, onToggle, testID }: TagFilterProps) {
  const { getTag } = useWardrobe();

  const grouped = useMemo(() => {
    const groups = new Map<string, string[]>();
    tags.forEach((name) => {
      const key = getTag(name).group ?? UNGROUPED;
      groups.set(key, [...(groups.get(key) ?? []), name]);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === UNGROUPED) return 1;
      if (b === UNGROUPED) return -1;
      return a.localeCompare(b);
    });
  }, [tags, getTag]);

  /** Groups only earn a heading once there is more than one of them. */
  const showGroupLabels = grouped.length > 1;

  return (
    <View testID={testID} style={styles.groups}>
      {grouped.map(([group, groupTags]) => (
        <View key={group} style={styles.group}>
          {showGroupLabels && (
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.groupLabel}>
              {group === UNGROUPED ? 'OTRAS' : group.toUpperCase()}
            </ThemedText>
          )}

          <View style={styles.chips}>
            {groupTags.map((tag) => (
              <TagChip
                key={tag}
                label={tag}
                color={getTag(tag).color}
                selected={selected.includes(tag)}
                onPress={() => onToggle(tag)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  groups: {
    gap: Spacing.three,
  },
  group: {
    gap: Spacing.one,
  },
  groupLabel: {
    letterSpacing: 0.6,
    fontSize: 11,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
