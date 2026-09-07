import { savingsToDate, litresBelowPump, averageBuyPrice, monthlySavings } from '../savings';
import { LedgerEntry } from '../../data/types';

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
  test('returns six entries labelled APR through SEP, oldest first', () => {
    const result = monthlySavings([]);
    expect(result.map(r => r.month)).toEqual(['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']);
  });
  test('buckets each fill by its month and sums to savingsToDate', () => {
    const l = [
      fill(new Date(2026, 3, 3), 10, 20.00, 21.00),  // APR: saved 10
      fill(new Date(2026, 3, 20), 5, 20.00, 20.50),  // APR: saved 2.5
      fill(new Date(2026, 8, 24), 10, 21.00, 21.87), // SEP: saved 8.7
    ];
    const result = monthlySavings(l);
    const apr = result.find(r => r.month === 'APR')!;
    const sep = result.find(r => r.month === 'SEP')!;
    expect(apr.rand).toBeCloseTo(12.5, 1);
    expect(sep.rand).toBeCloseTo(8.7, 1);
    const sum = result.reduce((s, r) => s + r.rand, 0);
    expect(sum).toBeCloseTo(savingsToDate(l), 6);
  });
});
