import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Banner } from '../Banner';

// Banner reads useSafeAreaInsets, so it needs a provider. `initialMetrics`
// supplies them synchronously — without it the provider measures on layout and
// renders nothing on the first pass.
const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};
const wrap = (ui: React.ReactElement) => (
  <SafeAreaProvider initialMetrics={metrics}>{ui}</SafeAreaProvider>
);

test('renders nothing until there is something to announce', async () => {
  const { queryByRole } = await render(wrap(
    <Banner title={null} detail="−8.0 L" onPress={() => {}} onDismiss={() => {}} />
  ));
  expect(queryByRole('button')).toBeNull();
});

test('announces the station and the litres in one accessible node', async () => {
  const { getByRole } = await render(wrap(
    <Banner title="Shell Grayston" detail="−8.0 L" onPress={() => {}} onDismiss={() => {}} />
  ));
  expect(getByRole('button').props.accessibilityLabel)
    .toBe('Fill recorded. Shell Grayston, −8.0 L. View the fill.');
});

test('routes to the fill on press', async () => {
  const onPress = jest.fn();
  const { getByRole } = await render(wrap(
    <Banner title="Shell Grayston" detail="−8.0 L" onPress={onPress} onDismiss={() => {}} />
  ));
  fireEvent.press(getByRole('button'));
  expect(onPress).toHaveBeenCalled();
});

// A banner that waits forever becomes furniture.
test('dismisses itself after six seconds', async () => {
  jest.useFakeTimers();
  const onDismiss = jest.fn();
  await render(wrap(
    <Banner title="Shell Grayston" detail="−8.0 L" onPress={() => {}} onDismiss={onDismiss} />
  ));
  expect(onDismiss).not.toHaveBeenCalled();
  jest.advanceTimersByTime(6000);
  expect(onDismiss).toHaveBeenCalled();
  jest.useRealTimers();
});
