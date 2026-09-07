import { priceOn, pricePointOn, nextPriceChange } from '../prices';

describe('priceOn', () => {
  test('returns the inland price for a date inside September', () => {
    expect(priceOn('inland', new Date(2026, 8, 30))).toBe(21.87);
  });
  test('coastal is cheaper than inland on the same date', () => {
    expect(priceOn('coastal', new Date(2026, 8, 30))).toBeLessThan(
      priceOn('inland', new Date(2026, 8, 30))
    );
  });
  test('uses the previous month price the day before a change', () => {
    // October price takes effect 07 Oct 2026 (first Wednesday)
    expect(priceOn('inland', new Date(2026, 9, 6))).toBe(21.87);
  });
  test('uses the new price on the effective date itself', () => {
    expect(priceOn('inland', new Date(2026, 9, 7))).toBe(21.99);
  });
  test('throws for a date before the table starts', () => {
    expect(() => priceOn('inland', new Date(2020, 0, 1))).toThrow(/no price/i);
  });
});

describe('pricePointOn', () => {
  test('returns the full point, not just the number, and priceOn agrees with it', () => {
    const point = pricePointOn('inland', new Date(2026, 8, 30));
    expect(point.pricePerLitre).toBe(priceOn('inland', new Date(2026, 8, 30)));
    expect(point.zone).toBe('inland');
    expect(point.effectiveFrom).toEqual(new Date(2026, 8, 2));
  });
  test('throws for a date before the table starts, same as priceOn', () => {
    expect(() => pricePointOn('inland', new Date(2020, 0, 1))).toThrow(/no price/i);
  });
});

describe('nextPriceChange', () => {
  test('finds the October change from the day before it takes effect', () => {
    const next = nextPriceChange('inland', new Date(2026, 8, 30));
    expect(next?.effectiveFrom).toEqual(new Date(2026, 9, 7));
    expect(next?.pricePerLitre).toBe(21.99);
  });
  test('skips past the effective date itself, since it is no longer "next"', () => {
    const next = nextPriceChange('inland', new Date(2026, 9, 7));
    expect(next).toBeUndefined();
  });
  test('is scoped to the requested zone', () => {
    const next = nextPriceChange('coastal', new Date(2026, 8, 30));
    expect(next?.pricePerLitre).toBe(21.37);
  });
});

// The price table's two boundaries fail in opposite ways, and only one is
// loud. Both are pinned here because the quiet one is what a real clock walks
// into: `now()` moves forward, and past the end of the table every screen would
// go on quoting October 2026's price as "today's" with nothing erroring.
// Extending the table means adding real DMPR figures, not inventing them, so
// this records the behaviour rather than papering over it.
describe('the table boundaries', () => {
  test('before the table starts, priceOn throws — loud', () => {
    expect(() => priceOn('inland', new Date(2026, 0, 1))).toThrow(/no price/i);
  });

  test('after the table ends, priceOn silently returns the last known price', () => {
    const lastKnown = priceOn('inland', new Date(2026, 9, 7)); // the 7 Oct change
    expect(priceOn('inland', new Date(2030, 5, 1))).toBe(lastKnown);
  });

  test('after the table ends, nextPriceChange returns undefined rather than throwing', () => {
    expect(nextPriceChange('inland', new Date(2030, 5, 1))).toBeUndefined();
  });
});
