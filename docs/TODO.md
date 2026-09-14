# Barrel — what to do next

The actionable list, ordered by what blocks what. It is not a second copy of
`GAPS.md`: that file is the detailed record of what is missing in the app and stays the
place to read *why*. This file is the short answer to "what do I pick up now".

Website items were verified on 2026-09-10 in the session that wrote them; app items are
pointers into `GAPS.md`.

---

## 1. The website, before it can go live

Nobody but the site owner can clear the first three. `web/` is built and verified but
**not deployed**, and `npm run verify` deliberately fails on two of these until they are
done — see the *Not deployed* section of `HANDOVER.md`.

- [x] ~~**Create the Buttondown account and set `LIST_ID`**~~ — done 2026-09-13. The
      username is `barrelza`, verified live that day (`buttondown.com/barrelza` returns
      200; a nonexistent username 404s). Live on `main`. Do not rename the Buttondown
      account: the username is the entire endpoint the form posts to, so a rename would
      break every submission silently.
- [ ] **Register the entity and fill in `ENTITY`** — `web/data/entity.ts`: set
      `registered: true` and fill both `name` and `address`. Nothing else needs changing;
      both legal pages switch over on their own.

      **This no longer blocks the build.** On 2026-09-13 the site owner decided to open
      the waitlist before the entity exists, on the grounds that the site says throughout
      that Barrel is still being built. Both pages now state the gap in plain words
      instead of printing a placeholder, and `check.mjs` warns on every build rather than
      failing. The POPIA gap is real and still open: clear it before Barrel sells
      anything, and before the first email goes out to the list.
- [ ] **Put MX records on `getbarrel.co.za`.** Re-checked 2026-09-13, still none — and
      now more urgent, because the waitlist is open and the policy is live. The domain
      resolves (Vercel) but publishes **no MX record at all**, so
      `hello@getbarrel.co.za` refuses mail. Every right in the privacy policy — access,
      correction, deletion, objection — and the unsubscribe fallback route to that one
      address, and the footer publishes it on every page. No automated check can see this.
- [x] ~~**Create the Vercel project**~~ and ~~**point the domain at it**~~ — both done.
      `getbarrel.co.za` serves from Vercel and redirects to `www.`.
- [x] ~~**Make `check.mjs` run on Vercel.**~~ Done, via a `postbuild` script in
      `web/package.json` rather than a `vercel.json` build-command override. It mattered:
      the project was deployed with the default `next build`, which never runs
      `check.mjs`, so the site went live on 2026-09-13 with all three
      `__SET_BEFORE_LAUNCH__` placeholders rendered on public pages — a form posting to a
      nonexistent endpoint, and both legal pages naming nobody. The gate was correct and
      nothing was calling it.

      **Do not reintroduce `web/vercel.json`.** Deploys succeeded before it existed and
      failed on both builds after it was added, including once with a non-fatal gate —
      which rules the gate itself out as the cause and points at the config override
      (`buildCommand` plus `outputDirectory` against Vercel's Next.js preset). `postbuild`
      needs no Vercel configuration at all: npm runs it after `build` on its own, so the
      gate rides inside whatever build Vercel already knew how to run.
- [ ] **Make the gate fatal again.** `postbuild` currently ends in
      `|| echo CHECK_MJS_FAILED_SEE_ABOVE`, so the gate runs and prints but does not fail
      the deploy. Deliberate and temporary, from 2026-09-14: the first Vercel build with a
      fatal gate exited 1 and that failure **could not be reproduced locally** — clean
      cacheless build, fresh clone and fresh `npm install` all pass. The non-fatal form
      exists to get `check.mjs`'s own output into the build log, which is the one place
      the failing rule will name itself. Search a build log for
      `CHECK_MJS_FAILED_SEE_ABOVE`; the failure lines sit immediately above it. If the
      marker never appears, the gate passes on Vercel and this can go straight back to
      plain `node scripts/check.mjs`.

      Safe only because no `__SET_BEFORE_LAUNCH__` token remains in any source *value* —
      it survives in comments in `data/entity.ts` and `scripts/check.mjs` alone.
- [ ] **Decide the Buttondown welcome email.** Inspected the live account (`Barrel ZA`)
      on 2026-09-14. *Welcome email* — "send a welcome email when a subscriber confirms" —
      is **on**, and the site says the opposite: "We'll email you once, when Barrel
      launches. **Nothing else.** You'll get a confirmation email first." That promises
      exactly two emails and the welcome email is a third, undisclosed one. Either switch
      it off at Settings → Subscribing, or change the copy in `WaitlistForm.tsx` and
      `/privacy` to admit it. Left on deliberately on 2026-09-14 — the site owner chose to
      decide later — so the published promise is inaccurate until one of the two happens.

      State of the rest of that account, same inspection:
      - Open and click tracking are already **off** (Buttondown's defaults). `/privacy`
        promises the launch email carries neither, in writing, so leave them off. Turning
        either on makes the policy false, and the policy has to change first.
      - *UTM information* is **on**: it appends `utm_*` parameters to links in outgoing
        emails. Not open or click tracking, so it does not breach the policy — but the
        site runs no analytics, so nothing consumes them. Harmless, and pointless.
      - **The confirmation email cannot be customised on the current plan.** "Custom
        transactional emails is only available for accounts on the Standard plan or
        higher." Subscribers get Buttondown's default wording, and that wording is the
        POPIA consent record. Upgrading is the only way to change it.
      - Public subscriptions on, double opt-in on, subscriber cleanup on, and both
        post-subscribe redirects empty — so a subscriber lands on Buttondown's own page
        after submitting, not back on getbarrel.co.za.
      - Firewall is off by default (`docs.buttondown.com/firewall`). Switch it on if you
        want the extra spam screening; it is a dashboard setting, not a code change.

**Already closed, so nobody redoes it:** the privacy policy is complete against POPIA
s18 and s14; `/terms` is a full terms of use; the 390px and 1512px eye checks and the
built-output content read-through (plan Task 8, steps 3–4) have been run and pass.

## 2. The website, after it is live

- [ ] **Write the commercial terms — but only after the legal opinion.** `/terms` today
      covers site use and says explicitly that the product description binds nobody. Terms
      that purport to bind a buyer to a product that does not exist would be the first
      thing that opinion contradicts. Do not pre-empt it.
- [ ] **Decide who actually answers `hello@`.** The policy promises deletion and access
      requests will be honoured, with no form and no fee. That is a person's job, not a
      mailbox's.

## 3. The app

`GAPS.md` is the full record. Its own "if you only do five things" list, in order:

- [ ] **Build the expiry conversion** — `GAPS.md` 1.1 ⛔. The app makes a promise it does
      not keep, and it is the promise most likely to be examined.
- [ ] **Local notifications** for the expiry warning and the price alert — 2.6, 2.7. The
      one roadmap item needing no server, and it makes two existing promises true.
- [ ] **Give Top up a confirmation and a receipt** — 2.1 ⛔. It moves money and behaves
      like a toggle.
- [ ] **Handle the zero state on Wallet, Savings and Card** — 2.3. Every new user starts
      there.
- [ ] **Neutralise or label the inert controls** — 3.1. Four of them sit on the two
      screens you would demo first.

The remaining blocker-marked item, not in that five:

- [ ] **`cardFill` declines silently where it should queue** — 1.4 ⛔.

## 4. Gated, not forgotten

Scoped out on purpose. Listed so they are not rediscovered as oversights:

- Real payments, card issuing and KYC — gated on the legal opinion.
- A stations map or list — removed by an explicit nav decision.
- Anything that unpins the clock — `GAPS.md` 1.3. A product decision, not a task.
