import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentCard } from '@/components/garment-card';
import { GarmentDetailModal } from '@/components/garment-detail-modal';
import { GarmentEditModal } from '@/components/garment-edit-modal';
import { OverflowMenu } from '@/components/overflow-menu';
import { TagFilter } from '@/components/tag-filter';
import { TagsManagerModal } from '@/components/tags-manager-modal';
import { WardrobeSwitcher } from '@/components/wardrobe-switcher';
import { WardrobesManagerModal } from '@/components/wardrobes-manager-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  MaxContentWidth,
  MinCardWidth,
  Radius,
  Spacing,
} from '@/constants/theme';
import { useThemePreference } from '@/context/theme-context';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';
import { matchesWardrobe } from '@/types/wardrobe';

const GRID_PADDING = Spacing.four;
const GRID_GAP = Spacing.three;

export default function WardrobeScreen() {
  const { garments, isLoading, removeGarment, activeWardrobe } = useWardrobe();
  const { isDark, toggleDark } = useThemePreference();
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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
      const matchesQuery = trimmedQuery.length === 0 || garment.name.toLowerCase().includes(trimmedQuery);
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

  // Exact card widths keep a lone card in the last row from stretching across it.
  const availableWidth = Math.min(width, MaxContentWidth) - GRID_PADDING * 2;
  const numColumns = Math.max(2, Math.floor(availableWidth / MinCardWidth));
  const cardWidth = (availableWidth - GRID_GAP * (numColumns - 1)) / numColumns;

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
        testID="wardrobe-search"
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar por nombre…"
        placeholderTextColor={theme.textSecondary}
        style={[styles.searchInput, { color: theme.text }]}
      />
      {query.length > 0 && (
        <Pressable testID="wardrobe-search-clear" onPress={() => setQuery('')} hitSlop={10}>
          <ThemedText themeColor="textSecondary">✕</ThemedText>
        </Pressable>
      )}
    </View>
  );

  const listHeader = (
    <View style={[styles.header, isLandscape && styles.headerLandscape]}>
      {/* Landscape puts the title and search side by side to leave room for the grid. */}
      {isLandscape && garments.length > 0 ? (
        <View style={styles.titleSearchRow}>
          {titleBlock}
          <View style={styles.searchFlex}>{searchBar}</View>
        </View>
      ) : (
        <>
          {titleBlock}
          {garments.length > 0 && searchBar}
        </>
      )}

      {garments.length > 0 && (
        <>
          {allTags.length > 0 && (
            <TagFilter
              testID="wardrobe-tag-filter"
              tags={allTags}
              selected={selectedTags}
              onToggle={toggleTag}
            />
          )}

          {hasFilters && (
            <View style={styles.resultRow}>
              <ThemedText type="small" themeColor="textSecondary">
                {filteredGarments.length}{' '}
                {filteredGarments.length === 1 ? 'prenda encontrada' : 'prendas encontradas'}
              </ThemedText>
              <Pressable testID="wardrobe-clear-filters" onPress={clearFilters} hitSlop={10}>
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
          <ThemedText style={styles.emptyIcon}>🧥</ThemedText>
          <ThemedText type="smallBold" style={styles.emptyTitle}>
            {garments.length === 0 ? 'Todavía no hay prendas' : 'Este armario está vacío'}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
            {garments.length === 0
              ? 'Ve a la pestaña Añadir para subir tu primera prenda.'
              : 'Añade prendas aquí o muévelas desde otro armario al editarlas.'}
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
              imageAspectRatio={isLandscape ? 3 / 2 : 1}
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
  tagFilterGroups: {
    gap: Spacing.three,
  },
  tagFilterGroup: {
    gap: Spacing.one,
  },
  groupLabel: {
    letterSpacing: 0.6,
    fontSize: 11,
  },
  tagFilter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  clearLink: {
    color: '#208AEF',
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
