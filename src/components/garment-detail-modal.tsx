import { Alert, Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentGallery } from './garment-gallery';
import { OverflowMenu } from './overflow-menu';
import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';
import { Garment } from '@/types/garment';

type GarmentDetailModalProps = {
  garment: Garment | null;
  onClose: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  /** Opens one of the outfits the garment appears in. */
  onOpenOutfit?: (id: string) => void;
};

function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function GarmentDetailModal({
  garment,
  onClose,
  onEdit,
  onDelete,
  onOpenOutfit,
}: GarmentDetailModalProps) {
  const theme = useTheme();
  const { getTag, outfits } = useWardrobe();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // Outfits reference garments by id, and until now that relationship was only
  // visible from the outfit's side.
  const wearing = garment
    ? outfits.filter((outfit) => outfit.garmentIds.includes(garment.id))
    : [];

  function confirmDelete(target: Garment) {
    // Deleting a garment quietly pulls it out of every outfit wearing it, the
    // same way deleting a wardrobe unfiles its clothes — and like that one, it
    // should say so before you commit to it.
    const consequence =
      wearing.length === 0
        ? ''
        : wearing.length === 1
          ? ` Se quitará del outfit «${wearing[0].name}».`
          : ` Se quitará de ${wearing.length} outfits.`;

    Alert.alert('Eliminar prenda', `¿Seguro que quieres eliminar "${target.name}"?${consequence}`, [
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
                <GarmentGallery
                  uris={garment.imageUris}
                  width={isLandscape ? width / 2 : width}
                  height={isLandscape ? height : width}
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
                  <View style={styles.titleRow}>
                    <ThemedText type="subtitle" style={styles.title}>
                      {garment.name}
                    </ThemedText>

                    <OverflowMenu
                      testID="garment-detail-menu"
                      items={[
                        {
                          label: 'Editar prenda',
                          icon: '✏️',
                          testID: 'garment-detail-edit',
                          onPress: () => onEdit(garment.id),
                        },
                        {
                          label: 'Eliminar prenda',
                          icon: '🗑',
                          testID: 'garment-detail-delete',
                          danger: true,
                          onPress: () => confirmDelete(garment),
                        },
                      ]}
                    />
                  </View>

                  <ThemedText type="small" themeColor="textSecondary">
                    Añadida el {formatDate(garment.createdAt)}
                  </ThemedText>

                  {garment.description.length > 0 && (
                    <>
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />

                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                        DESCRIPCIÓN
                      </ThemedText>
                      <ThemedText testID="garment-detail-description" style={styles.description}>
                        {garment.description}
                      </ThemedText>
                    </>
                  )}

                  <View style={[styles.divider, { backgroundColor: theme.border }]} />

                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                    ETIQUETAS
                  </ThemedText>

                  {garment.tags.length > 0 ? (
                    <View style={styles.tags}>
                      {garment.tags.map((tag) => (
                        <TagChip key={tag} label={tag} color={getTag(tag).color} />
                      ))}
                    </View>
                  ) : (
                    <ThemedText themeColor="textSecondary">Esta prenda no tiene etiquetas.</ThemedText>
                  )}

                  {wearing.length > 0 && (
                    <>
                      <View style={[styles.divider, { backgroundColor: theme.border }]} />

                      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                        APARECE EN
                      </ThemedText>

                      <View testID="garment-detail-outfits" style={styles.outfits}>
                        {wearing.map((outfit) => (
                          <Pressable
                            key={outfit.id}
                            testID={`garment-detail-outfit-${outfit.id}`}
                            accessibilityRole="button"
                            accessibilityLabel={`Ver el outfit ${outfit.name}`}
                            onPress={() => onOpenOutfit?.(outfit.id)}
                            disabled={onOpenOutfit == null}
                            style={({ pressed }) => pressed && styles.pressed}>
                            <View
                              style={[
                                styles.outfitPill,
                                { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
                              ]}>
                              <ThemedText type="smallBold">{outfit.name}</ThemedText>
                              {onOpenOutfit && (
                                <ThemedText type="smallBold" themeColor="textSecondary">
                                  ›
                                </ThemedText>
                              )}
                            </View>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  )}
                </ScrollView>
              </View>
            </View>
          )}
        </SafeAreaView>
      </ThemedView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
  },
  outfits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  outfitPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
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
  description: {
    lineHeight: 24,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
});
