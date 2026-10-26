# PARTYPRINT analytics

**Google Analytics 4:** account **PARTYPRINT** (`413432250`), property
**PARTYPRINT | partyprint.co.il** (`560706114`), web stream **partyprint.co.il**
(`16206966493`), Measurement ID `G-V3QDR0W4WK`. Enhanced Measurement and all
automatic event detection are **off**: every event below is sent deliberately
from `lib/analytics.ts`.

**Meta pixel:** dataset **PartyPrint Website Pixel** `2241332043403463`, the one
assigned to the PartyPrint Meta ad account (`1810776440065682`, business
theai.family).

## Configuration

Hosting environment (Hostinger): `GA_MEASUREMENT_ID=G-V3QDR0W4WK` and
`META_PIXEL_ID=2241332043403463`. The browser reads both from
`GET /api/analytics-config`. A missing or malformed ID simply skips that tag.

## Notice, opt-out and the Meta region rule

- **Google Analytics** and the first-party `/api/events` counter run on public
  pages by default (owner's decision, Oct 2026: maximum data, with notice and
  opt-out). Unchanged by the Meta rule below.
- **Meta pixel, by region** (`metaModeFor` in `lib/analytics.ts`):
  - **Israel, "notice" mode:** the pixel loads on entry and may send `PageView`
    before any choice. Every other Meta event (ViewContent, InitiateCheckout,
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
- **Privacy policy:** `/privacy-policy` (draft pending legal approval; the old
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
| **`generate_lead`** | Only after `/api/orders` returns the saved request | `request_mode`, `package_type`, `quantity_band`, `coupon_status` |

### Form stages

Order requests (`request_mode` = `order` or `custom`):
`form_step` 1 package → 2 shirts → `form_field_complete` shirts → `form_step` 3 details →
`form_field_complete` name / phone / email (optional: event_date, brief, images) →
`form_submit_attempt` → `generate_lead`.

Consultations (`request_mode` = `lead`) start at `form_step` 3 details.

### Contact events (one name per channel)

| Event | Channel | Key event |
| --- | --- | --- |
| `contact_order_form` | Order request saved by the server (fires with `generate_lead`) | no (counted by `generate_lead`) |
| `contact_consult_form` | Consultation request saved by the server (fires with `generate_lead`) | no (counted by `generate_lead`) |
| `contact_whatsapp` | Any `wa.me` / WhatsApp link | yes |
| `contact_email` | Any `mailto:` link | yes |
| `contact_phone` | Any `tel:` link (none on the site today) | — |

Key events: `generate_lead`, `contact_whatsapp`, `contact_email`. No value,
currency or transaction ID is sent.

## Meta pixel events

`PageView` (each page), `ViewContent` (`select_package`), `InitiateCheckout`
(`begin_order_request`), `Lead` (`generate_lead`), `Contact` (WhatsApp / email /
phone, `content_name` = channel), and custom `FormStep` / `FormSubmitAttempt`.
Parameters are the same allowlisted values as GA (`content_category` = package
type or CTA location). Before a choice, only `PageView` and only in the Israel
notice mode (see above).

**Advanced Matching:** not configured in code, but *Automatic advanced matching*
is **on** in Events Manager for this dataset (enabled Oct 26, 2026, with email,
phone, name, city/state/ZIP, country, date of birth and external ID). When the
pixel is active, Meta's own script may hash contact fields it finds on the page
and send them. The privacy policy says so. Traffic permissions: allow list
`partyprint.co.il` and its subdomains.

## Allowed values

Anything else is dropped before sending.

- `package_type`: `family_birthday`, `bride_squad`, `groom_crew`, `team`, `custom`
- `request_mode`: `order`, `custom`, `lead`
- `quantity_band`: `1-5`, `6-10`, `11-20`, `21-50`, `51-100`
- `coupon_status`: `accepted`, `rejected`, `empty`, `error`, `none`
- `step_number` / `step_name`: `1 package`, `2 shirts`, `3 details`
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
