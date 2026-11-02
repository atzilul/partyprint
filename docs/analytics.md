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
`META_PIXEL_ID=[account identifier omitted]`. The browser reads both from
`GET /api/analytics-config`. A missing or malformed ID simply skips that tag.

## Notice, opt-out and the Meta region rule

- **Google Analytics** and the first-party `/api/events` counter run on public
  pages by default (owner's decision, Oct 2026: maximum data, with notice and
  opt-out). Unchanged by the Meta rule below.
- **Meta pixel, by region** (`metaModeFor` in `lib/analytics.ts`):
  - **Israel, "notice" mode:** the pixel loads on entry and may send `PageView`
    before any choice. Every other Meta event (ViewContent, FormStart,
    Lead, Contact, FormStep, FormSubmitAttempt) is sent only after **אישור**.
  - **Everywhere else, including the EU, and whenever the region cannot be
    identified, "strict" mode:** the pixel is not loaded at all until **אישור**.
  - Our code sends `PageView` itself on each route change (`fbq.disablePushState`
    stops Meta's own history-based PageView, which would duplicate it and could
    fire on excluded paths). When the pixel loads before a choice, Meta's
    automatic configuration (detected button clicks, page metadata) is switched
    off with `fbq('set', 'autoConfig', false, id)` before `init`.
  - Region signal: a country from `PARTYPRINT_TRUSTED_COUNTRY_HEADER` (only if the
    hosting edge is confirmed to overwrite that header) wins; otherwise the
    browser time zone, where only `Asia/Jerusalem` / `Asia/Tel_Aviv` count as
    Israel. No signal or any other zone means strict.
- The notice text differs per mode and links to `/privacy-policy`. It never
  promises that already-sent events are deleted.
- **לא, תודה** stops GA, further Meta events and `/api/events` in that browser,
  revokes Meta consent, denies Google consent and deletes `_ga*`, `_gcl_*`,
  `_fbp` and `_fbc` cookies. **הגדרות פרטיות ועוגיות** at the bottom of every
  public page reopens the notice. The choice is stored in `localStorage`
  (`partyprint-consent-v1`) for 12 months.
- Google consent mode: everything granted unless the visitor opts out.
- Never measured: `/admin`, `/track/*`, `/design/*`, `/api/*` and the Sites
  sign-in routes (no notice, no tags, no events).
- **Privacy policy:** `/privacy-policy` (describes implemented processing; legal review and operator identity are not verified; the old
  `/policies/privacy` URL permanently redirects there). Linked from the notice,
  the footer of every public page and the sitemap.

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

`trackSavedLead` and `trackSavedCompletion` deduplicate GA and Meta separately using distinct local-tab receipt keys (never transmitted). Completion reuses the contact ID, preventing another Lead. Late consent may emit the previously unsent Meta event without duplicating GA. Failed/unacknowledged contact saves emit no Lead; failed final saves emit no completion. An internal email failure does not invalidate a persisted contact. Reloading an acknowledged contact can recover its receipt within the private capability's 24-hour life.

### Contact events (one name per channel)

| Event | Channel | Key event |
| --- | --- | --- |
| `contact_order_form` | Legacy form-save event; current flow uses `generate_lead` only | no |
| `contact_consult_form` | Legacy consultation-save event; current flow uses `generate_lead` only | no |
| `contact_whatsapp` | Any `wa.me` / WhatsApp link | yes |
| `contact_email` | Any `mailto:` link | yes |
| `contact_phone` | Any `tel:` link (none on the site today) | — |

Key events: `generate_lead`, `contact_whatsapp`, `contact_email`. No value,
currency or transaction ID is sent.

## Meta pixel events

`PageView` (each page), `ViewContent` (`select_package`), custom `FormStart`
(`begin_order_request`; a quote request is not a checkout), `Lead` (`generate_lead`), `Contact` (WhatsApp / email /
phone, `content_name` = channel), and custom `FormStep` / `FormSubmitAttempt` / `RequestComplete` (`complete_order_request`).
Parameters are the same allowlisted values as GA (`content_category` = package
type or CTA location). Before a choice, only `PageView` and only in the Israel
notice mode (see above).

**Advanced Matching:** not configured in code, but *Automatic advanced matching*
was recorded as **on** in Events Manager for this dataset (enabled Oct 26, 2026, with email,
phone, name, city/state/ZIP, country, date of birth and external ID). This is a historical account note; Q02 did not verify or change that dataset setting. The allowlist tests verify our code's event payloads with vendors stubbed, not Meta's account-side automatic collection. When the
pixel is active, Meta's own script may hash contact fields it finds on the page
and send them. The privacy policy says so. Traffic permissions: allow list
`partyprint.co.il` and its subdomains.

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

Never sent by our code: names, emails, phones, free text (brief), order or request
IDs, tracking links, coupon codes, design text, uploaded file names, User-ID or
user properties. Same-site referrers are reduced to a non-excluded path; external
referrers to their origin.

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
