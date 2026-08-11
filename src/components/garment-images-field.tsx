import * as ImagePicker from 'expo-image-picker';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Button } from './button';
import { GarmentImage } from './garment-image';
import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type GarmentImagesFieldProps = {
  /** In display order; the first one is the cover shown in the grid. */
  value: string[];
  onChange: (uris: string[]) => void;
  testIDPrefix?: string;
};

/** Picking, reordering and removing the photos of a garment. */
export function GarmentImagesField({
  value,
  onChange,
  testIDPrefix = 'garment-form',
}: GarmentImagesFieldProps) {
  const theme = useTheme();

  async function pickImage(source: 'library' | 'camera') {
    const permission =
      source === 'library'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso necesario',
        source === 'library'
          ? 'Necesitamos acceso a tus fotos para elegir una imagen.'
          : 'Necesitamos acceso a la cámara para hacer una foto.',
      );
      return;
    }

    const result =
      source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
          })
        : await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });

    if (!result.canceled) {
      const picked = result.assets.map((asset) => asset.uri);
      onChange([...value, ...picked.filter((uri) => !value.includes(uri))]);
    }
  }

  /** Promotes a photo to the front, which is the cover shown in the grid. */
  function makeCover(uri: string) {
    onChange([uri, ...value.filter((item) => item !== uri)]);
  }

  const [cover, ...extraImages] = value;

  return (
    <View style={styles.section}>
      <Pressable
        testID={`${testIDPrefix}-image`}
        onPress={() => pickImage('library')}
        style={({ pressed }) => pressed && styles.pressed}>
        {cover ? (
          <GarmentImage uri={cover} style={styles.preview} />
        ) : (
          <View style={[styles.empty, { borderColor: theme.border }]}>
            <ThemedText style={styles.emptyIcon}>👕</ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Toca para añadir fotos
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Opcional
            </ThemedText>
          </View>
        )}
      </Pressable>

      {value.length > 0 && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {value.length === 1 ? '1 foto' : `${value.length} fotos · la primera es la portada`}
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnails}>
            {value.map((uri, index) => (
              <View key={uri} testID={`${testIDPrefix}-thumb-${index}`} style={styles.thumbnail}>
                <Pressable onPress={() => makeCover(uri)}>
                  <GarmentImage uri={uri} style={styles.thumbnailImage} placeholderSize={20} />
                </Pressable>

                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <ThemedText type="small" style={styles.coverBadgeLabel}>
                      Portada
                    </ThemedText>
                  </View>
                )}

                <Pressable
                  testID={`${testIDPrefix}-remove-image-${index}`}
                  onPress={() => onChange(value.filter((item) => item !== uri))}
                  hitSlop={8}
                  style={styles.thumbnailRemove}>
                  <ThemedText type="smallBold" style={styles.thumbnailRemoveLabel}>
                    ✕
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {extraImages.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Toca una foto para usarla como portada.
            </ThemedText>
          )}
        </>
      )}

      <View style={styles.buttons}>
        <Button
          label="Galería"
          variant="secondary"
          onPress={() => pickImage('library')}
          style={styles.button}
        />
        <Button
          label="Cámara"
          variant="secondary"
          onPress={() => pickImage('camera')}
          style={styles.button}
        />
        {value.length > 0 && (
          <Button
            label="Quitar todas"
            variant="secondary"
            onPress={() => onChange([])}
            style={styles.button}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  pressed: {
    opacity: 0.75,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.large,
  },
  empty: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.large,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  emptyIcon: {
    fontSize: 52,
    marginBottom: Spacing.one,
  },
  thumbnails: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  thumbnail: {
    width: 76,
    height: 76,
  },
  thumbnailImage: {
    width: 76,
    height: 76,
    borderRadius: Radius.small,
  },
  coverBadge: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 1,
    borderBottomLeftRadius: Radius.small,
    borderBottomRightRadius: Radius.small,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  coverBadgeLabel: {
    color: '#ffffff',
    fontSize: 11,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  thumbnailRemoveLabel: {
    color: '#ffffff',
    fontSize: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  button: {
    flex: 1,
  },
});
