import { buildSeed } from '../seed';
import { DEMO_NOW } from '../../lib/clock';
import { balanceOf, expiringWithin } from '../../lib/lots';
import { litresThisMonth } from '../../lib/caps';
import { savingsToDate, litresBelowPump, monthlySavings, averageBuyPrice } from '../../lib/savings';
import { round1 } from '../../lib/round';
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

  test('September top-ups total 105.2 L, under the 500 L cap', () => {
    expect(litresThisMonth(ledger, DEMO_NOW)).toBeCloseTo(105.2, 1);
  });

  test('every lot is petrol 95', () => {
    expect(lots.every(l => l.grade === '95')).toBe(true);
  });

  test('FIFO leaves only the newest lot, so nothing expires within 30 days', () => {
    // Oldest-first consumption means surviving stock is always the most recent
    // purchase. Pinned so a future seed change cannot silently break the Balance
    // screen's expiry split.
    expect(expiringWithin(lots, DEMO_NOW, 30)).toBe(0);
    expect(lots).toHaveLength(1);
    expect(lots[0].expiresAt.getMonth()).toBe(11); // December
  });

  // --- Controller supplement Ruling C2-REVISED: honest, derived savings ---
  // Fix round 2: the design's "58.7 L / R1,284" figures were both established
  // as wrong (R1,284 was the litres' rand *value*, not a saving; 58.7 L was
  // that same mislabelled figure's litre count). Neither is a target here —
  // savings must simply be honestly derived and non-trivial.

  test('historical fills (Mar-Aug) bought a non-trivial amount below the pump price', () => {
    const historical = ledger.filter(e => e.kind === 'fill' && e.when < new Date(2026, 8, 1));
    expect(litresBelowPump(historical)).toBeGreaterThan(20);
  });

  // Pinned to spec §4.3's published figures rather than a loose bound, so the
  // seed cannot silently drift off the numbers the spec itself commits to.
  test('savings-to-date matches spec §4.3: R71.654', () => {
    expect(savingsToDate(ledger)).toBeCloseTo(71.654, 3);
  });

  test('litres bought below the pump price matches spec §4.3: 118.4 L', () => {
    expect(litresBelowPump(ledger)).toBeCloseTo(118.4, 1);
  });

  test('average buy price matches spec §4.3: R21.21/L', () => {
    expect(Number(averageBuyPrice(ledger).toFixed(2))).toBeCloseTo(21.21, 2);
  });

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
});
