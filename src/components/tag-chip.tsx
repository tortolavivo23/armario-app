import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Accent, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TagChipProps = {
  label: string;
  /** Renders the chip in its highlighted state (used by the tag filter row). */
  selected?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
};

export function TagChip({ label, selected = false, onPress, onRemove }: TagChipProps) {
  const theme = useTheme();

  const content = (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: selected ? Accent : theme.backgroundElement,
          borderColor: selected ? Accent : theme.border,
        },
      ]}>
      <ThemedText type="smallBold" style={selected ? styles.selectedLabel : undefined}>
        {label}
      </ThemedText>

      {onRemove && (
        <Pressable onPress={onRemove} hitSlop={10}>
          <ThemedText
            type="smallBold"
            themeColor="textSecondary"
            style={selected ? styles.selectedLabel : undefined}>
            ✕
          </ThemedText>
        </Pressable>
      )}
    </View>
  );

  if (!onPress) return content;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
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
  selectedLabel: {
    color: '#ffffff',
  },
  pressed: {
    opacity: 0.7,
  },
});
