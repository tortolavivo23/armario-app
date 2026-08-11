import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { useSystemColorScheme } from '@/hooks/use-color-scheme';

const STORAGE_KEY = 'wardrobe-theme';

/**
 * `system` follows the device setting and is what a fresh install uses. The
 * other two are what the dark mode switch writes once it is touched.
 */
export type ThemePreference = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** The scheme actually in use, once the preference is applied. */
  scheme: 'light' | 'dark';
  isDark: boolean;
  /** Flips between light and dark, pinning the choice from then on. */
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isPreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark';
}

export function ThemePreferenceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useSystemColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (isPreference(stored)) setPreferenceState(stored);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEY, preference);
  }, [preference, isLoading]);

  const value = useMemo<ThemeContextValue>(() => {
    const scheme =
      preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;

    return {
      preference,
      setPreference: setPreferenceState,
      scheme,
      isDark: scheme === 'dark',
      // Toggling from `system` pins whichever scheme is not showing right now,
      // so the switch always does what its position says.
      toggleDark: () => setPreferenceState(scheme === 'dark' ? 'light' : 'dark'),
    };
  }, [preference, systemScheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/**
 * The scheme to paint with. Falls back to the system setting when no provider
 * is mounted, so a screen can still be rendered on its own.
 */
export function useColorScheme(): 'light' | 'dark' {
  const context = useContext(ThemeContext);
  const systemScheme = useSystemColorScheme();

  if (context) return context.scheme;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

/** Reading and changing the stored preference. Requires the provider. */
export function useThemePreference() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  return context;
}
