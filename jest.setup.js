// AsyncStorage is a native module with no implementation under jest. The
// library ships an in-memory stand-in for exactly this, which lets the store's
// persistence be tested for real rather than mocked away.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
