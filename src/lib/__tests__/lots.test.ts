import { activeLots, balanceOf, expiringWithin, consumeFifo, consumeFifoWithCost } from '../lots';
import { Lot } from '../../data/types';

const lot = (id: string, litres: number, purchased: Date, expires: Date, price = 21.0): Lot => ({
  id, grade: '95', litres, pricePerLitre: price, purchasedAt: purchased, expiresAt: expires,
});

const AT = new Date(2026, 8, 30);
const older = lot('a', 10, new Date(2026, 6, 1), new Date(2026, 9, 30));
const newer = lot('b', 20, new Date(2026, 7, 1), new Date(2026, 10, 30));
const expired = lot('c', 5, new Date(2026, 4, 1), new Date(2026, 8, 1));

describe('activeLots', () => {
  test('excludes lots whose expiry has passed', () => {
    expect(activeLots([older, expired], AT).map(l => l.id)).toEqual(['a']);
  });
  test('a lot expiring exactly now is still active', () => {
    const edge = lot('d', 1, new Date(2026, 6, 1), AT);
    expect(activeLots([edge], AT).map(l => l.id)).toEqual(['d']);
  });
});

describe('balanceOf', () => {
  test('sums only active lots', () => expect(balanceOf([older, newer, expired], AT)).toBe(30));
  test('empty is zero', () => expect(balanceOf([], AT)).toBe(0));
});

describe('expiringWithin', () => {
  test('counts litres expiring inside the window', () => {
    expect(expiringWithin([older, newer], AT, 30)).toBe(10);
  });
  test('excludes litres expiring after the window', () => {
    expect(expiringWithin([newer], AT, 30)).toBe(0);
  });
});

describe('consumeFifo', () => {
  test('takes from the oldest lot first', () => {
    const { lots, consumedIds } = consumeFifo([newer, older], 4, AT);
    expect(consumedIds).toEqual(['a']);
    expect(lots.find(l => l.id === 'a')!.litres).toBe(6);
    expect(lots.find(l => l.id === 'b')!.litres).toBe(20);
  });
  test('spans multiple lots when one is not enough', () => {
    const { lots, consumedIds } = consumeFifo([newer, older], 15, AT);
    expect(consumedIds).toEqual(['a', 'b']);
    expect(lots.find(l => l.id === 'a')).toBeUndefined();
    expect(lots.find(l => l.id === 'b')!.litres).toBe(15);
  });
  test('an exactly drained lot is removed', () => {
    const { lots } = consumeFifo([older], 10, AT);
    expect(lots).toHaveLength(0);
  });
  test('skips expired lots entirely', () => {
    const { lots, consumedIds } = consumeFifo([expired, older], 3, AT);
    expect(consumedIds).toEqual(['a']);
    expect(lots.find(l => l.id === 'c')!.litres).toBe(5);
  });
  test('throws when active balance is insufficient', () => {
    expect(() => consumeFifo([older], 50, AT)).toThrow(/insufficient/i);
  });
  test('does not mutate the input array', () => {
    const input = [older];
    consumeFifo(input, 4, AT);
    expect(input[0].litres).toBe(10);
  });
});

describe('consumeFifoWithCost', () => {
  test('reports cost for a single lot', () => {
    const { cost } = consumeFifoWithCost([older], 4, AT); // older priced at 21.0
    expect(cost).toBeCloseTo(4 * 21.0, 6);
  });

  test('reports the weighted cost when spanning two lots at different prices', () => {
    const cheap = lot('x', 5, new Date(2026, 5, 1), new Date(2026, 9, 30), 20.0);
    const pricey = lot('y', 10, new Date(2026, 6, 1), new Date(2026, 10, 30), 22.0);
    const { cost, consumedIds } = consumeFifoWithCost([pricey, cheap], 8, AT);
    // Takes all 5 of 'x' at 20.0, then 3 of 'y' at 22.0.
    expect(consumedIds).toEqual(['x', 'y']);
    expect(cost).toBeCloseTo(5 * 20.0 + 3 * 22.0, 6);
    expect(cost / 8).toBeCloseTo((5 * 20.0 + 3 * 22.0) / 8, 6);
  });

  test('reports cost correctly when a lot is exactly drained', () => {
    const { cost, lots } = consumeFifoWithCost([older], 10, AT); // older: 10 L @ 21.0
    expect(cost).toBeCloseTo(10 * 21.0, 6);
    expect(lots).toHaveLength(0);
  });

  test('throws on insufficient balance, same as consumeFifo', () => {
    expect(() => consumeFifoWithCost([older], 50, AT)).toThrow(/insufficient/i);
  });

  test('throws on a negative litres amount rather than yielding a negative cost', () => {
    expect(() => consumeFifoWithCost([older], -5, AT)).toThrow(/positive/i);
  });

  test('throws on a zero litres amount', () => {
    expect(() => consumeFifoWithCost([older], 0, AT)).toThrow(/positive/i);
  });

  test('does not mutate the input array', () => {
    const input = [older];
    consumeFifoWithCost(input, 4, AT);
    expect(input[0].litres).toBe(10);
  });

  test('consumeFifo and consumeFifoWithCost agree on lots and consumedIds', () => {
    const a = consumeFifo([newer, older], 15, AT);
    const b = consumeFifoWithCost([newer, older], 15, AT);
    expect(a).toEqual({ lots: b.lots, consumedIds: b.consumedIds });
  });
});
