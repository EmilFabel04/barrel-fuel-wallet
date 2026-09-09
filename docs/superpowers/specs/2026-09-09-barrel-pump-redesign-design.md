# Barrel — Pump redesign and feature round

**Status:** design approved, not yet implemented
**Supersedes:** the design-system sections (§3, §6) of `2026-09-06-barrel-fuel-wallet-design.md`.
Everything else in that spec — the data model, the guardrails, the product rules — still binds.

---

## 1. What this is

A full visual re-approach of the Barrel prototype, plus four features and one screen that
does not exist yet. The model underneath (`src/lib`, `src/data`) keeps its shape; it gains
pure functions and one re-cut seed.

Three things the user asked for by name:

1. **Fill history** — fills are currently buried in the Balance screen's mixed ledger.
2. **A better savings-over-time display** — six bars are not the product's argument.
3. **The `CARD` button next to `TOP UP`** — it doesn't fit, and it is redundant: Card is
   already tab 2.

Four features chosen on top of those:

4. **The price-rise moment** — `nextPriceChange` already knows the pump goes to R21.99 on
   7 Oct. Today that is one grey line of text.
5. **Live fill arrival (simulated)** — a card-rail fill landing while the app is open.
6. **Lot expiry timeline** — litres drawn on their 90-day runways.
7. **Burn rate and top-up sizing** — derived from the ledger.

### Still a prototype

No backend, no payments, no persistence. Anyone shown this must be told so. Nothing here
changes that.

---

## 2. Design direction: Pump

The product sells fuel, and the language commits to it. The reference is a **pump readout
and the instrument panel around it**, not a fintech dashboard: monospaced numerals, amber
on near-black, bordered panels, tick scales, tight corners.

This was chosen over an editorial/statement direction and a soft-material fintech direction.
The reason it wins is that it is *earned* — the seeds are already in the app (the amber
accent, the barrel mark, the grey strata under the card pass) — and no other South African
fintech looks like it.

**What does not change:** the engineering discipline. Hex lives in exactly one file. Fill
colours and text colours stay separate values. Screens never branch on the theme. Every
figure is derived, never a literal.

### Colour semantics

| | |
|---|---|
| **Amber** | fuel and price — the thing you are buying |
| **Lime** | savings — the thing you are gaining |
| **Off-white / ink** | neutral fact |

Direction is carried by glyphs (▲ ▼) and copy, never by a third colour. Spec §3.1's "two
accents carry all meaning" survives intact.

---

## 3. Tokens

`src/theme/tokens.ts` remains the only file containing hex. Every value below was measured,
not chosen by eye. Contrast is against that theme's own `bg`.

### 3.1 Dark

| token | value | contrast | notes |
|---|---|---|---|
| `bg` | `#0A0908` | — | warm near-black |
| `bgRaised` | `#0E0D0C` | — | panel fill |
| `surface` | `#1C1917` | — | disabled fills |
| `border` | `#2E2A26` | — | panel outlines |
| `hairline` | `#1C1917` | — | separators |
| `text` | `#F5F1EA` | 17.7:1 | warm off-white |
| `textDim` | `#A79E93` | 7.6:1 | |
| `textMuted` | `#857E74` | 5.0:1 | |
| `inverse` | `#0A0908` | — | on accent fills |
| `accent` | `#FF7A1A` | 7.6:1 | fill **and** text in dark |
| `accentText` | `#FF7A1A` | 7.6:1 | same value; the split only bites in light |
| `positive` | `#D6E84A` | 14.7:1 | |
| `positiveText` | `#D6E84A` | 14.7:1 | |
| `heroInk` | `#FF7A1A` | 7.6:1 | numeric heroes |

### 3.2 Light

Light mode is **bright**. The app is opened outdoors at a pump, where glare adds a flat
white veil that lifts blacks and crushes mid-luminance colour. Glare can only add light, so
the brighter the ground, the more of the contrast range survives it. Pure white at full
panel output beats an off-white at ~82%.

The warm character lives in the greys, not the ground.

| token | value | contrast | notes |
|---|---|---|---|
| `bg` | `#FFFFFF` | — | maximum panel output |
| `bgRaised` | `#FFFFFF` | — | |
| `surface` | `#F7F5F0` | — | panel fill |
| `border` | `#948A78` | 3.4:1 | meets the non-text UI minimum |
| `hairline` | `#DCD6C9` | — | decorative separators only |
| `text` | `#000000` | 21:1 | |
| `textDim` | `#3A342D` | 12.3:1 | |
| `textMuted` | `#5C554C` | 7.4:1 | |
| `inverse` | `#FFFFFF` | — | |
| `accent` | `#FF6A00` | fill only | 7.3:1 against black set on it |
| `accentText` | `#9A3200` | 7.4:1 | small deltas, ▲ glyphs |
| `positive` | `#7A9000` | 3.6:1 | chart bars, toggle track |
| `positiveText` | `#3F5406` | 8.5:1 | |
| `heroInk` | `#0A0908` | 19.9:1 | numeric heroes |

Every light-mode **text** token clears **7:1 — WCAG AAA**, not the 4.5:1 AA floor. Under
glare, AA is not enough.

### 3.3 Four rulings this changes

**(a) The `#A8A8A8` debt is paid.** HANDOVER records `textDim #A8A8A8` at 2.38:1 on white as
accepted debt. It is replaced.

**(b) Amber gains a text twin.** `#FF7A1A` on white is 2.8:1 — unreadable. In light mode
amber therefore stops being a text colour and becomes a **fill with black on it**: the
+12c badge, the gauge, the meter, the primary button — 7.3:1 with black on it. Road-sign logic. `accentText` exists
for the small deltas where a filled block would be absurd. This is exactly the pattern
`positive`/`positiveText` already established; there are now two such pairs.

**(c) `positive` in light mode changes value, contradicting a prior ruling.** The existing
ruling keeps `LIGHT.positive` at `#C6F24E` on the reasoning that a fill's contrast is
"against neighbouring fills rather than through the colour to a background." At 1.3:1
against white that is too generous — a lime bar on a white chart ground is genuinely hard to
locate. `LIGHT.positive` becomes `#7A9000` (3.6:1). `DARK.positive` is unchanged.

**(d) `heroInk` is a new token.** A hero cannot be amber on white and stay legible. Rather
than branch in a screen, the hero's colour becomes its own token, resolved per theme.

### 3.4 One exception deleted

`app/(tabs)/index.tsx` currently inverts the price-watch block to a black card in light mode
— the one place the theme is not a mechanical token swap. Under Pump it is a bordered panel
in both themes. **`useIsLight()`, the `DARK.*` pins, and the conditional style object all
come out.** If nothing else needs `useIsLight`, remove the hook.

### 3.5 Elevation

Unchanged in principle: `LIGHT_ELEVATION` real, `DARK_ELEVATION` none. Pump is a flatter
language than the current one, so elevation is used only on the card pass. Panels are
defined by their border and fill, never a shadow.

### 3.6 Radii

Instruments have tight corners.

| | now | Pump |
|---|---|---|
| `xs` | 4 | **2** — meters, bars |
| `sm` | 10 | **4** — chips, small boxes |
| `md` | 14 | **6** — buttons, panels |
| `lg` | 18 | **10** — card pass |
| `pill` | 999 | 999 |

### 3.7 Filled buttons in light mode

Neither `#FF7A1A` nor `#FF6A00` reaches 3:1 against white, so a filled amber button's *edge*
is undefined in light mode. Light-mode filled buttons take a 1px `text`-coloured border.
Deliberate in this language, and it satisfies the requirement.

---

## 4. Typography

Two families, one job each.

**Numerals — JetBrains Mono** (`@expo-google-fonts/jetbrains-mono`), weights 400/500/700/800.
A pump readout is monospaced. Because it is monospaced by construction, digits **cannot**
change width, so the `fontVariant: ['tabular-nums']` dependency disappears — the exact
fragility that disqualified DM Sans stops constraining future font choices.

**Prose and labels — Figtree**, unchanged, weights 400–800.

`SectionLabel` moves off system Menlo onto JetBrains Mono, so there is one mono rather than
two. **This makes it a custom family**, which means the existing rule applies to it for the
first time: weight must select a family name, never `fontWeight`. This is a trap — the
current file is correct *because* Menlo is a system font.

Both families keep the rule: each weight is a separate family, `fontWeight` is never set
against them.

---

## 5. Motion

`src/theme/motion.ts` keeps every current value and adds two:

| | | |
|---|---|---|
| `readout` | 420ms | odometer roll when a numeric hero changes value |
| `banner` | 260ms | the live-fill banner's drop-in |

Both animate `transform`/`opacity` only, so both stay on the native driver. Nothing bounces
or overshoots; motion confirms, it does not perform.

---

## 6. Components

### 6.1 New

| component | purpose |
|---|---|
| `Readout` | mono numeral hero. Wraps the `Num` role, selects family by weight, optionally rolls on change (`MOTION.readout`). |
| `Panel` | bordered instrument block: optional label header, `border` outline, `bgRaised`/`surface` fill. |
| `SegmentGauge` | the balance split by expiry — one segment per lot, width proportional to litres, amber for anything inside 30 days. Tappable. |
| `LineChart` | two series with the gap between them shaded. Used by Savings for pump-vs-your-price. |
| `BarChart` | monthly bars, extracted from `savings.tsx` where it is currently inline. |
| `Timeline` | lot bands on a dated axis, for Your litres. |
| `Chip` | filter chip, selected/unselected, for History. |
| `Banner` | the live-fill notification. |

### 6.2 Kept, restyled

`Screen`, `ScreenHeader`, `Rule`, `Row`, `SectionLabel`, `Toggle`, `Keypad`, `BarrelMark`,
`TabIcon`, `Button`.

`Num` is superseded by `Readout`. Migrate every call site, then delete `Num` — leaving both
would create two definitions of "a number on screen," which the codebase's own rule forbids.

### 6.3 Chart rules

Charts are drawn with `react-native-svg` (already a transitive Expo dependency; add it
explicitly). No charting library — spec §12's animation restriction reflects a preference for
few dependencies, and these four chart shapes are simple enough to own.

Every chart: no gridlines, axis labels in `textMuted` at the mono's smallest size, series
distinguished by colour **and** by a legend, never colour alone.

---

## 7. Information architecture

Tabs stay at **four**: Wallet, Card, Savings, Settings. The §5 nav decision is not reopened.

| route | change |
|---|---|
| `app/(tabs)/index.tsx` | Wallet — reworked |
| `app/(tabs)/card.tsx` | reskin; debug control moves |
| `app/(tabs)/savings.tsx` | reworked |
| `app/(tabs)/settings.tsx` | reskin; gains the demo trigger |
| `app/balance.tsx` → `app/litres.tsx` | **"Your litres"** — the ledger comes off entirely |
| `app/history.tsx` | **new** |
| `app/fill/[id].tsx` | reskin; the saving is surfaced |
| `app/top-up.tsx` | reskin; suggested amount from burn rate |
| `app/alerts.tsx` | reskin; the price rise leads |
| `app/subscribe.tsx` | reskin |

**The split that makes both features work:** Your litres owns what you *have* — the hero, the
gauge, the expiry timeline, the locked-in value. History owns what *happened* — every ledger
entry, filterable, with per-fill savings. Neither renders the other's content.

---

## 8. Screens

### 8.1 Wallet

- Header: mark, wordmark, TM square.
- Hero: `Readout` at 56, `heroInk`. Balance in litres, unit beside it.
- **`SegmentGauge`** beneath it — the balance split by expiry. Tappable → Your litres.
- Two sub-lines: rand value at today's price; burn rate ("you use ~N L a month") and, when
  any lot is inside 30 days, "N L expires in D days" in `accentText`.
- **Price panel** (`Panel`) — the feature that did not exist:
  - current price, month-on-month delta,
  - the rise: date, cents, days remaining, and a countdown meter across the interval,
  - one line of copy stating what topping up today locks in.
  - Tappable → Alerts.
- Savings sparkline: six months, label, realised total in `positiveText`.
- Footer: last fill row (tappable → that fill's detail), then **`TOP UP` plus a contextual
  second button**.

**The contextual button.** `HISTORY` normally; `BEAT +Nc` inside the window before a price
rise, routing to Top up. The window is 14 days, derived from `nextPriceChange`, never a
literal. When `nextPriceChange` returns undefined the button is always `HISTORY` — the
Wallet must render correctly past the end of the price table.

### 8.2 Your litres (was Balance)

- Hero + `SegmentGauge`, matching the Wallet so the tap feels continuous.
- **`Timeline`** — every lot as a band on a dated axis running from today to the furthest
  expiry. Each band labelled with its purchase date, price paid, and litres. Bands inside
  30 days take amber.
- **Locked-in panel** — what the balance cost versus what it is worth at today's pump, and
  what it becomes at the next scheduled price. Both derived.
- The "never expire to zero" line stays. It is the reassurance that makes the timeline
  legible rather than threatening.
- Footer: `TOP UP`, full width.

### 8.3 History (new)

- `Chip` row: All / Fills / Top-ups.
- Summary `Panel`: litres filled and rand saved **across the currently filtered set**, so the
  figures move with the chips rather than quoting a fixed window.
- Entries grouped by month, newest first, each group headed with its month and entry count.
- **Fill rows carry a saved badge** — amber when the fill beat the pump, neutral grey at
  zero. This is the screen's reason to exist: it is the running proof the product works.
- Top-up rows carry their own 90-day expiry, derived from the entry's own date. A row must
  never look up its lot — fully-consumed lots are deleted from the array.
- Fill rows navigate to `fill/[id]`. Top-up and bonus rows do not, and must not respond to
  press.
- Disputed fills keep the accent left-border.

### 8.4 Savings

- Hero: **realised** savings, `positiveText`, with litres bought below pump beneath it.
- **`LineChart` — pump price versus your weighted buy price, by month, gap shaded.** This is
  the product's whole thesis as one image.
- **Candour panel.** The chart shows the edge narrowing; the panel says so, names the
  figures, and points at the mechanism that reopens it. A savings screen that only goes up
  reads as marketing. This one reads as an instrument, and it creates the reason to act on
  the next price rise.
- Monthly `BarChart`, retained and restyled.
- Footer: average buy price, pump price today, and the explanatory line.

**Copy constraint.** The 90-day window caps how much price advantage anyone can hold — about
R20 on a 42 L balance. The product sells **price certainty, not accumulated profit**, and no
copy on this screen may imply the savings compound.

### 8.5 Card

Pump reskin. The pass itself is **unchanged in character** — it depicts a physical Apple/
Google Wallet pass, so it stays white and keeps the theme-invariant `PASS` group. Only its
radius moves, to `RADIUS.lg`.

`SIMULATE A FILL` and its debug caption come off this screen; see §10.

### 8.6 Top up

Reskin, plus: the default amount comes from **`suggestedTopUp`** rather than the hardcoded
`'1500'`, and a line names the reasoning ("about a month at your usage"). The cap meter, the
lapsed-subscription branch, and the guard on exceeding the cap are unchanged.

### 8.7 Alerts, Settings, Subscribe, Fill detail

Reskin only, except:

- **Alerts** leads with the price rise — date, cents, countdown — rather than listing it.
- **Settings** gains the demo trigger (§10) and its appearance row keeps the
  dark → light → system cycle.
- **Fill detail** surfaces the saving for that fill as a first-class figure. Everything else
  — the division worked out longhand, the lots consumed, the dispute action — stays.

---

## 9. New pure functions

All in `src/lib`, all React-free, all taking an explicit `at: Date`. **None may call
`now()`.** Each gets tests.

| function | returns |
|---|---|
| `burnRate(ledger, at)` | litres per month, from fills over the ledger's span |
| `suggestedTopUp(ledger, at, price)` | a rand amount covering roughly one month of burn |
| `lotBands(lots, at)` | lots sorted by expiry with `daysLeft` and `share`, for the gauge and timeline |
| `lockedInValue(lots, at, price)` | `{ cost, value, ahead }` for the current balance |
| `pumpVsBuyByMonth(ledger, at)` | per month: litres, weighted buy price, weighted pump price |
| `priceRise(zone, at)` | wraps `nextPriceChange` into `{ effectiveFrom, deltaCents, daysUntil, progress }` |

`monthlySavings` stays as-is. `pumpVsBuyByMonth` is a sibling, not a replacement — they
answer different questions and share the month-window logic, which should be extracted so
there is one definition of "the last six months ending at `at`."

---

## 10. Simulated live behaviour

**The clock stays pinned.** `DEMO_NOW` is 30 September 2026 and does not move. HANDOVER is
right that a real clock guts the app: the price table silently returns October's price
forever after 7 Oct, the cap meter reads zero from 1 Oct, and the last lot expires the
balance to zero on 27 Dec. "Live" here means *scripted against the pinned instant*, never
`setClock(() => new Date())`.

**The behaviour:** a card-rail fill arrives while the app is open.

1. A `Banner` drops in from the top (`MOTION.banner`) naming the station and the litres.
2. The balance `Readout` rolls down to its new value (`MOTION.readout`).
3. The `SegmentGauge` re-renders as FIFO consumes the oldest lot.
4. Tapping the banner routes to that fill's detail.

**Implementation.** The scheduler is a hook (`useLiveFill`) or a store action — never
`src/lib`, which must stay pure and free of timers. It calls the existing `cardFill` action,
so it exercises `normaliseDescriptor`, `resolveZone`, `deriveLitres`, FIFO consumption, the
ledger write and the cap check exactly as a real fill would. Nothing is faked below the
store.

**Trigger.** A clearly-labelled control in Settings under a `Demo — prototype only` section,
replacing the `SIMULATE A FILL` button on the Card screen. It leaves the Card screen clean
and puts every prototype-only control in one place.

---

## 11. The seed, re-cut

The current seed drains lots FIFO until **one** survives. That starves two of the four
chosen features: a timeline of one band is not a timeline, and locked-in value comes to
R0.00 because the surviving lot was bought at exactly today's price.

`buildSeed()` is re-cut so the wallet is **laddered**. The change that does it is a single
large top-up on **8 July 2026 — R984, 46.0 L at R21.40** — someone buying ahead of an
expected rise. That is the product's own mechanic, visible in its own data.

### Verified resulting state

| | current | re-cut |
|---|---|---|
| Balance | 42.6 L | **42.6 L** (preserved) |
| Surviving lots | 1 | **5** |
| Ladder | 42.6 @ R21.87 | 12.0 @ R21.40 · 10.0 @ R21.60 · 2.0 + 8.0 + 10.6 @ R21.87 |
| Expiring within 30 days | 0.0 L | **12.0 L, in 6 days** (expires 6 Oct) |
| Locked in vs pump | R0.00 | **R8.34**; R13.45 after 7 Oct |
| Savings to date | R71.65 | **R76.19** |
| Litres below pump | 118.4 L | 92.7 L |
| Average buy price | R21.21/L | **R20.72/L** |
| Monthly bars | 9.00 · 18.00 · 16.80 · 12.00 · 4.41 · 11.44 | 9.00 · 18.00 · 16.80 · 12.00 · 4.41 · **15.98** |
| Edge per litre by month | 0.90 · 1.80 · 1.40 · 1.00 · 0.30 · 0.12 | 0.90 · 1.80 · 1.40 · 1.00 · 0.30 · **0.47** |
| September top-ups | 105.2 L | **18.6 L** |
| Burn rate | 26.4 L/month | 15.7 L/month |

May remains the tallest bar. Every fill still consumes within its 90-day window.

**Two regressions, accepted:**

- **The monthly cap meter reads 18.6 / 500 L** rather than 105.2 / 500. It demos less
  dramatically. This is structural: bigger September top-ups would survive as large
  September lots, because FIFO cannot reach them past the July lot, which would push the
  balance to roughly 130 L — about three tanks. A one-tank balance is the truer product
  shape, so realism wins.
- **Burn rate falls to 15.7 L/month**, which is low for a real driver. It is the seed's
  fiction either way; tune the fill sizes during implementation if a higher figure reads
  better, keeping the ladder intact.

### Tests that must be re-pinned

`src/data/__tests__/seed.test.ts`, `src/lib/__tests__/savings.test.ts`, and the Wallet/Card/
Balance figures HANDOVER lists. The tests exist to pin the seed; re-pinning them is the
expected work, not damage. **Every figure in the table above must be asserted**, including
the five-lot ladder and the 12.0 L expiry — those are the properties the features depend on,
and nothing else stops a future edit from quietly collapsing the wallet back to one lot.

---

## 12. Testing

- **The 183 existing tests stay green**, except those pinned to seed figures, which are
  re-pinned per §11.
- Every new function in §9 gets tests, including the boundaries: no fills yet, a single
  month, `nextPriceChange` returning undefined, and a zero balance.
- **`tokens.test.ts` gains a contrast assertion.** It computes the WCAG ratio for every text
  token against its own theme's `bg` and asserts the value claimed in §3 — AAA (≥7:1) for
  light-mode text, ≥4.5:1 for dark. The palette then enforces itself, which matters because
  a whole design decision rests on those numbers.
- The `grep` invariant still holds: hex appears only in `tokens.ts` and its test.
- `npx tsc --noEmit` clean.

---

## 13. Documentation

`docs/HANDOVER.md` and `docs/DECISIONS.md` are both stale the moment this lands. Updating
them is part of the work, not follow-up:

- HANDOVER's seeded-state table, its "exactly one surviving lot" line, its
  "Balance expiry split reads 0.0 L / 42.6 L" note, and rule 3's `tnum` warning.
- HANDOVER's open product decision #1 — **it is answered and the answer is no.** "Locked in
  below today's price" cannot be the Savings headline; it is worth R8.34, not R2,590. It
  earns its place as a forward-looking line on Your litres instead.
- DECISIONS gains rulings for §3.3(a)–(d), the seed re-cut, and the pinned-clock decision
  in §10.

---

## 14. Out of scope

Persistence, onboarding, a map, real push, billing, a fifth tab, and any change to the tab
set. The `store.setSubscription('lapsed')` gap stays a known gap. No change to the 90-day
window, either cap, or the FIFO rule.

---

## 15. Risks

| risk | mitigation |
|---|---|
| The re-skin touches all 11 screens at once | Tokens, primitives and pure functions land first, with tests, before any screen moves. Screens then become mechanical. |
| Migrating `Num` → `Readout` across every screen | Do it as one pass and delete `Num` in the same commit. Two definitions of "a number on screen" is the failure mode. |
| `SectionLabel` moving to a custom family | It is the first time the "never set `fontWeight`" rule applies to this component. Call it out in review. |
| Re-pinning seed tests hides a real regression | Re-pin against the §11 table, which was computed from the model itself, not transcribed. |
| Light mode judged on a desktop monitor | The whole point is outdoor legibility. Check it on a phone, outside, before signing off. |
