import React from 'react';
import { render } from '@testing-library/react-native';
import { Readout } from '../Readout';

// The rule this file exists to enforce: RN does not synthesize weights for
// custom fonts, so `fontWeight` against a fixed family is a no-op and can
// silently fall back to the system font on iOS. Weight must select a family.
//
// `render` is async in @testing-library/react-native v14 — it awaits an
// internal act() around the test-renderer commit. One render per test: looping
// several renders inside a single test produces overlapping act() calls.

const styleOf = (node: any): any => {
  const style = node.props.style;
  return Array.isArray(style) ? Object.assign({}, ...style.flat()) : style;
};

test('weight 400 selects the Regular family, not fontWeight', async () => {
  const { getByText } = await render(<Readout size={20} weight="400">42.6</Readout>);
  const style = styleOf(getByText('42.6'));
  expect(style.fontFamily).toBe('JetBrainsMono_400Regular');
  expect(style.fontWeight).toBeUndefined();
});

test('weight 500 selects the Medium family', async () => {
  const { getByText } = await render(<Readout size={20} weight="500">42.6</Readout>);
  expect(styleOf(getByText('42.6')).fontFamily).toBe('JetBrainsMono_500Medium');
});

test('weight 700 selects the Bold family', async () => {
  const { getByText } = await render(<Readout size={20} weight="700">42.6</Readout>);
  expect(styleOf(getByText('42.6')).fontFamily).toBe('JetBrainsMono_700Bold');
});

test('defaults to the ExtraBold family when no weight is given', async () => {
  const { getByText } = await render(<Readout size={20}>931.66</Readout>);
  expect(styleOf(getByText('931.66')).fontFamily).toBe('JetBrainsMono_800ExtraBold');
});

test('an unknown weight falls back to ExtraBold rather than the system font', async () => {
  const { getByText } = await render(<Readout size={20} weight={'600' as any}>12.0</Readout>);
  expect(styleOf(getByText('12.0')).fontFamily).toBe('JetBrainsMono_800ExtraBold');
});

test('converts the -0.045em tracking to points at the call site', async () => {
  const { getByText } = await render(<Readout size={92}>42.6</Readout>);
  expect(styleOf(getByText('42.6')).letterSpacing).toBe(-4.14);
});

// The reason the family swap was worth making: monospaced digits cannot change
// width, so the tabular-nums feature Num depended on is now redundant. That
// dependency is what disqualified DM Sans as a candidate family.
test('carries no tabular-nums — the family is monospaced, so it is redundant', async () => {
  const { getByText } = await render(<Readout size={20}>42.6</Readout>);
  expect(styleOf(getByText('42.6')).fontVariant).toBeUndefined();
});
