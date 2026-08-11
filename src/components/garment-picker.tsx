import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { GarmentImage } from './garment-image';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Accent, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';

type GarmentPickerProps = {
  /** Ids currently in the outfit, in the order they were added. */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  testIDPrefix?: string;
};

/**
 * Picks garments for an outfit. Selection is a toggle over a set, so a garment
 * can never end up twice in the same outfit no matter how often it is tapped.
 */
export function GarmentPicker({
  selectedIds,
  onChange,
  testIDPrefix = 'outfit-form',
}: GarmentPickerProps) {
  const theme = useTheme();
  const { garments, getTag } = useWardrobe();
  const [query, setQuery] = useState('');

  const selected = useMemo(
    () => new Set(selectedIds),
    [selectedIds],
  );

  const visible = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length === 0) return garments;
    return garments.filter((garment) => garment.name.toLowerCase().includes(trimmed));
  }, [garments, query]);

  function toggle(id: string) {
    onChange(selected.has(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  }

  return (
    <View testID={`${testIDPrefix}-garments`} style={styles.section}>
      <View style={styles.labelRow}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
          PRENDAS
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary" testID={`${testIDPrefix}-garment-count`}>
          {selectedIds.length} seleccionadas
        </ThemedText>
      </View>

      {garments.length === 0 ? (
        <ThemedView
          type="backgroundElement"
          style={[styles.emptyState, { borderColor: theme.border }]}>
          <ThemedText style={styles.emptyIcon}>🧥</ThemedText>
          <ThemedText type="smallBold">Todavía no hay prendas</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
            Un outfit se arma con prendas ya guardadas. Añade alguna en la pestaña Añadir.
          </ThemedText>
        </ThemedView>
      ) : (
        <>
          <TextInput
            testID={`${testIDPrefix}-garment-search`}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar prenda…"
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          />

          {visible.length === 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Ninguna prenda coincide con «{query.trim()}».
            </ThemedText>
          )}

          <View style={styles.list}>
            {visible.map((garment) => {
              const isSelected = selected.has(garment.id);

              return (
                <Pressable
                  key={garment.id}
                  testID={`${testIDPrefix}-garment-${garment.id}`}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => toggle(garment.id)}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedView
                    type={isSelected ? 'backgroundSelected' : 'backgroundElement'}
                    style={[
                      styles.row,
                      { borderColor: isSelected ? Accent : theme.border },
                    ]}>
                    <GarmentImage
                      uri={garment.imageUris[0] ?? null}
                      placeholderSize={18}
                      style={styles.thumbnail}
                    />

                    <View style={styles.rowText}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {garment.name}
                      </ThemedText>
                      {garment.tags.length > 0 && (
                        <View style={styles.tagRow}>
                          {garment.tags.slice(0, 3).map((tag) => (
                            <View
                              key={tag}
                              style={[styles.tagDot, { backgroundColor: getTag(tag).color }]}
                            />
                          ))}
                          <ThemedText
                            type="small"
                            themeColor="textSecondary"
                            numberOfLines={1}
                            style={styles.tagNames}>
                            {garment.tags.join(' · ')}
                          </ThemedText>
                        </View>
                      )}
                    </View>

                    <View
                      style={[
                        styles.check,
                        isSelected
                          ? { backgroundColor: Accent, borderColor: Accent }
                          : { borderColor: theme.border },
                      ]}>
                      {isSelected && (
                        <ThemedText type="smallBold" style={styles.checkMark}>
                          ✓
                        </ThemedText>
                      )}
                    </View>
                  </ThemedView>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  list: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: Radius.small,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half + 1,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  tagNames: {
    flex: 1,
    marginLeft: Spacing.half,
  },
  check: {
    width: 26,
    height: 26,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: Spacing.one,
  },
  emptyHint: {
    textAlign: 'center',
  },
});
