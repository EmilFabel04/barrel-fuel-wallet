import {
  savingsToDate, litresBelowPump, averageBuyPrice, monthlySavings,
  monthWindow, pumpVsBuyByMonth, CHART_MONTHS,
} from '../savings';
import { LedgerEntry } from '../../data/types';
import { buildSeed } from '../../data/seed';
import { DEMO_NOW } from '../clock';

const fill = (when: Date, litres: number, buyPrice: number, pumpPrice: number): LedgerEntry => ({
  id: `f-${when.getTime()}`, kind: 'fill', what: '', when, detail: '',
  grade: '95', deltaLitres: -litres, balanceAfter: 0,
  card: {
    merchantDescriptor: '', stationId: null, mcc: '5541', randAmount: litres * pumpPrice,
    zone: 'inland', pricePerLitre: pumpPrice, litres, disputed: false,
  },
  lotIds: [],
  buyPricePerLitre: buyPrice,
} as LedgerEntry & { buyPricePerLitre: number });

describe('savingsToDate', () => {
  test('is positive when litres were bought below the pump price', () => {
    const l = [fill(new Date(2026, 8, 24), 10, 21.00, 21.87)];
    expect(savingsToDate(l)).toBeCloseTo(8.7, 1);
  });
  test('is negative when litres were bought above the pump price', () => {
    const l = [fill(new Date(2026, 8, 24), 10, 22.00, 21.87)];
    expect(savingsToDate(l)).toBeCloseTo(-1.3, 1);
  });
  test('is zero with no fills', () => expect(savingsToDate([])).toBe(0));
});

describe('litresBelowPump', () => {
  test('counts only fills bought below pump, rounded to 1 decimal', () => {
    const l = [
      fill(new Date(2026, 3, 3), 10, 21.00, 21.87),  // below -> counts
      fill(new Date(2026, 4, 4), 5, 22.00, 21.87),   // above -> excluded
    ];
    expect(litresBelowPump(l)).toBeCloseTo(10, 1);
  });
  test('is zero with no fills', () => expect(litresBelowPump([])).toBe(0));
});

describe('averageBuyPrice', () => {
  test('weights by litres', () => {
    const l = [
      fill(new Date(2026, 7, 1), 10, 21.00, 21.75),
      fill(new Date(2026, 8, 1), 30, 22.00, 21.87),
    ];
    expect(averageBuyPrice(l)).toBeCloseTo(21.75, 2);
  });
  test('is zero with no fills', () => expect(averageBuyPrice([])).toBe(0));
});

describe('monthlySavings', () => {
  const SEP_2026 = new Date(2026, 8, 30);

  test('returns the six months ending at `at`, oldest first', () => {
    const result = monthlySavings([], SEP_2026);
    expect(result.map(r => r.month)).toEqual(['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']);
  });

  test('the window follows the clock rather than being pinned to Apr-Sep', () => {
    const result = monthlySavings([], new Date(2027, 0, 15)); // Jan 2027
    expect(result.map(r => r.month)).toEqual(['AUG', 'SEP', 'OCT', 'NOV', 'DEC', 'JAN']);
  });

  // The bug this rewrite fixes: buckets used to match on getMonth() alone, so
  // a fill in September of any year landed in September 2026's bar. Silent —
  // the chart would just show a wrong number.
  test('does not merge the same month from a different year', () => {
    const l = [
      fill(new Date(2026, 8, 24), 10, 21.00, 21.87), // Sep 2026: saved 8.7
      fill(new Date(2027, 8, 24), 10, 21.00, 21.87), // Sep 2027: outside the window
    ];
    const sep = monthlySavings(l, SEP_2026).find(r => r.month === 'SEP')!;
    expect(sep.rand).toBeCloseTo(8.7, 1);
  });

  test('carries the window back across a year boundary', () => {
    const l = [fill(new Date(2026, 11, 10), 10, 21.00, 21.87)]; // Dec 2026
    const dec = monthlySavings(l, new Date(2027, 1, 5))!.find(r => r.month === 'DEC')!;
    expect(dec.rand).toBeCloseTo(8.7, 1);
  });
  test('buckets each fill by its month and sums to savingsToDate', () => {
    const l = [
      fill(new Date(2026, 3, 3), 10, 20.00, 21.00),  // APR: saved 10
      fill(new Date(2026, 3, 20), 5, 20.00, 20.50),  // APR: saved 2.5
      fill(new Date(2026, 8, 24), 10, 21.00, 21.87), // SEP: saved 8.7
    ];
    const result = monthlySavings(l, SEP_2026);
    const apr = result.find(r => r.month === 'APR')!;
    const sep = result.find(r => r.month === 'SEP')!;
    expect(apr.rand).toBeCloseTo(12.5, 1);
    expect(sep.rand).toBeCloseTo(8.7, 1);
    const sum = result.reduce((s, r) => s + r.rand, 0);
    expect(sum).toBeCloseTo(savingsToDate(l), 6);
  });
});

describe('monthWindow', () => {
  test('returns `count` months ending at `at`, oldest first', () => {
    const w = monthWindow(new Date(2026, 8, 30), 6);
    expect(w).toHaveLength(6);
    expect(w.map(m => m.label)).toEqual(['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']);
    expect(w[5]).toMatchObject({ year: 2026, month: 8 });
  });

  test('carries across a year boundary', () => {
    const w = monthWindow(new Date(2027, 1, 15), 4);
    expect(w.map(m => m.label)).toEqual(['NOV', 'DEC', 'JAN', 'FEB']);
    expect(w[0].year).toBe(2026);
    expect(w[3].year).toBe(2027);
  });
});

describe('pumpVsBuyByMonth', () => {
  const mk = (day: number, litres: number, paid: number, pump: number): LedgerEntry => ({
    id: `e${day}`, kind: 'fill', what: 'Fill', when: new Date(2026, 8, day),
    detail: '', grade: '95', deltaLitres: -litres, balanceAfter: 0,
    buyPricePerLitre: paid,
    card: { merchantDescriptor: 'X', stationId: null, mcc: '5541',
      randAmount: litres * pump, zone: 'inland', pricePerLitre: pump, litres, disputed: false },
  });

  test('returns one entry per chart month, oldest first', () => {
    expect(pumpVsBuyByMonth(buildSeed().ledger, DEMO_NOW)).toHaveLength(CHART_MONTHS);
  });

  test('your price is at or below the pump in every month that has fills', () => {
    for (const m of pumpVsBuyByMonth(buildSeed().ledger, DEMO_NOW)) {
      if (m.litres > 0) expect(m.yourPrice).toBeLessThanOrEqual(m.pumpPrice);
    }
  });

  test('a month with no fills reports zeroes rather than NaN', () => {
    for (const m of pumpVsBuyByMonth([], new Date(2026, 8, 30))) {
      expect(m.litres).toBe(0);
      expect(Number.isNaN(m.yourPrice)).toBe(false);
      expect(Number.isNaN(m.pumpPrice)).toBe(false);
    }
  });

  test('prices are litre-weighted, not a plain mean of fills', () => {
    // One big cheap fill and one small dear one in the same month: the
    // weighted price must sit near the big one.
    const series = pumpVsBuyByMonth([mk(5, 90, 20, 22), mk(6, 10, 30, 22)], new Date(2026, 8, 30));
    const sep = series[series.length - 1];
    expect(sep.litres).toBeCloseTo(100, 5);
    expect(sep.yourPrice).toBeCloseTo(21, 5); // (90*20 + 10*30) / 100
  });
});
