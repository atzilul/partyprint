# Q05 — Meta Conversions API ל־Lead

Date: 2026-11-03

## Request

P0 implementation of a server-side Meta `Lead` for acknowledged contact capture, deduplicated with the browser pixel, only after explicit measurement approval. The brief specified Graph API v21.0, hashed contact matching fields, event context and a temporary test-event code option. Visible form content and the consent banner are outside scope.

## Implementation candidate

- The UUID already created for each contact is reused as CAPI `event_id` and Pixel `eventID`; browser and server use the same standard `Lead` event name.
- The contact save POST sends the current consent choice. CAPI runs only for `granted`; `denied` and unset consent do not call Meta. If a visitor approves later, a capability-protected action loads the already-saved contact on the server; contact fields are not re-sent by the browser.
- Email, phone, first name and last name are normalized and SHA-256 hashed. Phone normalization prefixes local Israeli numbers with 972. Raw client IP is included only when the configured Hostinger proxy header is trusted; user agent and available `_fbp` / `_fbc` cookies are passed un-hashed. Cookie values are bounded/validated.
- The server uses the contact creation timestamp, the homepage URL without query parameters, package name/type, item quantity, ILS, and a server-side current quote after revalidating any submitted active coupon. Coupon text and raw contact fields are excluded from CAPI.
- `META_CAPI_TOKEN` is server-only; optional `META_TEST_EVENT_CODE` is documented for a temporary Events Manager check. Neither is returned by `/api/analytics-config`. Delivery failures do not undo a saved contact. Two attempts per contact are allowed within 48 hours to bound retries/deduplicate.
- Privacy-policy and operating documentation were updated to describe the new server-side disclosure. The UI flow and banner copy were not changed.

## Verification plan and gates

- Unit contract: exact normalized hashes; optional IP/cookie signals; custom data; no raw contact fields; no outbound request when consent is not granted; matching browser/server UUID; bearer token not placed in URL.
- Isolated route integration: SQLite migrations in memory, synthetic contact details, coupon estimate, intercepted Meta fetch; verify denial sends no request and later approval sends the saved event. No real Meta, mail, order, coupon redemption or production contact.
- Candidate build/CI and public verification are recorded below after they complete.
- Final account acceptance is separate: set the real `META_CAPI_TOKEN` in Hostinger secrets; optionally test via Events Manager and remove `META_TEST_EVENT_CODE); verify one deduplicated browser+server Lead, updated `server_last_fired_time`, and actual EMQ. The code cannot promise EMQ ≥6. The Hostinger-overwritten IP header must also be confirmed before enabling IP matching.

## Status

Source changes are prepared from main `1d75cda47c9327dc9ac26977e224f9543e7619cc`. CI, PR, deployment and Events Manager evidence will be appended. Until the secret is set and Meta confirms receipt, production server-side delivery remains inactive/unverified.
