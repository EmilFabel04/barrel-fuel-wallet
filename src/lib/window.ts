/**
 * The 90-day redemption window (spec §8.1). One definition, because §8.1
 * explicitly anticipates the window changing: seed.ts, wallet.ts's topUp,
 * and the Balance screen's per-row "expires ..." text must all move
 * together, or the ledger's stated expiry dates silently disagree with the
 * lots that actually expire. Fourth such extraction on this project, after
 * round1, consumeFifoWithCost and nextPriceChange.
 */
export const DAY = 86_400_000;
export const REDEMPTION_DAYS = 90;

export function expiryOf(purchasedAt: Date): Date {
  return new Date(purchasedAt.getTime() + REDEMPTION_DAYS * DAY);
}
