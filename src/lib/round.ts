/**
 * Litre quantities are carried to one decimal place everywhere in this product —
 * balances, lot remainders, ledger deltas and cap totals must all agree exactly,
 * so they must all round identically. This is the single definition.
 */
export const round1 = (n: number): number => Math.round(n * 10) / 10;

/**
 * Money is rounded to the cent it would actually be billed/charged at. This
 * also neutralises floating-point noise from summing several lots at the
 * *same* per-litre price (e.g. two September lots both bought at 21.87) —
 * without it, `cost / litres` can land a few ulps under the price and get
 * misclassified as "below pump" by savings.ts. `toFixed` does this without
 * reintroducing a second litres-rounding helper alongside round1 (Ruling T4-a).
 */
export const toCents = (n: number): number => Number(n.toFixed(2));
