import { LedgerEntry } from '../data/types';
import { round1 } from './round';
import { DAY } from './window';

/**
 * Two caps, deliberately named so they cannot be reached by accident for one
 * another. They limit opposite directions of flow and exist for unrelated
 * reasons:
 *
 * - The monthly top-up cap limits how much fuel a customer can *buy* into the
 *   wallet in a calendar month (spec §8.2, per linked vehicle).
 * - The weekly redemption cap limits how fast they can *spend* it back out
 *   through the card (spec §8.5). This one is fraud mitigation — it blunts
 *   bulk-resale by capping redemption rate — so the number is a lever, not a
 *   product promise; it is sized to make abuse slow, not to shape normal use.
 */
export const MONTHLY_TOPUP_CAP_L = 500;
export const WEEKLY_REDEMPTION_CAP_L = 110;

/**
 * The redemption cap's window, in days. NOT the same thing as
 * `REDEMPTION_DAYS` in lib/window.ts, which is 90 and is the *price-lock life
 * of a litre* — how long a purchased litre keeps the price it was bought at.
 * This one is a spend-rate limit. Both are called "redemption" in the product
 * vocabulary and they mean different things, so neither name is shortened.
 */
export const REDEMPTION_CAP_WINDOW_DAYS = 7;

const sameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

// --- Monthly top-up cap (spec §8.2) ---------------------------------------

export function litresThisMonth(ledger: LedgerEntry[], at: Date): number {
  return round1(
    ledger
      .filter(e => e.kind === 'topup' && sameMonth(e.when, at))
      .reduce((sum, e) => sum + e.deltaLitres, 0)
  );
}

export function topUpCapRemaining(ledger: LedgerEntry[], at: Date): number {
  return round1(Math.max(0, MONTHLY_TOPUP_CAP_L - litresThisMonth(ledger, at)));
}

export function withinTopUpCap(ledger: LedgerEntry[], at: Date, litres: number): boolean {
  return litres <= topUpCapRemaining(ledger, at);
}

// --- Weekly redemption cap (spec §8.5) ------------------------------------

/**
 * Litres spent through the card over the trailing window ending at `at`.
 *
 * The window ROLLS rather than resetting on a fixed weekday, which matters for
 * what this cap is for. A calendar reset lets a customer redeem the full cap on
 * the last day of one week and the full cap again on the first day of the next
 * — double the limit inside a few hours, which is exactly the bulk-resale
 * pattern the cap exists to stop. A rolling window has no such edge.
 *
 * Only `fill` entries count. Top-ups and bonuses move litres the other way, and
 * an expiry is not a redemption.
 */
export function litresRedeemedSince(ledger: LedgerEntry[], at: Date): number {
  const from = at.getTime() - REDEMPTION_CAP_WINDOW_DAYS * DAY;
  return round1(
    ledger
      .filter(e => e.kind === 'fill')
      // Strictly greater than `from`, so a fill exactly one window old has
      // aged out; not later than `at`, so a future-dated entry cannot consume
      // cap that has not been reached yet.
      .filter(e => e.when.getTime() > from && e.when.getTime() <= at.getTime())
      .reduce((sum, e) => sum + Math.abs(e.deltaLitres), 0)
  );
}

export function redemptionCapRemaining(ledger: LedgerEntry[], at: Date): number {
  return round1(Math.max(0, WEEKLY_REDEMPTION_CAP_L - litresRedeemedSince(ledger, at)));
}

export function withinRedemptionCap(ledger: LedgerEntry[], at: Date, litres: number): boolean {
  return litres <= redemptionCapRemaining(ledger, at);
}
