# Barrel — marketing website

**Status:** design approved, not yet implemented
**Relationship to the app specs:** this adds a new, independent surface. It does not amend
`2026-09-06-barrel-fuel-wallet-design.md` or `2026-09-09-barrel-pump-redesign-design.md`.
It *inherits* the Pump design system from the latter and must not diverge from it.

---

## 1. What this is

A public, pre-launch marketing website for Barrel with one job: explain the promise to a
South African motorist and capture an email address. It is a separate npm project inside
this repository, deployed independently. It shares no code with the Expo app.

The app is a prototype over mock data gated on a legal opinion. The website is the first
Barrel artefact that will be seen by people who cannot be told that verbally, which is why
§4.2 and §8 exist.

---

## 2. Decisions taken

| Decision | Choice |
|---|---|
| Purpose | Marketing and waitlist. Not a demo, not an investor page. |
| Signup destination | A hosted list service. No backend, no secrets in the repo. |
| Claims posture | **Concept only. No mechanics.** |
| Stack | Next.js, static export, deployed on Vercel. |
| Shape | Single page, plus two thin legal routes. |
| Dark mode | None. |

### 2.1 Concept only, no mechanics

The site explains **the outcome** — buy fuel at today's price, use it later — and does not
explain how it works. Specifically excluded from every page except `/terms`: the 90-day
window, expiry, litres held as lots, FIFO, the monthly and weekly caps, savings figures,
burn rate, station names, and any number describing a return.

This was chosen over a fuller explanation and over a build-in-public voice. The cost if
wrong: vagueness reads as evasive in fintech, and a prepaid product asking for money later
needs to read as trustworthy now. §4.2 is the mitigation.

---

## 3. Project layout and deployment

```
Barrel_fin/
├── app/  src/  package.json          Expo app — untouched
└── web/                              independent npm project
    ├── package.json                  own dependencies and lockfile
    ├── next.config.ts                output: 'export'
    ├── app/
    │   ├── layout.tsx                fonts, metadata, og tags
    │   ├── page.tsx                  the landing page
    │   ├── terms/page.tsx            material terms
    │   └── privacy/page.tsx          POPIA notice
    ├── components/                   Lockup, PriceChart, WaitlistForm
    ├── data/fuel-prices.ts           sourced figures — see §7
    └── public/                       favicon set, og image, fonts
```

`web/` is **not** a workspace of the root project. It has its own `package.json` and
lockfile so that Next's React never has to reconcile with Expo's pinned React 19.2.3,
Metro and react-native-web. The root `node_modules/` entry in `.gitignore` already matches
`web/node_modules` at any depth; no gitignore change is needed.

The root `npm test` and `npx tsc --noEmit` must continue to pass unchanged, and must not
traverse `web/`. If Jest or tsc picks it up, that is a defect to fix in this work.

**Deployment:** a Vercel project with Root Directory `web/`, build command `next build`,
static output served from the CDN. No environment variables, no serverless functions, no
secrets.

**Consequence, stated deliberately:** static export means there is no server-side spam
protection. Whatever the form service provides is the entirety of the defence. This makes
spam handling a vendor selection criterion (§8), not a detail.

---

## 4. The page

### 4.1 Five blocks, in order

1. **Hero** — the promise, and nothing else. Buy fuel at today's price, use it later.
   Carries the pre-launch status; the site cannot take money and must not imply it can.
2. **The problem** — fuel prices change on the first Wednesday of every month, and what
   that has cost a regular driver over the last year. Contains the chart (§7).
3. **The promise, concretely** — one paragraph on what having Barrel changes on the day
   the price rises. Outcome only; no mechanic named.
4. **The waitlist form** — one email field, one button. Button copy is `Join the waitlist`,
   never `Get started`, which would imply a product to start.
5. **Footer** — who is building it, a contact address, and links to `/terms` and
   `/privacy`.

No other blocks. In particular: no feature grid, no testimonials, no logo strip, no FAQ
accordion, no pricing table, no app-store badges.

### 4.2 Material terms

The 90-day price-lock life is a **material term**, not implementation detail. Omitting it
from a page that collects signups is different in kind from omitting FIFO. It therefore
lives in full on `/terms`, reachable from the footer of every page, and is not repeated in
the marketing copy. The landing page stays free of mechanics; nothing material is hidden.

`/terms` also states plainly that Barrel has not launched, holds no legal opinion, has no
banking partner and no station agreements.

### 4.3 Copy register

The model is this repository's own documentation: dry, precise, unhyped. "Fuel prices
change on the first Wednesday of every month," not "say goodbye to fuel price anxiety."
No sentence may imply an investment return, and none may imply savings accumulate — the
90-day window caps the position near R20 on a one-tank balance, and the app specs are
explicit that this product sells price certainty, not profit.

---

## 5. Visual direction

The site inherits the **Pump** design language: a fuel-pump readout and the instrument
panel around it. It does not invent a second visual language for the web, and it does not
introduce a token that is not in `src/theme/tokens.ts`.

### 5.1 Prohibitions

Each of these is a recognisable generated-page tell. Each is banned outright, and each is
checkable (§9).

| Banned | Instead |
|---|---|
| Gradients, glassmorphism, glow, backdrop blur | Flat fields only |
| Generic system sans at default weights | Figtree and JetBrains Mono, self-hosted |
| Three-column icon-and-blurb feature grid | Five stacked blocks of unequal height |
| Icon libraries, emoji as icons | No icon set. Direction on ▲ ▼ glyphs only |
| Large-radius cards with soft shadows | Radius ≤ 10px; hairline rules for separation |
| Centred body text, symmetrical rhythm | Left-aligned throughout |
| Framework default palettes | The app's tokens verbatim |
| Scroll-triggered animation | None |
| Testimonials, "trusted by" logos | None — there are no customers, and inventing them would be fabrication |

### 5.2 Tokens

Light mode only, from `LIGHT` in `src/theme/tokens.ts`. Values are copied into the web
project's CSS as custom properties; the app file remains the source of record and any
divergence is a defect.

- Ground `#FFFFFF`, surface `#F7F5F0`, text `#000000`, hairline `#DCD6C9`.
- **Amber `#FF6A00` appears exactly once**, as the fill of the single button, with ink set
  on it. Amber is never text: it measures 2.8:1 on white. This is the app's rule and it
  holds here.
- **Lime never appears.** It means savings; there are no savings on a page with no
  mechanics. Introducing it would break the app's one-meaning-per-colour rule.
- Radii from `RADIUS`: 6px for the button and any bordered box, 10px maximum anywhere.
- **The button's hover and active states are opacity changes, not a second amber.** The app
  dims rather than recolours on press (`MOTION.surfaceOpacity`), and introducing a darker
  amber here would put two accent values in the stylesheet and quietly defeat the §9 check.
- Shadows, if used at all, at the app's `LIGHT_ELEVATION.low` values — 6% opacity. Prefer
  a hairline.

### 5.3 Type

- **Numerals: JetBrains Mono.** Every figure on the site — prices, dates, percentages.
- **Prose and labels: Figtree.**
- Both self-hosted from `web/public/`, not loaded from Google's CDN. This avoids a
  third-party request on a page that otherwise makes none, which keeps the privacy notice
  short and honest.
- Never set `font-weight` against these families where a distinct weight file exists; load
  the weight that is wanted. This mirrors the app's rule and prevents synthetic bolding.

### 5.4 Contrast

Every text value clears **AAA (≥7:1)**, matching the app rather than the 4.5:1 AA floor.
`tokens.test.ts` already proves the light palette does this, so meeting it costs nothing
and falling to AA would be a regression against the project's own standard.

Keyboard focus must be visible on both interactive elements — the email input and the
button. The default outline is never removed without a replacement that clears 3:1 against
its adjacent colours. The app has no keyboard surface and so no rule to inherit; this is
the web's own obligation.

---

## 6. The mark and the lockup

The lockup is already exact in the app, used identically at `app/(tabs)/index.tsx:76` and
`app/(tabs)/card.tsx:59`. The web reproduces it rather than re-deciding it:

| | |
|---|---|
| Mark | droplet only, height 17 |
| Gap | 8px |
| Wordmark | `BARREL`, caps, Figtree ExtraBold 800, 16px, letter-spacing −0.56 |

Implemented as a single `<Lockup>` component with the ratios expressed in `em`
(gap `0.5em`, letter-spacing `−0.035em`, mark height `1.0625em`) so it scales without
anyone choosing new numbers. The droplet path and viewBox are taken from
`src/components/BarrelMark.tsx`, which holds them verbatim from `Barrel_Logo.svg`.

**Favicon.** The source `Barrel_Logo.svg` is the two-tone lockup — a solid droplet with a
white crescent in its lower right. `BarrelMark.tsx` records the crescent's measured
legibility: it reads at 30px, is marginal at 17px, and is gone by 14px. Favicons render at
16 and 32px, so the crescent will not survive at the smaller size and the mark will read as
a solid droplet. That is the same call the app already makes deliberately, and it is
accepted here.

- `icon.svg` — the two-tone source, for browsers that take an SVG favicon.
- `icon-32.png`, `apple-touch-icon.png` (180px) — raster fallbacks.
- **The 1200×630 social card uses the full two-tone artwork**, where it renders large
  enough for the crescent to resolve.

---

## 7. The price chart

The chart shows what petrol has actually cost in South Africa over the last twelve months.
It carries block 2 (§4.1) without explaining a single Barrel mechanic.

**`src/data/prices.ts` must not be used, imported, or copied.** It is invented demo data,
including a fictional 2026 supply shock, with September and October pinned to values the
app's tests depend on. Publishing it as South African fuel history would be fabricating a
record. This is the single most important rule in this document.

Instead:

- **Source:** the Department of Mineral Resources and Energy's published fuel price tables,
  cross-checked against the Automobile Association of South Africa's monthly figures.
- **Series:** 95 Unleaded, inland (Gauteng), the headline figure in South African
  reporting. One series only.
- **Range:** the twelve most recent months for which figures are published.
- **Storage:** `web/data/fuel-prices.ts`, a static array with a header comment recording
  the source URL, the retrieval date, and the grade and zone. Provenance travels with the
  data.
- **On the page:** the chart is labelled with grade, zone and source. An unlabelled fuel
  price chart is misleading regardless of intent.

Drawn as inline SVG following the app's chart rules: no library, hairline axes, monospaced
numerals, no gradient fill.

If figures for the stated range cannot be sourced and verified, the chart is **cut** and
block 2 carries itself in copy. It is not shipped with approximated numbers.

---

## 8. The form, and POPIA

**A list tool, not a form inbox.** The purpose of the waitlist is to email these people at
launch; an endpoint that only collects submissions leaves a spreadsheet and no lawful basis
to mail it. Requirements, in priority order:

1. Spam protection that works without a server — this is the whole defence (§3).
2. Double opt-in, which is also the cleanest POPIA consent record.
3. A plain HTML `POST` endpoint. **No iframe embed** — the form must be our own markup so
   §5 applies to it.
4. Unsubscribe handling and list export.

**Default choice: Buttondown**, which meets all four. It is replaced only if checking its
current documentation at implementation time shows the spam story has changed or the plain
POST endpoint has been withdrawn; the fallback is Kit, assessed against the same four
criteria in the same order. Vendor documentation is verified against live docs before the
form is written, not from memory — this design was written in September 2026 against
knowledge that runs to May 2026.

**POPIA, minimally and honestly:**

- The purpose of collection is stated at the point of collection — one line under the
  input, not buried.
- `/privacy` names who holds the data, names the processor, covers the cross-border
  transfer (the processor is not South African), and gives a way to be removed.
- No analytics, no tracking pixels, no cookies. There is nothing else to disclose, and
  this is why the notice can stay short enough to actually be read.

---

## 9. Verification

`web/` has no test runner and will not get one; standing up a second Jest configuration for
one static page is not proportionate. The site is verified by inspection, against a fixed
checklist rather than a judgement call.

**Mechanical checks** — each maps to a §5.1 prohibition:

- No `gradient`, `backdrop-filter`, or `blur(` in any CSS.
- No icon library in `web/package.json`.
- `#FF6A00` appears exactly once in the stylesheet, as a background.
- No lime value (`#7A9000`, `#D6E84A`, `#3F5406`) appears at all.
- No `text-align: center` on a body-copy element.
- No `border-radius` above 10px.
- No request to a third-party domain except the form endpoint on submit.

**Visual checks:** built and opened in Chrome at 390px and 1440px, screenshots of both
returned for review.

**Content checks:** no excluded mechanic (§2.1) appears outside `/terms`; every figure on
the page traces to `web/data/fuel-prices.ts`; the chart carries grade, zone and source.

The project already knows this failure mode — `HANDOVER.md` records a chart bug that passed
all 260 tests and was found by opening the app. Inspection is not a weaker substitute here;
it is the check that would have caught that.

---

## 10. Out of scope

- Any link to, or embed of, the Expo prototype.
- Analytics, A/B testing, cookie consent.
- A blog, an FAQ page, or any route beyond the three named.
- Localisation. English only.
- Dark mode.
- App store links or badges — there is no shipped app.
- Changes of any kind to `app/`, `src/`, or the root `package.json`.

---

## 11. Risks

| Risk | Cost if wrong | Mitigation |
|---|---|---|
| Mock prices reach the public site | Fabricated financial data published under Barrel's name; the most serious failure available here | §7 forbids the import outright; the provenance comment and the §9 content check both catch it |
| Concept-only copy reads as evasive | Low signup conversion, and worse, distrust of a prepaid product | Material terms on `/terms`, linked from every footer; honest button copy; no invented social proof |
| Next.js installed at the repo root | Breaks the Expo app's dependency graph | `web/` is an independent project with its own lockfile (§3) |
| Form vendor's spam handling is inadequate | A junk list, and no server-side recourse under static export | Spam protection is the first selection criterion (§8), verified against live docs |
| The site drifts from the app's tokens | Two Barrels that look related but not identical | Tokens copied with `src/theme/tokens.ts` named as the source of record; divergence is a defect |
| Collecting emails without a lawful basis | POPIA exposure before the product even exists | Double opt-in, stated purpose, `/privacy`, no tracking |
