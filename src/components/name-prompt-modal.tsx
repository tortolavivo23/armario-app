import { useState } from 'react';
import { Modal, StyleSheet, TextInput, View } from 'react-native';

import { Button } from './button';
import { ThemedText } from './themed-text';

import { CardShadow, Radius, Spacing } from '@/constants/theme';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';
import { useTheme } from '@/hooks/use-theme';

type NamePromptModalProps = {
  visible: boolean;
  title: string;
  placeholder?: string;
  /** Pre-fills the field, so the same dialog can rename as well as create. */
  initialValue?: string;
  submitLabel: string;
  onSubmit: (name: string) => void;
  onClose: () => void;
  testID?: string;
};

/** Small centred dialog asking for a single name. */
export function NamePromptModal({
  visible,
  title,
  placeholder = 'Nombre',
  initialValue = '',
  submitLabel,
  onSubmit,
  onClose,
  testID = 'name-prompt',
}: NamePromptModalProps) {
  const theme = useTheme();
  // The field is autofocused, so the dialog opens with the keyboard already up;
  // centring it in what is left keeps the buttons reachable.
  const keyboardInset = useKeyboardInset();
  const [name, setName] = useState(initialValue);

  // Reopening, or reopening for a different wardrobe, has to start from that
  // one's name. Adjusting during render beats an effect: no extra paint, and
  // no key needed at every call site.
  const opening = `${visible}:${initialValue}`;
  const [lastOpening, setLastOpening] = useState(opening);
  if (opening !== lastOpening) {
    setLastOpening(opening);
    setName(initialValue);
  }

  function submit() {
    if (name.trim().length === 0) return;
    onSubmit(name.trim());
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { paddingBottom: keyboardInset + Spacing.four }]}>
        <View
          testID={testID}
          style={[
            styles.dialog,
            CardShadow,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <ThemedText type="smallBold" style={styles.title}>
            {title}
          </ThemedText>

          <TextInput
            testID={`${testID}-input`}
            value={name}
            onChangeText={setName}
            onSubmitEditing={submit}
            placeholder={placeholder}
            placeholderTextColor={theme.textSecondary}
            autoFocus
            returnKeyType="done"
            style={[
              styles.input,
              { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
            ]}
          />

          <View style={styles.actions}>
            <Button
              testID={`${testID}-cancel`}
              label="Cancelar"
              variant="secondary"
              onPress={onClose}
              style={styles.action}
            />
            <Button
              testID={`${testID}-submit`}
              label={submitLabel}
              onPress={submit}
              disabled={name.trim().length === 0}
              style={styles.action}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  dialog: {
    width: '100%',
    maxWidth: 420,
    padding: Spacing.four,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  title: {
    fontSize: 17,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  action: {
    flex: 1,
  },
});
