import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';
import type { WalletState } from './wallet';

/**
 * Persisting the wallet means round-tripping a model that is full of `Date`
 * through JSON, which turns every one of them into a string and silently
 * breaks every comparison downstream.
 *
 * Dates are therefore tagged explicitly on the way out and rebuilt on the way
 * in. The alternative — reviving any string that looks like an ISO date — would
 * eventually corrupt a legitimate string field that happens to match.
 */
const DATE_TAG = '__d';

/**
 * `Date.prototype.toJSON` runs before a replacer sees the value, so `value` is
 * already a string by then; the original is only reachable through `this`.
 */
export function replacer(this: Record<string, unknown>, key: string, value: unknown) {
  const raw = this[key];
  return raw instanceof Date ? { [DATE_TAG]: raw.toISOString() } : value;
}

export function reviver(_key: string, value: unknown) {
  if (value !== null && typeof value === 'object' && DATE_TAG in value) {
    return new Date((value as Record<string, string>)[DATE_TAG]);
  }
  return value;
}

/**
 * Everything that should survive a cold start. The two omissions are
 * deliberate: `arrivedFillId` and `lastCardFillError` both describe a moment
 * rather than a state, and reviving either would replay an event the user
 * already dealt with.
 */
export const PERSISTED_KEYS = [
  'lots',
  'ledger',
  'appearance',
  'subscription',
  'trialDaysLeft',
  'alerts',
  'cardFrozen',
] as const;

export type PersistedWallet = Pick<WalletState, (typeof PERSISTED_KEYS)[number]>;

export const partialize = (s: WalletState): PersistedWallet =>
  Object.fromEntries(PERSISTED_KEYS.map(k => [k, s[k]])) as PersistedWallet;

export const STORE_VERSION = 1;

/**
 * The hook has to exist before the shape changes, not after. Until there is a
 * version 2 there is nothing to translate, so anything not written by the
 * current version is dropped: returning `undefined` leaves zustand's merge with
 * nothing to apply and the store keeps its seed, which is a legible starting
 * point. A half-revived older shape would not be.
 */
export const migrate = (persisted: unknown, version: number): PersistedWallet | undefined =>
  version === STORE_VERSION ? (persisted as PersistedWallet) : undefined;

/**
 * The AsyncStorage key the whole wallet lives under. AsyncStorage rather than
 * MMKV because it works in Expo Go, and this change should not be the one that
 * forces a native build.
 */
export const STORAGE_KEY = 'barrel-wallet';

// The generic admits `undefined` because `migrate` can return it — that is how
// state from an unreadable version is dropped.
export const walletStorage = createJSONStorage<PersistedWallet | undefined>(() => AsyncStorage, {
  replacer,
  reviver,
});
