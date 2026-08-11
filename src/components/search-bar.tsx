import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type SearchBarProps = {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  /** Slightly shorter, for the landscape header. */
  compact?: boolean;
  testID: string;
};

/** Search field with a clear button, shared by the wardrobe and outfit lists. */
export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Buscar por nombre…',
  compact = false,
  testID,
}: SearchBarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.bar,
        compact && styles.barCompact,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <ThemedText themeColor="textSecondary" style={styles.icon}>
        🔍
      </ThemedText>
      <TextInput
        testID={testID}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        style={[styles.input, { color: theme.text }]}
      />
      {value.length > 0 && (
        <Pressable testID={`${testID}-clear`} onPress={() => onChangeText('')} hitSlop={10}>
          <ThemedText themeColor="textSecondary">✕</ThemedText>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  barCompact: {
    minHeight: 44,
  },
  icon: {
    fontSize: 15,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: Spacing.two,
  },
});
