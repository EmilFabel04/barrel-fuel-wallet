# Barrel Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put a working safety net under the app — automated checks, a shared model package, real device builds — and move the session token out of plaintext storage.

**Architecture:** Nothing a user sees changes. `src/lib` becomes `@barrel/model`, an npm workspace package, so the same tested TypeScript can later be imported by server code. CI gates every push. The session moves from unencrypted `AsyncStorage` to the platform keychain via a small storage adapter that falls back to `localStorage` on web, which is a development surface only.

**Tech Stack:** Expo SDK 57, React Native 0.86, TypeScript 6, npm workspaces, Jest + jest-expo, ESLint flat config, GitHub Actions, EAS Build, `expo-secure-store`.

**Spec:** `docs/superpowers/specs/2026-09-13-barrel-backend-design.md`

---

## Scope of this plan

The spec's Phase 0 bundles five things: CI, linter, workspace, **integer conversion**, and EAS. This plan covers **four of them and Phase 1**. The integer conversion is deliberately excluded and gets its own plan.

**Why the split.** The integer conversion rewrites the arithmetic of every balance, price and cap, touching `src/lib`, `src/data/seed.ts`, the store and the screens. It is the one change here where a mistake is silent and expensive. It should be done *after* CI exists, so the 295 tests run automatically on every commit while it happens — that is precisely the safety net it needs, and building the net first is the point.

**This plan delivers:**

| | |
|---|---|
| Task 1 | ESLint + CI gating `tsc`, lint and tests |
| Task 2 | `packages/model` workspace, `src/lib` moved, 22 imports updated |
| Task 3 | Session token in the keychain, not plaintext |
| Task 4 | EAS build profiles for real devices |

**Explicitly not here:** integers, Supabase, auth, any server. See the spec's phase table.

---

## Global Constraints

Copied from the spec and `AGENTS.md`. Every task's requirements implicitly include these.

- **Hex only in `src/theme/tokens.ts`.** No task here touches colour.
- **One definition per operation.** Do not duplicate a function to avoid an import.
- **`src/lib` and `src/data` must never call `now()`.** They take an explicit `at: Date`. Moving the files must not change this.
- **The root `tsconfig.json` carries `"exclude": ["web"]`.** Do not remove it — `web/` type-checks itself against Next's React types, and including it breaks the app's type-check on code it never touched.
- **`web/` is not part of the workspace** and keeps its own lockfile. The React versions differ deliberately (app `19.2.3`, web `19.2.8`).
- **Never `npm install` from the repo root expecting it to reach `web/`.**
- **The suite must be green and `npx tsc --noEmit` clean at the end of every task.** The count is 295 through Tasks 1 and 2, and 299 from Task 3 onward (four new tests). Any other number means something was lost — stop and find it.
- **Verify visually.** Not one test renders a screen. After Task 2, run the app before continuing — see `.claude/skills/run-barrel/SKILL.md`.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `eslint.config.js` | Flat ESLint config extending `eslint-config-expo` |
| `.github/workflows/ci.yml` | Runs type-check, lint and tests on push and PR |
| `packages/model/package.json` | Declares `@barrel/model`, entry point `src/index.ts` |
| `packages/model/src/*.ts` | The twelve files moved from `src/lib` |
| `packages/model/src/index.ts` | Barrel export — the package's public surface |
| `src/store/secureStorage.ts` | Platform-aware encrypted storage adapter for zustand |
| `src/store/__tests__/secureStorage.test.ts` | Its tests |
| `eas.json` | EAS build profiles |
| `scripts/merge-model-imports.mjs` | One-off import merger, deleted at the end of Task 2 |

**Modified:**

| Path | Change |
|---|---|
| `package.json` | `workspaces`, `@barrel/model` dependency, `lint` script |
| `jest.config.js` | `moduleNameMapper` for `@barrel/model` |
| `tsconfig.json` | `paths` for `@barrel/model` |
| 22 files across `src/` and `app/` | Imports repointed to `@barrel/model` |
| `src/store/session.ts` | Uses `secureStorage` instead of `jsonStorage` |

**Deleted:** `src/lib/` (moved, not removed — content preserved).

---

## Task 1: ESLint and CI

Nothing merges without the checks passing. This goes first so every later task is gated by it.

**Files:**
- Create: `eslint.config.js`
- Create: `.github/workflows/ci.yml`
- Modify: `package.json` (add `lint` script)

**Interfaces:**
- Consumes: nothing.
- Produces: `npm run lint` exits 0. CI workflow named `CI` with a job named `app`.

**Context the executor needs:**

`web/` is **deliberately excluded from CI.** Its `npm run verify` runs `next build && node scripts/check.mjs`, and `check.mjs` intentionally fails while `LIST_ID` is the placeholder `'__SET_BEFORE_LAUNCH__'` and `ENTITY` is unfilled. Wiring it into CI now would make the pipeline permanently red. It gets added when those launch values are set.

- [ ] **Step 1: Generate the ESLint config**

Expo's CLI installs the dependencies and writes a flat config. Run from the repo root:

```bash
npx expo lint
```

This creates `eslint.config.js` and adds `eslint` and `eslint-config-expo` to `devDependencies`. If it prompts, accept.

- [ ] **Step 2: Confirm the config is flat-format and scoped**

Open `eslint.config.js`. It must extend `eslint-config-expo/flat` and must ignore `web/`, `dist/` and `packages/*/node_modules`. If the generated file lacks the ignores, make it read:

```js
// eslint.config.js
const expoConfig = require('eslint-config-expo/flat');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  expoConfig,
  {
    // web/ is a separate project with its own lint config and its own React
    // version. dist/ is build output.
    ignores: ['web/**', 'dist/**', 'node_modules/**', '.expo/**'],
  },
]);
```

- [ ] **Step 3: Run the linter and see what it says**

```bash
npx eslint .
```

Expected: either clean, or a list of violations. **Do not disable rules to make it pass.** Fix real issues. If a rule is genuinely wrong for this codebase, disable that one rule in `eslint.config.js` with a comment saying why.

- [ ] **Step 4: Fix every violation, then confirm clean**

```bash
npx eslint .
```

Expected: exits 0, no output.

- [ ] **Step 5: Add the lint script**

In `package.json`, inside `"scripts"`, add:

```json
"lint": "eslint .",
```

- [ ] **Step 6: Verify the full local gate passes**

```bash
npx tsc --noEmit && npm run lint && npm test
```

Expected: tsc silent, lint silent, `Tests: 295 passed, 295 total`.

- [ ] **Step 7: Write the CI workflow**

Create `.github/workflows/ci.yml`:

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  app:
    name: App — types, lint, tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install
        run: npm ci

      - name: Type-check
        run: npx tsc --noEmit

      - name: Lint
        run: npm run lint

      - name: Tests
        run: npm test -- --ci
```

Note: `web/` is not built here. See the context note above.

- [ ] **Step 8: Verify the workflow file is valid YAML**

```bash
node -e "const y=require('fs').readFileSync('.github/workflows/ci.yml','utf8'); if(!y.includes('npm ci')) throw new Error('missing install step'); console.log('workflow file readable, ' + y.split('\n').length + ' lines')"
```

Expected: prints the line count without throwing.

- [ ] **Step 9: Commit**

```bash
git add eslint.config.js .github/workflows/ci.yml package.json package-lock.json
git commit -m "chore(ci): lint and a gate that runs the tests without being asked

295 tests that nothing runs automatically protect you only when someone
remembers. CI now runs tsc, eslint and the suite on every push and pull
request.

web/ is deliberately not in the pipeline: its own verify script fails on
purpose while LIST_ID is a placeholder, so gating on it would make CI
permanently red. It joins when the launch values are set."
```

---

## Task 2: The `@barrel/model` workspace

Moves `src/lib` into a package so the same tested code can later be imported by server code without being copied. **No logic changes — this is a move and a re-import.**

**Files:**
- Create: `packages/model/package.json`
- Create: `packages/model/src/index.ts`
- Move: `src/lib/*.ts` → `packages/model/src/*.ts` (12 files)
- Move: `src/lib/__tests__/*` → `packages/model/src/__tests__/*`
- Modify: `package.json`, `jest.config.js`, `tsconfig.json`
- Modify: 23 files importing from `src/lib`

**Interfaces:**
- Consumes: nothing.
- Produces: package `@barrel/model`, importable as `import { balanceOf, formatLitres, now } from '@barrel/model'`. Every symbol previously reachable at `src/lib/<file>` is re-exported from the package root.

**Context the executor needs:**

- **Expo SDK 52 and later configure Metro for monorepos automatically.** This project is on SDK 57, so **do not write a `metro.config.js`.** If module resolution fails after this task, that is a signal something else is wrong — do not paper over it with manual Metro config.
- **npm workspaces, not pnpm.** The repo already uses npm and Expo supports npm workspaces first-class. Changing package manager in the same task as a file move would make a failure impossible to attribute.
- **The app stays at the repo root.** Expo's monorepo guide shows apps under `apps/*`; moving the whole app there would touch every path, `app.json`, and the assets. Not worth it for one shared package.
- **Jest needs a `moduleNameMapper`**, not just workspace resolution. npm symlinks the package into `node_modules/@barrel/model`, and `jest.config.js` has a `transformIgnorePatterns` that skips `node_modules` — so without the mapper, Jest would try to run untranspiled TypeScript and fail confusingly.

- [ ] **Step 1: Create the package manifest**

Create `packages/model/package.json`:

```json
{
  "name": "@barrel/model",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts"
}
```

No build step: the entry point is TypeScript source. Metro and Jest both transpile it, and the package has no dependencies of its own — it imports nothing.

- [ ] **Step 2: Move the files with git so history follows them**

```bash
mkdir -p packages/model/src
git mv src/lib/*.ts packages/model/src/
git mv src/lib/__tests__ packages/model/src/__tests__
rmdir src/lib
ls packages/model/src/
```

Expected: 12 `.ts` files plus `__tests__/`.

- [ ] **Step 3: Write the barrel export**

Create `packages/model/src/index.ts`:

```ts
/**
 * The public surface of the model.
 *
 * Everything here is pure and React-free, takes an explicit `at: Date` rather
 * than reading a clock, and has no external dependencies. That is what lets the
 * same code run on the device and, later, inside a server transaction.
 */
export * from './caps';
export * from './cardfill';
export * from './clock';
export * from './format';
export * from './holdings';
export * from './lots';
export * from './phone';
export * from './pricewatch';
export * from './round';
export * from './savings';
export * from './usage';
export * from './window';
```

- [ ] **Step 4: Check the barrel has no name collisions**

```bash
npx tsc --noEmit -p tsconfig.json 2>&1 | head -20
```

Expected: errors about unresolved `src/lib/...` imports (those get fixed in step 7), but **no error containing "Module ... has already exported a member named"**. If you see a collision, rename nothing — instead export that module under a namespace and record it in the plan's notes.

- [ ] **Step 5: Declare the workspace and the dependency**

In the root `package.json`, add `workspaces` at the top level (sibling of `"dependencies"`):

```json
"workspaces": ["packages/*"],
```

and add to `"dependencies"`:

```json
"@barrel/model": "*",
```

Note `web/` is **not** matched by `packages/*` and stays independent, as required.

- [ ] **Step 6: Install so npm links the package**

```bash
npm install
ls -la node_modules/@barrel/
```

Expected: `model` present as a symlink to `../../packages/model`.

- [ ] **Step 7: Repoint every import**

22 files import from `src/lib`. Rewrite them to the package. From the repo root:

```bash
# app/ and src/ files reaching into src/lib, at any depth
grep -rl "from '\(\.\./\)*src/lib/" app src | xargs sed -i '' -E "s|from '(\.\./)*src/lib/[a-z]+'|from '@barrel/model'|g"

# files inside src/ that used a shorter relative path
grep -rl "from '\(\.\./\)*lib/" app src | xargs sed -i '' -E "s|from '(\.\./)*lib/[a-z]+'|from '@barrel/model'|g"
```

Both commands were dry-run against this tree on 2026-09-14: together they convert every real import and touch nothing else.

- [ ] **Step 8: Merge the duplicate import lines with the script below**

A file that imported from several model files now has several `from '@barrel/model'` lines — up to **seven** in `src/data/__tests__/seed.test.ts`. ESLint's `no-duplicate-imports` rejects them, and merging 15 files by hand invites mistakes. Two of them use the multi-line brace form, which a naive one-line regex misses.

Create `scripts/merge-model-imports.mjs`:

```js
// Merge every `import { … } from '@barrel/model'` in a file into one statement.
// Handles both the single-line and multi-line brace forms.
// Written for the src/lib -> packages/model move; delete it after the move.
import { readFileSync, writeFileSync } from 'node:fs';

const PKG = '@barrel/model';
// [^{}] keeps the match inside ONE brace group while still spanning newlines.
// Using [\s\S]*? here instead lets a match begin at an earlier import statement
// and swallow everything up to the first `} from '@barrel/model';`, silently
// merging unrelated modules' imports together. That bug was hit and fixed while
// writing this plan — do not "simplify" this character class.
const RE = new RegExp(`import\\s*\\{([^{}]*)\\}\\s*from\\s*'${PKG}';[ \\t]*\\n?`, 'g');

let changed = 0;

for (const file of process.argv.slice(2)) {
  const src = readFileSync(file, 'utf8');

  const names = [];
  let firstAt = -1;

  for (const m of src.matchAll(RE)) {
    if (firstAt === -1) firstAt = m.index;
    for (const raw of m[1].split(',')) {
      const n = raw.trim();
      if (n && !names.includes(n)) names.push(n);
    }
  }

  if (firstAt === -1 || names.length === 0) continue;

  names.sort((a, b) =>
    a.replace(/^type /, '').localeCompare(b.replace(/^type /, '')),
  );
  const merged = `import { ${names.join(', ')} } from '${PKG}';\n`;

  let seen = false;
  const out = src.replace(RE, () => {
    if (seen) return '';
    seen = true;
    return merged;
  });

  if (out !== src) {
    writeFileSync(file, out);
    changed++;
  }
}

console.log(`merged imports in ${changed} file(s)`);
```

Run it:

```bash
node scripts/merge-model-imports.mjs $(grep -rl "from '@barrel/model'" app src)
```

Expected: `merged imports in 15 file(s)`.

- [ ] **Step 9: Confirm no duplicates remain**

```bash
grep -rc "from '@barrel/model'" app src | grep -vE ':(0|1)$' | wc -l
```

Expected: `0`.

Then spot-check the file that is hardest to get right — every non-model import must be untouched:

```bash
sed -n '1,10p' src/store/wallet.ts
```

Expected: `zustand`, `zustand/middleware`, `../data/types`, `../data/seed`, `../data/prices`, `../data/stations` and `./persist` all still on their own lines with their original bindings, and exactly one `@barrel/model` line.

- [ ] **Step 10: Confirm no *import* of the old path survives**

The obvious grep produces false failures: three **comments** legitimately mention `src/lib` in prose. Match import statements only:

```bash
grep -rnE "from '(\.\./)*(src/)?lib/" app src packages || echo "clean: no imports of the old path"
```

Expected: `clean: no imports of the old path`.

- [ ] **Step 11: Update the three stale comments**

These reference a directory that no longer exists. They are prose, not code, but a comment pointing at a moved path is how the next person is misled.

```bash
grep -rn "src/lib" app src packages
```

Expected three hits — in `app/alerts.tsx`, `src/store/wallet.ts` and `packages/model/src/clock.ts`. In each, change `src/lib` to `packages/model`. Keep the surrounding sentence intact; only the path changes.

- [ ] **Step 12: Delete the migration script**

It was for this one move and should not linger as something to maintain.

```bash
rm scripts/merge-model-imports.mjs
rmdir scripts 2>/dev/null || true
```

- [ ] **Step 13: Map the package for TypeScript**

In `tsconfig.json`, add `paths` inside `compilerOptions` (keep `"exclude": ["web"]` exactly as it is).

**Do not add `baseUrl`.** TypeScript 6 — which this project is on — deprecates it: `error TS5101: Option 'baseUrl' is deprecated and will stop functioning in TypeScript 7.0`. `paths` resolves relative to the tsconfig's own location without it.

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "types": ["jest"],
    "paths": {
      "@barrel/model": ["./packages/model/src/index.ts"]
    }
  },
  "exclude": ["web"]
}
```

- [ ] **Step 14: Map the package for Jest**

In `jest.config.js`, add `moduleNameMapper` (leave `transformIgnorePatterns` untouched):

```js
module.exports = {
  preset: 'jest-expo',
  setupFiles: ['<rootDir>/jest.setup.js'],
  // Resolve the workspace package to its source rather than through the
  // node_modules symlink — transformIgnorePatterns skips node_modules, so the
  // symlinked TypeScript would reach Jest untranspiled.
  moduleNameMapper: {
    '^@barrel/model$': '<rootDir>/packages/model/src/index.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
};
```

- [ ] **Step 15: Run the whole gate**

```bash
npx tsc --noEmit && npm run lint && npm test
```

Expected: tsc silent, lint silent, `Tests: 295 passed, 295 total`. **The test count must not change.** A different number means a test file was lost in the move — stop and find it.

- [ ] **Step 16: Verify the app actually runs**

Tests do not render a screen, and module resolution failures surface at bundle time, not test time. This step is not optional.

```bash
npx expo start --web --port 8082
```

Wait for the bundle, then confirm with a request and a look:

```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8082
```

Expected: `200`. Then open it and confirm the Wallet renders **42.6 L**, **R21.87**, and "12.0 L expires in 6 days". Stop the server when done — this machine has killed Metro three times for low memory.

- [ ] **Step 17: Commit**

```bash
git add -A
git commit -m "refactor(model): src/lib becomes @barrel/model, a workspace package

The model is pure, React-free and imports nothing, which is what lets the
same code later run inside a server transaction instead of being copied
there. Moving it to a package is the step that makes that possible; nothing
about the logic changes.

npm workspaces rather than pnpm, because the repo already uses npm and Expo
supports both — changing package manager in the same commit as a file move
would make any failure impossible to attribute. No metro.config.js: SDK 52
and later configure monorepos automatically.

Jest resolves the package through moduleNameMapper rather than the
node_modules symlink, because transformIgnorePatterns skips node_modules and
the symlinked TypeScript would arrive untranspiled.

web/ is untouched and stays outside the workspace on its own lockfile.

295 tests green, tsc clean, Wallet verified in the browser."
```

---

## Task 3: The session token leaves plaintext storage

**The defect:** `AsyncStorage` is not encrypted. On 2026-09-11 the session was read out of storage in cleartext during a routine check: `{"phone":"+27821234567","signedInAt":{"__d":"2026-09-29T22:00:00.000Z"}}`. A phone number is personal information under POPIA and a session is an access credential; neither belongs in a plaintext file in the app sandbox.

**Files:**
- Create: `src/store/secureStorage.ts`
- Create: `src/store/__tests__/secureStorage.test.ts`
- Modify: `src/store/session.ts`
- Modify: `package.json` (adds `expo-secure-store`)

**Interfaces:**
- Consumes: `replacer`, `reviver` from `src/store/persist.ts` — do not write a second date-handling implementation.
- Produces: `secureStorage<T>(): StateStorage` — a zustand storage adapter, same shape as the existing `jsonStorage<T>()`.

**Context the executor needs:**

- **`expo-secure-store` is Android and iOS only.** `SecureStore.isAvailableAsync()` resolves `true` on those platforms and nowhere else. Web must fall back to `localStorage`, and **web is a development surface only** — it is not a supported production target and the fallback must say so in a comment.
- **SecureStore has a practical size limit of about 2 KB on iOS.** The session is `{ phone, signedInAt }`, far under it. Do not put the wallet here.
- **Existing sessions will be lost on upgrade, and that is accepted.** Writing a migration from AsyncStorage would be correct for a product with users; there are none, the wallet is demo data, and the cost is one sign-in. This is a deliberate YAGNI call, not an oversight.
- **The wallet store stays on `AsyncStorage` for now.** It holds no credential. It moves to the server in the spec's Phase 4, so encrypting it locally first would be work thrown away.

- [ ] **Step 1: Install the dependency**

```bash
npx expo install expo-secure-store
```

`npx expo install` rather than `npm install` — it picks the version matching SDK 57.

- [ ] **Step 2: Write the failing test**

Create `src/store/__tests__/secureStorage.test.ts`:

```ts
import { secureStorage } from '../secureStorage';

// The module is platform-aware; these tests exercise the web branch, which is
// what runs under jest-expo's default platform.
describe('secureStorage', () => {
  beforeEach(() => window.localStorage.clear());

  it('round-trips a value', async () => {
    const store = secureStorage<{ phone: string }>();
    await store.setItem('k', JSON.stringify({ state: { phone: '+27821234567' } }));
    const got = await store.getItem('k');
    expect(got).toContain('+27821234567');
  });

  it('returns null for a key that was never written', async () => {
    const store = secureStorage<{ phone: string }>();
    expect(await store.getItem('missing')).toBeNull();
  });

  it('removes a value', async () => {
    const store = secureStorage<{ phone: string }>();
    await store.setItem('k', JSON.stringify({ state: { phone: '+27821234567' } }));
    await store.removeItem('k');
    expect(await store.getItem('k')).toBeNull();
  });

  it('survives a storage backend that throws', async () => {
    const store = secureStorage<{ phone: string }>();
    jest.spyOn(window.localStorage, 'getItem').mockImplementation(() => {
      throw new Error('storage unavailable');
    });
    // A private window, cleared site data or a locked keychain must not crash
    // the app on launch — an unreadable session means signed out, not broken.
    expect(await store.getItem('k')).toBeNull();
  });
});
```

- [ ] **Step 3: Run it and watch it fail**

```bash
npx jest src/store/__tests__/secureStorage.test.ts
```

Expected: FAIL — `Cannot find module '../secureStorage'`.

- [ ] **Step 4: Write the adapter**

Create `src/store/secureStorage.ts`:

```ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { createJSONStorage, type StateStorage } from 'zustand/middleware';
import { replacer, reviver } from './persist';

/**
 * Encrypted key-value storage for anything that is a credential.
 *
 * `AsyncStorage` writes plaintext into the app sandbox, which is fine for demo
 * wallet data and wrong for a session: a phone number is personal information
 * and a session is an access token. `expo-secure-store` wraps the iOS Keychain
 * and the Android Keystore.
 *
 * Two limits worth knowing before putting anything else in here:
 *
 * - It exists on Android and iOS only. Web falls back to `localStorage`, which
 *   is NOT encrypted — web is a development surface for this app, never a
 *   production one, and nothing security-sensitive should be demonstrated there.
 * - iOS has historically refused values over roughly 2 KB. The session is two
 *   fields. The wallet does not belong here.
 *
 * Every operation is wrapped: an unreadable store means "signed out", never a
 * crash on launch. A locked keychain, a private browsing window and cleared
 * site data all reach this code as a throw.
 */
const nativeStore: StateStorage = {
  getItem: async key => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      // Losing the write means the user signs in again next launch, which is
      // the correct failure for a credential store that cannot be trusted.
    }
  },
  removeItem: async key => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      // Already gone, or unreachable. Either way there is nothing to do.
    }
  },
};

const webStore: StateStorage = {
  getItem: key => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* quota, or a context that blocks site data */
    }
  },
  removeItem: key => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* nothing to do */
    }
  },
};

/**
 * The same date handling as `jsonStorage` — `Date` does not survive JSON, and
 * there is one definition of how it is tagged and rebuilt (`persist.ts`).
 */
export const secureStorage = <T>() =>
  createJSONStorage<T | undefined>(
    () => (Platform.OS === 'web' ? webStore : nativeStore),
    { replacer, reviver },
  );
```

- [ ] **Step 5: Run the tests and watch them pass**

```bash
npx jest src/store/__tests__/secureStorage.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 6: Point the session store at it**

In `src/store/session.ts`, change the import on line 3 from:

```ts
import { jsonStorage, discardUnknownVersion } from './persist';
```

to:

```ts
import { discardUnknownVersion } from './persist';
import { secureStorage } from './secureStorage';
```

and in the `persist` options, change:

```ts
      storage: jsonStorage<PersistedSession>(),
```

to:

```ts
      // The session is a credential, so it goes in the keychain rather than the
      // plaintext store the wallet uses. See secureStorage.ts.
      storage: secureStorage<PersistedSession>(),
```

- [ ] **Step 7: Update the comment that is now wrong**

The file's header comment says there is no server behind the session. That stays true. But `persist.ts`'s comment about `AsyncStorage` now describes only the wallet. In `src/store/persist.ts`, change the `jsonStorage` doc comment's first line from:

```
 * AsyncStorage with the date handling above applied. AsyncStorage rather than
```

to:

```
 * AsyncStorage with the date handling above applied. Used by the WALLET only —
 * the session moved to the keychain (see secureStorage.ts), because
 * AsyncStorage writes plaintext. AsyncStorage rather than
```

- [ ] **Step 8: Run the whole gate**

```bash
npx tsc --noEmit && npm run lint && npm test
```

Expected: tsc silent, lint silent, `Tests: 299 passed, 299 total` — the original 295 plus the 4 new ones.

- [ ] **Step 9: Verify the token is actually gone from plaintext**

This is the point of the task, so prove it rather than assume it.

```bash
npx expo start --web --port 8082
```

Open it, sign in with any number and any six digits, then in the browser console:

```js
// The session key must NOT be in the wallet's plaintext store.
JSON.stringify({
  keys: Object.keys(localStorage),
  session: localStorage.getItem('barrel-session'),
})
```

On web the fallback still uses `localStorage`, so the key will be present — that is expected and documented. **The real verification is on a device.** Boot the iOS simulator and confirm sign-in still works end to end:

```bash
xcrun simctl boot "iPhone 17 Pro" && open -a Simulator
npx expo start --ios --port 8083
```

Sign in, force-quit, reopen: the app must still be signed in. Then shut everything down:

```bash
xcrun simctl shutdown "iPhone 17 Pro"; osascript -e 'quit app "Simulator"'
```

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "fix(session): the token moves to the keychain

AsyncStorage writes plaintext into the app sandbox. On 11 September the
session was read out of it in cleartext during a routine check — a phone
number is personal information under POPIA and a session is an access
credential, and neither belongs in a readable file.

expo-secure-store wraps the iOS Keychain and the Android Keystore. It exists
on those two platforms only, so web falls back to localStorage with a comment
saying plainly that web is a development surface and not a production one.

Every operation is wrapped: a locked keychain, a private window or cleared
site data reaches this code as a throw, and an unreadable session means
signed out rather than a crash on launch.

Existing sessions are lost on upgrade. That is a deliberate call, not an
oversight — a migration would be right for a product with users, there are
none, and the cost is one sign-in.

The wallet stays on AsyncStorage: it holds no credential and moves to the
server in phase 4, so encrypting it locally now would be work thrown away.

299 tests green, verified signed-in state survives a force-quit on device."
```

---

## Task 4: EAS build profiles

Real builds on real devices. Expo Go is a prototype tool — it runs a shared host app, so it cannot include custom native code and does not represent what ships.

**Files:**
- Create: `eas.json`
- Modify: `app.json` (EAS project id, added by the CLI)

**Interfaces:**
- Consumes: nothing.
- Produces: three build profiles — `development`, `preview`, `production`.

**This task needs the user.** `eas init` requires an Expo account and an interactive login. Do not attempt to automate it; ask the user to run the login step and continue afterwards.

- [ ] **Step 1: Install the CLI**

```bash
npm install --save-dev eas-cli
npx eas --version
```

- [ ] **Step 2: Ask the user to log in**

Stop and ask. In their terminal:

```
! npx eas login
```

Wait for confirmation before continuing.

- [ ] **Step 3: Initialise the project**

```bash
npx eas init
```

This adds `extra.eas.projectId` to `app.json`. Accept the suggested slug (`barrel`).

- [ ] **Step 4: Write the build profiles**

Create `eas.json`:

```json
{
  "cli": {
    "version": ">= 5.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "ios": { "simulator": true },
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

`development` builds a client that can load your local bundle and, unlike Expo Go, includes any native module the app depends on. `ios.simulator` makes it installable on the simulator without a paid developer account.

- [ ] **Step 5: Verify the config parses**

```bash
node -e "const c=require('./eas.json'); const p=Object.keys(c.build); if(p.length!==3) throw new Error('expected 3 profiles, got '+p.length); console.log('profiles: '+p.join(', '))"
```

Expected: `profiles: development, preview, production`.

- [ ] **Step 6: Build a development client for the simulator**

```bash
npx eas build --profile development --platform ios
```

This runs in EAS's cloud and takes several minutes. When it finishes, install the result on the booted simulator as the CLI instructs.

- [ ] **Step 7: Confirm the build runs the app**

Launch the development build (not Expo Go) and confirm the Wallet renders 42.6 L. This proves the whole chain — workspace package resolution, native modules, and the bundle — works outside Expo Go.

- [ ] **Step 8: Commit**

```bash
git add eas.json app.json
git commit -m "build(eas): development, preview and production profiles

Expo Go runs a shared host app: it cannot include custom native code and
does not represent what ships. expo-secure-store happens to be bundled in it,
which is exactly the kind of coincidence that stops being true as soon as a
dependency is added.

The development profile builds a client that loads a local bundle and
includes the app's own native modules; ios.simulator makes it installable
without a paid developer account. Verified by running the Wallet from a
development build rather than Expo Go."
```

---

## Verification for the whole plan

Run after Task 4. Every one of these must hold before the plan is called done.

- [ ] `npx tsc --noEmit` — silent
- [ ] `npm run lint` — silent
- [ ] `npm test` — **299 passed** (295 original + 4 new)
- [ ] `grep -rn "src/lib" app src packages` — no results (Task 2 Step 11 updates the three prose comments; imports are checked separately in Step 10)
- [ ] `git log --oneline -4` — four commits, one per task
- [ ] `web/` untouched: `git diff --stat main~4 -- web/` is empty
- [ ] The app renders 42.6 L / R21.87 / "12.0 L expires in 6 days" from a **development build**, not Expo Go
- [ ] Sign-in survives a force-quit on a real device
- [ ] CI is green on the pushed branch

---

## Notes for whoever executes this

**The order is load-bearing.** CI first so everything after it is gated. The workspace move before the secure-store change so that when a module fails to resolve you know which commit did it. EAS last because it needs an account and can block.

**Stop if the test count changes unexpectedly.** 295 → 299 is the only expected change, and it happens in Task 3. Any other number means something was lost.

**Run the app after Task 2.** Module resolution failures do not show up in unit tests. The spec and `AGENTS.md` both say it and it has bitten this project before: a chart bug passed all 295 tests and was found by opening the app.

**Next plan, not this one:** the integer conversion. It should start only once CI is green and running on every push, because that is the safety net it needs.
