import { LedgerEntry } from '../../data/types';
import { burnRate, suggestedTopUp } from '../usage';
import { MONTHLY_TOPUP_CAP_L } from '../caps';

const MONTH_MS = 30.44 * 86_400_000;

const fill = (when: Date, litres: number): LedgerEntry => ({
  id: `f-${when.getTime()}-${litres}`, kind: 'fill', what: 'Fill', when, detail: '',
  grade: '95', deltaLitres: -litres, balanceAfter: 0,
  buyPricePerLitre: 20,
  card: {
    merchantDescriptor: 'X', stationId: null, mcc: '5541', randAmount: litres * 21,
    zone: 'inland', pricePerLitre: 21, litres, disputed: false,
  },
});

const topup = (when: Date, litres: number): LedgerEntry => ({
  id: `t-${when.getTime()}-${litres}`, kind: 'topup', what: 'Top up · 95', when, detail: '',
  grade: '95', deltaLitres: litres, balanceAfter: 0,
});

describe('burnRate', () => {
  test('is zero with no fills', () => {
    expect(burnRate([], new Date(2026, 8, 30))).toBe(0);
    expect(burnRate([topup(new Date(2026, 5, 1), 40)], new Date(2026, 8, 30))).toBe(0);
  });

  test('counts only fills, not top-ups or bonuses', () => {
    const at = new Date(2026, 8, 30);
    const withTopUp = burnRate(
      [fill(new Date(2026, 5, 30), 30), topup(new Date(2026, 6, 1), 500)], at);
    const without = burnRate([fill(new Date(2026, 5, 30), 30)], at);
    expect(withTopUp).toBe(without);
  });

  test('averages litres over the span from the first fill to `at`', () => {
    // Two fills of 30 L, the first exactly three months before `at`.
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - 3 * MONTH_MS);
    expect(burnRate([fill(first, 30), fill(new Date(2026, 7, 30), 30)], at)).toBeCloseTo(20, 0);
  });

  test('a single fill on the same day as `at` does not divide by zero', () => {
    const at = new Date(2026, 8, 30);
    const rate = burnRate([fill(at, 38)], at);
    expect(Number.isFinite(rate)).toBe(true);
    expect(rate).toBeGreaterThan(0);
  });
});

describe('suggestedTopUp', () => {
  test('is zero when there is nothing to go on', () => {
    expect(suggestedTopUp([], new Date(2026, 8, 30), 21.87)).toBe(0);
  });

  test('covers about a month of burn, rounded to the nearest R50', () => {
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - 2 * MONTH_MS);
    // 60 L over two months = 30 L/month; at R21.87 that is R656.10 -> R650.
    const rand = suggestedTopUp([fill(first, 30), fill(at, 30)], at, 21.87);
    expect(rand % 50).toBe(0);
    expect(rand).toBeGreaterThanOrEqual(600);
    expect(rand).toBeLessThanOrEqual(700);
  });

  test('never suggests less than R100 when there is any usage at all', () => {
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - 12 * MONTH_MS);
    expect(suggestedTopUp([fill(first, 1), fill(at, 1)], at, 21.87)).toBeGreaterThanOrEqual(100);
  });

  test('never suggests more litres than the monthly cap has left', () => {
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - MONTH_MS);
    const ledger = [
      fill(first, 900), fill(at, 900),
      topup(new Date(2026, 8, 2), MONTHLY_TOPUP_CAP_L - 10),
    ];
    expect(suggestedTopUp(ledger, at, 21.87) / 21.87).toBeLessThanOrEqual(10);
  });

  test('is zero when the cap is already exhausted', () => {
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - MONTH_MS);
    const ledger = [fill(first, 30), fill(at, 30), topup(new Date(2026, 8, 2), MONTHLY_TOPUP_CAP_L)];
    expect(suggestedTopUp(ledger, at, 21.87)).toBe(0);
  });
});
