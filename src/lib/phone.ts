/**
 * South African mobile numbers, normalised to E.164 for storage.
 *
 * The sign-in stub accepts any well-formed number, but "well-formed" is a real
 * rule rather than a placeholder: when a real one-time-password provider
 * replaces the stub it will replace the *transport*, not this.
 */

/** Nine national digits, opening with one of the three mobile prefixes. */
const MOBILE = /^[678]\d{8}$/;

/**
 * Returns the number as `+27…`, or null if it is not a South African mobile
 * number. Landlines are rejected deliberately — a code sent to one never
 * arrives.
 */
export function normalisePhone(input: string): string | null {
  const digits = input.replace(/[\s()+-]/g, '');
  const national = digits.startsWith('27')
    ? digits.slice(2)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;
  return MOBILE.test(national) ? `+27${national}` : null;
}

/**
 * Groups national digits the way they are written here — `082 123 4567`. Takes
 * any prefix, because the sign-in screen renders it on every keystroke, so it
 * must not produce a trailing or doubled space mid-number.
 */
export const formatAsTyped = (digits: string): string =>
  [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 10)].filter(Boolean).join(' ');

/**
 * The stored E.164 number, shown back the way a South African would have typed
 * it. Used on the code screen so the user can check the number before waiting
 * for a message that will not come.
 */
export const formatPhone = (e164: string): string =>
  formatAsTyped(`0${e164.replace(/^\+27/, '')}`);

/** Digits in a one-time password. */
export const CODE_LENGTH = 6;

/**
 * Whether the entered code is complete. The stub accepts *any* six digits —
 * there is nothing to check it against — but "six digits" is the rule the real
 * provider will also enforce, so the screen can be written against it now.
 */
export const isCompleteCode = (code: string): boolean =>
  code.length === CODE_LENGTH && /^\d+$/.test(code);
