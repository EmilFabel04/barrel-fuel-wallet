# Barrel — the backend

**Status:** design, not approved, nothing built
**Relationship to the app specs:** this adds a server behind the existing app. It does not
amend `2026-09-06-barrel-fuel-wallet-design.md` — the data model, guardrails and product
rules there still bind. It replaces the storage layer beneath them and moves two files'
worth of logic off the device.

**Scope chosen on 2026-09-13:** real accounts, a real database, the wallet on a server,
**no money moving**. Nothing in this document waits on the legal opinion.

---

## 0. Words used in this document

Written out because they get used as if everyone already agrees what they mean.

| Term | What it actually means here |
|---|---|
| **Postgres** | The database. A program that stores tables of data and answers questions about them. |
| **Transaction** | A group of database changes that either *all* happen or *none* do. If the power fails halfway, nothing is left half-done. |
| **Row lock** | While one transaction is changing a row, others that want the same row wait their turn instead of reading a value that is about to be wrong. |
| **RLS** (row-level security) | A rule stored *in the database* saying which rows a given user is allowed to see. Enforced by Postgres itself, so application code cannot forget it. |
| **Idempotency key** | A unique id the app attaches to an action. If the same key arrives twice, the server returns the first result instead of doing the work again. This is how a retry stops being a double-charge. |
| **Migration** | A numbered file describing a change to the database shape. Run in order, they build the schema from nothing — so every environment is identical and every change is reviewable. |
| **FIFO** | First in, first out. The oldest litres are used first. |
| **Lot** | One purchase of litres, carrying the price paid and its expiry date. A balance is the sum of surviving lots, not a number stored on its own. |
| **Monorepo / workspace** | One repository containing several projects that can share code, with tooling that understands they are separate. |
| **Edge Function** | A small piece of server code Supabase runs on demand. Nothing runs between requests. |
| **OTP** | One-time PIN. The six-digit code sent to sign in. |
| **Crypto-shredding** | Deleting someone's data by destroying the key it was encrypted with, rather than deleting rows. Used where records must survive for accounting but personal details must not. |
| **PITR** | Point-in-time recovery. Restoring the database to any chosen moment, not just last night's backup. |
| **CI** | Continuous integration. A robot that runs the tests on every push and refuses work that fails. |
| **Append-only** | Rows can be added but never edited or deleted. A correction is a new row. |
| **Cold start** | The delay when server code that has been idle has to start up before answering. |
| **POPIA** | South Africa's Protection of Personal Information Act. The local equivalent of GDPR. |

---

## 1. What this is, and what it is not

The app today is a complete, convincing wallet with nothing behind it. Both stores live on
the phone, the balance is seeded fiction, and signing in accepts any six digits.

This document describes replacing that with a real server, in stages, **without ever
building a stage that cannot be verified and stopped at.**

**It is not urgent, and the plan reflects that.** Each phase below leaves the app working.
None of them requires the next one to be started. If work stops after any phase, what
exists is coherent rather than half-migrated.

**Explicitly not in this document:** payments, card issuing, KYC, settlement, station
rebates. All gated on the legal opinion. Nothing here brings them closer or further away.

---

## 2. Decisions taken

| Decision | Choice | Why, in one line |
|---|---|---|
| Database | Supabase Postgres | Postgres with RLS, so "a user sees only their own litres" is a database rule, not a coding habit. |
| Region | Frankfurt (`eu-central-1`) | Neither Supabase nor Neon offers Cape Town. See §9.1. |
| Sign-in | WhatsApp OTP first, SMS fallback | Cheaper and more likely to arrive in South Africa. See §5.2. |
| Where the model runs | Split by mutation vs derivation | Two files change the wallet; ten only read it. See §4. |
| Money and litres | Integers everywhere | Floats cannot be trusted to reconcile. See §3.1. |
| Shared code | `packages/model`, pure TypeScript | It already has zero external imports, so this is a move, not a rewrite. |
| Ledger | Append-only | A financial record that can be edited is not a record. |
| Tokens on device | `expo-secure-store` | `AsyncStorage` is plaintext. See §6.1. |

### 2.1 Decisions deliberately deferred

- **What expiry converts to.** `GAPS.md` §1.1: three screens promise unused litres convert
  back to rand, and nothing implements it. Whether that is at the price paid or the pump
  price on the day, and whether the result is spendable or credit-only, is a **product
  decision that is not taken in this document.** Phase 5 builds the mechanism; the rule it
  applies must be decided first.
- **Whether the client refactor (§6.3) is one project or several.** It is larger than the
  backend. Sized here, planned separately.
- **Diesel, multi-grade, coastal pricing.** Out of scope; v1 remains petrol 95.

---

## 3. The data

### 3.1 Integers, from the first migration

**The problem.** The model counts money and litres in floating-point numbers — the kind of
number that cannot represent 0.1 exactly, the same way one third cannot be written exactly
in decimal. `src/lib/round.ts` already fights this, and says so:

> "This also neutralises floating-point noise from summing several lots at the *same*
> per-litre price … without it, `cost / litres` can land a few ulps under the price and get
> misclassified as 'below pump' by savings.ts."

That is a sound repair for a prototype with a fixed seed and nine ledger rows. It is the
wrong foundation for a ledger that must reconcile across thousands of rows, and for a
product whose stated premise is arithmetic the user can check on screen.

**The decision.** Litres are stored as **millilitres** (`bigint`) and money as **cents**
(`bigint`), in the database *and* in the shared model. Not `numeric` in Postgres with
floats in TypeScript — that only moves the rounding error to the boundary between them.

- `42.6 L` → `42_600` ml
- `R21.87` → `2_187` cents
- Display conversion happens once, at the edge, in `format.ts`.

**Cost if wrong:** migrating live balances later, which is the kind of job nobody wants to
do twice.

### 3.2 Schema

Shape, not the final migration. Column names deliberately carry their unit.

```sql
-- A person. Supabase Auth owns the identity; this holds what we add to it.
create table profiles (
  id                uuid primary key references auth.users on delete cascade,
  created_at        timestamptz not null default now(),
  -- Personal data lives encrypted; see §9.2 on erasure.
  phone_encrypted   bytea not null,
  phone_hash        text not null unique,   -- lookup without storing the number
  deleted_at        timestamptz             -- erasure request, not row removal
);

-- One purchase of litres, with the price locked for 90 days.
create table lots (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles on delete restrict,
  grade             text not null default '95',
  litres_ml         bigint not null check (litres_ml >= 0),
  price_cents       bigint not null check (price_cents > 0),
  purchased_at      timestamptz not null,
  expires_at        timestamptz not null,
  constraint expiry_is_ninety_days
    check (expires_at = purchased_at + interval '90 days')
);
create index on lots (user_id, expires_at);

-- The record of everything that happened. Append-only.
create table ledger (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references profiles on delete restrict,
  kind              text not null check (kind in ('topup','fill','bonus','expiry')),
  occurred_at       timestamptz not null,
  recorded_at       timestamptz not null default now(),
  delta_ml          bigint not null,
  balance_after_ml  bigint not null check (balance_after_ml >= 0),
  lot_ids           uuid[],
  buy_price_cents   bigint,        -- weighted price of lots consumed, for savings
  detail            jsonb not null default '{}'
);
create index on ledger (user_id, occurred_at desc);

-- Makes a retry safe. See §4.3.
create table idempotency_keys (
  key               text primary key,
  user_id           uuid not null references profiles,
  operation         text not null,
  request_hash      text not null,   -- same key + different body = error, not replay
  response          jsonb,
  created_at        timestamptz not null default now()
);
```

**`occurred_at` and `recorded_at` are different on purpose.** The first is when the thing
happened in the world, the second when we heard about it. They diverge for a queued fill or
a late-arriving settlement, and conflating them makes reconciliation impossible.

### 3.3 What the database enforces on its own

These hold even if every line of application code is wrong. That is the point of them.

```sql
-- Nobody reads anyone else's wallet, whatever the API does.
alter table lots   enable row level security;
alter table ledger enable row level security;

create policy own_lots   on lots   for all using (auth.uid() = user_id);
create policy own_ledger on ledger for select using (auth.uid() = user_id);

-- The ledger is written by the server, never by a client, and never edited.
revoke update, delete on ledger from authenticated, anon;
```

**Note the asymmetry:** clients may *read* their ledger but never write it. Ledger rows are
produced only by the transactions in §4.

---

## 4. Where the logic runs

### 4.1 The split

Measured against `src/lib` at commit `320d9d0` — twelve files, 629 lines, **zero external
imports**, not even React.

| | Files | Moves to server |
|---|---|---|
| **Mutations** — change what the user owns | `lots.ts`, `caps.ts` | Yes |
| **Derivations** — compute views over data | the other ten | No |

The line is not arbitrary. A wrong `burnRate` shows a misleading suggestion. A wrong
`consumeFifo` takes litres the user paid for. Only the second needs a server, and it is
about sixty lines.

**Consequence:** the app keeps working offline for reading. Balances render from cache,
every derivation runs locally. Only spending and topping up need the network — which is the
honest shape anyway, because those are the operations that must not be guessed.

### 4.2 The same TypeScript, not a rewrite

The mutation core runs **in an Edge Function, importing the shared package unchanged.** It
is not reimplemented as a database function.

**Why not rewrite FIFO in SQL**, which would be atomic for free: because rule 6 of
`AGENTS.md` says one definition per operation, and that rule exists because of this exact
function. `DECISIONS.md` ruling T7-c records the FIFO loop being duplicated between
`seed.ts` and `cardFill`, and notes the duplicated loop computes `buyPricePerLitre` — the
sole input to the savings figure. If the copies diverge, **the savings number silently
lies.** A SQL rewrite recreates that hazard across two languages instead of two files.

### 4.3 How a mutation is made safe

Three mechanisms, each covering a different failure. All three are required; any two leave
a hole.

**1. Idempotency key — makes a retry harmless.**

The app generates a key per logical action and sends it. The server records it with a hash
of the request body.

- Same key, same body → return the stored response. No second execution.
- Same key, *different* body → reject. That is a bug, not a retry.
- New key → execute, store the result.

Without this, a stalled network that causes the app to retry a fill either double-spends
(no lock) or reports a false failure for an operation that succeeded (lock alone).

**2. Transaction with a row lock — makes concurrency safe.**

```sql
begin;
select * from profiles where id = $1 for update;   -- others wait here
-- read lots, run consumeFifoWithCost in TypeScript, write lots + ledger
commit;
```

**3. Invariant re-check inside the transaction — catches a wrong answer.**

Before commit, the database independently verifies what the code claims:

```sql
-- the ledger's balance_after must equal what the lots actually add up to
select sum(litres_ml) from lots
 where user_id = $1 and expires_at > $2;
-- if this disagrees with balance_after_ml, roll back and alert
```

Tested code can still be wrong. A cheap check that disagrees with it turns a silent
corruption into a loud failure.

### 4.4 Worked example: the double fill

Concrete, because this is the scenario the design exists for.

| | Without the design | With it |
|---|---|---|
| User has 42.6 L, submits a 40 L fill | | |
| Network stalls, app retries | Two requests, both read 42.6 L | Second request carries the same idempotency key |
| Both pass the balance check | Both run FIFO, both write | Second returns the first result, does no work |
| **Result** | **2.6 L shown, 80 L drawn** | **2.6 L shown, 40 L drawn, one ledger row** |

This becomes a test, not a hope. See §7.3.

---

## 5. Accounts and sign-in

### 5.1 What changes

The screens do not. `app/sign-in/index.tsx` and `code.tsx` already collect a phone number
and a six-digit code, `src/lib/phone.ts` already validates South African numbers for real,
and the code check is the only stub. That stub is replaced by Supabase Auth. The rest
stands.

### 5.2 WhatsApp first

Verified 2026-09-12: Twilio charges **$0.1089** per SMS to a South African number, roughly
27× what Plivo or Telnyx charge, and Clerk bills international SMS at market rate. Supabase
supports OTP over WhatsApp via Twilio.

**Decision:** WhatsApp is the default channel, SMS the fallback for users without it. This
is a cost decision *and* a deliverability one — WhatsApp penetration in South Africa is far
higher than in the markets these defaults were designed around.

### 5.3 OTP abuse is a cash cost

At roughly R2 per message, an attacker triggering sign-in codes spends *your* money. This
attack has a name — SMS pumping, or artificially inflated traffic — and it is not exotic.

Required before launch, not after:

- Rate limit per phone number, per IP, and per device.
- A daily spend ceiling that alerts and then hard-stops.
- Exponential backoff on repeated requests for the same number.
- Monitoring of the deliver-to-verify ratio; a healthy number is close to 1, and an attack
  makes it collapse.

---

## 6. The client

### 6.1 Stop storing secrets in plaintext

**The defect.** `AsyncStorage` is not encrypted. `persist.ts` records the reason it was
chosen — "AsyncStorage rather than MMKV because it works in Expo Go, and persistence should
not be the change that forces a native build" — which is a tooling decision, correctly made
at the time, that has never been revisited. Phase 0 removes its premise: once EAS builds
exist, "it works in Expo Go" stops being a constraint. On
2026-09-11 the session was read out of storage in cleartext during a routine check:
`{"phone":"+27821234567","signedInAt":…}`.

**The fix.** Session tokens move to `expo-secure-store`, which wraps the iOS Keychain and
Android Keystore. Note its practical limit of about 2 KB on iOS — it is for tokens, not for
a wallet. Cached wallet data, if cached at all, goes to encrypted SQLite.

This is small, self-contained, and does not need the server. It should ship first.

### 6.2 The zero state is now a dependency

`GAPS.md` §2.3 lists zero states as app polish. The moment signup is real, **every new user
is a zero state** — an empty Wallet, Card and Savings, on screens built around a seeded
42.6 L balance. It stops being polish and becomes part of shipping accounts.

### 6.3 The async state layer — the largest single piece of work here

Today every screen reads zustand synchronously and assumes the answer is already present,
because it always is. A server means every screen that shows a balance acquires four states
it does not have: loading, error, stale-while-refetching, and empty.

This is a bigger change than the backend itself, it touches all twelve screens, and it is
**sized here but planned separately.** Doing it accidentally, one screen at a time as each
query is wired up, is how it goes wrong.

---

## 7. Testing

The suite today is 295 unit tests over pure functions, and nothing else: no CI, no linter,
no screen test, no integration test. The unit tests are good and stay. What follows is
ordered by how much damage the untested thing could do.

### 7.1 RLS policy tests — first, and non-negotiable

A policy mistake means one user reads another's wallet. It is the highest-severity failure
in the system and the easiest to introduce silently, because everything still *works* when
the policy is too permissive.

Every table gets tests asserting, as a real second user: cannot select, cannot insert,
cannot update, cannot delete another user's rows. Run against a real Postgres in CI.

### 7.2 Integration tests against a real database

Against a locally running Supabase, not a mock. Mocks agree with whatever you wrote, which
is the one thing you do not want to check.

### 7.3 Concurrency tests

The design in §4.3 exists to prevent specific failures, so each becomes a test that **fails
if the mechanism is removed**:

- Two simultaneous fills against one balance → one succeeds, one fails cleanly.
- The same idempotency key twice → one execution, identical responses.
- Same key, different body → rejected.
- A transaction aborted mid-write → no partial lots, no orphan ledger row.

### 7.4 Migration tests

Every migration runs forward from empty on every CI run. Migrations that touch existing
data get an explicit test on a seeded copy.

### 7.5 Screen and end-to-end tests

The known gap: *"A chart bug that bunched both series into the middle third of the panel
passed every one of them and was found by opening the app."* Screen-level tests for the
states that now exist (loading, error, empty) and a small end-to-end pass over sign-in →
wallet → top up on a real device via EAS builds.

### 7.6 CI

Nothing merges without: `tsc --noEmit`, lint, unit tests, RLS tests, integration tests,
migrations-from-empty. Anything less and the suite protects you only when someone remembers
to run it.

---

## 8. Operations

| | |
|---|---|
| **Environments** | Three Supabase projects: local, staging, production. Never one shared. |
| **Migrations** | Version-controlled, applied by CI, never by hand in a dashboard. |
| **Backups** | PITR on Pro or above — roughly a two-minute worst-case loss window. **Test a restore before launch**; an untested backup is a rumour. |
| **Errors** | Sentry in the app and in Edge Functions. You currently cannot see a crash. |
| **Logs** | Structured, with a correlation id per request so one action can be followed end to end. |
| **Alerts** | Failed mutations, invariant-check failures (§4.3), OTP spend ceiling, expiry job not completing. |
| **Runbook** | Written before launch: what to do when the expiry sweep fails, when a balance disagrees, when OTP delivery drops. |

---

## 9. Compliance and risk

### 9.1 Data leaves South Africa

Verified 2026-09-12: Supabase withdrew its Cape Town region for new projects, and Neon has
no Africa region at all. AWS has one, so self-hosting is the only path to onshore data.

POPIA permits cross-border transfer under conditions — the same ground already covered for
Buttondown on the website. The consequences here are: `/privacy` must say so, and the
pending legal opinion **may mandate onshore hosting**, which would be expensive to comply
with if we have built deeply into vendor-specific features.

**Mitigation, applied from day one:** standard Postgres wherever possible, authentication
behind our own thin interface rather than called directly from screens, and business logic
in the shared package rather than in Supabase-shaped code. This is cheap now and very
expensive to retrofit.

### 9.2 Erasure versus an append-only ledger

POPIA gives a person the right to have their data deleted. A financial ledger must not be
mutable. These genuinely conflict.

**Resolution:** personal details (`phone_encrypted`) are encrypted with a per-user key.
Erasure destroys the key — the rows survive for accounting, the person becomes
unidentifiable. Ledger rows reference an opaque `user_id` that carries no personal meaning.
Retention of the financial record is justified by legal obligation, and that justification
is written down before the first erasure request, not during it.

### 9.3 Risks

| Risk | Mitigation |
|---|---|
| Legal opinion mandates onshore hosting | Portability discipline, §9.1. Accepted risk. |
| Edge Function cold starts on the mutation path | Acceptable at phase-1 volume. If money moves later, revisit — a long-running service with a warm connection pool may be needed. |
| The seed stops being the fixture everything is verified against | Real users arrive with a real clock. Phase 3 must decide what a real account starts with. |
| Client refactor (§6.3) is underestimated | Sized separately before it is scheduled, not discovered mid-phase. |

---

## 10. The phases

**Deliberately incremental. Each one leaves the app working, and none requires the next to
be started.** If work stops after any phase, what exists is coherent.

| Phase | What | Verifiable by | Needs a server |
|---|---|---|---|
| **0** | CI, linter, `packages/model` workspace, integers, EAS builds | Existing 295 tests still green, plus equivalence tests; a build installs on a real phone | No |
| **1** | Session to `expo-secure-store` | Token absent from plaintext storage on device | No |
| **2** | Supabase project, schema, migrations, RLS | RLS tests pass against real Postgres | Yes |
| **3** | Real sign-in, WhatsApp OTP, rate limits | Sign in on a real phone with a real code | Yes |
| **4** | Wallet reads from server, async state layer, zero state | New account shows an honest empty wallet | Yes |
| **5** | Mutations: top up, fill, idempotency, concurrency | The §4.4 tests pass and fail without the mechanism | Yes |
| **6** | Scheduled expiry sweep, writes the `expiry` ledger kind | `GAPS.md` §1.1 closes — **needs §2.1 decided first** | Yes |
| **7** | Push notifications | Expiry warning arrives on a real device | Yes |
| **8** | Observability, alerting, restore drill, runbook | A restore actually performed | Yes |

**Phase 0 and 1 change nothing a user sees** and fix two real defects. They are worth doing
whatever happens to the rest.

**Phase 4 is the one to watch.** It carries the client refactor, and it is where an
underestimate would hurt most.

---

## 11. Out of scope

Named so they are not rediscovered as oversights.

- Payments, card issuing, KYC, settlement — gated on the legal opinion.
- Station rebates and the phase-2 aggregation strategy.
- Diesel and any grade other than petrol 95.
- Real price ingestion. `src/data/prices.ts` remains invented demo data, and the rule that
  it must never reach `web/` still holds. A real price feed is separate work.
- Admin tooling beyond what Supabase's dashboard provides.
- Anything that unpins `DEMO_NOW` before phase 3 forces the question.
