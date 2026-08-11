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
import { GarmentPicker } from './garment-picker';
import { TagPicker } from './tag-picker';
import { ThemedText } from './themed-text';

import { Accent, BottomTabInset, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type OutfitFormValues = {
  name: string;
  /** Garment ids, in the order they were added. Never repeated. */
  garmentIds: string[];
  description: string;
  tags: string[];
};

type OutfitFormProps = {
  title: string;
  subtitle?: string;
  initialValues?: OutfitFormValues;
  submitLabel: string;
  savingLabel: string;
  /** Clears the fields after a successful submit (used by the "new outfit" flow). */
  resetOnSubmit?: boolean;
  onCancel?: () => void;
  onSubmit: (values: OutfitFormValues) => Promise<void>;
};

const EMPTY_VALUES: OutfitFormValues = { name: '', garmentIds: [], description: '', tags: [] };

export function OutfitForm({
  title,
  subtitle,
  initialValues,
  submitLabel,
  savingLabel,
  resetOnSubmit = false,
  onCancel,
  onSubmit,
}: OutfitFormProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [name, setName] = useState(initialValues?.name ?? '');
  const [garmentIds, setGarmentIds] = useState<string[]>(initialValues?.garmentIds ?? []);
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);
  const [tagInput, setTagInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // An outfit with no garments would be an empty combination, so both the name
  // and at least one garment are required.
  const canSave = name.trim().length > 0 && garmentIds.length > 0 && !isSaving;

  async function handleSave() {
    if (!canSave) return;
    setIsSaving(true);
    try {
      await onSubmit({ name: name.trim(), garmentIds, description: description.trim(), tags });
      if (resetOnSubmit) {
        setName(EMPTY_VALUES.name);
        setGarmentIds(EMPTY_VALUES.garmentIds);
        setDescription(EMPTY_VALUES.description);
        setTags(EMPTY_VALUES.tags);
        setTagInput('');
      }
    } catch {
      Alert.alert('Error', 'No se ha podido guardar el outfit. Inténtalo de nuevo.');
    } finally {
      setIsSaving(false);
    }
  }

  const garmentsSection = (
    <GarmentPicker selectedIds={garmentIds} onChange={setGarmentIds} testIDPrefix="outfit-form" />
  );

  const fieldsSection = (
    <View style={styles.fields}>
      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
          NOMBRE
        </ThemedText>
        <TextInput
          testID="outfit-form-name"
          value={name}
          onChangeText={setName}
          placeholder="Ej. Cena de verano"
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
          testID="outfit-form-description"
          value={description}
          onChangeText={setDescription}
          placeholder="Notas sobre el conjunto: para qué ocasión, qué combinar…"
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
        testIDPrefix="outfit-form"
        placeholder="Ej. trabajo, boda"
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
              testID="outfit-form-cancel"
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
            <View style={styles.landscapeColumn}>{fieldsSection}</View>
            <View style={styles.landscapeColumn}>{garmentsSection}</View>
          </View>
        ) : (
          <>
            {fieldsSection}
            {garmentsSection}
          </>
        )}

        {name.trim().length > 0 && garmentIds.length === 0 && (
          <ThemedText type="small" themeColor="textSecondary" testID="outfit-form-hint">
            Selecciona al menos una prenda para guardar el outfit.
          </ThemedText>
        )}

        <Button
          testID="outfit-form-submit"
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
  input: {
    fontSize: 16,
    paddingVertical: Spacing.three - 2,
    paddingHorizontal: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 48,
  },
  textArea: {
    minHeight: 120,
    paddingTop: Spacing.three - 2,
  },
  submit: {
    marginTop: Spacing.one,
    shadowColor: Accent,
  },
});
