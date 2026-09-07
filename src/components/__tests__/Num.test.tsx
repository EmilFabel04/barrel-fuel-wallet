import React from 'react';
import { render } from '@testing-library/react-native';
import { Num } from '../Num';

test('renders its value and uses tabular numerals', async () => {
  // @testing-library/react-native v14 made `render` async (it awaits an
  // internal `act()` around the test-renderer commit); the brief's example
  // assumed the older synchronous signature.
  const { getByText } = await render(<Num size={92}>42.6</Num>);
  const node = getByText('42.6');
  const style = Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style.flat())
    : node.props.style;
  expect(style.fontVariant).toContain('tabular-nums');
  expect(style.fontSize).toBe(92);
});

test('maps weight to the matching Outfit family instead of setting fontWeight', async () => {
  const { getByText } = await render(<Num size={20} weight="500">1.23</Num>);
  const node = getByText('1.23');
  const style = Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style.flat())
    : node.props.style;
  expect(style.fontFamily).toBe('Outfit_500Medium');
  expect(style.fontWeight).toBeUndefined();
});

test('defaults to the ExtraBold family when no weight is given', async () => {
  const { getByText } = await render(<Num size={20}>1.23</Num>);
  const node = getByText('1.23');
  const style = Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style.flat())
    : node.props.style;
  expect(style.fontFamily).toBe('Outfit_800ExtraBold');
});

test('converts the -0.045em tracking to points at the call site', async () => {
  const { getByText } = await render(<Num size={92}>42.6</Num>);
  const node = getByText('42.6');
  const style = Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style.flat())
    : node.props.style;
  expect(style.letterSpacing).toBe(-4.14);
});
