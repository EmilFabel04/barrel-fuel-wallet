# Barrel — handover

Read this before changing anything. It covers what the project is, the rules that hold it
together, and the traps that bit repeatedly during the build.

---

## Start here — state as of 9 September 2026

**Branch:** `main`. Clean tree. 295 tests green, `npx tsc --noEmit` clean.
**Unpushed:** `main` is ahead of `origin/main`. Nothing has been pushed since the redesign.

**What just happened.** The Pump redesign landed: a full visual re-approach across all 12
screens, plus fill history, a reworked Savings screen, the price-rise panel, simulated
arriving fills, a lot expiry timeline, and burn-rate top-up sizing — on a re-cut laddered
seed. Spec and plan are in `docs/superpowers/`.

**Read in this order:**

1. This file — the rules, the seeded state, the traps.
2. `docs/UI.md` — what every screen is for, what each number means, and where it comes
   from. Includes the expiry mechanic in full.
3. `docs/GAPS.md` — **what is missing**, across the model, UX and UI. Start any new work
   from here; §5 is a five-item shortlist.
4. `docs/DECISIONS.md` — why things are the way they are, with cost-if-wrong on each.

**The three things most worth knowing before you touch anything:**

- **The app promises something it does not do.** Three screens say unused litres convert
  back to the rand you paid. Nothing implements it — the `expiry` ledger kind is declared
  in the types and never written. See `GAPS.md` §1.1. This is the top of the list.
- **The wallet persists** across launches (AsyncStorage, added 9 September 2026).
  `Settings → RESET DEMO DATA` puts it back to the seed.
- **Not one test renders a screen.** All 295 cover `src/lib`, `src/data`, the store and
  isolated components. A chart bug that bunched both series into the middle third of the
  panel passed every one of them and was found by opening the app. Verify visually.

**Running it:** `npx expo start`. The dev server is not currently running.

---

## What this is

A **UI shell over mock data** for Barrel: a prepaid fuel wallet for South African motorists,
denominated in **litres, not rand**. No backend and no payments; the wallet is persisted
locally but there is nothing behind it. That is deliberate: the business overview says a legal
opinion gates everything, so this exists to validate flows and be shown to people, nothing
more.

**Anyone shown this must be told it is a prototype over mock data**, with no legal opinion,
no bank, and no station agreements.

## The documents, in order of authority

| | |
|---|---|
| `docs/superpowers/specs/2026-09-06-barrel-fuel-wallet-design.md` | The original authority. Still binds for the data model, guardrails and product rules. |
| `docs/superpowers/specs/2026-09-09-barrel-pump-redesign-design.md` | **Supersedes its §3 and §6** — the Pump design system, the four added features, the laddered seed. |
| `docs/DECISIONS.md` | The rulings — from the original build, then the redesign. Each records reasoning and cost-if-wrong. |
| `docs/UI.md` | How the UI works: every screen, every figure, and the mechanics behind them. |
| `docs/GAPS.md` | What is missing — model, UX, UI, testing. Where new work should start. |
| `docs/superpowers/plans/2026-09-07-barrel-fuel-wallet-ui.md` | The build plan. **Historical — it was wrong in ~15 places.** Do not treat as current. |

**When anything disagrees with the spec, the spec wins.** This was true seven times during
the build. The plan and its briefs faithfully transcribed figures from the original design
canvas that turned out to be arithmetically wrong.

## Architecture

```
src/lib/     pure, React-free, fully tested — the model (+ the app clock)
             round, window, lots, caps, cardfill, savings, holdings,
             usage, pricewatch, format, clock
src/data/    types, zone price table, stations, the seed
src/store/   zustand wrapping src/lib (+ the demo-fill timer)
src/theme/   tokens + provider (the ONLY file containing hex)
src/components/  17 shared components — Readout, Panel, Chip, SegmentGauge,
             Timeline, LineChart, BarChart, Banner, and the original set
app/         12 screens, expo-router
```

`src/lib` and `src/data` are the good part: pure functions over plain data, one definition
of each operation, 295 tests. If you keep only `src/`, you have a portable model ready to
validate against a real backend. Change logic there and let the screens follow.

**Litres are held as dated `Lot`s**, each carrying the price paid and a 90-day expiry — not
as a scalar balance. That one structure gives you expiry, FIFO consumption, and honest
savings (what a litre cost vs the pump price the day it was burned).

## Rules that must not be broken

1. **Hex appears only in `src/theme/tokens.ts`.** Everything else uses `useTheme()`.
   Verify: `grep -rn "#[0-9A-Fa-f]\{3,6\}" src/ app/` — hits only `tokens.ts` and its test.
   (`Toggle.tsx` matches inside a *comment*; that is fine.)
2. **There are TWO fill/text colour pairs, and the fill half must never be text.**
   `positive`/`positiveText` and — new — `accent`/`accentText`. Amber `#FF6A00` on white
   measures 2.8:1, so in light mode amber is a **fill with ink set on it** (the price
   badge, the gauge, the meter, the primary button) and `accentText` `#9A3200` carries the
   small ▲ delta glyphs. Lime is the same shape of trap: `#7A9000` fill, `#3F5406` text.
   A third token, `heroInk`, exists because a numeric hero cannot be amber on white and
   stay legible — amber at night, ink in daylight.
   **`tokens.test.ts` now measures all of this**: every light-mode text token is asserted
   at AAA (≥7:1) and every dark one at AA, so the palette enforces itself.
   The same shape of trap runs the other way for **elevation**: a shadow on `#000000` is
   invisible, so `useElevation()` returns a real shadow in light and nothing in dark.
   Spread it unconditionally; never branch on the theme yourself.
3. **Never set `fontWeight` against a custom family.** Each weight is a *separate family*
   (`Figtree_400Regular` …, `JetBrainsMono_800ExtraBold` …). Use `<Readout weight="500">`,
   which maps to the family. **`SectionLabel` is now subject to this rule too** — it moved
   off system Menlo onto JetBrains Mono, and its old `fontWeight: '600'` was only ever
   correct *because* Menlo is a system font. That is the trap in this file.
   **All numerals are monospaced now, so `tnum` is no longer a constraint on them.**
   JetBrains Mono's digits cannot change width by construction — the fragility that
   disqualified DM Sans no longer applies to the numeral family. It still applies to any
   Figtree `<Text>` showing a number, which is why several still carry
   `fontVariant: ['tabular-nums']`; do not strip those.
4. **Tab screens pass `insetBottom={false}` to `<Screen>`; pushed screens do not.** The tab
   bar already clears the safe area; padding twice leaves dead space.
   **`<Screen>` scrolls by default.** Pass `scroll={false}` only when the screen owns its
   own ScrollView (`history.tsx`, `settings.tsx`) — two on one axis fight for the gesture.
   The `flexGrow: 1` on its content container is load-bearing: it is what lets the seven
   `marginTop: 'auto'` footers stay pinned on short screens while long ones still scroll.
5. **Never hardcode a number a function can derive.** Prices, deltas, dates, litres all come
   from `priceOn`, `nextPriceChange`, the store, or the formatters. This rule exists because
   four wrong literals shipped from the design canvas and each survived multiple reviews.
6. **One definition per operation.** `round1`/`toCents` in `src/lib/round.ts`, the 90-day
   window in `src/lib/window.ts`, FIFO+cost in `src/lib/lots.ts`, price lookup in
   `src/data/prices.ts`, the clock in `src/lib/clock.ts`. Four separate rulings were needed
   to establish this; do not re-duplicate. **`src/lib` and `src/data` must never call
   `now()`** — they take an explicit `at: Date`, and that is why they are testable.
7. **Two caps, and they are not interchangeable.** `MONTHLY_TOPUP_CAP_L` (500) limits
   what can be *bought in* per calendar month; `WEEKLY_REDEMPTION_CAP_L` (110) limits
   what can be *spent out* over a rolling 7 days, as fraud mitigation. Separately,
   `REDEMPTION_CAP_WINDOW_DAYS` (7) is not `REDEMPTION_DAYS` (90) — the latter is a
   litre's price-lock life. Three names say "redemption" and mean three things.
8. **The Barrel card pass uses the `PASS` token group, never `useTheme()`.** It depicts a
   physical white card and must look identical in both themes.
9. **Screens never branch on the theme.** There used to be one exception — the Wallet's
   price block inverted itself in light mode — and it is gone. `useIsLight()` survives for
   exactly one caller, `Button.tsx`, because the amber fill's *edge* against white is a
   luminance relationship between two tokens rather than a colour, so no token pair can
   express it.
10. **The clock stays pinned.** `setClock(() => new Date())` guts the app; "live" behaviour
   is scripted against `DEMO_NOW` instead. See `store.scheduleDemoFill`.

## The seeded state

Every screen reads one seed and they cannot disagree. If you change `src/data/seed.ts`,
these tests will tell you what you broke:

| | |
|---|---|
| Balance | **42.6 L** (Wallet, Card, Your litres all show this) |
| Surviving lots | **five**, laddered: 12.0 @ R21.40 · 10.0 @ R21.60 · 2.0 + 8.0 + 10.6 @ R21.87 |
| Expiring within 30 days | **12.0 L**, on 6 Oct — six days out |
| Locked in | cost R923.32 · worth R931.66 · **R8.34 ahead** (R13.45 from 7 Oct) |
| Savings (realised) | **R76.19** · 92.7 L below pump · R20.72/L average |
| Monthly bars | APR 9.00 · MAY 18.00 · JUN 16.80 · JUL 12.00 · AUG 4.41 · **SEP 15.98** |
| Edge per litre | 0.90 · 1.80 · 1.40 · 1.00 · 0.30 · 0.47 — narrowing, then recovering |
| September top-ups | **18.6 L** of the 500 L monthly top-up cap |
| Weekly redemption cap | 20.0 L spent, **90.0 L left** — *not* the binding constraint |
| App "today" | **30 September 2026** (`DEMO_NOW` in `src/lib/clock.ts`) |

**May is the tallest savings bar, not September.** The chart scales to the largest month in
the data.

**The wallet is laddered on purpose, and one entry does it.** A single R984 top-up on
8 July — 46.0 L at R21.40, someone buying ahead of an expected rise — is what leaves five
lots standing instead of one. FIFO drains oldest first, so the 34.0 L of September fills
take that lot down to exactly 12.0 L, expiring 6 October. Everything downstream depends on
it: without it the expiry timeline has a single band and locked-in value is R0.00, because
the sole survivor would have been bought at exactly today's price.

**Two things got worse in exchange, deliberately.** September top-ups fell from 105.2 L to
18.6 L, so the cap meter reads emptier; and the weekly redemption cap is no longer the
binding constraint on the Card, so that line does not render against the seed. Both are
structural: bigger September top-ups survive as large September lots (FIFO cannot reach
past the July lot), which pushes the balance to ~130 L — three tanks rather than one. A
one-tank balance is the truer product shape.

**The honest ceiling.** The 90-day window caps how much price advantage anyone can hold —
about R20 on a 42 L balance. This product sells **price certainty, not accumulated
profit**, and no copy may imply the savings compound.

## Traps

- **The clock lives in `src/lib/clock.ts`** — `now()`, pinned to `DEMO_NOW`
  (30 Sep 2026). It used to be `TODAY`, a `const` in `src/data/seed.ts`; that is done.
  `src/lib` and `src/data` never read it — every date-sensitive function there takes an
  explicit `at: Date`, which is what keeps them pure. Only the store and the screens call
  `now()`, and each hoists it to a single `const at = now()` per action or render so one
  render cannot straddle a date boundary.

  **Switching to real time is one line** — `setClock(() => new Date())` — but do not do it
  casually. The seed is dated absolutely and does not survive contact with real time:
  - the ledger runs to 30 Sep 2026, so entries are already *future-dated* against a real
    clock today;
  - the monthly cap meter reads 0 from 1 Oct 2026;
  - `nextPriceChange` returns undefined after 7 Oct 2026, gutting the Alerts screen;
  - the last surviving lot expires 27 Dec 2026, taking the balance to **0.0 L** on the
    Wallet, Card and Balance screens.

  Making the seed relative to `now()` is a separate piece of work and a product decision.
  The price table also fails in **both** directions and only one is loud: `priceOn` throws
  before 4 Mar 2026, and after 7 Oct 2026 it silently returns October's price forever. The
  silent direction is the one a real clock travels. Both are pinned by tests in
  `src/data/__tests__/prices.test.ts`.
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
- `SIMULATE AN ARRIVING FILL` on the **Settings** screen is a debug control (it used to sit
  on the Card screen, under the product's primary object). Remove it before any real build.
  It calls the real `cardFill` action, so nothing below the store is faked.
- ~~`textDim` `#A8A8A8` on white measures 2.38:1.~~ **Paid.** Light mode now holds every
  text token at AAA (≥7:1), asserted in `tokens.test.ts`.
- No onboarding, no map, no real push, no billing. Persistence is local only.

## Where to start next

`docs/GAPS.md` is the full audit. Its shortlist, repeated here because it is the answer to
"what now":

1. **Build the expiry conversion** — the app makes a promise it does not keep.
2. ~~**Add persistence.**~~ ~~**Build the session seam.**~~ Both done — sign-in is a
   phone-and-code stub over a real `useSession` store. Next: **local notifications**, the
   one roadmap item needing no server.
3. **Give Top up a confirmation and a receipt** — it moves money and behaves like a toggle.
4. **Handle the zero state** on Wallet, Savings and Card — every new user starts there.
5. **Neutralise or label the inert controls** — four sit on the two screens you would demo
   first, including both wallet-pass buttons.

## Open product decisions

1. ~~**The Savings headline.**~~ **Answered: no.** "R2,590 of fuel locked in below today's
   price" is not equally true — against the seed the locked-in position is **R8.34**, and
   the 90-day window caps it near R20 on a one-tank balance. It cannot be the Savings hero.
   It earns its place as a forward-looking line on Your litres instead, tied to the next
   scheduled rise, and Savings leads with the *realised* figure labelled as such.
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
npm test                    # 295 tests
npx tsc --noEmit
```

## The website

`web/` is a pre-launch marketing site for Barrel — a waitlist page plus `/terms` and
`/privacy` — built separately from the app documented above. It is a second, independent
Next.js project, not a screen or a feature of the Expo app, and it has its own lockfile
rather than being folded into this repo's npm workspace.

**Why it is not a workspace.** The app pins `react@19.2.3` (what Expo 57 / React Native
0.86 requires); `web/` runs Next 16 on `react@19.2.8`. A shared workspace forces one
resolved React version for both, so either the app installs a React it was not built
against or the site is held back from the version Next wants. Two lockfiles keep each
project on the React its framework actually shipped for, at the cost of two
`node_modules`. Run everything from inside `web/` — `cd web && npm install`, `npm run
dev`, etc. — never `npm install` from the repo root expecting it to reach `web/`.

**Why `npm run check` instead of tests.** `web/` has no test runner by design (see the
website spec, §9). The site is mostly static markup and copy; the properties worth
guarding mechanically are the visual and content constraints in the spec — the closed
eleven-colour palette, no fill colour used as text, no lime background, no centred
layout, a 10px radius ceiling, no mechanics vocabulary outside `/terms`, no import
reaching outside `web/`, no third-party request beyond Buttondown, and the provenance
fields on the price data — not unit behaviour. `scripts/check.mjs` encodes those rules
directly against the built output and source text and is the project's only automated
gate. `npm run verify` runs `next build` then `check.mjs`; that is what CI or a
pre-deploy step should call.

**Spec and plan.** `docs/superpowers/specs/2026-09-09-barrel-website-design.md` is the
design spec; `docs/superpowers/plans/2026-09-09-barrel-website.md` is the build plan it
was executed against. Both apply only to `web/`, not to the app.

**The rule that matters most: `src/data/prices.ts` must never reach the public site.**
That file is this app's invented demo data — a fictional 2026 supply shock with pinned
September/October values, written to make the prototype's screens tell a coherent story.
It is not real. `web/` has its own price file, `web/data/fuel-prices.ts`, holding actual
published DMPR (Department of Mineral and Petroleum Resources) figures, cross-checked
against the AA's published series, each entry carrying its source, retrieval date, fuel
grade and pricing zone. `scripts/check.mjs` fails the build if that provenance is
missing and fails separately if any import in `web/` resolves to a path outside `web/`
— which is exactly the path `src/data/prices.ts` would need to be reached by. Do not
weaken or route around either check to make a number match the app; get the number from
`web/data/fuel-prices.ts` or leave it out.

**Not deployed.** The site has been built and verified (`npm run verify` fails on
exactly two checks, both deliberately — see below) but no Vercel project exists for it
and nothing has been pushed live. Two values are still the placeholder
`'__SET_BEFORE_LAUNCH__'`, and `check.mjs` refuses the build on each of them on purpose:

- `LIST_ID` in `web/components/WaitlistForm.tsx` — the waitlist would otherwise post
  nowhere. The site owner has to create the Buttondown account first; it needs their own
  billing and identity, so nobody else can.
- `RESPONSIBLE_PARTY` in `web/app/privacy/page.tsx` — POPIA s18(1)(b) requires the
  policy to name who is responsible for the list and give an address, and no legal
  entity has been registered yet. Every right in that policy ends in "write to us", so a
  reader who cannot tell who "us" is has a policy they cannot act on.

Fill both in, then deploy.

**One launch step no check can catch.** `/privacy` promises the launch email carries no
open or click tracking. Both are opt-in in Buttondown and off until somebody switches
them on at `buttondown.com/settings/tracking` — a dashboard setting, invisible to
`check.mjs` and to the repo. Leave them off. If the tracking is ever wanted, the privacy
notice has to change in the same breath, or it is simply false.

**The root `tsconfig.json` excludes `web/`.** It carries `"exclude": ["web"]` for
exactly one reason: without it, `npx tsc --noEmit` at the repo root walks into `web/`
and type-checks it against Next's React types, which are not the React types the Expo
app is written against — the app then fails to type-check on code it never touched.
Removing that exclusion is the fastest way to make `npx tsc --noEmit` fail for a reason
that has nothing to do with the app. Leave it in place; `web/` type-checks itself, via
its own `tsconfig.json`, as part of `next build`.
