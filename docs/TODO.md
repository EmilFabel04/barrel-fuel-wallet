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
      200; a nonexistent username 404s). **Waiting on the branch `launch-wiring`, not
      merged**, because merging it to `main` would auto-deploy a working form while
      `/privacy` still names nobody — see the item below. Do not rename the Buttondown
      account: the username is the entire endpoint the form posts to.
- [ ] **Register the entity, or decide to trade personally, and fill in `ENTITY`** —
      `web/data/entity.ts`, both `name` and `address`. `/privacy` needs a responsible
      party for POPIA s18(1)(b); `/terms` needs to say whose terms they are. Second build
      gate.
- [ ] **Put MX records on `getbarrel.co.za`.** Checked 2026-09-10: the domain resolves
      (GoDaddy nameservers, parked A records) but publishes **no MX record at all**, so
      `hello@getbarrel.co.za` refuses mail. Every right in the privacy policy — access,
      correction, deletion, objection — and the unsubscribe fallback route to that one
      address, and the footer publishes it on every page. No automated check can see this.
- [x] ~~**Create the Vercel project**~~ and ~~**point the domain at it**~~ — both done.
      `getbarrel.co.za` serves from Vercel and redirects to `www.`.
- [ ] **Change the Vercel build command to `npm run verify`.** `web/vercel.json` on the
      `launch-wiring` branch does this. It matters: the project was deployed with the
      default `next build`, which never runs `check.mjs`, so the site went live on
      2026-09-13 with all three `__SET_BEFORE_LAUNCH__` placeholders rendered on public
      pages — a form posting to a nonexistent endpoint, and both legal pages naming
      nobody. The gate was correct and nothing was calling it.
- [ ] **Set the two Buttondown dashboard toggles.** The account now exists; none of
      these have been touched yet:
      - Open and click tracking stay **off**. `/privacy` promises the launch email carries
        neither, in writing. Turning either on makes the policy false, and the policy has
        to change first.
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
