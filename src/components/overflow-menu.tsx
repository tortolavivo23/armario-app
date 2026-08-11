import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from './themed-text';

import { Accent, CardShadow, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OverflowMenuItem = {
  label: string;
  icon?: string;
  onPress: () => void;
  /** Marks the item as the active choice, e.g. the theme currently in use. */
  selected?: boolean;
  testID?: string;
};

export type OverflowMenuGroup = {
  /** Heading above the group. Omit for the first, unlabelled group. */
  title?: string;
  items: OverflowMenuItem[];
};

type OverflowMenuProps = {
  groups: OverflowMenuGroup[];
  testID?: string;
};

/** "⋯" button that drops a small menu below itself, anchored to the top right. */
export function OverflowMenu({ groups, testID = 'overflow-menu' }: OverflowMenuProps) {
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
            {groups.map((group, index) => (
              <View key={group.title ?? `group-${index}`}>
                {index > 0 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}

                {group.title && (
                  <ThemedText
                    type="smallBold"
                    themeColor="textSecondary"
                    style={styles.groupTitle}>
                    {group.title}
                  </ThemedText>
                )}

                {group.items.map((item) => (
                  <Pressable
                    key={item.label}
                    testID={item.testID}
                    accessibilityRole="button"
                    accessibilityState={
                      item.selected == null ? undefined : { selected: item.selected }
                    }
                    onPress={() => {
                      setOpen(false);
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
                    {item.selected && (
                      <ThemedText type="smallBold" style={styles.check}>
                        ✓
                      </ThemedText>
                    )}
                  </Pressable>
                ))}
              </View>
            ))}
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
  groupTitle: {
    letterSpacing: 0.6,
    fontSize: 11,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.one,
    paddingBottom: Spacing.half,
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
  check: {
    color: Accent,
  },
});
