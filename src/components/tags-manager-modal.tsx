import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TagChip } from './tag-chip';
import { TagEditorModal } from './tag-editor-modal';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';
import { Tag } from '@/types/tag';

const UNGROUPED = '__ungrouped__';

type TagsManagerModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Colours and groups are set up once in a while, so this lives behind the
 * wardrobe's overflow menu rather than taking up a tab.
 */
export function TagsManagerModal({ visible, onClose }: TagsManagerModalProps) {
  const { garments, outfits, tags, getTag, upsertTag, removeTag } = useWardrobe();
  const theme = useTheme();
  const [editingName, setEditingName] = useState<string | null>(null);

  // Tags a garment or an outfit uses but that were never opened in the editor
  // still belong here, so the list is the union of all three sources.
  const allTags: Tag[] = useMemo(() => {
    const names = new Set([
      ...tags.map((tag) => tag.name),
      ...garments.flatMap((g) => g.tags),
      ...outfits.flatMap((o) => o.tags),
    ]);
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map(getTag);
  }, [tags, garments, outfits, getTag]);

  /** How many garments and outfits carry each tag. */
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    [...garments, ...outfits].forEach((item) =>
      item.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
    );
    return counts;
  }, [garments, outfits]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Tag[]>();
    allTags.forEach((tag) => {
      const key = tag.group ?? UNGROUPED;
      groups.set(key, [...(groups.get(key) ?? []), tag]);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => {
      // Ungrouped tags go last, everything else alphabetically.
      if (a === UNGROUPED) return 1;
      if (b === UNGROUPED) return -1;
      return a.localeCompare(b);
    });
  }, [allTags]);

  const knownGroups = useMemo(
    () =>
      Array.from(
        new Set(allTags.map((tag) => tag.group).filter((g): g is string => g != null)),
      ).sort((a, b) => a.localeCompare(b)),
    [allTags],
  );

  const editingTag = editingName ? getTag(editingName) : null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView testID="tags-manager" contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <ThemedText type="subtitle" style={styles.title}>
                  Etiquetas
                </ThemedText>
                {allTags.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {allTags.length}
                    </ThemedText>
                  </View>
                )}
              </View>

              <Pressable testID="tags-manager-close" onPress={onClose} hitSlop={12}>
                <View style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">✕</ThemedText>
                </View>
              </Pressable>
            </View>

            {allTags.length === 0 ? (
              <ThemedView
                type="backgroundElement"
                style={[styles.emptyState, { borderColor: theme.border }]}>
                <ThemedText style={styles.emptyIcon}>🏷️</ThemedText>
                <ThemedText type="smallBold" style={styles.emptyTitle}>
                  Todavía no hay etiquetas
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
                  Añade etiquetas a tus prendas y aquí podrás darles color y agruparlas.
                </ThemedText>
              </ThemedView>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  Toca una etiqueta para cambiar su color o su grupo.
                </ThemedText>

                {grouped.map(([group, groupTags]) => (
                  <View key={group} style={styles.group}>
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.groupLabel}>
                      {group === UNGROUPED ? 'SIN GRUPO' : group.toUpperCase()}
                    </ThemedText>

                    <View style={styles.groupTags}>
                      {groupTags.map((tag) => (
                        <Pressable
                          key={tag.name}
                          testID={`tags-manager-tag-${tag.name}`}
                          onPress={() => setEditingName(tag.name)}>
                          <View style={styles.tagRow}>
                            <TagChip label={tag.name} color={tag.color} />
                            <ThemedText type="small" themeColor="textSecondary">
                              {usage.get(tag.name) ?? 0}
                            </ThemedText>
                          </View>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}
          </ScrollView>

          <TagEditorModal
            tag={editingTag}
            knownGroups={knownGroups}
            usageCount={editingName ? (usage.get(editingName) ?? 0) : 0}
            onClose={() => setEditingName(null)}
            onSave={(changes) => {
              if (editingName) upsertTag(editingName, changes);
              setEditingName(null);
            }}
            onDelete={() => {
              if (editingName) removeTag(editingName);
              setEditingName(null);
            }}
          />
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
  countBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    minWidth: 28,
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  group: {
    gap: Spacing.two,
  },
  groupLabel: {
    letterSpacing: 0.6,
    fontSize: 12,
  },
  groupTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: Spacing.two,
  },
  emptyTitle: {
    fontSize: 17,
  },
  emptyHint: {
    textAlign: 'center',
  },
});
