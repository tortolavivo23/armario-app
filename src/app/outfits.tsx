import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentDetailModal } from '@/components/garment-detail-modal';
import { GarmentEditModal } from '@/components/garment-edit-modal';
import { OutfitCard } from '@/components/outfit-card';
import { OutfitDetailModal } from '@/components/outfit-detail-modal';
import { OutfitEditorModal } from '@/components/outfit-editor-modal';
import { TagFilter } from '@/components/tag-filter';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  Accent,
  BottomTabInset,
  MaxContentWidth,
  MinCardWidth,
  Radius,
  Spacing,
} from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';

const GRID_PADDING = Spacing.four;
const GRID_GAP = Spacing.three;

export default function OutfitsScreen() {
  const { outfits, garments, isLoading, removeOutfit, removeGarment } = useWardrobe();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // A garment opened from inside an outfit, so it can be inspected without
  // leaving the tab.
  const [garmentId, setGarmentId] = useState<string | null>(null);
  const [editingGarmentId, setEditingGarmentId] = useState<string | null>(null);

  const selectedOutfit = outfits.find((outfit) => outfit.id === selectedId) ?? null;
  const editingOutfit = outfits.find((outfit) => outfit.id === editingId) ?? null;
  const openGarment = garments.find((garment) => garment.id === garmentId) ?? null;
  const editingGarment = garments.find((garment) => garment.id === editingGarmentId) ?? null;

  const allTags = useMemo(
    () => Array.from(new Set(outfits.flatMap((o) => o.tags))).sort((a, b) => a.localeCompare(b)),
    [outfits],
  );

  const filteredOutfits = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    return outfits.filter((outfit) => {
      const matchesQuery =
        trimmedQuery.length === 0 || outfit.name.toLowerCase().includes(trimmedQuery);
      const matchesTags = selectedTags.every((tag) => outfit.tags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }, [outfits, query, selectedTags]);

  function toggleTag(tag: string) {
    setSelectedTags((current) =>
      current.includes(tag) ? current.filter((t) => t !== tag) : [...current, tag],
    );
  }

  function clearFilters() {
    setQuery('');
    setSelectedTags([]);
  }

  // Exact card widths keep a lone card in the last row from stretching across it.
  const availableWidth = Math.min(width, MaxContentWidth) - GRID_PADDING * 2;
  const numColumns = Math.max(2, Math.floor(availableWidth / MinCardWidth));
  const cardWidth = (availableWidth - GRID_GAP * (numColumns - 1)) / numColumns;

  const hasFilters = query.trim().length > 0 || selectedTags.length > 0;
  const isEmpty = !isLoading && outfits.length === 0;
  const noResults = !isLoading && outfits.length > 0 && filteredOutfits.length === 0;

  const titleBlock = (
    <View style={styles.titleRow}>
      <ThemedText type="title" style={[styles.title, isLandscape && styles.titleLandscape]}>
        Outfits
      </ThemedText>
      {outfits.length > 0 && (
        <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {outfits.length}
          </ThemedText>
        </View>
      )}

      <View style={styles.titleSpacer} />

      <Pressable
        testID="outfits-new"
        accessibilityRole="button"
        accessibilityLabel="Nuevo outfit"
        onPress={() => setIsCreating(true)}
        hitSlop={10}
        style={({ pressed }) => pressed && styles.pressed}>
        <View style={styles.newButton}>
          <ThemedText type="smallBold" style={styles.newButtonLabel}>
            ＋ Nuevo
          </ThemedText>
        </View>
      </Pressable>
    </View>
  );

  const searchBar = (
    <View
      style={[
        styles.searchBar,
        isLandscape && styles.searchBarLandscape,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <ThemedText themeColor="textSecondary" style={styles.searchIcon}>
        🔍
      </ThemedText>
      <TextInput
        testID="outfits-search"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por nombre…"
        placeholderTextColor={theme.textSecondary}
        style={[styles.searchInput, { color: theme.text }]}
      />
      {query.length > 0 && (
        <Pressable testID="outfits-search-clear" onPress={() => setQuery('')} hitSlop={10}>
          <ThemedText themeColor="textSecondary">✕</ThemedText>
        </Pressable>
      )}
    </View>
  );

  const listHeader = (
    <View style={[styles.header, isLandscape && styles.headerLandscape]}>
      {isLandscape && outfits.length > 0 ? (
        <View style={styles.titleSearchRow}>
          {titleBlock}
          <View style={styles.searchFlex}>{searchBar}</View>
        </View>
      ) : (
        <>
          {titleBlock}
          {outfits.length > 0 && searchBar}
        </>
      )}

      {outfits.length > 0 && (
        <>
          {allTags.length > 0 && (
            <TagFilter
              testID="outfits-tag-filter"
              tags={allTags}
              selected={selectedTags}
              onToggle={toggleTag}
            />
          )}

          {hasFilters && (
            <View style={styles.resultRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {filteredOutfits.length}{' '}
                {filteredOutfits.length === 1 ? 'outfit encontrado' : 'outfits encontrados'}
              </ThemedText>
              <Pressable testID="outfits-clear-filters" onPress={clearFilters} hitSlop={10}>
                <ThemedText type="smallBold" style={styles.clearLink}>
                  Limpiar filtros
                </ThemedText>
              </Pressable>
            </View>
          )}
        </>
      )}

      {isEmpty && (
        <ThemedView
          type="backgroundElement"
          style={[styles.emptyState, { borderColor: theme.border }]}>
          <ThemedText style={styles.emptyIcon}>👗</ThemedText>
          <ThemedText type="smallBold" style={styles.emptyTitle}>
            Todavía no hay outfits
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
            {garments.length === 0
              ? 'Un outfit agrupa prendas que ya tienes. Añade alguna prenda para empezar.'
              : 'Toca «＋ Nuevo» para combinar prendas de tu armario.'}
          </ThemedText>
        </ThemedView>
      )}

      {noResults && (
        <ThemedView
          type="backgroundElement"
          style={[styles.emptyState, { borderColor: theme.border }]}>
          <ThemedText style={styles.emptyIcon}>🔍</ThemedText>
          <ThemedText type="smallBold" style={styles.emptyTitle}>
            Sin resultados
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
            Prueba a cambiar la búsqueda o quitar algún filtro.
          </ThemedText>
        </ThemedView>
      )}
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <FlatList
          testID="outfits-list"
          data={filteredOutfits}
          key={numColumns}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <OutfitCard
              outfit={item}
              width={cardWidth}
              imageAspectRatio={isLandscape ? 3 / 2 : 1}
              onPress={() => setSelectedId(item.id)}
            />
          )}
        />

        <OutfitDetailModal
          outfit={selectedOutfit}
          onClose={() => setSelectedId(null)}
          onEdit={(id) => {
            setSelectedId(null);
            setEditingId(id);
          }}
          onDelete={(id) => {
            removeOutfit(id);
            setSelectedId(null);
          }}
          onOpenGarment={(id) => setGarmentId(id)}
        />

        <OutfitEditorModal
          visible={isCreating || editingOutfit != null}
          outfit={editingOutfit}
          onClose={() => {
            setIsCreating(false);
            setEditingId(null);
          }}
        />

        <GarmentDetailModal
          garment={openGarment}
          onClose={() => setGarmentId(null)}
          onEdit={(id) => {
            setGarmentId(null);
            setEditingGarmentId(id);
          }}
          onDelete={(id) => {
            removeGarment(id);
            setGarmentId(null);
          }}
        />

        <GarmentEditModal garment={editingGarment} onClose={() => setEditingGarmentId(null)} />
      </SafeAreaView>
    </ThemedView>
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
  list: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: GRID_GAP,
  },
  row: {
    gap: GRID_GAP,
  },
  header: {
    gap: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.one,
  },
  headerLandscape: {
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  titleSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
  },
  searchFlex: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  titleSpacer: {
    flex: 1,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
  },
  titleLandscape: {
    fontSize: 24,
    lineHeight: 30,
  },
  countBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    minWidth: 28,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  newButton: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.pill,
    backgroundColor: Accent,
  },
  newButtonLabel: {
    color: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  searchBarLandscape: {
    minHeight: 44,
  },
  searchIcon: {
    fontSize: 15,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  clearLink: {
    color: Accent,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    marginTop: Spacing.two,
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
