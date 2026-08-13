import { useEffect, useState } from 'react';
import { Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * How much of the screen the keyboard covers, in dp, or 0 while it is closed.
 *
 * Layouts have to make this room themselves: `windowSoftInputMode=adjustResize`
 * stopped resizing the window when Android went edge-to-edge, and
 * `KeyboardAvoidingView` does nothing there either.
 */
export function useKeyboardInset() {
  const insets = useSafeAreaInsets();
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    // The reported height leaves out the navigation bar the keyboard is drawn
    // over, which whatever makes room for it still has to cover.
    const shown = Keyboard.addListener('keyboardDidShow', (event) =>
      setKeyboardInset(event.endCoordinates.height + insets.bottom),
    );
    const hidden = Keyboard.addListener('keyboardDidHide', () => setKeyboardInset(0));

    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [insets.bottom]);

  return keyboardInset;
}
