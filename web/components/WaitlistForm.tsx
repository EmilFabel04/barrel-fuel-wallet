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
// Jurisdiction and data location, for /privacy. Checked 2026-09-10 against
// buttondown.com/legal/data-processing-agreement, which is where this is
// actually stated — NOT the terms, and not the privacy policy or the
// subprocessor list, neither of which names a location at all. An earlier
// version of this comment inferred the data location from the company's
// place of business, which are different things.
//
//   DPA s8.1: "the Data Processor is based in the United States and ...
//   Personal Data will be transferred to and processed in the United
//   States in connection with the provision of the services."
//
//   DPA Annex II: "Services are hosted on Heroku (Salesforce) and Amazon
//   Web Services, both of which maintain SOC 2 Type II and ISO 27001
//   certifications."
//
//   DPA Annex A, types of personal data: "Email addresses, IP addresses,
//   referrer metadata, subscription timestamps" — /privacy discloses the
//   IP address and referrer metadata, because the form posts straight to
//   Buttondown and they receive both.
//
// The DPA binds without anyone signing anything: "This DPA is entered into
// between Buttondown, LLC ... and the Customer ... and forms part of the
// Agreement." It arrives with the account. So its security obligations —
// s3, s4 and Annex II — do cover this list, and an earlier version of this
// comment was wrong to say nobody had confirmed it in writing.
//
// What it does not cover is the transfer. The safeguards in s8.2-8.6 are
// the EU Standard Contractual Clauses, scoped to the EEA, UK and
// Switzerland; s12.1 puts governing law in the United States, and the
// carve-out in s12.2 that overrides it names the GDPR and EEA/UK/Swiss law
// only. South Africa and POPIA appear nowhere in the document. So the
// written agreement exists, but it is written for the wrong jurisdictions —
// which is why /privacy rests on consent under POPIA s72(1)(b) and not on
// the binding-agreement route in s72(1)(a).
//
// Email tracking, for /privacy. Annex A names "analytics on email
// engagement (opens, clicks)" among the purposes of processing, but both
// are off until someone turns them on: "Buttondown offers opt-in open
// tracking" (docs.buttondown.com/open-tracking — it injects an <img> pixel
// at the end of the body) and "Buttondown offers opt-in click tracking"
// (docs.buttondown.com/click-tracking — it rewrites every link through a
// proxy URL). Both toggle at buttondown.com/settings/tracking, checked
// 2026-09-10. /privacy promises the launch email carries neither, so LEAVE
// THEM OFF. Turning either on makes that notice false, and the notice has
// to change first.
//
// Endpoint: POST https://buttondown.com/api/emails/embed-subscribe/{username}
// Fields: email (required), tag (hidden, optional list segmentation),
// embed=1 (hidden, marks this as a bare-HTML embed submission per
// Buttondown's documented example).
//
// No honeypot field. See the comment in the JSX below, between the email
// field and the submit button, for the full reasoning and what Buttondown's
// own documentation says about spam handling — checked 2026-09-10.
//
// The Buttondown username, which IS the endpoint — see ENDPOINT below. Set
// 2026-09-13 from the account the site owner created; verified the same day
// that buttondown.com/barrelza returns 200 while a nonexistent username 404s.
//
// Do not rename the Buttondown account. The username is the whole address the
// form posts to, so renaming it silently breaks every submission on the live
// site with no error anyone would see until the list stopped growing.
const LIST_ID = 'barrelza';

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

      {/* Deliberately no honeypot field here.

          A honeypot only filters spam if whoever receives the submission
          inspects it and rejects submissions where it's filled in. This is
          a static export: the browser posts straight to buttondown.com,
          and there is no server of ours sitting in between to ever read a
          hidden field before that happens. A field we never look at isn't
          a weaker defence than none — it's decoration that reads as a
          defence, which is worse: the next person to touch this file
          could reasonably believe spam is being filtered here when it
          isn't.

          Checked Buttondown's own documentation for a field THEY read
          (2026-09-10): docs.buttondown.com/api-subscribers-create,
          /api-subscribers-introduction, /double-opt-in, /firewall,
          /dealing-with-spam-subscribers, /api-introduction; plus
          buttondown.com/blog/deliverability and a site search of
          docs.buttondown.com for "honeypot" and "spam". None of it
          documents a honeypot field, a timestamp trap, or a CAPTCHA token
          for the embed-subscribe form. What it does document:

          - "Buttondown validates all incoming subscribers through the
            API" (api-subscribers-create) — server-side email-format and
            deliverability checks, run on Buttondown's own server.
          - IP screening against internal data plus Spamhaus and Project
            Honeypot: "checking incoming subscriptions' IP addresses
            against a combination of both our internal datasets and those
            of trusted vendors like Spamhaus and Project Honeypot ...
            lets us immediately filter out automated or malicious bots"
            (buttondown.com/blog/deliverability).
          - An opt-in "Firewall" (docs.buttondown.com/firewall): a
            dashboard toggle, not a form field, so there is nothing to add
            here — it audits every incoming subscriber and can
            auto-engage an "attack mode" under a spam burst. Off by
            default; the site owner can switch it on from the Buttondown
            dashboard once the account exists, no code change required.
          - Double opt-in (see the file-top comment): mandatory, and the
            actual gate on a bot signup ever reaching the list.

          So the real, only, and vendor-documented defence is Buttondown's
          own server-side validation and IP screening, plus double
          opt-in — which is also why this vendor was chosen over one whose
          embed needs a widget script. */}

      <button type="submit" className="button" style={{ marginTop: 16, width: '100%' }}>
        Join the waitlist
      </button>

      {/* POPIA: purpose stated at the point of collection, not buried. */}
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 16, marginBottom: 0 }}>
        We’ll email you once, when Barrel launches. Nothing else. You’ll get a
        confirmation email first — Barrel can’t add you without it. See the{' '}
        <a href="/privacy" style={{ color: 'var(--text)' }}>privacy policy</a>.
      </p>
    </form>
  );
}
