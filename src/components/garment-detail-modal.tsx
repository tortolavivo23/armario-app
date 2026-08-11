import { Alert, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './button';
import { GarmentImage } from './garment-image';
import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Garment } from '@/types/garment';

type GarmentDetailModalProps = {
  garment: Garment | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function GarmentDetailModal({ garment, onClose, onEdit, onDelete }: GarmentDetailModalProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  function confirmDelete(target: Garment) {
    Alert.alert('Eliminar prenda', `¿Seguro que quieres eliminar "${target.name}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(target.id) },
    ]);
  }

  return (
    <Modal visible={garment != null} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {garment && (
            <View style={[styles.body, isLandscape && styles.bodyLandscape]}>
              <View style={isLandscape ? styles.imageWrapperLandscape : undefined}>
                <GarmentImage
                  uri={garment.imageUri}
                  placeholderSize={80}
                  style={isLandscape ? styles.imageLandscape : styles.image}
                />

                <Pressable
                  testID="garment-detail-close"
                  onPress={onClose}
                  hitSlop={12}
                  style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                  <View style={styles.closeButtonInner}>
                    <ThemedText type="smallBold" style={styles.closeIcon}>
                      ✕
                    </ThemedText>
                  </View>
                </Pressable>
              </View>

              <View style={styles.content}>
                <ScrollView contentContainerStyle={styles.contentScroll}>
                  <ThemedText type="subtitle" style={styles.title}>
                    {garment.name}
                  </ThemedText>

                  <ThemedText type="small" themeColor="textSecondary">
                    Añadida el {formatDate(garment.createdAt)}
                  </ThemedText>

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                    ETIQUETAS
                  </ThemedText>

                  {garment.tags.length > 0 ? (
                    <View style={styles.tags}>
                      {garment.tags.map((tag) => (
                        <TagChip key={tag} label={tag} />
                      ))}
                    </View>
                  ) : (
                    <ThemedText themeColor="textSecondary">Esta prenda no tiene etiquetas.</ThemedText>
                  )}
                </ScrollView>

                <View style={styles.actions}>
                  <Button
                    testID="garment-detail-edit"
                    label="Editar prenda"
                    onPress={() => onEdit(garment.id)}
                  />
                  <Button
                    testID="garment-detail-delete"
                    label="Eliminar prenda"
                    variant="danger"
                    onPress={() => confirmDelete(garment)}
                  />
                </View>
              </View>
            </View>
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
  body: {
    flex: 1,
  },
  bodyLandscape: {
    flexDirection: 'row',
  },
  imageWrapperLandscape: {
    flex: 1,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
  },
  imageLandscape: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
  },
  closeButtonInner: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  closeIcon: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.75,
  },
  content: {
    flex: 1,
    padding: Spacing.four,
  },
  contentScroll: {
    gap: Spacing.two,
    paddingBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two,
  },
  label: {
    letterSpacing: 0.6,
    fontSize: 12,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
    paddingTop: Spacing.three,
  },
});
