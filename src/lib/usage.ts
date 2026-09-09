import { LedgerEntry } from '../data/types';
import { DAY } from './window';
import { topUpCapRemaining } from './caps';

/** Mean days in a Gregorian month. Used only for rate arithmetic. */
const MONTH_DAYS = 30.44;

const fills = (ledger: LedgerEntry[]) => ledger.filter(e => e.kind === 'fill' && e.card);

/**
 * Litres burned per month, measured from the first fill to `at`.
 *
 * Only fills count: a top-up moves litres the other way and a bonus is not
 * consumption. Takes an explicit `at` like everything else in this directory,
 * so it stays pure and testable.
 */
export function burnRate(ledger: LedgerEntry[], at: Date): number {
  const f = fills(ledger);
  if (f.length === 0) return 0;
  const litres = f.reduce((sum, e) => sum + e.card!.litres, 0);
  const first = f.reduce((min, e) => Math.min(min, e.when.getTime()), Infinity);
  // Floored at one month so a wallet with a single same-day fill reports that
  // fill as its monthly rate rather than dividing by ~zero and returning
  // Infinity, which would render as "Infinity L a month" on the Wallet.
  const months = Math.max(1, (at.getTime() - first) / (MONTH_DAYS * DAY));
  return litres / months;
}

/**
 * A rand amount covering roughly one month of driving.
 *
 * Replaces the Top up screen's hardcoded R1 500 default. Rounded to the
 * nearest R50 because a suggestion reading R656.10 looks calculated at the
 * user rather than for them, and capped so the screen never opens on an amount
 * the monthly cap will refuse.
 */
export function suggestedTopUp(
  ledger: LedgerEntry[], at: Date, pricePerLitre: number
): number {
  const capLitres = topUpCapRemaining(ledger, at);
  if (capLitres <= 0 || pricePerLitre <= 0) return 0;
  const litres = burnRate(ledger, at);
  if (litres <= 0) return 0;

  const affordable = Math.min(litres, capLitres) * pricePerLitre;
  // Rounded to the nearest R50 — a suggestion reading R656.10 looks calculated
  // at the user rather than for them — and floored at R100, below which a
  // top-up is not worth the interaction.
  const target = Math.max(100, Math.round(affordable / 50) * 50);
  // The cap is the outer bound and always wins, including over the R100 floor:
  // a default the Top up screen would immediately refuse is worse than none.
  const capRand = Math.floor((capLitres * pricePerLitre) / 50) * 50;
  return Math.min(target, capRand);
}
