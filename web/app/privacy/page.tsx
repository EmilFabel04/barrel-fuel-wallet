import type { CSSProperties } from 'react';
import { ENTITY } from '@/data/entity';
import { Lockup } from '@/components/Lockup';
import Link from 'next/link';

export const metadata = { title: 'Privacy — Barrel' };

// The Information Regulator is given in full — address, email, phone — rather
// than hyperlinked, deliberately. POPIA s18(1)(h)(iii) requires the notice to
// say that you may complain to them; it does not require a link. check.mjs
// fails the build on any https:// origin that is not ours or Buttondown's
// (§9), and that check is a plain string scan, so an <a href="https://
// inforegulator.org.za"> would trip it even though a link is not a request
// until someone clicks it. Widening a gate that is doing its job, to add a
// convenience, is the wrong trade: the details go in as text, and the email as
// a mailto:, which is how the footer already treats our own address.
//
// Verified 2026-09-10 against inforegulator.org.za. Both details had moved
// since this was last general knowledge: the office is in Woodmead, not the
// SALU Building in Pretoria, and POPIA complaints now go through their
// eServices portal — PAIAComplaints@inforegulator.org.za is for PAIA only and
// is the wrong address to send a POPIA complaint to.
const REGULATOR = {
  address: 'Woodmead North Office Park, 54 Maxwell Drive, Woodmead, Johannesburg, 2191',
  email: 'enquiries@inforegulator.org.za',
  phone: '010 023 5200',
  tollFree: '0800 017 160',
  portal: 'eservices.inforegulator.org.za',
};

const h2: CSSProperties = { fontSize: 19, fontWeight: 700, marginTop: 40 };
const prose: CSSProperties = { color: 'var(--text-dim)' };
const link: CSSProperties = { color: 'var(--text)' };

export default function Privacy() {
  return (
    <main className="wrap" style={{ paddingTop: 40 }}>
      <Link href="/" style={link}><Lockup size={16} /></Link>

      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', marginTop: 48 }}>
        Privacy policy
      </h1>
      <p className="prose" style={prose}>
        This site asks you for one thing: an email address, and only if you type it in.
        When you submit the form your browser posts it straight to Buttondown, who run
        the list. Their data processing agreement records that they also receive your IP
        address, referrer metadata and the time you subscribed. Buttondown say they check
        that IP address against known sources of spam to keep bots off the list — this
        site has no server of its own to do it.
      </p>

      <h2 style={h2}>Who is asking</h2>
      {ENTITY.registered ? (
        <p className="prose" style={prose}>
          <strong>{ENTITY.name}</strong> is the responsible party for this list under POPIA —
          the one who decides why your address is collected and answers for what happens to
          it. The registered address is {ENTITY.address}. For anything in this policy, write
          to <a href={`mailto:${ENTITY.contact}`} style={link}>{ENTITY.contact}</a>.
        </p>
      ) : (
        <p className="prose" style={prose}>
          Barrel is not yet a registered company, so there is no registered name or address
          to give you here — and POPIA would normally want both before anyone asks you for
          an email address. We are asking anyway, because the list is how we tell you Barrel
          exists, and we would rather say that plainly than pretend the gap isn’t there. The
          person building Barrel is responsible for this list in the meantime and answers
          for it at <a href={`mailto:${ENTITY.contact}`} style={link}>{ENTITY.contact}</a>.
          The registered details go on this page as soon as they exist, and before any email
          is sent to this list.
        </p>
      )}

      <h2 style={h2}>What we do with it</h2>
      <p className="prose" style={prose}>
        We email you when Barrel launches. We do not sell it, share it, or use it for
        anything else. You will receive a confirmation email first, and you are not on
        the list until you click it.
      </p>
      <p className="prose" style={prose}>
        Giving us your address is voluntary, and nothing on this site stops working if
        you don’t. The waitlist is the only thing it is for, so the only consequence of
        keeping it to yourself is that we cannot tell you when Barrel opens.
      </p>

      <h2 style={h2}>Who holds it</h2>
      <p className="prose" style={prose}>
        The list is held by <strong>Buttondown</strong>, a company in Richmond, Virginia.
        Their data processing agreement states that personal data is transferred to and
        processed in the United States, on infrastructure run by Heroku and Amazon Web
        Services. Under POPIA that is a cross-border transfer out of South Africa, and by
        joining the waitlist you consent to it. If you would rather not, do not join the
        list — email us instead and we will note your interest by reply.
      </p>
      <p className="prose" style={prose}>
        That agreement binds Buttondown to encrypt the list in transit and at rest, to
        limit who may see it, and to tell us within 72 hours of any breach. Those
        obligations are real, but they were drafted for European law: the transfer
        safeguards in it cover the EEA, the UK and Switzerland, and POPIA is not
        mentioned anywhere in the document. That is why we ask for your consent to the
        transfer rather than leaning on the agreement to carry it.
      </p>

      <h2 style={h2}>How long we keep it</h2>
      <p className="prose" style={prose}>
        The waitlist has one purpose and it ends when that purpose is met. We keep your
        address until the launch email has been sent and then delete it, unless that
        email gives you a reason to stay on a list and you take it. If Barrel never
        launches, we delete the list rather than sit on it. You can leave sooner, at any
        time, without giving a reason.
      </p>

      <h2 style={h2}>Getting removed</h2>
      <p className="prose" style={prose}>
        Every email we send carries an unsubscribe link. You can also write to{' '}
        <a href={`mailto:${ENTITY.contact}`} style={link}>{ENTITY.contact}</a>{' '}
        and we will delete you from the list.
      </p>

      <h2 style={h2}>Your rights</h2>
      <p className="prose" style={prose}>
        Under POPIA you may ask what we hold about you, have it corrected, have it
        deleted, or object to us using it at all. Write to{' '}
        <a href={`mailto:${ENTITY.contact}`} style={link}>{ENTITY.contact}</a>{' '}
        and we will do it. There is no form to fill in and no fee, and you do not have to
        say why.
      </p>
      <p className="prose" style={prose}>
        If we get it wrong, you may complain to the Information Regulator (South Africa),
        at {REGULATOR.address}, on {REGULATOR.phone} or {REGULATOR.tollFree} toll free, or
        by email to{' '}
        <a href={`mailto:${REGULATOR.email}`} style={link}>{REGULATOR.email}</a>. POPIA
        complaints are lodged through their eServices portal at {REGULATOR.portal}, which
        asks you to register first.
      </p>

      <h2 style={h2}>If the list is ever breached</h2>
      <p className="prose" style={prose}>
        If the list reaches someone it should not have, POPIA requires us to tell the
        Information Regulator and to tell you. We will, and we will say what was taken
        rather than that “an incident occurred”. Buttondown’s agreement gives them 72
        hours to tell us, which is what makes that possible.
      </p>

      <h2 style={h2}>What we don’t do</h2>
      <p className="prose" style={prose}>
        No analytics, no tracking pixels, no advertising cookies. This site sets no
        cookies at all, and makes no request to any third party until you submit the form.
        The launch email carries no open or click tracking either — Buttondown offer
        both, and both stay switched off. There is nothing else to disclose.
      </p>

      <h2 style={h2}>When this changes</h2>
      <p className="prose" style={prose}>
        Barrel has not launched, and this policy will change before it does. If it changes
        in a way that affects a list you are already on, the change comes to you by email
        rather than quietly appearing here.
      </p>
    </main>
  );
}
