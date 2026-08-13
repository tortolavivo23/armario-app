import { useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, useWindowDimensions, View } from 'react-native';

import { Button } from './button';
import { GarmentImagesField } from './garment-images-field';
import { KeyboardAwareScrollView } from './keyboard-aware-scroll-view';
import { TagPicker } from './tag-picker';
import { WardrobePicker } from './wardrobe-picker';
import { ThemedText } from './themed-text';

import { Accent, BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type GarmentFormValues = {
  name: string;
  /** The wardrobe it is filed into, or `null` while unfiled. */
  wardrobeId: string | null;
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

const EMPTY_VALUES: GarmentFormValues = {
  name: '',
  wardrobeId: null,
  imageUris: [],
  description: '',
  tags: [],
};

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
  const [wardrobeId, setWardrobeId] = useState<string | null>(initialValues?.wardrobeId ?? null);
  const [imageUris, setImageUris] = useState<string[]>(initialValues?.imageUris ?? []);
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const canSave = name.trim().length > 0 && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        wardrobeId,
        imageUris,
        description: description.trim(),
        tags,
      });
      if (resetOnSubmit) {
        setName(EMPTY_VALUES.name);
        setWardrobeId(EMPTY_VALUES.wardrobeId);
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

  const imageSection = (
    <GarmentImagesField value={imageUris} onChange={setImageUris} testIDPrefix="garment-form" />
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

      <WardrobePicker value={wardrobeId} onChange={setWardrobeId} testIDPrefix="garment-form" />

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
    <KeyboardAwareScrollView contentContainerStyle={styles.scrollContent}>
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
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
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
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.three - 2,
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
