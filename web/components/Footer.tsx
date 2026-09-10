import Link from 'next/link';
import { Lockup } from './Lockup';

export function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--hairline)', marginTop: 96, paddingTop: 32, paddingBottom: 64 }}>
      <div className="wrap">
        <Lockup size={14} />
        <p style={{ color: 'var(--text-dim)', fontSize: 15, marginTop: 16, marginBottom: 0 }}>
          Barrel is being built in South Africa. It has not launched.
        </p>
        <p style={{ marginTop: 16, marginBottom: 0, fontSize: 15 }}>
          <a href="mailto:hello@getbarrel.co.za" style={{ color: 'var(--text)' }}>hello@getbarrel.co.za</a>
        </p>
        <p style={{ marginTop: 24, marginBottom: 0, fontSize: 15, display: 'flex', gap: 20 }}>
          <Link href="/terms" style={{ color: 'var(--text-dim)' }}>Terms</Link>
          <Link href="/privacy" style={{ color: 'var(--text-dim)' }}>Privacy</Link>
        </p>
      </div>
    </footer>
  );
}
