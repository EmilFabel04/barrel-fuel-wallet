import { Lockup } from '@/components/Lockup';
import Link from 'next/link';

export const metadata = { title: 'Privacy — Barrel' };

export default function Privacy() {
  return (
    <main className="wrap" style={{ paddingTop: 40 }}>
      <Link href="/" style={{ color: 'var(--text)' }}><Lockup size={16} /></Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 48 }}>
        Privacy notice
      </h1>
      <p className="prose" style={{ color: 'var(--text-dim)' }}>
        This site asks you for one thing: an email address, and only if you type it in.
        When you submit the form your browser posts it straight to Buttondown, who run
        the list. Their data processing agreement records that they also receive your IP
        address, referrer metadata and the time you subscribed — the IP address is what
        lets them screen out bots, since this site has no server of its own to do it.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>What we do with it</h2>
      <p className="prose" style={{ color: 'var(--text-dim)' }}>
        We email you when Barrel launches. We do not sell it, share it, or use it for
        anything else. You will receive a confirmation email first, and you are not on
        the list until you click it.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Who holds it</h2>
      <p className="prose" style={{ color: 'var(--text-dim)' }}>
        The list is held by <strong>Buttondown</strong>, a company in Richmond, Virginia.
        Their data processing agreement states that personal data is transferred to and
        processed in the United States, on infrastructure run by Heroku and Amazon Web
        Services. Under POPIA that is a cross-border transfer out of South Africa, and by
        joining the waitlist you consent to it. If you would rather not, do not join the
        list — email us instead and we will note your interest by reply.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>Getting removed</h2>
      <p className="prose" style={{ color: 'var(--text-dim)' }}>
        Every email we send carries an unsubscribe link. You can also write to{' '}
        <a href="mailto:hello@getbarrel.co.za" style={{ color: 'var(--text)' }}>hello@getbarrel.co.za</a>{' '}
        and we will delete you from the list.
      </p>

      <h2 style={{ fontSize: 19, fontWeight: 700, marginTop: 40 }}>What we don’t do</h2>
      <p className="prose" style={{ color: 'var(--text-dim)' }}>
        No analytics, no tracking pixels, no advertising cookies. This site sets no
        cookies at all, and makes no request to any third party until you submit the form.
        That is why this notice is short.
      </p>
    </main>
  );
}
