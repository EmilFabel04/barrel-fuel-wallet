import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Panel } from '../Panel';
import { Chip } from '../Chip';
import { Button } from '../Button';

// `render` is async in @testing-library/react-native v14.

describe('Panel', () => {
  test('renders its label and children', async () => {
    const { getByText } = await render(
      <Panel label="Petrol 95 · Inland"><Text>R21.87</Text></Panel>
    );
    // textTransform is a STYLE. The node's text content is untransformed, so
    // querying the uppercase string would fail even though it renders that way.
    expect(getByText('Petrol 95 · Inland')).toBeTruthy();
    expect(getByText('R21.87')).toBeTruthy();
  });

  test('is not a button unless it is given something to do', async () => {
    const { queryByRole } = await render(<Panel><Text>inert</Text></Panel>);
    expect(queryByRole('button')).toBeNull();
  });

  test('becomes a button when pressable', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <Panel label="Price watch" onPress={onPress}><Text>x</Text></Panel>
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Chip', () => {
  test('reports its selected state to assistive tech', async () => {
    const { getByRole } = await render(<Chip label="FILLS" selected onPress={() => {}} />);
    expect(getByRole('button').props.accessibilityState.selected).toBe(true);
  });

  test('fires on press', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(<Chip label="ALL" selected={false} onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});

// Spec §3.7. Neither amber value reaches 3:1 against white, so in light mode
// the amber fill and the ground are too close for the button's boundary to be
// visible. These render under the default (dark) theme, where no edge is
// wanted — the light case is a visual check, but the dark case is the one a
// regression would silently break by bordering everything.
describe('Button edge', () => {
  const styleOf = (node: any) =>
    Array.isArray(node.props.style) ? Object.assign({}, ...node.props.style.flat()) : node.props.style;

  test('a primary button carries no border in dark mode', async () => {
    const { getByRole } = await render(<Button label="TOP UP" onPress={() => {}} />);
    expect(styleOf(getByRole('button')).borderWidth).toBe(0);
  });

  test('a secondary button keeps its border in both themes', async () => {
    const { getByRole } = await render(
      <Button label="HISTORY" variant="secondary" onPress={() => {}} />
    );
    expect(styleOf(getByRole('button')).borderWidth).toBe(1);
  });
});
