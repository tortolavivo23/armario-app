import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './button';
import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing, TagColors } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Tag } from '@/types/tag';

type TagEditorModalProps = {
  tag: Tag | null;
  /** Groups already in use, offered as one-tap shortcuts. */
  knownGroups: string[];
  /** How many garments carry this tag, shown before deleting. */
  usageCount: number;
  onClose: () => void;
  onSave: (changes: { group: string | null; color: string }) => void;
  onDelete: () => void;
};

export function TagEditorModal({
  tag,
  knownGroups,
  usageCount,
  onClose,
  onSave,
  onDelete,
}: TagEditorModalProps) {
  const theme = useTheme();
  const [group, setGroup] = useState(tag?.group ?? '');
  const [color, setColor] = useState(tag?.color ?? TagColors[0]);

  return (
    <Modal visible={tag != null} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {tag && (
            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              <View style={styles.header}>
                <ThemedText type="subtitle" style={styles.title}>
                  {tag.name}
                </ThemedText>
                <Pressable testID="tag-editor-close" onPress={onClose} hitSlop={12}>
                  <View style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="smallBold">✕</ThemedText>
                  </View>
                </Pressable>
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                {usageCount === 1 ? 'Usada en 1 prenda' : `Usada en ${usageCount} prendas`}
              </ThemedText>

              <View style={styles.preview}>
                <TagChip label={tag.name} color={color} />
                <TagChip label={tag.name} color={color} selected />
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                  GRUPO
                </ThemedText>
                <TextInput
                  testID="tag-editor-group"
                  value={group}
                  onChangeText={setGroup}
                  placeholder="Ej. estación, tipo, ocasión"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      color: theme.text,
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                  ]}
                />

                {knownGroups.length > 0 && (
                  <View style={styles.groupShortcuts}>
                    {knownGroups.map((known) => (
                      <Pressable
                        key={known}
                        testID={`tag-editor-group-${known}`}
                        onPress={() => setGroup(known)}>
                        <View
                          style={[
                            styles.groupShortcut,
                            {
                              backgroundColor: theme.backgroundElement,
                              borderColor: group === known ? color : theme.border,
                            },
                          ]}>
                          <ThemedText type="small">{known}</ThemedText>
                        </View>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                  COLOR
                </ThemedText>
                <View style={styles.swatches}>
                  {TagColors.map((option) => (
                    <Pressable
                      key={option}
                      testID={`tag-editor-color-${option}`}
                      onPress={() => setColor(option)}>
                      <View
                        style={[
                          styles.swatch,
                          { backgroundColor: option },
                          option === color && styles.swatchSelected,
                        ]}>
                        {option === color && (
                          <ThemedText type="smallBold" style={styles.swatchCheck}>
                            ✓
                          </ThemedText>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.actions}>
                <Button
                  testID="tag-editor-save"
                  label="Guardar"
                  onPress={() => onSave({ group: group.trim() || null, color })}
                />
                <Button
                  testID="tag-editor-delete"
                  label="Quitar color y grupo"
                  variant="secondary"
                  onPress={onDelete}
                />
                <ThemedText type="small" themeColor="textSecondary" style={styles.deleteHint}>
                  La etiqueta seguirá en las prendas que la usan; solo se olvida su color y su grupo.
                </ThemedText>
              </View>
            </ScrollView>
          )}
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
    fontSize: 28,
    lineHeight: 36,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  label: {
    letterSpacing: 0.6,
    fontSize: 12,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  groupShortcuts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  groupShortcut: {
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  swatch: {
    width: 44,
    height: 44,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  swatchCheck: {
    color: '#ffffff',
    fontSize: 18,
  },
  actions: {
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  deleteHint: {
    textAlign: 'center',
  },
});
