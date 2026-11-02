# Contact details before the optional idea

The owner requested that name, phone and required email be saved immediately after shirts, so an unfinished idea does not lose the contact. The new action explicitly says that the details are saved and may be used for manual follow-up. No keystroke collection or automatic customer reminder is introduced.

## Flow and persistence

1. Shirts, quantity and optional date/sizing retain the existing prices and tier rules.
2. Name, phone and email are required. Only pressing the contact continuation button creates/updates a durable contact.
3. Idea/photos remain optional. A final submit creates the complete request with the same ID; the saved contact remains linked.
4. The confirmation page appears only after a valid final acknowledgement.

A new additive contact_leads table keeps contacts separate from orders. A browser-generated ID and 256-bit token identify one flow; only a SHA-256 token hash is stored. The token expires after 24 hours and is sent in a same-origin POST body, never a URL or analytics parameter. Session storage contains the capability, not raw contact fields; resumption reads the fields from the protected endpoint. Local draft storage still excludes contact PII and image bytes.

Owner-only plain text mail is a transaction notification, not a reminder campaign. Resend failure is recorded without discarding the contact; the manager list is the fallback. Existing final order confirmations remain. Coupons are evaluated/redeemed only on final order creation; duplicate completion returns the existing receipt. Unique image batch paths keep retry cleanup isolated from files belonging to a successful request.

## Public wording

The measurement guide uses actual garment measurements and WhatsApp assistance. It makes no promise of a future chart. An actual chart still renders if the owner enters real chart data.

The privacy page describes the implemented collection moment, purpose, recipients, browser capability, storage and opt-out behavior without public construction notes or an assertion of legal approval. The operator's full legal name, registration number and postal address still need to be supplied by the owner; they must not be invented or inferred from an email address. This is an outstanding factual completion, not a statement that legal review occurred.

Primary references checked: https://www.gov.il/BlobFolder/generalpage/manager_duties/he/InfoDuties_new.pdf ; https://www.gov.il/BlobFolder/legalinfo/duty_to_notify/he/notify13.pdf ; https://resend.com/docs/api-reference/emails/send-email .

## Acceptance

- Required-field, origin, body-limit, rate, version, token, expiry and ownership checks on the actual routes.
- Separate persistence before completion; plain mail only to the owner; no customer reminder.
- Replayed and concurrent saves/completions cannot duplicate a row, coupon redemption or normal confirmation.
- Resend failure leaves the contact available to authorized managers.
- Browser coverage: contact step before files/brief, durable contact after abandonment, private resume, quote changes, file retention, adult/child sizing, quantity/tier labels, late consent, no PII in measurement and no duplicate Lead.
- Lead means acknowledged contact capture; complete_order_request / RequestComplete means acknowledged completion. Both remain consent-aware and deduplicated.
- No real production contact/order, coupon consumption or email is created by QA.

## Status

Implemented in PR33/34 and publicly tested; see the acceptance record below. Hosting/account/legal-identity limits remain explicit.

## Continuation — visible sizing and lighter transitions

The sizing entry uses the existing acid-yellow brand surface, an ink outline, larger shirt/check icon and real shirt-color swatches. Completed selections retain a distinct green state. The same optional dialog and validation remain; its note now correctly explains that selected sizes can be saved with contact capture or completion.

Stage headers and fields enter briefly with transform/opacity; the progress fill uses scale rather than animating layout width. No extra screen, blocking delay, overlay, library or network operation was added. Reduced-motion users get instant state changes. Three-step contact capture, required email and manual owner-only follow-up remain unchanged.

PR33 merged at 264039eb39bcddcee308ceba9982bd21b3010cee. Candidate checks passed TypeScript, 36 regression/contract tests, actual SQLite/API scenarios, production build, SEO, form/quantity/UX/media and consent browser checks. Public performance probe job 125327617551 observed clean 264039e with fingerprint 6b25481d90485c5b1c3872c375ee5bbebc6c7f4d13187226d1a7ac6e509a3fa1: mobile median 1696ms, desktop 440ms (3 lab samples/profile; not field data). The first public form check ran before deployment and reported waiting; it is not acceptance. The new visual continuation will receive the complete public mocked-write QA after deployment. Direct hPanel receipt, Sites28, real Resend delivery and business identity remain open.

## Public acceptance — 2026-11-02

PR34 merged at 0eec69daee0d124b53a4539ea063bad005ccb84a. [Public form acceptance](https://github.com/atzilul/partyprint/actions/runs/41490324258/job/125433486595) observed this exact clean application revision and source fingerprint da18ca54bff76d8e0a5b333d1d584538b411b00c3dd4ae27dab73f0c614bd6bb. All six reports passed, with zero client errors and zero forwarded synthetic writes.

- Form: 27 checks at each of 320/375/414/768/1366 pixels.
- Quantity: 28 checks at 375/1366, including the actual owner-managed promotion text/code and server quote; coupon redemption is mocked.
- UX: 23/26/23/23/23 checks, including visible sizing, motion/reduced-motion, contact-save failure/recovery, field/file retention, price/version conflicts and late sizing.
- Consent/measurement: early captured-contact Lead, completed request separately, no duplicate vendor event, refusal and region rules, no PII in our allowlisted payloads. Vendors are stubbed; this is not account-side delivery evidence.
- Media and non-mutating quote/thanks checks passed. No contact/order was created, no real coupon was consumed and no real mail was sent by this QA.

Implementation and public behavior are accepted within the scope above. A direct hPanel deployment receipt remains unavailable; public source identity is separate evidence. Sites get_site still reports version28, unsynchronized; the execution environment needed to prepare its matching source is unavailable. Resend domain/key/from-address validity and actual owner/customer delivery remain unverified. The operator's legal name, registration number and postal address still require the owner's facts. N01 remains open for pre-existing moderate dev-tool dependency findings; the production dependency audit had zero findings. No scheduled job or paid dependency was added.

[Public performance laboratory](https://github.com/atzilul/partyprint/actions/runs/41490324251/job/125435267854) also passed against clean 0eec69d and the same fingerprint: median LCP 1584ms mobile (1572–1672) and 396ms desktop (388–600), three fresh-context samples per profile, no client errors. These are laboratory observations, not field Core Web Vitals.
