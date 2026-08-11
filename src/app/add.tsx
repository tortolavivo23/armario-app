import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TagChip } from '@/components/tag-chip';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';

export default function AddGarmentScreen() {
  const { addGarment } = useWardrobe();
  const theme = useTheme();

  const [name, setName] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0 && imageUri != null && !isSaving;

  async function pickImage(source: 'library' | 'camera') {
    const permission =
      source === 'library'
        ? await ImagePicker.requestMediaLibraryPermissionsAsync()
        : await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        'Permiso necesario',
        source === 'library'
          ? 'Necesitamos acceso a tus fotos para elegir una imagen.'
          : 'Necesitamos acceso a la cámara para hacer una foto.',
      );
      return;
    }

    const result =
      source === 'library'
        ? await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, quality: 0.8 })
        : await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  }

  function addTag() {
    const cleaned = tagInput.trim().toLowerCase();
    if (cleaned.length > 0 && !tags.includes(cleaned)) {
      setTags((current) => [...current, cleaned]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setTags((current) => current.filter((t) => t !== tag));
  }

  async function handleSave() {
    if (!imageUri) return;
    setIsSaving(true);
    try {
      await addGarment({ name: name.trim(), imageUri, tags });
      setName('');
      setImageUri(null);
      setTags([]);
      setTagInput('');
      router.navigate('/');
    } catch {
      Alert.alert('Error', 'No se ha podido guardar la prenda. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          <ThemedText type="title" style={styles.title}>
            Nueva prenda
          </ThemedText>

          <View style={styles.imageSection}>
            {imageUri ? (
              <Pressable onPress={() => setImageUri(null)}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
                <ThemedText type="small" themeColor="textSecondary" style={styles.changeImageHint}>
                  Toca la imagen para quitarla
                </ThemedText>
              </Pressable>
            ) : (
              <ThemedView type="backgroundElement" style={styles.imagePlaceholder}>
                <ThemedText themeColor="textSecondary">Sin imagen</ThemedText>
              </ThemedView>
            )}

            <View style={styles.imageButtons}>
              <Pressable style={styles.imageButton} onPress={() => pickImage('library')}>
                <ThemedView type="backgroundElement" style={styles.imageButtonInner}>
                  <ThemedText type="smallBold">Elegir de la galería</ThemedText>
                </ThemedView>
              </Pressable>
              <Pressable style={styles.imageButton} onPress={() => pickImage('camera')}>
                <ThemedView type="backgroundElement" style={styles.imageButtonInner}>
                  <ThemedText type="smallBold">Hacer una foto</ThemedText>
                </ThemedView>
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Nombre</ThemedText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ej. Camisa vaquera"
              placeholderTextColor={theme.textSecondary}
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            />
          </View>

          <View style={styles.field}>
            <ThemedText type="smallBold">Etiquetas</ThemedText>
            <View style={styles.tagInputRow}>
              <TextInput
                value={tagInput}
                onChangeText={setTagInput}
                onSubmitEditing={addTag}
                placeholder="Ej. verano, casual"
                placeholderTextColor={theme.textSecondary}
                returnKeyType="done"
                style={[
                  styles.input,
                  styles.tagInput,
                  { color: theme.text, backgroundColor: theme.backgroundElement },
                ]}
              />
              <Pressable onPress={addTag} disabled={tagInput.trim().length === 0}>
                <ThemedView type="backgroundSelected" style={styles.addTagButton}>
                  <ThemedText type="smallBold">Añadir</ThemedText>
                </ThemedView>
              </Pressable>
            </View>

            {tags.length > 0 && (
              <View style={styles.tags}>
                {tags.map((tag) => (
                  <TagChip key={tag} label={tag} onRemove={() => removeTag(tag)} />
                ))}
              </View>
            )}
          </View>

          <Pressable onPress={handleSave} disabled={!canSave}>
            <ThemedView
              style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}>
              <ThemedText type="smallBold">{isSaving ? 'Guardando…' : 'Guardar prenda'}</ThemedText>
            </ThemedView>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  title: {
    fontSize: 32,
    lineHeight: 40,
  },
  imageSection: {
    gap: Spacing.two,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
  },
  changeImageHint: {
    textAlign: 'center',
    marginTop: Spacing.one,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  imageButton: {
    flex: 1,
  },
  imageButtonInner: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.three,
  },
  field: {
    gap: Spacing.two,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
  },
  addTagButton: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.three,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  saveButton: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: '#208AEF',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
});
