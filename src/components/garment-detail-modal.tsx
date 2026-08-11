import { Image } from 'expo-image';
import { Alert, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { Garment } from '@/types/garment';

type GarmentDetailModalProps = {
  garment: Garment | null;
  onClose: () => void;
  onDelete: (id: string) => void;
};

export function GarmentDetailModal({ garment, onClose, onDelete }: GarmentDetailModalProps) {
  return (
    <Modal visible={garment != null} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {garment && (
            <>
              <Image source={{ uri: garment.imageUri }} style={styles.image} contentFit="cover" />

              <View style={styles.content}>
                <View style={styles.header}>
                  <ThemedText type="subtitle" style={styles.title}>
                    {garment.name}
                  </ThemedText>
                  <Pressable onPress={onClose} hitSlop={12}>
                    <ThemedText type="title" style={styles.closeIcon}>
                      ✕
                    </ThemedText>
                  </Pressable>
                </View>

                {garment.tags.length > 0 && (
                  <View style={styles.tags}>
                    {garment.tags.map((tag) => (
                      <TagChip key={tag} label={tag} />
                    ))}
                  </View>
                )}

                <Pressable
                  style={styles.deleteButton}
                  onPress={() =>
                    Alert.alert('Eliminar prenda', `¿Seguro que quieres eliminar "${garment.name}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      {
                        text: 'Eliminar',
                        style: 'destructive',
                        onPress: () => onDelete(garment.id),
                      },
                    ])
                  }>
                  <ThemedText type="smallBold" themeColor="text">
                    Eliminar prenda
                  </ThemedText>
                </Pressable>
              </View>
            </>
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
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  title: {
    flex: 1,
  },
  closeIcon: {
    fontSize: 20,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  deleteButton: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#E5484D',
  },
});
