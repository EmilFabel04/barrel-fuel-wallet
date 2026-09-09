import { Lot, LedgerEntry } from './types';
import { priceOn } from './prices';
import { round1, toCents } from '../lib/round';
import { consumeFifoWithCost } from '../lib/lots';
import { expiryOf } from '../lib/window';
import { DEMO_NOW } from '../lib/clock';

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

  /**
   * Takes RAND, not litres, and derives litres exactly as store.topUp does.
   * The old signature took both a litre figure and a rand detail string, which
   * is two sources for one fact — the pair could drift and nothing would say so.
   */
  function credit(
    date: Date, rand: number, kind: 'topup' | 'bonus', what: string, detail: string
  ): void {
    n += 1;
    const price = priceOn('inland', date);
    const litres = round1(rand / price);
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

  // The wallet is LADDERED on purpose. The old chain drained FIFO until a
  // single lot survived, which starves two features: a timeline of one band is
  // not a timeline, and locked-in value came to R0.00 because the survivor had
  // been bought at exactly the current price.
  //
  // Every credit/debit call is issued in true chronological order. `balance` is
  // a running total, so an out-of-order call still sums to the right final
  // figure but stamps the wrong `balanceAfter` on individual entries.
  //
  // Each historical lot is bought near the start of its 90-day window and
  // drained by one fill nearer the end — the redemption pattern the product
  // actually sells (spec §8.1) — and never held longer than 90 days.
  credit(new Date(2026, 2, 4), 195, 'topup', 'Top up · 95', 'R195');   // 10.0 @ 19.50
  credit(new Date(2026, 2, 9), 195, 'topup', 'Top up · 95', 'R195');   // 10.0 @ 19.50
  debit(new Date(2026, 3, 3), 10.0, 'Engen William Nicol', 'Bryanston');

  credit(new Date(2026, 3, 13), 245, 'topup', 'Top up · 95', 'R245');  // 12.0 @ 20.40
  credit(new Date(2026, 3, 25), 245, 'topup', 'Top up · 95', 'R245');  // 12.0 @ 20.40
  debit(new Date(2026, 4, 7), 10.0, 'Sasol Rivonia', 'Rivonia');

  credit(new Date(2026, 4, 20), 313, 'topup', 'Top up · 95', 'R313');  // 14.7 @ 21.30
  debit(new Date(2026, 5, 25), 12.0, 'Shell Grayston', 'Sandton');

  // 8 July: the buy-ahead. One large top-up at R21.40 before the August and
  // September rises — the product's own mechanic, and the entry that ladders
  // the wallet. Everything downstream depends on this lot outliving the
  // September fills, because FIFO drains oldest first: it is bought at 46.0 L
  // and the 34.0 L of September fills leave exactly 12.0 L standing, expiring
  // 6 October. That is what finally makes the 30-day expiry warning real.
  credit(new Date(2026, 6, 8), 984, 'topup', 'Top up · 95', 'R984');   // 46.0 @ 21.40

  debit(new Date(2026, 6, 15), 12.0, 'Astron Energy Fourways', 'Fourways');
  debit(new Date(2026, 7, 10), 14.7, 'Total Sunninghill', 'Sunninghill');

  credit(new Date(2026, 7, 12), 216, 'topup', 'Top up · 95', 'R216');  // 10.0 @ 21.60

  credit(new Date(2026, 8, 4), 44, 'bonus', 'Referral bonus', 'Lerato M.');  // 2.0 @ 21.87
  debit(new Date(2026, 8, 11), 14.0, 'Engen William Nicol', 'Bryanston');
  credit(new Date(2026, 8, 18), 175, 'topup', 'Top up · 95', 'R175');  // 8.0 @ 21.87
  debit(new Date(2026, 8, 24), 12.0, 'Sasol Rivonia', 'Rivonia');
  credit(new Date(2026, 8, 28), 232, 'topup', 'Top up · 95', 'R232');  // 10.6 @ 21.87
  // Dated the demo instant itself: this is the fill the Wallet's "last fill"
  // row shows on open, so it is the same day the app believes it is.
  debit(DEMO_NOW, 8.0, 'Shell Grayston', 'Sandton');

  return { lots, ledger };
}
