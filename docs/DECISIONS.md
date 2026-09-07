# Barrel UI shell — decisions made during the build

**Date:** 2026-09-07
**Branch:** `feat/barrel-ui-shell`
**Spec:** `docs/superpowers/specs/2026-09-06-barrel-fuel-wallet-design.md`
**Plan:** `docs/superpowers/plans/2026-09-07-barrel-fuel-wallet-ui.md`

Every decision below was made without the project owner present, during an autonomous
build of the 19-task plan. Each records what was decided, why, and what it costs if the
call was wrong. They are listed in the order they were made.

Roughly two thirds are corrections to defects in the **plan** rather than in any
implementation — the plan was written before a line of it had been run, and the reviews
found where it was wrong.

**The ones that change what the product says to a customer are marked ★.**

---

### 1. Ruling C1: Task 13's card pass hardcodes `'#FFFFFF'`, `'#000'`, `'#4A4A4A'`, which violates
the Global Constraint "No component may reference a raw hex value." The pass is a physical
object and must NOT theme-swap, so fixed colours are correct — but scattered hex is not.
Add a `PASS` token group to `src/theme/tokens.ts` (`PASS.bg`, `PASS.text`, `PASS.dim`,
`PASS.hairline`, `PASS.strataA`, `PASS.strataB`) and reference it. Satisfies the
constraint's intent while keeping the pass theme-invariant.
— Cost if wrong: one small refactor of card.tsx.

### 2. Ruling C2: Task 7's seed contains only the two opening lots plus September moves, so
`savingsToDate` / `litresBelowPump` / `averageBuyPrice` cannot produce the "since March"
figures spec §4.3 requires, and Task 17 hardcodes its six bars. Spec §4.3 is explicit that
these must be DERIVED or the screen stops agreeing with itself after the first fill.
Extend the Task 7 seed with consumed historical lots and fills for Mar–Aug, and derive

### 3. Ruling C3: With 105.2 L already topped up in September against a 150 L cap, only 44.8 L
(~R980) remains — so Task 12's default keypad value of '1500' opens the screen already
disabled at "MONTHLY CAP REACHED". Change the default to '500'. Demonstrates the live
conversion on load; the cap state is still reachable by typing past R980.
— Cost if wrong: one-line change to a default.

### 4. Ruling C4: Task 1 runs `create-expo-app` into a directory that already holds `.git`,
`docs/`, `.gitignore` and `.superpowers/`. The template refuses or clobbers in non-empty
directories. Scaffold into a temp subdirectory, then move its contents up, preserving the
existing files, and delete the temp dir.
— Cost if wrong: scaffold fails loudly and is retried; no data loss risk to committed work.

### 5. ★ Ruling C2-REVISED (supersedes C2): the design's Savings figures are not merely underivable,
they are arithmetically impossible. `58.7 L x R21.87/L = R1,283.77`, so the design's
"R1,284 saved" is the *rand value* of 58.7 litres at today's pump price, mislabelled as a
saving. The six monthly bars sum to the same R1,284. For 58.7 L to have saved R1,284, each
litre would have to have been free.

### 6. ★ Ruling C5: Task 18's alert copy is transcribed from the design as "rising 12c on the 2nd",
"PRICE ALERT - 02 OCT" and "TOP UP BEFORE 01 OCT". But 1 and 2 October 2026 are a Thursday
and a Friday. SA fuel prices change on the first Wednesday, which Task 3's price table
correctly encodes as 7 October — and Task 3's tests assert it. So the screen's copy would
contradict the app's own data.

### 7. Ruling T1-a: promote "LICENSE" from Minor to Important. It carries "Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)" — a false licensing statement in a repo for a proprietary product. Wrong-in-fact beats cosmetic. Remove it. — Cost if wrong: a deleted file Emil can restore in one command.

### 8. Ruling T1-b: promote "CLAUDE.md / AGENTS.md" from Minor to Important. CLAUDE.md is not documentation — it is `@AGENTS.md`, and AGENTS.md reads "Expo HAS CHANGED / Read the exact versioned docs at .../v57.0.0/ before writing any code." That is a live directive loaded into every future Claude session in this repo, from a template, that nobody in this project authored. Remove both. — Cost if wrong: Emil re-adds a CLAUDE.md he actually wants, which he should anyway.

### 9. Ruling T1-c: the plan's Tech Stack line says "Expo SDK 54"; create-expo-app@latest installed SDK 57.0.20 / RN 0.86.3 / React 19.2.3. Accept 57. Nothing in the plan or spec depends on 54 — it was my shorthand for "current". Later tasks target the installed version. — Cost if wrong: none identified; API differences would surface as test failures.

### 10. Ruling T4-a: the Important finding — `round1` duplicated verbatim in lots.ts and caps.ts — is plan-mandated, and the reviewer correctly declined to let the plan grade its own work. I checked how far it spreads: Task 7's plan text adds two more copies named `r1` plus an inline third in savings.ts. That is 5 copies under 2 names for one line of arithmetic. Cosmetic at 2; not at 5. Every litre balance in the product passes through this rounding, so a future change to it that misses one copy produces a silently wrong balance — the exact failure this product can least afford, given spec section 8.4 stakes the whole design on visible, checkable arithmetic. Decision: extract to `src/lib/round.ts` exporting `round1`. lots.ts and caps.ts import it; Task 7 imports it rather than defining `r1`. NOT added to format.ts — the reviewer rightly noted format.ts produces display strings, a different responsibility. — Cost if wrong: one tiny module and four import lines; trivially reversible.

### 11. Ruling T6-a: resolves the reviewer's "⚠️ Cannot verify" item. The brief's Interfaces block lists `priceOn` as a consumed dependency, but cardfill.ts neither imports nor needs it — `deriveLitres` takes pricePerLitre as a parameter and the caller does the lookup. Checked the plan: Task 7's store action does `const price = priceOn(resolved, TODAY)` before calling deriveLitres, so the composition is correct and lives in Task 7. This is stale plan documentation on my part, not an implementer gap. No code change. — Cost if wrong: none; the wiring is proven by Task 7's own code.

### 12. Ruling T6-b: promote the reviewer's second Minor (no regression test locking exact-word matching) to Important, and fold it into the fix round. The reviewer had to write a throwaway probe to establish that RIVONIAN does not match rivonia — meaning the suite cannot currently verify a property that decides station attribution, which is the unit phase-2 rebates get priced in. A future refactor to substring matching would pass every existing test. Two cheap tests close it, and the fix round is already open. — Cost if wrong: two extra tests nobody needed.

### 13. ★ Ruling T7-a: my invariant said "roughly 58.7 L bought below the pump price across that history", and the implementer hit exactly that for Mar-Aug. But `litresBelowPump` sums the WHOLE ledger, so September's own fills add 59.7 L and the screen will read 118.4 L, not 58.7 L. My invariant was ambiguous — it constrained the history when the function measures everything. Decision: accept 118.4 L. The screen's own label is "Saved since March", the ledger begins in March, so the whole-ledger figure is the honest answer to the question the label asks. Carving September out to hit a design number would be reverse-engineering the arithmetic to match a figure already established as wrong. — Cost if wrong: the Savings screen shows 118.4 L where the canvas showed 58.7 L. If Emil wants the canvas figure the fix is to relabel, not to retune the data.

### 14. Ruling T7-b: resolves the reviewer's "⚠️ Cannot verify" item — card.zone hardcoded 'inland' in the seed. Confirmed all five records in stations.ts carry zone: 'inland' (5/5), so the hardcode agrees with the data. No gap.

### 15. Ruling T7-c: Important #1 — the FIFO ordering + cost-accumulation loop is duplicated verbatim between seed.ts debit() and wallet.ts cardFill(), because consumeFifo() does not report the cost of what it consumed. Plan-mandated (both copies come from my brief). This is the round1 problem again but with higher stakes: the duplicated loop computes buyPricePerLitre, which is the sole input to the savings figure we just spent this task making honest. If the two copies ever diverge, or if activeLots()'s ordering changes and only one is updated, the savings number silently lies — in a product whose entire design premise (spec 8.4) is arithmetic the user can check on screen. Decision: add `consumeFifoWithCost(lots, litres, at)` to src/lib/lots.ts returning { lots, consumedIds, cost }, and have both call sites use it. One definition of the ordering, one definition of the cost. — Cost if wrong: one helper and two call-site edits; fully covered by existing tests since behaviour must not change.

### 16. Ruling T7-d: Important #2 — cardFill() calls resolveZone/deriveLitres, which THROW for an unmatched merchant descriptor with no fallback zone. The cap and balance guards beside them fail closed as silent no-ops; this one crashes the action. Plan-mandated. This is not merely inconsistent, it contradicts the spec. Spec section 11 states: "Unmatched fills must still succeed... Fail open on attribution; never fail the card at the pump." A throw on an unresolvable descriptor is exactly failing the card at the pump, which is the one thing the spec says must never happen. Decision: cardFill must not throw. Guard the resolve/derive step and return without mutating state, consistent with the sibling guards, with a comment citing spec section 11 that production behaviour is to queue the fill for manual pricing. Full queueing is backend work and out of scope for a mock. Also fold in the related Minor: topUp() has no non-positive guard and would push a negative-litre Lot into state. — Cost if wrong: three guards in the store; no behaviour change on any path a screen currently exercises.

### 17. ★ Ruling T7-e: this is a genuine latent bug in my own seed design, found only because the T7-c refactor forced the two code paths together — which is the argument for the refactor making itself. The seeded history portrays a wallet state the product forbids: spec 8.1 makes the 90-day redemption window "a product requirement, not decoration", and litres held 118 days cannot exist. Anyone demoing the Balance screen and asking why those litres never expired would have no answer. Decision: option (a) — redesign the historical batches so every fill draws only unexpired lots, and route seed.ts through consumeFifoWithCost so the gap cannot reopen. The figures will move and that is accepted: buying nearer each fill captures less price movement, so savings will fall. I am also RELAXING my earlier 58.7 L target — it was derived from the design figure already established as wrong (ruling C2-REVISED), so holding the honest data to it would be reverse-engineering toward a bad number for the second time. Binding invariants remain: final 42.6 L, September top-ups 105.2 L, all intermediates positive, monthly bars summing bit-for-bit to the hero, one surviving December lot, expiringWithin(30) = 0. Savings must simply be non-trivial and honest. — Cost if wrong: the Savings screen shows a smaller number again. Emil already knows the honest figure is ~a tenth of the canvas's; this may reduce it further.

### 18. Ruling T89-a: the implementer applied the 44x44 minimum-touch-target global constraint over the brief's own Button/Toggle sample code, which did not meet it (added minWidth:44 to Button, hitSlop to Toggle; visual sizes unchanged). Correct call — constraint beats stale sample code, and it flagged rather than hid the divergence. Upheld. — Cost if wrong: none; larger touch targets cannot break a layout that already fit.

### 19. Ruling T89-b: the plan's final verification says the hex grep must hit tokens.ts only, but it also hits src/theme/__tests__/tokens.test.ts — which the brief itself requires, since that test asserts the exact design hex values and is the thing stopping a token being silently changed. Amend the criterion to "tokens.ts and its own test file". Component and screen files must stay clean, which they are. — Cost if wrong: none; a stricter reading would delete a useful regression test.

### 20. Ruling T89-c: the Important finding — <Num>'s `weight` prop is inert or hazardous. It hardcodes fontFamily 'Outfit_800ExtraBold' while passing `weight` through as fontWeight. With expo-google-fonts each weight is a SEPARATE family; RN does not synthesise weights for custom fonts, and on iOS a mismatched family+weight descriptor can silently fall back to the system font. Plan-mandated — my brief's own sample code. The reviewer called it "currently dormant". It is not: I grepped the plan and SEVEN call sites across Tasks 14, 17, 18 and 19 pass weight="500" or weight="600". It would have fired on the very next screen task, and the failure is silent — text renders in the wrong face with nothing erroring. Decision: map `weight` to the matching loaded family (400 Regular / 500 Medium / 600 SemiBold / 700 Bold / 800 ExtraBold) instead of passing it through as fontWeight. Fix now, before any screen task consumes it. — Cost if wrong: a lookup table in one component.

### 21. Ruling T89-d: promote the reviewer's Screen-insets Minor to Important. Screen applies only insets.top. The reviewer flagged bottom-anchored buttons as a "likelihood"; I grepped — SEVEN screens in the plan use `marginTop: 'auto'` with a primary CTA pinned to the bottom. On any device with a home indicator those buttons sit under it, which on the Card and Top up screens is the primary action of the whole product. Decision: Screen applies insets.bottom as well. Plan-mandated (my sample code), fix in the shared component rather than seven times over in the screens. — Cost if wrong: a few points of bottom padding on devices without an indicator.

### 22. Ruling T10-a: the implementer flagged, but could not fix, a tension my own ruling T89-d created. I made Screen apply insets.bottom for the seven screens with bottom-anchored CTAs. But on the five TAB screens the tab bar already sits above the safe area, so Screen's padding is redundant and adds visible space the artboards do not have. T89-d was right for pushed screens and wrong for tab screens; I did not distinguish them. Decision: give Screen an optional `insetBottom` prop defaulting to true (safe for pushed screens), and have the five tab screens pass `insetBottom={false}`. Tab screens are Tasks 11, 13, 16, 17, 19; pushed screens are Tasks 12, 14, 15, 18 and keep the default. — Cost if wrong: a few points of padding on five screens; visible but trivial to retune.

### 23. Ruling T10-b: OVERRIDE my own "no new packages" constraint to add react-native-web (and @expo/metro-runtime if the web entry needs it) as devDependencies. The implementer could not run `expo start --web` because react-native-web is absent, so it verified by bundling for ios/android instead — reasonable, but it proves the app COMPILES, not that it RENDERS. Nine screen tasks remain and this is a visual-fidelity project whose entire deliverable is what the screens look like. A constraint that blocks looking at the thing being built is the wrong constraint. — Cost if wrong: two devDependencies that ship in no production bundle.

### 24. Ruling T1113-a: the implementer found a real design bug I had not anticipated. LIGHT.bg is #FFFFFF and PASS.bg is #FFFFFF, the pass carries no border, and shadows are banned — so in LIGHT MODE THE CARD IS INVISIBLE. Only the two grey strata beneath it mark where it is. This is the collision of three decisions that were each individually right: ruling C1 (pass is theme-invariant white), the light theme's white ground, and the flat no-shadow system. The source design never exposed it because artboard 03 is dark-only — the light artboard is the Wallet, not the Card. Decision: give the pass a permanent 1px `PASS.hairline` (#E2DFDA) border. Theme-invariant so C1 holds; 1px so the border rule holds; not a shadow. On black it is invisible against the white pass and costs nothing; on white it defines the card edge — which is also how a real white card on a white surface actually reads. Implementer to confirm empirically that it reads at normal zoom, and say so if it does not. — Cost if wrong: one border line; if too subtle, escalate to a stronger PASS token.

### 25. Ruling T1113-b: MY DISPATCH DEFECT. The implementer reported "No spec.md or artboard images exist anywhere in the repo — the briefs' 'per spec section X' references are unverifiable narrative." The spec does exist, at docs/superpowers/specs/2026-09-06-barrel-fuel-wallet- design.md (40KB). I never told the screen implementers where it is, so it worked from brief code alone and treated every spec citation as unverifiable. Every remaining screen dispatch must carry the spec path. Not the implementer's error. — Cost if wrong: none; this strictly adds context.

### 26. Ruling T1113-c: escalate the pass border from PASS.hairline (#E2DFDA) to PASS.strataA (#A8A8A8), on the implementer's honest "only just" report. The Card screen is the centre tab and the core mechanic of the product in v1 — its primary object should not depend on a quick glance landing right. strataA is already a PASS token, so the key-set test still passes, and it is semantically exactly right: it is the value the two strata beneath the card use to represent the card's edge, so the border becomes the same edge continued around the top and sides. — Cost if wrong: a slightly heavier outline; one token swap to undo.

### 27. Ruling T1113-d: fix the FROZEN stamp (spec 9.1 says it stamps FROZEN "in accent"; the code uses PASS.muted for both states). Plan-mandated — my Task 13 brief has the identical bug and it survived two fix rounds. t.accent is theme-invariant so useTheme() serves it without breaking C1. One line. — Cost if wrong: none.

### 28. Ruling T1113-e: replace the `t === LIGHT` identity check with an explicit signal. The reviewer established it is SOUND today — ThemeProvider passes the module-level singletons, never a copy — but fragile as an idiom: Tokens is a structural type, so any future {...LIGHT, override} (a preview theme, a test stub, a memoised value) silently makes isLight false forever with no compile error, no runtime error, and no test to catch it. Decisive factor: seven more screens are about to be written and would copy this idiom. Decision: export a `useIsLight()` hook from ThemeProvider, sourced from the same computation it already does. Fix now, before it propagates. — Cost if wrong: one small hook.

### 29. ★ Ruling T1113-f: promote the reviewer's Minor #3 to Important. The Wallet hardcodes "PETROL 95", "R21.87" and "+0.55%" as JSX literals. I checked them against the price table: R21.87 is right, but +0.55% is NOT — Aug 21.60 -> Sep 21.87 is +1.25%. So the primary screen displays a percentage its own pricing service contradicts. This is the same class of defect as ruling C5's alert date, and it is precisely what spec 8.4 exists to prevent. (The "+12c expected" line IS correct: Sep 21.87 -> Oct 21.99 = 12c exactly.) Decision: derive price and percentage from priceOn() rather than hardcoding. — Cost if wrong: the screen shows +1.25% where the canvas showed +0.55%. The canvas was wrong relative to the data we now have.

### 30. ★ Ruling T121415-a: fix the unbounded expiry-accent check. `soonish = exp - TODAY < 14*DAY` has no lower bound, so ALREADY-EXPIRED top-ups also satisfy it. I verified against the seed: 6 of 9 topup rows render accent, some 120 days past expiry; only 1 (Jul 8, expiring in 6 days) legitimately qualifies. The effect is that most of the ledger shouts urgency about litres that were spent months ago — inverting the meaning of the one colour this design reserves for warnings, on the guardrail spec 8.1 calls a product requirement. Decision: `diff >= 0 && diff < 14*DAY`. — Cost if wrong: none; the current behaviour is indefensible.

### 31. Ruling T121415-b: add "lots consumed" to Fill detail. Spec 9.2 names it explicitly in the screen's content list, `entry.lotIds` is already on the ledger entry, and the brief simply omitted it. Spec wins over brief. — Cost if wrong: one row on an informational screen.

### 32. Ruling T121415-c: reproduce spec 8.1's copy VERBATIM. The build paraphrases — drops "for them" and merges two sentences with an em-dash. Meaning survives, but this is the sentence that carries the CPA s63 position (litres convert back to rand, never expire to zero), and the spec says in terms that it "must not be softened". Copy that does legal work gets reproduced exactly, not approximately. — Cost if wrong: none.

### 33. Ruling T121415-d: the reviewer asked for a human check on Top up showing rand larger than litres, against the "hero is litres" rule. I checked the source design: artboard 02 sets randStr at 76px and litresStr at 46px. The design intends it, and correctly — Top up is an INPUT screen where the user types rand, not a balance display. The litres-hero rule governs screens that display a stored balance (Wallet, Card, Balance), all of which comply. No change. — Cost if wrong: none; matches the canvas.

### 34. Ruling T18-a: the implementer found ruling C5 was applied INCOMPLETELY — by me. I corrected the alert screen's dates but never checked the Wallet, which still hardcodes "Next change · 02 Oct". I verified: the price table's next inland change is Wed 7 Oct 2026 -> 21.99. So the app's primary screen names a date its own pricing service contradicts — the exact defect C5 exists to prevent, surviving on the screen I reviewed most closely, across three fix rounds and two clean reviews. Worth recording why it survived: the Task 11 reviewer checked the diff against the brief, and the brief said "02 Oct" too. Only someone holding the price table would catch it, and the implementer that found it had just derived the same value two screens over. Decision: derive the Wallet's next-change date and delta from PRICES, as alerts.tsx now does. Not a new ruling — the completion of C5. — Cost if wrong: none; it is currently wrong.

### 35. Ruling T18-b: fix the Important — alerts.tsx imports PRICES/priceOn and REIMPLEMENTS the same filter/sort inline instead of calling nextPriceChange, so the helper's own doc comment ("Shared by every screen that needs to say 'the price is about to change'") is false, and alerts.tsx lacks the undefined guard index.tsx has. Cannot crash today, but it is exactly the drift the helper was extracted to prevent. — Cost if wrong: one import and one guard.

### 36. Ruling T18-c: REJECT the reviewer's out-of-scope flag that SectionLabel.tsx violates the "nothing may set fontWeight" rule. I checked: SectionLabel sets fontWeight '600' on Platform.select({ios:'Menlo', default:'monospace'}) — a SYSTEM font. React Native does synthesise weights for system fonts; the prohibition exists only because expo-google-fonts ships each Outfit weight as a SEPARATE FAMILY, so fontWeight against a fixed Outfit family is inert. It does not apply here. The reviewer applied the rule by its letter without its reason. No change. — Cost if wrong: the monospace section labels would render at default weight, a subtle visual regression. Leaving them correct.

### 37. ★ Ruling F-1 (C1, BLOCKER): app/alerts.tsx hardcodes "2.4 L saved" and the matching prose. I verified: R2000 at R21.87 buys 91.4495 L; at R21.99 buys 90.9504 L; the real gain is 0.4990 L. The screen overstates by 4.8x — inches from the derived R21.87 -> R21.99 and +12c that refute it. In a financial UI whose central claim (spec 8.4) is arithmetic the user can check, a false quantitative claim is non-negotiable. It survived 19 scoped reviews for the same reason "02 Oct" did: spec 4.1 lists "2.4 L saved" under content-to-preserve, so every reviewer compared the diff to a brief carrying the same wrong number. The spec applied its own honesty test to the ledger (4.2) and to Savings (4.3) and never applied it to Alerts. Decision: derive it, and amend spec 4.1 alongside so the next reader cannot reintroduce it. — Cost if wrong: the alert's argument becomes weak (0.5 L), which is honest. Same conclusion 4.3 reached for Savings: if it reads thin, change the metric, not the number.

### 38. ★ Ruling F-2 (C2, BLOCKER): `positive` #C6F24E measures 1.30:1 on white. In light mode the Savings hero (82px), the ANSWER in the 8.4 conversion equation, the tallest bar, ledger credits and all four Subscribe bullets are invisible. Settings puts Light one tap away. The plan's own checklist item "light mode with no unreadable text" passed because it names artboard 05 — the Wallet — the one screen using no `positive` at all. Spec 3.1 fixes both accents "unchanged across themes", so this needs a ruling, not a unilateral edit. I am making it: add a `positiveText` token, #C6F24E in DARK and #5A7A0A in LIGHT (measured 4.97:1 on white, passes AA), used for TEXT and glyphs only. `positive` stays unchanged for FILLS — bars, toggle track — where contrast is against the fill, not through it. Amend spec 3.1 to record the split and why. — Cost if wrong: light-mode lime text reads olive rather than lime. Preserves the semantic; the alternative (isLight ? text : positive) loses it entirely.

### 39. Ruling F-3 (C2b): Toggle's ON knob uses t.inverse, which is #FFFFFF in light — 1.30:1 on the lime track, making an ON switch LESS legible than an OFF one. Spec 3.1 defines `inverse` as "text on accent/white fills"; on a lime fill the correct knob is always dark. Pin it to DARK.bg in both themes. — Cost if wrong: none; the dark knob is correct on lime in either theme.

### 40. Ruling F-4: fix I1 (numeric heroes lack spelled-out a11y labels on 6 of 7 screens). Spec 10.1 calls this non-negotiable and names this exact case: "42.6 L is announced poorly by default". Only Wallet complies, by accident of its Pressable wrapper.

### 41. Ruling F-5: fix I5 (90-day window encoded in 4 places, DAY in 4, toCents twice). Spec 8.1 explicitly anticipates the window changing; today that is a 4-site edit where missing one makes the ledger's expiry dates disagree with the lots, silently.

### 42. Ruling F-6: fix I4 (seed's 4 published figures asserted only as "> 20"). Spec 10 requires exact assertions. Without them the seed can drift off 4.3 with a green suite.

### 43. Ruling F-7: fix I2's Settings half (row hardcodes "Trial"), plus the lapsed Top up branch spec 9.3 requires. NOT gating the card or balance — 9.3 is explicit that litres already bought are the user's property.

### 44. Ruling F-8: fix I3 (cardFill has no UI trigger). Goal 2.3 and 1.1 say this artifact exists to validate the redemption flow; it currently cannot demonstrate one. A debug-styled simulate-fill on the Card screen exercises normaliseDescriptor, resolveZone, deriveLitres, FIFO, the dispute flow and fill/[id] end to end.

### 45. Ruling F-9: fix the three "fix soon" deferred minors — non-positive litre guard in lots.ts, the bare catch in cardFill, and pricePointOn to kill the last price-lookup duplicate.

### 46. ★ Ruling F-10 (adjudicating the re-review's one residual): the SIMULATE A FILL debug control is content-distinct — it sits under a "Debug — prototype only" section label with an explanatory caption — but uses the same secondary Button styling as FREEZE CARD above it. The reviewer asked whether that satisfies "clearly debug-styled". Decision: accept as-is. Giving it a visually distinct treatment means either a new Button variant or a new colour, and spec 3.1 forbids introducing colours without amending it. The design's whole character is that two accents carry all meaning; spending one on a control that is deleted before any real build would cost more discipline than it buys. The section label and caption make it unmistakable in context. — Cost if wrong: someone screenshots the Card screen for a deck and the debug button is in frame. Mitigated by the label directly above it saying "Debug — prototype only".

---

## Decisions after the autonomous build

### 47. Official Barrel mark: flat droplet in the UI, full artwork in the icon set
The project owner supplied `Barrel_Logo.svg` as the official mark. It is a different
silhouette from the canvas placeholder the build shipped (a filled square with a droplet
knocked out) — a standalone droplet with a white crescent highlight — and it is two-tone,
which the single-`color` `BarrelMark` API cannot express.

Measured at true size, the crescent reads at 30px, is marginal at 17px and is gone by
14px; it is 3.9% of the mark's area. The app draws the mark only at 17px and 14px, so it
would never render. Forcing it would also break dark mode: the crescent is a literal
`#FFFFFF`, so on a `t.text`-tinted droplet it vanishes on black, and keeping it visible
needs a `react-native-svg` knockout mask plus a second colour prop — a rendering
dependency and an API change bought for a detail no screen can show.

Decision: `BarrelMark` carries the droplet outline alone, verbatim from the source file
(so it diffs against the artwork) on a `297 0 948 1500` viewBox trimmed to its bounds,
with `size` setting height and width derived from the 0.632 aspect. The full two-tone
artwork generates the icon set at 1024px, where the crescent reads. This also replaces
the Expo template defaults the app was still shipping — `icon.png` was the blue Expo
chevron.
— Cost if wrong: one path swap and a regenerated icon set. If the crescent is wanted
in-app, the escalation is a mask plus a `bgColor` prop, and the mark should be drawn
larger than 17px for it to be worth having.
