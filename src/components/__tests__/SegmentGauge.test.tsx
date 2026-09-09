import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SegmentGauge } from '../SegmentGauge';
import { Timeline } from '../Timeline';
import { LotBand } from '../../lib/holdings';

const band = (
  id: string, litres: number, daysLeft: number, share: number,
  price = 21.4, expires = new Date(2026, 9, 6),
): LotBand => ({
  id, litres, pricePerLitre: price,
  purchasedAt: new Date(2026, 6, 8), expiresAt: expires,
  daysLeft, share,
});

const AT = new Date(2026, 8, 30);

describe('SegmentGauge', () => {
  test('renders one segment per lot', async () => {
    const { getAllByTestId } = await render(
      <SegmentGauge bands={[band('a', 12, 6, 0.28), band('b', 30.6, 88, 0.72)]} />
    );
    expect(getAllByTestId(/^gauge-segment-/)).toHaveLength(2);
  });

  test('marks only lots inside the urgency window as urgent', async () => {
    const { getByTestId } = await render(
      <SegmentGauge bands={[band('a', 12, 6, 0.28), band('b', 30.6, 88, 0.72)]} />
    );
    expect(getByTestId('gauge-segment-a').props.accessibilityLabel).toMatch(/expires in 6 days/i);
    expect(getByTestId('gauge-segment-b').props.accessibilityLabel).not.toMatch(/expires in/i);
  });

  test('renders an empty track rather than nothing when the wallet is empty', async () => {
    const { getByTestId } = await render(<SegmentGauge bands={[]} />);
    expect(getByTestId('gauge-empty')).toBeTruthy();
  });

  test('is tappable only when given an action', async () => {
    const onPress = jest.fn();
    const { getByRole } = await render(
      <SegmentGauge bands={[band('a', 12, 6, 1)]} onPress={onPress} accessibilityLabel="View your litres" />
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });

  test('is inert when it is not', async () => {
    const { queryByRole } = await render(<SegmentGauge bands={[band('a', 12, 6, 1)]} />);
    expect(queryByRole('button')).toBeNull();
  });
});

describe('Timeline', () => {
  test('draws one runway per lot, labelled with its price and litres', async () => {
    const { getAllByTestId, getByText } = await render(
      <Timeline at={AT} bands={[
        band('a', 12, 6, 0.5, 21.40, new Date(2026, 9, 6)),
        band('b', 10.6, 88, 0.5, 21.87, new Date(2026, 11, 27)),
      ]} />
    );
    expect(getAllByTestId(/^timeline-run-/)).toHaveLength(2);
    expect(getByText('12.0 L')).toBeTruthy();
    expect(getByText('8 Jul · R21.40/L')).toBeTruthy();
  });

  test('says so plainly when there is nothing held', async () => {
    const { getByText } = await render(<Timeline at={AT} bands={[]} />);
    expect(getByText(/no litres/i)).toBeTruthy();
  });

  test('the furthest expiry fills the axis and shorter runs are proportionally shorter', async () => {
    const { getByTestId } = await render(
      <Timeline at={AT} bands={[
        band('a', 12, 6, 0.5, 21.40, new Date(2026, 9, 6)),
        band('b', 10.6, 88, 0.5, 21.87, new Date(2026, 11, 27)),
      ]} />
    );
    const short = parseFloat(getByTestId('timeline-run-a').props.style.width);
    const long = parseFloat(getByTestId('timeline-run-b').props.style.width);
    expect(long).toBe(100);
    expect(short).toBeGreaterThan(0);
    expect(short).toBeLessThan(long);
  });
});
