import { priceRise, isRiseImminent, RISE_CTA_WINDOW_DAYS } from '../pricewatch';

describe('priceRise', () => {
  test('describes the next scheduled change', () => {
    // 30 Sep 2026: inland is R21.87, rising to R21.99 on 7 Oct.
    const r = priceRise('inland', new Date(2026, 8, 30));
    expect(r).not.toBeNull();
    expect(r!.pricePerLitre).toBe(21.99);
    expect(r!.effectiveFrom.getDate()).toBe(7);
    expect(r!.deltaCents).toBe(12);
    expect(r!.daysUntil).toBe(7);
  });

  test('progress runs 0..1 across the interval since the current price took effect', () => {
    // The current point is 2 Sep and the rise is 7 Oct — 35 days apart.
    const early = priceRise('inland', new Date(2026, 8, 2))!;
    const late = priceRise('inland', new Date(2026, 9, 6))!;
    expect(early.progress).toBeCloseTo(0, 2);
    expect(late.progress).toBeGreaterThan(0.9);
    for (const r of [early, late]) {
      expect(r.progress).toBeGreaterThanOrEqual(0);
      expect(r.progress).toBeLessThanOrEqual(1);
    }
  });

  test('is null past the end of the price table', () => {
    // The table ends 7 Oct 2026. This is the direction a real clock travels,
    // and every caller must still render.
    expect(priceRise('inland', new Date(2027, 0, 1))).toBeNull();
  });

  test('reports a fall as negative cents rather than hiding it', () => {
    // R21.80 in June falling to R21.40 on 1 July.
    expect(priceRise('inland', new Date(2026, 5, 10))!.deltaCents).toBe(-40);
  });
});

describe('isRiseImminent', () => {
  test('is false when there is no rise at all', () => {
    expect(isRiseImminent(null)).toBe(false);
  });

  test('is true inside the CTA window and false outside it', () => {
    const inside = priceRise('inland', new Date(2026, 8, 30))!;   // 7 days out
    const outside = priceRise('inland', new Date(2026, 8, 3))!;   // 34 days out
    expect(inside.daysUntil).toBeLessThanOrEqual(RISE_CTA_WINDOW_DAYS);
    expect(isRiseImminent(inside)).toBe(true);
    expect(isRiseImminent(outside)).toBe(false);
  });

  test('a falling price is never an imminent rise', () => {
    const fall = priceRise('inland', new Date(2026, 5, 25))!; // -40c on 1 Jul
    expect(fall.deltaCents).toBeLessThan(0);
    expect(isRiseImminent(fall)).toBe(false);
  });
});
