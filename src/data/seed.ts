import { Lot, LedgerEntry } from './types';
import { priceOn } from './prices';
import { round1 } from '../lib/round';

export const TODAY = new Date(2026, 8, 30);
const DAY = 86_400_000;
const plus90 = (d: Date): Date => new Date(d.getTime() + 90 * DAY);

// Money is rounded to the cent it would actually be billed at. This also
// neutralises floating-point noise from summing several lots at the *same*
// per-litre price (e.g. two September lots both bought at 21.87) — without
// it, `cost / litres` can land a few ulps under the price and get
// misclassified as "below pump" by savings.ts. `toFixed` does this without
// reintroducing a second litres-rounding helper (see round.ts / Ruling T4-a).
const toCents = (n: number): number => Number(n.toFixed(2));

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
    lots.push({ id, grade: '95', litres, pricePerLitre: price, purchasedAt: date, expiresAt: plus90(date) });
    ledger.push({
      id: `e-${n}`, kind, what, when: date, detail,
      grade: '95', deltaLitres: litres, balanceAfter: balance, lotIds: [id],
    });
  }

  function debit(date: Date, litres: number, station: string, suburb: string): void {
    n += 1;
    const pumpPrice = priceOn('inland', date);

    // FIFO: consume oldest active lots first.
    const order = [...lots].sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
    let outstanding = litres;
    let cost = 0;
    const lotIds: string[] = [];
    for (const lot of order) {
      if (outstanding <= 0) break;
      const take = Math.min(lot.litres, outstanding);
      cost += take * lot.pricePerLitre;
      lot.litres = round1(lot.litres - take);
      outstanding = round1(outstanding - take);
      lotIds.push(lot.id);
    }
    lots = lots.filter(l => l.litres > 0);

    balance = round1(balance - litres);
    ledger.push({
      id: `e-${n}`, kind: 'fill', what: `Fill · ${station}`, when: date, detail: suburb,
      grade: '95', deltaLitres: -litres, balanceAfter: balance, lotIds,
      buyPricePerLitre: toCents(cost / litres),
      card: {
        merchantDescriptor: station.toUpperCase(), stationId: STATION_FOR[station] ?? null,
        mcc: '5541', randAmount: toCents(litres * pumpPrice),
        zone: 'inland', pricePerLitre: pumpPrice, litres, disputed: false,
      },
    });
  }

  // --- Controller supplement Ruling C2-REVISED: historical lots and fills,
  // March-August 2026, so savings and the chart are derived rather than
  // hardcoded. Bought cheap in early March (pre-shock) and spent down across
  // April-August, each purchase fully drained by its matching fill before the
  // next one — net litres contribution to the current balance is zero, and
  // none of this ever touches the September opening lots below.
  //
  // Every credit/debit call below is issued in true chronological order.
  // `balance` is a simple running total, so out-of-order calls would still
  // sum to the right final number but would stamp the wrong `balanceAfter`
  // on individual entries once the ledger-chain test re-sorts by date —
  // hence interleaving the two September opening-lot purchases (Jul 8, Aug
  // 12) with the historical fills that surround them rather than grouping
  // "history" and "opening lots" as separate code blocks.
  credit(new Date(2026, 2, 4), 10.0, 'topup', 'Top up · 95', 'R195');
  credit(new Date(2026, 2, 5), 10.0, 'topup', 'Top up · 95', 'R195');
  credit(new Date(2026, 2, 6), 12.0, 'topup', 'Top up · 95', 'R234');
  credit(new Date(2026, 2, 7), 12.0, 'topup', 'Top up · 95', 'R234');
  credit(new Date(2026, 2, 8), 14.7, 'topup', 'Top up · 95', 'R287');

  debit(new Date(2026, 3, 3), 10.0, 'Engen William Nicol', 'Bryanston');
  debit(new Date(2026, 4, 7), 10.0, 'Sasol Rivonia', 'Rivonia');
  debit(new Date(2026, 5, 4), 12.0, 'Shell Grayston', 'Sandton');
  debit(new Date(2026, 6, 3), 12.0, 'Astron Energy Fourways', 'Fourways');

  // --- Opening balance for the September chain: 33.1 L across two lots,
  // dated between the historical fills that precede/follow them.
  credit(new Date(2026, 6, 8), 12.4, 'topup', 'Top up · 95', 'R267');

  debit(new Date(2026, 7, 6), 14.7, 'Total Sunninghill', 'Sunninghill');

  credit(new Date(2026, 7, 12), 20.7, 'topup', 'Top up · 95', 'R450');

  // --- September chain from spec §4.2 — 33.1 -> 42.6.
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
