import { Pressable, StyleSheet, View } from 'react-native';

import { GarmentImage } from './garment-image';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';
import { Outfit } from '@/types/outfit';

/** Covers shown in the collage. Beyond this the count badge tells the rest. */
const COLLAGE_SIZE = 4;

type OutfitCardProps = {
  outfit: Outfit;
  width: number;
  imageAspectRatio?: number;
  onPress: () => void;
};

/** One cover fills the card, two split it in half, three or four tile a 2x2 grid. */
function collageTile(count: number) {
  if (count === 1) return styles.single;
  return count === 2 ? styles.half : styles.tile;
}

export function OutfitCard({ outfit, width, imageAspectRatio = 1, onPress }: OutfitCardProps) {
  const theme = useTheme();
  const { garments, getTag } = useWardrobe();

  const outfitGarments = outfit.garmentIds
    .map((id) => garments.find((garment) => garment.id === id))
    .filter((garment) => garment != null);

  const covers = outfitGarments.slice(0, COLLAGE_SIZE);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ width }, pressed && styles.pressed]}>
      <ThemedView
        type="backgroundElement"
        style={[styles.card, CardShadow, { borderColor: theme.border }]}>
        <View style={[styles.collage, { aspectRatio: imageAspectRatio }]}>
          {covers.length === 0 ? (
            <GarmentImage uri={null} placeholderSize={36} style={styles.single} />
          ) : (
            covers.map((garment) => (
              <GarmentImage
                key={garment.id}
                uri={garment.imageUris[0] ?? null}
                placeholderSize={covers.length > 1 ? 20 : 36}
                style={collageTile(covers.length)}
              />
            ))
          )}

          {/* Three covers would leave a hole in the 2x2 grid. */}
          {covers.length === 3 && <View style={styles.tile} />}

          {outfitGarments.length > COLLAGE_SIZE && (
            <View style={styles.moreBadge}>
              <ThemedText type="small" style={styles.moreBadgeLabel}>
                +{outfitGarments.length - COLLAGE_SIZE}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.info}>
          <ThemedText type="smallBold" numberOfLines={1}>
            {outfit.name}
          </ThemedText>

          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {outfitGarments.length === 1 ? '1 prenda' : `${outfitGarments.length} prendas`}
          </ThemedText>

          {outfit.tags.length > 0 && (
            <View style={styles.tagRow}>
              {outfit.tags.slice(0, 3).map((tag) => (
                <View key={tag} style={[styles.tagDot, { backgroundColor: getTag(tag).color }]} />
              ))}
              <ThemedText
                type="small"
                themeColor="textSecondary"
                numberOfLines={1}
                style={styles.tagNames}>
                {outfit.tags.join(' · ')}
              </ThemedText>
            </View>
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
  collage: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  single: {
    width: '100%',
    height: '100%',
  },
  half: {
    width: '50%',
    height: '100%',
  },
  tile: {
    width: '50%',
    height: '50%',
  },
  info: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
  moreBadge: {
    position: 'absolute',
    bottom: Spacing.two,
    right: Spacing.two,
    paddingHorizontal: Spacing.two,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  moreBadgeLabel: {
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
