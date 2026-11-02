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

Draft PR33, based on main c90a082. Local executor unavailable; use the repository's existing CI. Candidate/public acceptance is pending. Hostinger's direct receipt, Sites 28 synchronization, external vendor configuration and Resend delivery are separate unresolved checks.

## Continuation — visible sizing and lighter transitions

The sizing entry uses the existing acid-yellow brand surface, an ink outline, larger shirt/check icon and real shirt-color swatches. Completed selections retain a distinct green state. The same optional dialog and validation remain; its note now correctly explains that selected sizes can be saved with contact capture or completion.

Stage headers and fields enter briefly with transform/opacity; the progress fill uses scale rather than animating layout width. No extra screen, blocking delay, overlay, library or network operation was added. Reduced-motion users get instant state changes. Three-step contact capture, required email and manual owner-only follow-up remain unchanged.

PR33 merged at 264039eb39bcddcee308ceba9982bd21b3010cee. Candidate checks passed TypeScript, 36 regression/contract tests, actual SQLite/API scenarios, production build, SEO, form/quantity/UX/media and consent browser checks. Public performance probe job 125327617551 observed clean 264039e with fingerprint 6b25481d90485c5b1c3872c375ee5bbebc6c7f4d13187226d1a7ac6e509a3fa1: mobile median 1696ms, desktop 440ms (3 lab samples/profile; not field data). The first public form check ran before deployment and reported waiting; it is not acceptance. The new visual continuation will receive the complete public mocked-write QA after deployment. Direct hPanel receipt, Sites28, real Resend delivery and business identity remain open.
