import { buildSeed } from '../seed';
import { DEMO_NOW } from '../../lib/clock';
import { balanceOf, expiringWithin } from '../../lib/lots';
import { litresThisMonth } from '../../lib/caps';
import { savingsToDate, litresBelowPump, monthlySavings, averageBuyPrice } from '../../lib/savings';
import { round1 } from '../../lib/round';
import { lotBands, lockedInValue } from '../../lib/holdings';
import { priceOn } from '../prices';
import { DAY, REDEMPTION_DAYS } from '../../lib/window';

describe('seed', () => {
  const { lots, ledger } = buildSeed();

  test('balance is 42.6 L', () => {
    expect(balanceOf(lots, DEMO_NOW)).toBeCloseTo(42.6, 1);
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

  test('every lot is petrol 95', () => {
    expect(lots.every(l => l.grade === '95')).toBe(true);
  });

  test('historical fills (Mar-Aug) bought a non-trivial amount below the pump price', () => {
    const historical = ledger.filter(e => e.kind === 'fill' && e.when < new Date(2026, 8, 1));
    expect(litresBelowPump(historical)).toBeGreaterThan(20);
  });

  // Pinned to spec §4.3's published figures rather than a loose bound, so the
  // seed cannot silently drift off the numbers the spec itself commits to.
  test('the six monthly savings figures sum exactly to the savings-to-date total', () => {
    const monthly = monthlySavings(ledger, DEMO_NOW);
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

  // --- Fix round 2, IMPORTANT-1 follow-up: the regression guard that would
  // have caught the original bug — every fill must draw only lots that were
  // still within the product's 90-day redemption window (spec §8.1) on the
  // day of that fill. Reconstructed purely from the seed's own ledger output
  // (no access to buildSeed's internal, already-consumed Lot objects needed):
  // every topup/bonus entry records its own lot's id and purchase date, and
  // every fill records which lot ids it drew from.
  test('every fill draws only lots that were unexpired at the time of the fill', () => {
    const purchasedAt = new Map<string, Date>();
    for (const e of ledger) {
      if (e.kind !== 'fill') {
        for (const id of e.lotIds ?? []) purchasedAt.set(id, e.when);
      }
    }
    const NINETY_DAYS = REDEMPTION_DAYS * DAY;
    for (const e of ledger) {
      if (e.kind !== 'fill') continue;
      for (const id of e.lotIds ?? []) {
        const boughtAt = purchasedAt.get(id);
        expect(boughtAt).toBeDefined();
        expect(e.when.getTime() - boughtAt!.getTime()).toBeLessThanOrEqual(NINETY_DAYS);
      }
    }
  });

  // --- The laddered wallet. Every figure below was computed from the model
  // itself, never transcribed. A single R984 top-up on 8 July -- someone
  // buying ahead of an expected rise -- is what ladders it.

  test('the wallet is laddered across five lots at three prices', () => {
    const bands = lotBands(lots, DEMO_NOW);
    expect(bands).toHaveLength(5);
    expect(bands.map(b => b.litres)).toEqual([12, 10, 2, 8, 10.6]);
    expect(bands.map(b => b.pricePerLitre)).toEqual([21.40, 21.60, 21.87, 21.87, 21.87]);
    expect(bands.map(b => b.daysLeft)).toEqual([6, 41, 64, 78, 88]);
  });

  test('12.0 L is inside the 30-day expiry warning', () => {
    // The old seed showed 0.0 L here, which made the warning undemonstrable.
    expect(expiringWithin(lots, DEMO_NOW, 30)).toBe(12);
  });

  test('the balance is genuinely ahead of the pump', () => {
    const { cost, value, ahead } = lockedInValue(lots, DEMO_NOW, priceOn('inland', DEMO_NOW));
    expect(cost).toBeCloseTo(923.32, 2);
    expect(value).toBeCloseTo(931.66, 2);
    expect(ahead).toBeCloseTo(8.34, 2);
  });

  test('realised savings and the litres behind them', () => {
    expect(savingsToDate(ledger)).toBeCloseTo(76.19, 2);
    expect(litresBelowPump(ledger)).toBe(92.7);
    expect(averageBuyPrice(ledger)).toBeCloseTo(20.72, 2);
  });

  test('the six monthly bars, with May still the tallest', () => {
    const bars = monthlySavings(ledger, DEMO_NOW);
    expect(bars.map(b => b.month)).toEqual(['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']);
    const rounded = bars.map(b => Number(b.rand.toFixed(2)));
    expect(rounded).toEqual([9.00, 18.00, 16.80, 12.00, 4.41, 15.98]);
    expect(Math.max(...rounded)).toBe(18.00);
  });

  test('September top-ups against the monthly cap', () => {
    // Down from 105.2 L. Accepted: bigger September top-ups would survive as
    // large September lots, because FIFO cannot reach past the July lot, and
    // that pushes the balance to ~130 L -- three tanks, not one.
    expect(litresThisMonth(ledger, DEMO_NOW)).toBe(18.6);
  });

  test('the ledger runs in true chronological order', () => {
    const times = ledger.map(e => e.when.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  test('every rand detail string matches the litres it bought', () => {
    for (const e of ledger.filter(x => x.kind === 'topup')) {
      const rand = Number(e.detail.replace(/[R\s]/g, ''));
      expect(e.deltaLitres).toBeCloseTo(round1(rand / priceOn('inland', e.when)), 5);
    }
  });

  test('the newest fill is dated the demo instant, for the Wallet last-fill row', () => {
    const fills = ledger.filter(e => e.kind === 'fill');
    expect(fills[fills.length - 1].when.getTime()).toBe(DEMO_NOW.getTime());
  });
});
