import { Lockup } from '@/components/Lockup';
import { PriceChart } from '@/components/PriceChart';
import { WaitlistForm } from '@/components/WaitlistForm';

export default function Home() {
  return (
    <main>
      <div className="wrap" style={{ paddingTop: 40 }}>
        <Lockup size={16} />
      </div>

      {/* Block 1 — the promise, and the status. Nothing else. */}
      <section className="wrap" style={{ paddingTop: 96 }}>
        <p className="label">Not launched yet</p>
        <h1
          style={{
            fontSize: 'clamp(40px, 7vw, 76px)',
            lineHeight: 1.1,
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '20px 0 0',
          }}
        >
          Buy fuel at today’s price.<br />Use it later.
        </h1>
        <p className="prose" style={{ fontSize: 19, color: 'var(--text-dim)', marginTop: 24 }}>
          Barrel is a fuel wallet for South African drivers. We’re building it now, and
          it has not launched. Join the waitlist and we’ll tell you when it does.
        </p>
      </section>

      <div className="wrap" style={{ paddingTop: 96 }}><hr className="rule" /></div>

      {/* Block 2 — the problem. The chart lands here in Task 6. */}
      <section id="problem" className="wrap" style={{ paddingTop: 48 }}>
        <span className="marker marker-fuel" aria-hidden="true" />
        <p className="label label-fuel">The problem</p>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>
          The price changes on the first Wednesday of every month.
        </h2>
        <p className="prose" style={{ fontSize: 18, color: 'var(--text-dim)', marginTop: 20 }}>
          You find out when you get to the pump. You have no say in it, no warning that
          lands anywhere useful, and no way to buy at last month’s price once it’s gone.
        </p>
        <PriceChart />
      </section>

      <div className="wrap" style={{ paddingTop: 96 }}><hr className="rule" /></div>

      {/* Block 3 — the promise restated. Outcome only; no mechanic named. */}
      <section className="wrap" style={{ paddingTop: 48 }}>
        <span className="marker marker-gain" aria-hidden="true" />
        <p className="label label-gain">What changes</p>
        <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>
          You’ve already paid.
        </h2>
        <p className="prose" style={{ fontSize: 18, color: 'var(--text-dim)', marginTop: 20 }}>
          With Barrel you buy fuel when the price suits you and spend it when you need it,
          at any station. On the morning the price goes up, nothing about your tank
          changes. That’s the whole product — certainty about what you’ve paid, not a
          return on it.
        </p>
      </section>

      <div className="wrap" style={{ paddingTop: 96 }}><hr className="rule" /></div>

      {/* Block 4 — the waitlist form, the site's one amber button. */}
      <section id="waitlist" className="wrap" style={{ paddingTop: 48 }}>
        <p className="label">The waitlist</p>
        <h2 style={{ fontSize: 'clamp(26px, 5vw, 34px)', lineHeight: 1.2, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 16 }}>
          We’ll tell you when it’s real.
        </h2>
        <WaitlistForm />
      </section>
    </main>
  );
}
