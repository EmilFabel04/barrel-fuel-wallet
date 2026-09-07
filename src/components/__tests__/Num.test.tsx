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
