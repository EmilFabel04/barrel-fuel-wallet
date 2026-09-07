import { DARK, LIGHT, PASS } from '../tokens';

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
