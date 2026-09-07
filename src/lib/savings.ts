import { LedgerEntry } from '../data/types';
import { round1 } from './round';

const fills = (ledger: LedgerEntry[]) =>
  ledger.filter(e => e.kind === 'fill' && e.card && e.buyPricePerLitre !== undefined);

/** Difference between the pump price on the day and what the litres actually cost. */
export function savingsToDate(ledger: LedgerEntry[]): number {
  return fills(ledger).reduce(
    (sum, e) => sum + (e.card!.pricePerLitre - e.buyPricePerLitre!) * e.card!.litres,
    0
  );
}

export function litresBelowPump(ledger: LedgerEntry[]): number {
  const n = fills(ledger)
    .filter(e => e.buyPricePerLitre! < e.card!.pricePerLitre)
    .reduce((sum, e) => sum + e.card!.litres, 0);
  return round1(n);
}

export function averageBuyPrice(ledger: LedgerEntry[]): number {
  const f = fills(ledger);
  const litres = f.reduce((s, e) => s + e.card!.litres, 0);
  if (litres === 0) return 0;
  return f.reduce((s, e) => s + e.buyPricePerLitre! * e.card!.litres, 0) / litres;
}

// The Savings screen's chart is fixed to the seed's six active months. Every
// fill in the seed lands in one of these buckets, so their sum always equals
// savingsToDate exactly — see supplement Ruling C2-REVISED item 5.
const CHART_MONTHS: { month: string; monthIndex: number }[] = [
  { month: 'APR', monthIndex: 3 },
  { month: 'MAY', monthIndex: 4 },
  { month: 'JUN', monthIndex: 5 },
  { month: 'JUL', monthIndex: 6 },
  { month: 'AUG', monthIndex: 7 },
  { month: 'SEP', monthIndex: 8 },
];

export function monthlySavings(ledger: LedgerEntry[]): { month: string; rand: number }[] {
  const f = fills(ledger);
  return CHART_MONTHS.map(({ month, monthIndex }) => ({
    month,
    rand: f
      .filter(e => e.when.getMonth() === monthIndex)
      .reduce((sum, e) => sum + (e.card!.pricePerLitre - e.buyPricePerLitre!) * e.card!.litres, 0),
  }));
}
