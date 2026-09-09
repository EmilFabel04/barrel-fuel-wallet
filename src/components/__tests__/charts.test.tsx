import React from 'react';
import { render } from '@testing-library/react-native';
import { LineChart } from '../LineChart';
import { BarChart } from '../BarChart';

const labels = ['APR', 'MAY', 'JUN'];
const two = [
  { key: 'pump', color: '#111111', values: [20.4, 21.3, 21.8] },
  { key: 'you', color: '#222222', values: [19.5, 19.5, 20.4] },
];

describe('LineChart', () => {
  test('draws a path per series and labels the axis', async () => {
    const { getAllByTestId, getByText } = await render(
      <LineChart labels={labels} series={two} />
    );
    // The shaded gap is testID 'chart-gap', deliberately NOT 'line-gap' — it
    // would otherwise match /^line-/ and make this count 3.
    expect(getAllByTestId(/^line-/)).toHaveLength(2);
    expect(getByText('APR')).toBeTruthy();
  });

  test('shades the gap when there are exactly two series', async () => {
    const { getByTestId } = await render(<LineChart labels={labels} series={two} />);
    expect(getByTestId('chart-gap')).toBeTruthy();
  });

  test('does not shade a gap with a single series', async () => {
    const { queryByTestId } = await render(
      <LineChart labels={labels} series={[{ key: 'a', color: '#111111', values: [1, 2, 3] }]} />
    );
    expect(queryByTestId('chart-gap')).toBeNull();
  });

  test('spans a month with no data instead of dropping the line to the axis', async () => {
    // A zero is "no fills that month", not "the price was zero" — dragging the
    // line down would draw a price collapse that never happened.
    const { getAllByTestId } = await render(
      <LineChart labels={labels} series={[
        { key: 'pump', color: '#111111', values: [20.4, 0, 21.8] },
        { key: 'you', color: '#222222', values: [19.5, 0, 20.4] },
      ]} />
    );
    expect(getAllByTestId(/^line-/)).toHaveLength(2);
  });

  test('survives an empty series', async () => {
    const { queryAllByTestId } = await render(<LineChart labels={[]} series={[]} />);
    expect(queryAllByTestId(/^line-/)).toHaveLength(0);
  });
});

describe('BarChart', () => {
  test('draws a bar per datum with its label and value', async () => {
    const { getAllByTestId, getByText } = await render(
      <BarChart data={[
        { label: 'APR', value: 9 }, { label: 'MAY', value: 18 }, { label: 'SEP', value: 15.98 },
      ]} />
    );
    expect(getAllByTestId(/^bar-/)).toHaveLength(3);
    expect(getByText('MAY')).toBeTruthy();
  });

  test('the tallest bar is the only highlighted one', async () => {
    const { getByTestId } = await render(
      <BarChart data={[{ label: 'APR', value: 9 }, { label: 'MAY', value: 18 }]} />
    );
    expect(getByTestId('bar-MAY').props.accessibilityLabel).toMatch(/best month/i);
    expect(getByTestId('bar-APR').props.accessibilityLabel).not.toMatch(/best month/i);
  });

  test('an all-zero dataset does not divide by zero', async () => {
    const { getAllByTestId } = await render(
      <BarChart data={[{ label: 'APR', value: 0 }, { label: 'MAY', value: 0 }]} />
    );
    for (const bar of getAllByTestId(/^bar-/)) {
      expect(Number.isNaN(bar.props.style.height)).toBe(false);
    }
  });
});
