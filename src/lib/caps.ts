import { LedgerEntry } from '../data/types';
import { round1 } from './round';

export const MONTHLY_CAP_LITRES = 150;

const sameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function litresThisMonth(ledger: LedgerEntry[], at: Date): number {
  return round1(
    ledger
      .filter(e => e.kind === 'topup' && sameMonth(e.when, at))
      .reduce((sum, e) => sum + e.deltaLitres, 0)
  );
}

export function capRemaining(ledger: LedgerEntry[], at: Date): number {
  return round1(Math.max(0, MONTHLY_CAP_LITRES - litresThisMonth(ledger, at)));
}

export function withinCap(ledger: LedgerEntry[], at: Date, litres: number): boolean {
  return litres <= capRemaining(ledger, at);
}
