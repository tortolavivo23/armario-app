import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/empty-state';
import { FilterSummary } from '@/components/filter-summary';
import { GarmentCard } from '@/components/garment-card';
import { GarmentDetailModal } from '@/components/garment-detail-modal';
import { GarmentEditModal } from '@/components/garment-edit-modal';
import { OverflowMenu } from '@/components/overflow-menu';
import { SearchBar } from '@/components/search-bar';
import { TagFilterButton } from '@/components/tag-filter-button';
import { TagsManagerModal } from '@/components/tags-manager-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WardrobeSwitcher } from '@/components/wardrobe-switcher';
import { WardrobesManagerModal } from '@/components/wardrobes-manager-modal';
import { BottomTabInset, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useWardrobe } from '@/context/wardrobe-context';
import { GridGap, GridPadding, useGridLayout } from '@/hooks/use-grid-layout';
import { useTheme } from '@/hooks/use-theme';
import { matchesWardrobe } from '@/types/wardrobe';

export default function WardrobeScreen() {
  const { garments, isLoading, removeGarment, activeWardrobe } = useWardrobe();
  const { isDark, toggleDark } = useThemePreference();
  const theme = useTheme();
  const { isLandscape, numColumns, cardWidth, imageAspectRatio } = useGridLayout();

  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isManagingTags, setIsManagingTags] = useState(false);
  const [isManagingWardrobes, setIsManagingWardrobes] = useState(false);

  const selectedGarment = garments.find((g) => g.id === selectedId) ?? null;
  const editingGarment = garments.find((g) => g.id === editingId) ?? null;

  // Everything on this screen is scoped to the wardrobe being viewed, so the
  // tag filter only offers tags you can actually see results for.
  const wardrobeGarments = useMemo(
    () => garments.filter((garment) => matchesWardrobe(garment.wardrobeId, activeWardrobe)),
    [garments, activeWardrobe],
  );

  const allTags = useMemo(
    () =>
      Array.from(new Set(wardrobeGarments.flatMap((g) => g.tags))).sort((a, b) =>
        a.localeCompare(b),
      ),
    [wardrobeGarments],
  );

  const filteredGarments = useMemo(() => {
    const trimmedQuery = query.trim().toLowerCase();
    return wardrobeGarments.filter((garment) => {
      const matchesQuery =
        trimmedQuery.length === 0 || garment.name.toLowerCase().includes(trimmedQuery);
      const matchesTags = selectedTags.every((tag) => garment.tags.includes(tag));
      return matchesQuery && matchesTags;
    });
  }, [wardrobeGarments, query, selectedTags]);

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
  const isEmpty = !isLoading && wardrobeGarments.length === 0;
  const noResults = !isLoading && wardrobeGarments.length > 0 && filteredGarments.length === 0;

  const titleBlock = (
    <View style={styles.titleRow}>
      <WardrobeSwitcher compact={isLandscape} />
      {wardrobeGarments.length > 0 && (
        <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            {wardrobeGarments.length}
          </ThemedText>
        </View>
      )}

      <View style={styles.titleSpacer} />

      <OverflowMenu
        items={[
          {
            label: 'Gestionar armarios',
            icon: '🚪',
            testID: 'menu-manage-wardrobes',
            onPress: () => setIsManagingWardrobes(true),
          },
          {
            label: 'Gestionar etiquetas',
            icon: '🏷️',
            testID: 'menu-manage-tags',
            onPress: () => setIsManagingTags(true),
          },
          {
            label: 'Modo oscuro',
            icon: '🌙',
            testID: 'menu-dark-mode',
            switchValue: isDark,
            onPress: toggleDark,
          },
        ]}
      />
    </View>
  );

  // The tag filter lives behind a button so a long tag list cannot push the
  // grid off the screen.
  const searchRow = (
    <View style={styles.searchRow}>
      <View style={styles.searchFlex}>
        <SearchBar
          testID="wardrobe-search"
          value={query}
          onChangeText={setQuery}
          compact={isLandscape}
        />
      </View>

      {allTags.length > 0 && (
        <TagFilterButton
          testID="wardrobe-tag-filter"
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
      {/* Landscape puts the title and search side by side to leave room for the grid. */}
      {isLandscape && garments.length > 0 ? (
        <View style={styles.titleSearchRow}>
          {titleBlock}
          <View style={styles.searchFlex}>{searchRow}</View>
        </View>
      ) : (
        <>
          {titleBlock}
          {garments.length > 0 && searchRow}
        </>
      )}

      {wardrobeGarments.length > 0 && hasFilters && (
        <FilterSummary
          testID="wardrobe-clear-filters"
          count={filteredGarments.length}
          singular="prenda encontrada"
          plural="prendas encontradas"
          onClear={clearFilters}
        />
      )}

      {isEmpty && (
        <EmptyState
          icon="🧥"
          title={garments.length === 0 ? 'Todavía no hay prendas' : 'Este armario está vacío'}
          hint={
            garments.length === 0
              ? 'Ve a la pestaña Añadir para subir tu primera prenda.'
              : 'Añade prendas aquí o muévelas desde otro armario al editarlas.'
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
          testID="wardrobe-list"
          data={filteredGarments}
          key={numColumns}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <GarmentCard
              garment={item}
              width={cardWidth}
              imageAspectRatio={imageAspectRatio}
              onPress={() => setSelectedId(item.id)}
            />
          )}
        />

        <GarmentDetailModal
          garment={selectedGarment}
          onClose={() => setSelectedId(null)}
          onEdit={(id) => {
            setSelectedId(null);
            setEditingId(id);
          }}
          onDelete={(id) => {
            removeGarment(id);
            setSelectedId(null);
          }}
        />

        <GarmentEditModal garment={editingGarment} onClose={() => setEditingId(null)} />

        <TagsManagerModal visible={isManagingTags} onClose={() => setIsManagingTags(false)} />

        <WardrobesManagerModal
          visible={isManagingWardrobes}
          onClose={() => setIsManagingWardrobes(false)}
        />
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
  countBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    minWidth: 28,
    alignItems: 'center',
  },
});
