import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from './button';
import { NamePromptModal } from './name-prompt-modal';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Danger, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';
import { Wardrobe } from '@/types/wardrobe';

type WardrobesManagerModalProps = {
  visible: boolean;
  onClose: () => void;
};

/** Renaming and deleting wardrobes. Deleting one never deletes its clothes. */
export function WardrobesManagerModal({ visible, onClose }: WardrobesManagerModalProps) {
  const { garments, wardrobes, addWardrobe, renameWardrobe, removeWardrobe } = useWardrobe();
  const theme = useTheme();
  const [renaming, setRenaming] = useState<Wardrobe | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const countIn = (id: string) => garments.filter((garment) => garment.wardrobeId === id).length;

  function confirmDelete(wardrobe: Wardrobe) {
    const count = countIn(wardrobe.id);
    const consequence =
      count === 0
        ? 'No tiene ninguna prenda.'
        : count === 1
          ? 'Su prenda seguirá en tu armario, sin asignar.'
          : `Sus ${count} prendas seguirán en tu armario, sin asignar.`;

    Alert.alert('Eliminar armario', `¿Seguro que quieres eliminar "${wardrobe.name}"? ${consequence}`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeWardrobe(wardrobe.id) },
    ]);
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView testID="wardrobes-manager" contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <ThemedText type="subtitle" style={styles.title}>
                  Armarios
                </ThemedText>
                {wardrobes.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
                    <ThemedText type="smallBold" themeColor="textSecondary">
                      {wardrobes.length}
                    </ThemedText>
                  </View>
                )}
              </View>

              <Pressable testID="wardrobes-manager-close" onPress={onClose} hitSlop={12}>
                <View style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText type="smallBold">✕</ThemedText>
                </View>
              </Pressable>
            </View>

            {wardrobes.length === 0 ? (
              <ThemedView
                type="backgroundElement"
                style={[styles.emptyState, { borderColor: theme.border }]}>
                <ThemedText style={styles.emptyIcon}>🚪</ThemedText>
                <ThemedText type="smallBold" style={styles.emptyTitle}>
                  Todavía no hay armarios
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyHint}>
                  Crea uno para repartir tu ropa, por ejemplo por temporada o por dónde la guardas.
                </ThemedText>
              </ThemedView>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  Al eliminar un armario su ropa no se borra: se queda sin asignar.
                </ThemedText>

                <View style={styles.list}>
                  {wardrobes.map((wardrobe) => (
                    <ThemedView
                      key={wardrobe.id}
                      type="backgroundElement"
                      testID={`wardrobes-manager-item-${wardrobe.id}`}
                      style={[styles.row, { borderColor: theme.border }]}>
                      <View style={styles.rowText}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {wardrobe.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {countIn(wardrobe.id) === 1
                            ? '1 prenda'
                            : `${countIn(wardrobe.id)} prendas`}
                        </ThemedText>
                      </View>

                      <Pressable
                        testID={`wardrobes-manager-rename-${wardrobe.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Renombrar ${wardrobe.name}`}
                        onPress={() => setRenaming(wardrobe)}
                        hitSlop={8}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText style={styles.rowAction}>✏️</ThemedText>
                      </Pressable>

                      <Pressable
                        testID={`wardrobes-manager-delete-${wardrobe.id}`}
                        accessibilityRole="button"
                        accessibilityLabel={`Eliminar ${wardrobe.name}`}
                        onPress={() => confirmDelete(wardrobe)}
                        hitSlop={8}
                        style={({ pressed }) => pressed && styles.pressed}>
                        <ThemedText style={[styles.rowAction, styles.deleteAction]}>🗑</ThemedText>
                      </Pressable>
                    </ThemedView>
                  ))}
                </View>
              </>
            )}

            <Button
              testID="wardrobes-manager-add"
              label="Nuevo armario"
              variant="secondary"
              onPress={() => setIsCreating(true)}
            />
          </ScrollView>

          <NamePromptModal
            visible={renaming != null}
            testID="wardrobe-rename"
            title="Renombrar armario"
            initialValue={renaming?.name ?? ''}
            submitLabel="Guardar"
            onClose={() => setRenaming(null)}
            onSubmit={(name) => {
              if (renaming) renameWardrobe(renaming.id, name);
              setRenaming(null);
            }}
          />

          <NamePromptModal
            visible={isCreating}
            testID="wardrobe-create"
            title="Nuevo armario"
            placeholder="Ej. Invierno"
            submitLabel="Crear"
            onClose={() => setIsCreating(false)}
            onSubmit={(name) => {
              addWardrobe(name);
              setIsCreating(false);
            }}
          />
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
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flex: 1,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
  },
  countBadge: {
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    minWidth: 28,
    alignItems: 'center',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: Spacing.two,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  rowAction: {
    fontSize: 18,
  },
  deleteAction: {
    color: Danger,
  },
  pressed: {
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
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
