import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { NamePromptModal } from './name-prompt-modal';
import { ThemedText } from './themed-text';

import { Accent, CardShadow, Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';
import { AllWardrobes, Unfiled, WardrobeFilter, matchesWardrobe } from '@/types/wardrobe';

type WardrobeSwitcherProps = {
  /** Smaller type in landscape, matching the rest of the header. */
  compact?: boolean;
};

/** Title of the wardrobe screen, doubling as the wardrobe picker. */
export function WardrobeSwitcher({ compact = false }: WardrobeSwitcherProps) {
  const theme = useTheme();
  const { garments, wardrobes, activeWardrobe, setActiveWardrobe, addWardrobe } = useWardrobe();
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const count = (filter: WardrobeFilter) =>
    garments.filter((garment) => matchesWardrobe(garment.wardrobeId, filter)).length;

  // With no wardrobes yet, "sin armario" would just repeat "todos".
  const hasWardrobes = wardrobes.length > 0;

  const options: { key: WardrobeFilter; label: string }[] = [
    { key: AllWardrobes, label: 'Todos' },
    ...(hasWardrobes ? [{ key: Unfiled, label: 'Sin armario' }] : []),
    ...wardrobes.map((wardrobe) => ({ key: wardrobe.id, label: wardrobe.name })),
  ];

  const activeLabel =
    activeWardrobe === AllWardrobes
      ? 'Mi armario'
      : (options.find((option) => option.key === activeWardrobe)?.label ?? 'Mi armario');

  return (
    <>
      <Pressable
        testID="wardrobe-switcher"
        accessibilityRole="button"
        accessibilityLabel="Cambiar de armario"
        onPress={() => setOpen(true)}
        hitSlop={8}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}>
        <ThemedText type="title" numberOfLines={1} style={[styles.title, compact && styles.titleCompact]}>
          {activeLabel}
        </ThemedText>
        <ThemedText themeColor="textSecondary" style={styles.chevron}>
          ▾
        </ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          testID="wardrobe-switcher-backdrop"
          style={styles.backdrop}
          onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              CardShadow,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <ScrollView bounces={false}>
              {options.map((option) => {
                const isActive = option.key === activeWardrobe;

                return (
                  <Pressable
                    key={option.key}
                    testID={`wardrobe-option-${option.key}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                    onPress={() => {
                      setActiveWardrobe(option.key);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.item,
                      pressed && { backgroundColor: theme.backgroundSelected },
                    ]}>
                    <ThemedText
                      type="smallBold"
                      numberOfLines={1}
                      style={[styles.itemLabel, isActive && styles.itemLabelActive]}>
                      {option.label}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {count(option.key)}
                    </ThemedText>
                    {isActive && (
                      <ThemedText type="smallBold" style={styles.check}>
                        ✓
                      </ThemedText>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <Pressable
              testID="wardrobe-add"
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                setIsCreating(true);
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && { backgroundColor: theme.backgroundSelected },
              ]}>
              <ThemedText type="smallBold" style={[styles.itemLabel, styles.addLabel]}>
                ＋ Nuevo armario
              </ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <NamePromptModal
        visible={isCreating}
        testID="wardrobe-create"
        title="Nuevo armario"
        placeholder="Ej. Invierno"
        submitLabel="Crear"
        onClose={() => setIsCreating(false)}
        onSubmit={(name) => {
          // Landing on the new, empty wardrobe explains what just happened
          // better than staying on the previous view.
          setActiveWardrobe(addWardrobe(name).id);
          setIsCreating(false);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
    flexShrink: 1,
  },
  titleCompact: {
    fontSize: 24,
    lineHeight: 30,
  },
  chevron: {
    fontSize: 16,
  },
  backdrop: {
    flex: 1,
    alignItems: 'flex-start',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheet: {
    minWidth: 240,
    maxWidth: 320,
    maxHeight: 420,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
  },
  itemLabel: {
    flex: 1,
  },
  itemLabelActive: {
    color: Accent,
  },
  check: {
    color: Accent,
  },
  addLabel: {
    color: Accent,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.one,
  },
});
