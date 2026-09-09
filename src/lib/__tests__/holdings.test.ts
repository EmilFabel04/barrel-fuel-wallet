import { Lot } from '../../data/types';
import { lotBands, lockedInValue } from '../holdings';
import { expiryOf } from '../window';

const lot = (id: string, litres: number, price: number, purchased: Date): Lot => ({
  id, grade: '95', litres, pricePerLitre: price,
  purchasedAt: purchased, expiresAt: expiryOf(purchased),
});

const AT = new Date(2026, 8, 30);

describe('lotBands', () => {
  test('is empty for an empty wallet', () => {
    expect(lotBands([], AT)).toEqual([]);
  });

  test('sorts by expiry, soonest first', () => {
    const bands = lotBands([
      lot('c', 10, 21.87, new Date(2026, 8, 28)),
      lot('a', 12, 21.40, new Date(2026, 6, 8)),
      lot('b', 10, 21.60, new Date(2026, 7, 12)),
    ], AT);
    expect(bands.map(b => b.id)).toEqual(['a', 'b', 'c']);
  });

  test('shares sum to one and are proportional to litres', () => {
    const bands = lotBands([
      lot('a', 30, 21.40, new Date(2026, 6, 8)),
      lot('b', 10, 21.60, new Date(2026, 7, 12)),
    ], AT);
    expect(bands[0].share).toBeCloseTo(0.75, 5);
    expect(bands[1].share).toBeCloseTo(0.25, 5);
    expect(bands.reduce((s, b) => s + b.share, 0)).toBeCloseTo(1, 5);
  });

  test('daysLeft counts down to expiry and is never negative', () => {
    // 8 Jul + 90 days = 6 Oct; six days from 30 Sep.
    expect(lotBands([lot('a', 12, 21.40, new Date(2026, 6, 8))], AT)[0].daysLeft).toBe(6);
  });

  test('excludes lots that have already expired', () => {
    // Purchased 1 Mar, so expired 30 May — long before `at`.
    expect(lotBands([lot('old', 20, 19.5, new Date(2026, 2, 1))], AT)).toEqual([]);
  });

  test('a zero balance produces no NaN shares', () => {
    for (const b of lotBands([lot('a', 0, 21.40, new Date(2026, 6, 8))], AT)) {
      expect(Number.isNaN(b.share)).toBe(false);
    }
  });
});

describe('lockedInValue', () => {
  test('is all zeros for an empty wallet', () => {
    expect(lockedInValue([], AT, 21.87)).toEqual({ cost: 0, value: 0, ahead: 0 });
  });

  test('reports what the balance cost against what it is worth now', () => {
    const { cost, value, ahead } = lockedInValue([
      lot('a', 12, 21.40, new Date(2026, 6, 8)),
      lot('b', 10, 21.60, new Date(2026, 7, 12)),
    ], AT, 21.87);
    expect(cost).toBeCloseTo(472.80, 2);   // 12*21.40 + 10*21.60
    expect(value).toBeCloseTo(481.14, 2);  // 22 * 21.87
    expect(ahead).toBeCloseTo(8.34, 2);
  });

  test('goes negative when the pump has fallen below what was paid', () => {
    expect(lockedInValue([lot('a', 10, 21.87, new Date(2026, 8, 28))], AT, 21.40).ahead)
      .toBeLessThan(0);
  });

  test('ignores expired lots, which are no longer the balance', () => {
    expect(lockedInValue([
      lot('live', 10, 21.87, new Date(2026, 8, 28)),
      lot('dead', 99, 19.50, new Date(2026, 2, 1)),
    ], AT, 21.87).cost).toBeCloseTo(218.70, 2);
  });
});
