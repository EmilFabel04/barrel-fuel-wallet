import type { CSSProperties } from 'react';
import { ENTITY } from '@/data/entity';
import { Lockup } from '@/components/Lockup';
import Link from 'next/link';

export const metadata = { title: 'Terms — Barrel' };

// This page is the one place spec §2.1's mechanics vocabulary is allowed, and
// scripts/check.mjs enforces that boundary by excluding this directory from the
// scan. It is also the only page that may state the 90-day term.
//
// What this page is NOT: commercial terms. Barrel sells nothing today, holds no
// legal opinion on whether it may sell anything, and has no banking or retailer
// agreements. Terms that purport to bind a buyer to a product that does not
// exist would be worse than none — they would be the first thing a regulator
// read, and the first thing contradicted by whatever the legal opinion says.
// So this covers the site: who runs it, what it is for, what using it means,
// and an explicit statement that the product description below binds nobody.
// The binding commercial terms are written after the legal opinion, not before.
const h2: CSSProperties = { fontSize: 19, fontWeight: 700, marginTop: 40 };
const prose: CSSProperties = { color: 'var(--text-dim)' };
const link: CSSProperties = { color: 'var(--text)' };

export default function Terms() {
  return (
    <main className="wrap" style={{ paddingTop: 40 }}>
      <Link href="/" style={link}><Lockup size={16} /></Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 48 }}>
        Terms of use
      </h1>
      <p className="prose" style={prose}>
        These terms cover this website. They are not terms for buying anything, because
        there is nothing to buy yet — see below.
      </p>

      <h2 style={h2}>Barrel has not launched</h2>
      <p className="prose" style={prose}>
        Barrel is in development. It has no banking partner, no agreements with fuel
        retailers, and no legal opinion on whether the product may be offered in South
        Africa. Nothing on this site is an offer to sell, and no money can be paid to
        Barrel today.
      </p>

      <h2 style={h2}>Who runs this site</h2>
      <p className="prose" style={prose}>
        This site is operated by <strong>{ENTITY.name}</strong>, of {ENTITY.address}. Write
        to <a href={`mailto:${ENTITY.contact}`} style={link}>{ENTITY.contact}</a> about
        anything on it.
      </p>

      <h2 style={h2}>What this site is for</h2>
      <p className="prose" style={prose}>
        It explains an idea and collects email addresses from people who want to know when
        it launches. That is all it does. Nothing here is financial advice, an offer of a
        financial product, an invitation to invest, or a promise that Barrel will launch at
        all.
      </p>

      <h2 style={h2}>How the intended product works</h2>
      <p className="prose" style={prose}>
        The intention is that you buy fuel in litres at the pump price on the day you buy,
        and spend those litres later at a fuel station. If the pump price rises in between,
        you have already paid the earlier price.
      </p>
      <p className="prose" style={prose}>
        <strong>Litres would hold their price for 90 days.</strong> This is a material term,
        not a detail. Under the current design, litres not used within 90 days of purchase
        would convert back to the rand value paid for them, not be forfeited. The exact
        mechanism is not final, and will be restated here before anything is sold.
      </p>
      <p className="prose" style={prose}>
        Barrel is intended to sell price certainty, not a return. The 90-day limit caps how
        far ahead of the pump price anyone can be. No part of this is an investment, and
        nothing compounds.
      </p>

      <h2 style={h2}>None of that binds anyone yet</h2>
      <p className="prose" style={prose}>
        The description above is what Barrel is being built to do, written in the present
        design. It is not a contract, and it is not a promise. Every part of it may change,
        and some of it will. Before anything can be bought, the terms that actually govern
        a purchase will be published here, and those are the terms that would apply — not
        these.
      </p>

      <h2 style={h2}>The price chart</h2>
      <p className="prose" style={prose}>
        The figures on the home page are published inland 95 unleaded prices from the
        Department of Mineral and Petroleum Resources, cross-checked against the
        Automobile Association’s series. They are shown to explain why the idea exists.
        They describe what fuel has already cost, not what it will cost, and nothing about
        past movement predicts the next move.
      </p>

      <h2 style={h2}>The waitlist</h2>
      <p className="prose" style={prose}>
        Joining the waitlist places you under no obligation and reserves nothing. It is not
        a queue position, a booking, or a right to buy anything later. See the{' '}
        <Link href="/privacy" style={link}>privacy policy</Link> for what happens to your
        email address.
      </p>

      <h2 style={h2}>Using this site</h2>
      <p className="prose" style={prose}>
        Read it, share it, quote it. Do not try to break it, overload it, or submit other
        people’s email addresses to the waitlist. The Barrel name, the lockup and the
        wording of these pages belong to the operator named above; the fuel price figures
        do not, and belong to the bodies that published them.
      </p>

      <h2 style={h2}>What we don’t promise about the site</h2>
      <p className="prose" style={prose}>
        The site is provided as it is. It may be offline, and it may contain mistakes — if
        you find one, tell us and we will correct it. To the extent the law allows, the
        operator is not liable for loss arising from relying on anything here, which is a
        clause worth reading in the light of the sentence above it: this site describes an
        unlaunched product, so there is nothing here that anybody should be relying on yet.
      </p>

      <h2 style={h2}>Changes, and the law that applies</h2>
      <p className="prose" style={prose}>
        These terms will change as Barrel gets closer to launching, and the version on this
        page is the one that applies. They are governed by South African law, and the
        courts of South Africa have jurisdiction over any dispute about them. Nothing here
        limits any right you have under the Consumer Protection Act, the Electronic
        Communications and Transactions Act, or POPIA.
      </p>
    </main>
  );
}
