# Barrel Pump Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin the Barrel prototype into the "Pump" instrument language across all 11 screens, add fill history, a savings rework, the price-rise moment, simulated live fills, a lot expiry timeline and burn-rate top-up sizing, on a re-cut laddered seed.

**Architecture:** Strictly layered and in this order — tokens, then primitives, then pure functions, then the seed, then screens. Nothing visual moves until the foundation is tested. `src/lib` and `src/data` stay pure, React-free, and never call `now()`; they take an explicit `at: Date`. The store wraps them. Screens read the store and never branch on the theme.

**Tech Stack:** Expo 57 / React Native 0.86 / expo-router / zustand 5 / react-native-svg 15 (already installed) / jest-expo / TypeScript 6.

**Spec:** `docs/superpowers/specs/2026-09-09-barrel-pump-redesign-design.md`

## Global Constraints

Every task's requirements implicitly include all of these. Values are copied verbatim from the spec.

- **Hex appears only in `src/theme/tokens.ts`.** Verify with `grep -rnE "#[0-9A-Fa-f]{3,6}" src/ app/` — hits only `tokens.ts` and its test. Everything else uses `useTheme()`.
- **Never set `fontWeight` against a custom font family.** Each weight is a separate family (`Figtree_800ExtraBold`, `JetBrainsMono_700Bold`). Weight must select a family name. This now applies to `SectionLabel` for the first time, because it moves off system Menlo.
- **`src/lib` and `src/data` must never call `now()`.** Every date-sensitive function takes `at: Date`. Only the store and screens call `now()`, hoisting one `const at = now()` per action or render.
- **One definition per operation.** `round1`/`toCents` in `src/lib/round.ts`, the 90-day window in `src/lib/window.ts`, FIFO+cost in `src/lib/lots.ts`, price lookup in `src/data/prices.ts`, the clock in `src/lib/clock.ts`.
- **Never hardcode a number a function can derive.** Prices, deltas, dates and litres come from `priceOn`, `nextPriceChange`, the store or the formatters.
- **Two caps, not interchangeable.** `MONTHLY_TOPUP_CAP_L` = 500 (buy in, per calendar month). `WEEKLY_REDEMPTION_CAP_L` = 110 (spend out, rolling 7 days). `REDEMPTION_CAP_WINDOW_DAYS` = 7 is not `REDEMPTION_DAYS` = 90.
- **Tab screens pass `insetBottom={false}` to `<Screen>`; pushed screens do not.** Pass `scroll={false}` only when the screen owns its own ScrollView.
- **The card pass uses the `PASS` token group, never `useTheme()`.** It depicts a physical white Wallet pass and looks identical in both themes.
- **A lapsed subscription must never block the card or the existing balance.** It greys `TOP UP` only.
- **The clock stays pinned** to `DEMO_NOW` (30 September 2026). Never call `setClock(() => new Date())`.
- **Colour semantics:** amber = fuel and price; lime = savings; off-white/ink = neutral fact. Direction is carried by glyphs (▲ ▼) and copy, never a third colour.
- **Savings copy may never imply savings compound.** The 90-day window caps price advantage at roughly R20 on a 42 L balance. The product sells price certainty, not accumulated profit.
- After every task: `npm test` green and `npx tsc --noEmit` clean before committing.

---

# Phase 1 — Foundation

---

### Task 1: Pump tokens and a self-enforcing contrast test

**Files:**
- Modify: `src/theme/tokens.ts`
- Modify: `src/theme/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `Tokens` type gains `accentText: string` and `heroInk: string`. `DARK` and `LIGHT` take the values in Step 3. `RADIUS` becomes `{ xs: 2, sm: 4, md: 6, lg: 10, pill: 999 }`. `PASS`, `Elevation`, `ElevationSet`, `DARK_ELEVATION`, `LIGHT_ELEVATION` unchanged.

- [ ] **Step 1: Write the failing contrast test**

Add to the top of `src/theme/__tests__/tokens.test.ts`, above the existing imports' usage. The helpers are inlined here deliberately — a `contrast.ts` file under `__tests__/` would be collected by jest as a suite with no tests and fail.

```ts
// WCAG 2.1 relative luminance and contrast ratio. Inlined rather than put in
// a module because every consumer of it is this file, and a helper file under
// __tests__/ is collected as a (test-less, failing) suite.
function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}
function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}
function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

Then add these suites:

```ts
// The whole light-mode decision rests on measured contrast: the app is opened
// outdoors at a pump, where glare adds a white veil that crushes mid-luminance
// colour. AA is not enough through that; AAA is roughly what survives. Pinned
// here so the palette enforces itself rather than relying on a review.
describe('contrast', () => {
  test('the helper agrees with known WCAG values', () => {
    expect(contrast('#000000', '#FFFFFF')).toBeCloseTo(21, 1);
    expect(contrast('#FFFFFF', '#FFFFFF')).toBeCloseTo(1, 5);
  });

  test('every dark-mode text token clears AA on its own ground', () => {
    for (const token of ['text', 'textDim', 'textMuted', 'accentText', 'positiveText', 'heroInk'] as const) {
      expect(contrast(DARK[token], DARK.bg)).toBeGreaterThanOrEqual(4.5);
    }
  });

  test('every light-mode text token clears AAA on its own ground', () => {
    for (const token of ['text', 'textDim', 'textMuted', 'accentText', 'positiveText', 'heroInk'] as const) {
      expect(contrast(LIGHT[token], LIGHT.bg)).toBeGreaterThanOrEqual(7);
    }
  });

  test('borders meet the 3:1 minimum for non-text UI in both themes', () => {
    expect(contrast(LIGHT.border, LIGHT.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(DARK.border, DARK.bg)).toBeGreaterThanOrEqual(1.4);
  });

  test('a fill carries readable text set on it', () => {
    // Light mode uses amber as a FILL with ink on it, not as text.
    expect(contrast(LIGHT.text, LIGHT.accent)).toBeGreaterThanOrEqual(7);
    expect(contrast(DARK.inverse, DARK.accent)).toBeGreaterThanOrEqual(7);
  });

  test('light-mode positive is visible as a chart fill against the ground', () => {
    // The prior ruling kept LIGHT.positive at #C6F24E on the reasoning that a
    // fill only contends with neighbouring fills. At 1.3:1 on white a lime bar
    // is genuinely hard to locate, so it now meets the 3:1 UI minimum.
    expect(contrast(LIGHT.positive, LIGHT.bg)).toBeGreaterThanOrEqual(3);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest src/theme/__tests__/tokens.test.ts`
Expected: FAIL. `DARK.accentText`/`heroInk` are undefined, so `luminance` throws on `undefined.replace`, and the light-mode AAA assertions fail against the current `#A8A8A8`.

- [ ] **Step 3: Rewrite the token values**

Replace the `Tokens` type, `DARK`, `LIGHT` and `RADIUS` in `src/theme/tokens.ts`. Leave `PASS`, the elevation types, `NONE`, `LIGHT_ELEVATION` and `DARK_ELEVATION` exactly as they are.

```ts
export type Tokens = {
  bg: string; bgRaised: string; surface: string; border: string; hairline: string;
  textMuted: string; textDim: string; text: string; inverse: string;
  accent: string; accentText: string;
  positive: string; positiveText: string;
  heroInk: string;
};

/**
 * Pump — the night face. Amber on warm near-black, borrowed from a fuel-pump
 * readout. `bg` is #0A0908 rather than pure black: warm reads as machined
 * metal, and elevation is absent in dark either way (see DARK_ELEVATION).
 */
export const DARK: Tokens = {
  bg: '#0A0908', bgRaised: '#0E0D0C', surface: '#1C1917', border: '#2E2A26',
  hairline: '#1C1917', textMuted: '#857E74', textDim: '#A79E93',
  text: '#F5F1EA', inverse: '#0A0908',
  // On this ground amber is legible as text (7.6:1), so accent and accentText
  // hold the same value. The split only bites in light mode.
  accent: '#FF7A1A', accentText: '#FF7A1A',
  positive: '#D6E84A', positiveText: '#D6E84A',
  heroInk: '#FF7A1A',
};

/**
 * Pump — the day face. Bright, because this app is opened standing at a pump
 * outdoors. Glare adds a flat white veil: it can only ADD light, so the
 * brighter the ground, the more of the contrast range survives it. Pure white
 * at full panel output beats an off-white at ~82%. The warm character lives in
 * the greys instead of the ground.
 *
 * Every text value here clears 7:1 (AAA), not the 4.5:1 AA floor. Under a veil
 * AA is not enough.
 */
export const LIGHT: Tokens = {
  bg: '#FFFFFF', bgRaised: '#FFFFFF', surface: '#F7F5F0', border: '#948A78',
  hairline: '#DCD6C9', textMuted: '#5C554C', textDim: '#3A342D',
  text: '#000000', inverse: '#FFFFFF',
  // You cannot have an orange that is both luminous and high-contrast on
  // white — they are opposites. So in light mode amber stops being a text
  // colour and becomes a FILL with ink set on it (7.3:1): the price badge, the
  // gauge, the meter, the primary button. Road-sign logic. `accentText` is for
  // the small ▲ deltas where a filled block would be absurd.
  accent: '#FF6A00', accentText: '#9A3200',
  // `positive` changed value here, overturning the prior ruling that a fill
  // only contends with neighbouring fills: #C6F24E is 1.3:1 on white and a
  // lime bar on a white chart ground is genuinely hard to locate.
  positive: '#7A9000', positiveText: '#3F5406',
  // A hero cannot be amber on white and stay legible, so the hero's colour is
  // its own token rather than a branch inside a screen.
  heroInk: '#0A0908',
};
```

And the radius scale — instruments have tight corners:

```ts
export const RADIUS = {
  xs: 2,     // meters, chart bars, the gauge's segments
  sm: 4,     // chips, small boxes, the grade selector
  md: 6,     // buttons and panels
  lg: 10,    // the card pass
  pill: 999, // the Toggle track and knob
} as const;
```

- [ ] **Step 4: Re-pin the existing token assertions**

The existing suite pins the old values and will now fail. Replace these three tests in `src/theme/__tests__/tokens.test.ts`:

```ts
test('accent and positive are fills; each has a text twin', () => {
  // Two fill/text pairs now, not one. In dark both twins hold the same value
  // because the dark ground is forgiving; in light they must differ.
  expect(DARK.accent).toBe('#FF7A1A');
  expect(DARK.accentText).toBe(DARK.accent);
  expect(DARK.positiveText).toBe(DARK.positive);

  expect(LIGHT.accentText).not.toBe(LIGHT.accent);
  expect(LIGHT.positiveText).not.toBe(LIGHT.positive);
});

test('dark ground is warm near-black and light ground is pure white', () => {
  expect(DARK.bg).toBe('#0A0908');
  expect(LIGHT.bg).toBe('#FFFFFF');
});

test('heroInk is amber at night and ink in daylight', () => {
  expect(DARK.heroInk).toBe(DARK.accent);
  expect(LIGHT.heroInk).not.toBe(LIGHT.accent);
});
```

Delete the old `accents are identical across themes` and `positiveText is the one token that legitimately differs between themes` tests — both are now false by design. Keep `both themes define every token`, the whole `PASS` group, the `RADIUS` shape tests (the scale still ascends and still has five steps) and the entire elevation and MOTION describes untouched.

- [ ] **Step 5: Run the suite**

Run: `npx jest src/theme/__tests__/tokens.test.ts`
Expected: PASS.

- [ ] **Step 6: Confirm the hex invariant still holds**

Run: `grep -rnE "#[0-9A-Fa-f]{3,6}" src/ app/ | grep -v "src/theme/tokens.ts" | grep -v "src/theme/__tests__/tokens.test.ts"`
Expected: no output other than the `Toggle.tsx` match that lives inside a comment.

- [ ] **Step 7: Run the whole suite to see what the new palette broke**

Run: `npm test`
Expected: PASS. No screen reads a token *value*, only a token name, so nothing else should move. If anything fails, it is reading a hex literal and that is the bug.

- [ ] **Step 8: Commit**

```bash
git add src/theme/tokens.ts src/theme/__tests__/tokens.test.ts
git commit -m "feat(theme): Pump palette, amber's text twin, and a self-enforcing contrast test"
```

---

### Task 2: JetBrains Mono, the Readout component, and retiring Num

**Files:**
- Modify: `package.json` (add `@expo-google-fonts/jetbrains-mono`)
- Modify: `app/_layout.tsx`
- Create: `src/components/Readout.tsx`
- Create: `src/components/__tests__/Readout.test.tsx`
- Delete: `src/components/Num.tsx`, `src/components/__tests__/Num.test.tsx`
- Modify: `src/components/SectionLabel.tsx`
- Modify: every file importing `Num` — `app/(tabs)/index.tsx`, `app/(tabs)/card.tsx`, `app/(tabs)/savings.tsx`, `app/(tabs)/settings.tsx`, `app/balance.tsx`, `app/top-up.tsx`, `app/alerts.tsx`, `app/subscribe.tsx`, `app/fill/[id].tsx`

**Interfaces:**
- Consumes: `useTheme()` from Task 1's tokens.
- Produces: `Readout({ children, size, color, weight, style, roll })` where `weight` is `'400' | '500' | '700' | '800'`, default `'800'`. Drop-in for `Num` — same first five props, same semantics. `roll` defaults `false`.

- [ ] **Step 1: Install the font package**

Run: `npx expo install @expo-google-fonts/jetbrains-mono`

- [ ] **Step 2: Write the failing Readout test**

Create `src/components/__tests__/Readout.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Readout } from '../Readout';

// The rule this file exists to enforce: RN does not synthesize weights for
// custom fonts, so `fontWeight` against a fixed family is a no-op and can
// silently fall back to the system font on iOS. Weight must select a family.
describe('Readout', () => {
  test('maps each weight to its own family, never to fontWeight', () => {
    const cases: [string, string][] = [
      ['400', 'JetBrainsMono_400Regular'],
      ['500', 'JetBrainsMono_500Medium'],
      ['700', 'JetBrainsMono_700Bold'],
      ['800', 'JetBrainsMono_800ExtraBold'],
    ];
    for (const [weight, family] of cases) {
      const { getByText } = render(<Readout size={20} weight={weight as any}>42.6</Readout>);
      const style = getByText('42.6').props.style;
      const flat = Array.isArray(style) ? Object.assign({}, ...style.flat()) : style;
      expect(flat.fontFamily).toBe(family);
      expect(flat.fontWeight).toBeUndefined();
    }
  });

  test('defaults to extra bold', () => {
    const { getByText } = render(<Readout size={20}>931.66</Readout>);
    const style = getByText('931.66').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat()) : style;
    expect(flat.fontFamily).toBe('JetBrainsMono_800ExtraBold');
  });

  test('an unknown weight falls back to extra bold rather than the system font', () => {
    const { getByText } = render(<Readout size={20} weight={'600' as any}>12.0</Readout>);
    const style = getByText('12.0').props.style;
    const flat = Array.isArray(style) ? Object.assign({}, ...style.flat()) : style;
    expect(flat.fontFamily).toBe('JetBrainsMono_800ExtraBold');
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npx jest src/components/__tests__/Readout.test.tsx`
Expected: FAIL with "Cannot find module '../Readout'".

- [ ] **Step 4: Write Readout**

Create `src/components/Readout.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Text, TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { MOTION } from '../theme/motion';

// Each weight is a separate family — RN does not synthesize weights for custom
// fonts, and `fontWeight` against a fixed family is a silent no-op that can
// fall back to the system font on iOS. These four are exactly the ones
// app/_layout.tsx loads; do not add a fifth here without loading it there.
//
// JetBrains Mono replaced Figtree for numerals because a pump readout is
// monospaced — and because monospaced digits CANNOT change width, which
// retires the `fontVariant: ['tabular-nums']` dependency entirely. That
// dependency is what disqualified DM Sans; it no longer constrains anything.
const FAMILY: Record<string, string> = {
  '400': 'JetBrainsMono_400Regular',
  '500': 'JetBrainsMono_500Medium',
  '700': 'JetBrainsMono_700Bold',
  '800': 'JetBrainsMono_800ExtraBold',
};

export function Readout({
  children, size, color, weight = '800', style, roll = false,
}: {
  children: React.ReactNode;
  size: number;
  color?: string;
  weight?: '400' | '500' | '700' | '800';
  style?: TextStyle;
  /** Roll on change, like an odometer. For heroes that move under the user. */
  roll?: boolean;
}) {
  const t = useTheme();
  const shift = useRef(new Animated.Value(0)).current;
  const key = typeof children === 'string' || typeof children === 'number' ? String(children) : '';
  const previous = useRef(key);

  useEffect(() => {
    if (!roll || key === previous.current) return;
    previous.current = key;
    // Only transform and opacity, so the roll stays on the native driver and
    // never lands on the JS thread while a list is scrolling.
    shift.setValue(1);
    Animated.timing(shift, {
      toValue: 0, duration: MOTION.readout, useNativeDriver: true,
    }).start();
  }, [key, roll, shift]);

  const body = (
    <Text
      accessibilityLabel={typeof children === 'string' ? children : undefined}
      style={[{
        fontFamily: FAMILY[String(weight)] ?? FAMILY['800'],
        fontSize: size,
        color: color ?? t.text,
        letterSpacing: -0.045 * size,
      }, style]}
    >
      {children}
    </Text>
  );

  if (!roll) return body;

  return (
    <Animated.View style={{
      opacity: shift.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
      transform: [{
        translateY: shift.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.22] }),
      }],
    }}>
      {body}
    </Animated.View>
  );
}
```

- [ ] **Step 5: Run the test**

Run: `npx jest src/components/__tests__/Readout.test.tsx`
Expected: PASS.

- [ ] **Step 6: Load the font family**

In `app/_layout.tsx`, extend the import and the `useFonts` call:

```tsx
import {
  JetBrainsMono_400Regular, JetBrainsMono_500Medium,
  JetBrainsMono_700Bold, JetBrainsMono_800ExtraBold,
} from '@expo-google-fonts/jetbrains-mono';
```

```tsx
const [loaded] = useFonts({
  Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold,
  Figtree_700Bold, Figtree_800ExtraBold,
  JetBrainsMono_400Regular, JetBrainsMono_500Medium,
  JetBrainsMono_700Bold, JetBrainsMono_800ExtraBold,
});
```

- [ ] **Step 7: Move SectionLabel onto the same mono**

Replace the body of `src/components/SectionLabel.tsx`. **This is the trap in this task**: the file was correct as written *because* Menlo is a system font, where `fontWeight` is honoured. JetBrains Mono is a custom family, so the weight must now select a family name and `fontWeight` must go.

```tsx
import React from 'react';
import { Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

// One mono in the system, not two. Moving off system Menlo means `fontWeight`
// is no longer honoured here — a custom family needs the weight in its name.
// JetBrains Mono has no 600 loaded, so this takes 700.
export const SectionLabel = ({ children }: { children: string }) => {
  const t = useTheme();
  return (
    <Text style={{
      fontFamily: 'JetBrainsMono_700Bold',
      fontSize: 10, letterSpacing: 1.6,
      textTransform: 'uppercase', color: t.textMuted,
    }}>{children}</Text>
  );
};
```

- [ ] **Step 8: Migrate every Num call site**

This is mechanical — `Readout` is a drop-in for the five props `Num` had. In each of the nine screens listed under **Files**:

1. Change `import { Num } from '<path>/Num';` to `import { Readout } from '<path>/Readout';`
2. Replace every `<Num` with `<Readout` and every `</Num>` with `</Readout>`.
3. Any `weight="600"` becomes `weight="700"` — JetBrains Mono's 600 is not loaded.
4. Remove `fontVariant: ['tabular-nums']` wherever it appears on a numeric style; the family is monospaced, so it is now redundant.

Then delete both old files:

```bash
git rm src/components/Num.tsx src/components/__tests__/Num.test.tsx
```

- [ ] **Step 9: Verify nothing references Num**

Run: `grep -rn "\bNum\b" src/ app/ | grep -v Readout`
Expected: no output. Two definitions of "a number on screen" is the failure mode this step exists to prevent.

- [ ] **Step 10: Typecheck and test**

Run: `npx tsc --noEmit && npm test`
Expected: both clean.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat(type): JetBrains Mono numerals via Readout, retiring Num and the tnum dependency"
```

---

### Task 3: Motion for the readout roll and the arrival banner

**Files:**
- Modify: `src/theme/motion.ts`
- Modify: `src/theme/__tests__/tokens.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `MOTION.readout = 420`, `MOTION.banner = 260`.

- [ ] **Step 1: Write the failing test**

Add inside the existing `describe('MOTION', ...)` block in `src/theme/__tests__/tokens.test.ts`:

```ts
// readout and banner are deliberately NOT in the "feels like feedback" list
// above. That list caps at 300ms because a press must land under the finger.
// These two are transitions the user watches rather than causes, so they get
// their own, looser bound — but still short enough not to wait on.
test('the readout roll and the banner are transitions, not feedback', () => {
  expect(MOTION.readout).toBeGreaterThan(MOTION.screen);
  expect(MOTION.readout).toBeLessThanOrEqual(600);
  expect(MOTION.banner).toBeGreaterThan(0);
  expect(MOTION.banner).toBeLessThanOrEqual(400);
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx jest src/theme/__tests__/tokens.test.ts -t "transitions, not feedback"`
Expected: FAIL — `MOTION.readout` is undefined.

- [ ] **Step 3: Add the two durations**

Append to the `MOTION` object in `src/theme/motion.ts`, before the closing brace:

```ts
  /** Odometer roll when a numeric hero changes under the user — e.g. the
   *  balance dropping as a fill arrives. Longer than a press because it is
   *  watched, not caused. Animates transform and opacity only. */
  readout: 420,
  /** The arriving-fill banner's drop-in. */
  banner: 260,
```

- [ ] **Step 4: Run the test**

Run: `npx jest src/theme/__tests__/tokens.test.ts`
Expected: PASS. The pre-existing "every duration is short enough to feel like feedback" test still passes because its list is explicit and does not include these two.

- [ ] **Step 5: Commit**

```bash
git add src/theme/motion.ts src/theme/__tests__/tokens.test.ts
git commit -m "feat(motion): durations for the readout roll and the arrival banner"
```

---

### Task 4: Burn rate and top-up sizing

**Files:**
- Create: `src/lib/usage.ts`
- Create: `src/lib/__tests__/usage.test.ts`

**Interfaces:**
- Consumes: `LedgerEntry` from `src/data/types`, `round1`/`toCents` from `src/lib/round`, `DAY` from `src/lib/window`, `topUpCapRemaining` from `src/lib/caps`.
- Produces:
  - `burnRate(ledger: LedgerEntry[], at: Date): number` — litres per 30.44-day month across the span from the first fill to `at`. Returns `0` when there are no fills.
  - `suggestedTopUp(ledger: LedgerEntry[], at: Date, pricePerLitre: number): number` — a rand amount covering roughly one month of burn, rounded to the nearest R50, floored at R100, and capped so the litres it buys fit inside `topUpCapRemaining`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/usage.test.ts`:

```ts
import { LedgerEntry } from '../../data/types';
import { burnRate, suggestedTopUp } from '../usage';
import { MONTHLY_TOPUP_CAP_L } from '../caps';

const fill = (when: Date, litres: number): LedgerEntry => ({
  id: `f-${when.getTime()}`, kind: 'fill', what: 'Fill', when, detail: '',
  grade: '95', deltaLitres: -litres, balanceAfter: 0,
  buyPricePerLitre: 20,
  card: {
    merchantDescriptor: 'X', stationId: null, mcc: '5541', randAmount: litres * 21,
    zone: 'inland', pricePerLitre: 21, litres, disputed: false,
  },
});

const topup = (when: Date, litres: number): LedgerEntry => ({
  id: `t-${when.getTime()}`, kind: 'topup', what: 'Top up · 95', when, detail: '',
  grade: '95', deltaLitres: litres, balanceAfter: 0,
});

describe('burnRate', () => {
  test('is zero with no fills', () => {
    expect(burnRate([], new Date(2026, 8, 30))).toBe(0);
    expect(burnRate([topup(new Date(2026, 5, 1), 40)], new Date(2026, 8, 30))).toBe(0);
  });

  test('counts only fills, not top-ups or bonuses', () => {
    const at = new Date(2026, 8, 30);
    const withTopUp = burnRate(
      [fill(new Date(2026, 5, 30), 30), topup(new Date(2026, 6, 1), 500)], at);
    const without = burnRate([fill(new Date(2026, 5, 30), 30)], at);
    expect(withTopUp).toBe(without);
  });

  test('averages litres over the span from the first fill to `at`', () => {
    // Two fills of 30 L, first exactly three months before `at`.
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - 3 * 30.44 * 86_400_000);
    const rate = burnRate([fill(first, 30), fill(new Date(2026, 7, 30), 30)], at);
    expect(rate).toBeCloseTo(20, 0);
  });

  test('a single fill on the same day as `at` does not divide by zero', () => {
    const at = new Date(2026, 8, 30);
    const rate = burnRate([fill(at, 38)], at);
    expect(Number.isFinite(rate)).toBe(true);
    expect(rate).toBeGreaterThan(0);
  });
});

describe('suggestedTopUp', () => {
  test('is zero when there is nothing to go on', () => {
    expect(suggestedTopUp([], new Date(2026, 8, 30), 21.87)).toBe(0);
  });

  test('covers about a month of burn, rounded to the nearest R50', () => {
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - 2 * 30.44 * 86_400_000);
    // 60 L over two months = 30 L/month; at R21.87 that is R656.10 -> R650.
    const rand = suggestedTopUp([fill(first, 30), fill(at, 30)], at, 21.87);
    expect(rand % 50).toBe(0);
    expect(rand).toBeGreaterThanOrEqual(600);
    expect(rand).toBeLessThanOrEqual(700);
  });

  test('never suggests less than R100 when there is any usage at all', () => {
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - 12 * 30.44 * 86_400_000);
    expect(suggestedTopUp([fill(first, 1), fill(at, 1)], at, 21.87)).toBeGreaterThanOrEqual(100);
  });

  test('never suggests more litres than the monthly cap has left', () => {
    const at = new Date(2026, 8, 30);
    const first = new Date(at.getTime() - 30.44 * 86_400_000);
    // A heavy user plus a month already at the cap: the suggestion must fit.
    const ledger = [
      fill(first, 900), fill(at, 900),
      topup(new Date(2026, 8, 2), MONTHLY_TOPUP_CAP_L - 10),
    ];
    const rand = suggestedTopUp(ledger, at, 21.87);
    expect(rand / 21.87).toBeLessThanOrEqual(10);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/lib/__tests__/usage.test.ts`
Expected: FAIL with "Cannot find module '../usage'".

- [ ] **Step 3: Implement**

Create `src/lib/usage.ts`:

```ts
import { LedgerEntry } from '../data/types';
import { DAY } from './window';
import { topUpCapRemaining } from './caps';

/** Mean days in a Gregorian month. Used only for rate arithmetic. */
const MONTH_DAYS = 30.44;

const fills = (ledger: LedgerEntry[]) => ledger.filter(e => e.kind === 'fill' && e.card);

/**
 * Litres burned per month, measured from the first fill to `at`.
 *
 * Only fills count: a top-up moves litres the other way and a bonus is not
 * consumption. Takes an explicit `at` like everything else in this directory,
 * so it stays pure and testable.
 */
export function burnRate(ledger: LedgerEntry[], at: Date): number {
  const f = fills(ledger);
  if (f.length === 0) return 0;
  const litres = f.reduce((sum, e) => sum + e.card!.litres, 0);
  const first = f.reduce((min, e) => Math.min(min, e.when.getTime()), Infinity);
  // Floored at one month so a wallet with a single same-day fill reports that
  // fill as its monthly rate rather than dividing by ~zero and returning
  // Infinity, which would render as "Infinity L a month" on the Wallet.
  const months = Math.max(1, (at.getTime() - first) / (MONTH_DAYS * DAY));
  return litres / months;
}

/**
 * A rand amount covering roughly one month of driving.
 *
 * Replaces the Top up screen's hardcoded R1 500 default. Rounded to the
 * nearest R50 because a suggestion that reads R656.10 looks calculated at the
 * user rather than for them, and capped so the screen never opens on an amount
 * the monthly cap will refuse.
 */
export function suggestedTopUp(
  ledger: LedgerEntry[], at: Date, pricePerLitre: number
): number {
  const litres = burnRate(ledger, at);
  if (litres <= 0 || pricePerLitre <= 0) return 0;
  const capped = Math.min(litres, topUpCapRemaining(ledger, at));
  if (capped <= 0) return 0;
  const rounded = Math.round((capped * pricePerLitre) / 50) * 50;
  // Floor at R100, but never above what the cap allows — the cap wins.
  const floor = Math.min(100, Math.floor((capped * pricePerLitre) / 50) * 50 || 0);
  return Math.max(rounded, floor);
}
```

- [ ] **Step 4: Run the tests**

Run: `npx jest src/lib/__tests__/usage.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/usage.ts src/lib/__tests__/usage.test.ts
git commit -m "feat(lib): burn rate and derived top-up sizing"
```

---

### Task 5: Lot bands and locked-in value

**Files:**
- Create: `src/lib/holdings.ts`
- Create: `src/lib/__tests__/holdings.test.ts`

**Interfaces:**
- Consumes: `Lot` from `src/data/types`, `activeLots`/`balanceOf` from `src/lib/lots`, `DAY` from `src/lib/window`, `toCents` from `src/lib/round`.
- Produces:
  - `type LotBand = { id: string; litres: number; pricePerLitre: number; purchasedAt: Date; expiresAt: Date; daysLeft: number; share: number }`
  - `lotBands(lots: Lot[], at: Date): LotBand[]` — active lots sorted by expiry ascending. `share` is the lot's fraction of the active balance, `0` when the balance is zero.
  - `type LockedIn = { cost: number; value: number; ahead: number }`
  - `lockedInValue(lots: Lot[], at: Date, pricePerLitre: number): LockedIn`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/holdings.test.ts`:

```ts
import { Lot } from '../../data/types';
import { lotBands, lockedInValue } from '../holdings';
import { expiryOf } from '../window';

const lot = (id: string, litres: number, price: number, purchased: Date): Lot => ({
  id, grade: '95', litres, pricePerLitre: price,
  purchasedAt: purchased, expiresAt: expiryOf(purchased),
});

const AT = new Date(2026, 8, 30);

describe('lotBands', () => {
  test('is empty for an empty wallet', () => {
    expect(lotBands([], AT)).toEqual([]);
  });

  test('sorts by expiry, soonest first', () => {
    const bands = lotBands([
      lot('c', 10, 21.87, new Date(2026, 8, 28)),
      lot('a', 12, 21.40, new Date(2026, 6, 8)),
      lot('b', 10, 21.60, new Date(2026, 7, 12)),
    ], AT);
    expect(bands.map(b => b.id)).toEqual(['a', 'b', 'c']);
  });

  test('shares sum to one and are proportional to litres', () => {
    const bands = lotBands([
      lot('a', 30, 21.40, new Date(2026, 6, 8)),
      lot('b', 10, 21.60, new Date(2026, 7, 12)),
    ], AT);
    expect(bands[0].share).toBeCloseTo(0.75, 5);
    expect(bands[1].share).toBeCloseTo(0.25, 5);
    expect(bands.reduce((s, b) => s + b.share, 0)).toBeCloseTo(1, 5);
  });

  test('daysLeft counts down to expiry and is never negative', () => {
    const bands = lotBands([lot('a', 12, 21.40, new Date(2026, 6, 8))], AT);
    // 8 Jul + 90 days = 6 Oct; six days from 30 Sep.
    expect(bands[0].daysLeft).toBe(6);
  });

  test('excludes lots that have already expired', () => {
    // Purchased 1 Mar, so expired 30 May — long before `at`.
    expect(lotBands([lot('old', 20, 19.5, new Date(2026, 2, 1))], AT)).toEqual([]);
  });

  test('a zero balance produces no NaN shares', () => {
    const bands = lotBands([lot('a', 0, 21.40, new Date(2026, 6, 8))], AT);
    for (const b of bands) expect(Number.isNaN(b.share)).toBe(false);
  });
});

describe('lockedInValue', () => {
  test('is all zeros for an empty wallet', () => {
    expect(lockedInValue([], AT, 21.87)).toEqual({ cost: 0, value: 0, ahead: 0 });
  });

  test('reports what the balance cost against what it is worth now', () => {
    const lots = [
      lot('a', 12, 21.40, new Date(2026, 6, 8)),
      lot('b', 10, 21.60, new Date(2026, 7, 12)),
    ];
    const { cost, value, ahead } = lockedInValue(lots, AT, 21.87);
    expect(cost).toBeCloseTo(472.80, 2);   // 12*21.40 + 10*21.60
    expect(value).toBeCloseTo(481.14, 2);  // 22 * 21.87
    expect(ahead).toBeCloseTo(8.34, 2);
  });

  test('goes negative when the pump has fallen below what was paid', () => {
    const lots = [lot('a', 10, 21.87, new Date(2026, 8, 28))];
    expect(lockedInValue(lots, AT, 21.40).ahead).toBeLessThan(0);
  });

  test('ignores expired lots, which are no longer the balance', () => {
    const lots = [
      lot('live', 10, 21.87, new Date(2026, 8, 28)),
      lot('dead', 99, 19.50, new Date(2026, 2, 1)),
    ];
    expect(lockedInValue(lots, AT, 21.87).cost).toBeCloseTo(218.70, 2);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/lib/__tests__/holdings.test.ts`
Expected: FAIL with "Cannot find module '../holdings'".

- [ ] **Step 3: Implement**

Create `src/lib/holdings.ts`:

```ts
import { Lot } from '../data/types';
import { activeLots, balanceOf } from './lots';
import { DAY } from './window';
import { toCents } from './round';

export type LotBand = {
  id: string;
  litres: number;
  pricePerLitre: number;
  purchasedAt: Date;
  expiresAt: Date;
  /** Whole days until this lot expires. Never negative. */
  daysLeft: number;
  /** This lot's fraction of the active balance, 0..1. Zero if the balance is. */
  share: number;
};

/**
 * The wallet's lots as drawable bands, soonest expiry first.
 *
 * Sorted by EXPIRY rather than purchase date, which is what both consumers
 * want: the gauge stacks urgency left-to-right, and the timeline draws runways.
 * `activeLots` sorts by purchase date, and while the two orders coincide for a
 * fixed 90-day window they are not the same idea — sorting explicitly here
 * means a future variable window cannot silently reorder the gauge.
 */
export function lotBands(lots: Lot[], at: Date): LotBand[] {
  const active = activeLots(lots, at);
  const total = balanceOf(lots, at);
  return active
    .map(l => ({
      id: l.id,
      litres: l.litres,
      pricePerLitre: l.pricePerLitre,
      purchasedAt: l.purchasedAt,
      expiresAt: l.expiresAt,
      daysLeft: Math.max(0, Math.ceil((l.expiresAt.getTime() - at.getTime()) / DAY)),
      share: total > 0 ? l.litres / total : 0,
    }))
    .sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
}

export type LockedIn = {
  /** What the current balance actually cost, in rand. */
  cost: number;
  /** What it would cost at `pricePerLitre` today. */
  value: number;
  /** value − cost. Negative when the pump has fallen below what was paid. */
  ahead: number;
};

/**
 * The unrealised position on the balance still in the wallet.
 *
 * Distinct from `savingsToDate`, which is realised — money already saved on
 * fuel already burned. This is what is still held. Both are honest and they
 * are not interchangeable: against a wallet topped up at the current price
 * this is zero while realised savings are not.
 */
export function lockedInValue(lots: Lot[], at: Date, pricePerLitre: number): LockedIn {
  const active = activeLots(lots, at);
  const cost = toCents(active.reduce((sum, l) => sum + l.litres * l.pricePerLitre, 0));
  const value = toCents(balanceOf(lots, at) * pricePerLitre);
  return { cost, value, ahead: toCents(value - cost) };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx jest src/lib/__tests__/holdings.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/holdings.ts src/lib/__tests__/holdings.test.ts
git commit -m "feat(lib): lot bands and unrealised locked-in value"
```

---

### Task 6: The price-vs-pump series, the shared month window, and the price rise

**Files:**
- Modify: `src/lib/savings.ts`
- Modify: `src/lib/__tests__/savings.test.ts`
- Create: `src/lib/pricewatch.ts`
- Create: `src/lib/__tests__/pricewatch.test.ts`

**Interfaces:**
- Consumes: `LedgerEntry`, `Zone` from `src/data/types`; `priceOn`, `pricePointOn`, `nextPriceChange` from `src/data/prices`; `DAY` from `src/lib/window`; `toCents` from `src/lib/round`.
- Produces:
  - `monthWindow(at: Date, count: number): { label: string; year: number; month: number }[]` — exported from `savings.ts`, oldest first.
  - `type MonthPrices = { month: string; litres: number; yourPrice: number; pumpPrice: number }`
  - `pumpVsBuyByMonth(ledger: LedgerEntry[], at: Date): MonthPrices[]` — `CHART_MONTHS` entries, oldest first. A month with no fills has `litres: 0` and both prices `0`.
  - `type PriceRise = { effectiveFrom: Date; pricePerLitre: number; deltaCents: number; daysUntil: number; progress: number }`
  - `priceRise(zone: Zone, at: Date): PriceRise | null`
  - `RISE_CTA_WINDOW_DAYS = 14` and `isRiseImminent(rise: PriceRise | null): boolean`
  - `monthlySavings` and `CHART_MONTHS` keep their current signatures.

- [ ] **Step 1: Write the failing tests for the savings additions**

Append to `src/lib/__tests__/savings.test.ts`. **Merge** the first line into the file's existing `from '../savings'` import rather than adding a second one:

```ts
import { monthWindow, pumpVsBuyByMonth, CHART_MONTHS } from '../savings';
import { buildSeed } from '../../data/seed';
import { DEMO_NOW } from '../clock';

describe('monthWindow', () => {
  test('returns `count` months ending at `at`, oldest first', () => {
    const w = monthWindow(new Date(2026, 8, 30), 6);
    expect(w).toHaveLength(6);
    expect(w.map(m => m.label)).toEqual(['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']);
    expect(w[5]).toMatchObject({ year: 2026, month: 8 });
  });

  test('carries across a year boundary', () => {
    const w = monthWindow(new Date(2027, 1, 15), 4);
    expect(w.map(m => m.label)).toEqual(['NOV', 'DEC', 'JAN', 'FEB']);
    expect(w[0].year).toBe(2026);
    expect(w[3].year).toBe(2027);
  });
});

describe('pumpVsBuyByMonth', () => {
  test('returns one entry per chart month, oldest first', () => {
    const { ledger } = buildSeed();
    const series = pumpVsBuyByMonth(ledger, DEMO_NOW);
    expect(series).toHaveLength(CHART_MONTHS);
  });

  test('your price is at or below the pump in every month that has fills', () => {
    const { ledger } = buildSeed();
    for (const m of pumpVsBuyByMonth(ledger, DEMO_NOW)) {
      if (m.litres > 0) expect(m.yourPrice).toBeLessThanOrEqual(m.pumpPrice);
    }
  });

  test('a month with no fills reports zeroes rather than NaN', () => {
    const series = pumpVsBuyByMonth([], new Date(2026, 8, 30));
    for (const m of series) {
      expect(m.litres).toBe(0);
      expect(Number.isNaN(m.yourPrice)).toBe(false);
      expect(Number.isNaN(m.pumpPrice)).toBe(false);
    }
  });

  test('prices are litre-weighted, not a plain mean of fills', () => {
    // One big cheap fill and one small dear one in the same month: the
    // weighted price must sit near the big one.
    const mk = (day: number, litres: number, paid: number, pump: number): any => ({
      id: `e${day}`, kind: 'fill', what: 'Fill', when: new Date(2026, 8, day),
      detail: '', grade: '95', deltaLitres: -litres, balanceAfter: 0,
      buyPricePerLitre: paid,
      card: { merchantDescriptor: 'X', stationId: null, mcc: '5541',
        randAmount: litres * pump, zone: 'inland', pricePerLitre: pump, litres, disputed: false },
    });
    const series = pumpVsBuyByMonth([mk(5, 90, 20), mk(6, 10, 30)] as any, new Date(2026, 8, 30));
    const sep = series[series.length - 1];
    expect(sep.litres).toBeCloseTo(100, 5);
    expect(sep.yourPrice).toBeCloseTo(21, 5); // (90*20 + 10*30) / 100
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/lib/__tests__/savings.test.ts`
Expected: FAIL — `monthWindow` and `pumpVsBuyByMonth` are not exported.

- [ ] **Step 3: Extract the month window and add the series**

In `src/lib/savings.ts`, add `monthWindow` and rewrite `monthlySavings` to use it, so there is one definition of "the last N months ending at `at`":

```ts
export type MonthCell = { label: string; year: number; month: number };

/**
 * The last `count` months ending at `at`, oldest first.
 *
 * Extracted because two chart series now need the same window and month-only
 * matching is a silent bug: a fill in September of any later year would be
 * added to this September's bucket. Day 1 of a negative month index is a plain
 * JS idiom that normalises into the previous year, which is what carries the
 * window across a year boundary.
 */
export function monthWindow(at: Date, count: number): MonthCell[] {
  const out: MonthCell[] = [];
  for (let back = count - 1; back >= 0; back--) {
    const bucket = new Date(at.getFullYear(), at.getMonth() - back, 1);
    out.push({
      label: MONTH_LABELS[bucket.getMonth()],
      year: bucket.getFullYear(),
      month: bucket.getMonth(),
    });
  }
  return out;
}

export function monthlySavings(
  ledger: LedgerEntry[], at: Date
): { month: string; rand: number }[] {
  const f = fills(ledger);
  return monthWindow(at, CHART_MONTHS).map(cell => ({
    month: cell.label,
    rand: f
      .filter(e => e.when.getFullYear() === cell.year && e.when.getMonth() === cell.month)
      .reduce((sum, e) => sum + (e.card!.pricePerLitre - e.buyPricePerLitre!) * e.card!.litres, 0),
  }));
}

export type MonthPrices = {
  month: string;
  litres: number;
  /** Litre-weighted price actually paid for the litres burned this month. */
  yourPrice: number;
  /** Litre-weighted pump price on the days those litres were burned. */
  pumpPrice: number;
};

/**
 * The two series behind the Savings chart: what the pump charged versus what
 * these litres actually cost, month by month.
 *
 * Weighted by litres rather than averaged across fills, because a 38 L fill
 * and a 2 L fill are not equal evidence about the month's price. A month with
 * no fills returns zeroes, which the chart must render as a gap rather than as
 * a line dropping to the axis.
 */
export function pumpVsBuyByMonth(ledger: LedgerEntry[], at: Date): MonthPrices[] {
  const f = fills(ledger);
  return monthWindow(at, CHART_MONTHS).map(cell => {
    const inMonth = f.filter(
      e => e.when.getFullYear() === cell.year && e.when.getMonth() === cell.month);
    const litres = inMonth.reduce((s, e) => s + e.card!.litres, 0);
    if (litres === 0) return { month: cell.label, litres: 0, yourPrice: 0, pumpPrice: 0 };
    return {
      month: cell.label,
      litres,
      yourPrice: inMonth.reduce((s, e) => s + e.buyPricePerLitre! * e.card!.litres, 0) / litres,
      pumpPrice: inMonth.reduce((s, e) => s + e.card!.pricePerLitre * e.card!.litres, 0) / litres,
    };
  });
}
```

`MONTH_LABELS` already exists in this file; leave it where it is and export nothing new from it.

- [ ] **Step 4: Run the savings tests**

Run: `npx jest src/lib/__tests__/savings.test.ts`
Expected: PASS, including every pre-existing assertion — `monthlySavings` returns exactly what it did before.

- [ ] **Step 5: Write the failing pricewatch tests**

Create `src/lib/__tests__/pricewatch.test.ts`:

```ts
import { priceRise, isRiseImminent, RISE_CTA_WINDOW_DAYS } from '../pricewatch';

describe('priceRise', () => {
  test('describes the next scheduled change', () => {
    // 30 Sep 2026: inland is R21.87, rising to R21.99 on 7 Oct.
    const r = priceRise('inland', new Date(2026, 8, 30));
    expect(r).not.toBeNull();
    expect(r!.pricePerLitre).toBe(21.99);
    expect(r!.effectiveFrom.getDate()).toBe(7);
    expect(r!.deltaCents).toBe(12);
    expect(r!.daysUntil).toBe(7);
  });

  test('progress runs 0..1 across the interval since the current price took effect', () => {
    // Current point is 2 Sep, rise is 7 Oct — 35 days apart.
    const early = priceRise('inland', new Date(2026, 8, 2))!;
    const late = priceRise('inland', new Date(2026, 9, 6))!;
    expect(early.progress).toBeCloseTo(0, 2);
    expect(late.progress).toBeGreaterThan(0.9);
    for (const r of [early, late]) {
      expect(r.progress).toBeGreaterThanOrEqual(0);
      expect(r.progress).toBeLessThanOrEqual(1);
    }
  });

  test('is null past the end of the price table', () => {
    // The table ends 7 Oct 2026. This is the direction a real clock travels,
    // and the Wallet must still render.
    expect(priceRise('inland', new Date(2027, 0, 1))).toBeNull();
  });

  test('reports a fall as negative cents rather than hiding it', () => {
    const r = priceRise('inland', new Date(2026, 5, 10));
    // R21.80 in June falling to R21.40 on 1 July.
    expect(r!.deltaCents).toBe(-40);
  });
});

describe('isRiseImminent', () => {
  test('is false when there is no rise at all', () => {
    expect(isRiseImminent(null)).toBe(false);
  });

  test('is true inside the CTA window and false outside it', () => {
    const inside = priceRise('inland', new Date(2026, 8, 30))!;   // 7 days out
    const outside = priceRise('inland', new Date(2026, 8, 3))!;   // 34 days out
    expect(inside.daysUntil).toBeLessThanOrEqual(RISE_CTA_WINDOW_DAYS);
    expect(isRiseImminent(inside)).toBe(true);
    expect(isRiseImminent(outside)).toBe(false);
  });

  test('a falling price is never an imminent rise', () => {
    const fall = priceRise('inland', new Date(2026, 5, 25))!; // -40c on 1 Jul
    expect(fall.deltaCents).toBeLessThan(0);
    expect(isRiseImminent(fall)).toBe(false);
  });
});
```

- [ ] **Step 6: Run and watch it fail**

Run: `npx jest src/lib/__tests__/pricewatch.test.ts`
Expected: FAIL with "Cannot find module '../pricewatch'".

- [ ] **Step 7: Implement pricewatch**

Create `src/lib/pricewatch.ts`:

```ts
import { Zone } from '../data/types';
import { priceOn, pricePointOn, nextPriceChange } from '../data/prices';
import { DAY } from './window';

/**
 * How close a change must be before the Wallet swaps its second button from
 * HISTORY to the price CTA. Fourteen days is roughly half a price cycle — long
 * enough to act on, short enough that the button is not permanently a CTA.
 */
export const RISE_CTA_WINDOW_DAYS = 14;

export type PriceRise = {
  effectiveFrom: Date;
  pricePerLitre: number;
  /** Signed. Negative when the next change is a cut. */
  deltaCents: number;
  /** Whole days from `at` until the change takes effect. */
  daysUntil: number;
  /** How far through the current price's life we are, 0..1. */
  progress: number;
};

/**
 * The next scheduled price change, described rather than merely located.
 *
 * Everything here is read from the price table — the same table the wallet
 * deducts against — because a transcribed date is exactly how the Wallet's
 * "Next change · 02 Oct" literal survived three fix rounds while contradicting
 * DMPR's first-Wednesday rule.
 *
 * Returns `null` past the end of the table rather than inventing a change.
 * That is the direction a real clock travels, and every caller must render
 * correctly without one.
 */
export function priceRise(zone: Zone, at: Date): PriceRise | null {
  const next = nextPriceChange(zone, at);
  if (!next) return null;
  const current = pricePointOn(zone, at);
  const span = next.effectiveFrom.getTime() - current.effectiveFrom.getTime();
  const elapsed = at.getTime() - current.effectiveFrom.getTime();
  return {
    effectiveFrom: next.effectiveFrom,
    pricePerLitre: next.pricePerLitre,
    deltaCents: Math.round((next.pricePerLitre - priceOn(zone, at)) * 100),
    daysUntil: Math.max(0, Math.ceil((next.effectiveFrom.getTime() - at.getTime()) / DAY)),
    progress: span > 0 ? Math.min(1, Math.max(0, elapsed / span)) : 0,
  };
}

/**
 * Whether to show the "beat the rise" call to action.
 *
 * A cut is never imminent in this sense — there is nothing to beat, and
 * telling someone to hurry before the price DROPS would be a lie.
 */
export function isRiseImminent(rise: PriceRise | null): boolean {
  return rise !== null && rise.deltaCents > 0 && rise.daysUntil <= RISE_CTA_WINDOW_DAYS;
}
```

- [ ] **Step 8: Run both suites**

Run: `npx jest src/lib/__tests__/pricewatch.test.ts src/lib/__tests__/savings.test.ts`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add src/lib/savings.ts src/lib/pricewatch.ts src/lib/__tests__/savings.test.ts src/lib/__tests__/pricewatch.test.ts
git commit -m "feat(lib): pump-vs-buy series, shared month window, and the described price rise"
```

---

### Task 7: Re-cut the seed to a laddered wallet

**Files:**
- Modify: `src/data/seed.ts`
- Modify: `src/data/__tests__/seed.test.ts`
- Modify: `src/lib/__tests__/savings.test.ts` (any assertion pinned to old figures)
- Modify: `src/store/__tests__/wallet.test.ts` (same)

**Interfaces:**
- Consumes: everything already imported by `seed.ts`.
- Produces: `buildSeed()` keeps its signature. Its `credit` helper changes to take **rand**, not litres, deriving litres via `round1(rand / price)` exactly as `store.topUp` does.

**Why:** the current seed drains FIFO until one lot survives, which starves the expiry timeline (a timeline of one band) and makes locked-in value R0.00 (the survivor was bought at exactly today's price). A single large 8 July top-up — someone buying ahead of an expected rise, the product's own mechanic — ladders the wallet.

- [ ] **Step 1: Write the failing tests**

Replace the figure assertions in `src/data/__tests__/seed.test.ts` with these. Every number was computed from the model itself, not transcribed.

```ts
import { buildSeed } from '../seed';
import { DEMO_NOW } from '../../lib/clock';
import { balanceOf, expiringWithin } from '../../lib/lots';
import { lotBands, lockedInValue } from '../../lib/holdings';
import { litresThisMonth } from '../../lib/caps';
import { savingsToDate, litresBelowPump, averageBuyPrice, monthlySavings } from '../../lib/savings';
import { priceOn } from '../prices';

describe('the laddered seed', () => {
  const { lots, ledger } = buildSeed();
  const at = DEMO_NOW;

  test('balance is 42.6 L — about one tank, the true product shape', () => {
    expect(balanceOf(lots, at)).toBe(42.6);
  });

  test('the wallet is laddered across five lots at three prices', () => {
    const bands = lotBands(lots, at);
    expect(bands).toHaveLength(5);
    expect(bands.map(b => b.litres)).toEqual([12, 10, 2, 8, 10.6]);
    expect(bands.map(b => b.pricePerLitre)).toEqual([21.40, 21.60, 21.87, 21.87, 21.87]);
    expect(bands.map(b => b.daysLeft)).toEqual([6, 41, 64, 78, 88]);
  });

  test('12.0 L is inside the 30-day expiry warning', () => {
    // The old seed showed 0.0 L here, which made the warning undemonstrable.
    expect(expiringWithin(lots, at, 30)).toBe(12);
  });

  test('the balance is genuinely ahead of the pump', () => {
    const { cost, value, ahead } = lockedInValue(lots, at, priceOn('inland', at));
    expect(cost).toBeCloseTo(923.32, 2);
    expect(value).toBeCloseTo(931.66, 2);
    expect(ahead).toBeCloseTo(8.34, 2);
  });

  test('realised savings and the litres behind them', () => {
    expect(savingsToDate(ledger)).toBeCloseTo(76.19, 2);
    expect(litresBelowPump(ledger)).toBe(92.7);
    expect(averageBuyPrice(ledger)).toBeCloseTo(20.72, 2);
  });

  test('the six monthly bars, with May still the tallest', () => {
    const bars = monthlySavings(ledger, at);
    expect(bars.map(b => b.month)).toEqual(['APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP']);
    const rounded = bars.map(b => Number(b.rand.toFixed(2)));
    expect(rounded).toEqual([9.00, 18.00, 16.80, 12.00, 4.41, 15.98]);
    expect(Math.max(...rounded)).toBe(18.00);
  });

  test('September top-ups against the monthly cap', () => {
    // Down from 105.2 L. Accepted: bigger September top-ups would survive as
    // large September lots, because FIFO cannot reach past the July lot, and
    // that pushes the balance to ~130 L — three tanks, not one.
    expect(litresThisMonth(ledger, at)).toBe(18.6);
  });

  test('the ledger runs in true chronological order', () => {
    const times = ledger.map(e => e.when.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });

  test('every rand detail string matches the litres it bought', () => {
    for (const e of ledger.filter(x => x.kind === 'topup')) {
      const rand = Number(e.detail.replace(/[R\s]/g, ''));
      expect(e.deltaLitres).toBeCloseTo(
        Math.round((rand / priceOn('inland', e.when)) * 10) / 10, 5);
    }
  });

  test('the newest fill is dated the demo instant, for the Wallet last-fill row', () => {
    const fills = ledger.filter(e => e.kind === 'fill');
    const newest = fills[fills.length - 1];
    expect(newest.when.getTime()).toBe(DEMO_NOW.getTime());
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/data/__tests__/seed.test.ts`
Expected: FAIL — one surviving lot, `expiringWithin` returns 0, `ahead` is 0.00.

- [ ] **Step 3: Re-cut buildSeed**

In `src/data/seed.ts`, change `credit` to take rand and replace the chronology. Leave `STATION_FOR`, `debit` and the imports as they are.

```ts
  /**
   * Takes RAND, not litres, and derives litres exactly as store.topUp does.
   * The old signature took both a litre figure and a rand detail string, which
   * is two sources for one fact — the pair could drift and nothing would say so.
   */
  function credit(
    date: Date, rand: number, kind: 'topup' | 'bonus', what: string, detail: string
  ): void {
    n += 1;
    const price = priceOn('inland', date);
    const litres = round1(rand / price);
    const id = `lot-${n}`;
    balance = round1(balance + litres);
    lots.push({ id, grade: '95', litres, pricePerLitre: price, purchasedAt: date, expiresAt: expiryOf(date) });
    ledger.push({
      id: `e-${n}`, kind, what, when: date, detail,
      grade: '95', deltaLitres: litres, balanceAfter: balance, lotIds: [id],
    });
  }
```

Then replace every `credit`/`debit` call with this sequence. Order is strictly chronological — `balance` is a running total, so an out-of-order call stamps the wrong `balanceAfter` even though the final figure comes out right.

```ts
  // March–June: the historical chain, unchanged in effect. Each lot is bought
  // near the start of its 90-day window and drained by one fill nearer the end.
  credit(new Date(2026, 2, 4), 195, 'topup', 'Top up · 95', 'R195');   // 10.0 @ 19.50
  credit(new Date(2026, 2, 9), 195, 'topup', 'Top up · 95', 'R195');   // 10.0 @ 19.50
  debit(new Date(2026, 3, 3), 10.0, 'Engen William Nicol', 'Bryanston');

  credit(new Date(2026, 3, 13), 245, 'topup', 'Top up · 95', 'R245');  // 12.0 @ 20.40
  credit(new Date(2026, 3, 25), 245, 'topup', 'Top up · 95', 'R245');  // 12.0 @ 20.40
  debit(new Date(2026, 4, 7), 10.0, 'Sasol Rivonia', 'Rivonia');

  credit(new Date(2026, 4, 20), 313, 'topup', 'Top up · 95', 'R313');  // 14.7 @ 21.30
  debit(new Date(2026, 5, 25), 12.0, 'Shell Grayston', 'Sandton');

  // 8 July: the buy-ahead. One large top-up at R21.40 before the August and
  // September rises — the product's own mechanic, and the entry that ladders
  // the wallet. Everything downstream depends on this lot outliving the
  // September fills, because FIFO drains oldest first: it is bought at 46.0 L
  // and the 34.0 L of September fills leave exactly 12.0 L standing.
  credit(new Date(2026, 6, 8), 984, 'topup', 'Top up · 95', 'R984');   // 46.0 @ 21.40

  debit(new Date(2026, 6, 15), 12.0, 'Astron Energy Fourways', 'Fourways');
  debit(new Date(2026, 7, 10), 14.7, 'Total Sunninghill', 'Sunninghill');

  credit(new Date(2026, 7, 12), 216, 'topup', 'Top up · 95', 'R216');  // 10.0 @ 21.60

  credit(new Date(2026, 8, 4), 44, 'bonus', 'Referral bonus', 'Lerato M.');  // 2.0 @ 21.87
  debit(new Date(2026, 8, 11), 14.0, 'Engen William Nicol', 'Bryanston');
  credit(new Date(2026, 8, 18), 175, 'topup', 'Top up · 95', 'R175');  // 8.0 @ 21.87
  debit(new Date(2026, 8, 24), 12.0, 'Sasol Rivonia', 'Rivonia');
  credit(new Date(2026, 8, 28), 232, 'topup', 'Top up · 95', 'R232');  // 10.6 @ 21.87
  // Dated the demo instant itself: this is the fill the Wallet's "last fill"
  // row shows on open, so it is the same day the app believes it is.
  debit(DEMO_NOW, 8.0, 'Shell Grayston', 'Sandton');
```

- [ ] **Step 4: Run the seed tests**

Run: `npx jest src/data/__tests__/seed.test.ts`
Expected: PASS on every assertion in Step 1.

- [ ] **Step 5: Re-pin the downstream suites**

Run: `npm test`

Expected: failures in `src/lib/__tests__/savings.test.ts` and `src/store/__tests__/wallet.test.ts` wherever they assert old seed figures. Update each to the values in the Step 1 table — **read them from the model, do not carry any figure over by hand.** If a test asserts a *property* rather than a figure (FIFO order, ledger chaining, cap behaviour), it must still pass unchanged; if such a test fails, that is a real regression, not a re-pin.

- [ ] **Step 6: Full green**

Run: `npm test && npx tsc --noEmit`
Expected: both clean.

- [ ] **Step 7: Commit**

```bash
git add src/data/seed.ts src/data/__tests__/seed.test.ts src/lib/__tests__/savings.test.ts src/store/__tests__/wallet.test.ts
git commit -m "feat(data): ladder the seed on a July buy-ahead so expiry and locked-in value are real"
```

---

# Phase 2 — Primitives

---

### Task 8: Panel, Chip, and the light-mode button edge

**Files:**
- Create: `src/components/Panel.tsx`
- Create: `src/components/Chip.tsx`
- Create: `src/components/__tests__/Panel.test.tsx`
- Modify: `src/components/Button.tsx`

**Interfaces:**
- Consumes: `useTheme()`, `RADIUS`, `MOTION`, `SectionLabel`.
- Produces:
  - `Panel({ label, children, onPress, tone, style })` where `tone` is `'plain' | 'accent'`, default `'plain'`. `accent` uses `t.accent` as the border colour.
  - `Chip({ label, selected, onPress })`.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Panel.test.tsx`:

```tsx
import React from 'react';
import { Text } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { Panel } from '../Panel';
import { Chip } from '../Chip';

describe('Panel', () => {
  test('renders its label and children', () => {
    const { getByText } = render(
      <Panel label="Petrol 95 · Inland"><Text>R21.87</Text></Panel>
    );
    // textTransform is a STYLE. The node's text content is untransformed, so
    // querying the uppercase string would fail even though it renders that way.
    expect(getByText('Petrol 95 · Inland')).toBeTruthy();
    expect(getByText('R21.87')).toBeTruthy();
  });

  test('is not a button unless it is given something to do', () => {
    const { queryByRole } = render(<Panel><Text>inert</Text></Panel>);
    expect(queryByRole('button')).toBeNull();
  });

  test('becomes a button when pressable', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <Panel label="Price watch" onPress={onPress}><Text>x</Text></Panel>
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Chip', () => {
  test('reports its selected state to assistive tech', () => {
    const { getByRole } = render(<Chip label="FILLS" selected onPress={() => {}} />);
    expect(getByRole('button').props.accessibilityState.selected).toBe(true);
  });

  test('fires on press', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<Chip label="ALL" selected={false} onPress={onPress} />);
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/components/__tests__/Panel.test.tsx`
Expected: FAIL with "Cannot find module '../Panel'".

- [ ] **Step 3: Implement Panel**

Create `src/components/Panel.tsx`:

```tsx
import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import { SectionLabel } from './SectionLabel';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

/**
 * A bordered instrument block. Panels are defined by their border and fill,
 * never a shadow — elevation is absent in dark mode by design, so a
 * shadow-defined surface would exist in only one theme.
 */
export function Panel({
  label, children, onPress, tone = 'plain', style,
}: {
  label?: string;
  children: React.ReactNode;
  onPress?: () => void;
  /** `accent` draws the eye to a panel that is making a claim, not stating a fact. */
  tone?: 'plain' | 'accent';
  style?: ViewStyle;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    borderWidth: 1,
    borderColor: tone === 'accent' ? t.accent : t.border,
    backgroundColor: t.bgRaised,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 15,
    gap: 10,
  };

  if (!onPress) {
    return <View style={[base, style]}>{label ? <SectionLabel>{label}</SectionLabel> : null}{children}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      // Dim only. A panel that scales under the thumb reads as a button; it is
      // a tappable region, and the distinction is worth keeping.
      style={({ pressed }) => [base, { opacity: pressed ? MOTION.surfaceOpacity : 1 }, style]}
    >
      {label ? <SectionLabel>{label}</SectionLabel> : null}
      {children}
    </Pressable>
  );
}
```

- [ ] **Step 4: Implement Chip**

Create `src/components/Chip.tsx`:

```tsx
import React from 'react';
import { Pressable, Text } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';

export function Chip({
  label, selected, onPress,
}: { label: string; selected: boolean; onPress: () => void }) {
  const t = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        minHeight: 34, justifyContent: 'center',
        paddingHorizontal: 12, borderRadius: RADIUS.sm,
        borderWidth: 1,
        borderColor: selected ? t.accent : t.border,
        // Selected takes the amber fill with inverse ink on it, which is how
        // amber stays legible in light mode.
        backgroundColor: selected ? t.accent : 'transparent',
      }}
    >
      <Text style={{
        fontFamily: 'JetBrainsMono_700Bold', fontSize: 10, letterSpacing: 1.1,
        color: selected ? t.inverse : t.textMuted,
      }}>{label.toUpperCase()}</Text>
    </Pressable>
  );
}
```

- [ ] **Step 5: Give filled buttons an edge in light mode**

Spec §3.7. Neither `#FF7A1A` nor `#FF6A00` reaches 3:1 against white, so in light mode a filled amber button's *boundary* is undefined — the fill and the ground are too close in luminance. The fix is a border, and it reads as deliberate in this language.

In `src/components/Button.tsx`, the border currently appears only on the secondary variant:

```tsx
borderWidth: variant === 'secondary' ? 1 : 0, borderColor: t.border,
```

Replace that line, and add the two bindings above the `return`:

```tsx
  // A filled button's edge is undefined in light mode: neither amber value
  // reaches 3:1 against white, so fill and ground are too close to separate.
  // An ink border defines it. Dark mode needs none — the fill is far brighter
  // than its ground — and adding one there would draw a line around nothing.
  const filled = !disabled && variant !== 'secondary';
  const needsEdge = filled && isLight;
```

```tsx
          borderWidth: variant === 'secondary' || needsEdge ? 1 : 0,
          borderColor: variant === 'secondary' ? t.border : t.text,
```

`isLight` comes from `useIsLight()` — **this is the one component that legitimately needs it**, because the requirement is about a luminance relationship rather than a colour, so it cannot be expressed as a token pair. Task 13 Step 1 deletes `useIsLight` only if nothing else uses it; this is that something. Leave the hook in place and note it there.

- [ ] **Step 6: Run the tests**

Run: `npx jest src/components/__tests__/Panel.test.tsx && npm test`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/Panel.tsx src/components/Chip.tsx src/components/__tests__/Panel.test.tsx src/components/Button.tsx
git commit -m "feat(ui): Panel, Chip, and an ink edge on filled buttons in light mode"
```

---

### Task 9: SegmentGauge

**Files:**
- Create: `src/components/SegmentGauge.tsx`
- Create: `src/components/__tests__/SegmentGauge.test.tsx`

**Interfaces:**
- Consumes: `LotBand` from `src/lib/holdings`, `useTheme()`, `RADIUS`, `MOTION`.
- Produces: `SegmentGauge({ bands, urgentDays, height, onPress, accessibilityLabel })`, `urgentDays` default `30`, `height` default `12`.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/SegmentGauge.test.tsx`:

```tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SegmentGauge } from '../SegmentGauge';
import { LotBand } from '../../lib/holdings';

const band = (id: string, litres: number, daysLeft: number, share: number): LotBand => ({
  id, litres, pricePerLitre: 21.4,
  purchasedAt: new Date(2026, 6, 8), expiresAt: new Date(2026, 9, 6),
  daysLeft, share,
});

describe('SegmentGauge', () => {
  test('renders one segment per lot', () => {
    const { getAllByTestId } = render(
      <SegmentGauge bands={[band('a', 12, 6, 0.28), band('b', 30.6, 88, 0.72)]} />
    );
    expect(getAllByTestId(/^gauge-segment-/)).toHaveLength(2);
  });

  test('marks only lots inside the urgency window as urgent', () => {
    const { getByTestId } = render(
      <SegmentGauge bands={[band('a', 12, 6, 0.28), band('b', 30.6, 88, 0.72)]} />
    );
    expect(getByTestId('gauge-segment-a').props.accessibilityLabel).toMatch(/expires in 6 days/i);
    expect(getByTestId('gauge-segment-b').props.accessibilityLabel).not.toMatch(/expires in 6 days/i);
  });

  test('renders an empty track rather than nothing when the wallet is empty', () => {
    const { getByTestId } = render(<SegmentGauge bands={[]} />);
    expect(getByTestId('gauge-empty')).toBeTruthy();
  });

  test('is tappable only when given an action', () => {
    const onPress = jest.fn();
    const { getByRole } = render(
      <SegmentGauge bands={[band('a', 12, 6, 1)]} onPress={onPress} accessibilityLabel="View your litres" />
    );
    fireEvent.press(getByRole('button'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/components/__tests__/SegmentGauge.test.tsx`
Expected: FAIL with "Cannot find module '../SegmentGauge'".

- [ ] **Step 3: Implement**

Create `src/components/SegmentGauge.tsx`:

```tsx
import React from 'react';
import { Pressable, View } from 'react-native';
import { LotBand } from '../lib/holdings';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

/** Below this share a segment would be a hairline; give it a visible floor. */
const MIN_SHARE = 0.04;

/**
 * The balance, split by expiry.
 *
 * Deliberately not a "weeks of driving" gauge. Against a laddered wallet that
 * reads almost full and undercuts the very action the screen is asking for,
 * while saying nothing about the resource that is actually scarce: time on the
 * oldest litres. This shows quantity and urgency in one strip, and needs no
 * arbitrary maximum to scale against.
 */
export function SegmentGauge({
  bands, urgentDays = 30, height = 12, onPress, accessibilityLabel,
}: {
  bands: LotBand[];
  urgentDays?: number;
  height?: number;
  onPress?: () => void;
  accessibilityLabel?: string;
}) {
  const t = useTheme();

  const body = (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {bands.length === 0 ? (
        <View
          testID="gauge-empty"
          style={{ flex: 1, height, borderRadius: RADIUS.xs, backgroundColor: t.border }}
        />
      ) : bands.map(b => (
        <View
          key={b.id}
          testID={`gauge-segment-${b.id}`}
          accessibilityLabel={
            b.daysLeft <= urgentDays
              ? `${b.litres} litres, expires in ${b.daysLeft} days`
              : `${b.litres} litres`
          }
          style={{
            flexGrow: Math.max(b.share, MIN_SHARE),
            flexBasis: 0,
            height,
            borderRadius: RADIUS.xs,
            backgroundColor: b.daysLeft <= urgentDays ? t.accent : t.border,
          }}
        />
      ))}
    </View>
  );

  if (!onPress) return body;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      // Enlarge the target without changing the layout: the strip itself is
      // 12pt tall, well under the 44pt minimum.
      hitSlop={{ top: 16, bottom: 16, left: 0, right: 0 }}
      style={({ pressed }) => ({ opacity: pressed ? MOTION.surfaceOpacity : 1 })}
    >
      {body}
    </Pressable>
  );
}
```

- [ ] **Step 4: Run the tests**

Run: `npx jest src/components/__tests__/SegmentGauge.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/SegmentGauge.tsx src/components/__tests__/SegmentGauge.test.tsx
git commit -m "feat(ui): SegmentGauge — the balance split by expiry"
```

---

### Task 10: Timeline

**Files:**
- Create: `src/components/Timeline.tsx`
- Create: `src/components/__tests__/Timeline.test.tsx`

**Interfaces:**
- Consumes: `LotBand`, `useTheme()`, `RADIUS`, `Readout`, and `formatLitres`, `formatPrice`, `formatDayMonth` from `src/lib/format`.
- Produces: `Timeline({ bands, at, urgentDays })`, `urgentDays` default `30`. Uses plain Views, no SVG — the axis is a flex row of month cells.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/Timeline.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { Timeline } from '../Timeline';
import { LotBand } from '../../lib/holdings';

const AT = new Date(2026, 8, 30);
const band = (id: string, litres: number, price: number, daysLeft: number, expires: Date): LotBand => ({
  id, litres, pricePerLitre: price, purchasedAt: new Date(2026, 6, 8),
  expiresAt: expires, daysLeft, share: 0.5,
});

describe('Timeline', () => {
  test('draws one runway per lot, labelled with its price and litres', () => {
    const { getAllByTestId, getByText } = render(
      <Timeline at={AT} bands={[
        band('a', 12, 21.40, 6, new Date(2026, 9, 6)),
        band('b', 10.6, 21.87, 88, new Date(2026, 11, 27)),
      ]} />
    );
    expect(getAllByTestId(/^timeline-run-/)).toHaveLength(2);
    expect(getByText('12.0 L')).toBeTruthy();
    expect(getByText('R21.40/L')).toBeTruthy();
  });

  test('says so plainly when there is nothing held', () => {
    const { getByText } = render(<Timeline at={AT} bands={[]} />);
    expect(getByText(/no litres/i)).toBeTruthy();
  });

  test('the furthest expiry fills the axis and shorter runs are proportionally shorter', () => {
    const { getByTestId } = render(
      <Timeline at={AT} bands={[
        band('a', 12, 21.40, 6, new Date(2026, 9, 6)),
        band('b', 10.6, 21.87, 88, new Date(2026, 11, 27)),
      ]} />
    );
    const short = getByTestId('timeline-run-a').props.style.width as string;
    const long = getByTestId('timeline-run-b').props.style.width as string;
    expect(parseFloat(long)).toBe(100);
    expect(parseFloat(short)).toBeGreaterThan(0);
    expect(parseFloat(short)).toBeLessThan(parseFloat(long));
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/components/__tests__/Timeline.test.tsx`
Expected: FAIL with "Cannot find module '../Timeline'".

- [ ] **Step 3: Implement**

Create `src/components/Timeline.tsx`:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import { LotBand } from '../lib/holdings';
import { Readout } from './Readout';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { formatLitres, formatPrice, formatDayMonth } from '../lib/format';

/**
 * Every lot as a runway from today to its expiry.
 *
 * Plain Views rather than SVG: these are proportional rectangles on a shared
 * horizontal scale, which flex already expresses, and an SVG here would need
 * measured pixel widths to say the same thing.
 *
 * The scale is the FURTHEST expiry in the wallet, so the longest runway always
 * fills the axis. A fixed 90-day scale would leave a wallet of only recent
 * lots crammed into the right-hand end.
 */
export function Timeline({
  bands, at, urgentDays = 30,
}: { bands: LotBand[]; at: Date; urgentDays?: number }) {
  const t = useTheme();

  if (bands.length === 0) {
    return (
      <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textMuted }}>
        No litres held. A top-up starts a new 90-day runway.
      </Text>
    );
  }

  const horizon = Math.max(...bands.map(b => b.daysLeft), 1);

  return (
    <View style={{ gap: 14 }}>
      {bands.map(b => {
        const urgent = b.daysLeft <= urgentDays;
        return (
          <View key={b.id} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Readout size={11} weight="700" color={t.textMuted}>
                {`${formatDayMonth(b.purchasedAt)} · R${formatPrice(b.pricePerLitre)}/L`}
              </Readout>
              <Readout size={12} weight="700">{`${formatLitres(b.litres)} L`}</Readout>
            </View>
            <View style={{ height: 10, borderRadius: RADIUS.xs, backgroundColor: t.hairline }}>
              <View
                testID={`timeline-run-${b.id}`}
                style={{
                  width: `${(b.daysLeft / horizon) * 100}%`,
                  height: 10,
                  borderRadius: RADIUS.xs,
                  backgroundColor: urgent ? t.accent : t.border,
                }}
              />
            </View>
            <Readout size={10} weight="500" color={urgent ? t.accentText : t.textMuted}>
              {`Expires ${formatDayMonth(b.expiresAt)} · ${b.daysLeft} days`}
            </Readout>
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Run the tests**

Run: `npx jest src/components/__tests__/Timeline.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/Timeline.tsx src/components/__tests__/Timeline.test.tsx
git commit -m "feat(ui): Timeline — every lot on its 90-day runway"
```

---

### Task 11: LineChart and BarChart

**Files:**
- Create: `src/components/LineChart.tsx`
- Create: `src/components/BarChart.tsx`
- Create: `src/components/__tests__/charts.test.tsx`

**Interfaces:**
- Consumes: `react-native-svg` (already a dependency and already whitelisted in `jest.config.js`'s `transformIgnorePatterns`), `useTheme()`, `RADIUS`.
- Produces:
  - `LineChart({ series, labels, height })` — `series` is `{ key: string; color: string; values: number[] }[]`. With exactly two series the area between them is shaded in the second series' colour at low opacity. A `0` value is treated as "no data" and breaks the line rather than dropping it to the axis.
  - `BarChart({ data, height })` — `data` is `{ label: string; value: number }[]`. The tallest bar takes `t.positive`, the rest `t.border`.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/charts.test.tsx`:

```tsx
import React from 'react';
import { render } from '@testing-library/react-native';
import { LineChart } from '../LineChart';
import { BarChart } from '../BarChart';

describe('LineChart', () => {
  const labels = ['APR', 'MAY', 'JUN'];

  test('draws a path per series and labels the axis', () => {
    const { getAllByTestId, getByText } = render(
      <LineChart labels={labels} series={[
        { key: 'pump', color: '#111111', values: [20.4, 21.3, 21.8] },
        { key: 'you', color: '#222222', values: [19.5, 19.5, 20.4] },
      ]} />
    );
    expect(getAllByTestId(/^line-/)).toHaveLength(2);
    expect(getByText('APR')).toBeTruthy();
    // NB the shaded gap is testID 'chart-gap', deliberately NOT 'line-gap' —
    // it would otherwise match /^line-/ and make this count 3.
  });

  test('shades the gap when there are exactly two series', () => {
    const { getByTestId } = render(
      <LineChart labels={labels} series={[
        { key: 'pump', color: '#111111', values: [20.4, 21.3, 21.8] },
        { key: 'you', color: '#222222', values: [19.5, 19.5, 20.4] },
      ]} />
    );
    expect(getByTestId('chart-gap')).toBeTruthy();
  });

  test('does not shade a gap with a single series', () => {
    const { queryByTestId } = render(
      <LineChart labels={labels} series={[{ key: 'a', color: '#111111', values: [1, 2, 3] }]} />
    );
    expect(queryByTestId('chart-gap')).toBeNull();
  });

  test('renders without crashing when a month has no data', () => {
    // A zero is "no fills that month", not "the price was zero" — it must not
    // drag the line to the axis and invent a collapse.
    const { getAllByTestId } = render(
      <LineChart labels={labels} series={[
        { key: 'pump', color: '#111111', values: [20.4, 0, 21.8] },
        { key: 'you', color: '#222222', values: [19.5, 0, 20.4] },
      ]} />
    );
    expect(getAllByTestId(/^line-/)).toHaveLength(2);
  });

  test('survives an empty series', () => {
    const { queryAllByTestId } = render(<LineChart labels={[]} series={[]} />);
    expect(queryAllByTestId(/^line-/)).toHaveLength(0);
  });
});

describe('BarChart', () => {
  test('draws a bar per datum with its label and value', () => {
    const { getAllByTestId, getByText } = render(
      <BarChart data={[
        { label: 'APR', value: 9 }, { label: 'MAY', value: 18 }, { label: 'SEP', value: 15.98 },
      ]} />
    );
    expect(getAllByTestId(/^bar-/)).toHaveLength(3);
    expect(getByText('MAY')).toBeTruthy();
  });

  test('the tallest bar is the only highlighted one', () => {
    const { getByTestId } = render(
      <BarChart data={[{ label: 'APR', value: 9 }, { label: 'MAY', value: 18 }]} />
    );
    expect(getByTestId('bar-MAY').props.accessibilityLabel).toMatch(/best month/i);
    expect(getByTestId('bar-APR').props.accessibilityLabel).not.toMatch(/best month/i);
  });

  test('an all-zero dataset does not divide by zero', () => {
    const { getAllByTestId } = render(
      <BarChart data={[{ label: 'APR', value: 0 }, { label: 'MAY', value: 0 }]} />
    );
    for (const bar of getAllByTestId(/^bar-/)) {
      expect(Number.isNaN(bar.props.style.height)).toBe(false);
    }
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/components/__tests__/charts.test.tsx`
Expected: FAIL with "Cannot find module '../LineChart'".

- [ ] **Step 3: Implement LineChart**

Create `src/components/LineChart.tsx`:

```tsx
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

const VIEW_W = 240;
const PAD_X = 8;

export type Series = { key: string; color: string; values: number[] };

/**
 * Two price series with the gap between them shaded.
 *
 * A viewBox in fixed units with `preserveAspectRatio` left at its default lets
 * this scale to any width without measuring the layout — the alternative is an
 * onLayout round trip and a first frame drawn at the wrong size.
 *
 * A zero value means "no fills that month", not "the price was zero". Dropping
 * the line to the axis there would draw a collapse that did not happen, so
 * those points are skipped and the line spans them.
 */
export function LineChart({
  series, labels, height = 96,
}: { series: Series[]; labels: string[]; height?: number }) {
  const t = useTheme();
  const n = labels.length;
  if (n === 0 || series.length === 0) return <View style={{ height }} />;

  const present = series.flatMap(s => s.values).filter(v => v > 0);
  const min = present.length ? Math.min(...present) : 0;
  const max = present.length ? Math.max(...present) : 1;
  // A little headroom either side so the extremes are not drawn on the edge.
  const lo = min - (max - min) * 0.25 || 0;
  const hi = max + (max - min) * 0.25 || 1;

  const x = (i: number) => PAD_X + (i * (VIEW_W - PAD_X * 2)) / Math.max(1, n - 1);
  const y = (v: number) => hi === lo ? height / 2 : ((hi - v) / (hi - lo)) * height;

  const points = (values: number[]) =>
    values.map((v, i) => (v > 0 ? { x: x(i), y: y(v) } : null)).filter(Boolean) as { x: number; y: number }[];

  const toPath = (pts: { x: number; y: number }[]) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x} ${p.y}`).join(' ');

  const a = points(series[0]?.values ?? []);
  const b = points(series[1]?.values ?? []);
  const gap = series.length === 2 && a.length > 1 && b.length > 1
    ? `${toPath(a)} ${b.slice().reverse().map(p => `L${p.x} ${p.y}`).join(' ')} Z`
    : null;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEW_W} ${height}`}>
        {gap ? (
          <Path testID="chart-gap" d={gap} fill={series[1].color} fillOpacity={0.16} />
        ) : null}
        {series.map(s => {
          const pts = points(s.values);
          if (pts.length === 0) return null;
          return (
            <React.Fragment key={s.key}>
              <Path testID={`line-${s.key}`} d={toPath(pts)} stroke={s.color} strokeWidth={2} fill="none" />
              <Circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r={2.6} fill={s.color} />
            </React.Fragment>
          );
        })}
      </Svg>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
        {labels.map(l => (
          <Text key={l} style={{
            fontFamily: 'JetBrainsMono_700Bold', fontSize: 9,
            letterSpacing: 0.6, color: t.textMuted,
          }}>{l}</Text>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 4: Implement BarChart**

Create `src/components/BarChart.tsx`:

```tsx
import React from 'react';
import { View } from 'react-native';
import { Readout } from './Readout';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { formatRand } from '../lib/format';

const MAX_BAR_HEIGHT = 100;

/**
 * Monthly bars. Extracted from savings.tsx, where it was inline.
 *
 * Bar height is a percentage of the largest value in the data, never a
 * hardcoded maximum, and the tallest month takes `positive` — which is not
 * necessarily the most recent one.
 */
export function BarChart({
  data, height = 150,
}: { data: { label: string; value: number }[]; height?: number }) {
  const t = useTheme();
  const max = Math.max(0, ...data.map(d => d.value));

  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10, height }}>
      {data.map(d => {
        const tallest = max > 0 && d.value === max;
        return (
          <View key={d.label} style={{ flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
            <Readout size={11} weight="700" color={t.textDim}>
              {`${d.value < 0 ? '-' : ''}R${formatRand(Math.abs(d.value))}`}
            </Readout>
            <View
              testID={`bar-${d.label}`}
              accessibilityLabel={
                tallest ? `${d.label}, R${formatRand(d.value)}, best month`
                        : `${d.label}, R${formatRand(d.value)}`}
              style={{
                width: '100%',
                height: max > 0 ? (Math.max(0, d.value) / max) * MAX_BAR_HEIGHT : 0,
                // Top corners only: a bar sits on the chart's baseline, so
                // rounding the bottom would lift it off its own axis.
                borderTopLeftRadius: RADIUS.xs, borderTopRightRadius: RADIUS.xs,
                backgroundColor: tallest ? t.positive : t.border,
              }}
            />
            <Readout size={10} weight="500" color={t.textMuted}>{d.label}</Readout>
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 5: Run the tests**

Run: `npx jest src/components/__tests__/charts.test.tsx`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/LineChart.tsx src/components/BarChart.tsx src/components/__tests__/charts.test.tsx
git commit -m "feat(ui): LineChart with a shaded gap, and BarChart extracted from Savings"
```

---

### Task 12: The arrival Banner and the simulated live fill

**Files:**
- Create: `src/components/Banner.tsx`
- Modify: `src/store/wallet.ts`
- Modify: `src/store/__tests__/wallet.test.ts`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `cardFill` (existing store action), `STATIONS`, `priceOn`, `now`, `MOTION`, `useTheme()`.
- Produces:
  - Store: `arrivedFillId: string | null`, `scheduleDemoFill(delaySeconds?: number): void` (default `4`), `dismissArrival(): void`.
  - `Banner({ title, detail, onPress, onDismiss })` — renders nothing when `title` is null.

**Why the clock stays pinned:** `setClock(() => new Date())` guts the app — the price table silently returns October's price forever after 7 Oct, the cap meter reads zero from 1 Oct, and the last lot expires the balance to zero on 27 Dec. "Live" here means scripted against the pinned instant.

- [ ] **Step 1: Write the failing store test**

Add to `src/store/__tests__/wallet.test.ts`:

```ts
import { useWallet } from '../wallet';
import { balanceOf } from '../../lib/lots';
import { now } from '../../lib/clock';

describe('the simulated arriving fill', () => {
  beforeEach(() => { jest.useFakeTimers(); });
  afterEach(() => { jest.useRealTimers(); });

  test('nothing has arrived before one is scheduled', () => {
    expect(useWallet.getState().arrivedFillId).toBeNull();
  });

  test('a scheduled fill lands after its delay and reduces the balance', () => {
    const before = balanceOf(useWallet.getState().lots, now());
    useWallet.getState().scheduleDemoFill(4);

    // Nothing yet — the delay is the point.
    expect(useWallet.getState().arrivedFillId).toBeNull();

    jest.advanceTimersByTime(4000);

    const s = useWallet.getState();
    expect(s.arrivedFillId).not.toBeNull();
    expect(balanceOf(s.lots, now())).toBeLessThan(before);
  });

  test('the arrived id names a real fill in the ledger', () => {
    useWallet.getState().scheduleDemoFill(1);
    jest.advanceTimersByTime(1000);
    const s = useWallet.getState();
    const entry = s.ledger.find(e => e.id === s.arrivedFillId);
    expect(entry?.kind).toBe('fill');
    expect(entry?.card).toBeTruthy();
  });

  test('dismissing clears the banner without touching the ledger', () => {
    useWallet.getState().scheduleDemoFill(1);
    jest.advanceTimersByTime(1000);
    const entries = useWallet.getState().ledger.length;
    useWallet.getState().dismissArrival();
    expect(useWallet.getState().arrivedFillId).toBeNull();
    expect(useWallet.getState().ledger).toHaveLength(entries);
  });
});
```

- [ ] **Step 2: Run and watch it fail**

Run: `npx jest src/store/__tests__/wallet.test.ts -t "simulated arriving fill"`
Expected: FAIL — `scheduleDemoFill` is not a function.

- [ ] **Step 3: Add the store actions**

In `src/store/wallet.ts`, add to `WalletState`:

```ts
  /** The id of a fill that has just landed and not yet been acknowledged. */
  arrivedFillId: string | null;
  scheduleDemoFill: (delaySeconds?: number) => void;
  dismissArrival: () => void;
```

Add `arrivedFillId: null,` to the initial state, and these actions:

```ts
  /**
   * Prototype-only: schedule a card-rail fill to land while the app is open.
   *
   * The timer lives here rather than in src/lib, which must stay pure and free
   * of side effects. It calls the real `cardFill` action, so the whole path —
   * normaliseDescriptor, resolveZone, deriveLitres, FIFO consumption, the
   * ledger write, the redemption cap — runs exactly as it would for a genuine
   * fill. Nothing is faked below the store.
   *
   * The clock is NOT advanced. `now()` stays pinned to DEMO_NOW.
   */
  scheduleDemoFill: (delaySeconds = 4) => {
    setTimeout(() => {
      const before = get().ledger.length;
      const station = STATIONS[Math.floor(Math.random() * STATIONS.length)];
      const at = now();
      const spendable = Math.min(
        balanceOf(get().lots, at), redemptionCapRemaining(get().ledger, at));
      const availableRand = spendable * priceOn('inland', at);
      // Scaled to what is left so repeated demos stay resolvable instead of
      // running the wallet dry after one press.
      const amount = Math.max(50, Math.round(Math.min(300, availableRand * 0.2) / 10) * 10);
      get().cardFill(station.name.toUpperCase(), amount, station.zone);

      const ledger = get().ledger;
      // cardFill declines silently for a documented reason (an unresolvable
      // merchant, a cap reached). If it did not write, there is nothing to
      // announce, and announcing anyway would claim a fill that never happened.
      if (ledger.length > before) {
        set({ arrivedFillId: ledger[ledger.length - 1].id });
      }
    }, delaySeconds * 1000);
  },

  dismissArrival: () => set({ arrivedFillId: null }),
```

`STATIONS` needs importing into the store: `import { STATIONS } from '../data/stations';`.

- [ ] **Step 4: Run the store tests**

Run: `npx jest src/store/__tests__/wallet.test.ts`
Expected: PASS, including every pre-existing test.

- [ ] **Step 5: Write the Banner**

Create `src/components/Banner.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { RADIUS } from '../theme/tokens';
import { MOTION } from '../theme/motion';

export function Banner({
  title, detail, onPress, onDismiss,
}: {
  title: string | null;
  detail: string;
  onPress: () => void;
  onDismiss: () => void;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const drop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!title) return;
    Animated.timing(drop, {
      toValue: 1, duration: MOTION.banner, useNativeDriver: true,
    }).start();
    // Auto-dismiss: a banner that waits forever becomes furniture.
    const timer = setTimeout(onDismiss, 6000);
    return () => clearTimeout(timer);
  }, [title, drop, onDismiss]);

  if (!title) return null;

  return (
    <Animated.View style={{
      position: 'absolute', top: insets.top + 8, left: 14, right: 14,
      opacity: drop,
      transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }],
    }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${detail}. View the fill.`}
        onPress={onPress}
        style={({ pressed }) => ({
          backgroundColor: t.accent, borderRadius: RADIUS.md,
          paddingVertical: 13, paddingHorizontal: 15,
          opacity: pressed ? MOTION.pressOpacity : 1,
        })}
      >
        <Text style={{
          fontFamily: 'JetBrainsMono_700Bold', fontSize: 9,
          letterSpacing: 1.4, color: t.inverse,
        }}>FILL RECORDED</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 }}>
          <Text style={{ fontFamily: 'Figtree_700Bold', fontSize: 14, color: t.inverse }}>{title}</Text>
          <Text style={{ fontFamily: 'JetBrainsMono_800ExtraBold', fontSize: 14, color: t.inverse }}>{detail}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
```

- [ ] **Step 6: Mount the Banner above the stack**

In `app/_layout.tsx`, wrap the `Stack` so the banner overlays every screen including the tabs. Add the imports for `View`, `useRouter`, `useWallet`, `Banner`, `STATIONS`, `formatLitres`.

```tsx
function ArrivalBanner() {
  const router = useRouter();
  const id = useWallet(s => s.arrivedFillId);
  const dismiss = useWallet(s => s.dismissArrival);
  const entry = useWallet(s => s.ledger.find(e => e.id === s.arrivedFillId));
  if (!id || !entry?.card) return null;
  const name = STATIONS.find(s => s.id === entry.card!.stationId)?.name
    ?? entry.card!.merchantDescriptor;
  return (
    <Banner
      title={name}
      detail={`−${formatLitres(Math.abs(entry.deltaLitres))} L`}
      onPress={() => { dismiss(); router.push(`/fill/${id}`); }}
      onDismiss={dismiss}
    />
  );
}
```

Render it as a sibling of `Stack` inside a `<View style={{ flex: 1 }}>`, after the `Stack`, so it paints on top. Also register the two new routes in the `Stack`:

```tsx
<Stack.Screen name="litres" />
<Stack.Screen name="history" />
```

and remove `<Stack.Screen name="balance" />`.

- [ ] **Step 7: Typecheck and test**

Run: `npx tsc --noEmit && npm test`
Expected: both clean. `tsc` will flag `app/_layout.tsx`'s `litres`/`history` routes until Tasks 14 and 15 create them — if so, do Step 6's route registration at the end of Task 15 instead and note it in the commit.

- [ ] **Step 8: Commit**

```bash
git add src/components/Banner.tsx src/store/wallet.ts src/store/__tests__/wallet.test.ts app/_layout.tsx
git commit -m "feat(demo): fills that arrive while you watch, against the pinned clock"
```

---

# Phase 3 — Screens

Every screen task follows the same shape: swap `Num` usages already handled in Task 2, replace ad-hoc bordered `View`s with `Panel`, move numeric heroes onto `t.heroInk`, and keep the existing accessibility labels. Where a task says "unchanged," do not restyle beyond tokens.

---

### Task 13: The Wallet

**Files:**
- Modify: `app/(tabs)/index.tsx`

**Interfaces:**
- Consumes: `lotBands`, `burnRate`, `priceRise`, `isRiseImminent`, `savingsToDate`, `monthlySavings`, `SegmentGauge`, `Panel`, `BarChart` (no — the sparkline is inline, see Step 3), `Readout`.
- Produces: nothing other tasks consume.

- [ ] **Step 1: Remove the light-mode inversion**

Delete the `useIsLight()` call, the `blockShadow` `useElevation` call, the `DARK` import, and the entire conditional style object on the price-watch `Pressable`. Every `DARK.text` / `DARK.hairline` pin inside it becomes the matching theme token. **Keep `useIsLight` itself.** `Button.tsx` uses it as of Task 8 Step 5, for the one requirement that is about a luminance relationship rather than a colour and so cannot be expressed as a token pair. Only this screen's use of it goes.

- [ ] **Step 2: Rebuild the hero block**

The hero `Readout` takes `color={t.heroInk}`. Directly beneath it, before the rand sub-line:

```tsx
<View style={{ marginTop: 14 }}>
  <SegmentGauge
    bands={bands}
    onPress={() => router.push('/litres')}
    accessibilityLabel={`${formatLitres(balance)} litres, split by expiry. View your litres.`}
  />
</View>
```

with `const bands = lotBands(lots, at);` and `const lots = useWallet(s => s.lots);`.

Then two sub-lines below the rand value — the second only when something is close to expiring:

```tsx
<Text style={{ marginTop: 10, fontFamily: 'Figtree_500Medium', fontSize: 13, color: t.textDim }}>
  {`You use about ${formatLitres(burnRate(ledger, at))} L a month`}
</Text>
{soonest && soonest.daysLeft <= 30 ? (
  <Text style={{ marginTop: 5, fontFamily: 'Figtree_600SemiBold', fontSize: 13, color: t.accentText }}>
    {`${formatLitres(soonest.litres)} L expires in ${soonest.daysLeft} days`}
  </Text>
) : null}
```

with `const soonest = bands[0] ?? null;` — `lotBands` sorts by expiry, so the first band is the soonest.

- [ ] **Step 3: The price panel**

Replace the price-watch `Pressable` with a `Panel`. `rise` comes from `priceRise('inland', at)` and **every branch must render when it is null** — the price table ends 7 Oct 2026 and that is the direction a real clock travels.

```tsx
<Panel label="Petrol 95 · Inland" onPress={() => router.push('/alerts')} style={{ marginTop: 22 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
    <Readout size={26}>{`R${formatPrice(price)}`}</Readout>
    <Readout size={14} weight="700" color={t.accentText}>
      {`▲ ${formatPrice(priceDeltaPct)}%`}
    </Readout>
  </View>
  <View style={{ height: 1, backgroundColor: t.hairline }} />
  {rise ? (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <SectionLabel>{`Rises ${formatDayMonth(rise.effectiveFrom)}`}</SectionLabel>
        <Readout size={13} weight="700" color={t.accentText}>
          {`+${rise.deltaCents}c/L · ${rise.daysUntil} days`}
        </Readout>
      </View>
      <View style={{ height: 4, borderRadius: RADIUS.xs, backgroundColor: t.hairline }}>
        <View style={{
          height: 4, borderRadius: RADIUS.xs,
          width: `${rise.progress * 100}%`, backgroundColor: t.accent,
        }} />
      </View>
      <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 12, lineHeight: 18, color: t.textDim }}>
        {`Top up before then and every litre stays at R${formatPrice(price)} for 90 days.`}
      </Text>
    </>
  ) : (
    <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 12, lineHeight: 18, color: t.textDim }}>
      No change scheduled. Regulated — the same at every station in this zone.
    </Text>
  )}
</Panel>
```

Keep the "Regulated — the same at every station in this zone, so your card works anywhere" line as the panel's last child in the `rise` branch too; it is the one line explaining why a station-agnostic card is possible at all.

- [ ] **Step 4: The savings sparkline**

Above the footer, a compact six-month strip. Inline Views, not `BarChart` — this is a glance, not a chart, and it carries no value labels. Bind it first:

```tsx
const monthly = monthlySavings(ledger, at);
const maxRand = Math.max(0, ...monthly.map(m => m.rand));
```

```tsx
<View style={{ marginTop: 18, gap: 8 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
    <SectionLabel>Saved · 6 months</SectionLabel>
    <Readout size={13} weight="700" color={t.positiveText}>
      {`R${formatRand(Math.max(0, savingsToDate(ledger)))}`}
    </Readout>
  </View>
  <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, height: 28 }}>
    {monthly.map(m => (
      <View key={m.month} style={{
        flex: 1,
        height: maxRand > 0 ? Math.max(2, (Math.max(0, m.rand) / maxRand) * 28) : 2,
        borderTopLeftRadius: RADIUS.xs, borderTopRightRadius: RADIUS.xs,
        backgroundColor: m.rand === maxRand && maxRand > 0 ? t.positive : t.border,
      }} />
    ))}
  </View>
</View>
```

- [ ] **Step 5: The contextual footer button**

Replace `<Button label="CARD" variant="secondary" .../>`. Card is already tab 2 — that button spent a slot on navigation one tap away and squeezed `TOP UP`.

```tsx
const rise = priceRise('inland', at);
const imminent = isRiseImminent(rise);

// ...
<View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
  <Button label="TOP UP" flex={1} onPress={() => router.push('/top-up')} />
  <Button
    label={imminent ? `BEAT +${rise!.deltaCents}c` : 'HISTORY'}
    variant="secondary"
    flex={1}
    onPress={() => router.push(imminent ? '/top-up' : '/history')}
  />
</View>
```

Make the "Last fill · <station>" row above it a `Pressable` routing to `/fill/${lastFill.id}`.

- [ ] **Step 6: Verify**

Run: `npx tsc --noEmit && npm test`
Then start the app and confirm on a device: the gauge shows five segments with the first amber, the price panel counts down to 7 Oct, and the second button reads `BEAT +12c`.

- [ ] **Step 7: Commit**

```bash
git add "app/(tabs)/index.tsx"
git commit -m "feat(wallet): expiry gauge, the price-rise moment, and a footer button that earns its width"
```

---

### Task 14: Balance becomes Your litres

**Files:**
- Rename: `app/balance.tsx` → `app/litres.tsx`
- Modify: `app/(tabs)/index.tsx` (any `/balance` route), `app/_layout.tsx`

**Interfaces:**
- Consumes: `lotBands`, `lockedInValue`, `priceRise`, `SegmentGauge`, `Timeline`, `Panel`.
- Produces: the `/litres` route.

- [ ] **Step 1: Rename and strip the ledger**

```bash
git mv app/balance.tsx app/litres.tsx
```

Change the header title to `Your litres`. Delete the entire "Ledger" section — the `SectionLabel`, the inner `ScrollView`, the whole `rows.map(...)`, and the `rows`/`ledger` bindings that only fed it. Change `<Screen scroll={false}>` to `<Screen>`; the screen no longer owns a ScrollView, so it takes the default.

- [ ] **Step 2: Replace the two-column expiry split**

The `EXPIRES WITHIN 30 DAYS` / `LATER` pair goes. In its place, under the hero:

```tsx
<View style={{ marginTop: 16 }}>
  <SegmentGauge bands={bands} />
</View>

<View style={{ marginTop: 30 }}>
  <SectionLabel>Every litre, and when it expires</SectionLabel>
  <View style={{ marginTop: 16 }}>
    <Timeline bands={bands} at={at} />
  </View>
</View>
```

- [ ] **Step 3: The locked-in panel**

```tsx
<Panel label="Locked in" style={{ marginTop: 26 }}>
  <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
    {`Your ${formatLitres(balance)} L cost R${formatRand(locked.cost)}. At today's R${formatPrice(price)} it is worth R${formatRand(locked.value)}`}
    {locked.ahead >= 0
      ? <Text style={{ color: t.positiveText, fontFamily: 'Figtree_700Bold' }}>{` — R${formatRand(locked.ahead)} ahead.`}</Text>
      : <Text style={{ color: t.accentText, fontFamily: 'Figtree_700Bold' }}>{` — R${formatRand(Math.abs(locked.ahead))} behind.`}</Text>}
  </Text>
  {rise ? (
    <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
      {`From ${formatDayMonth(rise.effectiveFrom)} the pump is R${formatPrice(rise.pricePerLitre)}, putting you R${formatRand(balance * rise.pricePerLitre - locked.cost)} ahead.`}
    </Text>
  ) : null}
</Panel>
```

with `const locked = lockedInValue(lots, at, price);`.

**Copy constraint:** nothing on this screen may imply savings compound. The 90-day window caps the held advantage at roughly R20 on a 42 L balance; this is price certainty, not profit.

- [ ] **Step 4: Keep the reassurance and the footer**

The "Unused litres convert back to the rand you paid for them. They never expire to zero." line stays — it is what makes a timeline of expiry dates legible rather than threatening. The footer keeps `TOP UP` at full width.

- [ ] **Step 5: Repoint the route**

Replace every `router.push('/balance')` with `router.push('/litres')` across `app/`, and swap the `<Stack.Screen name="balance" />` registration in `app/_layout.tsx` for `<Stack.Screen name="litres" />`.

Run: `grep -rn "'/balance'" app/ src/`
Expected: no output.

- [ ] **Step 6: Verify and commit**

Run: `npx tsc --noEmit && npm test`

```bash
git add -A
git commit -m "feat(litres): Balance becomes what you hold — gauge, runways, and locked-in value"
```

---

### Task 15: The History screen

**Files:**
- Create: `app/history.tsx`
- Modify: `app/_layout.tsx`

**Interfaces:**
- Consumes: `Chip`, `Panel`, `Readout`, `expiryOf`, `DAY`, `formatDayMonth`, `formatLitres`, `formatRand`, `formatPrice`, `savingsToDate`, `STATIONS`.
- Produces: the `/history` route.

- [ ] **Step 1: Create the screen**

Create `app/history.tsx`. Structure, in order:

1. `<Screen scroll={false}>` with `<ScreenHeader title="History" />` — it owns its own ScrollView for the entry list, so it must not also be a scrolling `Screen`.
2. A `Chip` row: `All` / `Fills` / `Top-ups`, driven by `useState<'all' | 'fill' | 'topup'>('all')`. The `topup` filter includes `bonus` entries — a referral bonus is litres coming in, and hiding it under "Fills" would be wrong.
3. A summary `Panel` computed **across the currently filtered set**, so the figures move with the chips rather than quoting a fixed window:

```tsx
<Panel style={{ marginTop: 14 }}>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <SectionLabel>{filter === 'all' ? 'All entries' : filter === 'fill' ? 'Filled' : 'Bought'}</SectionLabel>
    <Readout size={13} weight="700">{`${formatLitres(litresShown)} L`}</Readout>
  </View>
  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
    <SectionLabel>Saved</SectionLabel>
    <Readout size={13} weight="700" color={t.positiveText}>{`R${formatRand(savedShown)}`}</Readout>
  </View>
</Panel>
```

4. The list, grouped by month:

```tsx
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const shown = ledger
  .filter(e => filter === 'all'
    || (filter === 'fill' && e.kind === 'fill')
    || (filter === 'topup' && (e.kind === 'topup' || e.kind === 'bonus')))
  .sort((a, b) => b.when.getTime() - a.when.getTime());

const litresShown = round1(shown.reduce((s, e) => s + Math.abs(e.deltaLitres), 0));
const savedShown = shown.reduce((s, e) =>
  s + (e.kind === 'fill' && e.card && e.buyPricePerLitre !== undefined
    ? (e.card.pricePerLitre - e.buyPricePerLitre) * e.card.litres : 0), 0);

// Keyed by year AND month: month-only keys silently merge September 2026 with
// September of any later year, which is the same bug monthWindow exists to fix.
const groups: { key: string; title: string; rows: LedgerEntry[] }[] = [];
for (const e of shown) {
  const key = `${e.when.getFullYear()}-${e.when.getMonth()}`;
  const last = groups[groups.length - 1];
  if (last?.key === key) last.rows.push(e);
  else groups.push({
    key, title: `${MONTHS[e.when.getMonth()]} ${e.when.getFullYear()}`, rows: [e],
  });
}
```

Each group is headed by a row carrying `<SectionLabel>{g.title}</SectionLabel>` and, right-aligned, `<SectionLabel>{`${g.rows.length} entries`}</SectionLabel>`.

- [ ] **Step 2: The entry rows**

A fill row carries its saving — this is the screen's reason to exist:

```tsx
const saved = e.kind === 'fill' && e.card && e.buyPricePerLitre !== undefined
  ? (e.card.pricePerLitre - e.buyPricePerLitre) * e.card.litres
  : null;
```

Row layout: station or entry name on the left with `formatDayMonth(e.when)` and, for a fill, `paid R<buyPrice>/L` beneath it; on the right the signed litres and, beneath, a badge. The badge takes `t.accent` as a fill with `t.inverse` ink when `saved > 0`, and `t.surface` with `t.textMuted` when it is zero — an honest grey rather than a hidden row.

A top-up row shows its own 90-day expiry, derived from the entry's own date:

```tsx
const exp = e.kind === 'topup' ? expiryOf(e.when) : null;
const remaining = exp ? exp.getTime() - at.getTime() : null;
const soonish = remaining !== null && remaining >= 0 && remaining < 14 * DAY;
```

**Never look the expiry up on `lots`.** A fully-consumed lot is deleted from the array, so a lookup silently drops the expiry off every historical top-up that has since been spent — which is most of them.

Only fill rows navigate (`router.push(\`/fill/${e.id}\`)`) and only they respond to press; a top-up row lighting up would promise a detail screen that does not exist. Disputed fills keep the `t.accent` left border and its 10pt left padding.

- [ ] **Step 3: Empty state**

When the filtered set is empty, render a single line in `t.textMuted` naming what is missing — "No fills yet." / "No top-ups yet." — not a blank screen.

- [ ] **Step 4: Register the route**

Add `<Stack.Screen name="history" />` to `app/_layout.tsx`.

- [ ] **Step 5: Verify**

Run: `npx tsc --noEmit && npm test`

Then in the app: open History from the Wallet footer, switch all three chips, and confirm the summary figures change with them. Confirm the 30 Sep Shell Grayston row shows a grey `R0.00` badge and the 11 Sep Engen row an amber one — the seed makes both cases visible.

- [ ] **Step 6: Commit**

```bash
git add app/history.tsx app/_layout.tsx
git commit -m "feat(history): the ledger as running proof, with a saving on every fill"
```

---

### Task 16: The Savings rework

**Files:**
- Modify: `app/(tabs)/savings.tsx`

**Interfaces:**
- Consumes: `pumpVsBuyByMonth`, `monthlySavings`, `savingsToDate`, `litresBelowPump`, `averageBuyPrice`, `LineChart`, `BarChart`, `Panel`.

- [ ] **Step 1: The hero**

Keep `savingsToDate` as the hero, on `t.positiveText`, with `litresBelowPump` beneath it. Keep the grouped `accessibilityLabel` using `spokenRand` — a hero split across two nodes announces as two stops otherwise. Label it `Realised · since March` so it is unambiguous against the locked-in figure on Your litres.

- [ ] **Step 2: The two-line chart**

```tsx
const series = pumpVsBuyByMonth(ledger, at);

<Panel label="Your price vs the pump" style={{ marginTop: 22 }}>
  <LineChart
    labels={series.map(m => m.month)}
    series={[
      { key: 'pump', color: t.accent, values: series.map(m => m.pumpPrice) },
      { key: 'you', color: t.positive, values: series.map(m => m.yourPrice) },
    ]}
  />
  <View style={{ flexDirection: 'row', gap: 16 }}>
    <Legend color={t.accent} label="Pump" />
    <Legend color={t.positive} label="You paid" />
  </View>
</Panel>
```

`Legend` is a small local component in this file — a coloured 8×8 square with `RADIUS.xs` and a `Figtree_600SemiBold` 11pt label in `t.textDim`. Series must be distinguished by colour **and** the legend, never colour alone.

- [ ] **Step 3: The candour panel**

Derived, never a literal. Compute the first and last months that actually have fills:

```tsx
const withFills = series.filter(m => m.litres > 0);
const firstEdge = withFills.length ? withFills[0].pumpPrice - withFills[0].yourPrice : 0;
const lastEdge = withFills.length ? withFills[withFills.length - 1].pumpPrice - withFills[withFills.length - 1].yourPrice : 0;
const narrowing = withFills.length > 1 && lastEdge < firstEdge;
```

```tsx
{withFills.length > 1 ? (
  <Panel
    label={narrowing ? 'The gap is closing' : 'The gap is widening'}
    tone={narrowing ? 'accent' : 'plain'}
    style={{ marginTop: 12 }}
  >
    <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
      {narrowing
        ? `Your edge fell from R${formatPrice(firstEdge)}/L in ${withFills[0].month} to R${formatPrice(lastEdge)}/L in ${withFills[withFills.length - 1].month} — recent top-ups were near the pump price.`
        : `Your edge rose from R${formatPrice(firstEdge)}/L in ${withFills[0].month} to R${formatPrice(lastEdge)}/L in ${withFills[withFills.length - 1].month}.`}
      {rise ? (
        <Text style={{ color: t.accentText, fontFamily: 'Figtree_700Bold' }}>
          {` It reopens on ${formatDayMonth(rise.effectiveFrom)}.`}
        </Text>
      ) : null}
    </Text>
  </Panel>
) : null}
```

with `const rise = priceRise('inland', at);`. A savings screen that only goes up reads as marketing; one that names its own decline reads as an instrument — and it is what creates the reason to act on the rise.

- [ ] **Step 4: The bars and the footer**

Replace the inline bar block with `<BarChart data={monthlySavings(ledger, at).map(m => ({ label: m.month, value: m.rand }))} />`. The footer rows — average buy price, pump price today, and the explanatory line — keep their content; only the tokens change.

**Copy constraint:** the explanatory line may not imply savings compound.

- [ ] **Step 5: Verify and commit**

Run: `npx tsc --noEmit && npm test`

```bash
git add "app/(tabs)/savings.tsx"
git commit -m "feat(savings): the pump-vs-your-price chart, and a screen that admits the gap is closing"
```

---

### Task 17: Card and Fill detail

**Files:**
- Modify: `app/(tabs)/card.tsx`, `app/fill/[id].tsx`

- [ ] **Step 1: Card — token pass only, plus removing the debug control**

The pass keeps the `PASS` group untouched: it depicts a physical Apple/Google Wallet pass and looks identical in both themes. Only its `borderRadius` moves, to the new `RADIUS.lg`.

Delete `simulateFill`, the `SIMULATE A FILL` button, its `Rule`, its `Debug — prototype only` `SectionLabel` and its caption, and the now-unused `STATIONS`, `cardFill` and `priceOn` imports if nothing else on the screen uses them. That control moves to Settings in Task 19.

Wrap the "Accepted at / Works at any fuel station" row and the weekly-cap line in the existing layout; no structural change.

- [ ] **Step 2: Fill detail — surface the saving**

Below the existing `R<amount> ÷ R<price>/L = <litres> L` working, add the saving as a first-class figure:

```tsx
const saved = entry.buyPricePerLitre !== undefined
  ? (c.pricePerLitre - entry.buyPricePerLitre) * c.litres
  : null;
```

```tsx
{saved !== null ? (
  <Panel label="What this fill saved" style={{ marginTop: 26 }}>
    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
      <Readout size={30} color={saved > 0 ? t.positiveText : t.textDim}>
        {`R${formatRand(Math.abs(saved))}`}
      </Readout>
      <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 12, color: t.textMuted }}>
        {saved > 0
          ? `you paid R${formatPrice(entry.buyPricePerLitre!)}/L, the pump was R${formatPrice(c.pricePerLitre)}/L`
          : 'these litres were bought at the pump price'}
      </Text>
    </View>
  </Panel>
) : null}
```

Everything else stays: the longhand division, the `Lots consumed` row (more than one id is the interesting case — it is why the buy price is a weighted average), the zone/effective-date line recovered via `pricePointOn`, and the dispute action.

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm test`

```bash
git add "app/(tabs)/card.tsx" "app/fill/[id].tsx"
git commit -m "feat(card,fill): Pump tokens, the debug control removed, and the per-fill saving surfaced"
```

---

### Task 18: Top up and Alerts

**Files:**
- Modify: `app/top-up.tsx`, `app/alerts.tsx`

- [ ] **Step 1: Top up — a derived default**

Replace `useState('1500')` with a value from the model:

```tsx
const price = priceOn('inland', at);
const suggested = suggestedTopUp(ledger, at, price);
const [raw, setRaw] = useState(String(suggested || 500));
```

Beneath the keypad's amount, add a line naming the reasoning: `About a month at your usage.` Show it only while `raw` still equals the suggestion — once the user types, the app should stop explaining their own number back to them.

The cap meter, the `wouldExceed` guard, the lapsed-subscription branch and the `MONTHLY CAP REACHED` state are unchanged. The meter's fill switches from `t.text` to `t.accent` above 80% as it already does.

- [ ] **Step 2: Alerts — lead with the rise**

Put this above the existing toggles. When `priceRise` returns `null` the fallback branch must render — this screen is gutted by an unhandled null past 7 Oct 2026, and that is the direction a real clock travels.

```tsx
const at = now();
const price = priceOn('inland', at);
const rise = priceRise('inland', at);

<Panel label="Next price change" tone={rise && rise.deltaCents > 0 ? 'accent' : 'plain'} style={{ marginTop: 30 }}>
  {rise ? (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
        <Readout size={40} color={t.heroInk}>{`${rise.deltaCents > 0 ? '+' : ''}${rise.deltaCents}c`}</Readout>
        <Readout size={15} weight="700" color={t.textDim}>/L</Readout>
      </View>
      <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
        {`R${formatPrice(price)} → R${formatPrice(rise.pricePerLitre)} on ${formatDayMonth(rise.effectiveFrom)} · ${rise.daysUntil} days away`}
      </Text>
      <View style={{ height: 4, borderRadius: RADIUS.xs, backgroundColor: t.hairline }}>
        <View style={{ height: 4, borderRadius: RADIUS.xs, width: `${rise.progress * 100}%`, backgroundColor: t.accent }} />
      </View>
    </>
  ) : (
    <Text style={{ fontFamily: 'Figtree_500Medium', fontSize: 13, lineHeight: 20, color: t.textDim }}>
      {`No change scheduled. Petrol 95 inland is R${formatPrice(price)}/L.`}
    </Text>
  )}
</Panel>
```

The three alert toggles keep their labels, their store bindings, and their `Toggle` accessibility labels.

- [ ] **Step 3: Verify and commit**

Run: `npx tsc --noEmit && npm test`

```bash
git add app/top-up.tsx app/alerts.tsx
git commit -m "feat(top-up,alerts): a derived default amount and the rise leading the alerts screen"
```

---

### Task 19: Settings, Subscribe, and the demo trigger

**Files:**
- Modify: `app/(tabs)/settings.tsx`, `app/subscribe.tsx`

- [ ] **Step 1: Settings — tokens and the demo section**

Token pass only for the profile block, the alert toggles, and the account rows. The appearance row keeps its `dark → light → system` cycle.

At the bottom, below everything else, add the prototype section that replaces the Card screen's debug button:

```tsx
<View style={{ paddingTop: 28 }}>
  <SectionLabel>Demo — prototype only</SectionLabel>
  <Button
    label="SIMULATE AN ARRIVING FILL"
    variant="secondary"
    height={54}
    onPress={() => scheduleDemoFill(4)}
  />
  <Text style={{ fontFamily: 'Figtree_400Regular', fontSize: 11, lineHeight: 16, color: t.textMuted, marginTop: 10 }}>
    Records a card-rail fill at a random station four seconds from now, so you can watch it
    land. It runs the real fill path — attribution, pricing, FIFO, the ledger and the weekly
    cap. Not part of the product.
  </Text>
</View>
```

Labelled and captioned so it reads as a debug tool, not a feature a reviewer could mistake it for.

- [ ] **Step 2: Subscribe — token pass**

No structural change. The trial/active/lapsed copy and the `setSubscription` bindings stay as they are.

- [ ] **Step 3: Verify the whole app**

Run: `npx tsc --noEmit && npm test`

Then, in the running app: press the demo button on Settings, switch to the Wallet, and confirm the banner drops in, the balance rolls down, the gauge re-renders, and tapping the banner opens the fill's detail.

- [ ] **Step 4: Commit**

```bash
git add "app/(tabs)/settings.tsx" app/subscribe.tsx
git commit -m "feat(settings): Pump tokens and the arriving-fill demo trigger"
```

---

### Task 20: Documentation and final verification

**Files:**
- Modify: `docs/HANDOVER.md`, `docs/DECISIONS.md`

Both documents are stale the moment Task 7 lands. Updating them is part of the work.

- [ ] **Step 1: Update HANDOVER's architecture and rules**

- The architecture block gains `src/lib/usage.ts`, `holdings.ts`, `pricewatch.ts` and the new components; the screen count goes from 11 to 12.
- **Rule 2** gains the second fill/text pair: `accent`/`accentText` alongside `positive`/`positiveText`, and the note that in light mode amber is a fill with ink on it.
- **Rule 3** loses the `tnum` warning. Numerals are monospaced now, so digits cannot change width; the constraint that disqualified DM Sans no longer applies. Add in its place: `SectionLabel` is now a *custom* family, so the never-set-`fontWeight` rule applies to it too.
- Rule 4's `scroll={false}` list changes: `balance.tsx` is gone, `history.tsx` is added.

- [ ] **Step 2: Replace the seeded-state table**

Every figure moves. Use the table asserted in Task 7 Step 1 — balance 42.6 L, five lots, 12.0 L expiring in six days, R8.34 ahead, savings R76.19, average buy R20.72/L, bars 9.00 / 18.00 / 16.80 / 12.00 / 4.41 / 15.98, September top-ups 18.6 L.

Delete the "exactly one surviving lot" line and the "The Balance expiry split reads 0.0 L / 42.6 L and that is correct" note — both are now false. Keep "May is the tallest savings bar."

- [ ] **Step 3: Answer open product decision #1**

HANDOVER proposes "R2,590 of fuel locked in below today's price" as a stronger headline than the realised figure. **It is answered and the answer is no.** Against the seed the locked-in position is R8.34, not R2,590 — the 90-day window caps how much price advantage anyone can hold at roughly R20 on a one-tank balance. Record that the product sells price certainty, not accumulated profit, and that the framing earns its place as a forward-looking line on Your litres instead.

- [ ] **Step 4: Add the rulings to DECISIONS**

One entry each, with reasoning and cost-if-wrong in the file's existing style:

- The Pump direction, and why it was chosen over an editorial and a soft-material alternative.
- Light mode is bright: white ground, AAA text, amber as a fill rather than as text. Reasoning: outdoor glare adds a white veil, and AA is not enough through it.
- `LIGHT.positive` changes value, overturning the ruling that a fill contends only with neighbouring fills.
- `heroInk` as a token rather than a branch.
- JetBrains Mono, and the retirement of the `tnum` constraint.
- The laddered seed, its two accepted regressions, and the requirement that its figures be recomputed rather than transcribed.
- The clock stays pinned; "live" means scripted.

- [ ] **Step 5: Final verification**

```bash
npm test
npx tsc --noEmit
grep -rnE "#[0-9A-Fa-f]{3,6}" src/ app/ | grep -v "src/theme/tokens.ts" | grep -v "tokens.test.ts"
grep -rn "\bNum\b" src/ app/ | grep -v Readout
grep -rn "'/balance'" app/ src/
grep -rn "fontVariant" src/ app/
```

Expected: tests green, typecheck clean, and no output from any grep except the `Toggle.tsx` comment match.

Then walk the app in **both themes**: Wallet → gauge → Your litres → Timeline; Wallet → History → all three chips → a fill's detail; Savings → the two-line chart and the candour panel; Settings → demo fill → banner → balance roll.

**Check light mode on a phone, outdoors.** The whole light palette is justified by outdoor legibility, and a desktop monitor cannot make that judgement.

- [ ] **Step 6: Commit**

```bash
git add docs/HANDOVER.md docs/DECISIONS.md
git commit -m "docs: bring HANDOVER and DECISIONS up to the Pump redesign"
```
