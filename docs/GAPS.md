# Barrel — what is missing

An audit of the prototype as it stands: what is absent from the UI, the UX, and the model
underneath. Written 9 September 2026, after the Pump redesign.

Each item says what is missing and **why it matters**, because "add loading states" is not
useful without knowing what breaks without them. Items marked **⛔** are things the app
currently *claims* to do and does not — those are the dangerous ones, because a demo
audience will believe them.

Ordered by consequence within each section, not by effort.

---

## 1. The model (`src/lib`, `src/data`, the store)

The arithmetic here is the good part of this project — pure, tested, portable. These are the
gaps in it.

### ⛔ 1.1 Expired litres are never converted back to rand

**The single most important gap.** Three screens tell the user "unused litres convert back
to the rand you paid for them. They never expire to zero." Nothing implements it.

The `LedgerEntry` type declares `kind: 'expiry'` and **nothing in the codebase ever writes
one**. What actually happens is that `activeLots` filters out lots past their date, so an
expired lot silently stops counting toward the balance and the money is simply gone from the
user's point of view — the opposite of the promise on the screen.

*Needs:* an expiry sweep that runs on read (there is no server), writes an `expiry` ledger
entry for the lapsed litres, and credits the rand back somewhere. That last part is the
product decision: back to a rand balance the wallet does not currently have, or as a
credit note against the next top-up.

*Why it matters:* it is the difference between a wallet and a voucher that eats your money.
It is also very likely the thing a regulator asks about first.

### ⛔ 1.2 No persistence — everything resets on reload

The store is in memory. Close the app and the seed comes back: your top-up, your fills,
your frozen card, your appearance preference, all gone.

*Needs:* AsyncStorage or MMKV behind a zustand persist middleware, and a migration story
for the `Date` objects the model is full of (JSON round-trips them to strings and every
date comparison silently breaks).

### 1.3 The clock is pinned, and the seed cannot survive being unpinned

`DEMO_NOW` is 30 September 2026. `setClock(() => new Date())` is one line, but the seed is
dated absolutely and collapses against a real clock:

- the price table ends 7 Oct 2026 and afterwards **silently returns October's price
  forever** — the failure is quiet, which is the dangerous direction;
- `priceOn` *throws* before 4 Mar 2026 — loud, and therefore fine;
- the monthly cap meter reads zero from 1 Oct;
- the last lot expires 27 Dec 2026, taking the balance to 0.0 L on three screens.

*Needs:* a seed generated relative to `now()`, and a price table that either extends or
extrapolates with an explicit, visible rule.

### ⛔ 1.4 `cardFill` declines silently where it should queue

Two documented cases return without recording anything: an unresolvable merchant with no
fallback zone, and the weekly cap being breached. `lastCardFillError` records why —
**and no screen ever reads it**, so from the UI a declined fill is indistinguishable from
one that never happened.

The intended production behaviour for the attribution case is to queue the fill for manual
pricing rather than guess. That queue does not exist.

*Why it matters:* spec §11 is "never fail the card at the pump". Today a driver whose
station cannot be matched loses the fill entirely and is told nothing.

### 1.5 No idempotency on `cardFill`

A card rail delivers duplicates. Nothing keys on an external transaction id, so the same
authorisation replayed twice spends the litres twice.

*Needs:* an idempotency key on `CardFill`, and a uniqueness check before consumption.

### 1.6 `lots` and `ledger` can drift, and nothing checks

They are updated together in the store but there is no invariant asserting that
`balanceOf(lots)` equals the newest entry's `balanceAfter`. A bug in one path desynchronises
them silently. The seed's own tests check this; the *running app* does not.

*Needs:* a reconciliation check, at minimum in development.

### 1.7 Coastal exists in the price table and is unreachable

Every station in `stations.ts` is `inland` and every screen hardcodes `'inland'`. Coastal
prices are maintained, tested, and dead. A user in Cape Town has no correct experience.

*Needs:* a zone on the account (or derived from the fill), and screens that read it instead
of a literal.

### 1.8 The subscription does nothing in either direction

`trialDaysLeft` is a static `24` that never decrements. `setSubscription('lapsed')` is
implemented and unreachable from any UI. Nothing bills. Correctly, a lapsed subscription
never blocks the card or the balance — but nothing tests that end to end because the state
cannot be reached in-app.

### 1.9 The referral bonus has no referral

The seed contains a 2.0 L bonus from "Lerato M." There is no invite flow, no code, no
attribution, and no way to earn another.

### 1.10 Disputes are a one-way flag

`disputeFill` sets `card.disputed = true` and that is the entire lifecycle. No reversal, no
resolution, no state beyond "reported", no way back. Once tapped it is permanent, and the
button disables itself.

---

## 2. UX — flows that are missing or unfinished

### ⛔ 2.1 Top up has no confirmation and no acknowledgement

`onPress={() => { topUp(rand); router.back(); }}`

You tap `BUY 68.6 L` and are silently returned to the previous screen. For an action that in
production takes real money, there is no confirm step, no success state, no receipt, and no
undo. It is the most consequential control in the app and the least ceremonious.

### 2.2 No error surface anywhere

Nothing in `app/` renders `lastCardFillError`, and there is no toast, banner, or inline
error pattern to render it *into*. The `Banner` component exists but only announces
successful arriving fills.

### 2.3 No empty states on three of five screens

| Screen | Zero-state today |
|---|---|
| History | ✅ handled |
| Your litres (timeline) | ✅ handled |
| Wallet | hero reads `0.0 L`, gauge renders one grey bar, no explanation, no call to action |
| Savings | hero reads `R0.00`, both charts render empty axes |
| Card | pass shows `0.0 L` with no guidance |

A new user's *first* experience is the one nobody has designed.

### 2.4 No onboarding, and no explanation of the core concept

The app opens straight onto a wallet with a laddered balance and a gauge split by expiry.
Nothing anywhere explains what a "lot" is, why litres expire, or why that is good for you.
The 90-day window is the product's whole mechanism and the first-time user meets it as a
coloured bar.

### 2.5 Destructive and semi-destructive actions have no confirmation

- **Freeze card** — `onPress={() => freeze(!frozen)}`. Instant, no confirm, and no
  statement of what freezing actually stops.
- **Dispute a fill** — instant, permanent, one tap.
- **Sign out** — inert (see 3.1), but would presumably be instant too.

### 2.6 Nothing to *do* about expiring litres

The Wallet warns "12.0 L expires in 6 days" and offers no action. There is no "use it
first", no "convert it back", no reminder. The app raises the alarm and then shrugs.

### 2.7 Alerts are settings, not alerts

The three toggles write to the store. No notification is ever scheduled or delivered —
`expo-notifications` is not installed. The "Alert me when 95 moves by ≥ 10c" row is static
text, not a control.

### 2.8 History cannot be searched, ranged, or exported

Filter chips only. On a year of real data — twelve month-groups and a hundred-odd entries —
there is no search, no date range, and no way to get the data out. There is also no way to
open a **top-up's** detail; only fills navigate.

### 2.9 "Works at any fuel station" is unverifiable in-app

The Stations tab was removed and the claim moved to a line of copy. A user has no way to
check whether the station in front of them is covered.

---

## 3. UI — inert controls and unbuilt surfaces

### 3.1 Controls that look real and do nothing

Verified by audit — every one of these renders as a fully-styled, tappable control:

| Where | Control |
|---|---|
| Card | `ADD TO APPLE WALLET` |
| Card | `ADD TO GOOGLE PAY` |
| Settings | `SIGN OUT` |
| Settings | `Payment methods · FNB ••4127` |
| Settings | `Linked vehicle · CA 418 921` |
| Settings | `Fuel grade · Petrol 95` |
| Settings | `Help & FICA documents →` (the arrow actively promises navigation) |
| Price alert | `Alert me when 95 moves by ≥ 10c` |

Two of these — the wallet-pass buttons — are the entire mechanism by which the product is
supposed to be *used*.

*Needs, at minimum for a demo:* a "not in this prototype" affordance, so a viewer is not
silently misled.

### 3.2 No loading or skeleton states

`app/_layout.tsx` returns `null` until fonts load, so cold start is a blank screen of
indeterminate length. There is no skeleton pattern anywhere, which will matter the moment
any of this data comes from a network.

### 3.3 Accessibility is partial

Labels and grouped nodes are done well on the hero figures. Not done:

- no Dynamic Type / font-scaling support — every size is a fixed number, so the layout
  breaks at large accessibility text sizes;
- no `prefers-reduced-motion` handling for the readout roll or the banner;
- the charts are unreadable to a screen reader — `LineChart` has no accessible summary at
  all, and a shape with two paths announces as nothing;
- no focus management after navigation.

### 3.4 One screen size

Everything is laid out for a ~390pt-wide phone in portrait. No landscape, no tablet, no
small-phone check (the Card screen was already clipping at 830pt of content before
`Screen` was made scrollable).

### 3.5 The Timeline has no date axis

It draws each lot's runway proportionally but there are no month ticks underneath, so the
bars communicate *relative* length without absolute dates — the dates are only in the text
label. The design called for an axis.

### 3.6 No pull-to-refresh, and no way to force a re-read

Harmless while everything is local; the first thing missed when it is not.

---

## 4. Testing and tooling gaps

- **No screen-level tests.** 260 tests cover `src/lib`, `src/data`, the store, and the
  components in isolation. **Not one test renders a screen.** The `preserveAspectRatio` bug
  that bunched both chart lines into the middle third of the panel passed every test and was
  caught only by looking at the running app.
- **No visual regression testing**, so the same class of bug will recur.
- **No linter.** No ESLint config, so rules like "no unused imports" are enforced only by
  `tsc` and attention.
- **No CI.** Nothing runs `npm test` or `tsc --noEmit` automatically.
- **No a11y assertions** in any test.

---

## 5. If you only do five things

1. **Build the expiry conversion** (1.1). The app makes a promise it does not keep, and it
   is the promise most likely to be examined.
2. **Add persistence** (1.2). Everything else is judged through a demo that resets.
3. **Give Top up a confirm and a receipt** (2.1). It moves money and behaves like a toggle.
4. **Handle the zero state on Wallet, Savings and Card** (2.3). Every new user starts there.
5. **Neutralise or label the inert controls** (3.1). Four of them sit on the two screens you
   would demo first.

---

## What is deliberately *not* here

These are scoped out, not overlooked:

- A stations map or list — removed by an explicit nav decision.
- Real payments, card issuing, KYC — gated on a legal opinion.
- Anything that unpins the clock — see 1.3; it is a product decision, not a task.
