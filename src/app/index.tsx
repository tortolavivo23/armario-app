import { useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentCard } from '@/components/garment-card';
import { GarmentDetailModal } from '@/components/garment-detail-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';

export default function WardrobeScreen() {
  const { garments, isLoading, removeGarment } = useWardrobe();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedGarment = garments.find((g) => g.id === selectedId) ?? null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ThemedText type="title" style={styles.title}>
          Mi armario
        </ThemedText>

        {!isLoading && garments.length === 0 && (
          <ThemedView type="backgroundElement" style={styles.emptyState}>
            <ThemedText type="subtitle" style={styles.emptyTitle}>
              Todavía no hay prendas
            </ThemedText>
            <ThemedText themeColor="textSecondary" style={styles.emptyHint}>
              Ve a la pestaña Añadir para subir tu primera prenda.
            </ThemedText>
          </ThemedView>
        )}

        <FlatList
          data={garments}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <GarmentCard garment={item} onPress={() => setSelectedId(item.id)} />
          )}
        />

        <GarmentDetailModal
          garment={selectedGarment}
          onClose={() => setSelectedId(null)}
          onDelete={(id) => {
            removeGarment(id);
            setSelectedId(null);
          }}
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  list: {
    paddingHorizontal: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
    gap: Spacing.three,
  },
  row: {
    gap: Spacing.three,
  },
  emptyState: {
    marginHorizontal: Spacing.three,
    marginBottom: Spacing.three,
    padding: Spacing.four,
    borderRadius: Spacing.four,
    gap: Spacing.one,
  },
  emptyTitle: {
    fontSize: 20,
    lineHeight: 26,
  },
  emptyHint: {},
});
