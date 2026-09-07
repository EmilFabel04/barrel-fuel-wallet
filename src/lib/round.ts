/**
 * Litre quantities are carried to one decimal place everywhere in this product —
 * balances, lot remainders, ledger deltas and cap totals must all agree exactly,
 * so they must all round identically. This is the single definition.
 */
export const round1 = (n: number): number => Math.round(n * 10) / 10;
