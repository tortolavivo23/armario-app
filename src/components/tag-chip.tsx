import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { DefaultTagColor, Radius, Spacing, tagTint } from '@/constants/theme';

type TagChipProps = {
  label: string;
  /** Tag colour from the catalogue. Falls back to the neutral grey. */
  color?: string;
  /** Renders the chip filled, used by the filter row for an active tag. */
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  testID?: string;
};

export function TagChip({
  label,
  color = DefaultTagColor,
  selected = false,
  onPress,
  onRemove,
  testID,
}: TagChipProps) {
  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? color : tagTint(color),
          borderColor: selected ? color : tagTint(color, 0.35),
        },
      ]}>
      <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : color }}>
        {label}
      </ThemedText>

      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={10} testID={testID ? `${testID}-remove` : undefined}>
          <ThemedText type="smallBold" style={{ color: selected ? '#ffffff' : color }}>
            ✕
          </ThemedText>
        </Pressable>
      )}
    </View>
  );

  if (!onPress) return <View testID={testID}>{content}</View>;

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => pressed && styles.pressed}>
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.7,
  },
});
