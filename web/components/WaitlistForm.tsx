// Vendor: Buttondown, chosen 2026-09-10 against its live documentation:
// docs.buttondown.com/building-your-subscriber-base, /forms,
// /double-opt-in, /api-subscribers-create, /one-click-unsubscribe,
// /data-exports-subscriber; buttondown.com/legal/terms, /legal/privacy.
//
// Assessed against spec §8's four criteria, in order, against Kit (the
// brief's fallback):
//
// 1. Spam protection that works with no server of ours. This is a static
//    export — there is no request we can inspect, so the vendor's own
//    filtering at the point it receives the POST is the entire defence.
//    Buttondown validates every incoming subscriber server-side (email
//    format and deliverability, plus IP-based screening of bursty
//    submission patterns) the moment the browser posts to buttondown.com:
//    "Buttondown validates all incoming subscribers through the API"
//    (docs.buttondown.com/api-subscribers-create). That check runs on
//    Buttondown's server, which is exactly what "no server [of ours]"
//    requires — we supply none and still get filtering.
// 2. Double opt-in, on by default for every list
//    (docs.buttondown.com/double-opt-in): a submission creates an
//    "unactivated" subscriber who becomes "regular" only after clicking a
//    confirmation email Buttondown sends. That click is the POPIA consent
//    record — nobody is added by a bot filling in this form alone.
// 3. A plain HTML POST, our own markup, no iframe, no JS. Buttondown's
//    docs are explicit that the endpoint must be a bare
//    <form method="post"> action and warn against calling it with
//    fetch(), because a subscriber sometimes has to follow a redirect to
//    finish validation. Kit also defaults to double opt-in and has a POST
//    endpoint, but its documented embed path is its own hosted form
//    widget (a forms.kit.com script), which would add a second
//    third-party request this form doesn't need and works against the
//    "our own markup" requirement. Buttondown needs no script at all.
// 4. Unsubscribe and export. Every Buttondown email carries an
//    unsubscribe link and a List-Unsubscribe header for one-click
//    unsubscribe (docs.buttondown.com/one-click-unsubscribe); the full
//    list exports as CSV on demand (docs.buttondown.com/
//    data-exports-subscriber).
//
// Jurisdiction, for /privacy: Buttondown, LLC's terms name its place of
// business as Richmond, VA, United States, governed by Delaware law
// (buttondown.com/legal/terms) — so subscriber data is a cross-border
// transfer out of South Africa to the United States.
//
// Endpoint: POST https://buttondown.com/api/emails/embed-subscribe/{username}
// Fields: email (required), tag (hidden, optional list segmentation),
// embed=1 (hidden, marks this as a bare-HTML embed submission per
// Buttondown's documented example).
//
// No honeypot field: with no server of ours between the browser and
// buttondown.com, nothing here would ever read a hidden field before the
// POST leaves the page — a honeypot would be decorative, not a defence,
// and Buttondown does not look for one. The server-side validation and
// double opt-in described above are the real, and only, control.
//
// SET THIS BEFORE LAUNCH. The site owner creates the Buttondown account;
// nobody else can — it requires their own billing and identity.
const LIST_ID = '__SET_BEFORE_LAUNCH__';

const ENDPOINT = `https://buttondown.com/api/emails/embed-subscribe/${LIST_ID}`;

export function WaitlistForm() {
  return (
    <form action={ENDPOINT} method="post" style={{ marginTop: 32, maxWidth: '26rem' }}>
      <label htmlFor="email" className="label" style={{ display: 'block', marginBottom: 10 }}>
        Email address
      </label>

      <input
        id="email"
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="you@example.co.za"
        className="field"
      />

      {/* Marks this as a bare-HTML embed submission, per Buttondown's
          documented form example. */}
      <input type="hidden" name="embed" value="1" />

      <button type="submit" className="button" style={{ marginTop: 16, width: '100%' }}>
        Join the waitlist
      </button>

      {/* POPIA: purpose stated at the point of collection, not buried. */}
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16, marginBottom: 0 }}>
        We’ll email you once, when Barrel launches. Nothing else. You’ll get a
        confirmation email first — Barrel can’t add you without it. See the{' '}
        <a href="/privacy" style={{ color: 'var(--text)' }}>privacy notice</a>.
      </p>
    </form>
  );
}
