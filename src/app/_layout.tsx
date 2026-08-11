import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { AppProviders } from '@/context/providers';
import { useColorScheme } from '@/context/theme-context';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  return (
    <AppProviders>
      <AppShell />
    </AppProviders>
  );
}

/** Split out so it can read the scheme the provider above resolved. */
function AppShell() {
  const scheme = useColorScheme();

  return (
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
