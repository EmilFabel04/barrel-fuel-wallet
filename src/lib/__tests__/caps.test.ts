import { litresThisMonth, capRemaining, withinCap, MONTHLY_CAP_LITRES } from '../caps';
import { LedgerEntry } from '../../data/types';

const entry = (
  kind: LedgerEntry['kind'], when: Date, delta: number
): LedgerEntry => ({
  id: `${kind}-${when.getTime()}`, kind, what: '', when, detail: '',
  grade: '95', deltaLitres: delta, balanceAfter: 0,
});

const AT = new Date(2026, 8, 30);
const sept = [
  entry('topup', new Date(2026, 8, 18), 36.6),
  entry('topup', new Date(2026, 8, 28), 68.6),
];

test('cap is 150 litres', () => expect(MONTHLY_CAP_LITRES).toBe(150));

describe('litresThisMonth', () => {
  test('sums top-ups in the current month', () => {
    expect(litresThisMonth(sept, AT)).toBe(105.2);
  });
  test('excludes a top-up from the previous month', () => {
    const withAug = [...sept, entry('topup', new Date(2026, 7, 20), 50)];
    expect(litresThisMonth(withAug, AT)).toBe(105.2);
  });
  test('excludes bonuses — only purchases count against the cap', () => {
    const withBonus = [...sept, entry('bonus', new Date(2026, 8, 4), 2)];
    expect(litresThisMonth(withBonus, AT)).toBe(105.2);
  });
  test('excludes fills', () => {
    const withFill = [...sept, entry('fill', new Date(2026, 8, 24), -31.4)];
    expect(litresThisMonth(withFill, AT)).toBe(105.2);
  });
  test('is zero with no entries', () => expect(litresThisMonth([], AT)).toBe(0));
});

describe('capRemaining', () => {
  test('is the cap minus this month', () => expect(capRemaining(sept, AT)).toBe(44.8));
  test('never goes below zero', () => {
    const over = [entry('topup', new Date(2026, 8, 1), 200)];
    expect(capRemaining(over, AT)).toBe(0);
  });
});

describe('withinCap', () => {
  test('allows a purchase that fits', () => expect(withinCap(sept, AT, 44.8)).toBe(true));
  test('rejects a purchase that exceeds', () => expect(withinCap(sept, AT, 44.9)).toBe(false));
  test('allows exactly reaching the cap', () => {
    expect(withinCap([], AT, 150)).toBe(true);
  });
});
