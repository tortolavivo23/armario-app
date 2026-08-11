import { Pressable, StyleSheet, View } from 'react-native';

import { GarmentImage } from './garment-image';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
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
  const { getTag } = useWardrobe();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.card, CardShadow, { borderColor: theme.border }]}>
        <View>
          {/* Only the cover is shown here; the rest live in the detail screen. */}
          <GarmentImage
            uri={garment.imageUris[0] ?? null}
            placeholderSize={36}
            style={[styles.image, { aspectRatio: imageAspectRatio }]}
          />

          {garment.imageUris.length > 1 && (
            <View style={styles.photoCount}>
              <ThemedText type="small" style={styles.photoCountLabel}>
                {garment.imageUris.length} 📷
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {garment.name}
          </ThemedText>

          {garment.tags.length > 0 ? (
            <View style={styles.tagRow}>
              {garment.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tagDot, { backgroundColor: getTag(tag).color }]} />
              ))}
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1} style={styles.tagNames}>
                {garment.tags.join(' · ')}
              </ThemedText>
            </View>
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
    gap: Spacing.half,
  },
  photoCount: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  photoCountLabel: {
    color: '#ffffff',
    fontSize: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half + 1,
  },
  tagDot: {
    width: 8,
    height: 8,
    borderRadius: Radius.pill,
  },
  tagNames: {
    flex: 1,
    marginLeft: Spacing.half,
  },
});
