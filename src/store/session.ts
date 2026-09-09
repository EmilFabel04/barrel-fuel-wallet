import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jsonStorage, discardUnknownVersion } from './persist';
import { normalisePhone } from '../lib/phone';
import { now } from '../lib/clock';

/**
 * Who is signed in, kept apart from the wallet on purpose.
 *
 * The wallet is data and the session is access: they have different lifetimes
 * and different storage keys, and `resetDemo` throws away the first without
 * touching the second. Folding the session into the wallet store would mean
 * resetting the demo ejected the user from the app.
 *
 * There is no server behind this yet. `signIn` is reached only after a code has
 * been accepted, and the code check is a stub — but the identity it produces is
 * the real shape, so push tokens, wallet-pass ownership and a biometric unlock
 * all have something to attach to when those arrive.
 */
export type SessionState = {
  /** E.164, or null when signed out. */
  phone: string | null;
  signedInAt: Date | null;
  /** False until the middleware has finished reading storage. */
  hasHydrated: boolean;
  /** Returns false, and changes nothing, if the number is not usable. */
  signIn: (input: string) => boolean;
  signOut: () => void;
};

export type PersistedSession = Pick<SessionState, 'phone' | 'signedInAt'>;

export const SESSION_STORAGE_KEY = 'barrel-session';
export const SESSION_VERSION = 1;

export const useSession = create<SessionState>()(
  persist(
    set => ({
      phone: null,
      signedInAt: null,
      hasHydrated: false,

      signIn: input => {
        const phone = normalisePhone(input);
        if (!phone) return false;
        // `now()` rather than `new Date()` so the stamp obeys the same pinned
        // demo clock as every date in the wallet.
        set({ phone, signedInAt: now() });
        return true;
      },

      signOut: () => set({ phone: null, signedInAt: null }),
    }),
    {
      name: SESSION_STORAGE_KEY,
      version: SESSION_VERSION,
      storage: jsonStorage<PersistedSession>(),
      partialize: (s): PersistedSession => ({ phone: s.phone, signedInAt: s.signedInAt }),
      migrate: discardUnknownVersion<PersistedSession>(SESSION_VERSION),
      onRehydrateStorage: () => () => useSession.setState({ hasHydrated: true }),
    },
  ),
);

/**
 * Signed in is derived rather than stored, so there is no separate status that
 * can disagree with the identity. A half-finished sign-in never reaches the
 * store at all — the code screen carries the number as a route param.
 */
export const selectIsSignedIn = (s: SessionState): boolean => s.signedInAt !== null;
