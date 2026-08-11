import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';

import { Button } from './button';
import { GarmentImage } from './garment-image';
import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';

import { Accent, BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type GarmentFormValues = {
  name: string;
  imageUri: string | null;
  tags: string[];
};

type GarmentFormProps = {
  title: string;
  subtitle?: string;
  initialValues?: GarmentFormValues;
  submitLabel: string;
  savingLabel: string;
  /** Clears the fields after a successful submit (used by the "add garment" flow). */
  resetOnSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: (values: GarmentFormValues) => Promise<void>;
};

const EMPTY_VALUES: GarmentFormValues = { name: '', imageUri: null, tags: [] };

export function GarmentForm({
  title,
  subtitle,
  initialValues,
  submitLabel,
  savingLabel,
  resetOnSubmit = false,
  onCancel,
  onSubmit,
}: GarmentFormProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [name, setName] = useState(initialValues?.name ?? '');
  const [imageUri, setImageUri] = useState<string | null>(initialValues?.imageUri ?? null);
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0 && !isSaving;

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
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSubmit({ name: name.trim(), imageUri, tags });
      if (resetOnSubmit) {
        setName(EMPTY_VALUES.name);
        setImageUri(EMPTY_VALUES.imageUri);
        setTags(EMPTY_VALUES.tags);
        setTagInput('');
      }
    } catch {
      Alert.alert('Error', 'No se ha podido guardar la prenda. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  const imageSection = (
    <View style={styles.section}>
      <Pressable
        testID="garment-form-image"
        onPress={() => pickImage('library')}
        style={({ pressed }) => pressed && styles.pressed}>
        {imageUri ? (
          <GarmentImage uri={imageUri} style={styles.imagePreview} />
        ) : (
          <View style={[styles.imageEmpty, { borderColor: theme.border }]}>
            <ThemedText style={styles.imageEmptyIcon}>👕</ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Toca para añadir una foto
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Opcional
            </ThemedText>
          </View>
        )}
      </Pressable>

      <View style={styles.imageButtons}>
        <Button
          label="Galería"
          variant="secondary"
          onPress={() => pickImage('library')}
          style={styles.imageButton}
        />
        <Button
          label="Cámara"
          variant="secondary"
          onPress={() => pickImage('camera')}
          style={styles.imageButton}
        />
        {imageUri && (
          <Button
            label="Quitar"
            variant="secondary"
            onPress={() => setImageUri(null)}
            style={styles.imageButton}
          />
        )}
      </View>
    </View>
  );

  const fieldsSection = (
    <View style={styles.fields}>
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
          NOMBRE
        </ThemedText>
        <TextInput
          testID="garment-form-name"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Camisa vaquera"
          placeholderTextColor={theme.textSecondary}
          style={[
            styles.input,
            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        />
      </View>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
          ETIQUETAS
        </ThemedText>
        <View style={styles.tagInputRow}>
          <TextInput
            testID="garment-form-tag-input"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={addTag}
            placeholder="Ej. verano, casual"
            placeholderTextColor={theme.textSecondary}
            returnKeyType="done"
            style={[
              styles.input,
              styles.tagInput,
              { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}
          />
          <Button
            label="Añadir"
            variant="secondary"
            onPress={addTag}
            disabled={tagInput.trim().length === 0}
          />
        </View>

        {tags.length > 0 && (
          <View style={styles.tags}>
            {tags.map((tag) => (
              <TagChip key={tag} label={tag} onRemove={() => removeTag(tag)} />
            ))}
          </View>
        )}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText type="title" style={styles.title}>
              {title}
            </ThemedText>
            {subtitle && (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            )}
          </View>

          {onCancel && (
            <Pressable
              testID="garment-form-cancel"
              onPress={onCancel}
              hitSlop={12}
              style={({ pressed }) => pressed && styles.pressed}>
              <View style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText type="smallBold">✕</ThemedText>
              </View>
            </Pressable>
          )}
        </View>

        {isLandscape ? (
          <View style={styles.landscapeRow}>
            <View style={styles.landscapeColumn}>{imageSection}</View>
            <View style={styles.landscapeColumn}>{fieldsSection}</View>
          </View>
        ) : (
          <>
            {imageSection}
            {fieldsSection}
          </>
        )}

        <Button
          testID="garment-form-submit"
          label={isSaving ? savingLabel : submitLabel}
          onPress={handleSave}
          disabled={!canSave}
          style={styles.submit}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.three,
  },
  headerText: {
    flex: 1,
    gap: Spacing.half,
  },
  title: {
    fontSize: 30,
    lineHeight: 38,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  landscapeRow: {
    flexDirection: 'row',
    gap: Spacing.four,
  },
  landscapeColumn: {
    flex: 1,
  },
  section: {
    gap: Spacing.two,
  },
  fields: {
    gap: Spacing.four,
  },
  label: {
    letterSpacing: 0.6,
    fontSize: 12,
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.large,
  },
  imageEmpty: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: Radius.large,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  imageEmptyIcon: {
    fontSize: 52,
    marginBottom: Spacing.one,
  },
  imageButtons: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  imageButton: {
    flex: 1,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  submit: {
    marginTop: Spacing.one,
    shadowColor: Accent,
  },
});
