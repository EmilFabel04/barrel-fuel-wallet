import { Zone } from '../data/types';
import { priceOn, pricePointOn, nextPriceChange } from '../data/prices';
import { DAY } from './window';

/**
 * How close a change must be before the Wallet swaps its second button from
 * HISTORY to the price CTA. Fourteen days is roughly half a price cycle — long
 * enough to act on, short enough that the button is not permanently a CTA.
 */
export const RISE_CTA_WINDOW_DAYS = 14;

export type PriceRise = {
  effectiveFrom: Date;
  pricePerLitre: number;
  /** Signed. Negative when the next change is a cut. */
  deltaCents: number;
  /** Whole days from `at` until the change takes effect. */
  daysUntil: number;
  /** How far through the current price's life we are, 0..1. */
  progress: number;
};

/**
 * The next scheduled price change, described rather than merely located.
 *
 * Everything here is read from the price table — the same table the wallet
 * deducts against — because a transcribed date is exactly how the Wallet's
 * "Next change · 02 Oct" literal survived three fix rounds while contradicting
 * DMPR's first-Wednesday rule.
 *
 * Returns `null` past the end of the table rather than inventing a change.
 * That is the direction a real clock travels, and every caller must render
 * correctly without one.
 */
export function priceRise(zone: Zone, at: Date): PriceRise | null {
  const next = nextPriceChange(zone, at);
  if (!next) return null;
  const current = pricePointOn(zone, at);
  const span = next.effectiveFrom.getTime() - current.effectiveFrom.getTime();
  const elapsed = at.getTime() - current.effectiveFrom.getTime();
  return {
    effectiveFrom: next.effectiveFrom,
    pricePerLitre: next.pricePerLitre,
    deltaCents: Math.round((next.pricePerLitre - priceOn(zone, at)) * 100),
    daysUntil: Math.max(0, Math.ceil((next.effectiveFrom.getTime() - at.getTime()) / DAY)),
    progress: span > 0 ? Math.min(1, Math.max(0, elapsed / span)) : 0,
  };
}

/**
 * Whether to show the "beat the rise" call to action.
 *
 * A cut is never imminent in this sense — there is nothing to beat, and
 * telling someone to hurry before the price DROPS would be a lie.
 */
export function isRiseImminent(rise: PriceRise | null): boolean {
  return rise !== null && rise.deltaCents > 0 && rise.daysUntil <= RISE_CTA_WINDOW_DAYS;
}
