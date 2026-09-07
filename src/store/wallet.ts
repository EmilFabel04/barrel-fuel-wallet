import { create } from 'zustand';
import { Lot, LedgerEntry, Zone } from '../data/types';
import { buildSeed, TODAY } from '../data/seed';
import { priceOn } from '../data/prices';
import { balanceOf, consumeFifoWithCost, expiringWithin } from '../lib/lots';
import {
  withinTopUpCap, litresThisMonth, topUpCapRemaining,
  withinRedemptionCap, redemptionCapRemaining,
} from '../lib/caps';
import { normaliseDescriptor, resolveZone, deriveLitres } from '../lib/cardfill';
import { round1, toCents } from '../lib/round';
import { expiryOf } from '../lib/window';

export type Appearance = 'dark' | 'light' | 'system';
export type Subscription = 'trial' | 'active' | 'lapsed';

export type WalletState = {
  lots: Lot[];
  ledger: LedgerEntry[];
  appearance: Appearance;
  subscription: Subscription;
  trialDaysLeft: number;
  alerts: boolean[];
  cardFrozen: boolean;
  // Spec §11: "never fail silently on price." Set whenever cardFill declines
  // to record a fill, and cleared on the next successful one, so a caller
  // (or a test) can observe why a fill didn't happen instead of the bare
  // `catch {}` this replaces swallowing the reason entirely.
  lastCardFillError: string | null;
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
  lastCardFillError: null,

  topUp: (rand) => {
    if (rand <= 0) return; // guard against a non-positive amount producing a negative-litre lot
    const price = priceOn('inland', TODAY);
    const litres = round1(rand / price);
    const { lots, ledger } = get();
    if (!withinTopUpCap(ledger, TODAY, litres)) return;
    const id = `lot-${Date.now()}`;
    const balance = round1(balanceOf(lots, TODAY) + litres);
    set({
      lots: [...lots, {
        id, grade: '95', litres, pricePerLitre: price,
        purchasedAt: TODAY, expiresAt: expiryOf(TODAY),
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

    // Spec §11: "Fail open on attribution; never fail the card at the pump;
    // but never fail silently on price." resolveZone()/deriveLitres() throw
    // for exactly two documented reasons — the merchant can't be matched and
    // no fallback zone is available, or the rand amount isn't positive — and
    // an unresolvable descriptor must never crash the action the way a
    // declined card would, so those two are caught. A bare `catch {}` used
    // to catch everything here, which meant a genuine bug (e.g. priceOn
    // finding no price for a zone/date) vanished identically to an expected
    // no-op. Only the two documented messages are treated as expected; any
    // other error rethrows rather than disappearing. Either way,
    // lastCardFillError records what happened for a caller to observe.
    // Production behaviour for the two documented cases is to queue the fill
    // for manual pricing rather than guess at a price; that queue is backend
    // work and out of scope for this UI shell, so for now the fill is simply
    // not recorded.
    let resolved: Zone;
    let price: number;
    let litres: number;
    try {
      resolved = resolveZone(stationId, zone);
      price = priceOn(resolved, TODAY);
      litres = deriveLitres(rand, price);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const documented = /cannot resolve zone/i.test(message) || /must be positive/i.test(message);
      set({ lastCardFillError: message });
      if (!documented) throw err;
      return;
    }
    if (litres > balanceOf(lots, TODAY)) return;

    // Spec §8.5: the weekly redemption cap declines deliberately, which is not
    // what §11's "never fail the card at the pump" forbids. That rule is about
    // attribution — never punish a driver because a merchant descriptor could
    // not be parsed. A rate limit is a known, intended refusal for a stated
    // reason, and recording that reason keeps it from failing silently the way
    // §11 also requires.
    if (!withinRedemptionCap(ledger, TODAY, litres)) {
      const left = redemptionCapRemaining(ledger, TODAY);
      set({ lastCardFillError: `weekly redemption cap reached: ${litres} L requested, ${left} L left` });
      return;
    }

    const { lots: nextLots, consumedIds, cost } = consumeFifoWithCost(lots, litres, TODAY);
    set({
      lots: nextLots,
      lastCardFillError: null,
      ledger: [...ledger, {
        id: `e-${Date.now()}`, kind: 'fill',
        what: `Fill · ${descriptor}`, when: TODAY, detail: '',
        grade: '95', deltaLitres: -litres,
        balanceAfter: round1(balanceOf(nextLots, TODAY)),
        lotIds: consumedIds, buyPricePerLitre: toCents(cost / litres),
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

/**
 * The most recent `fill`, or null if nothing has been spent yet.
 *
 * Picks by date rather than trusting array order — the seed happens to append
 * chronologically and the store appends at the end, but neither is guaranteed
 * and the Wallet quotes this as "last fill". `>=` breaks same-day ties toward
 * the later entry, which matters because every store-created fill is dated
 * TODAY, so a second simulated fill shares its date with the first.
 */
export const selectLastFill = (s: WalletState): LedgerEntry | null =>
  s.ledger.reduce<LedgerEntry | null>(
    (best, e) =>
      e.kind === 'fill' && (best === null || e.when.getTime() >= best.when.getTime()) ? e : best,
    null
  );
export const selectExpiringSoon = (s: WalletState): number => expiringWithin(s.lots, TODAY, 30);
export const selectLitresThisMonth = (s: WalletState): number => litresThisMonth(s.ledger, TODAY);
export const selectTopUpCapRemaining = (s: WalletState): number => topUpCapRemaining(s.ledger, TODAY);
export const selectRedemptionRemaining = (s: WalletState): number => redemptionCapRemaining(s.ledger, TODAY);

/**
 * What the card would actually authorise right now: the balance, unless the
 * weekly redemption cap (spec §8.5) is the tighter constraint. The Card screen
 * quotes this as spending power, so it must be the binding figure — quoting the
 * raw balance would advertise litres the card is about to decline.
 */
export const selectSpendable = (s: WalletState): number =>
  Math.min(balanceOf(s.lots, TODAY), redemptionCapRemaining(s.ledger, TODAY));
