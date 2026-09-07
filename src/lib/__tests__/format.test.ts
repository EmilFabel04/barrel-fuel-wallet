import { formatLitres, formatRand, formatRandWhole, formatPrice, formatDayMonth } from '../format';

describe('formatLitres', () => {
  test('one decimal place', () => expect(formatLitres(42.6)).toBe('42.6'));
  test('pads a whole number', () => expect(formatLitres(42)).toBe('42.0'));
  test('rounds to one decimal', () => expect(formatLitres(36.5847)).toBe('36.6'));
  test('groups thousands', () => expect(formatLitres(1234.5)).toBe('1,234.5'));
  test('handles zero', () => expect(formatLitres(0)).toBe('0.0'));
});

describe('formatRand', () => {
  test('two decimals', () => expect(formatRand(931.66)).toBe('931.66'));
  test('groups four digits', () => expect(formatRand(1284)).toBe('1,284.00'));
  test('groups seven digits', () => expect(formatRand(1234567.89)).toBe('1,234,567.89'));
});

describe('formatRandWhole', () => {
  test('no decimals', () => expect(formatRandWhole(1500)).toBe('1,500'));
  test('handles zero', () => expect(formatRandWhole(0)).toBe('0'));
});

describe('formatPrice', () => {
  test('two decimals, no grouping', () => expect(formatPrice(21.87)).toBe('21.87'));
});

describe('formatDayMonth', () => {
  test('formats day and short month', () => {
    expect(formatDayMonth(new Date(2026, 11, 27))).toBe('27 Dec');
  });
  test('does not zero-pad a single-digit day', () => {
    expect(formatDayMonth(new Date(2026, 8, 4))).toBe('4 Sep');
  });
});
