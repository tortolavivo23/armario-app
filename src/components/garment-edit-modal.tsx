import { Modal, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentForm } from './garment-form';
import { ThemedView } from './themed-view';

import { MaxContentWidth } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { Garment } from '@/types/garment';

type GarmentEditModalProps = {
  garment: Garment | null;
  onClose: () => void;
};

export function GarmentEditModal({ garment, onClose }: GarmentEditModalProps) {
  const { updateGarment } = useWardrobe();

  return (
    <Modal visible={garment != null} animationType="slide" onRequestClose={onClose}>
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          {garment && (
            <GarmentForm
              // Remount when switching garments so the fields reload from the new one.
              key={garment.id}
              title="Editar prenda"
              subtitle="Cambia el nombre, la foto o las etiquetas"
              submitLabel="Guardar cambios"
              savingLabel="Guardando…"
              initialValues={{ name: garment.name, imageUri: garment.imageUri, tags: garment.tags }}
              onCancel={onClose}
              onSubmit={async (values) => {
                await updateGarment(garment.id, values);
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
