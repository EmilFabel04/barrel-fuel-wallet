import { Lot } from '../data/types';
import { activeLots, balanceOf } from './lots';
import { DAY } from './window';
import { toCents } from './round';

export type LotBand = {
  id: string;
  litres: number;
  pricePerLitre: number;
  purchasedAt: Date;
  expiresAt: Date;
  /** Whole days until this lot expires. Never negative. */
  daysLeft: number;
  /** This lot's fraction of the active balance, 0..1. Zero if the balance is. */
  share: number;
};

/**
 * The wallet's lots as drawable bands, soonest expiry first.
 *
 * Sorted by EXPIRY rather than purchase date, which is what both consumers
 * want: the gauge stacks urgency left to right, and the timeline draws
 * runways. `activeLots` sorts by purchase date, and while the two orders
 * coincide for a fixed 90-day window they are not the same idea — sorting
 * explicitly here means a future variable window cannot silently reorder them.
 */
export function lotBands(lots: Lot[], at: Date): LotBand[] {
  const active = activeLots(lots, at);
  const total = balanceOf(lots, at);
  return active
    .map(l => ({
      id: l.id,
      litres: l.litres,
      pricePerLitre: l.pricePerLitre,
      purchasedAt: l.purchasedAt,
      expiresAt: l.expiresAt,
      daysLeft: Math.max(0, Math.ceil((l.expiresAt.getTime() - at.getTime()) / DAY)),
      share: total > 0 ? l.litres / total : 0,
    }))
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
}

export type LockedIn = {
  /** What the current balance actually cost, in rand. */
  cost: number;
  /** What it would cost at `pricePerLitre` today. */
  value: number;
  /** value − cost. Negative when the pump has fallen below what was paid. */
  ahead: number;
};

/**
 * The unrealised position on the balance still in the wallet.
 *
 * Distinct from `savingsToDate`, which is realised — money already saved on
 * fuel already burned. This is what is still held. Both are honest and they
 * are not interchangeable: against a wallet topped up at the current price
 * this is zero while realised savings are not.
 */
export function lockedInValue(lots: Lot[], at: Date, pricePerLitre: number): LockedIn {
  const active = activeLots(lots, at);
  const cost = toCents(active.reduce((sum, l) => sum + l.litres * l.pricePerLitre, 0));
  const value = toCents(balanceOf(lots, at) * pricePerLitre);
  return { cost, value, ahead: toCents(value - cost) };
}
