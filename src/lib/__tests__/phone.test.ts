import { normalisePhone, formatPhone, formatAsTyped, isCompleteCode } from '../phone';

describe('normalisePhone', () => {
  test('accepts the national form and returns E.164', () => {
    expect(normalisePhone('0821234567')).toBe('+27821234567');
  });

  test('ignores spaces the user typed or a formatter added', () => {
    expect(normalisePhone('082 123 4567')).toBe('+27821234567');
    expect(normalisePhone('+27 82 123 4567')).toBe('+27821234567');
  });

  test('accepts the country code with or without a plus', () => {
    expect(normalisePhone('+27821234567')).toBe('+27821234567');
    expect(normalisePhone('27821234567')).toBe('+27821234567');
  });

  test('accepts all three South African mobile prefixes', () => {
    expect(normalisePhone('0612345678')).toBe('+27612345678');
    expect(normalisePhone('0712345678')).toBe('+27712345678');
    expect(normalisePhone('0812345678')).toBe('+27812345678');
  });
});

describe('normalisePhone rejects', () => {
  test('a number that is too short or too long', () => {
    expect(normalisePhone('082123456')).toBeNull();
    expect(normalisePhone('08212345678')).toBeNull();
  });

  // A one-time password sent to a landline never arrives, so accepting one
  // would strand the user on the code screen with nothing to enter.
  test('a landline', () => {
    expect(normalisePhone('0211234567')).toBeNull();
    expect(normalisePhone('0123456789')).toBeNull();
  });

  test('anything that is not a number', () => {
    expect(normalisePhone('not a number')).toBeNull();
    expect(normalisePhone('')).toBeNull();
  });
});

describe('formatPhone', () => {
  test('shows a stored E.164 number the way it was typed', () => {
    expect(formatPhone('+27821234567')).toBe('082 123 4567');
  });
});

describe('formatAsTyped', () => {
  test('groups a complete number', () => {
    expect(formatAsTyped('0821234567')).toBe('082 123 4567');
  });

  // The user sees this while they are still typing, so every prefix of a valid
  // number has to render without a trailing or doubled space.
  test('groups a partial number without stray spaces', () => {
    expect(formatAsTyped('')).toBe('');
    expect(formatAsTyped('08')).toBe('08');
    expect(formatAsTyped('082')).toBe('082');
    expect(formatAsTyped('0821')).toBe('082 1');
    expect(formatAsTyped('082123')).toBe('082 123');
  });
});

describe('isCompleteCode', () => {
  test('accepts exactly six digits', () => {
    expect(isCompleteCode('123456')).toBe(true);
  });

  test('rejects a partial code', () => {
    expect(isCompleteCode('12345')).toBe(false);
    expect(isCompleteCode('')).toBe(false);
  });

  test('rejects six characters that are not all digits', () => {
    expect(isCompleteCode('12345a')).toBe(false);
  });
});
