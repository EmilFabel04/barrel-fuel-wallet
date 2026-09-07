import { buildSeed, TODAY } from '../seed';
import { balanceOf, expiringWithin } from '../../lib/lots';
import { litresThisMonth } from '../../lib/caps';
import { savingsToDate, litresBelowPump, monthlySavings } from '../../lib/savings';
import { round1 } from '../../lib/round';

describe('seed', () => {
  const { lots, ledger } = buildSeed();

  test('today is 30 September 2026', () => {
    expect(TODAY.getFullYear()).toBe(2026);
    expect(TODAY.getMonth()).toBe(8);
    expect(TODAY.getDate()).toBe(30);
  });

  test('balance is 42.6 L', () => {
    expect(balanceOf(lots, TODAY)).toBeCloseTo(42.6, 1);
  });

  test('ledger chains exactly — each balanceAfter follows from the last', () => {
    const chron = [...ledger].sort((a, b) => a.when.getTime() - b.when.getTime());
    for (let i = 1; i < chron.length; i++) {
      const expected = round1(chron[i - 1].balanceAfter + chron[i].deltaLitres);
      expect(chron[i].balanceAfter).toBeCloseTo(expected, 1);
    }
  });

  test('the newest ledger entry agrees with the balance', () => {
    const chron = [...ledger].sort((a, b) => a.when.getTime() - b.when.getTime());
    expect(chron[chron.length - 1].balanceAfter).toBeCloseTo(42.6, 1);
  });

  test('no intermediate balance is negative', () => {
    for (const e of ledger) expect(e.balanceAfter).toBeGreaterThanOrEqual(0);
  });

  test('September top-ups total 105.2 L, under the 150 L cap', () => {
    expect(litresThisMonth(ledger, TODAY)).toBeCloseTo(105.2, 1);
  });

  test('every lot is petrol 95', () => {
    expect(lots.every(l => l.grade === '95')).toBe(true);
  });

  test('FIFO leaves only the newest lot, so nothing expires within 30 days', () => {
    // Oldest-first consumption means surviving stock is always the most recent
    // purchase. Pinned so a future seed change cannot silently break the Balance
    // screen's expiry split.
    expect(expiringWithin(lots, TODAY, 30)).toBe(0);
    expect(lots).toHaveLength(1);
    expect(lots[0].expiresAt.getMonth()).toBe(11); // December
  });

  // --- Controller supplement Ruling C2-REVISED: honest, derived savings ---

  test('historical fills (Mar-Aug) bought roughly 58.7 L below the pump price', () => {
    const historical = ledger.filter(e => e.kind === 'fill' && e.when < new Date(2026, 8, 1));
    expect(litresBelowPump(historical)).toBeCloseTo(58.7, 1);
  });

  test('savings-to-date lands in the honest R80-R200 band, not the mislabelled R1,284', () => {
    const total = savingsToDate(ledger);
    expect(total).toBeGreaterThan(80);
    expect(total).toBeLessThan(200);
  });

  test('the six monthly savings figures sum exactly to the savings-to-date total', () => {
    const monthly = monthlySavings(ledger);
    expect(monthly).toHaveLength(6);
    const sum = monthly.reduce((s, m) => s + m.rand, 0);
    expect(sum).toBeCloseTo(savingsToDate(ledger), 6);
  });

  test('no fill lands outside the six charted months (Apr-Sep)', () => {
    const fills = ledger.filter(e => e.kind === 'fill');
    for (const f of fills) {
      expect(f.when.getMonth()).toBeGreaterThanOrEqual(3); // April
      expect(f.when.getMonth()).toBeLessThanOrEqual(8);    // September
    }
  });
});
