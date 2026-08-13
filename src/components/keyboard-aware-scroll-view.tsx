import { useRef, type ReactNode } from 'react';
import { ScrollView, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';

import { Spacing } from '@/constants/theme';
import { useKeyboardInset } from '@/hooks/use-keyboard-inset';

/** Breathing room left between the focused field and the top of the keyboard. */
const RevealGap = Spacing.four;

type KeyboardAwareScrollViewProps = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Scrolling form that keeps the focused field above the keyboard: a spacer as
 * tall as the keyboard shortens the scroll view, and whatever has focus is
 * scrolled back into what is left of it.
 *
 * Moving between fields afterwards needs no help — a shorter scroll view brings
 * its focused child into view on its own.
 */
export function KeyboardAwareScrollView({
  children,
  contentContainerStyle,
  testID,
}: KeyboardAwareScrollViewProps) {
  const keyboardInset = useKeyboardInset();
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const offset = useRef(0);

  /** Called once the spacer has shrunk the viewport, so it measures the new size. */
  function revealFocusedInput() {
    const input = TextInput.State.currentlyFocusedInput();
    if (!input || !viewportRef.current) return;

    viewportRef.current.measureInWindow((_x, viewportY, _width, viewportHeight) => {
      input.measureInWindow((_inputX, inputY, _inputWidth, inputHeight) => {
        const covered = inputY + inputHeight + RevealGap - (viewportY + viewportHeight);
        if (covered > 0) {
          scrollRef.current?.scrollTo({ y: offset.current + covered, animated: true });
        }
      });
    });
  }

  return (
    <View style={styles.flex}>
      <View
        ref={viewportRef}
        style={styles.flex}
        onLayout={keyboardInset > 0 ? revealFocusedInput : undefined}>
        <ScrollView
          testID={testID}
          ref={scrollRef}
          contentContainerStyle={contentContainerStyle}
          keyboardShouldPersistTaps="handled"
          scrollEventThrottle={16}
          onScroll={(event) => {
            offset.current = event.nativeEvent.contentOffset.y;
          }}>
          {children}
        </ScrollView>
      </View>

      {keyboardInset > 0 && <View style={{ height: keyboardInset }} />}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
});
