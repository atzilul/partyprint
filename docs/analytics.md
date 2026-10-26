# PARTYPRINT analytics

GA4 account **PARTYPRINT** (`413432250`), property **PARTYPRINT | partyprint.co.il**
(`560706114`), web stream **partyprint.co.il** (`16206966493`), Measurement ID
`G-V3QDR0W4WK`. Enhanced Measurement is **off**: every event below is sent
deliberately from `lib/analytics.ts`.

## Configuration

Set `GA_MEASUREMENT_ID=G-V3QDR0W4WK` in the hosting environment. The browser
reads it from `GET /api/analytics-config` only after the visitor opts in. If the
variable is missing or malformed, no Google tag loads; the consent banner and the
first-party `/api/events` counter keep working.

## Consent

- Nothing loads and nothing is sent (Google tag, `/api/events`) until the visitor
  clicks **מאשרים סטטיסטיקה**. **לא, תודה** keeps everything off.
- The choice is stored in `localStorage` (`partyprint-consent-v1`) for 12 months.
  **הגדרות פרטיות ועוגיות** at the bottom of every public page reopens the banner.
  Withdrawing sets `ga-disable-<ID>`, updates consent to denied and deletes `_ga*` cookies.
- Actions taken before a decision stay in memory only. They are sent after an
  accept and discarded on a reject or when the page closes.
- Consent mode defaults: `analytics_storage` granted (after opt-in), all ad
  storage/personalization denied. Google signals and ad personalization are off.
- Ordering, uploads and WhatsApp work identically without consent.
- Not measured at all: `/admin`, `/track/*`, `/design/*`, `/api/*` and the Sites
  sign-in routes (no banner, no tag, no events).

## Events

| Event | When | Parameters |
| --- | --- | --- |
| `page_view` | After opt-in, then per route | standard; `page_location` keeps only `utm_*`, `gclid`, `gbraid`, `wbraid`, `dclid` |
| `select_package` | A package is chosen (card/CTA or form selector) | `package_type`, `request_mode` |
| `begin_order_request` | First start of the request flow (CTA or form focus) | `request_mode`, `package_type` |
| `form_step` | Wizard step changes | `step_number`, `step_name` |
| `coupon_apply` | Coupon button result | `coupon_status` (never the code) |
| `click_whatsapp` | Any `wa.me` link | `cta_location` |
| `form_validation_error` | Client-side check fails | `error_type` |
| `form_submit_error` | `/api/orders` fails | `error_type` (from HTTP status, never the message) |
| `faq_open` | An FAQ answer is opened | `faq_index` |
| **`generate_lead`** | Only after `/api/orders` returns the saved request | `request_mode`, `package_type`, `quantity_band`, `coupon_status` |

`generate_lead` is the only active key event (no default value; GA's built-in
`purchase` stays unused). No revenue, value, currency or transaction ID is sent.

Allowed values (anything else is dropped before sending):

- `package_type`: `family_birthday`, `bride_squad`, `groom_crew`, `team`, `custom`
- `request_mode`: `order`, `custom`, `lead`
- `quantity_band`: `1-5`, `6-10`, `11-20`, `21-50`, `51-100`
- `coupon_status`: `accepted`, `rejected`, `empty`, `error`, `none`
- `step_number` / `step_name`: `1 package`, `2 shirts`, `3 details`
- `error_type`: `missing_name`, `invalid_phone`, `invalid_email`, `invalid_event_date`,
  `missing_shirt_choice`, `upload_limit`, `network`, `rate_limited`,
  `price_or_coupon_changed`, `files_too_large`, `validation_rejected`,
  `request_rejected`, `server_unavailable`, `no_confirmation`, `unknown`
- `cta_location`: `header`, `hero`, `package`, `size_help`, `order_form`,
  `confirmation`, `contact`, `footer`, `policy`, `content`, `other`
- `faq_index`: 1–60 (position of the FAQ item on the page)

These parameters are registered as event-scoped custom dimensions in GA4.

Never sent: names, emails, phones, free text (brief), order or request IDs,
tracking links, coupon codes, design text, uploaded file names, User-ID or user
properties. Same-site referrers are reduced to a non-excluded path; external
referrers to their origin.

## Verifying

Add `?ga_debug=1` to a public URL, accept analytics, and watch
Admin → DebugView. Do not submit a real order to test `generate_lead`; it was
verified against a disposable local server with Google requests blocked.
