import AsyncStorage from '@react-native-async-storage/async-storage';
import { replacer, reviver, partialize, migrate, STORE_VERSION, STORAGE_KEY } from '../persist';
import { useWallet } from '../wallet';

// Captured synchronously at import, before the middleware's read of storage has
// had a chance to resolve.
const HYDRATED_AT_IMPORT = useWallet.getState().hasHydrated;
import { Lot, LedgerEntry } from '../../data/types';
import type { WalletState } from '../wallet';

const roundTrip = <T>(value: T): T =>
  JSON.parse(JSON.stringify(value, replacer), reviver);

const LOT: Lot = {
  id: 'lot-1',
  grade: '95',
  litres: 12,
  pricePerLitre: 2245,
  purchasedAt: new Date('2026-06-28T09:00:00.000Z'),
  expiresAt: new Date('2026-09-26T09:00:00.000Z'),
};

const ENTRY: LedgerEntry = {
  id: 'e-1',
  kind: 'topup',
  what: 'Top up',
  when: new Date('2026-06-28T09:00:00.000Z'),
  detail: 'R270.00',
  grade: '95',
  deltaLitres: 12,
  balanceAfter: 12,
};

test('revives Date fields nested inside lots and ledger', () => {
  const out = roundTrip({ lots: [LOT], ledger: [ENTRY] });

  expect(out.lots[0].purchasedAt).toBeInstanceOf(Date);
  expect(out.lots[0].purchasedAt.getTime()).toBe(LOT.purchasedAt.getTime());
  expect(out.lots[0].expiresAt).toBeInstanceOf(Date);
  expect(out.lots[0].expiresAt.getTime()).toBe(LOT.expiresAt.getTime());
  expect(out.ledger[0].when).toBeInstanceOf(Date);
  expect(out.ledger[0].when.getTime()).toBe(ENTRY.when.getTime());
});

test('excludes momentary state from what is persisted', () => {
  const persisted = partialize({
    lots: [LOT],
    ledger: [ENTRY],
    appearance: 'light',
    subscription: 'active',
    trialDaysLeft: 24,
    alerts: [true, false, false],
    cardFrozen: true,
    arrivedFillId: 'e-1',
    lastCardFillError: 'weekly redemption cap reached',
    topUp: () => {},
  } as unknown as WalletState);

  // A banner for a fill that landed days ago must not reappear on a cold start,
  // and a stale decline reason must not outlive the session that caused it.
  expect(persisted).not.toHaveProperty('arrivedFillId');
  expect(persisted).not.toHaveProperty('lastCardFillError');
  expect(persisted).not.toHaveProperty('topUp');

  expect(persisted).toEqual({
    lots: [LOT],
    ledger: [ENTRY],
    appearance: 'light',
    subscription: 'active',
    trialDaysLeft: 24,
    alerts: [true, false, false],
    cardFrozen: true,
  });
});

test('discards persisted state written by an unrecognised version', () => {
  const older = { lots: [LOT], ledger: [ENTRY] };

  // Undefined leaves zustand's merge with nothing to apply, so the store keeps
  // its seed rather than adopting a shape it cannot read.
  expect(migrate(older, STORE_VERSION - 1)).toBeUndefined();
  expect(migrate(older, STORE_VERSION + 1)).toBeUndefined();
});

test('keeps persisted state written by the current version', () => {
  const current = { lots: [LOT], ledger: [ENTRY], cardFrozen: true };

  expect(migrate(current, STORE_VERSION)).toBe(current);
});

describe('the wired store', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0));

  test('writes the wallet to storage with dates intact and momentary state left out', async () => {
    useWallet.getState().topUp(500);
    await flush();

    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    const envelope = JSON.parse(raw as string, reviver);
    expect(envelope.version).toBe(STORE_VERSION);
    expect(envelope.state.lots[0].purchasedAt).toBeInstanceOf(Date);
    expect(envelope.state.ledger[0].when).toBeInstanceOf(Date);
    expect(envelope.state).not.toHaveProperty('arrivedFillId');
    expect(envelope.state).not.toHaveProperty('lastCardFillError');
  });

  // The root layout holds the screens back on this flag. If it were true from
  // the start, the app would paint the seed and then swap under the user.
  test('is not marked hydrated until storage has actually been read', async () => {
    expect(HYDRATED_AT_IMPORT).toBe(false);

    await flush();

    expect(useWallet.getState().hasHydrated).toBe(true);
  });
});
