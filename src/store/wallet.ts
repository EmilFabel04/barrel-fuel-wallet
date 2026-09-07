import { create } from 'zustand';
import { Lot, LedgerEntry, Zone } from '../data/types';
import { buildSeed, TODAY } from '../data/seed';
import { priceOn } from '../data/prices';
import { balanceOf, consumeFifo, expiringWithin } from '../lib/lots';
import { withinCap, litresThisMonth, capRemaining } from '../lib/caps';
import { normaliseDescriptor, resolveZone, deriveLitres } from '../lib/cardfill';
import { round1 } from '../lib/round';

export type Appearance = 'dark' | 'light' | 'system';
export type Subscription = 'trial' | 'active' | 'lapsed';

const DAY = 86_400_000;

// Money is rounded to the cent it would actually be billed/charged at — see
// the matching comment in data/seed.ts. `toFixed` avoids reintroducing a
// second "round to N decimals" helper alongside round1 (Ruling T4-a).
const toCents = (n: number): number => Number(n.toFixed(2));

export type WalletState = {
  lots: Lot[];
  ledger: LedgerEntry[];
  appearance: Appearance;
  subscription: Subscription;
  trialDaysLeft: number;
  alerts: boolean[];
  cardFrozen: boolean;
  topUp: (rand: number) => void;
  cardFill: (descriptor: string, rand: number, zone: Zone | null) => void;
  disputeFill: (entryId: string) => void;
  setAppearance: (a: Appearance) => void;
  toggleAlert: (i: number) => void;
  setSubscription: (s: Subscription) => void;
  freezeCard: (frozen: boolean) => void;
};

const seed = buildSeed();

export const useWallet = create<WalletState>((set, get) => ({
  lots: seed.lots,
  ledger: seed.ledger,
  appearance: 'dark',
  subscription: 'trial',
  trialDaysLeft: 24,
  alerts: [true, true, false],
  cardFrozen: false,

  topUp: (rand) => {
    const price = priceOn('inland', TODAY);
    const litres = round1(rand / price);
    const { lots, ledger } = get();
    if (!withinCap(ledger, TODAY, litres)) return;
    const id = `lot-${Date.now()}`;
    const balance = round1(balanceOf(lots, TODAY) + litres);
    set({
      lots: [...lots, {
        id, grade: '95', litres, pricePerLitre: price,
        purchasedAt: TODAY, expiresAt: new Date(TODAY.getTime() + 90 * DAY),
      }],
      ledger: [...ledger, {
        id: `e-${Date.now()}`, kind: 'topup', what: 'Top up · 95', when: TODAY,
        detail: `R${rand.toFixed(0)}`, grade: '95', deltaLitres: litres,
        balanceAfter: balance, lotIds: [id],
      }],
    });
  },

  cardFill: (descriptor, rand, zone) => {
    const { lots, ledger } = get();
    const stationId = normaliseDescriptor(descriptor);
    const resolved = resolveZone(stationId, zone);
    const price = priceOn(resolved, TODAY);
    const litres = deriveLitres(rand, price);
    if (litres > balanceOf(lots, TODAY)) return;

    // Weighted buy price of the lots this fill will consume, oldest first.
    // consumeFifo() below is non-mutating and doesn't report cost, so this
    // mirrors its ordering to compute the blended price paid for `litres`.
    const order = [...lots]
      .filter(l => l.expiresAt.getTime() >= TODAY.getTime())
      .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
    let outstanding = litres;
    let cost = 0;
    for (const l of order) {
      if (outstanding <= 0) break;
      const take = Math.min(l.litres, outstanding);
      cost += take * l.pricePerLitre;
      outstanding = round1(outstanding - take);
    }

    const next = consumeFifo(lots, litres, TODAY);
    set({
      lots: next.lots,
      ledger: [...ledger, {
        id: `e-${Date.now()}`, kind: 'fill',
        what: `Fill · ${descriptor}`, when: TODAY, detail: '',
        grade: '95', deltaLitres: -litres,
        balanceAfter: round1(balanceOf(next.lots, TODAY)),
        lotIds: next.consumedIds, buyPricePerLitre: toCents(cost / litres),
        card: {
          merchantDescriptor: descriptor, stationId, mcc: '5541',
          randAmount: rand, zone: resolved, pricePerLitre: price,
          litres, disputed: false,
        },
      }],
    });
  },

  disputeFill: (entryId) => set(s => ({
    ledger: s.ledger.map(e =>
      e.id === entryId && e.card ? { ...e, card: { ...e.card, disputed: true } } : e
    ),
  })),

  setAppearance: (appearance) => set({ appearance }),
  toggleAlert: (i) => set(s => ({ alerts: s.alerts.map((v, j) => (j === i ? !v : v)) })),
  setSubscription: (subscription) => set({ subscription }),
  freezeCard: (cardFrozen) => set({ cardFrozen }),
}));

export const selectBalance = (s: WalletState): number => balanceOf(s.lots, TODAY);
export const selectExpiringSoon = (s: WalletState): number => expiringWithin(s.lots, TODAY, 30);
export const selectLitresThisMonth = (s: WalletState): number => litresThisMonth(s.ledger, TODAY);
export const selectCapRemaining = (s: WalletState): number => capRemaining(s.ledger, TODAY);
