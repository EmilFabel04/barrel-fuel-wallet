// Who is behind this site. Two pages need it and they must not disagree:
// /privacy names the responsible party because POPIA s18(1)(b) requires the
// notice to give a name and an address, and /terms names the operator because
// terms of use that never say whose terms they are cannot be agreed to or
// enforced against anyone.
//
// `registered` is false until a legal entity exists. Both pages branch on it
// and say plainly that there is no registered company yet, rather than leaving
// a gap or — worse — printing a placeholder token at a reader. That happened:
// the site went live on 2026-09-13 rendering the literal string
// "__SET_BEFORE_LAUNCH__" where a name belongs, on both legal pages, because
// the Vercel build ran `next build` and never called scripts/check.mjs.
//
// The site owner decided on 2026-09-13 to open the waitlist before the entity
// exists, on the grounds that the site says throughout that Barrel is still
// being built. That is a real decision and this file implements it — but it
// does not make the POPIA gap disappear, so check.mjs warns on every build
// while `registered` is false, and the copy on both pages states the gap in
// the open rather than papering over it.
//
// WHEN THE ENTITY EXISTS: set `registered` to true and fill in both fields.
// Nothing else needs changing; both pages switch over on their own.
//
// One thing no check can see: `contact` has to be a mailbox somebody reads.
// As of 2026-09-13 getbarrel.co.za publishes no MX record, so mail to it is
// refused outright. Both legal pages route every request a reader can make —
// access, correction, deletion, objection — to that address, and the footer
// publishes it on every page. Set the MX records up.
export const ENTITY = {
  registered: false,
  name: '',
  address: '',
  contact: 'hello@getbarrel.co.za',
};
