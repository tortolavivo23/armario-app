import { StyleSheet, TextInput, View } from 'react-native';

import { Button } from './button';
import { TagChip } from './tag-chip';
import { ThemedText } from './themed-text';

import { Radius, Spacing } from '@/constants/theme';
import { useWardrobe } from '@/context/wardrobe-context';
import { useTheme } from '@/hooks/use-theme';

/** How many autocomplete suggestions fit without pushing the form around. */
const MAX_SUGGESTIONS = 8;

type TagPickerProps = {
  tags: string[];
  onChangeTags: (tags: string[]) => void;
  /** The half-typed tag. Controlled so the parent can clear it after saving. */
  input: string;
  onChangeInput: (value: string) => void;
  /** Prefixes every testID, e.g. "garment-form" or "outfit-form". */
  testIDPrefix: string;
  placeholder?: string;
};

/**
 * Tag input shared by the garment and the outfit forms: free text plus
 * autocomplete over the tags already in the catalogue.
 */
export function TagPicker({
  tags,
  onChangeTags,
  input,
  onChangeInput,
  testIDPrefix,
  placeholder = 'Ej. verano, casual',
}: TagPickerProps) {
  const theme = useTheme();
  const { tags: catalogue, getTag } = useWardrobe();

  function addTag(value: string = input) {
    const cleaned = value.trim().toLowerCase();
    if (cleaned.length > 0 && !tags.includes(cleaned)) {
      onChangeTags([...tags, cleaned]);
    }
    onChangeInput('');
  }

  function removeTag(tag: string) {
    onChangeTags(tags.filter((item) => item !== tag));
  }

  // Existing tags matching what has been typed, so a long name can be picked
  // after a letter or two instead of being retyped.
  const typed = input.trim().toLowerCase();
  const suggestions =
    typed.length === 0
      ? []
      : catalogue
          .map((tag) => tag.name)
          .filter((name) => !tags.includes(name) && name.includes(typed))
          // Prefix matches first: typing "pan" should surface "pantalón" above "chándal panadero".
          .sort((a, b) => {
            const aPrefix = a.startsWith(typed) ? 0 : 1;
            const bPrefix = b.startsWith(typed) ? 0 : 1;
            return aPrefix - bPrefix || a.localeCompare(b);
          })
          .slice(0, MAX_SUGGESTIONS);

  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        ETIQUETAS
      </ThemedText>

      <View style={styles.tagInputRow}>
        <TextInput
          testID={`${testIDPrefix}-tag-input`}
          value={input}
          onChangeText={onChangeInput}
          onSubmitEditing={() => addTag()}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder={placeholder}
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
          onPress={() => addTag()}
          disabled={input.trim().length === 0}
        />
      </View>

      {suggestions.length > 0 && (
        <View testID={`${testIDPrefix}-tag-suggestions`} style={styles.suggestions}>
          <ThemedText type="small" themeColor="textSecondary">
            Sugerencias
          </ThemedText>
          <View style={styles.tags}>
            {suggestions.map((suggestion) => (
              <TagChip
                key={suggestion}
                testID={`${testIDPrefix}-suggestion-${suggestion}`}
                label={suggestion}
                color={getTag(suggestion).color}
                onPress={() => addTag(suggestion)}
              />
            ))}
          </View>
        </View>
      )}

      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.map((tag) => (
            <TagChip
              key={tag}
              testID={`${testIDPrefix}-tag-${tag}`}
              label={tag}
              color={getTag(tag).color}
              onRemove={() => removeTag(tag)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.two,
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
  suggestions: {
    gap: Spacing.half,
    marginTop: Spacing.one,
  },
});
