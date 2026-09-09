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

export type MonthCell = { label: string; year: number; month: number };

/**
 * The last `count` months ending at `at`, oldest first.
 *
 * Extracted because two chart series now need the same window, and month-only
 * matching is a silent bug: a fill in September of any later year would land
 * in this September's bucket. Day 1 of a negative month index is a plain JS
 * idiom that normalises into the previous year, which is what carries the
 * window across a year boundary.
 */
export function monthWindow(at: Date, count: number): MonthCell[] {
  const out: MonthCell[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const bucket = new Date(at.getFullYear(), at.getMonth() - back, 1);
    out.push({
      label: MONTH_LABELS[bucket.getMonth()],
      year: bucket.getFullYear(),
      month: bucket.getMonth(),
    });
  }
  return out;
}

/**
 * The saving realised in each of the last `CHART_MONTHS` months, oldest first.
 *
 * Against the pinned demo instant this returns exactly the same six months it
 * always did, so no published figure moves.
 */
export function monthlySavings(
  ledger: LedgerEntry[], at: Date
): { month: string; rand: number }[] {
  const f = fills(ledger);
  return monthWindow(at, CHART_MONTHS).map(cell => ({
    month: cell.label,
    rand: f
      .filter(e => e.when.getFullYear() === cell.year && e.when.getMonth() === cell.month)
      .reduce((sum, e) => sum + (e.card!.pricePerLitre - e.buyPricePerLitre!) * e.card!.litres, 0),
  }));
}

export type MonthPrices = {
  month: string;
  litres: number;
  /** Litre-weighted price actually paid for the litres burned this month. */
  yourPrice: number;
  /** Litre-weighted pump price on the days those litres were burned. */
  pumpPrice: number;
};

/**
 * The two series behind the Savings chart: what the pump charged versus what
 * these litres actually cost, month by month.
 *
 * Weighted by litres rather than averaged across fills, because a 38 L fill
 * and a 2 L fill are not equal evidence about the month's price. A month with
 * no fills returns zeroes, which the chart must render as a gap rather than as
 * a line dropping to the axis.
 */
export function pumpVsBuyByMonth(ledger: LedgerEntry[], at: Date): MonthPrices[] {
  const f = fills(ledger);
  return monthWindow(at, CHART_MONTHS).map(cell => {
    const inMonth = f.filter(
      e => e.when.getFullYear() === cell.year && e.when.getMonth() === cell.month);
    const litres = inMonth.reduce((s, e) => s + e.card!.litres, 0);
    if (litres === 0) return { month: cell.label, litres: 0, yourPrice: 0, pumpPrice: 0 };
    return {
      month: cell.label,
      litres,
      yourPrice: inMonth.reduce((s, e) => s + e.buyPricePerLitre! * e.card!.litres, 0) / litres,
      pumpPrice: inMonth.reduce((s, e) => s + e.card!.pricePerLitre * e.card!.litres, 0) / litres,
    };
  });
}
