import { Image } from 'expo-image';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';
import { Garment } from '@/types/garment';

type GarmentCardProps = {
  garment: Garment;
  onPress: () => void;
};

export function GarmentCard({ garment, onPress }: GarmentCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}>
      <ThemedView type="backgroundElement" style={styles.card}>
        <Image source={{ uri: garment.imageUri }} style={styles.image} contentFit="cover" />
        <ThemedText type="smallBold" numberOfLines={1} style={styles.name}>
          {garment.name}
        </ThemedText>
        {garment.tags.length > 0 && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {garment.tags.join(' · ')}
          </ThemedText>
        )}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
    paddingBottom: Spacing.two,
    gap: Spacing.half,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: Spacing.one,
  },
  name: {
    paddingHorizontal: Spacing.two,
  },
});
