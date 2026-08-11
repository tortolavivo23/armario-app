import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import * as ImagePicker from 'expo-image-picker';

import { GarmentForm, type GarmentFormValues } from '@/components/garment-form';
import { WardrobeProvider } from '@/context/wardrobe-context';

async function renderForm(overrides: Partial<React.ComponentProps<typeof GarmentForm>> = {}) {
  const onSubmit = jest.fn<Promise<void>, [GarmentFormValues]>().mockResolvedValue(undefined);

  await render(
    <WardrobeProvider>
      <GarmentForm
        title="Nueva prenda"
        submitLabel="Guardar prenda"
        savingLabel="Guardando…"
        onSubmit={onSubmit}
        {...overrides}
      />
    </WardrobeProvider>,
  );

  return { onSubmit };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GarmentForm validation', () => {
  // Regression: the image used to be mandatory; only the name is required now.
  it('enables saving with just a name and no image', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Bufanda');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Bufanda',
      imageUris: [],
      description: '',
      tags: [],
    });
  });

  it('does not submit while the name is empty', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('does not submit a name made only of spaces', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), '    ');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('trims surrounding whitespace from the name', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), '  Jersey  ');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].name).toBe('Jersey');
  });
});

describe('GarmentForm tags', () => {
  it('adds a tag, lowercased', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.changeText(screen.getByTestId('garment-form-tag-input'), 'INVIERNO');
    await fireEvent(screen.getByTestId('garment-form-tag-input'), 'submitEditing');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].tags).toEqual(['invierno']);
  });

  it('ignores duplicate tags', async () => {
    const { onSubmit } = await renderForm();
    const tagInput = screen.getByTestId('garment-form-tag-input');

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.changeText(tagInput, 'lana');
    await fireEvent(tagInput, 'submitEditing');
    await fireEvent.changeText(tagInput, 'lana');
    await fireEvent(tagInput, 'submitEditing');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].tags).toEqual(['lana']);
  });

  it('keeps several distinct tags in insertion order', async () => {
    const { onSubmit } = await renderForm();
    const tagInput = screen.getByTestId('garment-form-tag-input');

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    for (const tag of ['lana', 'invierno', 'formal']) {
      await fireEvent.changeText(tagInput, tag);
      await fireEvent(tagInput, 'submitEditing');
    }
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].tags).toEqual(['lana', 'invierno', 'formal']);
  });

  it('removes a tag when its ✕ is pressed', async () => {
    const { onSubmit } = await renderForm();
    const tagInput = screen.getByTestId('garment-form-tag-input');

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.changeText(tagInput, 'lana');
    await fireEvent(tagInput, 'submitEditing');

    await fireEvent.press(screen.getByText('✕'));
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].tags).toEqual([]);
  });
});

describe('GarmentForm image picking', () => {
  it('stores the uri returned by the gallery picker', async () => {
    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.press(screen.getByTestId('garment-form-image'));
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].imageUris).toEqual(['file:///picked/photo.jpg']);
  });

  it('keeps the image empty when the user cancels the picker', async () => {
    jest.mocked(ImagePicker.launchImageLibraryAsync).mockResolvedValueOnce({
      canceled: true,
      assets: null,
    });

    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.press(screen.getByTestId('garment-form-image'));
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].imageUris).toEqual([]);
  });

  it('does not pick an image when the permission is denied', async () => {
    jest
      .mocked(ImagePicker.requestMediaLibraryPermissionsAsync)
      .mockResolvedValueOnce({ granted: false } as never);

    const { onSubmit } = await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.press(screen.getByTestId('garment-form-image'));

    expect(ImagePicker.launchImageLibraryAsync).not.toHaveBeenCalled();

    await fireEvent.press(screen.getByTestId('garment-form-submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit.mock.calls[0][0].imageUris).toEqual([]);
  });
});

describe('GarmentForm editing mode', () => {
  it('pre-fills the fields from initialValues', async () => {
    await renderForm({
      title: 'Editar prenda',
      initialValues: {
        name: 'Camisa vaquera',
        imageUris: ['file:///a.jpg'],
        description: '',
        tags: ['casual'],
      },
    });

    expect(screen.getByTestId('garment-form-name').props.value).toBe('Camisa vaquera');
    expect(screen.getByText('casual')).toBeOnTheScreen();
  });

  it('submits the edited values', async () => {
    const { onSubmit } = await renderForm({
      title: 'Editar prenda',
      initialValues: {
        name: 'Camisa vaquera',
        imageUris: ['file:///a.jpg'],
        description: '',
        tags: ['casual'],
      },
    });

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Camisa nueva');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Camisa nueva',
      imageUris: ['file:///a.jpg'],
      description: '',
      tags: ['casual'],
    });
  });

  // Regression: the "add" screen kept the previous garment's data after saving.
  it('clears the fields after submitting when resetOnSubmit is set', async () => {
    await renderForm({ resetOnSubmit: true });
    const tagInput = screen.getByTestId('garment-form-tag-input');

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.changeText(tagInput, 'lana');
    await fireEvent(tagInput, 'submitEditing');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(screen.getByTestId('garment-form-name').props.value).toBe(''));
    expect(screen.queryByText('lana')).not.toBeOnTheScreen();
  });

  it('keeps the fields when resetOnSubmit is not set', async () => {
    await renderForm();

    await fireEvent.changeText(screen.getByTestId('garment-form-name'), 'Jersey');
    await fireEvent.press(screen.getByTestId('garment-form-submit'));

    await waitFor(() => expect(screen.getByTestId('garment-form-name').props.value).toBe('Jersey'));
  });
});
