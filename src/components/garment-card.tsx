import { Pressable, StyleSheet, View } from 'react-native';

import { GarmentImage } from './garment-image';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { Garment } from '@/types/garment';

type GarmentCardProps = {
  garment: Garment;
  width: number;
  /** Shorter than 1 in landscape, where vertical space is scarce. */
  imageAspectRatio?: number;
  onPress: () => void;
};

export function GarmentCard({ garment, width, imageAspectRatio = 1, onPress }: GarmentCardProps) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.card, CardShadow, { borderColor: theme.border }]}>
        <GarmentImage
          uri={garment.imageUri}
          placeholderSize={36}
          style={[styles.image, { aspectRatio: imageAspectRatio }]}
        />

        <View style={styles.info}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {garment.name}
          </ThemedText>

          {garment.tags.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {garment.tags.join(' · ')}
            </ThemedText>
          ) : (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              Sin etiquetas
            </ThemedText>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
  card: {
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
  },
  info: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: 1,
  },
});
