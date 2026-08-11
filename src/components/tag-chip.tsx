import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Spacing } from '@/constants/theme';

type TagChipProps = {
  label: string;
  onRemove?: () => void;
};

export function TagChip({ label, onRemove }: TagChipProps) {
  return (
    <ThemedView type="backgroundSelected" style={styles.chip}>
      <ThemedText type="small">{label}</ThemedText>
      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={8}>
          <ThemedText type="smallBold" themeColor="textSecondary">
            ✕
          </ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
    borderRadius: Spacing.four,
  },
});
