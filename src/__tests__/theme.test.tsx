import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react-native';

import WardrobeScreen from '@/app/index';
import { Colors } from '@/constants/theme';
import { AppProviders } from '@/context/providers';
import { ThemePreferenceProvider, useColorScheme, useThemePreference } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

// React Native's own useColorScheme caches the value it reads at import time,
// so the device setting is faked at the seam the app actually uses.
let mockSystemScheme: 'light' | 'dark' = 'light';

jest.mock('@/hooks/use-color-scheme', () => ({
  useSystemColorScheme: () => mockSystemScheme,
}));

/** Pretends the device itself is set to the given scheme. */
function setSystemScheme(scheme: 'light' | 'dark') {
  mockSystemScheme = scheme;
}

async function renderPreference() {
  const view = await renderHook(
    () => ({ ...useThemePreference(), theme: useTheme() }),
    { wrapper: ThemePreferenceProvider },
  );
  // The stored preference arrives asynchronously; wait for that first read.
  await waitFor(() => expect(view.result.current.preference).toBeDefined());
  return view;
}

/** Opens the ⋯ menu on the wardrobe screen. */
async function openMenu() {
  await render(
    <AppProviders>
      <WardrobeScreen />
    </AppProviders>,
  );
  await fireEvent.press(await screen.findByTestId('overflow-menu-button'));
  await screen.findByTestId('menu-dark-mode');
}

beforeEach(async () => {
  jest.clearAllMocks();
  setSystemScheme('light');
  await AsyncStorage.clear();
});

describe('theme preference', () => {
  it('follows the system by default', async () => {
    setSystemScheme('dark');
    const { result } = await renderPreference();

    expect(result.current.preference).toBe('system');
    expect(result.current.scheme).toBe('dark');
    expect(result.current.theme).toEqual(Colors.dark);
  });

  it('overrides a light system setting with dark mode', async () => {
    setSystemScheme('light');
    const { result } = await renderPreference();

    await act(async () => {
      result.current.setPreference('dark');
    });

    expect(result.current.scheme).toBe('dark');
    expect(result.current.theme).toEqual(Colors.dark);
  });

  it('overrides a dark system setting with light mode', async () => {
    setSystemScheme('dark');
    const { result } = await renderPreference();

    await act(async () => {
      result.current.setPreference('light');
    });

    expect(result.current.scheme).toBe('light');
    expect(result.current.theme).toEqual(Colors.light);
  });

  it('goes back to following the system', async () => {
    setSystemScheme('dark');
    const { result } = await renderPreference();

    await act(async () => {
      result.current.setPreference('light');
    });
    await act(async () => {
      result.current.setPreference('system');
    });

    expect(result.current.scheme).toBe('dark');
  });

  it('persists the choice', async () => {
    const { result } = await renderPreference();

    await act(async () => {
      result.current.setPreference('dark');
    });

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('wardrobe-theme')).toBe('dark');
    });
  });

  it('restores a stored choice on the next launch', async () => {
    setSystemScheme('light');
    await AsyncStorage.setItem('wardrobe-theme', 'dark');

    const { result } = await renderPreference();

    await waitFor(() => expect(result.current.preference).toBe('dark'));
    expect(result.current.scheme).toBe('dark');
  });

  it('ignores a stored value that is not a preference', async () => {
    setSystemScheme('light');
    await AsyncStorage.setItem('wardrobe-theme', 'neon');

    const { result } = await renderPreference();

    expect(result.current.preference).toBe('system');
    expect(result.current.scheme).toBe('light');
  });

  it('falls back to the system scheme with no provider mounted', async () => {
    setSystemScheme('dark');
    const { result } = await renderHook(() => useColorScheme());

    expect(result.current).toBe('dark');
  });
});

describe('the dark mode switch in the ⋯ menu', () => {
  it('sits next to the tag manager', async () => {
    await openMenu();

    expect(screen.getByText('Modo oscuro')).toBeOnTheScreen();
    expect(screen.getByTestId('menu-manage-tags')).toBeOnTheScreen();
  });

  it('starts off when the device is in light mode', async () => {
    setSystemScheme('light');
    await openMenu();

    expect(screen.getByTestId('menu-dark-mode')).not.toBeChecked();
  });

  it('starts on when the device is already dark', async () => {
    setSystemScheme('dark');
    await openMenu();

    expect(screen.getByTestId('menu-dark-mode')).toBeChecked();
  });

  it('turns dark mode on and remembers it', async () => {
    setSystemScheme('light');
    await openMenu();

    await fireEvent.press(screen.getByTestId('menu-dark-mode'));

    expect(screen.getByTestId('menu-dark-mode')).toBeChecked();
    await waitFor(async () => {
      expect(await AsyncStorage.getItem('wardrobe-theme')).toBe('dark');
    });
  });

  it('turns it off again', async () => {
    setSystemScheme('light');
    await openMenu();

    await fireEvent.press(screen.getByTestId('menu-dark-mode'));
    await fireEvent.press(screen.getByTestId('menu-dark-mode'));

    expect(screen.getByTestId('menu-dark-mode')).not.toBeChecked();
    await waitFor(async () => {
      expect(await AsyncStorage.getItem('wardrobe-theme')).toBe('light');
    });
  });

  it('Regression: turning it off on a dark device pins light mode', async () => {
    setSystemScheme('dark');
    await openMenu();

    await fireEvent.press(screen.getByTestId('menu-dark-mode'));

    expect(screen.getByTestId('menu-dark-mode')).not.toBeChecked();
    await waitFor(async () => {
      expect(await AsyncStorage.getItem('wardrobe-theme')).toBe('light');
    });
  });

  it('stays open so the change can be seen happening', async () => {
    await openMenu();

    await fireEvent.press(screen.getByTestId('menu-dark-mode'));

    expect(screen.getByTestId('menu-dark-mode')).toBeOnTheScreen();
  });

  it('closes the menu for the tag manager, which is not a switch', async () => {
    await openMenu();

    await fireEvent.press(screen.getByTestId('menu-manage-tags'));

    await waitFor(() => expect(screen.queryByTestId('menu-dark-mode')).not.toBeOnTheScreen());
    expect(screen.getByTestId('tags-manager')).toBeOnTheScreen();
  });

  it('repaints the screen with the dark palette', async () => {
    setSystemScheme('light');
    await openMenu();
    expect(screen.getByText('Mi armario')).toHaveStyle({ color: Colors.light.text });

    await fireEvent.press(screen.getByTestId('menu-dark-mode'));

    await waitFor(() =>
      expect(screen.getByText('Mi armario')).toHaveStyle({ color: Colors.dark.text }),
    );
  });
});
