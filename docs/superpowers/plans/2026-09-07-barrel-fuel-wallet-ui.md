# Barrel Fuel Wallet UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a navigable Expo/React Native UI shell for Barrel — a South African prepaid fuel wallet denominated in litres — over in-memory mock data, at high fidelity to the source Claude Design canvas.

**Architecture:** File-based routing via expo-router, with a five-tab bar and pushed stack screens. All arithmetic lives in pure, React-free modules under `src/lib/` and is unit-tested; a zustand store wraps those functions and holds seeded state. Litres are held as dated **lots** (not a scalar balance) so expiry, FIFO consumption, and savings are all derivable from one structure. Theming is token-based with no raw hex values in components.

**Tech Stack:** Expo SDK 54, React Native, TypeScript, expo-router, zustand, react-native-svg, @expo-google-fonts/outfit, expo-haptics, jest + jest-expo.

**Spec:** `docs/superpowers/specs/2026-09-06-barrel-fuel-wallet-design.md`

## Global Constraints

Copied verbatim from the spec. Every task's requirements implicitly include this section.

- **v1 is petrol 95 only.** `type Grade = '95'` — a single-member union, so diesel can be added later without changing signatures. No diesel anywhere in UI, seed, or copy.
- **Colour tokens, dark / light:** `bg` `#000000`/`#FFFFFF` · `bgRaised` `#0A0A0A`/`#FFFFFF` · `surface` `#1A1A1A`/`#EDEBE7` · `border` `#2E2E2E`/`#D5D2CC` · `hairline` `#1F1F1F`/`#E2DFDA` · `textMuted` `#6B6B6B`/`#6B6B6B` · `textDim` `#A8A8A8`/`#A8A8A8` · `text` `#FFFFFF`/`#000000` · `inverse` `#000000`/`#FFFFFF`
- **Accents, identical in both themes:** `accent` `#D9541E` (primary CTA, rising prices, expiry warnings) · `positive` `#C6F24E` (savings, credits, falling prices, active toggles)
- **No component may reference a raw hex value.** All colour comes from `useTheme()`.
- **Geometry:** border radius **3px on buttons only** — cards, chips, tabs and inputs are square. Borders always 1px. **No shadows, no gradients, no blur.** Screen horizontal padding 26px. Primary button height 58px; in-card CTA 54px; keypad key 62px.
- **Typography:** Outfit 300–900. Numeric hero = Outfit 800, `fontVariant: ['tabular-nums']`, letterSpacing −0.045em converted to points at call site. Section labels = platform monospace 600, 10px, 0.16em, uppercase, `textMuted`.
- **Fixed data:** price `R21.87/L` petrol 95 Gauteng inland (+0.55%); balance `42.6 L`; app "today" is **30 September 2026**; holder Thabo Makhubela (`TM`), `+27 82 123 4567`, card `•••• 4127`, vehicle `CA 418 921`, payment `FNB ••4127`; footer `Barrel v2.4.0 · FSP number pending`.
- **Guardrails:** 90-day redemption window; 150 L per-vehicle monthly cap; expiry converts litres back to rand paid, never to zero.
- **Package manager:** npm. **Node:** 20+.

---

## File Structure

| Path | Responsibility |
|---|---|
| `src/lib/format.ts` | Number, litre, rand and date formatting. No domain logic. |
| `src/lib/lots.ts` | Lot expiry, FIFO consumption, balance. Pure. |
| `src/lib/caps.ts` | Monthly cap arithmetic. Pure. |
| `src/lib/savings.ts` | Savings and average buy price. Pure. |
| `src/lib/cardfill.ts` | Zone resolution, price lookup, litre derivation, descriptor normalisation. Pure. |
| `src/data/types.ts` | Shared domain types. No logic. |
| `src/data/prices.ts` | Zone price table keyed by zone + effective date. |
| `src/data/stations.ts` | Seeded station list. |
| `src/data/seed.ts` | Builds the opening lot/ledger state. |
| `src/theme/tokens.ts` | Dark and light token sets. |
| `src/theme/ThemeProvider.tsx` | Context + `useTheme()`. |
| `src/store/wallet.ts` | zustand store wrapping `src/lib/`. |
| `src/components/*` | `Num`, `Screen`, `ScreenHeader`, `Rule`, `Row`, `Button`, `Toggle`, `SectionLabel`, `BarrelMark`, `PhoneChrome`. |
| `app/*` | Routes only — layout and composition, no arithmetic. |

Tasks 1–7 build the tested core with no UI. Tasks 8–11 build the design system and shell. Tasks 12–19 build screens. Each screen task is independently reviewable.

---

### Task 1: Project scaffold and test harness

**Files:**
- Create: `package.json`, `tsconfig.json`, `app.json`, `babel.config.js`, `jest.config.js`, `app/_layout.tsx`, `app/index.tsx`
- Test: `src/lib/__tests__/harness.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces: a working `npm test` and `npm start`

- [ ] **Step 1: Scaffold the Expo project**

```bash
npx create-expo-app@latest . --template blank-typescript --yes
npm install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar zustand react-native-svg expo-haptics @expo-google-fonts/outfit expo-font
npm install --save-dev jest jest-expo @types/jest @testing-library/react-native
```

- [ ] **Step 2: Configure expo-router entry point**

Set `"main": "expo-router/entry"` in `package.json`. Add to `app.json` under `expo`:

```json
{
  "scheme": "barrel",
  "plugins": ["expo-router"],
  "userInterfaceStyle": "automatic"
}
```

- [ ] **Step 3: Add jest config and scripts**

`jest.config.js`:

```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};
```

In `package.json` scripts: `"test": "jest"`, `"test:watch": "jest --watch"`.

- [ ] **Step 4: Write a harness test that fails**

`src/lib/__tests__/harness.test.ts`:

```ts
import { ping } from '../format';

test('test harness runs and imports from src/lib', () => {
  expect(ping()).toBe('pong');
});
```

- [ ] **Step 5: Run it and confirm it fails**

Run: `npm test -- harness`
Expected: FAIL — `Cannot find module '../format'`

- [ ] **Step 6: Create the module to make it pass**

`src/lib/format.ts`:

```ts
export function ping(): string {
  return 'pong';
}
```

- [ ] **Step 7: Run and confirm it passes**

Run: `npm test -- harness`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo project with expo-router and jest"
```

---

### Task 2: Formatting primitives

**Files:**
- Modify: `src/lib/format.ts`
- Test: `src/lib/__tests__/format.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `formatLitres(n: number): string` — 1 decimal, thousands grouped
  - `formatRand(n: number): string` — 2 decimals, thousands grouped
  - `formatRandWhole(n: number): string` — 0 decimals, thousands grouped
  - `formatPrice(n: number): string` — 2 decimals, no grouping
  - `formatDayMonth(d: Date): string` — `27 Dec`

- [ ] **Step 1: Write the failing tests**

`src/lib/__tests__/format.test.ts`:

```ts
import { formatLitres, formatRand, formatRandWhole, formatPrice, formatDayMonth } from '../format';

describe('formatLitres', () => {
  test('one decimal place', () => expect(formatLitres(42.6)).toBe('42.6'));
  test('pads a whole number', () => expect(formatLitres(42)).toBe('42.0'));
  test('rounds to one decimal', () => expect(formatLitres(36.5847)).toBe('36.6'));
  test('groups thousands', () => expect(formatLitres(1234.5)).toBe('1,234.5'));
  test('handles zero', () => expect(formatLitres(0)).toBe('0.0'));
});

describe('formatRand', () => {
  test('two decimals', () => expect(formatRand(931.66)).toBe('931.66'));
  test('groups four digits', () => expect(formatRand(1284)).toBe('1,284.00'));
  test('groups seven digits', () => expect(formatRand(1234567.89)).toBe('1,234,567.89'));
});

describe('formatRandWhole', () => {
  test('no decimals', () => expect(formatRandWhole(1500)).toBe('1,500'));
  test('handles zero', () => expect(formatRandWhole(0)).toBe('0'));
});

describe('formatPrice', () => {
  test('two decimals, no grouping', () => expect(formatPrice(21.87)).toBe('21.87'));
});

describe('formatDayMonth', () => {
  test('formats day and short month', () => {
    expect(formatDayMonth(new Date(2026, 11, 27))).toBe('27 Dec');
  });
  test('does not zero-pad a single-digit day', () => {
    expect(formatDayMonth(new Date(2026, 8, 4))).toBe('4 Sep');
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- format`
Expected: FAIL — the named exports do not exist.

- [ ] **Step 3: Implement**

Replace the contents of `src/lib/format.ts`:

```ts
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fixed(n: number, dp: number): string {
  const [i, f] = n.toFixed(dp).split('.');
  const g = group(i);
  return f ? `${g}.${f}` : g;
}

export const formatLitres = (n: number): string => fixed(n, 1);
export const formatRand = (n: number): string => fixed(n, 2);
export const formatRandWhole = (n: number): string => fixed(n, 0);
export const formatPrice = (n: number): string => n.toFixed(2);

export function formatDayMonth(d: Date): string {
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}
```

Delete the `ping` export and `src/lib/__tests__/harness.test.ts`.

- [ ] **Step 4: Run and confirm pass**

Run: `npm test -- format`
Expected: PASS, 12 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add number and date formatting primitives"
```

---

### Task 3: Domain types and zone price table

**Files:**
- Create: `src/data/types.ts`, `src/data/prices.ts`
- Test: `src/data/__tests__/prices.test.ts`

**Interfaces:**
- Consumes: nothing
- Produces:
  - `type Grade = '95'`, `type Zone = 'inland' | 'coastal'`
  - `type Lot`, `type LedgerEntry`, `type CardFill`, `type Station`, `type PricePoint`
  - `PRICES: PricePoint[]`
  - `priceOn(zone: Zone, at: Date): number`

- [ ] **Step 1: Write the failing tests**

`src/data/__tests__/prices.test.ts`:

```ts
import { priceOn } from '../prices';

describe('priceOn', () => {
  test('returns the inland price for a date inside September', () => {
    expect(priceOn('inland', new Date(2026, 8, 30))).toBe(21.87);
  });
  test('coastal is cheaper than inland on the same date', () => {
    expect(priceOn('coastal', new Date(2026, 8, 30))).toBeLessThan(
      priceOn('inland', new Date(2026, 8, 30))
    );
  });
  test('uses the previous month price the day before a change', () => {
    // October price takes effect 07 Oct 2026 (first Wednesday)
    expect(priceOn('inland', new Date(2026, 9, 6))).toBe(21.87);
  });
  test('uses the new price on the effective date itself', () => {
    expect(priceOn('inland', new Date(2026, 9, 7))).toBe(21.99);
  });
  test('throws for a date before the table starts', () => {
    expect(() => priceOn('inland', new Date(2020, 0, 1))).toThrow(/no price/i);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- prices`
Expected: FAIL — `Cannot find module '../prices'`

- [ ] **Step 3: Implement types**

`src/data/types.ts`:

```ts
export type Grade = '95';
export type Zone = 'inland' | 'coastal';

export type Lot = {
  id: string;
  grade: Grade;
  litres: number;
  pricePerLitre: number;
  purchasedAt: Date;
  expiresAt: Date;
};

export type CardFill = {
  merchantDescriptor: string;
  stationId: string | null;
  mcc: '5541' | '5542';
  randAmount: number;
  zone: Zone;
  pricePerLitre: number;
  litres: number;
  disputed: boolean;
};

export type LedgerEntry = {
  id: string;
  kind: 'topup' | 'fill' | 'bonus' | 'expiry';
  what: string;
  when: Date;
  detail: string;
  grade: Grade;
  deltaLitres: number;
  balanceAfter: number;
  lotIds?: string[];
  card?: CardFill;
};

export type Station = {
  id: string;
  name: string;
  brand: string;
  suburb: string;
  hours: string;
  km: number;
  zone: Zone;
};

export type PricePoint = {
  zone: Zone;
  effectiveFrom: Date;
  pricePerLitre: number;
};
```

- [ ] **Step 4: Implement the price table**

`src/data/prices.ts`:

```ts
import { PricePoint, Zone } from './types';

// DMPR sets petrol prices by zone, effective the first Wednesday of each month.
// Coastal runs roughly R0.60/L below inland.
export const PRICES: PricePoint[] = [
  { zone: 'inland',  effectiveFrom: new Date(2026, 2, 4),  pricePerLitre: 20.94 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 2, 4),  pricePerLitre: 20.32 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 3, 1),  pricePerLitre: 21.12 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 3, 1),  pricePerLitre: 20.50 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 4, 6),  pricePerLitre: 21.35 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 4, 6),  pricePerLitre: 20.73 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 5, 3),  pricePerLitre: 21.08 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 5, 3),  pricePerLitre: 20.46 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 6, 1),  pricePerLitre: 21.61 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 6, 1),  pricePerLitre: 20.99 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 7, 5),  pricePerLitre: 21.75 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 7, 5),  pricePerLitre: 21.13 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 8, 2),  pricePerLitre: 21.87 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 8, 2),  pricePerLitre: 21.25 },
  { zone: 'inland',  effectiveFrom: new Date(2026, 9, 7),  pricePerLitre: 21.99 },
  { zone: 'coastal', effectiveFrom: new Date(2026, 9, 7),  pricePerLitre: 21.37 },
];

export function priceOn(zone: Zone, at: Date): number {
  const candidates = PRICES
    .filter(p => p.zone === zone && p.effectiveFrom.getTime() <= at.getTime())
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime());
  if (candidates.length === 0) {
    throw new Error(`no price for ${zone} on ${at.toISOString()}`);
  }
  return candidates[0].pricePerLitre;
}
```

- [ ] **Step 5: Run and confirm pass**

Run: `npm test -- prices`
Expected: PASS, 5 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add domain types and zone-keyed price table"
```

---

### Task 4: Lot expiry and FIFO consumption

**Files:**
- Create: `src/lib/lots.ts`
- Test: `src/lib/__tests__/lots.test.ts`

**Interfaces:**
- Consumes: `Lot` from `src/data/types`
- Produces:
  - `activeLots(lots: Lot[], at: Date): Lot[]`
  - `balanceOf(lots: Lot[], at: Date): number`
  - `expiringWithin(lots: Lot[], at: Date, days: number): number`
  - `consumeFifo(lots: Lot[], litres: number, at: Date): { lots: Lot[]; consumedIds: string[] }` — throws on insufficient balance

- [ ] **Step 1: Write the failing tests**

`src/lib/__tests__/lots.test.ts`:

```ts
import { activeLots, balanceOf, expiringWithin, consumeFifo } from '../lots';
import { Lot } from '../../data/types';

const lot = (id: string, litres: number, purchased: Date, expires: Date, price = 21.0): Lot => ({
  id, grade: '95', litres, pricePerLitre: price, purchasedAt: purchased, expiresAt: expires,
});

const AT = new Date(2026, 8, 30);
const older = lot('a', 10, new Date(2026, 6, 1), new Date(2026, 9, 30));
const newer = lot('b', 20, new Date(2026, 7, 1), new Date(2026, 10, 30));
const expired = lot('c', 5, new Date(2026, 4, 1), new Date(2026, 8, 1));

describe('activeLots', () => {
  test('excludes lots whose expiry has passed', () => {
    expect(activeLots([older, expired], AT).map(l => l.id)).toEqual(['a']);
  });
  test('a lot expiring exactly now is still active', () => {
    const edge = lot('d', 1, new Date(2026, 6, 1), AT);
    expect(activeLots([edge], AT).map(l => l.id)).toEqual(['d']);
  });
});

describe('balanceOf', () => {
  test('sums only active lots', () => expect(balanceOf([older, newer, expired], AT)).toBe(30));
  test('empty is zero', () => expect(balanceOf([], AT)).toBe(0));
});

describe('expiringWithin', () => {
  test('counts litres expiring inside the window', () => {
    expect(expiringWithin([older, newer], AT, 30)).toBe(10);
  });
  test('excludes litres expiring after the window', () => {
    expect(expiringWithin([newer], AT, 30)).toBe(0);
  });
});

describe('consumeFifo', () => {
  test('takes from the oldest lot first', () => {
    const { lots, consumedIds } = consumeFifo([newer, older], 4, AT);
    expect(consumedIds).toEqual(['a']);
    expect(lots.find(l => l.id === 'a')!.litres).toBe(6);
    expect(lots.find(l => l.id === 'b')!.litres).toBe(20);
  });
  test('spans multiple lots when one is not enough', () => {
    const { lots, consumedIds } = consumeFifo([newer, older], 15, AT);
    expect(consumedIds).toEqual(['a', 'b']);
    expect(lots.find(l => l.id === 'a')).toBeUndefined();
    expect(lots.find(l => l.id === 'b')!.litres).toBe(15);
  });
  test('an exactly drained lot is removed', () => {
    const { lots } = consumeFifo([older], 10, AT);
    expect(lots).toHaveLength(0);
  });
  test('skips expired lots entirely', () => {
    const { lots, consumedIds } = consumeFifo([expired, older], 3, AT);
    expect(consumedIds).toEqual(['a']);
    expect(lots.find(l => l.id === 'c')!.litres).toBe(5);
  });
  test('throws when active balance is insufficient', () => {
    expect(() => consumeFifo([older], 50, AT)).toThrow(/insufficient/i);
  });
  test('does not mutate the input array', () => {
    const input = [older];
    consumeFifo(input, 4, AT);
    expect(input[0].litres).toBe(10);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- lots`
Expected: FAIL — `Cannot find module '../lots'`

- [ ] **Step 3: Implement**

`src/lib/lots.ts`:

```ts
import { Lot } from '../data/types';

const round1 = (n: number): number => Math.round(n * 10) / 10;

export function activeLots(lots: Lot[], at: Date): Lot[] {
  return lots
    .filter(l => l.expiresAt.getTime() >= at.getTime())
    .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
}

export function balanceOf(lots: Lot[], at: Date): number {
  return round1(activeLots(lots, at).reduce((sum, l) => sum + l.litres, 0));
}

export function expiringWithin(lots: Lot[], at: Date, days: number): number {
  const cutoff = new Date(at.getTime() + days * 86_400_000);
  return round1(
    activeLots(lots, at)
      .filter(l => l.expiresAt.getTime() <= cutoff.getTime())
      .reduce((sum, l) => sum + l.litres, 0)
  );
}

export function consumeFifo(
  lots: Lot[],
  litres: number,
  at: Date
): { lots: Lot[]; consumedIds: string[] } {
  if (litres > balanceOf(lots, at)) {
    throw new Error('insufficient unexpired litres');
  }
  const order = activeLots(lots, at);
  const remainingById = new Map(lots.map(l => [l.id, l.litres]));
  const consumedIds: string[] = [];
  let outstanding = litres;

  for (const l of order) {
    if (outstanding <= 0) break;
    const take = Math.min(l.litres, outstanding);
    remainingById.set(l.id, round1(l.litres - take));
    outstanding = round1(outstanding - take);
    consumedIds.push(l.id);
  }

  const next = lots
    .map(l => ({ ...l, litres: remainingById.get(l.id)! }))
    .filter(l => l.litres > 0);

  return { lots: next, consumedIds };
}
```

- [ ] **Step 4: Run and confirm pass**

Run: `npm test -- lots`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add lot expiry and FIFO consumption"
```

---

### Task 5: Monthly cap arithmetic

**Files:**
- Create: `src/lib/caps.ts`
- Test: `src/lib/__tests__/caps.test.ts`

**Interfaces:**
- Consumes: `LedgerEntry` from `src/data/types`
- Produces:
  - `MONTHLY_CAP_LITRES = 150`
  - `litresThisMonth(ledger: LedgerEntry[], at: Date): number`
  - `capRemaining(ledger: LedgerEntry[], at: Date): number`
  - `withinCap(ledger: LedgerEntry[], at: Date, litres: number): boolean`

- [ ] **Step 1: Write the failing tests**

`src/lib/__tests__/caps.test.ts`:

```ts
import { litresThisMonth, capRemaining, withinCap, MONTHLY_CAP_LITRES } from '../caps';
import { LedgerEntry } from '../../data/types';

const entry = (
  kind: LedgerEntry['kind'], when: Date, delta: number
): LedgerEntry => ({
  id: `${kind}-${when.getTime()}`, kind, what: '', when, detail: '',
  grade: '95', deltaLitres: delta, balanceAfter: 0,
});

const AT = new Date(2026, 8, 30);
const sept = [
  entry('topup', new Date(2026, 8, 18), 36.6),
  entry('topup', new Date(2026, 8, 28), 68.6),
];

test('cap is 150 litres', () => expect(MONTHLY_CAP_LITRES).toBe(150));

describe('litresThisMonth', () => {
  test('sums top-ups in the current month', () => {
    expect(litresThisMonth(sept, AT)).toBe(105.2);
  });
  test('excludes a top-up from the previous month', () => {
    const withAug = [...sept, entry('topup', new Date(2026, 7, 20), 50)];
    expect(litresThisMonth(withAug, AT)).toBe(105.2);
  });
  test('excludes bonuses — only purchases count against the cap', () => {
    const withBonus = [...sept, entry('bonus', new Date(2026, 8, 4), 2)];
    expect(litresThisMonth(withBonus, AT)).toBe(105.2);
  });
  test('excludes fills', () => {
    const withFill = [...sept, entry('fill', new Date(2026, 8, 24), -31.4)];
    expect(litresThisMonth(withFill, AT)).toBe(105.2);
  });
  test('is zero with no entries', () => expect(litresThisMonth([], AT)).toBe(0));
});

describe('capRemaining', () => {
  test('is the cap minus this month', () => expect(capRemaining(sept, AT)).toBe(44.8));
  test('never goes below zero', () => {
    const over = [entry('topup', new Date(2026, 8, 1), 200)];
    expect(capRemaining(over, AT)).toBe(0);
  });
});

describe('withinCap', () => {
  test('allows a purchase that fits', () => expect(withinCap(sept, AT, 44.8)).toBe(true));
  test('rejects a purchase that exceeds', () => expect(withinCap(sept, AT, 44.9)).toBe(false));
  test('allows exactly reaching the cap', () => {
    expect(withinCap([], AT, 150)).toBe(true);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- caps`
Expected: FAIL — `Cannot find module '../caps'`

- [ ] **Step 3: Implement**

`src/lib/caps.ts`:

```ts
import { LedgerEntry } from '../data/types';

export const MONTHLY_CAP_LITRES = 150;

const round1 = (n: number): number => Math.round(n * 10) / 10;

const sameMonth = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

export function litresThisMonth(ledger: LedgerEntry[], at: Date): number {
  return round1(
    ledger
      .filter(e => e.kind === 'topup' && sameMonth(e.when, at))
      .reduce((sum, e) => sum + e.deltaLitres, 0)
  );
}

export function capRemaining(ledger: LedgerEntry[], at: Date): number {
  return round1(Math.max(0, MONTHLY_CAP_LITRES - litresThisMonth(ledger, at)));
}

export function withinCap(ledger: LedgerEntry[], at: Date, litres: number): boolean {
  return litres <= capRemaining(ledger, at);
}
```

- [ ] **Step 4: Run and confirm pass**

Run: `npm test -- caps`
Expected: PASS, 11 tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add per-vehicle monthly cap arithmetic"
```

---

### Task 6: Card fill derivation

**Files:**
- Create: `src/lib/cardfill.ts`, `src/data/stations.ts`
- Test: `src/lib/__tests__/cardfill.test.ts`

**Interfaces:**
- Consumes: `priceOn` from `src/data/prices`, `Station`/`Zone` from `src/data/types`
- Produces:
  - `STATIONS: Station[]`
  - `normaliseDescriptor(raw: string): string | null` — returns a station id or null
  - `resolveZone(stationId: string | null, fallbackZone: Zone | null): Zone` — throws when both are null
  - `deriveLitres(randAmount: number, pricePerLitre: number): number`

- [ ] **Step 1: Write the failing tests**

`src/lib/__tests__/cardfill.test.ts`:

```ts
import { normaliseDescriptor, resolveZone, deriveLitres } from '../cardfill';

describe('normaliseDescriptor', () => {
  test('matches a clean descriptor', () => {
    expect(normaliseDescriptor('ENGEN WILLIAM NICOL')).toBe('engen-william-nicol');
  });
  test('matches despite a trailing terminal number', () => {
    expect(normaliseDescriptor('ENGEN WILLIAM NICOL 4412')).toBe('engen-william-nicol');
  });
  test('matches despite suburb noise', () => {
    expect(normaliseDescriptor('SHELL GRAYSTON SANDTON')).toBe('shell-grayston');
  });
  test('is case insensitive', () => {
    expect(normaliseDescriptor('sasol rivonia')).toBe('sasol-rivonia');
  });
  test('returns null when nothing matches', () => {
    expect(normaliseDescriptor('PUMA MUSINA N1')).toBeNull();
  });
});

describe('resolveZone', () => {
  test('a known station wins', () => {
    expect(resolveZone('shell-grayston', 'coastal')).toBe('inland');
  });
  test('falls back to the transaction zone when the station is unknown', () => {
    expect(resolveZone(null, 'coastal')).toBe('coastal');
  });
  test('throws rather than guessing when both are unknown', () => {
    expect(() => resolveZone(null, null)).toThrow(/cannot resolve zone/i);
  });
});

describe('deriveLitres', () => {
  test('divides rand by price and rounds to one decimal', () => {
    expect(deriveLitres(873.6, 21.84)).toBe(40.0);
  });
  test('rounds correctly on an inexact division', () => {
    expect(deriveLitres(800, 21.87)).toBe(36.6);
  });
  test('rejects a zero amount', () => expect(() => deriveLitres(0, 21.87)).toThrow(/positive/i));
  test('rejects a negative amount', () => expect(() => deriveLitres(-10, 21.87)).toThrow(/positive/i));
  test('rejects a zero price', () => expect(() => deriveLitres(100, 0)).toThrow(/positive/i));
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- cardfill`
Expected: FAIL — `Cannot find module '../cardfill'`

- [ ] **Step 3: Implement the station list**

`src/data/stations.ts`:

```ts
import { Station } from './types';

export const STATIONS: Station[] = [
  { id: 'engen-william-nicol', name: 'Engen William Nicol', brand: 'Engen', suburb: 'Bryanston',    hours: '24h',          km: 1.2, zone: 'inland' },
  { id: 'sasol-rivonia',       name: 'Sasol Rivonia',       brand: 'Sasol', suburb: 'Rivonia',      hours: '05:00–23:00',  km: 2.8, zone: 'inland' },
  { id: 'shell-grayston',      name: 'Shell Grayston',      brand: 'Shell', suburb: 'Sandton',      hours: '24h',          km: 4.1, zone: 'inland' },
  { id: 'astron-fourways',     name: 'Astron Energy Fourways', brand: 'Astron Energy', suburb: 'Fourways', hours: '24h',   km: 5.6, zone: 'inland' },
  { id: 'total-sunninghill',   name: 'Total Sunninghill',   brand: 'Total', suburb: 'Sunninghill',  hours: '06:00–22:00',  km: 6.3, zone: 'inland' },
];
```

- [ ] **Step 4: Implement the derivation module**

`src/lib/cardfill.ts`:

```ts
import { STATIONS } from '../data/stations';
import { Zone } from '../data/types';

// Merchant descriptors arrive dirty: 'ENGEN WILLIAM NICOL 4412',
// 'SHELL GRAYSTON SANDTON'. Strip digits and punctuation, then look for a
// station whose significant name words are all present.
const STOP_WORDS = new Set(['energy', 'garage', 'service', 'station']);

function words(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 1 && !STOP_WORDS.has(w));
}

export function normaliseDescriptor(raw: string): string | null {
  const have = new Set(words(raw));
  for (const station of STATIONS) {
    const need = words(station.name);
    if (need.length > 0 && need.every(w => have.has(w))) return station.id;
  }
  return null;
}

export function resolveZone(stationId: string | null, fallbackZone: Zone | null): Zone {
  const station = stationId ? STATIONS.find(s => s.id === stationId) : undefined;
  if (station) return station.zone;
  if (fallbackZone) return fallbackZone;
  throw new Error('cannot resolve zone: no station match and no transaction location');
}

export function deriveLitres(randAmount: number, pricePerLitre: number): number {
  if (randAmount <= 0) throw new Error('rand amount must be positive');
  if (pricePerLitre <= 0) throw new Error('price must be positive');
  return Math.round((randAmount / pricePerLitre) * 10) / 10;
}
```

- [ ] **Step 5: Run and confirm pass**

Run: `npm test -- cardfill`
Expected: PASS, 13 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add card fill derivation with zone resolution"
```

---

### Task 7: Savings, seed data, and the store

**Files:**
- Create: `src/lib/savings.ts`, `src/data/seed.ts`, `src/store/wallet.ts`
- Test: `src/lib/__tests__/savings.test.ts`, `src/data/__tests__/seed.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 2–6
- Produces:
  - `savingsToDate(ledger: LedgerEntry[]): number`
  - `litresBelowPump(ledger: LedgerEntry[]): number`
  - `averageBuyPrice(ledger: LedgerEntry[]): number`
  - `TODAY: Date` (30 Sep 2026), `buildSeed(): { lots: Lot[]; ledger: LedgerEntry[] }`
  - `useWallet` zustand store with `lots`, `ledger`, `appearance`, `subscription`, `alerts`, `cardFrozen`, and actions `topUp`, `cardFill`, `disputeFill`, `setAppearance`, `toggleAlert`, `setSubscription`, `freezeCard`

- [ ] **Step 1: Write the failing savings tests**

`src/lib/__tests__/savings.test.ts`:

```ts
import { savingsToDate, averageBuyPrice } from '../savings';
import { LedgerEntry } from '../../data/types';

const fill = (when: Date, litres: number, buyPrice: number, pumpPrice: number): LedgerEntry => ({
  id: `f-${when.getTime()}`, kind: 'fill', what: '', when, detail: '',
  grade: '95', deltaLitres: -litres, balanceAfter: 0,
  card: {
    merchantDescriptor: '', stationId: null, mcc: '5541', randAmount: litres * pumpPrice,
    zone: 'inland', pricePerLitre: pumpPrice, litres, disputed: false,
  },
  lotIds: [],
  buyPricePerLitre: buyPrice,
} as LedgerEntry & { buyPricePerLitre: number });

describe('savingsToDate', () => {
  test('is positive when litres were bought below the pump price', () => {
    const l = [fill(new Date(2026, 8, 24), 10, 21.00, 21.87)];
    expect(savingsToDate(l)).toBeCloseTo(8.7, 1);
  });
  test('is negative when litres were bought above the pump price', () => {
    const l = [fill(new Date(2026, 8, 24), 10, 22.00, 21.87)];
    expect(savingsToDate(l)).toBeCloseTo(-1.3, 1);
  });
  test('is zero with no fills', () => expect(savingsToDate([])).toBe(0));
});

describe('averageBuyPrice', () => {
  test('weights by litres', () => {
    const l = [
      fill(new Date(2026, 7, 1), 10, 21.00, 21.75),
      fill(new Date(2026, 8, 1), 30, 22.00, 21.87),
    ];
    expect(averageBuyPrice(l)).toBeCloseTo(21.75, 2);
  });
  test('is zero with no fills', () => expect(averageBuyPrice([])).toBe(0));
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- savings`
Expected: FAIL — `Cannot find module '../savings'`

- [ ] **Step 3: Add `buyPricePerLitre` to the fill entry type**

In `src/data/types.ts`, add to `LedgerEntry`:

```ts
  buyPricePerLitre?: number;  // weighted price of the lots consumed by a fill
```

- [ ] **Step 4: Implement savings**

`src/lib/savings.ts`:

```ts
import { LedgerEntry } from '../data/types';

const fills = (ledger: LedgerEntry[]) =>
  ledger.filter(e => e.kind === 'fill' && e.card && e.buyPricePerLitre !== undefined);

/** Difference between the pump price on the day and what the litres cost. */
export function savingsToDate(ledger: LedgerEntry[]): number {
  return fills(ledger).reduce(
    (sum, e) => sum + (e.card!.pricePerLitre - e.buyPricePerLitre!) * e.card!.litres,
    0
  );
}

export function litresBelowPump(ledger: LedgerEntry[]): number {
  const n = fills(ledger)
    .filter(e => e.buyPricePerLitre! < e.card!.pricePerLitre)
    .reduce((sum, e) => sum + e.card!.litres, 0);
  return Math.round(n * 10) / 10;
}

export function averageBuyPrice(ledger: LedgerEntry[]): number {
  const f = fills(ledger);
  const litres = f.reduce((s, e) => s + e.card!.litres, 0);
  if (litres === 0) return 0;
  return f.reduce((s, e) => s + e.buyPricePerLitre! * e.card!.litres, 0) / litres;
}
```

- [ ] **Step 5: Run and confirm pass**

Run: `npm test -- savings`
Expected: PASS, 5 tests.

- [ ] **Step 6: Write the failing seed test**

`src/data/__tests__/seed.test.ts`:

```ts
import { buildSeed, TODAY } from '../seed';
import { balanceOf, expiringWithin } from '../../lib/lots';
import { litresThisMonth } from '../../lib/caps';

describe('seed', () => {
  const { lots, ledger } = buildSeed();

  test('today is 30 September 2026', () => {
    expect(TODAY.getFullYear()).toBe(2026);
    expect(TODAY.getMonth()).toBe(8);
    expect(TODAY.getDate()).toBe(30);
  });

  test('balance is 42.6 L', () => {
    expect(balanceOf(lots, TODAY)).toBeCloseTo(42.6, 1);
  });

  test('ledger chains exactly — each balanceAfter follows from the last', () => {
    const chron = [...ledger].sort((a, b) => a.when.getTime() - b.when.getTime());
    for (let i = 1; i < chron.length; i++) {
      const expected = Math.round((chron[i - 1].balanceAfter + chron[i].deltaLitres) * 10) / 10;
      expect(chron[i].balanceAfter).toBeCloseTo(expected, 1);
    }
  });

  test('the newest ledger entry agrees with the balance', () => {
    const chron = [...ledger].sort((a, b) => a.when.getTime() - b.when.getTime());
    expect(chron[chron.length - 1].balanceAfter).toBeCloseTo(42.6, 1);
  });

  test('no intermediate balance is negative', () => {
    for (const e of ledger) expect(e.balanceAfter).toBeGreaterThanOrEqual(0);
  });

  test('September top-ups total 105.2 L, under the 150 L cap', () => {
    expect(litresThisMonth(ledger, TODAY)).toBeCloseTo(105.2, 1);
  });

  test('every lot is petrol 95', () => {
    expect(lots.every(l => l.grade === '95')).toBe(true);
  });

  test('FIFO leaves only the newest lot, so nothing expires within 30 days', () => {
    // Oldest-first consumption means surviving stock is always the most recent
    // purchase. Pinned so a future seed change cannot silently break the Balance
    // screen's expiry split.
    expect(expiringWithin(lots, TODAY, 30)).toBe(0);
    expect(lots).toHaveLength(1);
    expect(lots[0].expiresAt.getMonth()).toBe(11); // December
  });
});
```

- [ ] **Step 7: Run and confirm failure**

Run: `npm test -- seed`
Expected: FAIL — `Cannot find module '../seed'`

- [ ] **Step 8: Implement the seed**

`src/data/seed.ts`. The opening 33.1 L is carried by two pre-September lots; the chain then runs as specified in spec §4.2.

```ts
import { Lot, LedgerEntry } from './types';
import { priceOn } from './prices';

export const TODAY = new Date(2026, 8, 30);
const DAY = 86_400_000;
const plus90 = (d: Date) => new Date(d.getTime() + 90 * DAY);

type Move = { date: Date; kind: LedgerEntry['kind']; what: string; detail: string; litres: number };

// Chain from spec §4.2: opening 33.1 -> 42.6
const MOVES: Move[] = [
  { date: new Date(2026, 8, 4),  kind: 'bonus', what: 'Referral bonus',              detail: 'Lerato M.', litres:  +2.0 },
  { date: new Date(2026, 8, 11), kind: 'fill',  what: 'Fill · Engen William Nicol',  detail: 'Bryanston', litres: -28.3 },
  { date: new Date(2026, 8, 18), kind: 'topup', what: 'Top up · 95',                 detail: 'R800',      litres: +36.6 },
  { date: new Date(2026, 8, 24), kind: 'fill',  what: 'Fill · Sasol Rivonia',        detail: 'Rivonia',   litres: -31.4 },
  { date: new Date(2026, 8, 28), kind: 'topup', what: 'Top up · 95',                 detail: 'R1 500',    litres: +68.6 },
  { date: new Date(2026, 8, 30), kind: 'fill',  what: 'Fill · Shell Grayston',       detail: 'Sandton',   litres: -38.0 },
];

const STATION_FOR: Record<string, string> = {
  'Fill · Engen William Nicol': 'engen-william-nicol',
  'Fill · Sasol Rivonia': 'sasol-rivonia',
  'Fill · Shell Grayston': 'shell-grayston',
};

const r1 = (n: number) => Math.round(n * 10) / 10;

export function buildSeed(): { lots: Lot[]; ledger: LedgerEntry[] } {
  // Opening 33.1 L across two earlier lots, both still unexpired at TODAY.
  const openA = new Date(2026, 6, 8);   // expires 06 Oct — inside the 30-day window
  const openB = new Date(2026, 7, 12);  // expires 10 Nov
  let lots: Lot[] = [
    { id: 'lot-open-a', grade: '95', litres: 12.4, pricePerLitre: priceOn('inland', openA), purchasedAt: openA, expiresAt: plus90(openA) },
    { id: 'lot-open-b', grade: '95', litres: 20.7, pricePerLitre: priceOn('inland', openB), purchasedAt: openB, expiresAt: plus90(openB) },
  ];

  const ledger: LedgerEntry[] = [];
  let balance = r1(lots.reduce((s, l) => s + l.litres, 0)); // 33.1
  let n = 0;

  for (const m of MOVES) {
    n += 1;
    balance = r1(balance + m.litres);

    if (m.litres > 0) {
      const price = priceOn('inland', m.date);
      const id = `lot-${n}`;
      lots.push({
        id, grade: '95', litres: m.litres, pricePerLitre: price,
        purchasedAt: m.date, expiresAt: plus90(m.date),
      });
      ledger.push({
        id: `e-${n}`, kind: m.kind, what: m.what, when: m.date, detail: m.detail,
        grade: '95', deltaLitres: m.litres, balanceAfter: balance, lotIds: [id],
      });
    } else {
      const litres = Math.abs(m.litres);
      const price = priceOn('inland', m.date);
      // Weighted buy price of the lots this fill consumes, oldest first.
      const order = [...lots]
        .filter(l => l.expiresAt.getTime() >= m.date.getTime() && l.litres > 0)
        .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
      let outstanding = litres;
      let cost = 0;
      const lotIds: string[] = [];
      for (const l of order) {
        if (outstanding <= 0) break;
        const take = Math.min(l.litres, outstanding);
        cost += take * l.pricePerLitre;
        l.litres = r1(l.litres - take);
        outstanding = r1(outstanding - take);
        lotIds.push(l.id);
      }
      lots = lots.filter(l => l.litres > 0);

      ledger.push({
        id: `e-${n}`, kind: 'fill', what: m.what, when: m.date, detail: m.detail,
        grade: '95', deltaLitres: m.litres, balanceAfter: balance, lotIds,
        buyPricePerLitre: cost / litres,
        card: {
          merchantDescriptor: m.what.replace('Fill · ', '').toUpperCase(),
          stationId: STATION_FOR[m.what] ?? null,
          mcc: '5541', randAmount: r1(litres * price) , zone: 'inland',
          pricePerLitre: price, litres, disputed: false,
        },
      });
    }
  }

  return { lots, ledger };
}
```

- [ ] **Step 9: Run and confirm pass**

Run: `npm test -- seed`
Expected: PASS, 8 tests. If the balance assertion fails, adjust only the two opening lot litre values so they total 33.1 — never change the `MOVES` deltas, which are fixed by the spec.

- [ ] **Step 10: Implement the store**

`src/store/wallet.ts`:

```ts
import { create } from 'zustand';
import { Lot, LedgerEntry, Zone } from '../data/types';
import { buildSeed, TODAY } from '../data/seed';
import { priceOn } from '../data/prices';
import { balanceOf, consumeFifo, expiringWithin } from '../lib/lots';
import { withinCap, litresThisMonth, capRemaining } from '../lib/caps';
import { normaliseDescriptor, resolveZone, deriveLitres } from '../lib/cardfill';

export type Appearance = 'dark' | 'light' | 'system';
export type Subscription = 'trial' | 'active' | 'lapsed';

const DAY = 86_400_000;
const r1 = (n: number) => Math.round(n * 10) / 10;

type State = {
  lots: Lot[];
  ledger: LedgerEntry[];
  appearance: Appearance;
  subscription: Subscription;
  trialDaysLeft: number;
  alerts: boolean[];
  cardFrozen: boolean;
  topUp: (rand: number) => void;
  cardFill: (descriptor: string, rand: number, zone: Zone | null) => void;
  disputeFill: (entryId: string) => void;
  setAppearance: (a: Appearance) => void;
  toggleAlert: (i: number) => void;
  setSubscription: (s: Subscription) => void;
  freezeCard: (frozen: boolean) => void;
};

const seed = buildSeed();

export const useWallet = create<State>((set, get) => ({
  lots: seed.lots,
  ledger: seed.ledger,
  appearance: 'dark',
  subscription: 'trial',
  trialDaysLeft: 24,
  alerts: [true, true, false],
  cardFrozen: false,

  topUp: (rand) => {
    const price = priceOn('inland', TODAY);
    const litres = r1(rand / price);
    const { lots, ledger } = get();
    if (!withinCap(ledger, TODAY, litres)) return;
    const id = `lot-${Date.now()}`;
    const balance = r1(balanceOf(lots, TODAY) + litres);
    set({
      lots: [...lots, {
        id, grade: '95', litres, pricePerLitre: price,
        purchasedAt: TODAY, expiresAt: new Date(TODAY.getTime() + 90 * DAY),
      }],
      ledger: [...ledger, {
        id: `e-${Date.now()}`, kind: 'topup', what: 'Top up · 95', when: TODAY,
        detail: `R${Math.round(rand)}`, grade: '95', deltaLitres: litres,
        balanceAfter: balance, lotIds: [id],
      }],
    });
  },

  cardFill: (descriptor, rand, zone) => {
    const { lots, ledger } = get();
    const stationId = normaliseDescriptor(descriptor);
    const resolved = resolveZone(stationId, zone);
    const price = priceOn(resolved, TODAY);
    const litres = deriveLitres(rand, price);
    if (litres > balanceOf(lots, TODAY)) return;

    const order = [...lots]
      .filter(l => l.expiresAt.getTime() >= TODAY.getTime())
      .sort((a, b) => a.purchasedAt.getTime() - b.purchasedAt.getTime());
    let outstanding = litres, cost = 0;
    for (const l of order) {
      if (outstanding <= 0) break;
      const take = Math.min(l.litres, outstanding);
      cost += take * l.pricePerLitre;
      outstanding = r1(outstanding - take);
    }

    const next = consumeFifo(lots, litres, TODAY);
    set({
      lots: next.lots,
      ledger: [...ledger, {
        id: `e-${Date.now()}`, kind: 'fill',
        what: `Fill · ${descriptor}`, when: TODAY, detail: '',
        grade: '95', deltaLitres: -litres,
        balanceAfter: r1(balanceOf(next.lots, TODAY)),
        lotIds: next.consumedIds, buyPricePerLitre: cost / litres,
        card: {
          merchantDescriptor: descriptor, stationId, mcc: '5541',
          randAmount: rand, zone: resolved, pricePerLitre: price,
          litres, disputed: false,
        },
      }],
    });
  },

  disputeFill: (entryId) => set(s => ({
    ledger: s.ledger.map(e =>
      e.id === entryId && e.card ? { ...e, card: { ...e.card, disputed: true } } : e
    ),
  })),

  setAppearance: (appearance) => set({ appearance }),
  toggleAlert: (i) => set(s => ({ alerts: s.alerts.map((v, j) => (j === i ? !v : v)) })),
  setSubscription: (subscription) => set({ subscription }),
  freezeCard: (cardFrozen) => set({ cardFrozen }),
}));

export const selectBalance = (s: State) => balanceOf(s.lots, TODAY);
export const selectExpiringSoon = (s: State) => expiringWithin(s.lots, TODAY, 30);
export const selectLitresThisMonth = (s: State) => litresThisMonth(s.ledger, TODAY);
export const selectCapRemaining = (s: State) => capRemaining(s.ledger, TODAY);
```

- [ ] **Step 11: Run the whole suite**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 12: Commit**

```bash
git add -A
git commit -m "feat: add savings, seeded wallet state, and zustand store"
```

---

### Task 8: Theme tokens and provider

**Files:**
- Create: `src/theme/tokens.ts`, `src/theme/ThemeProvider.tsx`
- Test: `src/theme/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: `useWallet` from `src/store/wallet`
- Produces: `DARK`, `LIGHT`, `type Tokens`, `<ThemeProvider>`, `useTheme(): Tokens`

- [ ] **Step 1: Write the failing test**

`src/theme/__tests__/tokens.test.ts`:

```ts
import { DARK, LIGHT } from '../tokens';

test('both themes define every token', () => {
  expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
});

test('accents are identical across themes', () => {
  expect(DARK.accent).toBe(LIGHT.accent);
  expect(DARK.positive).toBe(LIGHT.positive);
  expect(DARK.accent).toBe('#D9541E');
  expect(DARK.positive).toBe('#C6F24E');
});

test('dark background is black and light is white', () => {
  expect(DARK.bg).toBe('#000000');
  expect(LIGHT.bg).toBe('#FFFFFF');
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- tokens`
Expected: FAIL — `Cannot find module '../tokens'`

- [ ] **Step 3: Implement tokens**

`src/theme/tokens.ts`:

```ts
export type Tokens = {
  bg: string; bgRaised: string; surface: string; border: string; hairline: string;
  textMuted: string; textDim: string; text: string; inverse: string;
  accent: string; positive: string;
};

export const DARK: Tokens = {
  bg: '#000000', bgRaised: '#0A0A0A', surface: '#1A1A1A', border: '#2E2E2E',
  hairline: '#1F1F1F', textMuted: '#6B6B6B', textDim: '#A8A8A8',
  text: '#FFFFFF', inverse: '#000000', accent: '#D9541E', positive: '#C6F24E',
};

export const LIGHT: Tokens = {
  bg: '#FFFFFF', bgRaised: '#FFFFFF', surface: '#EDEBE7', border: '#D5D2CC',
  hairline: '#E2DFDA', textMuted: '#6B6B6B', textDim: '#A8A8A8',
  text: '#000000', inverse: '#FFFFFF', accent: '#D9541E', positive: '#C6F24E',
};
```

- [ ] **Step 4: Implement the provider**

`src/theme/ThemeProvider.tsx`:

```tsx
import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { DARK, LIGHT, Tokens } from './tokens';
import { useWallet } from '../store/wallet';

const ThemeContext = createContext<Tokens>(DARK);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const appearance = useWallet(s => s.appearance);
  const system = useColorScheme();
  const isDark = appearance === 'system' ? system !== 'light' : appearance === 'dark';
  return (
    <ThemeContext.Provider value={isDark ? DARK : LIGHT}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = (): Tokens => useContext(ThemeContext);
```

- [ ] **Step 5: Run and confirm pass**

Run: `npm test -- tokens`
Expected: PASS, 3 tests.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add theme tokens and provider"
```

---

### Task 9: Shared components

**Files:**
- Create: `src/components/Num.tsx`, `Screen.tsx`, `ScreenHeader.tsx`, `Rule.tsx`, `SectionLabel.tsx`, `Button.tsx`, `Row.tsx`, `Toggle.tsx`, `BarrelMark.tsx`
- Test: `src/components/__tests__/Num.test.tsx`

**Interfaces:**
- Consumes: `useTheme`
- Produces:
  - `<Num size={92} color? weight?>{'42.6'}</Num>` — tabular numerals, Outfit 800, tracking −0.045em
  - `<Screen>` — themed `SafeAreaView`, 26px horizontal padding
  - `<ScreenHeader title="CARD" onBack?>` — back arrow, centred title, 20px spacer
  - `<Rule />` — 1px `hairline`
  - `<SectionLabel>AVAILABLE FUEL</SectionLabel>`
  - `<Button variant="primary"|"secondary"|"white" label onPress disabled?>`
  - `<Row label value onPress? />`
  - `<Toggle on onPress label />`
  - `<BarrelMark size={17} color? />`

- [ ] **Step 1: Write the failing test**

`src/components/__tests__/Num.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Num } from '../Num';

test('renders its value and uses tabular numerals', () => {
  const { getByText } = render(<Num size={92}>42.6</Num>);
  const node = getByText('42.6');
  const style = Array.isArray(node.props.style)
    ? Object.assign({}, ...node.props.style.flat())
    : node.props.style;
  expect(style.fontVariant).toContain('tabular-nums');
  expect(style.fontSize).toBe(92);
});
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- Num`
Expected: FAIL — `Cannot find module '../Num'`

- [ ] **Step 3: Implement `Num`**

`src/components/Num.tsx`:

```tsx
import React from 'react';
import { Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Num({
  children, size, color, weight = '800', style,
}: {
  children: React.ReactNode;
  size: number;
  color?: string;
  weight?: TextStyle['fontWeight'];
  style?: TextStyle;
}) {
  const t = useTheme();
  return (
    <Text
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      style={[{
        fontFamily: 'Outfit_800ExtraBold',
        fontWeight: weight,
        fontSize: size,
        color: color ?? t.text,
        fontVariant: ['tabular-nums'],
        letterSpacing: -0.045 * size,
      }, style]}
    >
      {children}
    </Text>
  );
}
```

- [ ] **Step 4: Run and confirm pass**

Run: `npm test -- Num`
Expected: PASS.

- [ ] **Step 5: Implement the remaining components**

Each is small and follows the same shape — read tokens from `useTheme()`, never a literal hex.

`src/components/Rule.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const Rule = ({ margin = 0 }: { margin?: number }) => {
  const t = useTheme();
  return <View style={{ height: 1, backgroundColor: t.hairline, marginVertical: margin }} />;
};
```

`src/components/SectionLabel.tsx`:

```tsx
import React from 'react';
import { Platform, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export const SectionLabel = ({ children }: { children: string }) => {
  const t = useTheme();
  return (
    <Text style={{
      fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
      fontSize: 10, fontWeight: '600', letterSpacing: 1.6,
      textTransform: 'uppercase', color: t.textMuted,
    }}>{children}</Text>
  );
};
```

`src/components/Button.tsx`:

```tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';

type Variant = 'primary' | 'secondary' | 'white';

export function Button({
  label, onPress, variant = 'primary', disabled = false, height = 58, flex,
}: {
  label: string; onPress?: () => void; variant?: Variant;
  disabled?: boolean; height?: number; flex?: number;
}) {
  const t = useTheme();
  const bg = disabled ? t.surface
    : variant === 'primary' ? t.accent
    : variant === 'white' ? t.text
    : t.bg;
  const fg = disabled ? t.textMuted
    : variant === 'secondary' ? t.text
    : t.inverse;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={() => { Haptics.selectionAsync(); onPress?.(); }}
      style={{
        height, flex, borderRadius: 3, backgroundColor: bg,
        borderWidth: variant === 'secondary' ? 1 : 0, borderColor: t.border,
        alignItems: 'center', justifyContent: 'center', minHeight: 44,
      }}
    >
      <Text style={{
        fontFamily: 'Outfit_800ExtraBold', fontSize: 15,
        letterSpacing: 0.45, color: fg,
      }}>{label}</Text>
    </Pressable>
  );
}
```

`src/components/Toggle.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

export function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      onPress={onPress}
      style={{
        width: 44, height: 26, padding: 3, justifyContent: 'center',
        alignItems: on ? 'flex-end' : 'flex-start',
        backgroundColor: on ? t.positive : t.border,
      }}
    >
      <View style={{ width: 20, height: 20, backgroundColor: on ? t.inverse : t.textMuted }} />
    </Pressable>
  );
}
```

`src/components/Row.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Rule } from './Rule';

export function Row({
  label, value, onPress, right,
}: {
  label: string; value?: string; onPress?: () => void; right?: React.ReactNode;
}) {
  const t = useTheme();
  return (
    <View>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={value ? `${label}, ${value}` : label}
        onPress={onPress}
        style={{
          flexDirection: 'row', justifyContent: 'space-between',
          alignItems: 'center', paddingVertical: 17, minHeight: 44, gap: 16,
        }}
      >
        <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: t.text }}>{label}</Text>
        {right ?? (value ? (
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>{value}</Text>
        ) : null)}
      </Pressable>
      <Rule />
    </View>
  );
}
```

`src/components/BarrelMark.tsx` — the design's droplet-in-square mark, `fill-rule="evenodd"`:

```tsx
import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

export function BarrelMark({ size = 17, color }: { size?: number; color?: string }) {
  const t = useTheme();
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fillRule="evenodd"
        fill={color ?? t.text}
        d="M0 0h24v24H0V0zm12 5.4c-3.1 3.7-4.7 6.2-4.7 8.3a4.7 4.7 0 0 0 9.4 0c0-2.1-1.6-4.6-4.7-8.3z"
      />
    </Svg>
  );
}
```

`src/components/Screen.tsx`:

```tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';

export function Screen({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const Body = scroll ? ScrollView : View;
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top }}>
      <Body style={{ flex: 1, paddingHorizontal: 26 }}>{children}</Body>
    </View>
  );
}
```

`src/components/ScreenHeader.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../theme/ThemeProvider';

export function ScreenHeader({ title, back = true }: { title: string; back?: boolean }) {
  const t = useTheme();
  const router = useRouter();
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingTop: 6,
    }}>
      {back ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Go back"
          onPress={() => router.back()} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, color: t.textMuted }}>←</Text>
        </Pressable>
      ) : <View style={{ width: 44 }} />}
      <Text style={{
        fontFamily: 'Outfit_700Bold', fontSize: 12,
        letterSpacing: 1.44, textTransform: 'uppercase', color: t.text,
      }}>{title}</Text>
      <View style={{ width: 44 }} />
    </View>
  );
}
```

- [ ] **Step 6: Run the suite**

Run: `npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add shared design-system components"
```

---

### Task 10: App shell, fonts, and tab bar

**Files:**
- Create: `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `src/components/TabIcon.tsx`
- Delete: `app/index.tsx`

**Interfaces:**
- Consumes: `ThemeProvider`, `useTheme`
- Produces: five tabs — `index` (Wallet), `stations`, `card`, `savings`, `settings`

- [ ] **Step 1: Write the root layout**

`app/_layout.tsx`:

```tsx
import React from 'react';
import { Stack } from 'expo-router';
import { useFonts,
  Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold,
  Outfit_700Bold, Outfit_800ExtraBold,
} from '@expo-google-fonts/outfit';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  const [loaded] = useFonts({
    Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold,
    Outfit_700Bold, Outfit_800ExtraBold,
  });
  if (!loaded) return null;
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="top-up" />
          <Stack.Screen name="balance" />
          <Stack.Screen name="alerts" />
          <Stack.Screen name="subscribe" />
          <Stack.Screen name="fill/[id]" />
        </Stack>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 2: Write the tab icons**

`src/components/TabIcon.tsx` — 22px line glyphs at 1.5 stroke, square geometry to match the system:

```tsx
import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export type TabName = 'wallet' | 'stations' | 'card' | 'savings' | 'settings';

export function TabIcon({ name, color }: { name: TabName; color: string }) {
  const p = { stroke: color, strokeWidth: 1.5, fill: 'none' };
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      {name === 'wallet' && <Rect x={3} y={6} width={18} height={13} {...p} />}
      {name === 'stations' && <><Path d="M12 21s6-5.4 6-10a6 6 0 1 0-12 0c0 4.6 6 10 6 10z" {...p} /><Circle cx={12} cy={11} r={2} {...p} /></>}
      {name === 'card' && <><Rect x={2} y={5} width={20} height={14} {...p} /><Path d="M2 10h20" {...p} /></>}
      {name === 'savings' && <Path d="M4 20V10M10 20V4M16 20v-8M22 20V7" {...p} />}
      {name === 'settings' && <><Path d="M3 7h18M3 12h18M3 17h18" {...p} /></>}
    </Svg>
  );
}
```

- [ ] **Step 3: Write the tab layout**

`app/(tabs)/_layout.tsx`. Card takes `accent` when active — the one tab that acts in the physical world.

```tsx
import React from 'react';
import { Platform, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeProvider';
import { TabIcon, TabName } from '../../src/components/TabIcon';

const TABS: { name: string; label: string; icon: TabName }[] = [
  { name: 'index',    label: 'Wallet',   icon: 'wallet' },
  { name: 'stations', label: 'Stations', icon: 'stations' },
  { name: 'card',     label: 'Card',     icon: 'card' },
  { name: 'savings',  label: 'Savings',  icon: 'savings' },
  { name: 'settings', label: 'Settings', icon: 'settings' },
];

export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.bg, borderTopWidth: 1, borderTopColor: t.hairline,
          height: 56 + (Platform.OS === 'ios' ? 24 : 0), elevation: 0,
        },
      }}
    >
      {TABS.map(({ name, label, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            tabBarLabel: ({ focused }) => (
              <Text style={{
                fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
                fontSize: 9, letterSpacing: 0.9, textTransform: 'uppercase',
                color: focused ? (name === 'card' ? t.accent : t.text) : t.textMuted,
              }}>{label}</Text>
            ),
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name={icon}
                color={focused ? (name === 'card' ? t.accent : t.text) : t.textMuted}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
```

- [ ] **Step 4: Create placeholder tab screens so routing resolves**

Create `app/(tabs)/index.tsx`, `stations.tsx`, `card.tsx`, `savings.tsx`, `settings.tsx`, each temporarily:

Each file gets a temporary body, replaced in Tasks 11–19. Use the screen's own name so
an unreplaced placeholder is obvious on screen:

```tsx
import React from 'react';
import { Text } from 'react-native';
import { Screen } from '../../src/components/Screen';

export default function Wallet() {
  return <Screen><Text>Wallet</Text></Screen>;
}
```

Delete `app/index.tsx`.

- [ ] **Step 5: Verify the app boots**

Run: `npx expo start --web`
Expected: five tabs render, Card in the centre, tapping each switches screens without error.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add app shell, Outfit fonts, and five-tab bar"
```

---

### Task 11: Wallet screen (artboards 01 and 05)

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `Screen`, `Num`, `SectionLabel`, `Rule`, `Button`, `BarrelMark`, `useWallet`, `selectBalance`
- Produces: nothing consumed downstream

Layout, top to bottom: wordmark row with `TM` avatar · `AVAILABLE FUEL` label · 92px litre hero with 34px `L` suffix · rand value at today's price · rule · `PRICE WATCH · GAUTENG` block with petrol 95 at R21.87 and a `+0.55%` rise in `accent` with an up triangle · next-change line · rule · last fill row · `TOP UP` (accent, flex 1) and `CARD` (secondary, 130px) buttons.

The design's second ticker row (diesel) is replaced by a next-price-change line, per spec §4.1.

- [ ] **Step 1: Implement the screen**

```tsx
import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet, selectBalance } from '../../src/store/wallet';
import { formatLitres, formatRand } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';

export default function Wallet() {
  const t = useTheme();
  const router = useRouter();
  const balance = useWallet(selectBalance);
  const price = priceOn('inland', TODAY);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BarrelMark size={17} />
          <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 16, letterSpacing: -0.56, color: t.text }}>BARREL</Text>
        </View>
        <View style={{ width: 30, height: 30, borderWidth: 1, borderColor: t.border, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, color: t.textDim }}>TM</Text>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Available fuel, ${formatLitres(balance)} litres. View balance.`}
        onPress={() => router.push('/balance')}
        style={{ paddingTop: 44 }}
      >
        <SectionLabel>Available fuel</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
          <Num size={92}>{formatLitres(balance)}</Num>
          <Num size={34} color={t.textDim}>L</Num>
        </View>
        <Text style={{ marginTop: 16, fontFamily: 'Outfit_500Medium', fontSize: 17, color: t.textDim, fontVariant: ['tabular-nums'] }}>
          R {formatRand(balance * price)}
          <Text style={{ color: t.textMuted }}>  · at today's 95</Text>
        </Text>
      </Pressable>

      <View style={{ marginTop: 34 }}><Rule /></View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Price watch. View price alerts."
        onPress={() => router.push('/alerts')}
        style={{ paddingTop: 20, gap: 16 }}
      >
        <SectionLabel>Price watch · Gauteng</SectionLabel>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 12, letterSpacing: 0.24, color: t.text }}>PETROL 95</Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 7 }}>
              <Num size={26}>R21.87</Num>
              <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>/L</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <View style={{
              width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 9,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent,
            }} />
            <Num size={15} color={t.accent}>+0.55%</Num>
          </View>
        </View>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>Next change · 02 Oct</Text>
          <Num size={14} color={t.accent}>+12c expected</Num>
        </View>
      </Pressable>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 12 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textDim }}>Last fill · Shell Grayston</Text>
          <Num size={14}>−38.0 L</Num>
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
          <Button label="TOP UP" flex={1} onPress={() => router.push('/top-up')} />
          <Button label="CARD" variant="secondary" onPress={() => router.push('/card')} />
        </View>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify in both themes**

Run: `npx expo start --web`

Check: balance reads `42.6 L` and `R 931.66`; the rise indicator is rust; tapping the balance opens Balance; tapping the price block opens Alerts. Then set Appearance to Light in the store default temporarily and confirm the screen matches artboard 05 — white ground, black text, same layout.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add wallet screen"
```

---

### Task 12: Top up screen (artboard 02)

**Files:**
- Create: `app/top-up.tsx`, `src/components/Keypad.tsx`

**Interfaces:**
- Consumes: `useWallet.topUp`, `selectLitresThisMonth`, `selectCapRemaining`, `MONTHLY_CAP_LITRES`
- Produces: `<Keypad value onChange />` — reused by no one else in v1, but kept separate because the screen is already long

Per spec §9.1 and §8.2: a static `PETROL 95` chip replaces the design's grade tabs; a cap meter sits beneath it; the confirm button disables at the cap.

- [ ] **Step 1: Implement the keypad**

`src/components/Keypad.tsx`:

```tsx
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeProvider';

const KEYS = ['1','2','3','4','5','6','7','8','9','00','0','←'];

export function Keypad({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const t = useTheme();
  const press = (k: string) => {
    Haptics.selectionAsync();
    if (k === '←') return onChange(value.slice(0, -1));
    if (k === '00') return onChange(value === '0' || value === '' ? '0' : (value + '00').slice(0, 7));
    onChange(((value === '0' ? '' : value) + k).slice(0, 7));
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: t.surface, gap: 1 }}>
      {KEYS.map(k => (
        <Pressable
          key={k}
          accessibilityRole="button"
          accessibilityLabel={k === '←' ? 'Delete' : k}
          onPress={() => press(k)}
          style={{
            width: '33%', flexGrow: 1, height: 62, backgroundColor: t.bg,
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 25, color: t.text, fontVariant: ['tabular-nums'] }}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}
```

- [ ] **Step 2: Implement the screen**

`app/top-up.tsx`:

```tsx
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { SectionLabel } from '../src/components/SectionLabel';
import { Rule } from '../src/components/Rule';
import { Button } from '../src/components/Button';
import { Keypad } from '../src/components/Keypad';
import { useTheme } from '../src/theme/ThemeProvider';
import { useWallet, selectLitresThisMonth } from '../src/store/wallet';
import { MONTHLY_CAP_LITRES } from '../src/lib/caps';
import { formatLitres, formatRandWhole, formatPrice } from '../src/lib/format';
import { priceOn } from '../src/data/prices';
import { TODAY } from '../src/data/seed';

export default function TopUp() {
  const t = useTheme();
  const router = useRouter();
  const [raw, setRaw] = useState('1500');
  const topUp = useWallet(s => s.topUp);
  const used = useWallet(selectLitresThisMonth);

  const price = priceOn('inland', TODAY);
  const rand = parseInt(raw || '0', 10);
  const litres = rand / price;
  const wouldExceed = used + litres > MONTHLY_CAP_LITRES;
  const pct = Math.min(1, used / MONTHLY_CAP_LITRES);

  return (
    <Screen>
      <ScreenHeader title="Top up" />

      <View style={{ paddingTop: 34 }}>
        <View style={{ borderWidth: 1, borderColor: t.border, height: 50, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 12, letterSpacing: 1.2, color: t.text }}>PETROL 95</Text>
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 12, color: t.textMuted }}>
              {formatLitres(used)} / {MONTHLY_CAP_LITRES} L this month
            </Text>
          </View>
          <View style={{ height: 2, backgroundColor: t.hairline, marginTop: 8 }}>
            <View style={{ height: 2, width: `${pct * 100}%`, backgroundColor: pct > 0.8 ? t.accent : t.text }} />
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 40 }}>
        <SectionLabel>You pay</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, marginTop: 14 }}>
          <Num size={30} color={t.textMuted}>R</Num>
          <Num size={76}>{formatRandWhole(rand)}</Num>
          <View style={{ width: 2, height: 56, backgroundColor: t.accent }} />
        </View>
        <View style={{ marginVertical: 26 }}><Rule /></View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <SectionLabel>You get</SectionLabel>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 12 }}>
              <Num size={46}>{formatLitres(litres)}</Num>
              <Num size={20} color={t.textDim}>L</Num>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>locked at</Text>
            <Num size={15} style={{ marginTop: 4 }}>R{formatPrice(price)}/L</Num>
          </View>
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12 }}>
        <Keypad value={raw} onChange={setRaw} />
        <View style={{ marginTop: 14 }}>
          <Button
            label={wouldExceed ? 'MONTHLY CAP REACHED' : rand > 0 ? `BUY ${formatLitres(litres)} L` : 'ENTER AMOUNT'}
            disabled={wouldExceed || rand <= 0}
            onPress={() => { topUp(rand); router.back(); }}
          />
        </View>
        <Text style={{ marginTop: 12, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Litres you don't use convert back to the rand you paid. No cash-out above purchase price.
        </Text>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Verify behaviour**

Run: `npx expo start --web`

Check: keypad edits the amount; litres recompute live; entering an amount above 44.8 L worth (roughly R980) disables the button and changes its label; confirming returns to Wallet with an increased balance and a new ledger row.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add top up screen with keypad and cap meter"
```

---

### Task 13: Card screen (artboard 03, promoted to a tab)

**Files:**
- Modify: `app/(tabs)/card.tsx`

**Interfaces:**
- Consumes: `selectBalance`, `useWallet.freezeCard`
- Produces: nothing consumed downstream

Per spec §9.1: the pass is kept verbatim, plus spending power, `Works at any fuel station`, a static `PETROL 95` label, and a freeze control.

- [ ] **Step 1: Implement the screen**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Button } from '../../src/components/Button';
import { BarrelMark } from '../../src/components/BarrelMark';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet, selectBalance } from '../../src/store/wallet';
import { formatLitres, formatRandWhole } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';
import { DARK, LIGHT } from '../../src/theme/tokens';

export default function Card() {
  const t = useTheme();
  const balance = useWallet(selectBalance);
  const frozen = useWallet(s => s.cardFrozen);
  const freeze = useWallet(s => s.freezeCard);
  const price = priceOn('inland', TODAY);

  return (
    <Screen>
      <ScreenHeader title="Card" back={false} />

      <View style={{ paddingTop: 36 }}>
        <SectionLabel>Your Barrel card</SectionLabel>
        <Text style={{ marginTop: 12, fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 19.5, color: t.textDim }}>
          Add it to your phone wallet and tap at any fuel station in South Africa.
        </Text>
      </View>

      {/* The pass is always light-on-white — it is a physical object, not a themed surface. */}
      <View style={{ marginTop: 26 }}>
        <View style={{ backgroundColor: frozen ? LIGHT.surface : '#FFFFFF', padding: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <BarrelMark size={17} color={DARK.inverse} />
              <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 16, letterSpacing: -0.56, color: '#000' }}>BARREL</Text>
            </View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 9, letterSpacing: 1.44, color: LIGHT.textMuted }}>
              {frozen ? 'FROZEN' : 'FUEL PASS'}
            </Text>
          </View>

          <Text style={{ marginTop: 34, fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: LIGHT.textMuted }}>BALANCE</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7, marginTop: 10 }}>
            <Num size={66} color="#000">{formatLitres(balance)}</Num>
            <Num size={26} color={LIGHT.textDim}>L</Num>
          </View>
          <Text style={{ marginTop: 8, fontFamily: 'Outfit_500Medium', fontSize: 13, color: LIGHT.textMuted, fontVariant: ['tabular-nums'] }}>
            R{formatRandWhole(balance * price)} available · PETROL 95
          </Text>

          <View style={{ height: 1, backgroundColor: LIGHT.hairline, marginTop: 22, marginBottom: 14 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View>
              <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: LIGHT.textMuted }}>HOLDER</Text>
              <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, marginTop: 8, letterSpacing: 0.26, color: '#000' }}>T. MAKHUBELA</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: LIGHT.textMuted }}>CARD</Text>
              <Num size={13} color="#000" style={{ marginTop: 8 }}>•••• 4127</Num>
            </View>
          </View>
        </View>
        <View style={{ height: 9, backgroundColor: t.textDim, marginHorizontal: 10 }} />
        <View style={{ height: 9, backgroundColor: '#4A4A4A', marginHorizontal: 22 }} />
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 14 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>Accepted at</Text>
          <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 13, letterSpacing: 0.26, color: t.text }}>Any fuel station</Text>
        </View>
        <Button label="ADD TO APPLE WALLET" variant="white" height={58} />
        <Button label="ADD TO GOOGLE PAY" variant="secondary" height={58} />
        <Button
          label={frozen ? 'UNFREEZE CARD' : 'FREEZE CARD'}
          variant="secondary"
          height={54}
          onPress={() => freeze(!frozen)}
        />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify**

Run: `npx expo start --web`

Check: the pass stays white in both themes; spending power reads `R932 available`; freezing greys the pass and stamps `FROZEN`.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add card screen with spending power and freeze"
```

---

### Task 14: Balance screen with expiry split (artboard 08)

**Files:**
- Create: `app/balance.tsx`

**Interfaces:**
- Consumes: `selectBalance`, `selectExpiringSoon`, ledger from store, `formatDayMonth`
- Produces: navigation into `fill/[id]`

Per spec §9.4, the design's `PETROL 95 / DIESEL` split becomes `EXPIRES WITHIN 30 DAYS` / `LATER`.

**Expected seed values: `0.0 L` and `42.6 L`.** This is not a mistake. FIFO consumes the
oldest lots first, so whatever survives is always the *most recently bought* stock — here
the 28 Sep top-up, which expires 27 Dec, 88 days out. An expiry warning in the seeded
state would require an old lot to have survived newer ones, which FIFO makes impossible.
The left column is therefore zero, and correctly so. The accent-when-non-zero branch is
covered by the `expiringWithin` unit tests in Task 4, not by the seed.

A `Soonest expiry` line beneath the split carries the guardrail in the seeded state.

- [ ] **Step 1: Implement**

```tsx
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { SectionLabel } from '../src/components/SectionLabel';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { useWallet, selectBalance, selectExpiringSoon } from '../src/store/wallet';
import { formatLitres, formatDayMonth } from '../src/lib/format';
import { TODAY } from '../src/data/seed';

export default function Balance() {
  const t = useTheme();
  const router = useRouter();
  const balance = useWallet(selectBalance);
  const soon = useWallet(selectExpiringSoon);
  const ledger = useWallet(s => s.ledger);
  const lots = useWallet(s => s.lots);

  const later = Math.round((balance - soon) * 10) / 10;
  const soonestExpiry = lots.length
    ? lots.map(l => l.expiresAt).sort((a, b) => a.getTime() - b.getTime())[0]
    : null;
  const rows = [...ledger].sort((a, b) => b.when.getTime() - a.when.getTime());
  const expiryFor = (ids?: string[]) => {
    const lot = ids?.length ? lots.find(l => l.id === ids[0]) : undefined;
    return lot ? lot.expiresAt : null;
  };

  return (
    <Screen>
      <ScreenHeader title="Balance" />

      <View style={{ paddingTop: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 7 }}>
          <Num size={74}>{formatLitres(balance)}</Num>
          <Num size={28} color={t.textDim}>L</Num>
        </View>

        <View style={{ flexDirection: 'row', marginTop: 26, borderTopWidth: 1, borderBottomWidth: 1, borderColor: t.hairline }}>
          <View style={{ flex: 1, paddingVertical: 16 }}>
            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: t.textMuted }}>EXPIRES WITHIN 30 DAYS</Text>
            <Num size={22} color={soon > 0 ? t.accent : t.text} style={{ marginTop: 9 }}>{formatLitres(soon)} L</Num>
          </View>
          <View style={{ width: 1, backgroundColor: t.hairline }} />
          <View style={{ flex: 1, paddingVertical: 16, paddingLeft: 20 }}>
            <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 9, letterSpacing: 1.44, color: t.textMuted }}>LATER</Text>
            <Num size={22} style={{ marginTop: 9 }}>{formatLitres(later)} L</Num>
          </View>
        </View>

        <Text style={{ marginTop: 14, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          {soonestExpiry
            ? `Soonest expiry · ${formatDayMonth(soonestExpiry)}. Unused litres convert back to the rand you paid — they never expire to zero.`
            : 'Unused litres convert back to the rand you paid — they never expire to zero.'}
        </Text>
      </View>

      <View style={{ paddingTop: 26, flex: 1 }}>
        <SectionLabel>Ledger</SectionLabel>
        <ScrollView style={{ marginTop: 6 }}>
          {rows.map(e => {
            const exp = e.kind === 'topup' ? expiryFor(e.lotIds) : null;
            const soonish = exp ? exp.getTime() - TODAY.getTime() < 14 * 86_400_000 : false;
            return (
              <Pressable
                key={e.id}
                accessibilityRole={e.kind === 'fill' ? 'button' : undefined}
                accessibilityLabel={`${e.what}, ${formatLitres(e.deltaLitres)} litres`}
                onPress={e.kind === 'fill' ? () => router.push(`/fill/${e.id}`) : undefined}
                style={{
                  flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
                  paddingVertical: 16, minHeight: 44, gap: 16,
                  borderBottomWidth: 1, borderBottomColor: t.hairline,
                  borderLeftWidth: e.card?.disputed ? 2 : 0, borderLeftColor: t.accent,
                  paddingLeft: e.card?.disputed ? 10 : 0,
                }}
              >
                <View>
                  <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 14, color: t.text }}>{e.what}</Text>
                  <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 11, color: t.textMuted, marginTop: 7 }}>
                    {formatDayMonth(e.when)} · {e.detail}
                    {exp ? (
                      <Text style={{ color: soonish ? t.accent : t.textMuted }}>
                        {`  ·  expires ${formatDayMonth(exp)}`}
                      </Text>
                    ) : null}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Num size={15} color={e.deltaLitres > 0 ? t.positive : t.text}>
                    {e.deltaLitres > 0 ? '+' : '−'}{formatLitres(Math.abs(e.deltaLitres))} L
                  </Num>
                  <Num size={11} weight="500" color={t.textMuted} style={{ marginTop: 7 }}>
                    {formatLitres(e.balanceAfter)} L
                  </Num>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ paddingBottom: 12 }}>
        <Button label="TOP UP" onPress={() => router.push('/top-up')} />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify**

Check: the split reads `0.0 L` / `42.6 L` (see the note above — this is correct under
FIFO); `Soonest expiry · 27 Dec` appears beneath it; top-up rows show an expiry date; the
newest row's running balance is `42.6 L`; tapping a fill row opens the fill detail.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add balance screen with expiry split and ledger"
```

---

### Task 15: Fill detail screen

**Files:**
- Create: `app/fill/[id].tsx`

**Interfaces:**
- Consumes: ledger from store, `useWallet.disputeFill`
- Produces: nothing consumed downstream

Per spec §8.4: shows the conversion as an equation, names the zone and effective date, and offers a dispute button.

- [ ] **Step 1: Implement**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet } from '../../src/store/wallet';
import { formatLitres, formatRand, formatPrice, formatDayMonth } from '../../src/lib/format';
import { PRICES } from '../../src/data/prices';

export default function FillDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useWallet(s => s.ledger.find(e => e.id === id));
  const dispute = useWallet(s => s.disputeFill);

  if (!entry?.card) {
    return <Screen><ScreenHeader title="Fill" /><Text style={{ color: t.text }}>Not found.</Text></Screen>;
  }
  const c = entry.card;
  const effective = PRICES
    .filter(p => p.zone === c.zone && p.effectiveFrom.getTime() <= entry.when.getTime())
    .sort((a, b) => b.effectiveFrom.getTime() - a.effectiveFrom.getTime())[0];

  return (
    <Screen>
      <ScreenHeader title="Fill" />

      <View style={{ paddingTop: 36 }}>
        <SectionLabel>How this was worked out</SectionLabel>

        <View style={{ marginTop: 22, gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
            <Num size={34}>R{formatRand(c.randAmount)}</Num>
            <Num size={24} color={t.textMuted}>÷</Num>
            <Num size={34}>R{formatPrice(c.pricePerLitre)}</Num>
            <Num size={16} color={t.textDim}>/L</Num>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
            <Num size={24} color={t.textMuted}>=</Num>
            <Num size={44} color={t.positive}>{formatLitres(c.litres)}</Num>
            <Num size={20} color={t.textDim}>L</Num>
          </View>
        </View>

        <Text style={{ marginTop: 18, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Gauteng {c.zone} · Petrol 95 · price effective {formatDayMonth(effective.effectiveFrom)}
        </Text>
      </View>

      <View style={{ marginTop: 34 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 17 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: t.text }}>Station</Text>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>{c.merchantDescriptor}</Text>
        </View>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 17 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: t.text }}>Date</Text>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>{formatDayMonth(entry.when)}</Text>
        </View>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 17 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: t.text }}>Balance after</Text>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>{formatLitres(entry.balanceAfter)} L</Text>
        </View>
        <Rule />
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12 }}>
        <Button
          label={c.disputed ? 'REPORTED — WE’LL CHECK IT' : "THIS DOESN'T MATCH MY RECEIPT"}
          variant="secondary"
          disabled={c.disputed}
          onPress={() => dispute(entry.id)}
        />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify**

Check: the equation renders in tabular numerals and reads correctly for the 30 Sep Shell fill; tapping dispute marks it and the Balance ledger row gains a rust left rule.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add fill detail screen with conversion transparency"
```

---

### Task 16: Stations screen (artboard 06, repurposed)

**Files:**
- Modify: `app/(tabs)/stations.tsx`

**Interfaces:**
- Consumes: `STATIONS`, `priceOn`
- Produces: nothing consumed downstream

Per spec §9.5: the zone price is stated once at the top; the per-station price column is removed; the `DIESEL` chip is gone.

- [ ] **Step 1: Implement**

```tsx
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { Rule } from '../../src/components/Rule';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { STATIONS } from '../../src/data/stations';
import { priceOn } from '../../src/data/prices';
import { formatPrice } from '../../src/lib/format';
import { TODAY } from '../../src/data/seed';

const CHIPS = ['NEAR ME', '24 HOURS'];

export default function Stations() {
  const t = useTheme();
  const price = priceOn('inland', TODAY);

  return (
    <Screen>
      <ScreenHeader title="Stations" back={false} />

      <View style={{ paddingTop: 30 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Num size={62}>R{formatPrice(price)}</Num>
          <Text style={{ fontFamily: 'Outfit_600SemiBold', fontSize: 15, color: t.textDim }}>/ L</Text>
        </View>
        <Text style={{ marginTop: 10, fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1.54, color: t.textDim }}>
          PETROL 95 · GAUTENG INLAND
        </Text>
        <Text style={{ marginTop: 10, fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18, color: t.textMuted }}>
          Regulated. The same at every station in this zone — so your card works anywhere.
        </Text>

        <View style={{ marginTop: 22, height: 46, borderWidth: 1, borderColor: t.border, justifyContent: 'center', paddingHorizontal: 14 }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 14, color: t.textMuted }}>Search suburb or brand</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {CHIPS.map((c, i) => (
            <View key={c} style={{
              paddingHorizontal: 13, paddingVertical: 8,
              backgroundColor: i === 0 ? t.text : 'transparent',
              borderWidth: i === 0 ? 0 : 1, borderColor: t.border,
            }}>
              <Text style={{
                fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 0.66,
                color: i === 0 ? t.inverse : t.textDim,
              }}>{c}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ paddingTop: 26, flex: 1 }}>
        <Rule />
        <ScrollView>
          {STATIONS.map(s => (
            <View key={s.id} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 17, minHeight: 44, gap: 16,
              borderBottomWidth: 1, borderBottomColor: t.hairline,
            }}>
              <View>
                <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 15, letterSpacing: -0.15, color: t.text }}>{s.name}</Text>
                <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, color: t.textMuted, marginTop: 7 }}>
                  {s.suburb} · {s.hours}
                </Text>
              </View>
              <Num size={15}>{s.km.toFixed(1)} km</Num>
            </View>
          ))}
        </ScrollView>
      </View>

      <View style={{ paddingBottom: 12 }}>
        <Button label="VIEW ON MAP" variant="white" />
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify**

Check: no per-station prices anywhere; the zone price appears once; only two filter chips.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add stations screen with single zone price"
```

---

### Task 17: Savings screen (artboard 07)

**Files:**
- Modify: `app/(tabs)/savings.tsx`

**Interfaces:**
- Consumes: `savingsToDate`, `litresBelowPump`, `averageBuyPrice`
- Produces: nothing consumed downstream

- [ ] **Step 1: Implement**

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Rule } from '../../src/components/Rule';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet } from '../../src/store/wallet';
import { savingsToDate, litresBelowPump, averageBuyPrice } from '../../src/lib/savings';
import { formatRandWhole, formatLitres, formatPrice } from '../../src/lib/format';
import { priceOn } from '../../src/data/prices';
import { TODAY } from '../../src/data/seed';

const BARS = [
  { month: 'APR', pct: 42, v: 'R128' }, { month: 'MAY', pct: 61, v: 'R186' },
  { month: 'JUN', pct: 34, v: 'R104' }, { month: 'JUL', pct: 88, v: 'R271' },
  { month: 'AUG', pct: 72, v: 'R221' }, { month: 'SEP', pct: 100, v: 'R374' },
];

export default function Savings() {
  const t = useTheme();
  const ledger = useWallet(s => s.ledger);
  const saved = savingsToDate(ledger);
  const below = litresBelowPump(ledger);
  const avg = averageBuyPrice(ledger);
  const pump = priceOn('inland', TODAY);

  return (
    <Screen>
      <ScreenHeader title="Savings" back={false} />

      <View style={{ paddingTop: 40 }}>
        <SectionLabel>Saved since March</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 }}>
          <Num size={34} color={t.positive}>R</Num>
          <Num size={82} color={t.positive}>{formatRandWhole(Math.max(0, saved))}</Num>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 16 }}>
          <View style={{
            width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderBottomWidth: 9,
            borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.positive,
          }} />
          <Num size={15} weight="500" color={t.textDim}>{formatLitres(below)} L bought below the pump price</Num>
        </View>
      </View>

      <View style={{ marginTop: 34 }}><Rule /></View>

      <View style={{ paddingTop: 24 }}>
        <SectionLabel>Per top-up</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 150, marginTop: 24 }}>
          {BARS.map(b => (
            <View key={b.month} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
              <Num size={11} weight="600" color={t.textDim}>{b.v}</Num>
              <View style={{ width: '100%', height: b.pct, backgroundColor: b.pct === 100 ? t.positive : t.border }} />
              <Num size={10} weight="500" color={t.textMuted}>{b.month}</Num>
            </View>
          ))}
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 15 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textDim }}>Average buy price</Text>
          <Num size={15}>R{formatPrice(avg)}/L</Num>
        </View>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textDim }}>Pump price today</Text>
          <Num size={15}>R{formatPrice(pump)}/L</Num>
        </View>
        <Rule />
        <Text style={{ fontFamily: 'Outfit_400Regular', fontSize: 12, lineHeight: 18.6, color: t.textMuted }}>
          Savings are the difference between what you paid per litre and the pump price on the day you fuelled.
        </Text>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify**

Check: the hero is lime; the September bar is lime and full height; average buy price is below the pump price.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add savings screen"
```

---

### Task 18: Alerts and Subscribe screens (artboard 04, plus new)

**Files:**
- Create: `app/alerts.tsx`, `app/subscribe.tsx`

**Interfaces:**
- Consumes: `useWallet.setSubscription`
- Produces: nothing consumed downstream

- [ ] **Step 1: Implement the alerts screen**

`app/alerts.tsx` — lock-screen mock and in-app card, copy verbatim from artboard 04:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { SectionLabel } from '../src/components/SectionLabel';
import { Rule } from '../src/components/Rule';
import { Button } from '../src/components/Button';
import { BarrelMark } from '../src/components/BarrelMark';
import { useTheme } from '../src/theme/ThemeProvider';

export default function Alerts() {
  const t = useTheme();
  const router = useRouter();
  return (
    <Screen>
      <ScreenHeader title="Price alert" />

      <View style={{ paddingTop: 24 }}>
        <SectionLabel>Lock screen</SectionLabel>
        <View style={{ marginTop: 14, borderWidth: 1, borderColor: t.border, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
              <BarrelMark size={14} />
              <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 13, letterSpacing: -0.26, color: t.text }}>BARREL</Text>
            </View>
            <Num size={11} weight="500" color={t.textMuted}>now</Num>
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 18 }}>
            <View style={{
              width: 0, height: 0, borderLeftWidth: 11, borderRightWidth: 11, borderBottomWidth: 16,
              borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent, marginTop: 6,
            }} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 25, lineHeight: 26.5, letterSpacing: -0.875, color: t.text }}>
                Petrol price rising 12c on the 2nd — top up now
              </Text>
              <Text style={{ marginTop: 16, fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textDim, fontVariant: ['tabular-nums'] }}>
                R21.87 <Text style={{ color: t.textMuted }}>→</Text> <Text style={{ color: t.accent }}>R21.99</Text> /L
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingTop: 36 }}>
        <SectionLabel>In-app card</SectionLabel>
        <View style={{ marginTop: 14, borderWidth: 1, borderColor: t.hairline, padding: 22 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 11, letterSpacing: 1.54, color: t.textDim }}>PRICE ALERT · 02 OCT</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{
                width: 0, height: 0, borderLeftWidth: 5, borderRightWidth: 5, borderBottomWidth: 8,
                borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: t.accent,
              }} />
              <Num size={13} color={t.accent}>+12c</Num>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 20 }}>
            <Num size={54}>2.4</Num>
            <Num size={18} color={t.textDim}>L saved</Num>
          </View>
          <Text style={{ marginVertical: 14, fontFamily: 'Outfit_400Regular', fontSize: 13, lineHeight: 19.5, color: t.textDim }}>
            Topping up R2 000 before the increase buys you 2.4 litres more than it will on Wednesday.
          </Text>
          <Button label="TOP UP BEFORE 01 OCT" height={54} onPress={() => router.push('/top-up')} />
        </View>
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 14, gap: 14 }}>
        <Rule />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 13, color: t.textMuted }}>Alert me when 95 moves by</Text>
          <Num size={14}>≥ 10c</Num>
        </View>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 2: Implement the subscribe screen**

`app/subscribe.tsx`, per spec §9.3:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../src/components/Screen';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { Num } from '../src/components/Num';
import { Rule } from '../src/components/Rule';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';
import { useWallet } from '../src/store/wallet';

const INCLUDED = [
  'Price lock on every litre you buy',
  'Price-increase alerts before they land',
  'Works at any fuel station in South Africa',
  'No markup on fuel — ever',
];

export default function Subscribe() {
  const t = useTheme();
  const router = useRouter();
  const setSubscription = useWallet(s => s.setSubscription);

  return (
    <Screen>
      <ScreenHeader title="Subscription" />

      <View style={{ paddingTop: 44 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Num size={34} color={t.textMuted}>R</Num>
          <Num size={82}>59</Num>
          <Text style={{ fontFamily: 'Outfit_500Medium', fontSize: 17, color: t.textDim }}>/ month</Text>
        </View>
      </View>

      <View style={{ paddingTop: 40 }}>
        <Rule />
        {INCLUDED.map(line => (
          <View key={line}>
            <View style={{ paddingVertical: 17, flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 14, color: t.positive }}>—</Text>
              <Text style={{ flex: 1, fontFamily: 'Outfit_500Medium', fontSize: 14, lineHeight: 20, color: t.text }}>{line}</Text>
            </View>
            <Rule />
          </View>
        ))}
      </View>

      <View style={{ marginTop: 'auto', paddingBottom: 12, gap: 12 }}>
        <Button label="START 30-DAY TRIAL" onPress={() => { setSubscription('trial'); router.back(); }} />
        <Text style={{ textAlign: 'center', fontFamily: 'Outfit_400Regular', fontSize: 12, color: t.textMuted }}>
          Cancel any time. Your litres stay yours.
        </Text>
      </View>
    </Screen>
  );
}
```

- [ ] **Step 3: Verify**

Check: both screens render in dark and light; the alert triangle is rust; the subscribe CTA returns to the previous screen.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add price alerts and subscription screens"
```

---

### Task 19: Settings screen and final pass (artboard 09)

**Files:**
- Modify: `app/(tabs)/settings.tsx`

**Interfaces:**
- Consumes: `useWallet` toggles, appearance, subscription
- Produces: nothing consumed downstream

- [ ] **Step 1: Implement**

```tsx
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { Num } from '../../src/components/Num';
import { SectionLabel } from '../../src/components/SectionLabel';
import { Row } from '../../src/components/Row';
import { Toggle } from '../../src/components/Toggle';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeProvider';
import { useWallet, Appearance } from '../../src/store/wallet';
import { MONTHLY_CAP_LITRES } from '../../src/lib/caps';

const TOGGLE_LABELS = ['Price increase alerts', 'Weekly balance summary', 'Station promotions'];
const NEXT: Record<Appearance, Appearance> = { dark: 'light', light: 'system', system: 'dark' };

export default function Settings() {
  const t = useTheme();
  const router = useRouter();
  const alerts = useWallet(s => s.alerts);
  const toggleAlert = useWallet(s => s.toggleAlert);
  const appearance = useWallet(s => s.appearance);
  const setAppearance = useWallet(s => s.setAppearance);
  const trialDaysLeft = useWallet(s => s.trialDaysLeft);

  return (
    <Screen>
      <ScreenHeader title="Settings" back={false} />
      <ScrollView>
        <View style={{ paddingTop: 34, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <View style={{ width: 54, height: 54, backgroundColor: t.text, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: 'Outfit_800ExtraBold', fontSize: 20, letterSpacing: -0.4, color: t.inverse }}>TM</Text>
          </View>
          <View>
            <Text style={{ fontFamily: 'Outfit_700Bold', fontSize: 20, letterSpacing: -0.4, color: t.text }}>Thabo Makhubela</Text>
            <Num size={12} weight="500" color={t.textMuted} style={{ marginTop: 8 }}>+27 82 123 4567 · verified</Num>
          </View>
        </View>

        <View style={{ paddingTop: 32 }}>
          <SectionLabel>Alerts</SectionLabel>
          <View style={{ marginTop: 8 }}>
            {TOGGLE_LABELS.map((label, i) => (
              <Row key={label} label={label} right={
                <Toggle on={alerts[i]} label={label} onPress={() => toggleAlert(i)} />
              } />
            ))}
          </View>
        </View>

        <View style={{ paddingTop: 28 }}>
          <SectionLabel>Account</SectionLabel>
          <View style={{ marginTop: 8 }}>
            <Row label="Subscription" value={`Trial · ${trialDaysLeft} days left`} onPress={() => router.push('/subscribe')} />
            <Row label="Payment methods" value="FNB ••4127" />
            <Row label="Linked vehicle" value="CA 418 921" />
            <Row label="Monthly cap" value={`${MONTHLY_CAP_LITRES} L`} />
            <Row label="Fuel grade" value="Petrol 95" />
            <Row
              label="Appearance"
              value={appearance[0].toUpperCase() + appearance.slice(1)}
              onPress={() => setAppearance(NEXT[appearance])}
            />
            <Row label="Help & FICA documents" value="→" />
          </View>
        </View>

        <View style={{ paddingTop: 24, paddingBottom: 12, gap: 14 }}>
          <Button label="SIGN OUT" variant="secondary" height={54} />
          <Num size={11} weight="500" color={t.textMuted} style={{ textAlign: 'center' }}>
            Barrel v2.4.0 · FSP number pending
          </Num>
        </View>
      </ScrollView>
    </Screen>
  );
}
```

- [ ] **Step 2: Verify the whole app in both themes**

Run: `npx expo start`

Walk every screen with Appearance on Dark, then Light, then System. Confirm: no raw hex leaks (light mode has no black-on-black text), every tab reachable, top-up and the cap meter update live, disputing a fill shows on the ledger.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS, all suites.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add settings screen with appearance and subscription rows"
```

---

## Verification Checklist

Run before calling the build done:

- [ ] `npm test` — all suites pass
- [ ] `npx tsc --noEmit` — no type errors
- [ ] Every one of the five tabs renders and is reachable
- [ ] Wallet reads `42.6 L` / `R 931.66`
- [ ] Top up: keypad works, litres recompute, cap meter reads `105.2 / 150 L`, confirm disables above the cap
- [ ] Balance: expiry split reads `0.0 L` / `42.6 L` with `Soonest expiry · 27 Dec`; newest ledger row shows `42.6 L`
- [ ] Fill detail: equation renders; dispute marks the ledger row with a rust left rule
- [ ] Stations: exactly one price on the screen
- [ ] Card: pass stays white in both themes; freeze works
- [ ] Light mode matches artboard 05 with no unreadable text
- [ ] `grep -rn "#[0-9A-Fa-f]\{6\}" src/components app` returns only `src/theme/tokens.ts` and the deliberate pass-white in `card.tsx`
