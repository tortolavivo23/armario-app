import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Switch, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Accent, CardShadow, Radius, Spacing, tagTint } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OverflowMenuItem = {
  label: string;
  icon?: string;
  onPress: () => void;
  /**
   * Turns the row into a switch showing this value. Switch rows leave the menu
   * open, so the change can be seen taking effect behind it.
   */
  switchValue?: boolean;
  testID?: string;
};

type OverflowMenuProps = {
  items: OverflowMenuItem[];
  testID?: string;
};

/** "⋯" button that drops a small menu below itself, anchored to the top right. */
export function OverflowMenu({ items, testID = 'overflow-menu' }: OverflowMenuProps) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Pressable
        testID={`${testID}-button`}
        accessibilityRole="button"
        accessibilityLabel="Más opciones"
        onPress={() => setOpen(true)}
        hitSlop={10}
        style={({ pressed }) => pressed && styles.pressed}>
        <View
          style={[
            styles.button,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold" style={styles.buttonIcon}>
            ⋯
          </ThemedText>
        </View>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Tapping anywhere outside the sheet dismisses it. */}
        <Pressable
          testID={`${testID}-backdrop`}
          style={styles.backdrop}
          onPress={() => setOpen(false)}>
          <View
            style={[
              styles.sheet,
              CardShadow,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            {items.map((item, index) => {
              const isSwitch = item.switchValue != null;

              return (
                <View key={item.label}>
                  {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}

                  <Pressable
                    testID={item.testID}
                    accessibilityRole={isSwitch ? 'switch' : 'button'}
                    accessibilityState={isSwitch ? { checked: item.switchValue } : undefined}
                    onPress={() => {
                      if (!isSwitch) setOpen(false);
                      item.onPress();
                    }}
                    style={({ pressed }) => [
                      styles.item,
                      pressed && { backgroundColor: theme.backgroundSelected },
                    ]}>
                    {item.icon && <ThemedText style={styles.itemIcon}>{item.icon}</ThemedText>}
                    <ThemedText type="smallBold" style={styles.itemLabel}>
                      {item.label}
                    </ThemedText>

                    {isSwitch && (
                      // The row already handles the tap; the switch is only the
                      // indicator, so it must not swallow the touch.
                      <View pointerEvents="none">
                        <Switch
                          value={item.switchValue}
                          trackColor={{ false: theme.backgroundSelected, true: tagTint(Accent, 0.5) }}
                          thumbColor={item.switchValue ? Accent : theme.backgroundElement}
                        />
                      </View>
                    )}
                  </Pressable>
                </View>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    fontSize: 20,
    lineHeight: 22,
  },
  pressed: {
    opacity: 0.7,
  },
  backdrop: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  sheet: {
    minWidth: 240,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing.one,
    overflow: 'hidden',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: Spacing.one,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
  },
  itemIcon: {
    fontSize: 16,
  },
  itemLabel: {
    flex: 1,
  },
});
