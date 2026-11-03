# PARTYPRINT analytics

**Google Analytics 4:** account **PARTYPRINT** (`[account identifier omitted]`), property
**PARTYPRINT | partyprint.co.il** (`[account identifier omitted]`), web stream **partyprint.co.il**
(`[account identifier omitted]`), Measurement ID `[account identifier omitted]`. Enhanced Measurement and all
automatic event detection are **off**: every event below is sent deliberately
from `lib/analytics.ts`.

**Meta pixel:** dataset **PartyPrint Website Pixel** `[account identifier omitted]`, the one
assigned to the PartyPrint Meta ad account (`[account identifier omitted]`, business account [identifier omitted]).

## Configuration

Hosting environment (Hostinger): `GA_MEASUREMENT_ID=[account identifier omitted]` and
`META_PIXEL_ID=[account identifier omitted]`. The browser reads only those public IDs from
`GET /api/analytics-config`. The server-side Meta Conversions API uses `META_CAPI_TOKEN` as a secret for
`PageView`, `FormStart`, `FormStep` and `Lead`; it is never returned by that endpoint
and sends under the same permission as the browser pixel (see the consent mode below). Optional
`META_TEST_EVENT_CODE` routes events to Events Manager Test Events during a controlled
check and should be removed afterward. A missing or malformed public ID skips that tag;
missing server credentials leave browser measurement unaffected.

## Consent choices, event queue and Meta modes

- **No notice opens automatically.** The footer's **הגדרות פרטיות ועוגיות** control opens the settings panel; the privacy policy describes processing.
- **Default is CONSENT_MODE=strict.** A PageView is sent while the visitor is undecided. Up to 50 other allowlisted interactions are kept in memory only, in event-time order. **אישור** releases them to GA4 and Meta; **לא, תודה** discards the queue and stops future measurement. Nothing is persisted in the queue.
- **Optional CONSENT_MODE=notice** sends these non-identifying Meta browser events before a choice: PageView, ViewContent, InitiateCheckout and FormStep. It does not send form fields or contact details, and does not send pre-choice server CAPI. Other events wait in the same in-memory queue. Notice mode is not enabled unless an operator sets the environment variable.
- Both modes call fbq('set','autoConfig',false,pixelId) before Pixel init. fbq('consent','grant') is called only after approval. This prevents Meta automatic form-field collection by the site script; account-side Meta settings have not been audited.
- When approved, browser Pixel and server CAPI use the same eventID for supported matching events. Buffered events carry original event_time as a browser event parameter; CAPI also uses it as the actual event timestamp. Meta Pixel itself records the browser receive time at dispatch. A saved Lead uses the saved request UUID. CAPI is skipped unless consent is granted.
- **לא, תודה** drops pending events, stops new GA and Meta events, revokes Meta consent, denies Google consent, and deletes supported _ga*, _gcl_*, _fbp, and _fbc cookies. A refusal is stored in partyprint-consent-v1 for 12 months. Already-sent events are not recalled.
- Never measured: /admin, /track/*, /design/*, /api/* and the Sites sign-in routes.
- The in-memory buffer is capped at 50 events; overflow events are dropped.
- The settings text describes the selected mode and links to /privacy-policy. Amendment 13 is referenced as an implementation note, not as legal approval. The operator should obtain legal review before enabling notice mode.
## GA4 events

| Event | When | Parameters |
| --- | --- | --- |
| `page_view` | Each page/route | standard; `page_location` keeps only `utm_*`, `gclid`, `gbraid`, `wbraid`, `dclid`, `fbclid` |
| `select_package` | A package is chosen (card/CTA or form selector) | `package_type`, `request_mode` |
| `begin_order_request` | First start of the request flow (CTA, form focus or first field) | `request_mode`, `package_type` |
| `form_step` | Each time a form screen is shown | `step_number`, `step_name`, `request_mode` |
| `form_field_complete` | First time a part of the form is completed | `field_name`, `request_mode` |
| `form_submit_attempt` | Final submit button clicked (before validation) | `request_mode`, `package_type` |
| `coupon_apply` | Coupon button result | `coupon_status` (never the code) |
| `form_validation_error` | Client-side check fails | `error_type` |
| `form_submit_error` | `/api/orders` fails | `error_type` (from HTTP status, never the message) |
| `faq_open` | An FAQ answer is opened | `faq_index` |
| `contact_save_attempt` | Explicit contact-save button after field validation | `request_mode`, `package_type` |
| `contact_save_error` | Contact API failed or did not confirm save | `error_type` |
| `complete_order_request` | Only after the complete request is confirmed by `/api/orders` | `request_mode`, `package_type`, `quantity_band`, `coupon_status` |
| **`generate_lead`** | Only after `/api/contacts` confirms saved contact details (legacy completed requests also qualify) | `request_mode`, `package_type`, `quantity_band`, `coupon_status` |

### Form stages

Order requests use three screens: 1 `package` (shirts, quantity and optional event date) → 2 `details` (required name, phone, email) → explicit `contact_save_attempt` → acknowledged contact save → `generate_lead` → 3 `idea` (optional brief/images) → final `form_submit_attempt` → confirmed order save → `/thanks` → `complete_order_request`.

The contact is a separate record, not an order. Saving it does not redeem a coupon or send a customer reminder. Optional sizes remain available throughout and in the private post-save editor (`shirts_optional`); explicit confirmation emits `form_field_complete shirts`. All visible occasions start at four; the same quantity control can reduce to one. One uses the configured unit price; two/three use the first tier; all other quantities use the reached tier.

`trackSavedLead` and `trackSavedCompletion` deduplicate GA and Meta separately using distinct local-tab receipt keys (never transmitted). Meta Pixel and server CAPI share an `eventID` / `event_id` for each `PageView`, `FormStart` and `FormStep`. For Lead, the saved contact UUID is shared between browser and server. The server also suppresses repeat CAPI event IDs for seven days. Late consent may emit the previously unsent Meta browser event and its matching server event without duplicating GA. Failed/unacknowledged contact saves emit no Lead; failed final saves emit no completion. An internal email failure does not invalidate a persisted contact. Reloading an acknowledged contact can recover its receipt within the private capability's 24-hour life.

### Contact events (one name per channel)

| Event | Channel | Key event |
| --- | --- | --- |
| `contact_order_form` | Legacy form-save event; current flow uses `generate_lead` only | no |
| `contact_consult_form` | Legacy consultation-save event; current flow uses `generate_lead` only | no |
| `contact_whatsapp` | Any `wa.me` / WhatsApp link | yes |
| `contact_email` | Any `mailto:` link | yes |
| `contact_phone` | Any `tel:` link (none on the site today) | — |

Key events: `generate_lead`, `contact_whatsapp`, `contact_email`. GA4 and the Meta
browser pixel do not receive contact identifiers, order IDs or coupon codes. The server
CAPI Lead includes an estimated package value and currency, not a payment or transaction ID.

## Meta pixel events

Browser mappings:

- begin_order_request sends standard InitiateCheckout with value, currency, quantity and package name, alongside custom FormStart.
- generate_lead sends standard Lead with the discounted value, ILS, quantity, package content ID and existing package/request parameters.
- complete_order_request sends standard SubmitApplication alongside custom RequestComplete.
- form_step for the details screen includes content_name=details.
- Every Pixel event has a unique eventID. Matching PageView, FormStart, FormStep and Lead events use the same ID in CAPI. The Lead ID is the saved request UUID.

Server CAPI supports PageView, FormStart, FormStep and Lead at /api/events. CAPI sends only after explicit approval in either mode. In notice mode, the three pre-choice Meta behavior events (ViewContent, InitiateCheckout and FormStep) are browser-only until approval; when approval occurs, the queued server events keep their original event_time and matching event IDs. The server supplies action_source=website, a same-site event_source_url, the available trusted client IP, browser user agent and _fbp / _fbc cookies. For Lead only, it reads the saved contact through its private capability and sends SHA-256 hashes of normalized email and Israeli phone. Lead custom data contains the current server-calculated estimate after an applicable discount, ILS, package name/type, package content ID and quantity. It never sends raw contact fields, coupon code or contact token to Meta. The access token is sent in the Authorization header, never in the request URL. When _fbc is not set yet, the server derives it from a valid landing fbclid. CAPI uses the current Graph API version in lib/meta-capi-payload.ts; errors are logged as status and Meta's error message only.

Meta automatic configuration is disabled before Pixel initialization. The site's code does not pass form field values to the browser event API. The historical Events Manager Advanced Matching setting was recorded as enabled in Oct 2026 but has not been rechecked; code and CI cannot confirm the account-side setting.
## Allowed values

Anything else is dropped before sending.

- `package_type`: `family_birthday`, `bride_squad`, `groom_crew`, `team`, `custom`, `single`
- `request_mode`: `order`, `custom`, `lead`
- `quantity_band`: `1-5`, `6-10`, `11-20`, `21-50`, `51-100`
- `coupon_status`: `accepted`, `rejected`, `empty`, `error`, `none`
- `step_number` / `step_name`: `1 package`, `2 details`, `3 idea`; legacy/private size editor `shirts_optional`
- `field_name`: `shirts`, `name`, `phone`, `email`, `event_date`, `brief`, `images`
- `error_type`: `missing_name`, `invalid_phone`, `invalid_email`, `invalid_event_date`,
  `missing_shirt_choice`, `upload_limit`, `network`, `rate_limited`,
  `price_or_coupon_changed`, `files_too_large`, `validation_rejected`,
  `request_rejected`, `server_unavailable`, `no_confirmation`, `unknown`
- `cta_location`: `header`, `hero`, `package`, `size_help`, `order_form`,
  `confirmation`, `contact`, `footer`, `policy`, `content`, `other`
- `faq_index`: 1–60 (position of the FAQ item on the page)

These parameters are registered as event-scoped custom dimensions in GA4.

Never sent as GA4 or custom event parameters by our code: names, emails, phones, free text
(brief), order IDs, tracking links, coupon codes, design text, uploaded file names,
User-ID or user properties. The opaque contact UUID is sent only in Meta's Lead
eventID option and the matching CAPI event_id for deduplication; it is not a GA4
parameter. Same-site referrers are reduced to a non-excluded path; external referrers
to their origin.

## GA4 property settings

Data retention 14 months; Internal Traffic (owner IP) and Developer traffic
filters active; Search Console linked; user-provided data collection off.
Exploration **PARTYPRINT - Lead funnel** and **PARTYPRINT - Order form stages**.

## Verifying

Add `?ga_debug=1` to a public URL and watch Admin → DebugView. Do not submit a
real order to test `generate_lead`; it is verified against a disposable local
server with Google and Meta requests blocked (scratch test).

## Campaign offer and public QA (Q02)

A source plus paid UTM medium qualifies this tab for a server-verified public promotion; `fbclid` alone does not. `/api/promo` supplies the active code, and `/api/pricing` checks quantity, package, dates, uses and subtotal. The top banner displays the active owner-managed promoText and code from `/api/promo`; the campaign rule controls automatic application in the form. Only confirmed discounts show an applied badge; codes never go to measurement.

The release acceptance record is [quote-request-flow.md](quote-request-flow.md). Public browser QA stubs order/tracking writes and vendor calls; the separate public pricing quote is non-mutating. Exact deployment receipt, external tag account delivery, Advanced Matching and actual end-to-end mail are separate evidence, not inferred from these mocks.

## Q03 — visible optional sizes (2026-11-02)

Both request screens now expose an optional size/color dialog. Explicit confirmation emits the existing allowlisted form_field_complete(shirts); opening/cancelling the dialog neither submits nor generates a Lead. Customers can still save without sizes, and confirmed selections are stored with any request mode. The post-save editor remains optional form_step3 shirts_optional. Its version/current-quantity refresh and bulk Undo do not create another request or Lead. Consent/region/refusal rules are unchanged. See [form-ux-plan.md](form-ux-plan.md) for public-source, API, browser and testing limits; no external analytics-account setting or real vendor delivery was verified by these mocks.

## Q04 — contact captured before optional idea (2026-11-02)

The new flow supersedes Q02/Q03 screen-order descriptions above. Required email is validated on both contact and final endpoints. Early Lead and completed-request metrics are separate; external GA4 key-event/account changes and real Meta/Resend delivery have not been verified. Isolated API/browser fixtures block actual recipients and production writes. See [contact-capture.md](contact-capture.md).
