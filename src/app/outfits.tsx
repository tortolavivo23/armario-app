import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { FilterSummary } from '@/components/filter-summary';
import { GarmentDetailModal } from '@/components/garment-detail-modal';
import { GarmentEditModal } from '@/components/garment-edit-modal';
import { OutfitCard } from '@/components/outfit-card';
import { OutfitDetailModal } from '@/components/outfit-detail-modal';
import { OutfitEditorModal } from '@/components/outfit-editor-modal';
import { SearchBar } from '@/components/search-bar';
import { TagFilterButton } from '@/components/tag-filter-button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Accent, BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { GridGap, GridPadding, useGridLayout } from '@/hooks/use-grid-layout';
import { useTheme } from '@/hooks/use-theme';

export default function OutfitsScreen() {
  const { outfits, garments, isLoading, removeOutfit, removeGarment } = useWardrobe();
  const theme = useTheme();
  const { isLandscape, numColumns, cardWidth, imageAspectRatio } = useGridLayout();

  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  // A garment opened from inside an outfit, so it can be inspected without
  // leaving the tab.
  const [garmentId, setGarmentId] = useState<string | null>(null);
  const [editingGarmentId, setEditingGarmentId] = useState<string | null>(null);

  // The wardrobe tab links here with ?outfit=<id> when you tap one of the
  // outfits a garment appears in. Adjusting during render opens it without the
  // extra paint an effect would cost, and the parameter is dropped straight
  // away so going back to this tab later does not reopen it.
  const { outfit: requestedOutfit } = useLocalSearchParams<{ outfit?: string }>();
  // Starts undefined rather than at the current value, so a parameter already
  // there on the first render is acted on instead of being swallowed.
  const [lastRequested, setLastRequested] = useState<string | undefined>(undefined);
  if (requestedOutfit !== lastRequested) {
    setLastRequested(requestedOutfit);
    if (requestedOutfit) {
      setSelectedId(requestedOutfit);
      router.setParams({ outfit: undefined });
    }
  }

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

  const searchRow = (
    <View style={styles.searchRow}>
      <View style={styles.searchFlex}>
        <SearchBar
          testID="outfits-search"
          value={query}
          onChangeText={setQuery}
          compact={isLandscape}
        />
      </View>

      {allTags.length > 0 && (
        <TagFilterButton
          testID="outfits-tag-filter"
          tags={allTags}
          selected={selectedTags}
          onToggle={toggleTag}
          onClear={() => setSelectedTags([])}
          compact={isLandscape}
        />
      )}
    </View>
  );

  const listHeader = (
    <View style={[styles.header, isLandscape && styles.headerLandscape]}>
      {isLandscape && outfits.length > 0 ? (
        <View style={styles.titleSearchRow}>
          {titleBlock}
          <View style={styles.searchFlex}>{searchRow}</View>
        </View>
      ) : (
        <>
          {titleBlock}
          {outfits.length > 0 && searchRow}
        </>
      )}

      {outfits.length > 0 && hasFilters && (
        <FilterSummary
          testID="outfits-clear-filters"
          count={filteredOutfits.length}
          singular="outfit encontrado"
          plural="outfits encontrados"
          onClear={clearFilters}
        />
      )}

      {isEmpty && (
        <EmptyState
          icon="👗"
          title="Todavía no hay outfits"
          hint={
            garments.length === 0
              ? 'Un outfit agrupa prendas que ya tienes. Añade alguna prenda para empezar.'
              : 'Toca «＋ Nuevo» para combinar prendas de tu armario.'
          }
        />
      )}

      {noResults && (
        <EmptyState
          icon="🔍"
          title="Sin resultados"
          hint="Prueba a cambiar la búsqueda o quitar algún filtro."
        />
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
              imageAspectRatio={imageAspectRatio}
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
          // Already on the outfits tab, so this just swaps which one is open.
          onOpenOutfit={(id) => {
            setGarmentId(null);
            setSelectedId(id);
          }}
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
    paddingHorizontal: GridPadding,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: GridGap,
  },
  row: {
    gap: GridGap,
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
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
});
