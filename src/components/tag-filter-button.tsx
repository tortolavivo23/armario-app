import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { SearchBar } from './search-bar';
import { TagFilter } from './tag-filter';
import { ThemedText } from './themed-text';

import { Accent, CardShadow, MaxContentWidth, Radius, Spacing, tagTint } from '@/constants/theme';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import { useTheme } from '@/hooks/use-theme';

/**
 * Below this many tags the list fits on screen and a search field is just
 * another thing between you and the chips.
 */
const SearchFrom = 6;

/** Lowercased and stripped of accents, so "estacion" finds "estación". */
function fold(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

type TagFilterButtonProps = {
  /** Every tag that can be filtered on, already sorted. */
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  /** Unselects every tag. Leaves the text search alone. */
  onClear: () => void;
  /** Shorter, to line up with the compact search bar in landscape. */
  compact?: boolean;
  /** The chip list keeps this id; the button and the sheet suffix it. */
  testID: string;
};

/**
 * Filter button that opens the tags in a sheet, grouped by category.
 *
 * They used to sit under the search bar, which worked for a handful of tags and
 * pushed the grid off the screen once there were many.
 */
export function TagFilterButton({
  tags,
  selected,
  onToggle,
  onClear,
  compact = false,
  testID,
}: TagFilterButtonProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  // The sheet sits on the bottom edge, so without this the keyboard the search
  // field summons covers the whole thing.
  const keyboardInset = useKeyboardInset();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const isActive = selected.length > 0;
  const canSearch = tags.length >= SearchFrom;

  const shown = useMemo(() => {
    const trimmed = fold(query.trim());
    if (!canSearch || trimmed.length === 0) return tags;
    return tags.filter((tag) => fold(tag).includes(trimmed));
  }, [tags, query, canSearch]);

  // Reopening starts from the whole list rather than wherever the last search
  // left off; the chips you picked are remembered, the typing is not.
  function close() {
    setOpen(false);
    setQuery('');
  }

  return (
    <>
      <Pressable
        testID={`${testID}-button`}
        accessibilityRole="button"
        accessibilityLabel={
          isActive ? `Filtrar por etiqueta, ${selected.length} activas` : 'Filtrar por etiqueta'
        }
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => pressed && styles.pressed}>
        <View
          style={[
            styles.button,
            compact && styles.buttonCompact,
            {
              backgroundColor: isActive ? tagTint(Accent) : theme.backgroundElement,
              borderColor: isActive ? Accent : theme.border,
            },
          ]}>
          <FunnelIcon color={isActive ? Accent : theme.textSecondary} />

          {isActive && (
            <View style={[styles.badge, { borderColor: theme.background }]}>
              <ThemedText type="smallBold" style={styles.badgeLabel}>
                {selected.length}
              </ThemedText>
            </View>
          )}
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={close}>
        <Pressable
          testID={`${testID}-backdrop`}
          style={[styles.backdrop, { paddingBottom: keyboardInset }]}
          onPress={close}>
          {/* Claiming the touch keeps taps on the sheet from dismissing it. */}
          <View
            onStartShouldSetResponder={() => true}
            style={[
              styles.sheet,
              CardShadow,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                // The navigation bar is behind the keyboard while it is up, so
                // padding for it would only add a gap.
                paddingBottom: (keyboardInset > 0 ? 0 : insets.bottom) + Spacing.three,
              },
            ]}>
            <View style={styles.handleRow}>
              <View style={[styles.handle, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.header}>
              <ThemedText type="subtitle" style={styles.headerTitle}>
                Filtrar por etiqueta
              </ThemedText>
              <Pressable
                testID={`${testID}-close`}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={close}
                hitSlop={12}
                style={({ pressed }) => pressed && styles.pressed}>
                <View style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">✕</ThemedText>
                </View>
              </Pressable>
            </View>

            {canSearch && (
              <View style={styles.search}>
                <SearchBar
                  testID={`${testID}-search`}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar etiqueta…"
                  compact
                />
              </View>
            )}

            <ScrollView contentContainerStyle={styles.list} keyboardShouldPersistTaps="handled">
              {shown.length > 0 ? (
                <TagFilter testID={testID} tags={shown} selected={selected} onToggle={onToggle} />
              ) : (
                <ThemedText
                  testID={`${testID}-no-matches`}
                  type="small"
                  themeColor="textSecondary">
                  Ninguna etiqueta coincide con «{query.trim()}».
                </ThemedText>
              )}
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <ThemedText type="small" themeColor="textSecondary">
                {selected.length === 0
                  ? 'Ningún filtro activo'
                  : `${selected.length} ${selected.length === 1 ? 'etiqueta' : 'etiquetas'}`}
              </ThemedText>

              {isActive && (
                <Pressable
                  testID={`${testID}-clear`}
                  accessibilityRole="button"
                  onPress={onClear}
                  hitSlop={10}
                  style={({ pressed }) => pressed && styles.pressed}>
                  <ThemedText type="smallBold" style={styles.clearLabel}>
                    Quitar filtros
                  </ThemedText>
                </Pressable>
              )}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/** The usual three-bar funnel, drawn rather than pulled from an icon font. */
function FunnelIcon({ color }: { color: string }) {
  return (
    <View style={styles.icon}>
      {[16, 11, 6].map((width) => (
        <View key={width} style={[styles.bar, { width, backgroundColor: color }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCompact: {
    width: 44,
    height: 44,
  },
  icon: {
    alignItems: 'center',
    gap: 3,
  },
  bar: {
    height: 2,
    borderRadius: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: Radius.pill,
    borderWidth: 2,
    backgroundColor: Accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLabel: {
    color: '#ffffff',
    fontSize: 11,
    lineHeight: 14,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    maxHeight: '75%',
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
  },
  handleRow: {
    alignItems: 'center',
    paddingTop: Spacing.two,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: Radius.pill,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 26,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  clearLabel: {
    color: Accent,
  },
});
