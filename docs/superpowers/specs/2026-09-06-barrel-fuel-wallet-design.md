# Barrel Fuel Wallet — Mobile Frontend Design

**Date:** 2026-09-06
**Status:** Revised twice — v1 is a station-agnostic, **unleaded-only** card product
**Scope:** Frontend UI shell with mock data. No backend, no real payments, no station integration.

---

## 1. Context

Barrel is a concept for a South African fuel wallet: motorists pre-purchase petrol at
today's price into a wallet **denominated in litres, not rand**, then spend those litres
at any filling station using a prepaid card. The business rationale, revenue model, and
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

**v1 is petrol 95 only.** Diesel is excluded deliberately, not deferred for capacity.
Petrol's retail price is fixed by regulation at one number per pricing zone, so Barrel
knows exactly what a litre costs at every station in the country without a single
agreement. Diesel's retail price is set freely by each station, so the same card would
expose Barrel to whatever a premium highway station chooses to charge.

This is the fact the whole station-agnostic strategy rests on, and it is worth stating
plainly: **Barrel does not need partner price agreements in v1 because the government
already sets the price.** Regulation is doing the work that contracts would otherwise
have to. It is also why the litre conversion can be exact rather than estimated (§7.3).

Three further consequences shape v1, and one of them inverts an assumption:

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
   figure is always derived. For regulated petrol the derivation is exact, but the UI
   still shows its arithmetic openly (§8.4).
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
- Accessibility audit beyond baseline (see §10.1).
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
| `positive` | `#C6F24E` | Fill colour: chart bars, active-toggle track |

The design exposes accent alternates (`#E08A1E`, `#B8461A`, `#FF4D1F`) and positive
alternates (`#8CE563`, `#E8E8E8`, `#5AD1FF`) as canvas props. These are recorded as
constants but not exposed in the app.

**Amendment — `positiveText`.** `#C6F24E` measures 1.30:1 against `LIGHT.bg`
(`#FFFFFF`), which is invisible, not merely low-contrast: on white it fails as text for
the Savings hero, the §8.4 equation's answer, ledger credit deltas and the Subscribe
bullets — all sites that render it *as* text or a glyph rather than *as* a fill behind
other content. `positive` cannot simply be darkened, because the same value is also the
fill colour for chart bars and the Toggle's active track, where it reads fine against
`border`/`surface` neighbours and where the design's canvas value should be preserved
exactly.

The fix is a second token, text-only:

| Token | Dark | Light | Use |
|---|---|---|---|
| `positiveText` | `#C6F24E` | `#5A7A0A` | Text and glyphs only: savings hero, the §8.4 equation's answer, ledger credits, Subscribe bullets |

`positiveText` is identical to `positive` in dark mode (no change there) and 4.97:1 on
white in light mode, passing WCAG AA while staying recognisably the same hue. `positive`
itself is unchanged in both themes and remains fill-only — bar fills and the Toggle
track keep using it, never `positiveText`.

The Toggle's knob has the same defect one level deeper: it uses `inverse`
("text on accent/white fills"), which is `#FFFFFF` in light mode — 1.30:1 against the
lime track for the same reason. A knob is a fill sitting on a fill, not text, so it gets
neither `positive` nor `positiveText`; it is pinned to `DARK.bg` (`#000000`) in both
themes, since a dark knob reads correctly against the lime track regardless of theme.

### 3.2 Typography

**Amended — Figtree replaces Outfit.** The build shipped **Outfit**; the project owner
asked for something smoother and more elegant, "like Google Sans". Google Sans is Google's
proprietary brand typeface — not on Google Fonts and not licensable in a third-party
product — so this is a closest-open-equivalent choice.

**Figtree** (Google Fonts), weights 400-800, via `@expo-google-fonts/figtree`. Monospace
labels use the platform UI monospace stack, unchanged.

DM Sans was the first choice and was rejected on measurement, which is worth recording
because the failure would have been silent. **DM Sans ships no `tnum` OpenType feature**,
so the `fontVariant: ['tabular-nums']` this design depends on would have become a no-op
that React Native ignores without erroring. Its digits are also the least uniform of the
candidates — the `1` is 52% the width of the `0` — which at the Wallet's 92px hero is a
~34px horizontal shift every time a digit changes width, and worst of all on the Top up
keypad where the value moves under the user's finger on every press. Figtree has `tnum`,
is the closest surviving match in character, and its rounder letterforms suit §3.3's
rounded geometry. **Verify `tnum` before ever swapping this family again.**

The swap was otherwise 1:1: Figtree ships the same five weights under the same naming, so
§3.2's roles and the `<Num>` weight-to-family map carry across unchanged.

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

**Amended — the system is rounded and softened.** It was previously square everywhere
with a single 3px radius on buttons, and shadows were banned outright. Both rules are
replaced at the project owner's direction.

Radii come from one scale in `tokens.ts`, so surfaces round together rather than each
screen picking a number:

| Token | Value | Applied to |
|---|---|---|
| `xs` | 4 | savings bars (top corners only), the cap-meter fill |
| `sm` | 10 | small boxes: avatar squares, the grade selector |
| `md` | 14 | buttons, the keypad's outer bounds, bordered cards |
| `lg` | 18 | the card pass, the inverted price-watch block |
| `pill` | 999 | the Toggle track and knob |

**Shadows are now permitted, but only in light mode.** This is the load-bearing half of
the rule. A shadow is a dark blur and `DARK.bg` is `#000000`, so in dark mode a shadow is
not subtle — it is invisible. Shipping one anyway would repeat Ruling C1's defect in
mirror image: a treatment that looks right in whichever theme you happen to be viewing and
does nothing in the other.

Dark mode does not need the affordance. Every surface that takes elevation is one that
would otherwise be white-on-white or near-groundless in light mode — the card pass, the
inverted price-watch block, the alert cards — and in dark mode each is already separated
from the ground by luminance. Elevation is therefore served by `useElevation('low' |
'high')`, which resolves to a real shadow in light and a zeroed style in dark. Callers
spread it unconditionally and never branch on the theme themselves. A test pins the dark
set to zero opacity, because this failure is silent.

**Consequence: Ruling C1113-c is withdrawn.** It had escalated the card pass's border to
the heavy `PASS.strataA` purely because a white card on a white ground had no other way to
show an edge and shadows were banned. A light-mode shadow does that properly, so the
border relaxes back to `PASS.hairline`.

- Borders: **1px**, never thicker.
- **No gradients, no blur** anywhere in the system.
- Screen horizontal padding: **26px**. Alert screen and keypad use 20px and 18px.
- Primary button height: **58px**. Secondary CTA in cards: **54px**.
- Grade tab height: **50px**. Keypad key height: **62px**.

### 3.4 Brand mark

**Amended — the official mark supersedes the canvas placeholder.** The design canvas
used a 24x24 SVG of a filled square with a droplet knocked out (`fill-rule="evenodd"`).
The official artwork (`Barrel_Logo.svg`) is a different silhouette: a standalone droplet,
solid, with a white crescent highlight in its lower right, on a 1500x1500 canvas.

**The crescent does not ship in the UI.** It is 3.9% of the mark's area and stops
resolving below roughly 20px — measured at true size it reads at 30px, is marginal at
17px, and is gone by 14px. The app draws the mark only at 17px (Wallet header, Card
pass) and 14px (Alerts lock-screen mock), so the highlight would never render on any
screen. It would also cost a second colour: the crescent is a literal `#FFFFFF`, so
against a `t.text`-tinted droplet it disappears entirely in dark mode, and preserving it
needs a knockout mask plus a second colour prop — spending a rendering dependency and an
API change on a detail no screen can show.

`BarrelMark` therefore carries the droplet outline alone: one path, taken verbatim from
the source file so it can be diffed against the artwork, on a `297 0 948 1500` viewBox
trimmed to the droplet's exact bounds. The mark is taller than wide (ratio 0.632), so
`size` sets its height and the width follows from the artwork. A single `color` prop
tints it, defaulting to `t.text` — so §3.1's no-raw-hex rule and the `PASS` group's
theme-invariance (Ruling C1) both hold unchanged.

**The full two-tone artwork is used for the app icon set**, where it renders at 1024px
and the crescent reads properly: `icon.png` (1024, opaque white ground),
`splash-icon.png` (1024, transparent), the Android adaptive `foreground`/`background`
pair (512, foreground sized to the 66% safe zone), and `favicon.png` (48). The Android
`monochrome` icon and the favicon use the flat droplet — monochrome cannot express two
tones, and 48px is below the crescent's resolving size. `adaptiveIcon.backgroundColor`
moves from the Expo template's `#E6F4FE` to `#FFFFFF`.

---

## 4. Screen Inventory

Nine designed artboards plus three new screens.

| # | Screen | Route | Source |
|---|---|---|---|
| 01 | Wallet | `(tabs)/index` | Artboard 01 (dark) + 05 (light) |
| 02 | Top up | `top-up` | Artboard 02 — has live logic |
| 03 | Barrel card | `card` | Artboard 03 |
| 04 | Price alerts | `alerts` | Artboard 04 |
| 07 | Savings | `(tabs)/savings` | Artboard 07 |
| 08 | Balance / ledger | `balance` | Artboard 08 |
| 09 | Settings | `(tabs)/settings` | Artboard 09 |
| — | Fill detail | `fill/[id]` | **New** |
| — | Subscribe | `subscribe` | **New** |

Artboard 05 is not a separate screen. It is artboard 01 rendered in the light theme, and
is satisfied by §6.

**Amended — the Stations screen is removed.** Artboard 06 shipped as a tab and has been
deleted at the project owner's direction: v1 partners with no stations, and the card runs
on Mastercard/Visa rails at any merchant's terminal. The screen's own rationale did not
survive its earlier edits either — §4.1 had already removed the per-station price column
(regulated petrol cannot vary inside a zone) and maps are a stated non-goal, which left a
static list of five hardcoded stations with no price, no map and no interaction.

Its one load-bearing element, the §9.5 zone-price statement, moves to the Wallet's
price-watch block, which already states the price and the next change. `src/data/stations.ts`
**stays**: it is not a partner list but the lookup behind `normaliseDescriptor` and
`resolveZone`, which is §11 instrumentation and the unit a phase-2 rebate would be priced
in.

### 4.1 Content preserved from the design

Mock content is copied exactly so the build is comparable to the canvas side by side.

- Price: Petrol 95 `R21.87/L` (+0.55%), Gauteng inland zone. The design's second
  ticker row, Diesel 0.05% `R20.14/L` (-0.19%), is **removed** — see §1.3.
- Opening balance: `42.6 L`, all petrol 95. The design's 31.2 / 11.4 grade split on the
  Balance screen is replaced by an expiry split (§9.4), which is the more useful cut in a
  single-grade product and serves the §8.1 guardrail.
- Holder: Thabo Makhubela, initials TM, `+27 82 441 0912`, card `•••• 4127`,
  vehicle `CA 418 921`, payment method `FNB ••4127`.
- Network: the design's `412 stations · 9 provinces` is **replaced**. A station-agnostic
  card has no network to count, and quoting one understates the product. The Stations
  screen leads with `Works at any fuel station in South Africa` and the list becomes a
  price-comparison and locator surface, not a coverage list.
- Five stations: Engen William Nicol (Bryanston, 24h, 1.2km), Sasol Rivonia (Rivonia,
  05:00-23:00, 2.8km), Shell Grayston (Sandton, 24h, 4.1km), Astron Energy Fourways
  (Fourways, 24h, 5.6km), Total Sunninghill (Sunninghill, 06:00-22:00, 6.3km).

  **The per-station price column is removed.** The design shows five stations within
  6km of each other at R21.84, R21.87, R21.89 and R21.91. Regulated petrol does not vary
  between stations inside a pricing zone — those five would all be R21.87. A varying price
  column is not just inaccurate, it teaches the user to shop on a number that cannot
  differ, and quietly contradicts the reason the card works everywhere. The zone price is
  stated once at the top of the screen instead (§9.5).
- Savings: the canvas's figures — `R1,284` since March, `58.7 L` below pump, `R21.24/L`
  average, and bars APR R128 / MAY R186 / JUN R104 / JUL R271 / AUG R221 / SEP R374 — are
  **not** preserved. They are arithmetically impossible; see §4.3. Every figure on that
  screen is computed from the seeded ledger.
- Ledger, five entries: Top up 95 (28 Sep, R1 500, +68.6 L, after 74.0 L); Fill Sasol
  Rivonia (24 Sep, -31.4 L); Top up (18 Sep, R800, at 95 rather than diesel, so +36.6 L
  not +39.7 L); Fill Engen William Nicol (11 Sep, -28.3 L); Referral bonus (04 Sep,
  Lerato M., +2.0 L). Pump numbers are dropped — a card transaction does not carry one
  (§7.3). `balanceAfter` values are computed, not copied (§4.2).
- Alert copy: "Petrol price rising 12c on the 2nd — top up now", R21.87 → R21.99/L,
  Threshold: alert when 95 moves by ≥ 10c. **`2.4 L saved` is not preserved** — it is
  wrong by roughly 5x against the two prices printed on the same screen. On R2 000,
  today's R21.87/L buys 91.4495 L; at R21.99/L it buys 90.9504 L; the gap is 0.5 L, not
  2.4 L. This screen's own hero and prose are computed from `priceOn`/`nextPriceChange`
  (§4.2's precedent — every figure here is derived, never a literal) rather than copied
  from the canvas.
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
balance *before* that top-up. No reordering of the design's own five entries reaches
42.6 L — the arithmetic is short by 26 litres.

**Resolution.** `balanceAfter` is always computed from the lot store, never hardcoded.
The hero balance of 42.6 L is fixed, because it appears on four screens against the
ledger's one. The seed is then built to terminate there. Converting the 18 Sep top-up
from diesel to petrol (R800 buys 36.6 L at R21.87, not 39.7 L at R20.14) and adding one
fill after the 28 Sep top-up — which is what a real user would do — makes it chain:

| Date | Entry | Delta | Balance |
|---|---|---|---|
| — | *opening* | | 33.1 |
| 04 Sep | Referral bonus · Lerato M. | +2.0 | 35.1 |
| 11 Sep | Fill · Engen William Nicol | −28.3 | 6.8 |
| 18 Sep | Top up · R800 | +36.6 | 43.4 |
| 24 Sep | Fill · Sasol Rivonia | −31.4 | 12.0 |
| 28 Sep | Top up · R1 500 | +68.6 | 80.6 |
| 30 Sep | Fill · Shell Grayston | −38.0 | **42.6** |

Every intermediate balance is positive, and the opening 33.1 L is carried by
pre-September lots that also feed the Savings screen (§4.3) and the expiry split (§9.4).

Two figures follow from this rather than being invented. September top-ups total
**105.2 L**. Against the original 150 L cap this filled the §8.2 meter to 70%, just below
the 80% accent threshold. The cap is now 500 L (§8.2), so the meter reads 21%; the figure
itself is unchanged because it follows from the ledger chain above. And app
"today" is **30 September 2026**, which the design already implies: artboard 04 warns of
a 2 October increase and says `TOP UP BEFORE 01 OCT`.

### 4.3 Seeding history for the Savings screen

The Savings screen's figures are **derived quantities** under §7.5, never literals.
Hardcoding them while computing every other number from the store would mean the screen
silently stops agreeing with itself after the first redemption.

**The design canvas's figures cannot be reproduced, because they are wrong.** The canvas
claims `R1,284` saved alongside `58.7 L` bought below pump price. Those are the same
quantity: 58.7 × R21.87 = R1,283.77. The canvas mislabelled the rand *value* of the litres
as the *saving* on them, and its six monthly bars sum to that same R1,284. For 58.7 litres
to have saved R1,284, every litre would have had to be free. Reproducing it would overstate
customer savings by roughly eighteen times, in a product whose central claim (§8.4) is
arithmetic the user can check.

A second constraint reduced the figure further. The seed originally held litres for up to
151 days, violating the 90-day redemption window §8.1 calls a product requirement. Once
every historical fill was made to draw only unexpired lots, less favourable price movement
could be captured, and savings fell accordingly. That is the honest consequence of the
product's own rules.

**The seeded state therefore produces:**

| Figure | Value |
|---|---|
| `savingsToDate` | R71.65 |
| `litresBelowPump` | 118.4 L |
| `averageBuyPrice` | R21.21/L |
| Pump price today | R21.87/L |

Monthly: APR R9.00 · MAY R18.00 · JUN R16.80 · JUL R12.00 · AUG R4.41 · SEP R11.44.
**May is the tallest bar, not September** — the chart scales to the largest month in the
data and gives `positive` to whichever that is, rather than assuming.

Historical lots are seeded already fully consumed, so they feed savings and the chart
without inflating the current balance, and every seeded fill draws only lots unexpired at
that fill's date. A test asserts the six monthly figures sum bit-for-bit to
`savingsToDate`, so the chart and the hero can never disagree.

**Open product question, not an engineering one.** At R71.65 the hero is a much smaller
number than the canvas implied, and the chart is flat. That is the truthful picture and it
must not be inflated. If the screen reads as underwhelming the answer is a different
headline metric — "R2,590 of fuel locked in below today's price" is both true and large —
not a bigger savings figure.

---

## 5. Navigation

A five-tab bottom bar, with **Card at the centre**. The card is the entire mechanic in
v1 — it is how the product is used at a forecourt, one-handed, often at night — so it
takes the centre position and the accent colour.

```
Wallet  ·  Card  ·  Savings  ·  Settings
```

**Amended — four tabs, not five.** Stations is removed (§4). Card was given the centre
position *and* the accent colour; four tabs have no centre, so the accent carries that
emphasis alone and Card sits second, grouping the two tabs the product is used with ahead
of the two it is reviewed with.

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
type Grade = '95';               // single-member union: diesel is v-next, not never
type Zone = 'inland' | 'coastal';// DMPR prices by zone, not nationally

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

### 7.3 Card fills — rand in, litres derived

A card transaction is the only way litres leave the wallet in v1.

The card rail gives an issuer the merchant descriptor, MCC, location, rand amount and
timestamp. It gives **no litres and no pump number**. Litres are therefore always
derived, never measured:

```ts
type CardFill = {
  merchantDescriptor: string;  // 'SHELL GRAYSTON SANDTON' — raw, messy
  stationId: string | null;    // resolved by normalisation, null when unmatched
  mcc: '5541' | '5542';
  randAmount: number;          // the only figure the rail actually gives us
  zone: Zone;                  // from station, else transaction location
  pricePerLitre: number;       // the regulated price for that zone and date
  litres: number;              // randAmount / pricePerLitre
  disputed: boolean;
};
```

**The derivation is exact, not estimated — and only because v1 is petrol-only.** Petrol's
retail price is set by regulation at one figure per zone per month, so `pricePerLitre` is
a known constant rather than a guess. Given the right zone and the right date, the litre
figure is arithmetically correct.

That removes two problems the previous revision had to carry, and they are worth naming
because their absence is what makes v1 tractable:

- **No grade inference.** With one grade there is nothing to infer, no ambiguity prompt,
  and no dependency on the linked vehicle's fuel type for correctness. A whole class of
  wrong-balance bug does not exist.
- **No station price dispersion.** Every station in a zone charges the same, so which
  station the driver picks cannot cost Barrel money.

Two residual failure modes remain, and they are the reason §8.4 still exists:

1. **Wrong zone.** Inland and coastal prices differ by roughly R0.60/L. A station near a
   zone boundary, or one resolved only from a coarse transaction location, can be
   assigned the wrong price. Bounded, but not rare.
2. **Wrong date.** Prices change at midnight on the first Wednesday of the month. A fill
   timestamped either side of that boundary — or settled a day after it was authorised —
   can be priced against the wrong month.

Both produce a visibly wrong litre balance, and the user has the receipt.

**The pricing service is load-bearing, not decorative.** In the original spec, CEF/DMPR
data powered price-timing nudges — a feature. Here it determines every litre deduction.
It must be keyed by zone *and* effective date, not by a single current national number.

### 7.4 Store

Zustand, in memory, seeded from `src/data/seed.ts` so the app opens on the designed state.

| Action | Behaviour |
|---|---|
| `topUp(grade, rand)` | Rejects if over the monthly cap (§8.2). Creates a lot at the current price, appends a `topup` entry. |
| `cardFill(descriptor, randAmount, at)` | Resolves station, zone and effective price, derives litres, consumes lots FIFO skipping expired, appends a `fill` entry with its `CardFill` record. |
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
- `cardfill.ts` — `deriveLitres`, `resolveZone`, `priceFor`, `normaliseDescriptor`
- `format.ts` — `litres`, `rand`, `randCompact`, `pricePerLitre`, `relativeDate`

The design's own formatter is ported exactly: fixed decimal places, then thousands
grouped with `\B(?=(\d{3})+(?!\d))`. Litres show 1 decimal, rand amounts 2, keypad
input 0.

---

## 8. Guardrails

The business overview (§3.2, §7) defines three controls, and a fourth — the weekly
redemption cap (§8.5) — was added by the project owner after the build as fraud
mitigation. None appear in the source design. Because the litre-voucher framing is what keeps Barrel outside FSCA/FAIS
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

### 8.2 Per-vehicle monthly top-up cap — 500 L

**Amended from 150 L.** This cap limits how much fuel may be *bought into* the wallet in
a calendar month. It is distinct from the §8.5 weekly redemption cap, which limits how
fast litres may be *spent back out*, and the two are named `MONTHLY_TOPUP_CAP_L` and
`WEEKLY_REDEMPTION_CAP_L` so neither can be reached in place of the other.

- The Top up screen carries a meter under the grade selector: `105.2 / 500 L this month`,
  a 2px hairline track filled in `text`, turning `accent` above 80%.
- Entering an amount that would breach the cap disables the confirm button, which changes
  its label to `MONTHLY CAP REACHED` and drops to `surface` with `textMuted` text.
- The cap is per linked vehicle. Settings shows `Linked vehicle · CA 418 921` as it
  already does; a `Monthly top-up cap · 500 L` row is added beneath it.

**Ruling C3 is withdrawn by this change.** It had lowered the Top up keypad's default
from the design's R1 500 to R500, because 150 L minus the seed's 105.2 L of September
top-ups left only 44.8 L (~R980) and R1 500 opened the screen already disabled. At 500 L
the headroom is 394.8 L (~R8 630), so the design's R1 500 is restored and the workaround
is gone.

**Known consequence.** §4.2 chose the seed's 105.2 L partly because it filled 70% of a
150 L cap — a better demo state than a near-empty meter. Against 500 L the meter now
reads 21%. The seed is not retuned to improve this: 105.2 L falls out of the §4.2 ledger
chain that terminates at 42.6 L, and reverse-engineering data to flatter a screen is the
error §4.3 exists to prevent.

### 8.3 No cash-out above purchase price

A single line of body copy beneath the Top up confirm button:
*"Litres you don't use convert back to the rand you paid. No cash-out above purchase price."*

### 8.4 Conversion transparency

Per §7.3, litres are derived from a rand amount and a regulated price. For petrol that
derivation is exact, which is a much stronger position than the previous revision had —
but it is exact *conditional on* the right zone and the right effective date, and both
can be wrong (§7.3, residual failure modes 1 and 2). A wrong zone is a ~R0.60/L error,
which on a R900 fill is roughly 1.2 litres. The driver has the receipt and will see it.

Showing the arithmetic costs a screen and buys the product's central claim:

- Every `fill` row in the ledger is tappable, opening `fill/[id]`.
- That screen shows the sum as an equation in the numeric treatment:
  `R873.60  ÷  R21.84/L  =  40.0 L`, with the price labelled by what determined it —
  `Gauteng inland · 95 · effective 03 Sep`. Naming the zone and the effective date is the
  point: those are the two things that can be wrong, so they are the two things shown.
- A `THIS DOESN'T MATCH MY RECEIPT` button in `border` style flags the entry. In the mock
  it sets `disputed` and shows a confirmation; no resolution flow is built.
- A disputed row carries a 2px `accent` left rule in the ledger.

The dispute affordance is the only place in v1 where a user can tell Barrel its own
pricing data is wrong. Zone misassignment is silent, systematic, and invisible from the
inside — it will only ever surface through a user with a receipt.

### 8.5 Weekly redemption cap — 110 L

A limit on how fast litres can be *spent*, as distinct from §8.2's limit on how much can
be bought. Its purpose is fraud mitigation: capping redemption rate blunts bulk-resale
and similar abuse. The number is a lever rather than a product promise — it is sized to
make abuse slow, not to shape ordinary use — so it may be retuned without redesigning
anything.

**The window rolls; it does not reset on a fixed weekday.** A calendar reset would let a
customer redeem the full cap on the last day of one week and the full cap again on the
first day of the next — double the limit within hours, which is precisely the pattern the
cap exists to stop. A trailing seven-day window has no such edge. `litresRedeemedSince`
counts `fill` entries only, over `(at − 7 days, at]`: a fill exactly one window old has
aged out, and a future-dated entry cannot consume cap that has not been reached.

**Naming hazard.** `REDEMPTION_CAP_WINDOW_DAYS` (7) is not `REDEMPTION_DAYS` (90) in
`lib/window.ts`. The latter is the price-lock life of a litre — how long a purchase keeps
its price. Both are called "redemption" in the product vocabulary and mean different
things, so neither name is abbreviated, and a test pins them apart.

**A cap breach declines the card, and that does not contradict §11.** §11's "never fail
the card at the pump" governs *attribution* — a driver must never be punished because a
merchant descriptor could not be parsed. A rate limit is a known, intended refusal for a
stated reason. It is recorded in `lastCardFillError`, satisfying §11's other half:
never fail silently.

**Spending power must respect it.** The Card screen quotes what the card will authorise,
which is `min(balance, cap remaining)` — never the raw balance, which would advertise
litres the card is about to decline (§9.1).

In the seeded state the cap is the binding constraint: the 24 and 30 September fills
(31.4 L and 38.0 L) both fall inside the trailing window, so 69.4 L is already spent and
40.6 L remains against a 42.6 L balance.

---

## 9. New Screens

### 9.1 Card — `(tabs)/card`

Artboard 03, promoted to a tab and made the centre of the product. The pass design is
kept verbatim — white card, wordmark, `FUEL PASS` label, litre balance hero, holder name,
last four digits, and the two grey strata beneath it.

Four changes:

- **Spending power.** Beneath the litre balance, `R888 available at today's 95` in
  `textDim`. This is the number that matters at a till, and in v1 it is real — it is what
  the card will authorise, which is `min(balance, §8.5 cap remaining)` rather than the
  raw balance. When the weekly cap is the tighter of the two, a second line names it
  (`40.6 L left of your 110 L weekly limit`); when the balance binds, that line is absent
  rather than restating what the hero already says.
- **`412 stations` becomes `Works at any fuel station`.** The design's accepted-at row is
  kept; only the claim changes.
- **Grade.** A static `PETROL 95` label. v1 has one grade, so there is no switcher and no
  chrome for a choice that does not exist.
- **Freeze card.** A `border`-style button beside the wallet buttons. Sets a flag, greys
  the pass to `surface`, stamps `FROZEN` across it in `accent`. Cheap to build and the
  first thing anyone looks for in a card app.

`ADD TO APPLE WALLET` and `ADD TO GOOGLE PAY` are retained exactly as designed, and are
inert.

### 9.2 Fill detail — `fill/[id]`

The §8.4 conversion-transparency screen. Station, grade, date, the equation in numeric
treatment, resulting balance, lots consumed, and the dispute button. Reached by tapping
any `fill` row in the ledger.

The price line names the zone and effective date that produced it, because those are the
two inputs that can be wrong (§8.4).

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

### 9.4 Balance — expiry split replaces the grade split

Artboard 08's two-column `PETROL 95 / DIESEL` split has nothing to divide in a
single-grade product. The columns are kept — the layout is good — and repurposed to the
cut that now matters:

`EXPIRES WITHIN 30 DAYS`  |  `LATER`

The left column takes `accent` when non-zero. This serves §8.1 directly and puts the one
genuinely time-sensitive fact about a litre balance on the screen built to hold it.

**In the seeded state the left column reads `0.0 L` and the right `42.6 L`.** FIFO
consumes oldest lots first, so surviving stock is always the most recent purchase — here
the 28 September top-up, expiring 27 December. An expiry warning in the seed would require
an old lot to have outlived newer ones, which the consumption order makes impossible. The
zero is correct, not a seeding failure. A `Soonest expiry · 27 Dec` line beneath the split
carries the guardrail in this state, and the accent branch is covered by unit tests on
`expiringWithin` rather than by the seed.

This is a general property worth stating once: **under FIFO, a user who tops up regularly
will rarely see an expiry warning.** The warning is for dormant balances, which is exactly
who it should be for.

### 9.5 Stations — REMOVED; the zone price moves to the Wallet

**This screen no longer exists** (§4). What follows is retained to record what the screen
carried and why one line of it survived. That line — the zone price and its "regulated,
the same everywhere" statement — is now the last row of the Wallet's price-watch block,
where the price and next-change are already stated. `textMuted` is identical in both token
sets, so it needs no override inside that block's light-mode inversion.

The original text follows.

#### Original §9.5

Per §4.1 the per-station price column is removed. The screen leads with the zone price as
a single statement:

`R21.87 / L` in numeric hero, labelled `PETROL 95 · GAUTENG INLAND`, and beneath it in
`textMuted`: *"Regulated. The same at every station in this zone."*

The list below shows brand, suburb, hours and distance — no price. The `DIESEL` filter
chip is removed; `NEAR ME` and `24 HOURS` remain.

This is a stronger screen than the design's coverage list. It answers the question a
driver actually has (where is fuel, is it open) and it quietly explains why the card
works everywhere, which is the thing that makes Barrel believable without partners.

## 10. Testing

`jest` + `jest-expo`, unit tests over `src/lib/` only.

| Module | Cases |
|---|---|
| `lots.consumeFifo` | Oldest first; spans multiple lots; skips expired; exact-drain removes lot; insufficient balance rejects; partial consumption leaves remainder |
| `cardfill.deriveLitres` | Rand ÷ zone price; rounds to 1dp; zero and negative amounts reject |
| `cardfill.resolveZone` | Station zone wins; unmatched station falls back to the zone implied by transaction location, never to a national constant; unresolvable location rejects rather than guessing |
| `cardfill.priceFor` | Correct price either side of a first-Wednesday change; a fill authorised before and settled after a change uses the authorisation date |
| `seed` | Ledger chains exactly; terminates at 42.6 L; savings total and litres-below-pump match §4.3 |
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
| Litres, rand, zone price, effective date | Volume and value, and the inputs that produced them |
| Timestamp | Day-of-week and time-of-day patterns |
| Driver's prior fills | Baseline station choice — the counterfactual |

The normalisation problem is worth naming: merchant descriptors arrive dirty
(`ENGEN WILLIAM NICOL`, `E WILLIAM NICOL 4412`, `ENGEN 4412 BRYANSTON`), and station
identity is the unit the whole phase-2 negotiation is priced in. `normaliseDescriptor`
is a stub in v1 that matches against the seeded station list and returns `null` on no
match, but it is flagged here as real backend work, not a formality.

Unmatched fills must still succeed. A driver whose station cannot be resolved still gets
their litres, priced at the zone implied by the transaction's own location data, and the
fill is recorded with `stationId: null`.

**Zone, never a national number.** DMPR prices petrol by zone — inland and coastal, with
finer splits by distance from the coast — so there is no single countrywide price to fall
back to. Falling back to a national constant would put a systematic error into every
unattributed fill, and it would be invisible: the balance would simply be quietly wrong
for everyone near a boundary. The fallback is the zone, resolved from location or BIN
data, and if even that cannot be established the fill is queued for manual pricing rather
than priced with a guess.

Fail open on attribution; never fail the card at the pump; but never fail *silently* on
price.

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
2. Onboarding, FICA capture, vehicle linking. Vehicle registration is seeded; onboarding
   must capture it before a pilot because the §8.2 monthly cap is per vehicle.
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

Recorded so they are not lost between this spec and a legal opinion.

**1. The FSCA/FAIS question, and how to ask it.**

Business overview §7 rests the non-derivative case on a voucher "redeemable only for
physical fuel". MCC-locking to 5541/5542 preserves that, and it is the load-bearing half
of the sentence. It does not close the question.

Put **two separate questions** to counsel rather than one:

- *Is a prepaid, litre-denominated instrument redeemable only for fuel a voucher rather
  than a regulated financial product?* — the original framing, and the easier question.
- *Does converting a litre balance into rand at a floating price, and settling that rand
  to a third-party merchant, change the answer?* — the open-loop card's specific problem,
  and the one that is new in this revision.

Asking only the first and receiving a yes would be a false comfort. The second is where
the exposure actually sits, and it should be asked in its own words.

**2. Interchange must partly replace the rebate, and the size of it is unknown.**

What is known: SA fuel retailers pay a total merchant service fee of roughly **1.75%**
per card transaction. This figure is public — the Fuel Retailers Association has
campaigned on it — but it is the **whole pie**: card scheme fees, acquirer margin, and
issuer interchange combined. Barrel's slice as issuer is some fraction of it and can only
come from a sponsor bank. Treat 1.75% as a ceiling to reason against, never as revenue.

That ceiling is worth sizing, because it reframes the phase-1 model. On a 40-litre fill
at R21.87 (R874.80), the entire 1.75% is **R15.31**. The station rebate the same fill
would have earned in the partner model, at R0.40/litre, is **R16.00**.

So the full merchant fee — every participant's share combined — is roughly the size of
the rebate on its own. Barrel receives a fraction of that. Interchange therefore does not
replace the station rebate; it softens its absence. This is not an argument against the
strategy, but it does mean **subscription carries phase 1 more completely than the
business overview's four-stream model implies**, and the plan should not assume otherwise.

**3. Diesel — resolved by exclusion, not by mitigation.**

The previous revision carried diesel price dispersion as an uncapped exposure. v1 is
petrol 95 only, so the exposure does not exist: petrol has one regulated price per zone
and a station cannot charge more. This is designed out, not accepted.

It returns the moment diesel does, and it returns *first* rather than gradually — the
delivery and ride-hail drivers in the target segment are disproportionately diesel, so
adding diesel means adding the most price-exposed grade to the most fuel-intensive users.
A conversion cap, or a wholesale partner carrying the price risk, needs to be in place
before diesel ships, not after.
