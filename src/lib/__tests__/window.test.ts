import { DAY, REDEMPTION_DAYS, expiryOf } from '../window';

test('DAY is one day in milliseconds', () => {
  expect(DAY).toBe(24 * 60 * 60 * 1000);
});

test('REDEMPTION_DAYS is 90, per spec §8.1', () => {
  expect(REDEMPTION_DAYS).toBe(90);
});

test('expiryOf adds the redemption window to a purchase date', () => {
  const purchased = new Date(2026, 8, 4); // 4 Sep 2026
  expect(expiryOf(purchased)).toEqual(new Date(purchased.getTime() + REDEMPTION_DAYS * DAY));
  // 4 Sep + 90 days = 3 Dec 2026
  const exp = expiryOf(purchased);
  expect(exp.getFullYear()).toBe(2026);
  expect(exp.getMonth()).toBe(11); // December
  expect(exp.getDate()).toBe(3);
});
