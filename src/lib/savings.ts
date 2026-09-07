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

const MONTH_LABELS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

/** How many months the Savings chart shows. */
export const CHART_MONTHS = 6;

/**
 * The last `CHART_MONTHS` months ending at `at`, oldest first, with the saving
 * realised in each.
 *
 * The months used to be a fixed APR-SEP list matched on `getMonth()` alone.
 * That was wrong in two ways once the clock could move: the window never
 * advanced past September, and month-only matching has no year, so a fill in
 * September of any later year would have been added to September 2026's bar.
 * Both are silent — the chart would simply show a wrong number with no error.
 *
 * Against the pinned demo instant this returns exactly the same six months it
 * always did, so no published figure moves.
 */
export function monthlySavings(
  ledger: LedgerEntry[], at: Date
): { month: string; rand: number }[] {
  const f = fills(ledger);
  const out: { month: string; rand: number }[] = [];
  for (let back = CHART_MONTHS - 1; back >= 0; back--) {
    // Day 1 of the month `back` months before `at`; JS normalises a negative
    // month index into the previous year, which is what carries the window
    // across a year boundary.
    const bucket = new Date(at.getFullYear(), at.getMonth() - back, 1);
    const year = bucket.getFullYear();
    const month = bucket.getMonth();
    out.push({
      month: MONTH_LABELS[month],
      rand: f
        .filter(e => e.when.getFullYear() === year && e.when.getMonth() === month)
        .reduce((sum, e) => sum + (e.card!.pricePerLitre - e.buyPricePerLitre!) * e.card!.litres, 0),
    });
  }
  return out;
}
