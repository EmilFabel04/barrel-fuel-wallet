import { normaliseDescriptor, resolveZone, deriveLitres } from '../cardfill';

describe('normaliseDescriptor', () => {
  test('matches a clean descriptor', () => {
    expect(normaliseDescriptor('ENGEN WILLIAM NICOL')).toBe('engen-william-nicol');
  });
  test('matches despite a trailing terminal number', () => {
    expect(normaliseDescriptor('ENGEN WILLIAM NICOL 4412')).toBe('engen-william-nicol');
  });
  test('matches despite suburb noise', () => {
    expect(normaliseDescriptor('SHELL GRAYSTON SANDTON')).toBe('shell-grayston');
  });
  test('is case insensitive', () => {
    expect(normaliseDescriptor('sasol rivonia')).toBe('sasol-rivonia');
  });
  test('returns null when nothing matches', () => {
    expect(normaliseDescriptor('PUMA MUSINA N1')).toBeNull();
  });

  test('matches whole words, not substrings', () => {
    // 'RIVONIAN' contains 'rivonia' as a substring but is a different word
    expect(normaliseDescriptor('RIVONIAN SASOL PLAZA')).toBeNull();
    expect(normaliseDescriptor('NICOLAS ENGEN WILLIAM')).toBeNull();
  });

  test('requires every significant word, not just some', () => {
    // 'astron' is missing, so this must not match astron-fourways
    expect(normaliseDescriptor('FOURWAYS SERVICE STATION')).toBeNull();
  });
});

describe('resolveZone', () => {
  test('a known station wins', () => {
    expect(resolveZone('shell-grayston', 'coastal')).toBe('inland');
  });
  test('falls back to the transaction zone when the station is unknown', () => {
    expect(resolveZone(null, 'coastal')).toBe('coastal');
  });
  test('throws rather than guessing when both are unknown', () => {
    expect(() => resolveZone(null, null)).toThrow(/cannot resolve zone/i);
  });
});

describe('deriveLitres', () => {
  test('divides rand by price and rounds to one decimal', () => {
    expect(deriveLitres(873.6, 21.84)).toBe(40.0);
  });
  test('rounds correctly on an inexact division', () => {
    expect(deriveLitres(800, 21.87)).toBe(36.6);
  });
  test('rejects a zero amount', () => expect(() => deriveLitres(0, 21.87)).toThrow(/positive/i));
  test('rejects a negative amount', () => expect(() => deriveLitres(-10, 21.87)).toThrow(/positive/i));
  test('rejects a zero price', () => expect(() => deriveLitres(100, 0)).toThrow(/positive/i));
});
