import { activeLots, balanceOf, expiringWithin, consumeFifo } from '../lots';
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
