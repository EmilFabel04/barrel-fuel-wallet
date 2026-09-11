# Barrel — read this before editing anything

A **UI shell over mock data**: a prepaid fuel wallet for South African motorists, denominated
in **litres, not rand**. No backend, no payments. The wallet persists locally (AsyncStorage)
but there is nothing behind it. Anyone shown this must be told it is a prototype.

**Two projects live here.** The Expo app at the root, and a separate Next.js marketing site in
`web/` with its own lockfile and its own rules (`web/AGENTS.md`). They are not a workspace —
never run `npm install` from the root expecting it to reach `web/`.

## Where to look

| | |
|---|---|
| `docs/TODO.md` | **What to do next.** Start here. |
| `docs/HANDOVER.md` | The rules below in full, the seeded figures, and the traps. |
| `docs/GAPS.md` | What is missing, and why it matters. |
| `docs/DECISIONS.md` | Why things are the way they are, with cost-if-wrong. |
| `docs/UI.md` | Every screen, every number, and where it comes from. |
| `docs/superpowers/specs/` | The design specs. **When anything disagrees with the spec, the spec wins.** |

## Architecture

```
src/lib/    pure, React-free, fully tested — the model (+ the app clock)
src/data/   types, zone price table, stations, the seed
src/store/  zustand wrapping src/lib
src/theme/  tokens + provider (the ONLY file containing hex)
src/components/  18 shared components
app/        12 screens + 2 layouts, expo-router
```

Litres are held as dated `Lot`s carrying the price paid and a 90-day expiry — not as a scalar
balance. Change logic in `src/lib` and let the screens follow.

## Rules that must not be broken

1. **Hex only in `src/theme/tokens.ts`.** Everywhere else uses `useTheme()`.
2. **A fill colour must never be text.** `accent` (amber `#FF6A00`) and `positive` (lime
   `#7A9000`) are fills with ink set on them; their text halves are `accentText` and
   `positiveText`. Use `heroInk` for numeric heroes. Spread `useElevation()` unconditionally.
3. **Never set `fontWeight` against a custom family** — each weight is a separate family.
   Use `<Readout weight="500">`. Keep existing `fontVariant: ['tabular-nums']` on Figtree text.
4. **Tab screens pass `insetBottom={false}` to `<Screen>`; pushed screens do not.** `<Screen>`
   scrolls by default — pass `scroll={false}` only if the screen owns its own ScrollView.
5. **Never hardcode a number a function can derive.** Use `priceOn`, `nextPriceChange`, the
   store, or the formatters.
6. **One definition per operation**, and **`src/lib` and `src/data` must never call `now()`** —
   they take an explicit `at: Date`. That is what makes them testable.
7. **Two caps, not interchangeable.** `MONTHLY_TOPUP_CAP_L` (500) is what can be bought in per
   month; `WEEKLY_REDEMPTION_CAP_L` (110) is what can be spent out per rolling 7 days. And
   `REDEMPTION_CAP_WINDOW_DAYS` (7) is not `REDEMPTION_DAYS` (90).
8. **The card pass uses the `PASS` token group, never `useTheme()`** — it depicts a physical
   white card and must look identical in both themes.
9. **Screens never branch on the theme.** `useIsLight()` has exactly one legitimate caller,
   `Button.tsx`.
10. **The clock stays pinned.** `DEMO_NOW` is 30 September 2026. `setClock(() => new Date())`
    guts the app — the seed is dated absolutely and does not survive real time.

## Verifying

```
npm test              # 295 tests
npx tsc --noEmit      # excludes web/ on purpose — do not remove that exclusion
npx expo start        # --web for browser, --android for the emulator
```

**Not one test renders a screen.** All 295 cover `src/lib`, `src/data`, the store and isolated
components. A chart bug that bunched both series into the middle third of the panel passed
every one of them and was found only by opening the app. **Visual changes must be looked at.**

## Traps

- **`src/data/prices.ts` is invented demo data** — a fictional 2026 supply shock. It must never
  reach `web/`, which has its own file of real published DMPR figures.
- **Fully-consumed lots are deleted from the array**, so a ledger row must never look up its lot
  to find an expiry — derive it from the entry's own `when + 90 days`.
- **Comments cite ruling ids** (`Ruling T4-a`) from a workspace that no longer exists. The
  reasoning is in `docs/DECISIONS.md`; the ids resolve nowhere else.
- **The design canvas is not a source of truth for numbers.** It has been wrong by 18x.
