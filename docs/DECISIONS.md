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

### 48. Two caps, renamed and resized: 500 L monthly top-up, 110 L weekly redemption
The project owner clarified that the build's single `MONTHLY_CAP_LITRES = 150` was wrong
on both count and value. Checked against the code first: there was no daily cap and no
redemption cap of any kind — grepping `src/`, `app/` and `docs/` for `110`, `daily`,
`per day` or `DAILY_REDEMPTION` returned nothing. The one cap present was unambiguously a
top-up cap (`litresThisMonth` filters `kind === 'topup'`, with a test asserting bonuses
are excluded), and `withinCap` was called only from `topUp`. So the instruction to "fix
the reset cadence, not just the label" had no cadence to fix: the monthly cap needed
resizing, and the weekly cap needed building.

Decision: `MONTHLY_TOPUP_CAP_L = 500` and `WEEKLY_REDEMPTION_CAP_L = 110`, with the
top-up helpers renamed (`topUpCapRemaining`, `withinTopUpCap`) so neither cap can be
reached in place of the other.
— Cost if wrong: the constants are one-line edits; the naming is the part that would be
expensive to undo later, and it is the part guarding against conflation.

### 49. The redemption window rolls rather than resetting weekly
The owner asked for a "weekly cap and weekly reset", but stated its purpose as blunting
bulk-resale. Those conflict: a calendar reset lets the full cap be spent on the last day
of one week and again on the first day of the next — double the limit inside hours, which
is the exact pattern being defended against. Raised it, and the owner chose a rolling
7-day window. `litresRedeemedSince` counts fills over `(at − 7 days, at]`, so a fill
exactly one window old has aged out and a future-dated entry cannot consume cap early.

Also guarded a naming hazard: `REDEMPTION_CAP_WINDOW_DAYS` (7) sits alongside
`REDEMPTION_DAYS` (90) in `lib/window.ts`, which is a litre's price-lock life. A test
pins them apart so neither can be quietly pointed at the other.
— Cost if wrong: a calendar-week variant is a small change to one function, and the tests
that pin the boundary would catch the switch.

### 50. A cap breach declines the card, which spec §11 permits
§11 says "never fail the card at the pump", and `cardFill`'s existing guards all fail open
for that reason. A rate limit is a different thing: §11 governs *attribution* — a driver
must not be punished because a merchant descriptor could not be parsed — whereas a cap is
a known, intended refusal. It is recorded in `lastCardFillError`, satisfying §11's other
half, "never fail silently on price".

Follow-on the owner's instruction implies but did not name: the Card screen quoted
`balance × price` as spending power. With a redemption cap that becomes a false claim —
the card would advertise litres it is about to decline, the same defect class as rulings
29, 34 and 37. Spending power is now `min(balance, cap remaining)`, with a second line
naming the cap only when it is the binding constraint.
— Cost if wrong: if the cap should never surface to the customer, the caption is one
conditional to delete; the derived figure should stay regardless.

### 51. Ruling C3 withdrawn; the seed's cap meter is left honest
C3 lowered the Top up keypad default from the design's R1 500 to R500 because 150 L minus
the seed's 105.2 L left only 44.8 L (~R980), so the screen opened already disabled. At
500 L the headroom is 394.8 L (~R8 630) and that no longer happens, so the design's
R1 500 is restored and the workaround is gone.

The same change costs a demo state: §4.2 chose 105.2 L partly because it filled 70% of a
150 L cap, and against 500 L the meter reads 21%. Not fixed. 105.2 L falls out of the
§4.2 ledger chain terminating at 42.6 L, so it cannot move without breaking the published
balance — and retuning data to flatter a screen is the error §4.3 exists to prevent.
Reported rather than engineered around.
— Cost if wrong: the Top up meter looks emptier than it did. If that matters the fix is
the meter's framing, not the seed.

### 52. Figtree replaces Outfit; DM Sans rejected on a silent numeral defect
The owner asked for a smoother, more elegant face "like Google Sans". Google Sans is
Google's proprietary brand typeface — not on Google Fonts, not licensable in a third-party
product — so this was a closest-open-equivalent choice, and the owner picked DM Sans.

Measured before adopting it: **DM Sans ships no `tnum` OpenType feature.** Every other
candidate (Figtree, Inter, Manrope, Plus Jakarta Sans) has it. Without `tnum` the
`fontVariant: ['tabular-nums']` this design relies on becomes a no-op React Native ignores
silently, and DM Sans has the least uniform digits of the set — its `1` is 52% the width
of its `0`, which at the 92px Wallet hero is a ~34px shift per digit and worst on the Top
up keypad where the value changes on every keypress. Put the measurement to the owner, who
switched to Figtree.

Same class of trap as Ruling T89-c (`fontWeight` against a fixed family): an unsupported
font feature fails by doing nothing. Recorded in the spec and the handover as a check to
run before any future family swap.
— Cost if wrong: Figtree reads slightly rounder than DM Sans. The swap is a 1:1 family
rename across 16 files if the owner prefers the other trade.

### 53. Rounded and soft — with elevation as a light-mode-only affordance
The owner asked for rounded elements and accepted shadows, retiring §3.3's flat rule. Radii
come from one five-step scale in `tokens.ts` rather than per-screen numbers.

The part that needed a ruling: **a shadow is invisible in dark mode.** `DARK.bg` is
`#000000` and a shadow is a dark blur, so shipping one would repeat Ruling C1's defect in
mirror image — correct in the theme you are looking at, absent in the other. Dark mode does
not need it either: every surface taking elevation is one that would otherwise be
white-on-white in light mode, and in dark each is already separated by luminance. So
`useElevation()` resolves to a real shadow in light and a zeroed style in dark; callers
spread it unconditionally and never branch on the theme. A test pins the dark set to zero,
because the failure is silent.

**Ruling C1113-c is withdrawn as a consequence.** It escalated the card pass's border to
the heavy `PASS.strataA` only because a white card on a white ground had no edge and
shadows were banned. The shadow does that job properly now, so the border relaxes back to
`PASS.hairline`. Verified in the browser in both themes.
— Cost if wrong: if dark mode should carry depth too, the answer is a raised surface fill
(`bgRaised` exists for it), not a shadow.

### 54. Stations deleted; its one load-bearing line moved to the Wallet
The owner removed the Stations tab: v1 partners with no stations and the card runs on
Mastercard/Visa rails at any terminal. Checked whether the screen still earned its place
on its own terms — it did not. §4.1 had already stripped the per-station price column
(regulated petrol cannot vary inside a zone) and maps are a stated non-goal, leaving a
static list of five hardcoded stations with no price, no map and no interaction. Google
Maps does that better and every driver has it.

Its one load-bearing element was §9.5's zone-price statement — the only place the product
explains *why* a station-agnostic card is possible. That line moves to the Wallet's
price-watch block, which already states the price and the next change.

**`src/data/stations.ts` stays.** It is not a partner list: it is the lookup behind
`normaliseDescriptor` and `resolveZone`, which is §11 phase-2 instrumentation and the unit
a rebate would eventually be priced in. Deleting the screen deletes a screen.

Tab bar goes five to four. Card had the centre position *and* the accent; four tabs have no
centre, so the accent carries it alone and Card sits second.
— Cost if wrong: the screen is one file and one TABS entry to restore, and the station data
never left.

### 55. The Wallet's "last fill" derived from the ledger
The Wallet's footer read `Last fill · Shell Grayston` and `−38.0 L` as JSX literals. They
matched the seed, so every review compared them against a correct-looking screen — the
same reason the `+0.55%` and `02 Oct` literals survived (rulings 29 and 34). They went
stale the moment any fill was recorded, which `SIMULATE A FILL` makes reachable in two
taps: the Wallet kept claiming Shell Grayston while the ledger showed something else.

Both now come from `selectLastFill`, a store selector rather than inline screen logic, so
the rule holds where the handover says logic belongs and the behaviour is testable. It
picks by date rather than array position — the seed happens to append chronologically and
the store appends at the end, but neither is guaranteed — and breaks same-day ties toward
the later entry, which matters because every store-created fill is dated `TODAY`, so a
second simulated fill shares its date with the first.

The station name resolves through `stationId` against `STATIONS`, falling back to the raw
`merchantDescriptor`. Descriptors arrive shouty off the rail (`ASTRON ENERGY FOURWAYS`),
and the fallback matters because spec §11 requires an unattributed fill to remain a
first-class entry rather than render blank.
— Cost if wrong: an unmatched merchant shows its raw descriptor in the Wallet footer,
which is honest but ugly. The alternative — hiding the row — would hide a real fill.

### 56. The app clock moved out of the seed, and stayed pinned
`TODAY` was a `const` exported from `src/data/seed.ts` and imported by the store and six
screens. Wrong home twice over: a seed is fixture data, not the app's sense of time, and a
`const` cannot be swapped for a test or a real clock without editing every caller.

`src/lib/clock.ts` now owns it — `DEMO_NOW`, `now()`, `setClock()`, `resetClock()`. Worth
recording what did *not* need to change: `src/lib` and `src/data` were already clean, since
every date-sensitive function there takes an explicit `at: Date`. The coupling was entirely
in the layer above, which is the argument for that boundary having been drawn where it was.

Callers now hoist a single `const at = now()` per action or render rather than calling the
function repeatedly. With a fixed clock that is cosmetic; with a real one it stops a single
render or a single `topUp` from straddling a date boundary and disagreeing with itself
about the price, the cap window, and a lot's expiry.

**The clock stays pinned to the demo instant, and that is the decision, not an oversight.**
Switching to real time is `setClock(() => new Date())` — one line — but the seed is dated
absolutely and does not survive it: some ledger entries are already future-dated against
today's real date, the cap meter empties on 1 Oct 2026, `nextPriceChange` runs out after
7 Oct 2026, and the last lot expires 27 Dec 2026, taking the balance to zero on three
screens. Making the seed relative to `now()` is a product decision about whether this is a
pinned demo or a self-refreshing one, and it deserves its own pass rather than arriving as
a side effect of moving a constant.

Two latent bugs fixed while in here, both named in the handover as what "breaks quietly"
on the way to a real clock:
- `monthlySavings` bucketed on `getMonth()` with no year, so a fill in September of any
  later year would have been added to September 2026's bar, and the window never advanced
  past September. It now takes `at` and returns the six months ending there, year-aware.
  Against the demo instant it returns exactly the same six months, so no published figure
  moved.
- The price table's forward boundary was untested. `priceOn` throws before the table
  starts — loud — but after it ends silently returns the last known price forever, which
  is the direction a real clock travels. Both boundaries are now pinned by tests. The
  table is not extended: that means adding real DMPR figures, not inventing them.
— Cost if wrong: none identified. The refactor is behaviour-preserving and verified as
such — every screen renders identically and all eleven pinned figures are unmoved.

### 57. Press feedback and transitions, within spec §12's one-library limit
Audited before changing anything: there was **no press feedback and no animation anywhere**.
All 26 `Pressable`s fired haptics and moved nothing — a tap you could feel and not see —
and both navigators ran on unconfigured defaults.

Spec §12 permits React Native's own `Animated` and no other animation library, so nothing
was added. `src/theme/motion.ts` holds the durations and amounts in one place, pinned by
tests, so motion is tuned as a system rather than per screen.

Everything animated is `opacity` or `transform`, the two the native driver can carry, so a
press never lands on the JS thread. That is why the Toggle's track colour switches instantly
while its knob slides: `backgroundColor` cannot run on the native driver, and animating it
would move every toggle press onto the JS thread to smooth a change the knob already sells.

Two things fell out of the audit rather than being invented:
- Spec §3.1 already defines `surface` as "keypad grid gaps, **pressed states**". The pressed
  colour was in the design system and had never been wired up. Keys now use it, as an
  instant swap — a held key should look held, and it makes the pressed key match the grid
  lines around it, so it reads as recessed rather than tinted.
- Only rows that navigate get a pressed state. A static Settings row or a top-up ledger row
  lighting up would promise a destination that does not exist.

Large surfaces (the balance hero, the price-watch block) dim without scaling: a 92px hero
that shrinks under the thumb reads as a button, and it is a tappable region.
— Cost if wrong: every number is in one file. Halve them for less motion, or set the
durations to 0 to remove it entirely.

### 58. `<Screen>` now scrolls by default — it was clipping content with no way to reach it
Reported from the device: text cut off at the bottom. Two compounding defects.

`Screen` had a `scroll` prop that **no screen passed**, so every screen was a fixed `View`
that clipped. And it would not have worked if passed: the gutter was on `style` instead of
`contentContainerStyle` (which pads the scroll viewport and clips the content's own edges),
and without `flexGrow: 1` the `marginTop: 'auto'` footers seven screens rely on would have
collapsed to the top.

The Card screen's content is roughly 830pt against about 710pt of usable height on a
390x844 phone, so its debug caption and part of the button above it were simply
unreachable. Verified before and after in a browser.

Decision: scroll by DEFAULT, not opt-in. A screen that never overflows loses nothing by
being scrollable; one that does is broken without it. Opting in would have left the next
screen to rediscover this. `flexGrow: 1` is what makes one prop serve both cases — short
content still fills the viewport so footers stay pinned, long content scrolls.

`balance.tsx` and `settings.tsx` pass `scroll={false}`: they own their own ScrollView, and
two on the same axis fight for the gesture. Balance in particular wants a fixed hero, a
scrolling ledger between, and a pinned CTA — which is what it still does.
— Cost if wrong: a screen that fits exactly can now be dragged a few points. The
alternative is content nobody can reach.

---

# Pump redesign — 2026-09-09

**Spec:** `docs/superpowers/specs/2026-09-09-barrel-pump-redesign-design.md`
**Plan:** `docs/superpowers/plans/2026-09-09-barrel-pump-redesign.md`
**Branch:** `pump-redesign`

These were made with the project owner present, choosing between options at each step.
The ones that change what the product says to a customer are marked ★.

---

### Pump: the visual direction

Chosen over an editorial/"statement" direction (paper ground, serif numerals) and a soft
material fintech one (floating cards, gradients, glow). Pump commits to what the product
actually is: monospaced numerals off a fuel-pump readout, amber on warm near-black,
bordered panels, tight corners.

It wins because it is *earned* — the seeds were already in the app (the amber accent, the
barrel mark, the grey strata under the card pass) — and because no other South African
fintech looks like it. The material direction was the safest to build and the most
familiar, which is the argument against it.
— Cost if wrong: a distinctive app that some people dislike, rather than a competent one
nobody remembers. Recoverable — the discipline underneath (one hex file, fill/text pairs,
no theme branching in screens) is direction-agnostic.

### ★ Light mode is BRIGHT, and amber becomes a fill

The first attempt gave light mode a warm concrete ground (`#EDE9E1`) and a muted burnt
amber for text. The owner rejected it: "the faint colours won't be seen easy in daylight."

That is the correct read, and it matters more than a normal theme question — this app is
opened standing at a pump, outdoors. Glare adds a flat white veil that lifts blacks and
crushes mid-luminance colour, and it can only ever *add* light. So the brighter the ground,
the more of the contrast range survives it: white at full panel output beats an off-white
at ~82%.

The consequence is that **amber stops being a text colour in light mode**. You cannot have
an orange that is both luminous and high-contrast on white — those are opposites. So amber
becomes a *fill with ink set on it* at 7.3:1 (the price badge, the gauge, the meter, the
primary button), which is road-sign logic, and `accentText` `#9A3200` carries the small ▲
delta glyphs where a filled block would be absurd. Every light-mode text token is held to
**AAA (≥7:1)**, not the 4.5:1 AA floor, because under a veil AA is not enough.

This also pays off the `#A8A8A8` at 2.38:1 accessibility debt the previous handover had
recorded as accepted.
— Cost if wrong: a starker light mode than the original design intended. The judgement it
rests on can only be made on a phone, outdoors.

### `tokens.test.ts` measures contrast, so the palette enforces itself

A whole design decision now rests on measured ratios, and a review cannot be relied on to
re-measure them. The test computes WCAG relative luminance for every text token against its
own theme's ground and asserts AAA in light, AA in dark, plus the 3:1 non-text minimum for
borders.
— Cost if wrong: none identified. It caught two things immediately.

### `DARK.border` was raised to `#635C53` to meet 3:1

The first draft of the contrast test let dark borders off at 1.4:1 — which was the
assertion being written around a value already chosen, rather than the value being held to
a standard. In dark mode `bgRaised` sits almost on top of `bg` and elevation is
deliberately absent, so a panel's border carries nearly all of its definition; at 1.4:1 a
panel is barely distinguishable from the screen behind it.
— Cost if wrong: panel outlines are more present in dark than a minimal reading would
want. The alternative is panels that are not visibly panels.

### `LIGHT.positive` changes value, overturning an earlier ruling

The earlier ruling kept `LIGHT.positive` at `#C6F24E` on the reasoning that a fill's
contrast is "against neighbouring fills rather than through the colour to a background."
At 1.295:1 against white — measured, not estimated — that is too generous: a lime bar on a
white chart ground is genuinely hard to locate. It is now `#7A9000` (3.6:1).
— Cost if wrong: light-mode chart bars are more olive than lime. `DARK.positive` is
unchanged, so the app's signature colour is intact where it is most often seen.

### `heroInk` is a token, not a branch

A numeric hero cannot be amber on white and stay legible. Rather than branch on the theme
inside a screen, the hero's colour became its own token: amber at night, ink in daylight.
— Cost if wrong: one more token to keep in step. The alternative reopens theme branching
in screens, which this round otherwise eliminated entirely.

### JetBrains Mono for numerals, retiring the `tnum` constraint

A pump readout is monospaced, and monospaced digits *cannot* change width — so the
`fontVariant: ['tabular-nums']` dependency that disqualified DM Sans no longer constrains
the numeral family at all. `Num` is deleted rather than left alongside `Readout`: two
definitions of "a number on screen" is exactly the duplication this codebase keeps ruling
against.

The trap this creates: `SectionLabel` moved off system Menlo onto the same mono, which
makes it a *custom* family, so the never-set-`fontWeight` rule applies to it for the first
time. Its old `fontWeight: '600'` was only ever correct because Menlo is a system font.
— Cost if wrong: a second font family to load. Numerals can no longer jitter, which was
the risk the old constraint existed to manage.

### ★ The seed is re-cut to a laddered wallet

The old chain drained FIFO until a single lot survived. That starved two of the four
features chosen this round: a timeline of one band is not a timeline, and locked-in value
came to exactly R0.00 because the sole survivor had been bought at that day's price.

One entry fixes it — a single R984 top-up on 8 July, 46.0 L at R21.40, someone buying ahead
of an expected rise. That is the product's own mechanic, visible in its own data, and it
leaves five lots standing at three prices with 12.0 L expiring in six days.

Every figure in the resulting table was computed from the model before it was written down,
and the plan forbids carrying any of them over by hand if the seed is tuned again.
— Cost if wrong: two accepted regressions. September top-ups fall from 105.2 L to 18.6 L,
so the cap meter reads emptier; and the weekly redemption cap is no longer the binding
constraint on the Card, so that line does not render. Both are structural — bigger
September top-ups survive as large September lots, pushing the balance to ~130 L, three
tanks rather than one. A one-tank balance is the truer product shape.

### The store's cap tests were silently passing for the wrong reason

Found while re-pinning. The weekly-cap tests asserted that a fill was *declined*, but
relied on the seed happening to leave only 40.6 L of headroom to make it so. The moment the
seed changed, the fill simply succeeded — and the assertions still passed, because they
checked the ledger length against a `before` captured in the same state. They now construct
the binding state themselves.
— Cost if wrong: none. A behaviour test that depends on fixture arithmetic is not testing
the behaviour.

### ★ Savings names its own decline

The chart shows the edge per litre running 0.90 → 1.80 → 1.40 → 1.00 → 0.30 → 0.47, and a
panel says so in words rather than letting it pass unremarked. A savings screen that only
ever goes up reads as marketing; one that names its own decline reads as an instrument —
and it is what creates the reason to act on the next scheduled rise.
— Cost if wrong: a demo that admits a number went down. The owner chose this explicitly
over a neutral chart with no callout.

### ★ "Locked in below today's price" cannot be the Savings headline

The previous handover proposed "R2,590 of fuel locked in below today's price" as a stronger
framing than the realised figure. Measured against the model it is **R8.34**, and the
90-day window caps it near R20 on a one-tank balance — the product sells price certainty,
not accumulated profit. It survives as a forward-looking line on Your litres, tied to the
next rise, and Savings leads with the realised figure explicitly labelled as such.
— Cost if wrong: a thinner headline than the product would like. The alternative is a
number that is off by two orders of magnitude.

### The clock stays pinned; "live" means scripted

`setClock(() => new Date())` guts the app: the price table silently returns October's price
forever after 7 Oct, the cap meter empties on 1 Oct, and the last lot expires the balance to
zero on 27 Dec. The arriving-fill demo is therefore scheduled against `DEMO_NOW`, and calls
the real `cardFill` action so nothing below the store is faked. A test pins that the
arriving fill is dated the demo instant.
— Cost if wrong: none. Making the seed relative to real time remains separate work.

### The Wallet's second footer button becomes contextual

`CARD` sat next to `TOP UP` while Card was already tab 2 — a full button slot spent on
navigation one tap away, and it squeezed the primary action. It now reads `HISTORY`, or
`BEAT +Nc` inside the fourteen days before a rise.
— Cost if wrong: a button whose label changes. The window is derived from the price table,
and it falls back to `HISTORY` whenever `priceRise` returns null — which is what happens
past the end of that table.

### Balance and History split by what they answer

Balance became "Your litres" and lost the ledger entirely: it answers *what do I have*
(hero, expiry gauge, per-lot runways, locked-in value). History answers *what happened*
(every entry, filterable, with a saving on each fill). Neither renders the other's content.
— Cost if wrong: one more screen in the stack. Merging them buries the timeline above a
long list, which is what made both features compete in the first place.

### Screens no longer branch on the theme, with one deliberate exception

The Wallet's price block used to invert to a black card in light mode — the single place
the theme was not a mechanical token swap. It is gone, along with `useIsLight()`, the
`DARK.*` pins and the conditional style object.

`useIsLight` survives for exactly one caller: `Button.tsx`. Neither amber value reaches 3:1
against white, so a filled button's *edge* is undefined in light mode. That is a luminance
relationship between two tokens rather than a colour, so no token pair can express it, and
an ink border is the honest fix.
— Cost if wrong: one hook with one caller. Scoped to the primary variant only — the white
variant is ink-on-white at 21:1 and needs no help.

---

## Decisions during the persistence work (9 September 2026)

The first of the foundational pieces: the wallet now survives a reload.

### AsyncStorage rather than MMKV

MMKV is faster and its synchronous API would have avoided the hydration gate entirely. It
also requires a native build, and `app.json` has no bundle identifier and no EAS config —
this project runs in Expo Go. Making the *first* foundational change the one that forces a
native build would have put a toolchain migration in front of a two-file feature.
— Cost if wrong: a storage swap behind `walletStorage`. Nothing outside `persist.ts` names
AsyncStorage, and the middleware's interface is the same either way.

### Dates are tagged, not sniffed

The model is full of `Date` and JSON turns every one into a string, after which every
comparison silently returns the wrong answer. Three options: change the model to ISO strings
(invasive — it touches all 260 existing tests), revive any string matching an ISO shape, or
tag dates explicitly as `{"__d": "…"}` at the storage boundary.

The sniffer was rejected: `LedgerEntry.detail` is free text and `merchantDescriptor` comes
off the rail unsanitised, so a string that happens to look like a date would eventually be
revived into a `Date` and break something far from here. Tagging costs a few bytes and
cannot misfire.
— Cost if wrong: stored wallets become unreadable, which `migrate` already handles by
discarding them.

### `arrivedFillId` and `lastCardFillError` are not persisted

Both describe a moment rather than a state. A persisted `arrivedFillId` would pop the
arrival banner on a cold start for a fill the user acknowledged days ago, and a persisted
decline reason would outlive the session that caused it.
— Cost if wrong: an arrival missed across a crash, which the ledger still records.

### An unrecognised version is discarded, not migrated

`migrate` returns `undefined` for anything not written by the current version, which leaves
zustand's merge with nothing to apply and the store keeps its seed. There is no version 2
yet, so there is nothing to translate — but the hook has to exist before the shape changes,
not after.
— Cost if wrong: a user loses a wallet on an upgrade that should have been translatable.
The alternative — adopting a shape the code cannot read — fails later and less legibly.

### Hydration joins the font gate rather than getting its own

`app/_layout.tsx` already returned `null` until fonts loaded. Reading storage is a second
asynchronous precondition with the same answer, so it became a second clause rather than a
second pattern. Painting the seed and swapping to the persisted wallet a frame later is
worse than one slightly longer hold.
— Cost if wrong: cold start is as long as the slower of two reads. GAPS 3.2 already wanted
a skeleton here; this makes that want slightly louder without changing its shape.

### ★ `RESET DEMO DATA`, shipped in the same change

Persistence takes away the clean slate every run used to start from: a demo spent down —
or wedged — now stays that way. Without a way back, this change would have made the
prototype *harder* to demo. It sits with the other prototype-only affordances in Settings,
and deliberately keeps `appearance`, which is a preference the user set rather than part of
the demo's data.
— Cost if wrong: a destructive one-tap control with no confirmation, recorded in GAPS 2.5.

---

## Decisions during the session seam (9 September 2026)

A sign-in that is a stub in exactly one place — the code check — and real everywhere else,
so that replacing it later replaces a transport rather than a design.

### The session is its own store, not a slice of the wallet

The wallet is data and the session is access. They have different lifetimes, different
storage keys, and `resetDemo` throws away the first without touching the second. Folded
together, resetting the demo would have ejected the user from the app — a Settings button
that says nothing about signing out, signing you out.
— Cost if wrong: two stores to hydrate instead of one, which the root layout already had to
wait on anyway.

### Signed in is derived, and a half-finished sign-in never reaches the store

State is `phone` and `signedInAt`; `selectIsSignedIn` is `signedInAt !== null`. There is no
`status` enum that can disagree with the identity, and no `'awaiting-code'` to be persisted
and hydrated back into. The number travels between the two screens as a route param
instead.
— Cost if wrong: a reload mid-sign-in loses the number and starts over, which the code
screen handles by redirecting rather than showing a screen with nothing to confirm.

### `Stack.Protected` rather than a redirect effect

expo-router 57 has a declarative guard, so protected routes simply do not exist while the
guard is false. The usual alternative — `useSegments` with a `router.replace` in an effect —
mounts the wrong screen first and navigates away from it, which is a visible frame and a
race with hydration.
— Cost if wrong: an expo-router API rather than one written here. Verified working: a cold
start while signed out lands on `/sign-in` without an unmatched-route screen.

### The gate waits on both stores, not just the wallet

Deciding the guard before the *session* has hydrated would show a signed-in user the
sign-in screen for a frame and then navigate away from it — the exact flicker the
declarative guard was chosen to avoid.
— Cost if wrong: cold start is as long as the slower of two reads.

### The Keypad's rand-shaped assumptions became parameters

It capped input at seven characters and dropped a leading zero, both correct for an amount
and both wrong for a phone number — the second silently ate the first digit of every South
African mobile number. `maxLength` and `allowLeadingZero` default to the old behaviour, so
Top up is untouched.
— Cost if wrong: two props on one component. The alternative was a second keypad.

### ★ Signing out keeps the wallet on the device

Sign-out ends the session and leaves the lots and ledger on disk, and the confirmation says
so. This is a prototype compromise, recorded as such: with no server there is nothing to
restore from, so clearing local data would destroy the wallet permanently rather than
merely sign the user out. In production, with a server behind it, clearing on sign-out is
the correct behaviour on a shared device.
— Cost if wrong: a device that has been signed out still holds the previous user's wallet.
Acceptable only because no real money or identity is behind it yet.

### Sign out is confirmed, and on web that confirmation does nothing

Wiring up an inert button with a one-tap action would have closed GAPS 3.1 by opening
GAPS 2.5, so it asks first. It asks with `Alert.alert`, which react-native-web implements
as an empty method — so on web the button is still inert, silently. iOS and Android, the
real targets, are correct.
— Cost if wrong: a browser demo has a dead sign-out. Recorded in GAPS 3.1. The fix is a
confirmation built from the app's own components, which needs a modal pattern the design
system does not have yet.
