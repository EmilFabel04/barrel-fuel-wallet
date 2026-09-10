# Barrel Marketing Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy a single-page, pre-launch marketing website for Barrel that explains the promise without explaining the mechanics, and captures waitlist emails.

**Architecture:** An independent Next.js project at `web/`, statically exported, sharing no code and no dependency graph with the Expo app at the repository root. It inherits the app's Pump design tokens by copying them into CSS custom properties. There is no test runner; the spec's mechanical checks are implemented instead as a runnable script (`npm run check`) so every task has a real verification cycle.

**Tech Stack:** Next.js (App Router, `output: 'export'`), TypeScript, hand-written CSS, `next/font/google` for self-hosted Figtree and JetBrains Mono, inline SVG for the chart and the mark, a hosted list service for signups. No CSS framework, no component library, no icon library.

**Spec:** `docs/superpowers/specs/2026-09-09-barrel-website-design.md` — read it before starting. This plan argues from it; where they disagree, the spec wins.

## Global Constraints

Every task's requirements implicitly include this section.

- **`src/data/prices.ts` must never be imported, copied, or referenced from `web/`.** It is invented demo data. Publishing it as South African fuel history would be fabricating a record. (Spec §7, Risk 1.)
- **No file in `web/` may import from outside `web/`.** No `../src`, no `../app`.
- **No changes to `app/`, `src/`, the root `package.json`, or the root `.gitignore`.** (Spec §10.)
- Root `npm test` (260 tests) and `npx tsc --noEmit` must keep passing and must not traverse `web/`.
- **Concept only, no mechanics.** Excluded from every page except `/terms`: the 90-day window, expiry, litres held as lots, FIFO, the monthly and weekly caps, savings figures, burn rate, station names, any number describing a return. (Spec §2.1.)
- **Light mode only.** No dark mode, no theme toggle.
- **Amber `#FF6A00` appears exactly once** in the stylesheet, as the fill of the single button, with **black** text on it (7.31:1) and a 1px black border. Never as text.
- **Lime never appears.** Not `#7A9000`, not `#D6E84A`, not `#3F5406`.
- Radii ≤ 10px. Banned outright: gradients, `backdrop-filter`, `blur()`, icon libraries, emoji as icons, centred body text, scroll-triggered animation, testimonials, logo strips.
- Every text value clears **AAA (≥7:1)**. Keyboard focus is visible on both interactive elements.
- Numerals are always JetBrains Mono; prose and labels are always Figtree.
- Copy register: dry, precise, unhyped. No sentence may imply an investment return or that savings accumulate.

**Exact token values** (from `src/theme/tokens.ts`, which stays the source of record):

| Token | Value | |
|---|---|---|
| `bg` | `#FFFFFF` | ground |
| `surface` | `#F7F5F0` | raised fields |
| `text` | `#000000` | body |
| `textDim` | `#3A342D` | secondary |
| `textMuted` | `#5C554C` | labels |
| `border` | `#948A78` | visible borders |
| `hairline` | `#DCD6C9` | rules and separators |
| `accent` | `#FF6A00` | the one button fill |

**Exact type values** (from the app's components):

| Element | Spec |
|---|---|
| Wordmark | Figtree 800, `1em`, letter-spacing `-0.035em`, uppercase `BARREL` |
| Button label | Figtree 800, 15px, letter-spacing `0.45px` |
| Small label | JetBrains Mono 700, 10px, letter-spacing `1.6px`, uppercase, colour `#5C554C` |
| Numerals | JetBrains Mono |

---

## File Structure

| File | Responsibility |
|---|---|
| `web/package.json` | Own dependencies and lockfile; isolates Next's React from Expo's pinned 19.2.3 |
| `web/next.config.ts` | `output: 'export'`, unoptimized images |
| `web/.gitignore` | `.next/`, `out/` — root `.gitignore` already covers `node_modules` at any depth |
| `web/scripts/check.mjs` | The spec §9 mechanical checks, runnable. The project's only automated gate |
| `web/app/globals.css` | Tokens as custom properties, base type, the one amber rule |
| `web/app/layout.tsx` | Fonts, metadata, Open Graph, favicon wiring, footer |
| `web/app/page.tsx` | The landing page: the five blocks in order |
| `web/app/terms/page.tsx` | Material terms — the only page where mechanics appear |
| `web/app/privacy/page.tsx` | POPIA notice; names the processor and the cross-border transfer |
| `web/components/Lockup.tsx` | Droplet + `BARREL`, em-scaled so it needs no new numbers |
| `web/components/Footer.tsx` | Attribution, contact, the two legal links |
| `web/components/PriceChart.tsx` | Inline-SVG chart of the sourced series |
| `web/components/WaitlistForm.tsx` | One field, one button, the purpose-of-collection line |
| `web/data/fuel-prices.ts` | The sourced series with its provenance header |

Eight tasks. Tasks 5 and 6 are split because a reviewer could reject the sourced data while approving the chart that draws it, and the reverse.

---

### Task 1: Project skeleton, tokens, and the check script

Nothing else can be verified until the gate exists, so the scaffold and the gate ship together.

**Files:**
- Create: `web/` (via `create-next-app`), `web/.gitignore`, `web/scripts/check.mjs`, `web/app/globals.css`
- Modify: `web/package.json`, `web/next.config.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run check` (exit 0 = pass, non-zero = fail, prints one line per failure); `npm run verify` (build then check); CSS custom properties `--bg --surface --text --text-dim --text-muted --border --hairline --accent`.

- [ ] **Step 1: Scaffold the project**

From the repository root:

```bash
npx create-next-app@latest web --typescript --app --eslint --no-tailwind --no-src-dir --import-alias "@/*"
```

If a flag is rejected by the current version, run `npx create-next-app@latest web` interactively and answer: TypeScript **yes**, ESLint **yes**, Tailwind **no**, `src/` directory **no**, App Router **yes**, import alias **`@/*`**. Tailwind must be **no** — its default palette is one of the banned tells, and the design calls for hand-written CSS against the app's tokens.

- [ ] **Step 2: Confirm the Expo app is unaffected**

```bash
cd /Users/emilfabel/Barrel_fin && npm test && npx tsc --noEmit
```

Expected: 260 tests pass, tsc silent. If either now traverses `web/`, fix the root config exclusion before continuing — that is a defect introduced by this task.

- [ ] **Step 3: Configure static export**

`web/next.config.ts`:

```ts
import type { NextConfig } from 'next';

// Static export: the site has no server, no env vars and no functions.
// See spec §3 — the consequence is that spam protection is entirely the
// form service's job, since there is no request we can inspect.
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
```

`web/.gitignore`:

```
.next/
out/
```

- [ ] **Step 4: Write the check script**

`web/scripts/check.mjs`:

```js
#!/usr/bin/env node
// The spec §9 mechanical checks, made runnable. Each check names the rule it
// enforces. This is the project's only automated gate: web/ has no test
// runner by design (spec §9), so these checks carry that weight.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const failures = [];
const fail = (rule, file, detail) =>
  failures.push(`${rule}\n    ${relative(ROOT, file)}: ${detail}`);

function walk(dir, exts, out = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', '.next', 'out', '.git'].includes(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, exts, out);
    else if (exts.includes(extname(p))) out.push(p);
  }
  return out;
}

const src = walk(ROOT, ['.ts', '.tsx', '.css', '.mjs']).filter(
  p => !p.includes(`${join('scripts', 'check.mjs')}`)
);
const cssish = src.filter(p => ['.css', '.tsx'].includes(extname(p)));
const read = p => readFileSync(p, 'utf8');

// §5.1 — banned visual effects
for (const p of cssish) {
  const s = read(p);
  for (const [re, name] of [
    [/gradient/i, 'gradient'],
    [/backdrop-filter/i, 'backdrop-filter'],
    [/\bblur\s*\(/i, 'blur()'],
  ]) if (re.test(s)) fail(`§5.1 banned effect: ${name}`, p, 'found');
}

// §5.1 — no icon library, no CSS framework
const pkg = JSON.parse(read(join(ROOT, 'package.json')));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
for (const d of Object.keys(deps)) {
  if (/icon|lucide|heroicons|feather|font-awesome|tailwind|bootstrap/i.test(d))
    fail('§5.1 banned dependency', join(ROOT, 'package.json'), d);
}

// §5.2 — amber exactly once, in globals.css only. Comments are stripped
// first: documentation is allowed to name the value it explains, and a
// comment cannot paint anything.
const stripComments = s =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

let amber = 0;
for (const p of cssish) {
  const hits = (stripComments(read(p)).match(/#FF6A00/gi) || []).length;
  amber += hits;
  if (hits && !p.endsWith('globals.css'))
    fail('§5.2 amber outside globals.css', p, `${hits} occurrence(s)`);
}
if (amber !== 1)
  fail('§5.2 amber must appear exactly once', join(ROOT, 'app/globals.css'), `found ${amber}`);

// §5.2 — lime never appears
for (const p of cssish) {
  const m = stripComments(read(p)).match(/#(7A9000|D6E84A|3F5406)/gi);
  if (m) fail('§5.2 lime is forbidden on this site', p, m.join(', '));
}

// §5.1 — no centred body text
for (const p of cssish) {
  if (/text-align:\s*center/i.test(read(p)))
    fail('§5.1 centred text', p, 'text-align: center');
}

// §5.2 — radius ceiling
for (const p of cssish) {
  for (const m of read(p).matchAll(/border-radius:\s*(\d+)px/gi)) {
    if (Number(m[1]) > 10) fail('§5.2 radius > 10px', p, `${m[1]}px`);
  }
}

// Global constraint — no import may escape web/
for (const p of src) {
  for (const m of read(p).matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const spec = m[1];
    if (/(^|\/)\.\.\/\.\.\//.test(spec) || /src\/(data|lib|theme|components)/.test(spec))
      fail('imports must not escape web/', p, spec);
  }
}

// §7 — sourced data carries its provenance
const pricesFile = join(ROOT, 'data/fuel-prices.ts');
if (existsSync(pricesFile)) {
  const s = read(pricesFile);
  for (const key of ['source:', 'retrieved:', 'grade:', 'zone:'])
    if (!s.includes(key)) fail('§7 missing provenance field', pricesFile, key);
  if (/export const FUEL_PRICES[^=]*=\s*\[\s*\]/.test(s))
    fail('§7 price series is empty', pricesFile, 'cut the chart rather than ship it empty');
}

// §2.1 — no mechanics outside /terms
const MECHANICS = [
  [/\b90[-\s]day/i, '90-day window'],
  [/\bexpir(y|es|ed|ing|ation)\b/i, 'expiry'],
  [/\bFIFO\b/, 'FIFO'],
  [/\bburn rate\b/i, 'burn rate'],
  [/\b(monthly|weekly) cap\b/i, 'cap'],
];
for (const p of src.filter(p => p.endsWith('.tsx') && !p.includes(join('app', 'terms')))) {
  const s = read(p);
  for (const [re, name] of MECHANICS)
    if (re.test(s)) fail('§2.1 mechanic outside /terms', p, name);
}

// §9 — no third-party requests. Two surfaces, deliberately not the built JS:
// framework bundles carry inert documentation URLs (react.dev's error
// decoder, nextjs.org, core-js) that are strings, never requests. Built HTML
// and CSS is where a real resource reference lands — script, link, img, form
// action — and where a font-CDN leak would show. Our own source is where an
// endpoint we wrote would appear.
const ALLOWED = [
  /^https?:\/\/(www\.)?getbarrel\./i,
];
const scanForOrigins = files => {
  for (const p of files) {
    for (const m of read(p).matchAll(/https?:\/\/[a-z0-9.-]+/gi)) {
      const url = m[0];
      if (/schema\.org|w3\.org/i.test(url)) continue; // namespaces, not requests
      if (!ALLOWED.some(re => re.test(url)))
        fail('§9 third-party origin', p, url);
    }
  }
};
const out = join(ROOT, 'out');
if (existsSync(out)) scanForOrigins(walk(out, ['.html', '.css']));
scanForOrigins(src.filter(p => ['.ts', '.tsx'].includes(extname(p))));

// §5.4 — every text pair clears AAA (>=7:1), measured, not asserted.
// This mirrors what tokens.test.ts does for the app's palette.
const luminance = hex => {
  const c = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map(i => {
    const v = parseInt(c.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const TEXT_PAIRS = [
  ['#000000', '#FFFFFF', 'body on ground'],
  ['#3A342D', '#FFFFFF', 'textDim on ground'],
  ['#5C554C', '#FFFFFF', 'textMuted on ground'],
  ['#000000', '#FF6A00', 'button label on amber'],
];
for (const [fg, bg, name] of TEXT_PAIRS) {
  const ratio = contrast(fg, bg);
  if (ratio < 7)
    fail('§5.4 text below AAA', join(ROOT, 'app/globals.css'),
      `${name}: ${ratio.toFixed(2)}:1 (needs 7:1)`);
}

if (failures.length) {
  console.error(`\n${failures.length} check failure(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log('✓ all checks pass');
```

Add to `web/package.json` scripts:

```json
"check": "node scripts/check.mjs",
"verify": "next build && node scripts/check.mjs"
```

- [ ] **Step 5: Run the check and watch it fail**

```bash
cd web && npm run check
```

Expected: FAIL — `§5.2 amber must appear exactly once ... found 0`, and banned-dependency failures if the scaffold pulled anything matching. This proves the gate is live before anything depends on it.

- [ ] **Step 6: Write the tokens**

Replace `web/app/globals.css` entirely:

```css
/* Tokens copied from src/theme/tokens.ts (LIGHT), which remains the source of
   record. Divergence from that file is a defect, not a variation.
   Light mode only: the app has two themes because it is opened at a pump in
   glare; a marketing page has no such reason. */
:root {
  --bg: #FFFFFF;
  --surface: #F7F5F0;
  --text: #000000;
  --text-dim: #3A342D;
  --text-muted: #5C554C;
  --border: #948A78;
  --hairline: #DCD6C9;

  /* The one amber. It is a FILL and never text: #FF6A00 measures 2.87:1
     against white. Black on it measures 7.31:1, which clears AAA — so the
     label is black, not white. It also takes a 1px ink border, because at
     2.87:1 against the ground its own edge would be undefined. */
  --accent: #FF6A00;

  --measure: 34rem;
  --radius: 6px;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-figtree), system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.55;
  /* Left-aligned throughout. Centred body copy is the single strongest
     generated-page tell. */
  text-align: left;
}

/* Every numeral on this site is monospaced — the pump-readout rule. */
.num {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-variant-numeric: tabular-nums;
}

/* JetBrains Mono 700, 10px, tracking 1.6 — SectionLabel.tsx, verbatim. */
.label {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.6px;
  text-transform: uppercase;
  color: var(--text-muted);
}

hr.rule {
  border: 0;
  border-top: 1px solid var(--hairline);
  margin: 0;
}

/* Keyboard focus must stay visible on both interactive elements. The app has
   no keyboard surface and so no rule to inherit; this is the web's own. */
:focus-visible {
  outline: 2px solid var(--text);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; }
}
```

- [ ] **Step 7: Delete the scaffold's template assets**

`create-next-app` ships a demo page whose CSS contains gradients, and an SVG icon set.
Both would fail the checks, and neither is wanted:

```bash
cd web && rm -f app/page.module.css && rm -f public/*.svg
```

`app/page.tsx` keeps its scaffold content for now — Task 4 replaces it. Strip any
`import styles from './page.module.css'` line and the markup that used it, leaving a
minimal placeholder that builds.

- [ ] **Step 8: Run the check and the build**

```bash
cd web && npm run verify
```

Expected: build succeeds, `✓ all checks pass`. If a gradient failure fires, it is coming
from remaining scaffold CSS — delete it rather than editing it.

- [ ] **Step 9: Commit**

```bash
git add web/
git commit -m "feat(web): project skeleton, Pump tokens, and the §9 check script

web/ is an independent npm project so Next's React never has to reconcile
with Expo's pinned 19.2.3. The spec says web/ gets no test runner; the
mechanical checks become a runnable script instead, so every task after
this one has a real gate rather than a judgement call.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

### Task 2: The Lockup, the favicons, and the social card

**Files:**
- Create: `web/components/Lockup.tsx`, `web/public/icon.svg`, `web/public/icon-32.png`, `web/public/apple-touch-icon.png`, `web/public/og.png`
- Read for reference: `src/components/BarrelMark.tsx` (do not import it)

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: `<Lockup size?: number />` — renders the droplet and the `BARREL` wordmark inline; `size` is the wordmark's font-size in px, default 16, everything else scales from it in `em`.

- [ ] **Step 1: Add the failing check**

Append to `web/scripts/check.mjs`, before the `if (failures.length)` block:

```js
// Task 2 — the lockup uses the artwork's own viewBox, not a re-drawn path
const lockup = join(ROOT, 'components/Lockup.tsx');
if (existsSync(lockup)) {
  const s = read(lockup);
  if (!s.includes('297 0 948 1500'))
    fail('lockup viewBox must match BarrelMark.tsx', lockup, 'expected "297 0 948 1500"');
} else {
  fail('lockup missing', lockup, 'not created');
}
```

- [ ] **Step 2: Run the check to verify it fails**

```bash
cd web && npm run check
```

Expected: FAIL — `lockup missing ... not created`.

- [ ] **Step 3: Write the Lockup**

The droplet path and viewBox are taken verbatim from `src/components/BarrelMark.tsx`, which holds them verbatim from `Barrel_Logo.svg`. Copy them character for character; do not re-trace or re-optimise them, or they stop being diffable against the artwork.

`web/components/Lockup.tsx`:

```tsx
// The droplet path and viewBox are copied verbatim from
// src/components/BarrelMark.tsx, which took them verbatim from
// Barrel_Logo.svg. Copied rather than imported: web/ shares no code with the
// app. If the artwork changes, both copies change.
//
// Only the droplet ships here, as in the app. The source is two-tone — a
// droplet with a white crescent — but BarrelMark.tsx records the crescent as
// gone below ~14px and marginal at 17px. It survives only on the social card
// (public/og.png), which renders large.
const VIEW_BOX = '297 0 948 1500';
const ASPECT = 948 / 1500;

const DROPLET =
  'M 985.652344 383.585938 C 870.832031 184.472656 771.070312 0.277344 771.070312 0.277344 ' +
  'C 771.070312 0.277344 671.308594 184.472656 556.488281 383.585938 ' +
  'C 515.585938 454.539062 297.800781 791.832031 297.800781 993.859375 ' +
  'C 297.800781 1255.25 509.679688 1500.335938 771.070312 1500.335938 ' +
  'C 1032.460938 1500.335938 1244.339844 1255.25 1244.339844 993.859375 ' +
  'C 1244.339844 791.832031 1026.554688 454.539062 985.652344 383.585938';

/**
 * The app's lockup, reproduced exactly: mark height 17 against a 16px
 * wordmark, 8px apart, Figtree 800 at -0.56 tracking.
 * (app/(tabs)/index.tsx:76 and app/(tabs)/card.tsx:59, which agree.)
 * Expressed in `em` so it scales from `size` alone and nobody has to choose
 * a second set of numbers.
 */
export function Lockup({ size = 16 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5em',          // 8 / 16
        fontSize: `${size}px`,
        lineHeight: 1,
      }}
    >
      <svg
        viewBox={VIEW_BOX}
        role="img"
        aria-label="Barrel"
        style={{ height: '1.0625em', width: `${1.0625 * ASPECT}em`, display: 'block' }}
      >
        <path d={DROPLET} fill="currentColor" />
      </svg>
      <span
        aria-hidden="true"
        style={{
          fontWeight: 800,
          letterSpacing: '-0.035em',   // -0.56 / 16
          textTransform: 'uppercase',
        }}
      >
        Barrel
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Generate the icon files**

The source is `/Users/emilfabel/Downloads/Barrel_Logo.svg` — the two-tone artwork, droplet plus white crescent.

```bash
cp /Users/emilfabel/Downloads/Barrel_Logo.svg web/public/icon.svg
cd web/public
sips -s format png -Z 32 icon.svg --out icon-32.png 2>/dev/null || \
  npx --yes sharp-cli -i icon.svg -o icon-32.png resize 32 32
sips -s format png -Z 180 icon.svg --out apple-touch-icon.png 2>/dev/null || \
  npx --yes sharp-cli -i icon.svg -o apple-touch-icon.png resize 180 180
```

Expected: at 32px the crescent is faint and at 16px it will not read at all. That is accepted (spec §6) — it degrades to the solid droplet, which is the same call the app makes.

- [ ] **Step 5: Build the social card**

`web/public/og.png`, 1200×630, on `#FFFFFF`: the two-tone artwork at roughly 180px tall on the left of a left-aligned lockup, the wordmark beside it, and one line of the hero promise beneath in Figtree. This is the one place the crescent renders large enough to resolve, so use the two-tone source rather than the flat droplet. No gradient, no photograph, no stock imagery.

- [ ] **Step 6: Run the check**

```bash
cd web && npm run check
```

Expected: `✓ all checks pass`.

- [ ] **Step 7: Commit**

```bash
git add web/
git commit -m "feat(web): the Barrel lockup, favicons and social card

The droplet path is copied verbatim from BarrelMark.tsx so it stays
diffable against Barrel_Logo.svg. Ratios are in em, so the lockup scales
from one number.

The favicon degrades to the solid droplet below ~20px, where BarrelMark.tsx
measured the crescent as no longer resolving. The two-tone artwork is used
on the 1200x630 card, where it renders large enough to read.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

### Task 3: Layout, metadata, footer, and `/terms`

**Files:**
- Modify: `web/app/layout.tsx`
- Create: `web/components/Footer.tsx`, `web/app/terms/page.tsx`

**Interfaces:**
- Consumes: `<Lockup />` from Task 2; tokens from Task 1.
- Produces: `<Footer />`; the CSS classes `.wrap`, `.label`, `.num` available to all pages; routes `/` and `/terms` building.

- [ ] **Step 1: Add the failing check**

Append to `check.mjs` before the `if (failures.length)` block:

```js
// Task 3 — /terms must carry the material terms and the pre-launch statement
const terms = join(ROOT, 'app/terms/page.tsx');
if (existsSync(terms)) {
  const s = read(terms);
  for (const [re, name] of [
    [/90[-\s]day/i, 'the 90-day term'],
    [/has not launched|not yet launched/i, 'the pre-launch statement'],
    [/legal opinion/i, 'the legal-opinion disclosure'],
  ]) if (!re.test(s)) fail('§4.2 /terms is missing content', terms, name);
} else {
  fail('§4.2 /terms missing', terms, 'not created');
}
```

- [ ] **Step 2: Run the check to verify it fails**

```bash
cd web && npm run check
```

Expected: FAIL — `§4.2 /terms missing ... not created`.

- [ ] **Step 3: Write the layout**

`web/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { Figtree, JetBrains_Mono } from 'next/font/google';
import { Footer } from '@/components/Footer';
import './globals.css';

// next/font downloads these at BUILD time and serves them from our own
// origin, so the page makes no request to Google at runtime. That is what
// spec §5.3 is protecting — the privacy notice can stay short because there
// is no third-party request to disclose.
const figtree = Figtree({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  variable: '--font-figtree',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://getbarrel.co.za'),
  title: 'Barrel — buy fuel at today’s price',
  description:
    'Buy fuel at today’s price and use it later. Barrel is being built in South Africa. Join the waitlist.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Barrel — buy fuel at today’s price',
    description: 'Buy fuel at today’s price and use it later. Join the waitlist.',
    images: ['/og.png'],
    locale: 'en_ZA',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-ZA" className={`${figtree.variable} ${mono.variable}`}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

Add to `globals.css`:

```css
.wrap {
  max-width: var(--measure);
  margin: 0 auto;
  padding: 0 24px;
}
```

- [ ] **Step 4: Write the Footer**

`web/components/Footer.tsx`:

```tsx
import Link from 'next/link';
import { Lockup } from './Lockup';

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--hairline)', marginTop: 96, paddingTop: 32, paddingBottom: 64 }}>
      <div className="wrap">
        <Lockup size={14} />
        <p style={{ color: 'var(--text-dim)', fontSize: 15, marginTop: 16, marginBottom: 0 }}>
          Barrel is being built in South Africa. It has not launched.
        </p>
        <p style={{ marginTop: 16, marginBottom: 0, fontSize: 15 }}>
          <a href="mailto:hello@getbarrel.co.za" style={{ color: 'var(--text)' }}>hello@getbarrel.co.za</a>
        </p>
        <p style={{ marginTop: 24, marginBottom: 0, fontSize: 15, display: 'flex', gap: 20 }}>
          <Link href="/terms" style={{ color: 'var(--text-dim)' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'var(--text-dim)' }}>Privacy</Link>
        </p>
      </div>
    </footer>
  );
}
```

The domain `getbarrel.co.za` was supplied by the site owner on 10 September 2026. The mailbox `hello@getbarrel.co.za` is inferred from it and **must be confirmed to exist before launch** — a real domain does not make the address real.

- [ ] **Step 5: Write `/terms`**

This is the only page where mechanics appear, and the only page that states the product's legal position. It must be accurate rather than reassuring.

`web/app/terms/page.tsx`:

```tsx
import { Lockup } from '@/components/Lockup';
import Link from 'next/link';

export const metadata = { title: 'Terms — Barrel' };

export default function Terms() {
  return (
    <main className="wrap" style={{ paddingTop: 40, maxWidth: '34rem' }}>
      <Link href="/" style={{ color: 'var(--text)' }}><Lockup size={16} /></Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 48 }}>
        Terms and status
      </h1>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Barrel has not launched</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        Barrel is in development. It has no banking partner, no agreements with fuel
        retailers, and no legal opinion on whether the product may be offered in South
        Africa. Nothing on this site is an offer to sell, and no money can be paid to
        Barrel today.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>How the intended product works</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        The intention is that you buy fuel in litres at the pump price on the day you buy,
        and spend those litres later at a fuel station. If the pump price rises in between,
        you have already paid the earlier price.
      </p>
      <p style={{ color: 'var(--text-dim)' }}>
        <strong>Litres would hold their price for 90 days.</strong> This is a material term,
        not a detail. Under the current design, litres not used within 90 days of purchase
        would convert back to the rand value paid for them, not be forfeited. The exact
        mechanism is not final, and will be restated here before anything is sold.
      </p>
      <p style={{ color: 'var(--text-dim)' }}>
        Barrel is intended to sell price certainty, not a return. The 90-day limit caps how
        far ahead of the pump price anyone can be. No part of this is an investment, and
        nothing compounds.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>The waitlist</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        Joining the waitlist places you under no obligation and reserves nothing. See the{' '}
        <Link href="/privacy" style={{ color: 'var(--text)' }}>privacy notice</Link> for what
        happens to your email address.
      </p>
    </main>
  );
}
```

**Check the 90-day paragraph against the app spec before committing.** `docs/GAPS.md` §1.1 records that conversion-on-expiry is promised in the app and not implemented. The wording above says "would convert" and "the exact mechanism is not final" for that reason. If the product decision has since changed, change this paragraph to match — do not leave it describing something that will not happen.

- [ ] **Step 6: Run the check and the build**

```bash
cd web && npm run verify
```

Expected: build succeeds, `✓ all checks pass`. If the mechanics check fires on `Footer.tsx` or `layout.tsx`, that is correct behaviour — move the offending wording to `/terms`.

- [ ] **Step 7: Commit**

```bash
git add web/
git commit -m "feat(web): layout, metadata, footer and the terms page

/terms is the only page carrying mechanics, and the only one stating the
legal position: no bank, no station agreements, no legal opinion. The
90-day term is written as a material term rather than a detail, and hedged
as 'not final' because GAPS.md records the conversion as promised and
unimplemented.

Fonts are downloaded at build time by next/font and served from our own
origin, so the page makes no third-party request.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

### Task 4: The landing page — hero, problem, promise

Blocks 1, 2 (prose half) and 3 of spec §4.1. The chart slots into block 2 in Task 6; the form into block 4 in Task 7.

**Files:**
- Modify: `web/app/page.tsx`, `web/app/globals.css`

**Interfaces:**
- Consumes: `<Lockup />`, `.wrap`, `.label`, `.num`.
- Produces: `<main>` with `<section id="problem">` present and empty of chart, ready for Task 6.

- [ ] **Step 1: Add the failing check**

Append to `check.mjs` before the `if (failures.length)` block:

```js
// Task 4 — the landing page must carry the pre-launch status in the hero,
// and must not use call-to-action copy that implies a product to start
const page = join(ROOT, 'app/page.tsx');
if (existsSync(page)) {
  const s = read(page);
  if (!/has not launched|not launched yet|isn.t live yet/i.test(s))
    fail('§4.1 hero must state pre-launch status', page, 'no status line found');
  if (/get started|sign up now|try it free|download the app/i.test(s))
    fail('§4.1 copy implies a shipped product', page, 'CTA wording');
} else {
  fail('§4.1 landing page missing', page, 'not created');
}
```

- [ ] **Step 2: Run the check to verify it fails**

```bash
cd web && npm run check
```

Expected: FAIL — `§4.1 hero must state pre-launch status`, since the scaffold's default page has none.

- [ ] **Step 3: Write the page**

No mechanics. No figure that is not sourced. Register: dry, precise, unhyped.

`web/app/page.tsx`:

```tsx
import { Lockup } from '@/components/Lockup';

export default function Home() {
  return (
    <main>
      <div className="wrap" style={{ paddingTop: 40 }}>
        <Lockup size={16} />
      </div>

      {/* Block 1 — the promise, and the status. Nothing else. */}
      <section className="wrap" style={{ paddingTop: 96 }}>
        <p className="label">Not launched yet</p>
        <h1
          style={{
            fontSize: 'clamp(34px, 7vw, 52px)',
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '20px 0 0',
          }}
        >
          Buy fuel at today’s price.<br />Use it later.
        </h1>
        <p style={{ fontSize: 19, color: 'var(--text-dim)', marginTop: 24, maxWidth: '30rem' }}>
          Barrel is a fuel wallet for South African drivers. We’re building it now, and
          it has not launched. Join the waitlist and we’ll tell you when it does.
        </p>
      </section>

      <div className="wrap" style={{ paddingTop: 96 }}><hr className="rule" /></div>

      {/* Block 2 — the problem. The chart lands here in Task 6. */}
      <section id="problem" className="wrap" style={{ paddingTop: 48 }}>
        <p className="label">The problem</p>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 34px)', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>
          The price changes on the first Wednesday of every month.
        </h2>
        <p style={{ fontSize: 18, color: 'var(--text-dim)', marginTop: 20, maxWidth: '32rem' }}>
          You find out when you get to the pump. You have no say in it, no warning that
          lands anywhere useful, and no way to buy at last month’s price once it’s gone.
        </p>
      </section>

      <div className="wrap" style={{ paddingTop: 96 }}><hr className="rule" /></div>

      {/* Block 3 — the promise restated. Outcome only; no mechanic named. */}
      <section className="wrap" style={{ paddingTop: 48 }}>
        <p className="label">What changes</p>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 34px)', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>
          You’ve already paid.
        </h2>
        <p style={{ fontSize: 18, color: 'var(--text-dim)', marginTop: 20, maxWidth: '32rem' }}>
          With Barrel you buy fuel when the price suits you and spend it when you need it,
          at any station. On the morning the price goes up, nothing about your tank
          changes. That’s the whole product — certainty about what you’ve paid, not a
          return on it.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Run the check and the build**

```bash
cd web && npm run verify
```

Expected: build succeeds, `✓ all checks pass`.

- [ ] **Step 5: Look at it**

```bash
cd web && npm run dev
```

Open `http://localhost:3000`. Confirm by eye: nothing centred, no card grid, one typeface for prose and one for the small labels, no colour on the page yet except black on white. If it already looks like a generated landing page at this stage, stop and say so — the remaining tasks will not fix it.

- [ ] **Step 6: Commit**

```bash
git add web/
git commit -m "feat(web): the hero, the problem and the promise

Three of the five blocks, no mechanics in any of them. The hero states
pre-launch status in the label position rather than a banner, so it is
read rather than dismissed. Button copy is deferred to the form task; the
check now rejects 'Get started' and its neighbours outright.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

### Task 5: Source the fuel price data

**This task is research, not implementation.** Its deliverable is a verified dataset with provenance. Do not proceed to Task 6 until it is real.

**Files:**
- Create: `web/data/fuel-prices.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export type FuelPricePoint = { month: string; pricePerLitre: number };
  export const FUEL_PRICES: FuelPricePoint[];
  export const FUEL_PRICE_SOURCE: { source: string; retrieved: string; grade: string; zone: string };
  ```
  `month` is `YYYY-MM`. `pricePerLitre` is rand per litre to two decimals.

- [ ] **Step 1: Retrieve the figures**

Sources, in order of authority:

1. The Department of Mineral Resources and Energy's published fuel price tables — the official record.
2. The Automobile Association of South Africa's monthly fuel price releases — used to cross-check.

Retrieve **95 Unleaded, inland (Gauteng)**, monthly, for the twelve most recent published months. One series only.

**Both sources must agree on every month.** Where they disagree, use the DMRE figure and record the discrepancy in the file header. Where a month cannot be verified from either, the range shortens — do not interpolate, and do not estimate.

- [ ] **Step 2: Write the data file with its provenance**

`web/data/fuel-prices.ts`. Fill `FUEL_PRICES` with the retrieved figures — twelve entries, oldest first — and complete every field of the header from what was actually retrieved:

```ts
// South African petrol prices, published figures.
//
//   source:    <the DMRE page URL the figures were taken from>
//   retrieved: <YYYY-MM-DD the figures were retrieved>
//   grade:     95 Unleaded
//   zone:      Inland (Gauteng)
//   crosscheck: <the AA URL used to verify, and any discrepancy found>
//
// These are REAL published prices. src/data/prices.ts in this repository is
// invented demo data with a fictional 2026 supply shock and pinned September
// and October values; it must never be imported here or anywhere in web/.
// See the website spec §7.

export type FuelPricePoint = { month: string; pricePerLitre: number };

export const FUEL_PRICE_SOURCE = {
  source: '<url>',
  retrieved: '<YYYY-MM-DD>',
  grade: '95 Unleaded',
  zone: 'Inland (Gauteng)',
} as const;

export const FUEL_PRICES: FuelPricePoint[] = [
  // { month: '2025-10', pricePerLitre: 00.00 },  ← twelve real rows, oldest first
];
```

- [ ] **Step 3: Verify the file**

```bash
cd web && npm run check
```

Expected: PASS. If `§7 price series is empty` fires, the retrieval did not succeed — **do not fill it with plausible numbers**. Report that the figures could not be sourced, cut the chart, and skip Task 6; block 2 then carries itself in the prose already written in Task 4.

- [ ] **Step 4: Sanity-check the numbers by eye**

Every value should sit in a believable band for South African petrol, and the series should move in the increments the DMRE actually publishes rather than smoothly. A suspiciously smooth curve means the figures were estimated, not retrieved.

- [ ] **Step 5: Commit**

```bash
git add web/data/fuel-prices.ts web/scripts/check.mjs
git commit -m "data(web): twelve months of published inland 95 ULP prices

Real DMRE figures, cross-checked against the AA, with the source URL and
retrieval date recorded in the file. The check script asserts the
provenance fields are present and the series is non-empty.

src/data/prices.ts is deliberately not the source: it is invented demo
data with a fictional supply shock, and publishing it as South African
fuel history would be fabricating a record.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

### Task 6: The price chart

Skip this task entirely if Task 5 could not source verified figures.

**Files:**
- Create: `web/components/PriceChart.tsx`
- Modify: `web/app/page.tsx` (block 2)

**Interfaces:**
- Consumes: `FUEL_PRICES`, `FUEL_PRICE_SOURCE` from Task 5.
- Produces: `<PriceChart />` — takes no props; reads the data module directly.

- [ ] **Step 1: Add the failing check**

Append to `check.mjs` before the `if (failures.length)` block:

```js
// Task 6 — the chart must label its grade, zone and source on the page
const chart = join(ROOT, 'components/PriceChart.tsx');
if (existsSync(chart)) {
  const s = read(chart);
  for (const field of ['grade', 'zone', 'source'])
    if (!s.includes(`FUEL_PRICE_SOURCE.${field}`))
      fail('§7 chart must display its provenance', chart, `FUEL_PRICE_SOURCE.${field}`);
}
```

- [ ] **Step 2: Run the check to verify it fails**

```bash
cd web && npm run check
```

Expected: no failure yet (the file does not exist). Create an empty `web/components/PriceChart.tsx`, re-run, and confirm three failures appear. This proves the check is wired before the component is written.

- [ ] **Step 3: Write the chart**

Inline SVG, no library. Hairline axes, monospaced numerals, no gradient fill, no animation.

`web/components/PriceChart.tsx`:

```tsx
import { FUEL_PRICES, FUEL_PRICE_SOURCE } from '@/data/fuel-prices';

const W = 640;
const H = 260;
const PAD = { top: 16, right: 8, bottom: 32, left: 44 };

export function PriceChart() {
  const values = FUEL_PRICES.map(p => p.pricePerLitre);
  const min = Math.floor(Math.min(...values) * 2) / 2;
  const max = Math.ceil(Math.max(...values) * 2) / 2;

  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (i / (FUEL_PRICES.length - 1)) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;

  const line = FUEL_PRICES.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.pricePerLitre)}`).join(' ');

  const first = FUEL_PRICES[0];
  const last = FUEL_PRICES[FUEL_PRICES.length - 1];
  const monthLabel = (m: string) =>
    new Date(`${m}-01T00:00:00Z`).toLocaleDateString('en-ZA', { month: 'short', year: '2-digit', timeZone: 'UTC' });

  return (
    <figure style={{ margin: '32px 0 0' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={`${FUEL_PRICE_SOURCE.grade} in ${FUEL_PRICE_SOURCE.zone}, from R${first.pricePerLitre.toFixed(2)} in ${monthLabel(first.month)} to R${last.pricePerLitre.toFixed(2)} in ${monthLabel(last.month)} per litre.`}
      >
        {[min, (min + max) / 2, max].map(v => (
          <g key={v}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(v)} y2={y(v)} stroke="var(--hairline)" strokeWidth="1" />
            <text
              x={PAD.left - 8} y={y(v)} textAnchor="end" dominantBaseline="middle"
              fill="var(--text-muted)" fontSize="11"
              style={{ fontFamily: 'var(--font-mono), monospace' }}
            >
              {v.toFixed(2)}
            </text>
          </g>
        ))}

        <path d={line} fill="none" stroke="var(--text)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {[[0, first], [FUEL_PRICES.length - 1, last]].map(([i, p]) => (
          <text
            key={p.month} x={x(i as number)} y={H - 10}
            textAnchor={i === 0 ? 'start' : 'end'}
            fill="var(--text-muted)" fontSize="11"
            style={{ fontFamily: 'var(--font-mono), monospace' }}
          >
            {monthLabel(p.month)}
          </text>
        ))}
      </svg>

      <figcaption className="label" style={{ marginTop: 16, lineHeight: 1.6 }}>
        {FUEL_PRICE_SOURCE.grade} · {FUEL_PRICE_SOURCE.zone} · rand per litre
        <br />
        Source: {FUEL_PRICE_SOURCE.source}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 4: Drop it into block 2**

In `web/app/page.tsx`, import `PriceChart` and place `<PriceChart />` immediately after the closing `</p>` of the `#problem` section, inside the section.

- [ ] **Step 5: Run the check and the build**

```bash
cd web && npm run verify
```

Expected: build succeeds, `✓ all checks pass`.

- [ ] **Step 6: Look at it**

Open `http://localhost:3000` at both 390px and 1440px width. The line must fill its box rather than sitting in a band across the middle — `HANDOVER.md` records exactly that bug shipping in the app and surviving all 260 tests, because a chart's geometry is not something a unit test notices.

- [ ] **Step 7: Commit**

```bash
git add web/
git commit -m "feat(web): the twelve-month petrol price chart

Inline SVG, no library, hairline axes and monospaced numerals, following
the app's chart rules. It carries its grade, zone and source on the page,
because an unlabelled fuel price chart misleads regardless of intent, and
the check script asserts all three are rendered.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

### Task 7: The waitlist form and `/privacy`

The vendor is decided here, so `/privacy` — which must name the processor — is written in the same task.

**Files:**
- Create: `web/components/WaitlistForm.tsx`, `web/app/privacy/page.tsx`
- Modify: `web/app/page.tsx` (block 4), `web/app/globals.css` (the one amber)

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: `<WaitlistForm />` — an uncontrolled form posting to the vendor endpoint.

- [ ] **Step 1: Choose the vendor against current documentation**

Default choice is **Buttondown**; fallback is **Kit**. Check the live documentation before writing anything — this plan was written in September 2026 against knowledge that runs to May 2026, so endpoints, pricing and spam handling may have moved.

Assess in this priority order (spec §8):

1. Spam protection that works with no server. With static export this is the entire defence.
2. Double opt-in — also the cleanest POPIA consent record.
3. A plain HTML `POST` endpoint. **An iframe embed disqualifies a vendor outright**, because the form must be our own markup for the design rules to apply.
4. Unsubscribe handling and list export.

Record the choice and the endpoint URL in a comment at the top of `WaitlistForm.tsx`.

- [ ] **Step 2: Add the failing check**

Append to `check.mjs` before the `if (failures.length)` block:

```js
// Task 7 — the form states its purpose at the point of collection, and the
// privacy notice names the processor and the cross-border transfer
const form = join(ROOT, 'components/WaitlistForm.tsx');
if (existsSync(form)) {
  const s = read(form);
  if (/<iframe/i.test(s)) fail('§8 iframe embeds are disqualified', form, '<iframe>');
  if (/Get started|Sign up now/i.test(s)) fail('§4.1 button copy implies a shipped product', form, 'label');
}
const privacy = join(ROOT, 'app/privacy/page.tsx');
if (existsSync(privacy)) {
  const s = read(privacy);
  for (const [re, name] of [
    [/outside South Africa|cross-border|transferred to servers/i, 'the cross-border transfer'],
    [/unsubscribe|remove|opt out/i, 'the removal path'],
  ]) if (!re.test(s)) fail('§8 privacy notice incomplete', privacy, name);
} else {
  fail('§8 /privacy missing', privacy, 'not created');
}
```

- [ ] **Step 3: Run the check to verify it fails**

```bash
cd web && npm run check
```

Expected: FAIL — `§8 /privacy missing ... not created`.

- [ ] **Step 4: Add the amber button styles**

Append to `web/app/globals.css`. This is the only place `#FF6A00` appears anywhere in the project:

```css
/* The one amber, and the only place this literal appears. Black label at
   7.31:1, not white at 2.87:1 — the app's Button.tsx uses t.inverse here,
   which is white in light mode and below the AA floor. The ink border is
   Button.tsx's needsEdge rule: amber is 2.87:1 against white, so without a
   border the fill has no defined edge. */
.button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 52px;
  padding: 0 24px;
  border-radius: var(--radius);
  background: var(--accent);
  color: #000000;
  border: 1px solid #000000;
  font-family: var(--font-figtree), system-ui, sans-serif;
  font-size: 15px;
  font-weight: 800;
  letter-spacing: 0.45px;
  cursor: pointer;
  transition: opacity 120ms ease;
}

/* Press and hover dim rather than recolour — the app dims too, and a second
   amber here would put two accent values in the stylesheet. */
.button:hover { opacity: 0.9; }
.button:active { opacity: 0.8; }

.field {
  width: 100%;
  min-height: 52px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-figtree), system-ui, sans-serif;
  font-size: 17px;
}
```

- [ ] **Step 5: Write the form**

Replace the endpoint and the honeypot field name with the ones the chosen vendor's current documentation specifies.

`web/components/WaitlistForm.tsx`:

```tsx
// Vendor: <name>, chosen <date> against its live documentation.
// Endpoint: <url>
// Chosen on: server-free spam protection, double opt-in, a plain POST
// endpoint (no iframe), and list export — in that order. See spec §8.
//
// Static export means there is no server here to filter anything. The
// vendor's spam handling is the whole defence.

const ENDPOINT = '<vendor endpoint url>';

export function WaitlistForm() {
  return (
    <form action={ENDPOINT} method="post" style={{ marginTop: 32, maxWidth: '26rem' }}>
      <label htmlFor="email" className="label" style={{ display: 'block', marginBottom: 10 }}>
        Email address
      </label>

      <input
        id="email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.co.za"
        className="field"
      />

      {/* Honeypot. Hidden from people, filled by bots. The vendor discards
          any submission that carries a value here. */}
      <input
        type="text"
        name="hp"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1 }}
      />

      <button type="submit" className="button" style={{ marginTop: 16, width: '100%' }}>
        Join the waitlist
      </button>

      {/* POPIA: purpose stated at the point of collection, not buried. */}
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16, marginBottom: 0 }}>
        We’ll email you once, when Barrel launches. Nothing else. You’ll get a
        confirmation email first — Barrel can’t add you without it. See the{' '}
        <a href="/privacy" style={{ color: 'var(--text)' }}>privacy notice</a>.
      </p>
    </form>
  );
}
```

- [ ] **Step 6: Drop it into block 4**

In `web/app/page.tsx`, add the import alongside the existing `Lockup` import:

```tsx
import { WaitlistForm } from '@/components/WaitlistForm';
```

then add after block 3:

```tsx
      <div className="wrap" style={{ paddingTop: 96 }}><hr className="rule" /></div>

      <section id="waitlist" className="wrap" style={{ paddingTop: 48 }}>
        <p className="label">The waitlist</p>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 34px)', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>
          We’ll tell you when it’s real.
        </h2>
        <WaitlistForm />
      </section>
```

- [ ] **Step 7: Write `/privacy`**

`web/app/privacy/page.tsx`. Replace `<vendor>` and `<jurisdiction>` with the chosen processor and where it stores data:

```tsx
import { Lockup } from '@/components/Lockup';
import Link from 'next/link';

export const metadata = { title: 'Privacy — Barrel' };

export default function Privacy() {
  return (
    <main className="wrap" style={{ paddingTop: 40, maxWidth: '34rem' }}>
      <Link href="/" style={{ color: 'var(--text)' }}><Lockup size={16} /></Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 48 }}>
        Privacy notice
      </h1>
      <p style={{ color: 'var(--text-dim)' }}>
        This site collects one thing: an email address, and only if you type it in.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>What we do with it</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        We email you when Barrel launches. We do not sell it, share it, or use it for
        anything else. You will receive a confirmation email first, and you are not on
        the list until you click it.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Who holds it</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        The list is held by <strong>&lt;vendor&gt;</strong>, which stores data on servers
        outside South Africa, in &lt;jurisdiction&gt;. Under POPIA this is a cross-border
        transfer, and by joining the waitlist you consent to it. If you would rather not,
        do not join the list — email us instead and we will note your interest by reply.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Getting removed</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        Every email we send carries an unsubscribe link. You can also write to{' '}
        <a href="mailto:hello@getbarrel.co.za" style={{ color: 'var(--text)' }}>hello@getbarrel.co.za</a>{' '}
        and we will delete you from the list.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>What we don’t do</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        No analytics, no tracking pixels, no advertising cookies. This site sets no
        cookies at all, and makes no request to any third party until you submit the form.
        That is why this notice is short.
      </p>
    </main>
  );
}
```

- [ ] **Step 8: Run the check and the build**

```bash
cd web && npm run verify
```

Expected: build succeeds, `✓ all checks pass`. The `§9 third-party origin` check will now flag the vendor endpoint in the built output — add its host to the `ALLOWED` list in `check.mjs` with a comment saying it is the form endpoint, since that is the one third-party origin the spec permits.

- [ ] **Step 9: Submit the form for real**

Use a real address you control. Confirm: the confirmation email arrives, clicking it adds you to the list, and the unsubscribe link works. A waitlist that silently drops submissions is worse than no waitlist, and only an end-to-end submission proves it does not.

- [ ] **Step 10: Commit**

```bash
git add web/
git commit -m "feat(web): the waitlist form and the privacy notice

Our own markup posting to the vendor, not an iframe, so the design rules
apply to it. Black on amber at 7.31:1 rather than the app's white at
2.87:1, with the ink border Button.tsx uses because amber has no defined
edge against white.

POPIA: purpose at the point of collection, double opt-in as the consent
record, the processor and its cross-border transfer named, a removal path.
No analytics, so there is nothing else to disclose.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

### Task 8: Full verification and deployment

**Files:**
- Modify: `docs/HANDOVER.md` (a short section pointing at `web/`)

**Interfaces:**
- Consumes: everything.
- Produces: a deployed site and a screenshot pair for review.

- [ ] **Step 1: Confirm the Expo app is still untouched**

```bash
cd /Users/emilfabel/Barrel_fin && npm test && npx tsc --noEmit && git status --short
```

Expected: 260 tests pass, tsc silent, and no modification to `app/`, `src/` or the root `package.json`.

- [ ] **Step 2: Run the full gate**

```bash
cd web && npm run verify
```

Expected: `✓ all checks pass`.

- [ ] **Step 3: Screenshot both widths**

Open the built site in Chrome at 390px and at 1440px. Capture both. Check by eye, against spec §5.1:

- Nothing centred; no card grid; no icons; no gradient.
- Amber appears exactly once, on the button, with a black label and a visible edge.
- Every numeral is monospaced.
- Tab through the page: focus is visible on the input and the button.
- The chart fills its box rather than banding across the middle.

- [ ] **Step 4: Content check**

Read the built page top to bottom. Confirm no mechanic from spec §2.1 appears outside `/terms`, every figure traces to `web/data/fuel-prices.ts`, and no sentence implies a return or that savings accumulate.

- [ ] **Step 5: Deploy**

Create a Vercel project with **Root Directory `web/`**, build command `next build`, output directory `out`. No environment variables. Deploy a preview first, run Step 3's eye checks against the preview URL, then promote.

- [ ] **Step 6: Note it in the handover**

Add a short section to `docs/HANDOVER.md` under a `## The website` heading: that `web/` is an independent Next.js project with its own lockfile, that it is verified by `npm run check` rather than tests, that its spec is `docs/superpowers/specs/2026-09-09-barrel-website-design.md`, and — most importantly — that `src/data/prices.ts` must never be imported into it.

- [ ] **Step 7: Commit**

```bash
git add docs/HANDOVER.md web/
git commit -m "docs: note the website in the handover, and deploy

web/ is an independent Next.js project verified by npm run check rather
than by tests. The rule worth carrying forward into any future session:
src/data/prices.ts is invented demo data and must never reach the public
site.

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01LFL9SF5tT5tS8ckLHYMM3g"
```

---

## Notes for the executor

**If the site looks generated at any checkpoint, stop and say so.** The checks in `check.mjs` catch the mechanical tells — gradients, icon libraries, centred text, stray colours — but they cannot catch limp copy, timid spacing, or a layout that has no point of view. That judgement is Step 5 of Task 4 and Step 3 of Task 8, and it is the actual acceptance criterion.

**Do not invent a figure.** Not a price, not a date, not a count of users, not a saving. Every number on this site comes from `web/data/fuel-prices.ts` or does not appear.

**The `<angle bracket>` slots are required research outputs, not optional.** The DMRE
source URL, the retrieval date, the vendor name, its endpoint and its jurisdiction cannot
be written into a plan without inventing them, and inventing them is precisely what §7
forbids. Each has a step saying how to obtain it. A slot left unfilled is an unfinished
task, and the check script fails on the ones it can see.

**Do not add a page, a section, or a dependency that is not in this plan.** The spec's §10 is short and deliberate: no analytics, no FAQ, no blog, no app-store badges, no dark mode, no link to the prototype.
