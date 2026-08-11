import { StyleSheet } from 'react-native';

import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type EmptyStateProps = {
  icon: string;
  title: string;
  hint: string;
  testID?: string;
};

/** The bordered card shown when a list has nothing to show. */
export function EmptyState({ icon, title, hint, testID }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <ThemedView
      testID={testID}
      type="backgroundElement"
      style={[styles.card, { borderColor: theme.border }]}>
      <ThemedText style={styles.icon}>{icon}</ThemedText>
      <ThemedText type="smallBold" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>
        {hint}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    padding: Spacing.five,
    borderRadius: Radius.large,
    borderWidth: StyleSheet.hairlineWidth,
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  icon: {
    fontSize: 44,
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 17,
  },
  hint: {
    textAlign: 'center',
  },
});
