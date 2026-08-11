import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/**
 * State backed by AsyncStorage under `key`.
 *
 * Nothing is written until the first read has finished, so a slow load can
 * never overwrite stored data with the initial value.
 *
 * `revive` runs on the parsed JSON and is where stored records are migrated to
 * the current shape. It is read through a ref, so an inline function does not
 * retrigger the load.
 */
export function usePersistentState<T>(key: string, initial: T, revive?: (stored: any) => T) {
  const [value, setValue] = useState<T>(initial);
  const [isLoading, setIsLoading] = useState(true);

  // Only the first `revive` matters, since it runs once when the key loads.
  // Holding it in state keeps an inline function from retriggering the load.
  const [reviveOnce] = useState(() => revive);

  useEffect(() => {
    let cancelled = false;

    AsyncStorage.getItem(key)
      .then((raw) => {
        if (cancelled || raw == null) return;
        const parsed = JSON.parse(raw);
        setValue(reviveOnce ? reviveOnce(parsed) : parsed);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [key, reviveOnce]);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(key, JSON.stringify(value));
  }, [key, value, isLoading]);

  return [value, setValue, isLoading] as const;
}
