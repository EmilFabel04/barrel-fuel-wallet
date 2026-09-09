# Barrel — how the UI works

What each screen is for, what the numbers on it mean, and where they come from.
For what's *missing*, see `GAPS.md`. For the rules you must not break while changing it,
see `HANDOVER.md`.

---

## The product in one paragraph

Barrel is a prepaid fuel wallet denominated in **litres, not rand**. You buy litres at
today's pump price; they keep that price for 90 days; you spend them at any fuel station
with a card. If the pump price rises in between, you have already paid the old price. That
is the whole product — **price certainty, not a return**.

---

## Navigation

Four tabs, two pushed screens.

```
WALLET ──┬─ tap hero or gauge ─→ Your litres ──→ Top up
         ├─ tap price panel ───→ Price alert ──→ Top up
         ├─ tap last fill ─────→ Fill detail
         └─ HISTORY ──────────→ History ───────→ Fill detail

CARD          (the pass, freeze, add to phone wallet)
SAVINGS       (realised savings, price history, per-month)
SETTINGS      (profile, alerts, account, appearance, demo)
```

Card sits second because Wallet and Card are the two tabs you *use the product* with;
Savings and Settings are the two you *review it* with. Card is the only tab that takes the
accent colour when active — it is the one that acts in the physical world.

---

## Screen by screen

Each screen answers exactly one question. Where two screens could answer the same one,
that is a bug.

### Wallet — "What do I have, and what is the price about to do?"

| Element | What it is |
|---|---|
| Hero, e.g. `42.6 L` | Your balance: the sum of every **unexpired** lot. |
| The segmented strip under it | The same balance **split by expiry** — one segment per lot, width proportional to litres, amber for anything expiring within 30 days. Tap it for Your litres. |
| `R931.66 · at today's 95` | What that balance would cost at today's pump price. Not what you paid. |
| `You use about 15.7 L a month` | Your burn rate, measured from your first fill to today. |
| `12.0 L expires in 6 days` | Only shown when something is inside the 30-day window. See **Expiry** below. |
| The price panel | Today's price, the month-on-month change, the next scheduled change with a countdown, and what topping up before it locks in. Tap for the Price alert screen. |
| `Last fill · Shell Grayston` | The newest fill, by date. Tap for its detail. |
| `TOP UP` / `HISTORY` | The primary action, and the way into the record. |

**Savings deliberately does not appear here.** It lives on the Savings tab. The Wallet is
about what you hold and what the price is doing.

### Your litres — "What exactly am I holding, and when does it go?"

The hero and gauge repeat from the Wallet, so arriving here feels continuous. Then:

- **Every litre, and when it expires** — each lot drawn as a runway from today to its
  expiry date, labelled with the date bought, the price paid, and the litres left. The
  scale is the furthest expiry in your wallet, so the longest runway always fills the axis.
  Amber means inside 30 days.
- **Locked in** — what your balance actually cost, what it is worth at today's pump, and
  the difference. Plus what that becomes at the next scheduled price change.
- The reassurance line: unused litres convert back to the rand you paid. They never expire
  to zero. *(Note: this is stated but not yet implemented — see `GAPS.md`.)*

### History — "What happened?"

Every ledger entry, newest first, grouped by month with a count per group.

- **Filter chips** — All / Fills / Top-ups. A referral bonus counts as a top-up: it is
  litres coming in.
- **The summary panel** recalculates against whatever the chips are showing, so the figures
  never contradict the list beneath them.
- **Every fill carries a saved badge.** Amber when the fill beat the pump that day, an
  honest grey when it did not. Hiding the zeroes would make this a brochure rather than a
  record — the badge is the running proof the product works.
- Top-up rows show their own 90-day expiry date.
- Only fill rows are tappable. A top-up row lighting up would promise a screen that does
  not exist.

### Savings — "Am I actually ahead, and by how much?"

- **Realised · since March** — the hero. Money already saved on fuel *already burned*:
  for every fill, the pump price that day minus what those litres actually cost you.
  "Realised" is load-bearing — it distinguishes this from *locked in* on Your litres,
  which is the unrealised position on litres you still hold. Both are honest and neither
  substitutes for the other.
- **Your price vs the pump** — two lines, month by month, with the gap shaded. This is the
  product's entire thesis as one image.
- **The gap panel** — states in words whether your edge is widening or narrowing, with both
  figures, and points at the next price change as where it reopens. A savings screen that
  only goes up reads as marketing.
- **Saved per month** and the footer stats.

### Card — "How do I actually spend this?"

The pass is a depiction of a physical Apple/Google Wallet card: white with black text in
**both** themes, because a physical object does not have a dark mode. Shows your balance,
what it is worth today, and — only when the weekly limit is the tighter constraint — how
much of that limit is left.

### Price alert, Fill detail, Top up, Settings

- **Price alert** — the next change, front and centre: the cents, the date, days remaining,
  a countdown meter, and what topping up R2 000 before it buys you. Plus the alert toggles.
- **Fill detail** — the arithmetic worked out longhand (`rand ÷ price = litres`), what the
  fill saved, the station, the lots it consumed, and the dispute action.
- **Top up** — the amount defaults to roughly a month of your usage, derived from your burn
  rate. The meter shows this month against the 500 L cap.
- **Settings** — profile, alert toggles, account rows, appearance (dark → light → system),
  and the prototype-only demo trigger.

---

## The design language

The reference is a **fuel-pump readout and the instrument panel around it** — not a
fintech dashboard.

### Colour means one thing each

| | |
|---|---|
| **Amber** | fuel and price — the thing you are buying |
| **Lime** | savings — the thing you are gaining |
| **Off-white / ink** | neutral fact |

Direction is carried by glyphs (▲ ▼) and copy, **never** by a third colour.

### Light mode is bright on purpose

This app gets opened standing at a pump, outdoors, where glare adds a flat white veil.
Glare can only *add* light, so a white ground preserves more of the contrast range than an
off-white one. Every light-mode text value clears **AAA (≥7:1)**, not the 4.5:1 AA floor,
and `tokens.test.ts` measures it.

The consequence: **in light mode amber is a fill, not text.** You cannot have an orange
that is both luminous and high-contrast on white — they are opposites. So amber becomes a
solid field with ink on it (the price badge, the gauge, the meter, the primary button) and
a darker twin, `accentText`, carries the small delta glyphs. Road-sign logic.

### Type

- **Numerals — JetBrains Mono.** A pump readout is monospaced, and monospaced digits cannot
  change width, so a hero can never jitter as it counts.
- **Prose and labels — Figtree.**

---

## Where the numbers come from

Nothing on any screen is a literal. Every figure is derived from the ledger, the lots, or
the price table.

### Litres are held as *lots*, not as a balance

A top-up does not increment a number. It creates a **`Lot`**:

```
{ litres, pricePerLitre, purchasedAt, expiresAt }
```

Your balance is the sum of every unexpired lot. That one structure is what makes expiry,
FIFO spending, and honest savings possible at all — a scalar balance could not tell you
what any given litre cost.

### Expiry — the 90-day window

**This is the question the UI gets asked most, so in full:**

1. **Every lot expires 90 days after it was bought.** `expiresAt = purchasedAt + 90 days`.
   One definition, in `src/lib/window.ts`. The 90 days is the *price-lock life of a litre*:
   how long those litres keep the price you paid.

2. **Your balance only counts unexpired lots.** `activeLots` filters to
   `expiresAt >= now`, and the balance sums those. An expired lot silently stops counting.

3. **Spending draws FIFO — the oldest lot first.** This matters more than it sounds. It
   means the litres closest to expiring are always the ones you spend, so you cannot
   accidentally strand old litres by buying new ones. It is also why a fill's cost is a
   *weighted average* when it spans two lots.

4. **The Wallet warns at 30 days.** It sums the litres in **every** lot expiring within 30
   days — not just the soonest one — and names the soonest date.

5. **The number moves as you spend, and that is the mechanic, not a bug.** If the warning
   reads `12.0 L` and then `3.3 L` after a fill, that is FIFO draining the oldest lot. Once
   it hits zero the lot is removed from the array entirely, and the warning switches to the
   next lot in line — or disappears, if nothing else is inside 30 days.

6. **Expiry is not supposed to destroy value.** The stated behaviour is that unused litres
   convert back to the rand you paid for them. **This is not built yet** — the `expiry`
   ledger kind exists in the type but nothing writes one, so today an expired lot simply
   stops counting. See `GAPS.md`; this is the most important unbuilt piece of the model.

### The two caps, which are not the same thing

| | | |
|---|---|---|
| `MONTHLY_TOPUP_CAP_L` | **500 L** | How much you can *buy in* per calendar month. |
| `WEEKLY_REDEMPTION_CAP_L` | **110 L** | How much you can *spend out* over a rolling 7 days. Fraud mitigation — it blunts bulk resale. |

And separately, `REDEMPTION_DAYS` (90) is the expiry window above. Three names say
"redemption" and mean three different things.

The weekly window **rolls** rather than resetting on a fixed weekday. A calendar reset
would let someone redeem the full cap on a Sunday and again on a Monday.

### Savings: two different true numbers

| | |
|---|---|
| **Realised** (Savings screen) | For fuel already burned: pump price on the day minus what those litres cost. Money you have actually saved. |
| **Locked in** (Your litres) | For litres you still hold: today's pump value minus what you paid. An unrealised position. |

They are not interchangeable. Against a wallet topped up at the current price, locked-in is
zero while realised savings are not.

**The honest ceiling:** the 90-day window caps how much price advantage anyone can hold —
about R20 on a one-tank balance. No copy anywhere may imply the savings compound.

### Prices

Set by regulation, by zone, effective the first Wednesday of each month — which is why a
station-agnostic card is possible at all. The app reads one table (`src/data/prices.ts`)
for every price it displays or deducts against. Never transcribe a price or a date from a
design; the table is the truth.

---

## What is real and what is mocked

**Real:** every calculation. Lots, FIFO, weighted cost, expiry windows, both caps, savings,
burn rate, price lookups. `src/lib` is pure, React-free and covered by 260 tests. If you
pointed it at a real backend tomorrow, the arithmetic would hold.

**Mocked:** everything around it. No persistence (state resets on reload), no auth, no
payments, no card rail, no push. The clock is pinned to **30 September 2026**; the seed is
dated absolutely and does not survive contact with real time.

**Anyone shown this must be told it is a prototype over mock data**, with no legal opinion,
no bank, and no station agreements.
