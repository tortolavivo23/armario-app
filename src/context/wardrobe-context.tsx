import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { deletePersistedImage, persistImage } from '@/lib/persist-image';
import { Garment } from '@/types/garment';

const STORAGE_KEY = 'wardrobe-garments';

type GarmentInput = {
  name: string;
  imageUri: string | null;
  tags: string[];
};

type WardrobeContextValue = {
  garments: Garment[];
  isLoading: boolean;
  addGarment: (garment: GarmentInput) => Promise<void>;
  updateGarment: (id: string, garment: GarmentInput) => Promise<void>;
  removeGarment: (id: string) => Promise<void>;
};

const WardrobeContext = createContext<WardrobeContextValue | null>(null);

export function WardrobeProvider({ children }: { children: ReactNode }) {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setGarments(JSON.parse(raw));
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (isLoading) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(garments));
  }, [garments, isLoading]);

  const value = useMemo<WardrobeContextValue>(
    () => ({
      garments,
      isLoading,
      addGarment: async ({ name, imageUri, tags }) => {
        const id = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
        const persistedUri = imageUri ? await persistImage(imageUri, id) : null;
        const garment: Garment = { id, name, imageUri: persistedUri, tags, createdAt: Date.now() };
        setGarments((current) => [garment, ...current]);
      },
      updateGarment: async (id, { name, imageUri, tags }) => {
        const existing = garments.find((item) => item.id === id);
        if (!existing) return;

        let persistedUri = existing.imageUri;
        if (imageUri !== existing.imageUri) {
          if (existing.imageUri) deletePersistedImage(existing.imageUri);
          persistedUri = imageUri ? await persistImage(imageUri, id) : null;
        }

        setGarments((current) =>
          current.map((item) => (item.id === id ? { ...item, name, tags, imageUri: persistedUri } : item)),
        );
      },
      removeGarment: async (id) => {
        setGarments((current) => {
          const garment = current.find((item) => item.id === id);
          if (garment?.imageUri) deletePersistedImage(garment.imageUri);
          return current.filter((item) => item.id !== id);
        });
      },
    }),
    [garments, isLoading],
  );

  return <WardrobeContext.Provider value={value}>{children}</WardrobeContext.Provider>;
}

export function useWardrobe() {
  const context = useContext(WardrobeContext);
  if (!context) throw new Error('useWardrobe must be used within a WardrobeProvider');
  return context;
}
