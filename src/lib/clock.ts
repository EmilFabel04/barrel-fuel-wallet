/**
 * The app's clock. One definition, and not in a data-seed module.
 *
 * This used to be `TODAY`, a `const` exported from `src/data/seed.ts` and
 * imported by the store and six screens. That was the wrong home twice over: a
 * seed is fixture data, not the app's sense of time, and a `const` cannot be
 * changed for a test or swapped for a real clock without editing every caller.
 *
 * `src/lib` and `src/data` never needed this — every date-sensitive function
 * there already takes an explicit `at: Date`, which is why they stay pure and
 * fully testable. This module exists for the layer above them: the store and
 * the screens, which have to answer "when is now?" from somewhere.
 */

/**
 * The instant the prototype is pinned to: 30 September 2026.
 *
 * Named for what it is rather than dressed up as the present. Spec §4.2 derives
 * it — artboard 04 warns of an October price change and says "TOP UP BEFORE 01
 * OCT" — and the whole seeded state is built to terminate here, so it is a
 * fixture, not a default that happens to be stale.
 */
export const DEMO_NOW = new Date(2026, 8, 30);

let source: () => Date = () => DEMO_NOW;

/**
 * When the app thinks it is. Returns `DEMO_NOW` unless a clock has been
 * installed.
 *
 * Switching the prototype to real time is `setClock(() => new Date())` — one
 * line. It is deliberately NOT the default, because the seeded data is dated
 * absolutely and does not survive contact with real time: the ledger runs to 30
 * September 2026, so against a real clock some entries are future-dated, the
 * monthly cap meter empties on 1 October, `nextPriceChange` runs out after 7
 * October 2026, and the last surviving lot expires on 27 December 2026, taking
 * the balance to zero on every screen. Making the seed relative to `now()` is a
 * separate piece of work and a product decision, not a side effect of this one.
 */
export function now(): Date {
  return source();
}

/**
 * Install a clock. For tests, and for the eventual switch to real time.
 * Always pair with `resetClock()` in a test's teardown.
 */
export function setClock(fn: () => Date): void {
  source = fn;
}

/** Restore the pinned demo instant. */
export function resetClock(): void {
  source = () => DEMO_NOW;
}
