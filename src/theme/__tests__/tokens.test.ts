import { DARK, LIGHT, PASS, RADIUS, DARK_ELEVATION, LIGHT_ELEVATION } from '../tokens';
import { MOTION } from '../motion';

// WCAG 2.1 relative luminance and contrast ratio. Inlined rather than put in
// a module because every consumer of it is this file, and a helper file under
// __tests__/ is collected by jest as a (test-less, failing) suite.
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

test('both themes define every token', () => {
  expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
});

test('accent and positive are fills; each has a text twin', () => {
  // Two fill/text pairs now, not one. In dark both twins hold the same value
  // because the dark ground is forgiving; in light they must differ.
  expect(DARK.accent).toBe('#FF7A1A');
  expect(DARK.accentText).toBe(DARK.accent);
  expect(DARK.positiveText).toBe(DARK.positive);

  expect(LIGHT.accentText).not.toBe(LIGHT.accent);
  expect(LIGHT.positiveText).not.toBe(LIGHT.positive);
});

test('heroInk is amber at night and ink in daylight', () => {
  expect(DARK.heroInk).toBe(DARK.accent);
  expect(LIGHT.heroInk).not.toBe(LIGHT.accent);
});

test('dark ground is warm near-black and light ground is pure white', () => {
  expect(DARK.bg).toBe('#0A0908');
  expect(LIGHT.bg).toBe('#FFFFFF');
});

// Ruling C1: the Barrel card pass depicts a physical object (a white card
// with black text) that does not theme-swap. PASS is its own theme-invariant
// token group, fixed to exactly these eight keys so a later task cannot
// quietly grow it into a third theme.
test('PASS token group has exactly the eight card-pass keys', () => {
  expect(Object.keys(PASS).sort()).toEqual(
    ['bg', 'bgFrozen', 'text', 'dim', 'muted', 'hairline', 'strataA', 'strataB'].sort()
  );
});

test('PASS is a white card with black text, fixed regardless of theme', () => {
  expect(PASS.bg).toBe('#FFFFFF');
  expect(PASS.text).toBe('#000000');
});

// Spec §3.3 (amended): the system moved from square-with-3px-buttons to a
// rounded scale. Pinned the same way the colours are, so a later screen cannot
// quietly introduce a sixth radius or retune one and drift the surfaces apart.
describe('RADIUS', () => {
  test('has exactly the five steps of the scale', () => {
    expect(Object.keys(RADIUS).sort()).toEqual(['xs', 'sm', 'md', 'lg', 'pill'].sort());
  });

  test('the scale ascends', () => {
    expect(RADIUS.xs).toBeLessThan(RADIUS.sm);
    expect(RADIUS.sm).toBeLessThan(RADIUS.md);
    expect(RADIUS.md).toBeLessThan(RADIUS.lg);
    expect(RADIUS.lg).toBeLessThan(RADIUS.pill);
  });

  test('pill is large enough to fully round any control in the system', () => {
    // The tallest thing it is applied to is the 26pt Toggle track.
    expect(RADIUS.pill).toBeGreaterThanOrEqual(999);
  });
});

// The rule this whole group exists to enforce: a shadow is a dark blur and
// DARK.bg is #000000, so elevation in dark mode would be invisible rather than
// subtle. Dark carries depth through luminance instead. Pinned because the
// failure is silent — it looks correct in whichever theme you happen to be in.
describe('elevation', () => {
  test('both sets define the same levels', () => {
    expect(Object.keys(DARK_ELEVATION).sort()).toEqual(Object.keys(LIGHT_ELEVATION).sort());
  });

  test('dark mode has no shadow at any level', () => {
    for (const level of ['low', 'high'] as const) {
      expect(DARK_ELEVATION[level].shadowOpacity).toBe(0);
      expect(DARK_ELEVATION[level].shadowRadius).toBe(0);
      expect(DARK_ELEVATION[level].elevation).toBe(0);
    }
  });

  test('light mode has a real shadow at both levels', () => {
    for (const level of ['low', 'high'] as const) {
      expect(LIGHT_ELEVATION[level].shadowOpacity).toBeGreaterThan(0);
      expect(LIGHT_ELEVATION[level].shadowRadius).toBeGreaterThan(0);
      expect(LIGHT_ELEVATION[level].elevation).toBeGreaterThan(0);
    }
  });

  test('high reads as raised further than low', () => {
    expect(LIGHT_ELEVATION.high.shadowOpacity).toBeGreaterThan(LIGHT_ELEVATION.low.shadowOpacity);
    expect(LIGHT_ELEVATION.high.shadowRadius).toBeGreaterThan(LIGHT_ELEVATION.low.shadowRadius);
    expect(LIGHT_ELEVATION.high.shadowOffset.height).toBeGreaterThan(LIGHT_ELEVATION.low.shadowOffset.height);
  });

  test('shadows stay subtle — this system has no heavy elevation', () => {
    expect(LIGHT_ELEVATION.high.shadowOpacity).toBeLessThanOrEqual(0.15);
  });
});

// Motion is a system, not per-screen taste, so the values are pinned the same
// way the colours and radii are. The properties matter more than the numbers:
// every animated value must be one the native driver can carry, or a press
// lands on the JS thread and janks exactly when the app is busiest.
describe('MOTION', () => {
  test('press-in is faster than press-out', () => {
    // A press should land under the finger and release as a settle.
    expect(MOTION.pressIn).toBeLessThan(MOTION.pressOut);
  });

  test('every duration is short enough to feel like feedback, not animation', () => {
    const durations = [MOTION.pressIn, MOTION.pressOut, MOTION.toggle, MOTION.screen];
    for (const d of durations) {
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThanOrEqual(300);
    }
  });

  test('the press scale shrinks, and only slightly', () => {
    expect(MOTION.pressScale).toBeLessThan(1);
    expect(MOTION.pressScale).toBeGreaterThanOrEqual(0.95);
  });

  test('opacities dim without hiding', () => {
    for (const o of [MOTION.pressOpacity, MOTION.surfaceOpacity]) {
      expect(o).toBeLessThan(1);
      expect(o).toBeGreaterThan(0.5);
    }
  });

  test('a large surface dims further than a button, since it does not scale', () => {
    expect(MOTION.surfaceOpacity).toBeLessThan(MOTION.pressOpacity);
  });
});

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
    // Symmetric on purpose. An earlier draft of this test let dark off with
    // 1.4:1 — which was the assertion being written around a value already
    // chosen, rather than the value being held to a standard.
    expect(contrast(LIGHT.border, LIGHT.bg)).toBeGreaterThanOrEqual(3);
    expect(contrast(DARK.border, DARK.bg)).toBeGreaterThanOrEqual(3);
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
