// SET THIS BEFORE LAUNCH, together with LIST_ID in components/WaitlistForm.tsx.
//
// Who is behind this site. Two pages need it and they must not disagree:
// /privacy names the responsible party because POPIA s18(1)(b) requires the
// notice to give a name and an address, and /terms names the operator because
// terms of use that never say whose terms they are cannot be agreed to or
// enforced against anyone.
//
// Nothing in this repo knows who that is. The site says only "Barrel is being
// built in South Africa", and no legal entity has been registered yet, so
// there is nobody to name and no address to give.
//
// Every right in the privacy policy ends in "write to us". A reader who cannot
// tell who "us" is has been handed a policy they cannot act on, which is worse
// than a page that is not live yet — so scripts/check.mjs refuses the build
// while either field is still the placeholder, exactly as it does for the
// waitlist endpoint. Fill both in when the entity exists.
//
// One thing the check cannot see: the contact address below has to be a
// mailbox somebody reads. As of 2026-09-10 getbarrel.co.za publishes no MX
// record, so mail to it is refused. Both legal pages route every request a
// reader can make to that address; set the MX records up before the site is
// live, or the policy is a promise the domain cannot keep.
export const ENTITY = {
  name: '__SET_BEFORE_LAUNCH__',
  address: '__SET_BEFORE_LAUNCH__',
  contact: 'hello@getbarrel.co.za',
} as const;
