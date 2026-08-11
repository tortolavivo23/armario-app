import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './button';
import { GarmentImage } from './garment-image';
import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';
import { Outfit } from '@/types/outfit';

type OutfitDetailModalProps = {
  outfit: Outfit | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** Opens one of the garments of the outfit in the wardrobe's detail view. */
  onOpenGarment?: (id: string) => void;
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function OutfitDetailModal({
  outfit,
  onClose,
  onEdit,
  onDelete,
  onOpenGarment,
}: OutfitDetailModalProps) {
  const theme = useTheme();
  const { garments, getTag } = useWardrobe();

  const outfitGarments =
    outfit?.garmentIds
      .map((id) => garments.find((garment) => garment.id === id))
      .filter((garment) => garment != null) ?? [];

  function confirmDelete(target: Outfit) {
    Alert.alert(
      'Eliminar outfit',
      `¿Seguro que quieres eliminar "${target.name}"? Las prendas seguirán en tu armario.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => onDelete(target.id) },
      ],
    );
  }

  return (
    <Modal visible={outfit != null} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {outfit && (
            <>
              <ScrollView testID="outfit-detail" contentContainerStyle={styles.content}>
                <View style={styles.header}>
                  <ThemedText type="subtitle" style={styles.title}>
                    {outfit.name}
                  </ThemedText>

                  <Pressable testID="outfit-detail-close" onPress={onClose} hitSlop={12}>
                    <View style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                      <ThemedText type="smallBold">✕</ThemedText>
                    </View>
                  </Pressable>
                </View>

                <ThemedText type="small" themeColor="textSecondary">
                  Creado el {formatDate(outfit.createdAt)}
                </ThemedText>

                {outfit.description.length > 0 && (
                  <>
                    <View style={[styles.divider, { backgroundColor: theme.border }]} />
                    <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                      DESCRIPCIÓN
                    </ThemedText>
                    <ThemedText testID="outfit-detail-description" style={styles.description}>
                      {outfit.description}
                    </ThemedText>
                  </>
                )}

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                  PRENDAS ({outfitGarments.length})
                </ThemedText>

                {outfitGarments.length > 0 ? (
                  <View style={styles.garments}>
                    {outfitGarments.map((garment) => (
                      <Pressable
                        key={garment.id}
                        testID={`outfit-detail-garment-${garment.id}`}
                        disabled={!onOpenGarment}
                        onPress={() => onOpenGarment?.(garment.id)}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedView
                          type="backgroundElement"
                          style={[styles.garmentRow, { borderColor: theme.border }]}>
                          <GarmentImage
                            uri={garment.imageUris[0] ?? null}
                            placeholderSize={18}
                            style={styles.thumbnail}
                          />
                          <View style={styles.garmentText}>
                            <ThemedText type="smallBold" numberOfLines={1}>
                              {garment.name}
                            </ThemedText>
                            {garment.tags.length > 0 && (
                              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                                {garment.tags.join(' · ')}
                              </ThemedText>
                            )}
                          </View>
                        </ThemedView>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <ThemedText themeColor="textSecondary">
                    Este outfit se ha quedado sin prendas.
                  </ThemedText>
                )}

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                  ETIQUETAS
                </ThemedText>

                {outfit.tags.length > 0 ? (
                  <View style={styles.tags}>
                    {outfit.tags.map((tag) => (
                      <TagChip key={tag} label={tag} color={getTag(tag).color} />
                    ))}
                  </View>
                ) : (
                  <ThemedText themeColor="textSecondary">Este outfit no tiene etiquetas.</ThemedText>
                )}
              </ScrollView>

              <View style={styles.actions}>
                <Button
                  testID="outfit-detail-edit"
                  label="Editar outfit"
                  onPress={() => onEdit(outfit.id)}
                />
                <Button
                  testID="outfit-detail-delete"
                  label="Eliminar outfit"
                  variant="danger"
                  onPress={() => confirmDelete(outfit)}
                />
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
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
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
  pressed: {
    opacity: 0.75,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.two,
  },
  label: {
    letterSpacing: 0.6,
    fontSize: 12,
  },
  description: {
    lineHeight: 24,
  },
  garments: {
    gap: Spacing.two,
  },
  garmentRow: {
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
  garmentText: {
    flex: 1,
    gap: Spacing.half,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    gap: Spacing.two,
    padding: Spacing.four,
    paddingTop: Spacing.three,
  },
});
