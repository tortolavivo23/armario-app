import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Accent, Radius, Spacing, tagTint } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';

type WardrobePickerProps = {
  value: string | null;
  onChange: (wardrobeId: string | null) => void;
  testIDPrefix?: string;
};

/**
 * Picks the wardrobe a garment is filed into. Used both when creating one and
 * when moving an existing garment somewhere else.
 */
export function WardrobePicker({
  value,
  onChange,
  testIDPrefix = 'garment-form',
}: WardrobePickerProps) {
  const theme = useTheme();
  const { wardrobes } = useWardrobe();

  const options: { id: string | null; label: string }[] = [
    { id: null, label: 'Sin armario' },
    ...wardrobes.map((wardrobe) => ({ id: wardrobe.id, label: wardrobe.name })),
  ];

  return (
    <View testID={`${testIDPrefix}-wardrobe`} style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        ARMARIO
      </ThemedText>

      {wardrobes.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          Todavía no hay armarios. Crea uno tocando el título «Mi armario».
        </ThemedText>
      ) : (
        <View style={styles.options}>
          {options.map((option) => {
            const isSelected = option.id === value;

            return (
              <Pressable
                key={option.id ?? 'none'}
                testID={`${testIDPrefix}-wardrobe-${option.id ?? 'none'}`}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => onChange(option.id)}
                style={({ pressed }) => pressed && styles.pressed}>
                <View
                  style={[
                    styles.chip,
                    isSelected
                      ? { backgroundColor: tagTint(Accent, 0.16), borderColor: Accent }
                      : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  <ThemedText
                    type="smallBold"
                    style={isSelected ? styles.chipLabelSelected : undefined}>
                    {option.label}
                  </ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
  },
  label: {
    letterSpacing: 0.6,
    fontSize: 12,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipLabelSelected: {
    color: Accent,
  },
  pressed: {
    opacity: 0.7,
  },
});
