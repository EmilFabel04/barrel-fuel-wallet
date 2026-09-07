import { Lot, LedgerEntry } from './types';
import { priceOn } from './prices';
import { round1, toCents } from '../lib/round';
import { consumeFifoWithCost } from '../lib/lots';
import { expiryOf } from '../lib/window';

export const TODAY = new Date(2026, 8, 30);

const STATION_FOR: Record<string, string> = {
  'Engen William Nicol': 'engen-william-nicol',
  'Sasol Rivonia': 'sasol-rivonia',
  'Shell Grayston': 'shell-grayston',
  'Astron Energy Fourways': 'astron-fourways',
  'Total Sunninghill': 'total-sunninghill',
};

export function buildSeed(): { lots: Lot[]; ledger: LedgerEntry[] } {
  let lots: Lot[] = [];
  const ledger: LedgerEntry[] = [];
  let balance = 0;
  let n = 0;

  function credit(date: Date, litres: number, kind: 'topup' | 'bonus', what: string, detail: string): void {
    n += 1;
    const price = priceOn('inland', date);
    const id = `lot-${n}`;
    balance = round1(balance + litres);
    lots.push({ id, grade: '95', litres, pricePerLitre: price, purchasedAt: date, expiresAt: expiryOf(date) });
    ledger.push({
      id: `e-${n}`, kind, what, when: date, detail,
      grade: '95', deltaLitres: litres, balanceAfter: balance, lotIds: [id],
    });
  }

  // FIFO consumption and its weighted cost both come from the single
  // definition in lib/lots.ts (consumeFifoWithCost) — it enforces the
  // product's 90-day redemption window (spec §8.1), so a fill dated more
  // than 90 days after its lot's purchase throws here rather than silently
  // spending litres that should already have expired.
  function debit(date: Date, litres: number, station: string, suburb: string): void {
    n += 1;
    const pumpPrice = priceOn('inland', date);

    const { lots: nextLots, consumedIds, cost } = consumeFifoWithCost(lots, litres, date);
    lots = nextLots;

    balance = round1(balance - litres);
    ledger.push({
      id: `e-${n}`, kind: 'fill', what: `Fill · ${station}`, when: date, detail: suburb,
      grade: '95', deltaLitres: -litres, balanceAfter: balance, lotIds: consumedIds,
      buyPricePerLitre: toCents(cost / litres),
      card: {
        merchantDescriptor: station.toUpperCase(), stationId: STATION_FOR[station] ?? null,
        mcc: '5541', randAmount: toCents(litres * pumpPrice),
        zone: 'inland', pricePerLitre: pumpPrice, litres, disputed: false,
      },
    });
  }

  // --- Controller supplement Ruling C2-REVISED, fix round 2: historical
  // lots and fills, March-August 2026, so savings and the chart are derived
  // rather than hardcoded. Each lot is bought near the start of its 90-day
  // window and fully drained by one fill nearer the end of that window —
  // the redemption pattern the product actually sells (spec §8.1: the
  // window is "a product requirement, not decoration") — never held longer
  // than 90 days. Every credit/debit call is issued in true chronological
  // order (see the note on `balance` below), and each fill's litres exactly
  // match the oldest lot outstanding at that moment, so consumption never
  // spills into a neighbouring batch or into the September opening lots.
  //
  // `balance` is a simple running total, so out-of-order calls would still
  // sum to the right final number but would stamp the wrong `balanceAfter`
  // on individual entries once the ledger-chain test re-sorts by date —
  // hence interleaving the two September opening-lot purchases (Jul 8, Aug
  // 12) with the historical fills that surround them rather than grouping
  // "history" and "opening lots" as separate code blocks.
  credit(new Date(2026, 2, 4), 10.0, 'topup', 'Top up · 95', 'R195');
  credit(new Date(2026, 2, 9), 10.0, 'topup', 'Top up · 95', 'R195');
  debit(new Date(2026, 3, 3), 10.0, 'Engen William Nicol', 'Bryanston');

  credit(new Date(2026, 3, 13), 12.0, 'topup', 'Top up · 95', 'R245');
  credit(new Date(2026, 3, 25), 12.0, 'topup', 'Top up · 95', 'R245');
  debit(new Date(2026, 4, 7), 10.0, 'Sasol Rivonia', 'Rivonia');

  credit(new Date(2026, 4, 20), 14.7, 'topup', 'Top up · 95', 'R313');
  debit(new Date(2026, 5, 25), 12.0, 'Shell Grayston', 'Sandton');

  // --- Opening balance for the September chain: 33.1 L across two lots,
  // dated between the historical fills that precede/follow them.
  credit(new Date(2026, 6, 8), 12.4, 'topup', 'Top up · 95', 'R267');

  debit(new Date(2026, 6, 15), 12.0, 'Astron Energy Fourways', 'Fourways');
  debit(new Date(2026, 7, 10), 14.7, 'Total Sunninghill', 'Sunninghill');

  credit(new Date(2026, 7, 12), 20.7, 'topup', 'Top up · 95', 'R450');

  // --- September chain from spec §4.2 — 33.1 -> 42.6. Dates and litre
  // deltas are fixed by the spec and unchanged by this fix round.
  credit(new Date(2026, 8, 4), 2.0, 'bonus', 'Referral bonus', 'Lerato M.');
  debit(new Date(2026, 8, 11), 28.3, 'Engen William Nicol', 'Bryanston');
  {
    const date = new Date(2026, 8, 18);
    const price = priceOn('inland', date);
    credit(date, round1(800 / price), 'topup', 'Top up · 95', 'R800');
  }
  debit(new Date(2026, 8, 24), 31.4, 'Sasol Rivonia', 'Rivonia');
  {
    const date = new Date(2026, 8, 28);
    const price = priceOn('inland', date);
    credit(date, round1(1500 / price), 'topup', 'Top up · 95', 'R1 500');
  }
  debit(new Date(2026, 8, 30), 38.0, 'Shell Grayston', 'Sandton');

  return { lots, ledger };
}
