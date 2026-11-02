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
