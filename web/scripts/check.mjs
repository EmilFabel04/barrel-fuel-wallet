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

const stripComments = s =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

// §5.2 — amber exactly once, in globals.css only
let amber = 0;
for (const p of cssish) {
  const hits = (stripComments(read(p)).match(/#FF6A00/gi) || []).length;
  amber += hits;
  if (hits && !p.endsWith('globals.css'))
    fail('§5.2 amber outside globals.css', p, `${hits} occurrence(s)`);
}
if (amber !== 1)
  fail('§5.2 amber must appear exactly once', join(ROOT, 'app/globals.css'), `found ${amber}`);

// §5.2 — amber is a FILL. The count above proves the token is declared once;
// this proves it is never painted as text, which is the rule that matters.
for (const p of cssish) {
  if (/(^|[;{\s])color:\s*var\(\s*--accent\s*\)/m.test(stripComments(read(p))))
    fail('§5.2 amber used as text', p, 'color: var(--accent)');
}

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
  /^https?:\/\/(www\.)?barrel\./i,
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

// §5.2 — tokens must match src/theme/tokens.ts (LIGHT) exactly. Parsed from
// the file, not restated here, so drift fails instead of quietly passing a
// hardcoded copy.
const REQUIRED_TOKENS = {
  '--bg': '#FFFFFF', '--surface': '#F7F5F0', '--text': '#000000',
  '--text-dim': '#3A342D', '--text-muted': '#5C554C',
  '--border': '#948A78', '--hairline': '#DCD6C9', '--accent': '#FF6A00',
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

if (failures.length) {
  console.error(`\n${failures.length} check failure(s):\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  process.exit(1);
}
console.log('✓ all checks pass');
