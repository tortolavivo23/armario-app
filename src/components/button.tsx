import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from './themed-text';

import { Accent, Danger, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const theme = useTheme();

  const background =
    variant === 'primary' ? Accent : variant === 'danger' ? Danger : theme.backgroundElement;
  const labelColor = variant === 'secondary' ? theme.text : '#ffffff';

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [style, pressed && !disabled && styles.pressed]}>
      <View
        style={[
          styles.button,
          { backgroundColor: background },
          variant === 'secondary' && { borderWidth: StyleSheet.hairlineWidth, borderColor: theme.border },
          disabled && styles.disabled,
        ]}>
        <ThemedText type="smallBold" style={{ color: labelColor }}>
          {label}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.four,
    borderRadius: Radius.medium,
    minHeight: 48,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.45,
  },
});
