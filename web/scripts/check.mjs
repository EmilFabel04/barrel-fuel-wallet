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
