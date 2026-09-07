import { DARK, LIGHT, PASS, RADIUS, DARK_ELEVATION, LIGHT_ELEVATION } from '../tokens';
import { MOTION } from '../motion';

test('both themes define every token', () => {
  expect(Object.keys(DARK).sort()).toEqual(Object.keys(LIGHT).sort());
});

test('accents are identical across themes', () => {
  expect(DARK.accent).toBe(LIGHT.accent);
  expect(DARK.positive).toBe(LIGHT.positive);
  expect(DARK.accent).toBe('#D9541E');
  expect(DARK.positive).toBe('#C6F24E');
});

// Ruling (spec §3.1 amendment): `positive` is a fill colour and stays
// identical across themes, same as `accent`. `positiveText` is the one token
// that legitimately differs — #C6F24E on white is 1.30:1, so light mode gets
// a darker value that still passes WCAG AA (4.97:1) for text and glyphs.
test('positiveText is the one token that legitimately differs between themes', () => {
  expect(DARK.positiveText).not.toBe(LIGHT.positiveText);
  expect(DARK.positiveText).toBe('#C6F24E');
  expect(LIGHT.positiveText).toBe('#5A7A0A');
});

test('dark background is black and light is white', () => {
  expect(DARK.bg).toBe('#000000');
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
