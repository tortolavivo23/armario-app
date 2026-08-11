import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { BackHandler, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GarmentForm } from '@/components/garment-form';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';

export default function AddGarmentScreen() {
  const { addGarment } = useWardrobe();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => subscription.remove();
    }, []),
  );

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <GarmentForm
          title="Nueva prenda"
          subtitle="La foto es opcional; solo el nombre es obligatorio"
          submitLabel="Guardar prenda"
          savingLabel="Guardando…"
          resetOnSubmit
          onSubmit={async (values) => {
            await addGarment(values);
            router.navigate('/');
          }}
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
});
