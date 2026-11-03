# Attribution, response promise, performance budget, and structured data — 2026-11-03

## Scope

Implemented candidate changes for briefs 10, 11, 15, and 16 from main `7772a763a9b401cf3d3d94f90f90ddf48d251f13`. PR [#46](https://github.com/atzilul/partyprint/pull/46) is open; the candidate has not yet been merged or verified on production.

## Brief 10 — first-touch attribution

- A first-visit record is kept in `partyprint-first-touch-v1`: UTM source/medium/campaign/content/term, `fbclid`, `fbc`, `fbp`, landing path, timestamp, and referrer.
- `fbc`/`fbp` are collected only when the existing Meta consent policy permits Meta identifiers. UTM and click ID attribution are retained without forwarding Meta cookies when Meta is off.
- `/api/contacts` persists each field in its own nullable column and JSON for compatibility. The final order reads the saved contact attribution rather than replacing first touch with current-page values.
- Manager emails show a single source line plus the retained attribution details. The admin contact view shows the same summary.
- `/lp/bride` redirects to the server-rendered bride variant while keeping UTMs/click IDs and records `/lp/bride` as the first landing path.

## Brief 11 — response promise

- One shared schedule is used in the form, confirmation page, customer email, and the prepared manual WhatsApp reply: Sunday–Thursday, 09:00–19:00 Israel time; response within two hours during business hours; the next working morning outside those hours.
- The confirmation page presents the reference, three next steps, response promise, and WhatsApp link with the reference.
- Admin contact records provide a prepared WhatsApp message with name, reference, quantity, event, and a calculated response deadline. It is opened for a person to send; no automated WhatsApp message is sent.

## Brief 15 — mobile Lighthouse CI

- GitHub Actions builds the site and runs three mobile Lighthouse samples on `/` and `/lp/bride` for pull requests and pushes to `main`. The runner serves the production build through the same Brotli text-compression profile as the existing Hostinger performance laboratory, then applies Lighthouse DevTools mobile throttling (150 ms request latency, 1.6 Mbps down, 750 Kbps up, 4x CPU).
- The workflow asserts median LCP ≤ 2,500 ms, total transfer ≤ 819,200 bytes, and first-load CSS transfer ≤ 61,440 bytes. HTML/JSON Lighthouse reports and a compact summary are uploaded as workflow artifacts.
- Local build and TypeScript checks pass. The local Lighthouse run could not start Chromium because the managed environment denies the browser's debugging socket (`socket() failed: Operation not permitted`). CI measurements are therefore pending. GitHub branch-protection configuration could not be read through the connected integration (403); required-check enforcement remains unverified.

## Brief 16 — structured data

- The visible homepage FAQ and `FAQPage` JSON-LD now use one 13-item source.
- Homepage JSON-LD includes a single-shirt Product/Offer at the configured price (default 180 ILS) with `InStock`, and a group-shirt Product/AggregateOffer using the configured tier range.
- Organization JSON-LD includes `partyprint.co.il` and `hello@partyprint.co.il`; legal name, registration number, and address are omitted until real values replace TODO placeholders.
- Unit tests check the 13 visible/schema FAQs and offer values. Production Rich Results validation is pending.
- Google announced in May 2026 that FAQ rich results no longer appear in Search. FAQ markup can be retained for structured interpretation, but it cannot meet a Google FAQ rich-result display criterion. Product results remain separately testable.

## Local checks

- `node scripts/verify-orders.mjs` — passed with isolated storage; no real email or customer request sent.
- `node scripts/verify-order-mail.mjs` — passed; no real email sent.
- `node --experimental-strip-types --test scripts/attribution-response-schema.test.mjs` — passed (6 tests, including consent-mode cookie filtering and revocation of persisted marketing cookies).
- `npx tsc --noEmit` — passed.
- `npm run build` — passed, including the standalone Node startup marker.
- `git diff --check` — passed.
- Existing production-build performance lab through the Hostinger Brotli model — passed: mobile median LCP 1,392 ms (three identical samples), initial transfer 613,141 bytes. This is not a Lighthouse CI result.
- After moving page-only SEO styles off the homepage, the current production build's Brotli-compressed first-load CSS is 56,221 bytes (56.2 KB), below the 61,440-byte budget. This local byte calculation does not replace the rerun of the Lighthouse CSS assertion.
- The first Lighthouse CI attempt used the raw local server with Lighthouse's default simulated throttling. It reported 9.3–9.7 s LCP and 1.47 MB, including 328 KB of uncompressed CSS; the same build's compressed mobile lab was 1.39–1.42 s and 613 KB. Lighthouse CI is now configured to use the compressed proxy and real DevTools mobile throttling matching the existing lab. Its rerun is pending and remains the acceptance check; local Chromium is unavailable because the managed environment denies the debugging socket.

## Owner-supplied material and decisions still open

- No printed sample photos were fabricated. Existing E01/E02 remain open until the owner supplies 3–4 real printed-shirt samples and confirms rights to publish them.
- Legal business name, registration number, address, and payment method/terms remain TODO in the shared business configuration.
- The ad offer/creative remains a business decision. This implementation does not infer or change that offer.
- The existing consent mode was preserved; this change does not switch the regional notice/strict policy.
- Actual Resend delivery and WhatsApp response capacity have not been tested by sending a real message. The schedule is what the owner specified.

## Release evidence

Pending pull request CI, merge, and production verification. Do not mark the release verified until `/api/release` reports `clean` for the merged commit and the production pages/schema and attribution route have been checked without creating a real lead.
