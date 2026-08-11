import { Image, type ImageStyle } from 'expo-image';
import { StyleSheet, View, type StyleProp } from 'react-native';

import { ThemedText } from './themed-text';

import { AccentSoft } from '@/constants/theme';

type GarmentImageProps = {
  uri: string | null;
  style?: StyleProp<ImageStyle>;
  /** Font size of the fallback icon shown when there is no image. */
  placeholderSize?: number;
};

export function GarmentImage({ uri, style, placeholderSize = 44 }: GarmentImageProps) {
  if (!uri) {
    return (
      <View style={[styles.placeholder, style]}>
        <ThemedText style={{ fontSize: placeholderSize }}>👕</ThemedText>
      </View>
    );
  }

  return <Image source={{ uri }} style={style} contentFit="cover" transition={150} />;
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AccentSoft,
  },
});
