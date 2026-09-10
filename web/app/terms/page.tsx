import { Lockup } from '@/components/Lockup';
import Link from 'next/link';

export const metadata = { title: 'Terms — Barrel' };

export default function Terms() {
  return (
    <main className="wrap" style={{ paddingTop: 40, maxWidth: '34rem' }}>
      <Link href="/" style={{ color: 'var(--text)' }}><Lockup size={16} /></Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 48 }}>
        Terms and status
      </h1>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Barrel has not launched</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        Barrel is in development. It has no banking partner, no agreements with fuel
        retailers, and no legal opinion on whether the product may be offered in South
        Africa. Nothing on this site is an offer to sell, and no money can be paid to
        Barrel today.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>How the intended product works</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        The intention is that you buy fuel in litres at the pump price on the day you buy,
        and spend those litres later at a fuel station. If the pump price rises in between,
        you have already paid the earlier price.
      </p>
      <p style={{ color: 'var(--text-dim)' }}>
        <strong>Litres would hold their price for 90 days.</strong> This is a material term,
        not a detail. Under the current design, litres not used within 90 days of purchase
        would convert back to the rand value paid for them, not be forfeited. The exact
        mechanism is not final, and will be restated here before anything is sold.
      </p>
      <p style={{ color: 'var(--text-dim)' }}>
        Barrel is intended to sell price certainty, not a return. The 90-day limit caps how
        far ahead of the pump price anyone can be. No part of this is an investment, and
        nothing compounds.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>The waitlist</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        Joining the waitlist places you under no obligation and reserves nothing. See the{' '}
        <Link href="/privacy" style={{ color: 'var(--text)' }}>privacy notice</Link> for what
        happens to your email address.
      </p>
    </main>
  );
}
