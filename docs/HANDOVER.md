# Barrel — handover

Read this before changing anything. It covers what the project is, the rules that hold it
together, and the traps that bit repeatedly during the build.

## What this is

A **UI shell over mock data** for Barrel: a prepaid fuel wallet for South African motorists,
denominated in **litres, not rand**. No backend, no payments, no persistence — the store is
in memory and resets on reload. That is deliberate: the business overview says a legal
opinion gates everything, so this exists to validate flows and be shown to people, nothing
more.

**Anyone shown this must be told it is a prototype over mock data**, with no legal opinion,
no bank, and no station agreements.

## The three documents, in order of authority

| | |
|---|---|
| `docs/superpowers/specs/2026-09-06-barrel-fuel-wallet-design.md` | **The binding authority.** Design system, screens, data model, guardrails. |
| `docs/DECISIONS.md` | 46 rulings made during the build, each with reasoning and cost-if-wrong. |
| `docs/superpowers/plans/2026-09-07-barrel-fuel-wallet-ui.md` | The build plan. **Historical — it was wrong in ~15 places.** Do not treat as current. |

**When anything disagrees with the spec, the spec wins.** This was true seven times during
the build. The plan and its briefs faithfully transcribed figures from the original design
canvas that turned out to be arithmetically wrong.

## Architecture

```
src/lib/     pure, React-free, fully tested — the model
src/data/    types, zone price table, stations, the seed
src/store/   zustand wrapping src/lib
src/theme/   tokens + provider (the ONLY file containing hex)
src/components/  10 shared components
app/         12 screens, expo-router
```

`src/lib` and `src/data` are the good part: pure functions over plain data, one definition
of each operation, 126 tests. If you keep only `src/`, you have a portable model ready to
validate against a real backend. Change logic there and let the screens follow.

**Litres are held as dated `Lot`s**, each carrying the price paid and a 90-day expiry — not
as a scalar balance. That one structure gives you expiry, FIFO consumption, and honest
savings (what a litre cost vs the pump price the day it was burned).

## Rules that must not be broken

1. **Hex appears only in `src/theme/tokens.ts`.** Everything else uses `useTheme()`.
   Verify: `grep -rn "#[0-9A-Fa-f]\{3,6\}" src/ app/` — hits only `tokens.ts` and its test.
   (`Toggle.tsx` matches inside a *comment*; that is fine.)
2. **`positive` (`#C6F24E`) is a FILL colour. `positiveText` is for text and glyphs.**
   Lime on white measures 1.30:1 and is invisible; `positiveText` is `#5A7A0A` in light
   (4.97:1). Putting `positive` on text is the single easiest way to break light mode.
3. **Never set `fontWeight` against an Outfit family.** Each weight is a *separate family*
   (`Outfit_400Regular` … `Outfit_800ExtraBold`). Use `<Num weight="500">`, which maps to
   the family. Setting `fontWeight` on a *system* monospace font is fine — `SectionLabel`
   is correct as written.
4. **Tab screens pass `insetBottom={false}` to `<Screen>`; pushed screens do not.** The tab
   bar already clears the safe area; padding twice leaves dead space.
5. **Never hardcode a number a function can derive.** Prices, deltas, dates, litres all come
   from `priceOn`, `nextPriceChange`, the store, or the formatters. This rule exists because
   four wrong literals shipped from the design canvas and each survived multiple reviews.
6. **One definition per operation.** `round1`/`toCents` in `src/lib/round.ts`, the 90-day
   window in `src/lib/window.ts`, FIFO+cost in `src/lib/lots.ts`, price lookup in
   `src/data/prices.ts`. Four separate rulings were needed to establish this; do not
   re-duplicate.
7. **The Barrel card pass uses the `PASS` token group, never `useTheme()`.** It depicts a
   physical white card and must look identical in both themes.

## The seeded state

Every screen reads one seed and they cannot disagree. If you change `src/data/seed.ts`,
these tests will tell you what you broke:

| | |
|---|---|
| Balance | **42.6 L** (Wallet, Card, Balance all show this) |
| September top-ups | **105.2 L** of the 150 L cap |
| Savings | **R71.65** · 118.4 L below pump · R21.21/L average |
| Monthly bars | APR 9.00 · MAY 18.00 · JUN 16.80 · JUL 12.00 · AUG 4.41 · **SEP 11.44** |
| Surviving lots | exactly **one**, expiring 27 Dec |
| App "today" | **30 September 2026** (`TODAY` in `src/data/seed.ts`) |

**May is the tallest savings bar, not September.** The chart scales to the largest month in
the data.

**The Balance expiry split reads `0.0 L` / `42.6 L` and that is correct.** FIFO spends
oldest lots first, so the survivor is always the newest purchase. A user who tops up
regularly will rarely see an expiry warning — it is for dormant balances, which is who it
is for.

## Traps

- **`TODAY` is a `const` in `src/data/seed.ts`**, imported by seven screens. A data-seed
  module is a strange home for the app clock. Moving to a real clock is the highest-leverage
  refactor before any backend work, and two things break quietly on the way:
  `monthlySavings` buckets by month with no year check, and the price table only spans
  Mar–Oct 2026 so `priceOn` throws outside it.
- **The `lots` ↔ `ledger` relationship.** Fully-consumed lots are *deleted* from the array,
  so a ledger row must never look up its lot to find an expiry date — derive from the
  entry's own `when + 90 days`. Getting this wrong showed the expiry on 1 of 9 rows.
- **Comments cite ruling ids** (`Ruling T4-a`, `C2-REVISED`) from a workspace that no longer
  exists. The reasoning is in `docs/DECISIONS.md`; the ids are not resolvable elsewhere.
- **The design canvas is not a source of truth for numbers.** It contained a savings figure
  wrong by ~18x, an alert figure wrong by ~5x, a price percentage that contradicted the
  price table, and two dates that were not Wednesdays (SA fuel prices change on the first
  Wednesday). Verify any figure you take from it.

## Known gaps

- `store.setSubscription` can set `'lapsed'` but no UI path reaches it; the Top up lapsed
  branch is built and untested in-app.
- **A lapsed subscription must never block the card or the existing balance.** Spec 9.3 is
  explicit: litres already bought are the user's property. Gating them would be the
  cash-out restriction 8.3 forbids, triggered by a billing failure.
- `SIMULATE A FILL` on the Card screen is a debug control. Remove it before any real build.
- `textDim` `#A8A8A8` on white measures 2.38:1 — below AA, used for body copy. Recorded
  debt, not fixed, because it is a design-fidelity decision.
- No persistence, no onboarding, no map, no real push, no billing.

## Open product decisions

1. **The Savings headline.** R71.65 is honest but thin. "R2,590 of fuel locked in below
   today's price" is equally true and much stronger — same data, better framing.
2. **The legal question, asked as two.** Is a litre-denominated voucher redeemable only for
   fuel a regulated product? And *separately*: does converting it to rand at a floating
   price and settling to a third-party merchant change that answer? A yes to only the first
   is false comfort.
3. **Subscription carries phase 1 almost alone.** With no station rebate yet, and fuel
   interchange thin (SA fuel retailers pay ~1.75% total merchant service fee — that is the
   whole pie, not Barrel's slice), the R59/month is close to the only revenue line.

## Running it

```
npx expo start --tunnel     # phone, any network
npx expo start              # phone, same wifi, faster
npx expo start --web        # browser
npm test                    # 126 tests
npx tsc --noEmit
```
