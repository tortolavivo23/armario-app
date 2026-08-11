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
import { TagPicker } from './tag-picker';
import { ThemedText } from './themed-text';

import { Accent, BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type GarmentFormValues = {
  name: string;
  /** In display order; the first one becomes the cover in the grid. */
  imageUris: string[];
  description: string;
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

const EMPTY_VALUES: GarmentFormValues = { name: '', imageUris: [], description: '', tags: [] };

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
  const [imageUris, setImageUris] = useState<string[]>(initialValues?.imageUris ?? []);
  const [description, setDescription] = useState(initialValues?.description ?? '');
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
        ? await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsMultipleSelection: true,
            quality: 0.8,
          })
        : await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });

    if (!result.canceled) {
      const picked = result.assets.map((asset) => asset.uri);
      setImageUris((current) => [...current, ...picked.filter((uri) => !current.includes(uri))]);
    }
  }

  function removeImage(uri: string) {
    setImageUris((current) => current.filter((item) => item !== uri));
  }

  /** Promotes a photo to the front, which is the cover shown in the grid. */
  function makeCover(uri: string) {
    setImageUris((current) => [uri, ...current.filter((item) => item !== uri)]);
  }

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSubmit({ name: name.trim(), imageUris, description: description.trim(), tags });
      if (resetOnSubmit) {
        setName(EMPTY_VALUES.name);
        setImageUris(EMPTY_VALUES.imageUris);
        setDescription(EMPTY_VALUES.description);
        setTags(EMPTY_VALUES.tags);
        setTagInput('');
      }
    } catch {
      Alert.alert('Error', 'No se ha podido guardar la prenda. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  const [cover, ...extraImages] = imageUris;

  const imageSection = (
    <View style={styles.section}>
      <Pressable
        testID="garment-form-image"
        onPress={() => pickImage('library')}
        style={({ pressed }) => pressed && styles.pressed}>
        {cover ? (
          <GarmentImage uri={cover} style={styles.imagePreview} />
        ) : (
          <View style={[styles.imageEmpty, { borderColor: theme.border }]}>
            <ThemedText style={styles.imageEmptyIcon}>👕</ThemedText>
            <ThemedText type="smallBold" themeColor="textSecondary">
              Toca para añadir fotos
            </ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              Opcional
            </ThemedText>
          </View>
        )}
      </Pressable>

      {imageUris.length > 0 && (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            {imageUris.length === 1
              ? '1 foto'
              : `${imageUris.length} fotos · la primera es la portada`}
          </ThemedText>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnails}>
            {imageUris.map((uri, index) => (
              <View key={uri} testID={`garment-form-thumb-${index}`} style={styles.thumbnail}>
                <Pressable onPress={() => makeCover(uri)}>
                  <GarmentImage uri={uri} style={styles.thumbnailImage} placeholderSize={20} />
                </Pressable>

                {index === 0 && (
                  <View style={styles.coverBadge}>
                    <ThemedText type="small" style={styles.coverBadgeLabel}>
                      Portada
                    </ThemedText>
                  </View>
                )}

                <Pressable
                  testID={`garment-form-remove-image-${index}`}
                  onPress={() => removeImage(uri)}
                  hitSlop={8}
                  style={styles.thumbnailRemove}>
                  <ThemedText type="smallBold" style={styles.thumbnailRemoveLabel}>
                    ✕
                  </ThemedText>
                </Pressable>
              </View>
            ))}
          </ScrollView>

          {extraImages.length > 0 && (
            <ThemedText type="small" themeColor="textSecondary">
              Toca una foto para usarla como portada.
            </ThemedText>
          )}
        </>
      )}

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
        {imageUris.length > 0 && (
          <Button
            label="Quitar todas"
            variant="secondary"
            onPress={() => setImageUris([])}
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
          DESCRIPCIÓN
        </ThemedText>
        <TextInput
          testID="garment-form-description"
          value={description}
          onChangeText={setDescription}
          placeholder="Notas sobre la prenda: talla, tejido, dónde la compraste…"
          placeholderTextColor={theme.textSecondary}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
          style={[
            styles.input,
            styles.textArea,
            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        />
      </View>

      <TagPicker
        tags={tags}
        onChangeTags={setTags}
        input={tagInput}
        onChangeInput={setTagInput}
        testIDPrefix="garment-form"
      />
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
  thumbnails: {
    gap: Spacing.two,
    paddingVertical: Spacing.half,
  },
  thumbnail: {
    width: 76,
    height: 76,
  },
  thumbnailImage: {
    width: 76,
    height: 76,
    borderRadius: Radius.small,
  },
  coverBadge: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    right: 0,
    alignItems: 'center',
    paddingVertical: 1,
    borderBottomLeftRadius: Radius.small,
    borderBottomRightRadius: Radius.small,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  coverBadgeLabel: {
    color: '#ffffff',
    fontSize: 11,
  },
  thumbnailRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  thumbnailRemoveLabel: {
    color: '#ffffff',
    fontSize: 12,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.three - 2,
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
  submit: {
    marginTop: Spacing.one,
    shadowColor: Accent,
  },
});
