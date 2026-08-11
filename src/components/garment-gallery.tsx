import { useState } from 'react';
import { ScrollView, StyleSheet, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { GarmentImage } from './garment-image';
import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';

type GarmentGalleryProps = {
  uris: string[];
  width: number;
  height: number;
};

/** Swipeable photo gallery with a page counter and dots. */
export function GarmentGallery({ uris, width, height }: GarmentGalleryProps) {
  const [page, setPage] = useState(0);

  if (uris.length === 0) {
    return <GarmentImage uri={null} placeholderSize={80} style={{ width, height }} />;
  }

  if (uris.length === 1) {
    return <GarmentImage uri={uris[0]} style={{ width, height }} />;
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / width);
    setPage(Math.max(0, Math.min(uris.length - 1, next)));
  }

  return (
    <View testID="garment-gallery" style={{ width, height }}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}>
        {uris.map((uri) => (
          <GarmentImage key={uri} uri={uri} style={{ width, height }} />
        ))}
      </ScrollView>

      <View style={styles.counter}>
        <ThemedText type="small" style={styles.counterLabel}>
          {page + 1}/{uris.length}
        </ThemedText>
      </View>

      <View style={styles.dots}>
        {uris.map((uri, index) => (
          <View key={uri} style={[styles.dot, index === page && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    paddingHorizontal: Spacing.two,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  counterLabel: {
    color: '#ffffff',
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.three,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: Radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  dotActive: {
    backgroundColor: '#ffffff',
  },
});
