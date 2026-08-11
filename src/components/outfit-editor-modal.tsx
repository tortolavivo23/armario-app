import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OutfitForm } from './outfit-form';
import { ThemedView } from './themed-view';

import { MaxContentWidth } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { Outfit } from '@/types/outfit';

type OutfitEditorModalProps = {
  visible: boolean;
  /** `null` creates a new outfit; anything else edits that one. */
  outfit: Outfit | null;
  onClose: () => void;
};

export function OutfitEditorModal({ visible, outfit, onClose }: OutfitEditorModalProps) {
  const { addOutfit, updateOutfit } = useWardrobe();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {visible && (
            <OutfitForm
              // Remount when switching outfits so the fields reload from the new one.
              key={outfit?.id ?? 'new'}
              title={outfit ? 'Editar outfit' : 'Nuevo outfit'}
              subtitle={
                outfit
                  ? 'Cambia el nombre, las prendas o las etiquetas'
                  : 'Agrupa prendas que ya tienes en el armario'
              }
              submitLabel={outfit ? 'Guardar cambios' : 'Guardar outfit'}
              savingLabel="Guardando…"
              initialValues={
                outfit
                  ? {
                      name: outfit.name,
                      garmentIds: outfit.garmentIds,
                      description: outfit.description,
                      tags: outfit.tags,
                    }
                  : undefined
              }
              onCancel={onClose}
              onSubmit={async (values) => {
                if (outfit) {
                  await updateOutfit(outfit.id, values);
                } else {
                  await addOutfit(values);
                }
                onClose();
              }}
            />
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
});
