# Q05 — Meta Conversions API לאירועי האתר

Date: 2026-11-03

## Request

P0 work to forward Meta PageView, FormStart, FormStep and Lead from /api/events,
deduplicated against the browser Pixel, only after explicit consent. Use the current
Graph API version. Lead includes hashed email and Israeli phone, event context,
optional Test Events routing and no client-visible token. The only unrelated visible
change is removal of ״עיצוב אישי לקבוצה שלכם״ from the top bar.

## Implementation

- Browser UUIDs are sent as Pixel eventID and the same CAPI event_id. Lead uses the
  saved contact UUID; PageView, FormStart and FormStep each generate a separate UUID.
- /api/events validates same-origin requests, event names, UUIDs, consent and the Lead
  capability. It returns without waiting for Graph API and caps the Graph request at
  three seconds. Event IDs are claimed atomically and retained for seven days.
- The server reads Lead contact fields from saved contact storage, normalizes email
  and phone (local Israeli mobile numbers use country code 972), then sends only their
  SHA-256 hashes. It sends trusted IP only from the configured header after validation,
  plus user agent and available _fbp / _fbc cookies.
- Lead value, ILS, package name/type and quantity come from saved server-side details
  and pricing. Raw contact fields, coupon codes and client form text do not go into
  the Meta event.
- The server calls Graph API v26.0 with META_CAPI_TOKEN in the requested query
  parameter. The token is server-only and never logged or returned to the browser.
  Graph errors log only HTTP status and Meta's error.message. Optional
  META_TEST_EVENT_CODE is included only when configured.
- The user reports Hostinger has META_PIXEL_ID, META_CAPI_TOKEN, META_TEST_EVENT_CODE
  and PARTYPRINT_TRUSTED_IP_HEADER=x-real-ip configured. That report is not a Hostinger
  receipt; the code uses those variables at runtime.
- Privacy disclosure describes server forwarding and Lead hashing. The top bar removes
  only the requested phrase; the form and consent/banner behavior are unchanged.

## Verification

- Unit tests cover supported payloads, URL sanitization, email/Israeli phone hashing,
  consent gating, token placement/redaction and event-ID deduplication.
- Isolated route integration uses synthetic contacts, in-memory SQLite and intercepted
  Graph API fetches. It checks all four events, shared IDs, trusted IP, cookie context,
  server-calculated Lead data, and duplicate/denied-event suppression.
- Browser contract checks compare Pixel eventID values against mocked /api/events
  payloads and verify consent refusal prevents CAPI calls. CI sends no real Meta
  requests or customer messages.

## Remaining account checks

CI and source tests cannot confirm the actual Hostinger runtime, Meta Test Events,
server_last_fired_time, one-event browser/server deduplication, or EMQ. After merge,
check /api/release against main and Events Manager Test Events. Remove
META_TEST_EVENT_CODE after the controlled check. Hostinger's deployment receipt
remains separate evidence.