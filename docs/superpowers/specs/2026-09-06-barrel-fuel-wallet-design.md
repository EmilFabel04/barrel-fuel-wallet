# Barrel Fuel Wallet — Mobile Frontend Design

**Date:** 2026-09-06
**Status:** Approved for planning
**Status:** Revised after strategy review — v1 is a station-agnostic card product
**Scope:** Frontend UI shell with mock data. No backend, no real payments, no station integration.

---

## 1. Context

Barrel is a concept for a South African fuel wallet: motorists pre-purchase petrol and
diesel at today's price into a wallet **denominated in litres, not rand**, then redeem
those litres at partner filling stations. The business rationale, revenue model, and
regulatory analysis live in `Barrel_Business_Overview.docx`. This document covers only
the mobile frontend.

Two source inputs:

- `Barrel Fuel Wallet.dc.html` — a nine-artboard Claude Design canvas, 390x844,
  dark-mode first, with live top-up keypad logic.
- `Barrel_Business_Overview.docx` — business and regulatory context.

The design file's companion `support.js` is the Design Canvas React runtime. It carries
no design content and nothing in it is ported.

### 1.1 Why a UI shell first

The business overview is explicit that a formal legal opinion on the prepaid-litre-voucher
structure gates everything else (§11). Building backend ledger and settlement
infrastructure ahead of that opinion risks writing off real work. A faithful, navigable
frontend with a convincing mock ledger is the cheapest artifact that can validate the
redemption flow with users, and be shown to prospective station partners.

### 1.2 Known risk of this artifact

The mock will look more finished than the business is. Anyone shown this build should be
told plainly that it is a prototype over mock data, that no legal opinion has been
obtained, and that no station agreements exist. This is a communication requirement, not
an engineering one, but it belongs in the spec because the fidelity of the build creates
the risk.

### 1.3 Strategy: demand-side aggregation

Barrel is being built as a demand-side aggregator, in two deliberate phases.

**Phase 1 — station-agnostic.** Barrel signs no stations. The product is a prepaid card
that works at any fuel merchant in South Africa, so consumer growth is never gated on
partner negotiations. Revenue is subscription, float, and issuer interchange. The goal is
users and habit.

**Phase 2 — aggregation.** With a large, habitual base, Barrel steers volume to chosen
stations and sells that steering as a per-litre rebate. Stations sign because the volume
is already moving and they want it pointed at them.

Three consequences that shape v1, and one of them inverts an assumption:

1. **No QR flow, no partner network, no redemption screens.** There is nothing to redeem
   against. The card *is* the mechanic. This removes three screens from the original spec.
2. **v1 is the control group, and that is a feature, not a delay.** Phase 2's leverage is
   not user count — it is demonstrated elasticity, the proof that a nudge of a known size
   moves a known volume. Elasticity is only measurable against a baseline of where drivers
   fill absent any nudge, and that baseline can only be captured *before* steering exists.
   Launching steering and measurement together yields no counterfactual and an
   unfalsifiable number. v1 must therefore instrument per-station, per-grade, per-fill
   attribution from the first transaction (§11).
3. **Litre-denomination makes users unusually steerable later.** A cash customer chases
   the cheapest pump. A Barrel customer sees no price signal at all — forty litres costs
   forty litres wherever they go — so in phase 2 a small nudge fully determines station
   choice. Preserving that price-blindness in the v1 interface is therefore a strategic
   requirement, not just a brand one.

---

## 2. Goals and Non-Goals

### Goals

1. Port the designed artboards to React Native at high visual fidelity.
2. Add what the design is missing: a navigation model, the card as the central mechanic,
   subscription, and visible product guardrails.
3. Make the core loop work against local state: top up adds litres, a card fill deducts
   them, both write to a ledger the user can inspect and audit.
4. Model the card honestly — a card transaction carries rand, not litres, so the litre
   deduction is an inference and the UI must show its arithmetic (§8.4).
5. Full light/dark theming, dark by default.
6. Keep the pure logic unit-tested and independent of React, so it can later be validated
   against the real backend ledger.

### Non-Goals

- Any backend, API, or persistence beyond in-memory state.
- Real payments, card issuing, Apple Wallet / Google Pay passes. Those buttons are inert.
- QR redemption and partner-station flows. Cut entirely — see §1.3.
- Real subscription billing. The paywall is UI only; nothing charges.
- Authentication, FICA onboarding, or KYC flows.
- Maps. The Stations screen's "VIEW ON MAP" is inert.
- Accessibility audit beyond baseline (see §9.3).
- Android/iOS store submission.

---

## 3. Design System

Extracted verbatim from the design file. These are the single source of truth; no new
colours, radii, or shadows may be introduced without amending this section.

### 3.1 Colour

| Token | Dark | Light | Use |
|---|---|---|---|
| `bg` | `#000000` | `#FFFFFF` | Screen background |
| `bgRaised` | `#0A0A0A` | `#FFFFFF` | Alert screen background |
| `surface` | `#1A1A1A` | `#EDEBE7` | Keypad grid gaps, pressed states |
| `border` | `#2E2E2E` | `#D5D2CC` | Buttons, inputs, chips |
| `hairline` | `#1F1F1F` | `#E2DFDA` | 1px dividers |
| `textMuted` | `#6B6B6B` | `#6B6B6B` | Labels, secondary values |
| `textDim` | `#A8A8A8` | `#A8A8A8` | Tertiary text, unit suffixes |
| `text` | `#FFFFFF` | `#000000` | Primary text |
| `inverse` | `#000000` | `#FFFFFF` | Text on accent/white fills |

Two accents, unchanged across themes:

| Token | Value | Use |
|---|---|---|
| `accent` | `#D9541E` | Primary CTA, rising prices, expiry warnings |
| `positive` | `#C6F24E` | Savings, credits, falling prices, active toggles |

The design exposes accent alternates (`#E08A1E`, `#B8461A`, `#FF4D1F`) and positive
alternates (`#8CE563`, `#E8E8E8`, `#5AD1FF`) as canvas props. These are recorded as
constants but not exposed in the app.

### 3.2 Typography

**Outfit** (Google Fonts), weights 300-900, via `@expo-google-fonts/outfit`.
Monospace labels use the platform UI monospace stack.

| Role | Spec |
|---|---|
| Numeric hero | Outfit 800, tabular numerals, `letterSpacing: -0.045em`, 46-92px |
| Screen title | Outfit 700, 12px, `letterSpacing: 0.12em`, uppercase |
| Section label | Monospace 600, 10px, `letterSpacing: 0.16em`, uppercase, `textMuted` |
| Artboard label | Monospace 600, 10px, `letterSpacing: 0.14em`, uppercase |
| Body | Outfit 400, 13px, line-height 1.5, `textDim` |
| Row label | Outfit 500, 13-14px |
| Button | Outfit 800, 14-15px, `letterSpacing: 0.03em`, uppercase |
| Wordmark | Outfit 800, `letterSpacing: -0.035em`, uppercase |

The numeric treatment appears on all nine artboards and becomes a `<Num>` component.
React Native requires `fontVariant: ['tabular-nums']` and letter-spacing converted from
em to points at the call site.

### 3.3 Geometry

- Border radius: **3px** on buttons only. Cards, chips, tabs, and inputs are square.
- Borders: **1px**, never thicker.
- **No shadows, no gradients, no blur** anywhere in the system.
- Screen horizontal padding: **26px**. Alert screen and keypad use 20px and 18px.
- Primary button height: **58px**. Secondary CTA in cards: **54px**.
- Grade tab height: **50px**. Keypad key height: **62px**.

### 3.4 Brand mark

A 24x24 SVG: a filled square with a droplet knocked out, `fill-rule="evenodd"`.
Path is carried over verbatim into `react-native-svg`. Renders at 30px (canvas header),
17px (screen headers, card), 14px (lock-screen notification), 13px (compact).

---

## 4. Screen Inventory

Nine designed artboards plus three new screens.

| # | Screen | Route | Source |
|---|---|---|---|
| 01 | Wallet | `(tabs)/index` | Artboard 01 (dark) + 05 (light) |
| 02 | Top up | `top-up` | Artboard 02 — has live logic |
| 03 | Barrel card | `card` | Artboard 03 |
| 04 | Price alerts | `alerts` | Artboard 04 |
| 06 | Stations | `(tabs)/stations` | Artboard 06 |
| 07 | Savings | `(tabs)/savings` | Artboard 07 |
| 08 | Balance / ledger | `balance` | Artboard 08 |
| 09 | Settings | `(tabs)/settings` | Artboard 09 |
| — | Fill detail | `fill/[id]` | **New** |
| — | Subscribe | `subscribe` | **New** |

Artboard 05 is not a separate screen. It is artboard 01 rendered in the light theme, and
is satisfied by §6.

### 4.1 Content preserved from the design

Mock content is copied exactly so the build is comparable to the canvas side by side.

- Prices: Petrol 95 `R21.87/L` (+0.55%), Diesel 0.05% `R20.14/L` (-0.19%), Gauteng.
- Opening balance: `42.6 L` — 31.2 L petrol 95, 11.4 L diesel.
- Holder: Thabo Makhubela, initials TM, `+27 82 441 0912`, card `•••• 4127`,
  vehicle `CA 418 921`, payment method `FNB ••4127`.
- Network: the design's `412 stations · 9 provinces` is **replaced**. A station-agnostic
  card has no network to count, and quoting one understates the product. The Stations
  screen leads with `Works at any fuel station in South Africa` and the list becomes a
  price-comparison and locator surface, not a coverage list.
- Five stations: Engen William Nicol (Bryanston, 24h, 1.2km, R21.87), Sasol Rivonia
  (Rivonia, 05:00-23:00, 2.8km, R21.87), Shell Grayston (Sandton, 24h, 4.1km, R21.91),
  Astron Energy Fourways (Fourways, 24h, 5.6km, R21.84), Total Sunninghill
  (Sunninghill, 06:00-22:00, 6.3km, R21.89).
- Savings: `R1,284` since March, `58.7 L` bought below pump price, average buy price
  `R21.24/L`. Bars: APR R128 (42%), MAY R186 (61%), JUN R104 (34%), JUL R271 (88%),
  AUG R221 (72%), SEP R374 (100%, lime).
- Ledger, five entries: Top up 95 (28 Sep, R1 500, +68.6 L, after 74.0 L); Fill Sasol
  Rivonia (24 Sep, pump 3, -31.4 L, after 42.6 L); Top up Diesel (18 Sep, R800,
  +39.7 L, after 73.9 L); Fill Engen William Nicol (11 Sep, pump 4, -28.3 L, after
  34.2 L); Referral bonus (04 Sep, Lerato M., +2.0 L, after 62.5 L).
- Alert copy: "Petrol price rising 12c on the 2nd — top up now", R21.87 → R21.99/L,
  `2.4 L saved`, "Topping up R2 000 before the increase buys you 2.4 litres more than it
  will on Wednesday." Threshold: alert when 95 moves by ≥ 10c.
- Settings toggles: Price increase alerts (on), Weekly balance summary (on),
  Station promotions (off).
- Footer: `Barrel v2.4.0 · FSP 51284`.

### 4.2 Two arithmetic defects in the source design

The design's ledger does not balance. Verified chronologically:

| Date | Delta | Design says after | Chain gives | |
|---|---|---|---|---|
| 04 Sep | +2.0 | 62.5 | 62.5 | ok |
| 11 Sep | -28.3 | 34.2 | 34.2 | ok |
| 18 Sep | +39.7 | 73.9 | 73.9 | ok |
| 24 Sep | -31.4 | 42.6 | 42.5 | off by 0.1 |
| 28 Sep | +68.6 | 74.0 | 111.2 | off by 37.2 |

Two separate problems. The 24 Sep row is a rounding artifact. The 28 Sep row is
structural: it is the newest entry, yet the Wallet hero shows `42.6 L`, which is the
balance *before* that top-up. Removing the 28 Sep entry makes the history chain cleanly
to 42.6 L and agree with the headline balance and the 31.2 + 11.4 grade split.

**Resolution.** `balanceAfter` is always computed from the lot store, never hardcoded.
The seed is constructed so the chain terminates at 42.6 L, preserving the headline
balance and the grade split, which appear on more screens than the ledger does. The
28 Sep top-up is retained with a corrected `after` value rather than deleted, since a
top-up entry is needed for the §8.2 cap meter to read `68.6 / 150 L this month`. Dates,
descriptions, and deltas are otherwise preserved verbatim.

### 4.3 Seeding history for the Savings screen

The Savings screen's figures — `R1,284` saved since March, `58.7 L` bought below pump
price, average buy price `R21.24/L`, and six monthly bars from April to September — are
derived quantities under §7.5, not literals. Displaying them as hardcoded text while
computing every other number from the store would mean the screen silently stops
agreeing with itself after the first redemption.

The seed therefore includes **historical lots back to March**, chosen so the computed
outputs land on the design's published figures. The bar heights follow from the same
data: APR R128, MAY R186, JUN R104, JUL R271, AUG R221, SEP R374, with September at 100%
in `positive` as the tallest bar. Historical lots are seeded already fully consumed, so
they contribute to savings and to the chart without inflating the current balance.

---

## 5. Navigation

A five-tab bottom bar, with **Card at the centre**. The card is the entire mechanic in
v1 — it is how the product is used at a forecourt, one-handed, often at night — so it
takes the centre position and the accent colour.

```
Wallet  ·  Stations  ·  Card  ·  Savings  ·  Settings
```

Pushed screens, presented as stack screens over the tabs with the design's existing
back-arrow header: `top-up`, `balance`, `alerts`, `fill/[id]`, `subscribe`.

Card is promoted from a pushed screen (artboard 03) to a tab. The Wallet's `CARD` button
is retained anyway — it is in the design, and a second path to the one screen that
matters is not redundancy worth removing.

Entry points:
- Wallet `TOP UP` button and Balance `TOP UP` button → `top-up`
- Wallet `CARD` button → `card`
- Wallet balance hero (tappable) → `balance`
- Wallet price-watch block (tappable) → `alerts`

### 5.1 Tab bar visual spec

The tab bar is not in the source design and must be drawn in its language: 1px
`hairline` top border, `bg` fill, no elevation, no pill, no rounded active indicator.
Icons are 22px `react-native-svg` line glyphs at 1.5px stroke. Inactive `textMuted`,
active `text`. Labels are monospace 9px, `letterSpacing: 0.1em`, uppercase.

Card is the exception: its icon and label take `accent` when active, marking the one
destination that does something in the physical world. Height 56px plus safe-area inset.

---

## 6. Theming

Dark is the default. Both themes are defined as complete token sets in §3.1 and consumed
through a `ThemeProvider` + `useTheme()` hook. No component may reference a raw hex value.

The Settings `Appearance` row cycles Dark → Light → System. `System` follows
`useColorScheme()`. The choice lives in the wallet store; it is not persisted, consistent
with the no-persistence scope.

Artboard 05 is the acceptance test for light mode: the ported Wallet screen in light
theme must match it, including the inverted price-watch block (black card on white) which
is the one place light mode is not a mechanical token swap. That block is a deliberate
inversion in the source design and is preserved as a special case.

---

## 7. Data Model and State

### 7.1 Lots

Litres are held as **lots**, not a scalar balance:

```ts
type Grade = '95' | 'diesel';

type Lot = {
  id: string;
  grade: Grade;
  litres: number;          // remaining, not original
  pricePerLitre: number;   // locked at purchase
  purchasedAt: Date;
  expiresAt: Date;         // purchasedAt + 90 days
};
```

One structure serves four requirements that would otherwise each need their own field:

1. **Expiry** per §8 is a property of a purchase, not of the wallet.
2. **Savings** are only computable if the price paid for each litre is retained.
3. **FIFO redemption** needs lots ordered by purchase date.
4. It mirrors the append-only, per-grade ledger described in §10 of the business
   overview, so the mock and the eventual Python service share a shape.

### 7.2 Ledger

```ts
type LedgerEntry = {
  id: string;
  kind: 'topup' | 'fill' | 'bonus' | 'expiry';
  what: string;            // 'Top up · 95', 'Fill · Sasol Rivonia'
  when: Date;
  detail: string;          // 'R1 500', 'Bryanston', 'Lerato M.'
  grade: Grade;
  deltaLitres: number;     // signed
  balanceAfter: number;    // computed at write time
  lotIds?: string[];       // lots consumed, for audit
  card?: CardFill;         // present on kind === 'fill'
};
```

Append-only. Entries are never mutated or deleted.

### 7.3 Card fills — rand in, litres inferred

A card transaction is the only way litres leave the wallet in v1, and it is the single
most consequential modelling decision in this spec.

The card rail gives an issuer the merchant descriptor, MCC, location, rand amount and
timestamp. It gives **no litres, no grade, and no pump number**. Every litre deduction is
therefore an *inference*, not a measurement:

```ts
type CardFill = {
  merchantDescriptor: string;  // 'SHELL GRAYSTON SANDTON' — raw, messy
  stationId: string | null;    // resolved by normalisation, null when unmatched
  mcc: '5541' | '5542';
  randAmount: number;          // the only figure the rail actually gives us
  assumedPricePerLitre: number;// from the pricing service
  litres: number;              // randAmount / assumedPricePerLitre
  gradeSource: 'vehicle' | 'user';
  disputed: boolean;
};
```

Three consequences carry into the build:

**The pricing service is load-bearing, not decorative.** In the original spec, CEF/DMPR
data powered price-timing nudges — a feature. Here, it determines every litre deduction.
If the assumed price is wrong, the user's litre balance is wrong, and that is the one
number the entire product is denominated in.

**Grade must be inferred.** Balances are held per grade but the rail does not say which
was pumped. Resolution order: (a) the linked vehicle's fuel type, which covers a driver
with one car and one grade — nearly everyone; (b) if the driver holds balances in both
grades *and* the vehicle type is unset or ambiguous, an in-app prompt on the fill, which
stays actionable from the ledger until answered. Never silently guess between two
non-zero balances.

**Inference error is user-visible and must be surfaced, not hidden** — see §8.4.

### 7.4 Store

Zustand, in memory, seeded from `src/data/seed.ts` so the app opens on the designed state.

| Action | Behaviour |
|---|---|
| `topUp(grade, rand)` | Rejects if over the monthly cap (§8.2). Creates a lot at the current price, appends a `topup` entry. |
| `cardFill(descriptor, randAmount, grade?)` | Resolves station and price, infers litres, consumes lots FIFO skipping expired, appends a `fill` entry with its `CardFill` record. |
| `resolveGrade(entryId, grade)` | Answers a pending grade prompt and re-runs the deduction. |
| `disputeFill(entryId)` | Flags a fill; UI only, no resolution flow. |
| `setAppearance(mode)` | Dark / Light / System. |
| `setSubscription(state)` | `trial` / `active` / `lapsed`. UI only, nothing bills. |
| `toggleAlert(index)` | Settings toggles. |

Derived selectors: `balanceFor(grade)`, `totalBalance()`, `randValue()`,
`litresThisMonth()`, `savingsToDate()`, `averageBuyPrice()`.

### 7.5 Pure logic

All arithmetic lives in `src/lib/` as pure functions over plain data, with no React or
store imports:

- `lots.ts` — `consumeFifo`, `activeLots`, `expiringSoon`, `balanceOf`
- `savings.ts` — `savingsToDate`, `averageBuyPrice`
- `caps.ts` — `litresThisMonth`, `capRemaining`, `withinCap`
- `cardfill.ts` — `inferLitres`, `resolveGradeFor`, `normaliseDescriptor`
- `format.ts` — `litres`, `rand`, `randCompact`, `pricePerLitre`, `relativeDate`

The design's own formatter is ported exactly: fixed decimal places, then thousands
grouped with `\B(?=(\d{3})+(?!\d))`. Litres show 1 decimal, rand amounts 2, keypad
input 0.

---

## 8. Guardrails

The business overview (§3.2, §7) defines three controls. None appear in the source
design. Because the litre-voucher framing is what keeps Barrel outside FSCA/FAIS
oversight, a UI that conceals the terms of the voucher undermines the structure it
depends on. They are therefore product requirements, not decoration.

### 8.1 Redemption window — 90 days

The business overview specifies a 60-90 day window. The upper bound is used: it is the
most generous reading, and a shorter window can be introduced later without redesigning
any screen, whereas lengthening one is a change users notice and object to.

- Every ledger row of kind `topup` shows `expires 27 Dec` in `textMuted`.
- Under 14 days remaining, the expiry text takes `accent`.
- The Balance screen shows a line above the ledger when any lot expires within 30 days:
  `12.4 L expires within 30 days`.

Consistent with CPA s63, expiry is **not** forfeiture. Copy on the Balance screen and in
Settings → Help reads: *"Unused litres convert back to the rand you paid for them. They
never expire to zero."* The 90-day figure is the *price lock* duration, not the life of
the money. This distinction is the product's answer to the s63 tension identified in the
business overview and must not be softened in copy.

### 8.2 Per-vehicle monthly cap — 150 L

- The Top up screen carries a meter under the grade selector: `68.6 / 150 L this month`,
  a 2px hairline track filled in `text`, turning `accent` above 80%.
- Entering an amount that would breach the cap disables the confirm button, which changes
  its label to `MONTHLY CAP REACHED` and drops to `surface` with `textMuted` text.
- The cap is per linked vehicle. Settings shows `Linked vehicle · CA 418 921` as it
  already does; a `Monthly cap · 150 L` row is added beneath it.

### 8.3 No cash-out above purchase price

A single line of body copy beneath the Top up confirm button:
*"Litres you don't use convert back to the rand you paid. No cash-out above purchase price."*

### 8.4 Conversion transparency — new, and the most important one

Per §7.3, litres deducted on a card fill are inferred from a rand amount and an assumed
price. A driver who pumps 40.0 L and sees 40.1 L leave their wallet will notice, and will
be right to. On diesel — retail pricing unregulated, real dispersion between stations —
this is routine, not an edge case.

Concealing the conversion would trade a small UI simplification for the product's central
claim. The requirement is therefore the opposite of hiding it:

- Every `fill` row in the ledger is tappable, opening `fill/[id]`.
- That screen shows the arithmetic as an equation in the numeric treatment:
  `R873.60  ÷  R21.84/L  =  40.0 L`, with the assumed price labelled
  `Shell Grayston · 95 · 24 Sep`.
- A `THIS DOESN'T MATCH MY RECEIPT` button in `border` style flags the entry. In the
  mock it sets `disputed` and shows a confirmation; no resolution flow is built.
- A disputed row carries a 2px `accent` left rule in the ledger.

The dispute affordance is not a nicety. It is the mechanism by which pricing-service
error becomes visible to the operator instead of silently eroding trust, and it is the
only place in v1 where a user can tell Barrel its own data is wrong.

---

## 9. New Screens

### 9.1 Card — `(tabs)/card`

Artboard 03, promoted to a tab and made the centre of the product. The pass design is
kept verbatim — white card, wordmark, `FUEL PASS` label, litre balance hero, holder name,
last four digits, and the two grey strata beneath it.

Four changes:

- **Spending power.** Beneath the litre balance, `R2,405 available at today's 95` in
  `textDim`. This is the number that matters at a till, and in v1 it is real — it is what
  the card will authorise.
- **`412 stations` becomes `Works at any fuel station`.** The design's accepted-at row is
  kept; only the claim changes.
- **Grade.** When both balances are non-zero the card shows which grade is active, tapping
  to switch. With one balance it shows nothing — no chrome for a choice that doesn't exist.
- **Freeze card.** A `border`-style button beside the wallet buttons. Sets a flag, greys
  the pass to `surface`, stamps `FROZEN` across it in `accent`. Cheap to build and the
  first thing anyone looks for in a card app.

`ADD TO APPLE WALLET` and `ADD TO GOOGLE PAY` are retained exactly as designed, and are
inert.

### 9.2 Fill detail — `fill/[id]`

The §8.4 conversion-transparency screen. Station, grade, date, the equation in numeric
treatment, resulting balance, lots consumed, and the dispute button. Reached by tapping
any `fill` row in the ledger.

Where a fill has an unresolved grade prompt (§7.3), this screen carries it: a two-option
selector and `CONFIRM GRADE`, which re-runs the deduction and rewrites the entry.

### 9.3 Subscribe — `subscribe`

Subscription runs from day one, so it needs a home. It has none in the source design and
is drawn here in the same language.

**R59/month**, the midpoint of the R49–R79 range in the business overview, with a 30-day
free trial. A single tier — the strategy is growth and habit, and a feature matrix at
this stage buys complexity, not revenue.

Layout: price as numeric hero with `/month` in `textDim`; a four-row included list on
hairlines — price-lock on every litre, price-increase alerts, works at any fuel station,
no markup on fuel; `START 30-DAY TRIAL` in `accent`; and beneath it in `textMuted`,
*"Cancel any time. Your litres stay yours."*

That last line is a Consumer Protection Act s14 requirement doing product work — a
24-month cap and a 20-business-day cancellation right are easier to honour if the
interface never implies a lock-in.

Presented once after onboarding, and reachable from a Settings row showing
`Subscription · Trial · 24 days left`. A lapsed subscription greys the Top up button and
shows `RESUME SUBSCRIPTION`; **it never blocks the card or the existing balance** —
litres already bought are the user's property and withholding them would be precisely the
cash-out-restriction problem in §8.3 wearing a different hat.

## 10. Testing

`jest` + `jest-expo`, unit tests over `src/lib/` only.

| Module | Cases |
|---|---|
| `lots.consumeFifo` | Oldest first; spans multiple lots; skips expired; exact-drain removes lot; insufficient balance rejects; partial consumption leaves remainder |
| `cardfill.inferLitres` | Rand ÷ assumed price; rounds to 1dp; unmatched station falls back to regional price; zero and negative amounts reject |
| `cardfill.resolveGradeFor` | Vehicle type wins; both balances non-zero with no vehicle type returns a prompt, never a guess; one non-zero balance resolves without prompting |
| `lots.activeLots` | Excludes expired at boundary; same-day expiry is still active |
| `caps` | Under, at, and over cap; month boundary; cap counts top-ups only, not bonuses |
| `savings` | Positive when bought below pump; negative when above; zero balance does not divide by zero |
| `format` | Thousands grouping at 3, 4, 7 digits; 1 vs 2 decimals; zero and empty input |

No snapshot or pixel tests. The design is still moving and snapshots would calcify it.
Visual fidelity is verified by side-by-side comparison against the canvas.

### 10.1 Accessibility baseline

Not a full audit, but three things are non-negotiable and cheap: every touchable has an
`accessibilityLabel`; every touchable meets a 44x44pt target (the ledger and station rows
are 17px padded and already clear it); and numeric heroes carry an `accessibilityLabel`
spelling out the value, since `42.6 L` is announced poorly by default.

Note for a later audit: `textMuted` `#6B6B6B` on `bg` `#000000` is roughly 3.3:1, below
WCAG AA for body text. It is used for secondary labels throughout the source design.
This is recorded as known debt, not fixed here, because changing it would alter the
design's character and that is the designer's call.

---

## 11. Instrumentation for Phase 2

Per §1.3, phase 2's leverage is demonstrated elasticity, and elasticity is only
measurable against a pre-steering baseline that can only be captured now. This section
exists so that v1 does not have to be rebuilt to produce the asset the strategy depends on.

No analytics SDK is added in this build — there is no backend to send to. What v1 must do
is **shape the data so the events are derivable**, which costs nothing now and is
expensive to retrofit:

| Captured per fill | Why phase 2 needs it |
|---|---|
| `stationId` (normalised) | The unit a rebate is negotiated over |
| `merchantDescriptor` (raw) | Normalisation will be imperfect; keep the source |
| Geo / suburb | Defines the catchment a station competes in |
| Grade, litres, rand, assumed price | Volume and value, split by the regulated/unregulated divide |
| Timestamp | Day-of-week and time-of-day patterns |
| Driver's prior fills | Baseline station choice — the counterfactual |

The normalisation problem is worth naming: merchant descriptors arrive dirty
(`ENGEN WILLIAM NICOL`, `E WILLIAM NICOL 4412`, `ENGEN 4412 BRYANSTON`), and station
identity is the unit the whole phase-2 negotiation is priced in. `normaliseDescriptor`
is a stub in v1 that matches against the seeded station list and returns `null` on no
match, but it is flagged here as real backend work, not a formality.

Unmatched fills must still succeed. A driver whose station cannot be resolved still gets
their litres, at the regional reference price, and the fill is recorded with
`stationId: null`. Losing an attribution is acceptable; failing a transaction at a
forecourt is not.

---

## 12. Dependencies

| Package | Purpose |
|---|---|
| `expo` (SDK 54) + `expo-router` | App shell, file-based routing |
| `react-native-svg` | Brand mark, tab icons, savings bars |
| `zustand` | Wallet store |
| `@expo-google-fonts/outfit` + `expo-font` | Outfit 300-900 |
| `expo-haptics` | Keypad and confirm feedback |
| `jest`, `jest-expo`, `@types/jest` | Unit tests |

Explicitly not used: any UI component library, any animation library beyond React
Native's `Animated`, any state library beyond zustand, any date library — the four date
operations needed (add days, diff days, month boundary, format) are a dozen lines.

---

## 13. Out of Scope / Next

Deferred, in the order they would matter:

1. Persistence — the store is in memory and resets on reload.
2. Onboarding, FICA capture, vehicle linking. Vehicle fuel type is seeded, but §7.3 makes
   it load-bearing for grade inference, so onboarding must capture it before any pilot.
3. Real subscription billing. The paywall is UI only.
4. Station map (`VIEW ON MAP` is inert).
5. Real push notifications — artboard 04's lock screen is a static mock.
6. Backend: the double-entry ledger, CEF/DMPR pricing ingest, and card-network
   integration. Note that the pricing service moved from *feature* to *critical path* in
   this revision (§7.3) and should be sequenced accordingly.
7. Merchant-descriptor normalisation at real scale (§11).
8. Phase-2 steering: bonus litres, station ranking, elasticity measurement.

### 13.1 Resolved in this revision

Three items from the first draft are now closed:

- **The subscription gap.** The first draft flagged that the R49–R79/month fee the
  business overview calls "the primary profit engine" had no UI anywhere. §9.3 gives it
  one. With no rebate revenue in phase 1, it is close to the only revenue line, so this
  moved from omission to central.
- **Partner concentration risk** (business overview §8.2) is designed out of v1 rather
  than mitigated. A station-agnostic card has no partner to concentrate on.
- **The QR redemption flow** is cut, not deferred. It was the answer to a partner-network
  question v1 no longer asks.

### 13.2 Open risks carried forward

Recorded so they are not lost between this spec and a legal opinion:

- **The FSCA/FAIS argument is weaker than in the first draft.** Business overview §7 rests
  the non-derivative case on a voucher "redeemable only for physical fuel". An open-loop
  card converting litres to rand at a floating price is closer to cash settlement.
  MCC-locking to 5541/5542 preserves the *fuel-only* half of that sentence, which is the
  load-bearing half, but the floating conversion remains the exposed edge and should be
  put to counsel explicitly rather than assumed to be covered.
- **The station rebate — one of four revenue streams — does not exist in phase 1.**
  Issuer interchange partially backfills it. SA fuel-MCC interchange rates should be
  confirmed with a prospective sponsor bank before the model relies on the figure.
- **Diesel price dispersion is an uncapped exposure.** Petrol retail price is regulated,
  so that half is bounded by law. Diesel is not: a driver filling at a premium station
  costs Barrel the difference, with no partner agreement to cap it. No conversion cap is
  implemented in v1; this is a deliberate deferral, not an oversight, and it needs a
  decision before real money moves.
