import { type ReactNode } from 'react';

import { ThemePreferenceProvider } from './theme-context';
import { WardrobeProvider } from './wardrobe-context';

/**
 * Every provider the screens expect, in one place, so the app and the tests
 * mount the same stack.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemePreferenceProvider>
      <WardrobeProvider>{children}</WardrobeProvider>
    </ThemePreferenceProvider>
  );
}
