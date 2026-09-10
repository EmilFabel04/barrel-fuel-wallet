#!/usr/bin/env node
// The spec §9 mechanical checks, made runnable. Each check names the rule it
// enforces. This is the project's only automated gate: web/ has no test
// runner by design (spec §9), so these checks carry that weight.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, dirname, resolve as resolvePath } from 'node:path';
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
  p => !p.includes(`${join('scripts', 'check.mjs')}`) && !p.endsWith('next-env.d.ts')
);
const cssish = src.filter(p => ['.css', '.tsx'].includes(extname(p)));
const read = p => readFileSync(p, 'utf8');

const stripComments = s =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// §5.1 — banned visual effects. Comments are stripped first, matching the
// palette, lime and radius checks below — a code comment that merely
// mentions "gradient" must not fail the build.
for (const p of cssish) {
  const s = stripComments(read(p));
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

// §5.2 — the palette is closed. These eleven values are the whole system;
// any other literal is a defect. Comments are stripped first, so
// documentation may name a value it is explaining.
const PALETTE = new Set([
  '#FFFFFF', '#F7F5F0', '#000000', '#3A342D', '#5C554C', '#948A78', '#DCD6C9',
  '#FF6A00', '#9A3200', '#7A9000', '#3F5406',
]);
for (const p of cssish) {
  for (const m of stripComments(read(p)).matchAll(/#[0-9A-Fa-f]{3,8}\b/g)) {
    const hex = m[0].toUpperCase();
    if (!PALETTE.has(hex)) fail('§5.2 colour outside the closed palette', p, hex);
  }
}

// §5.2 — fills are never text. #FF6A00 is 2.87:1 on white and #7A9000 is
// 3.61:1; their text twins are #9A3200 and #3F5406.
for (const p of cssish) {
  const s = stripComments(read(p));
  for (const [re, name] of [
    [/(^|[;{\s])color:\s*var\(\s*--accent\s*\)/m, 'var(--accent)'],
    [/(^|[;{\s])color:\s*var\(\s*--positive\s*\)/m, 'var(--positive)'],
    [/(^|[;{\s])color:\s*['"]?#FF6A00/im, '#FF6A00'],
    [/(^|[;{\s])color:\s*['"]?#7A9000/im, '#7A9000'],
  ]) if (re.test(s)) fail('§5.2 a fill colour used as text', p, name);
}

// §5.2 — lime is never a background, because black on it is 5.82:1: AA, under
// this site's AAA bar. It is legal as a border, a stroke or an SVG fill.
for (const p of cssish) {
  const s = stripComments(read(p));
  if (/background(-color)?:\s*(var\(\s*--positive\s*\)|['"]?#7A9000)/im.test(s))
    fail('§5.2 lime must not be a text background', p, '--positive as background');
}

// §5.1 — no centred body text
for (const p of cssish) {
  if (/text-align:\s*center/i.test(read(p)))
    fail('§5.1 centred text', p, 'text-align: center');
}

// §5.2 — radius ceiling. Anything that is not 0 or <=10px fails, including
// percentages and rem, which the px-only pattern used to wave through.
for (const p of cssish) {
  for (const m of stripComments(read(p)).matchAll(/border-radius:\s*([^;}\n]+)/gi)) {
    const value = m[1].trim();
    for (const part of value.split(/\s+/)) {
      const px = /^(\d+(?:\.\d+)?)px$/.exec(part);
      if (part === '0') continue;
      if (!px || Number(px[1]) > 10) fail('§5.2 radius must be 0 or <=10px', p, value);
    }
  }
}

// Global constraint — no import may escape web/. Resolved rather than
// pattern-matched: a bare side-effect import, a dynamic import and a single
// ../ from the top level all escape a regex, but none escape path resolution.
for (const p of src) {
  const text = read(p);
  const specs = [
    ...text.matchAll(/from\s+['"]([^'"]+)['"]/g),
    ...text.matchAll(/\bimport\s+['"]([^'"]+)['"]/g),
    ...text.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g),
    ...text.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g),
  ].map(m => m[1]);
  for (const spec of specs) {
    if (!spec.startsWith('.')) continue;           // bare package or @/ alias
    const target = resolvePath(dirname(p), spec);
    if (!target.startsWith(ROOT))
      fail('imports must not escape web/', p, `${spec} -> ${target}`);
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
  // Task 7 — the waitlist form posts to Buttondown. This is the one
  // third-party origin the spec permits (spec §8, §9): the form's own
  // action attribute, not a script, pixel or font-CDN request.
  /^https?:\/\/(www\.)?buttondown\.com/i,
];
// §7 provenance is the one place a third-party origin belongs in source. The
// price series is the site's only factual claim, so data/fuel-prices.ts has to
// name the department it was taken from and the body it was cross-checked
// against — a figure nobody can trace is worth less than no figure. These are
// citations in a comment and in a string; the file declares data and makes no
// request. The exemption is scoped to that one file and those two origins, so
// any other origin appearing in it still fails, and the built-output scan
// below is untouched: a URL that reaches the rendered page is still a defect.
const PROVENANCE_FILE = join(ROOT, 'data/fuel-prices.ts');
const PROVENANCE_ORIGINS = [
  /^https?:\/\/(www\.)?dmpr\.gov\.za/i,  // the DMRE/DMPR published price tables
  /^https?:\/\/(www\.)?aa\.co\.za/i,     // the AA of South Africa, cross-check
];
const scanForOrigins = files => {
  for (const p of files) {
    const allowed = p === PROVENANCE_FILE ? [...ALLOWED, ...PROVENANCE_ORIGINS] : ALLOWED;
    for (const m of read(p).matchAll(/https?:\/\/[a-z0-9.-]+/gi)) {
      const url = m[0];
      if (/schema\.org|w3\.org/i.test(url)) continue; // namespaces, not requests
      if (!allowed.some(re => re.test(url)))
        fail('§9 third-party origin', p, url);
    }
  }
};
const out = join(ROOT, 'out');
if (existsSync(out)) scanForOrigins(walk(out, ['.html', '.css']));
scanForOrigins(src.filter(p => ['.ts', '.tsx'].includes(extname(p))));

// §5.2 — tokens must match src/theme/tokens.ts (LIGHT) exactly. Parsed from
// the file, not restated here, so drift fails instead of quietly passing a
// hardcoded copy.
const REQUIRED_TOKENS = {
  '--bg': '#FFFFFF', '--surface': '#F7F5F0', '--text': '#000000',
  '--text-dim': '#3A342D', '--text-muted': '#5C554C',
  '--border': '#948A78', '--hairline': '#DCD6C9', '--accent': '#FF6A00',
  '--accent-text': '#9A3200', '--positive': '#7A9000', '--positive-text': '#3F5406',
};
const globalsPath = join(ROOT, 'app/globals.css');
const tokens = {};
if (existsSync(globalsPath)) {
  for (const m of stripComments(read(globalsPath)).matchAll(/(--[a-z-]+):\s*(#[0-9A-Fa-f]{6})\s*;/g))
    tokens[m[1]] = m[2].toUpperCase();
  for (const [name, want] of Object.entries(REQUIRED_TOKENS)) {
    if (!tokens[name]) fail('§5.2 token missing', globalsPath, name);
    else if (tokens[name] !== want) fail('§5.2 token drifted from src/theme/tokens.ts', globalsPath, `${name} is ${tokens[name]}, expected ${want}`);
  }
}

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

const resolveColour = v => (v.startsWith('--') ? tokens[v] : v);
const TEXT_PAIRS = [
  ['--text', '--bg', 'body on ground'],
  ['--text-dim', '--bg', 'textDim on ground'],
  ['--text-muted', '--bg', 'textMuted on ground'],
  ['#000000', '--accent', 'button label on amber'],
  ['--accent-text', '--bg', 'accentText on ground'],
  ['--positive-text', '--bg', 'positiveText on ground'],
];
for (const [fgRef, bgRef, name] of TEXT_PAIRS) {
  const fg = resolveColour(fgRef), bg = resolveColour(bgRef);
  if (!fg || !bg) { fail('§5.4 cannot measure contrast', globalsPath, `${name}: token not found`); continue; }
  const ratio = contrast(fg, bg);
  if (ratio < 7) fail('§5.4 text below AAA', globalsPath, `${name}: ${ratio.toFixed(2)}:1 (needs 7:1)`);
}

// Task 2 — the lockup uses the artwork's own viewBox, not a re-drawn path
const lockup = join(ROOT, 'components/Lockup.tsx');
if (existsSync(lockup)) {
  const s = read(lockup);
  if (!s.includes('297 0 948 1500'))
    fail('lockup viewBox must match BarrelMark.tsx', lockup, 'expected "297 0 948 1500"');
} else {
  fail('lockup missing', lockup, 'not created');
}

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

// §5.1 — nothing on this site is horizontally centred. The page is anchored
// left; an auto side-margin is how a centred column gets reintroduced, and it
// is invisible to the text-align check above. Covers both hyphenated CSS and
// JSX camelCase (this project writes inline styles as JSX objects). Vertical
// auto margins (marginTop/marginBottom) are deliberately allowed — they do
// not centre anything horizontally, and the app uses marginTop: 'auto'
// legitimately for pinned footers.
for (const p of cssish) {
  const s = stripComments(read(p));
  const hits = [
    /margin(-inline)?:\s*[^;}\n]*\bauto\b/,                       // margin: 0 auto
    /margin-(left|right|inline-start|inline-end):\s*auto/,        // longhand CSS
    /margin(Left|Right|Inline|InlineStart|InlineEnd)\s*:\s*['"]?[^,}\n]*\bauto\b/, // JSX camelCase
    /margin\s*:\s*['"][^'"]*\bauto\b/,                            // JSX shorthand string
  ].some(re => re.test(s));
  if (hits) fail('§5.1 auto side-margin centres the layout', p, 'auto side-margin');
}

// Task 6 — the chart must label its grade, zone and source on the page. The
// caption cites the publisher by name (FUEL_PRICE_SOURCE.sourceName), never
// FUEL_PRICE_SOURCE.source, which is a dmpr.gov.za URL — rendering that would
// put a third-party origin in built output and fail the §9 scan above.
const chart = join(ROOT, 'components/PriceChart.tsx');
if (existsSync(chart)) {
  const s = read(chart);
  for (const field of ['grade', 'zone', 'sourceName'])
    if (!s.includes(`FUEL_PRICE_SOURCE.${field}`))
      fail('§7 chart must display its provenance', chart, `FUEL_PRICE_SOURCE.${field}`);
} else {
  fail('chart missing', chart, 'not created');
}

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

// The waitlist endpoint is inert until the site owner fills in their list id.
// Failing here is deliberate: a form that silently posts to an incomplete URL
// is worse than a build that refuses.
const formFile = join(ROOT, 'components/WaitlistForm.tsx');
if (existsSync(formFile) && read(formFile).includes('__SET_BEFORE_LAUNCH__'))
  fail('§8 waitlist endpoint not configured', formFile, 'LIST_ID is still the placeholder');

if (failures.length) {
  console.error(`\n${failures.length} check failure(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log('✓ all checks pass');
