// @testing-library/react-native v13+ registers its matchers automatically.

// React 19 only enables act() support when this global is set before rendering.
global.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () =>
  require('react-native-safe-area-context/jest/mock').default,
);

// expo-image renders a native view we don't need in tests; a plain Image keeps testIDs/styles intact.
jest.mock('expo-image', () => {
  const { Image } = require('react-native');
  return { Image };
});

jest.mock('expo-router', () => ({
  router: { navigate: jest.fn(), push: jest.fn(), back: jest.fn() },
  useFocusEffect: jest.fn(),
}));

// The wardrobe context copies picked images into app storage; tests stub that filesystem work out.
jest.mock('@/lib/persist-image', () => ({
  persistImage: jest.fn(async (uri) => `file:///documents/garments/${uri.split('/').pop()}`),
  deletePersistedImage: jest.fn(),
}));

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///picked/photo.jpg' }],
  })),
  launchCameraAsync: jest.fn(async () => ({
    canceled: false,
    assets: [{ uri: 'file:///camera/photo.jpg' }],
  })),
}));

jest.spyOn(require('react-native').Alert, 'alert').mockImplementation(() => {});
