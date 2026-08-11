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
  await screen.findByTestId('menu-theme-dark');
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

describe('theme options in the ⋯ menu', () => {
  it('offers the three modes', async () => {
    await openMenu();

    expect(screen.getByText('Seguir el sistema')).toBeOnTheScreen();
    expect(screen.getByText('Modo claro')).toBeOnTheScreen();
    expect(screen.getByText('Modo oscuro')).toBeOnTheScreen();
  });

  it('marks the one in use', async () => {
    await openMenu();

    expect(screen.getByTestId('menu-theme-system')).toBeSelected();
    expect(screen.getByTestId('menu-theme-dark')).not.toBeSelected();
  });

  it('keeps the tag manager reachable from the same menu', async () => {
    await openMenu();

    expect(screen.getByTestId('menu-manage-tags')).toBeOnTheScreen();
  });

  it('switches to dark mode and remembers it', async () => {
    setSystemScheme('light');
    await openMenu();

    await fireEvent.press(screen.getByTestId('menu-theme-dark'));

    await waitFor(async () => {
      expect(await AsyncStorage.getItem('wardrobe-theme')).toBe('dark');
    });
  });

  it('shows dark mode as the active choice once chosen', async () => {
    await openMenu();
    await fireEvent.press(screen.getByTestId('menu-theme-dark'));

    await fireEvent.press(screen.getByTestId('overflow-menu-button'));

    expect(await screen.findByTestId('menu-theme-dark')).toBeSelected();
    expect(screen.getByTestId('menu-theme-system')).not.toBeSelected();
  });

  it('repaints the screen with the dark palette', async () => {
    setSystemScheme('light');
    await openMenu();
    expect(screen.getByText('Mi armario')).toHaveStyle({ color: Colors.light.text });

    await fireEvent.press(screen.getByTestId('menu-theme-dark'));

    await waitFor(() =>
      expect(screen.getByText('Mi armario')).toHaveStyle({ color: Colors.dark.text }),
    );
  });
});
