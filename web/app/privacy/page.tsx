import { Lockup } from '@/components/Lockup';
import Link from 'next/link';

export const metadata = { title: 'Privacy — Barrel' };

export default function Privacy() {
  return (
    <main className="wrap" style={{ paddingTop: 40, maxWidth: '34rem' }}>
      <Link href="/" style={{ color: 'var(--text)' }}><Lockup size={16} /></Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 48 }}>
        Privacy notice
      </h1>
      <p style={{ color: 'var(--text-dim)' }}>
        This site collects one thing: an email address, and only if you type it in.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>What we do with it</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        We email you when Barrel launches. We do not sell it, share it, or use it for
        anything else. You will receive a confirmation email first, and you are not on
        the list until you click it.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Who holds it</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        The list is held by <strong>Buttondown</strong>, which stores data on servers
        outside South Africa, in the United States. Under POPIA this is a cross-border
        transfer, and by joining the waitlist you consent to it. If you would rather not,
        do not join the list — email us instead and we will note your interest by reply.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Getting removed</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        Every email we send carries an unsubscribe link. You can also write to{' '}
        <a href="mailto:hello@getbarrel.co.za" style={{ color: 'var(--text)' }}>hello@getbarrel.co.za</a>{' '}
        and we will delete you from the list.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>What we don’t do</h2>
      <p style={{ color: 'var(--text-dim)' }}>
        No analytics, no tracking pixels, no advertising cookies. This site sets no
        cookies at all, and makes no request to any third party until you submit the form.
        That is why this notice is short.
      </p>
    </main>
  );
}
