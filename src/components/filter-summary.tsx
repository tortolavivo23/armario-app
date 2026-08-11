import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Accent, Spacing } from '@/constants/theme';

type FilterSummaryProps = {
  count: number;
  /** Wording for one result and for several, e.g. "prenda encontrada". */
  singular: string;
  plural: string;
  onClear: () => void;
  testID: string;
};

/** "3 prendas encontradas · Limpiar filtros", shown while a filter is active. */
export function FilterSummary({ count, singular, plural, onClear, testID }: FilterSummaryProps) {
  return (
    <View style={styles.row}>
      <ThemedText type="small" themeColor="textSecondary">
        {count} {count === 1 ? singular : plural}
      </ThemedText>
      <Pressable testID={testID} onPress={onClear} hitSlop={10}>
        <ThemedText type="smallBold" style={styles.link}>
          Limpiar filtros
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  link: {
    color: Accent,
  },
});
