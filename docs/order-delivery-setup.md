# PARTYPRINT order operations

## Current flow
The public form writes private reference originals and a summary to R2 and inserts every order in D1 before notification. An unavailable mail provider does not lose the order. Automatic WhatsApp delivery is no longer part of submission.

Resend emails to atzilul@gmail.com contain an escaped HTML summary, a direct customer WhatsApp link, an owner-only admin link, and a protected ZIP download link. Files are linked rather than attached to reduce message size. Each random link lasts 30 days. Multiple mail links coexist and show the current saved order and images. Internal notes are excluded from the download and email. Mail provider acceptance does not prove inbox delivery or reading.

## Mail activation, still required
Configure RESEND_API_KEY as a secret and MAIL_FROM as an authorized sender using hosted environment settings. Keep credentials out of source and chat. No provider credentials were available during this implementation, so no actual mail was sent. After activation, use the admin retry action for a test order and verify the email, WhatsApp destination, and ZIP manually. Retry is throttled per order to one attempt per minute.

## Administration
/admin uses the platform ChatGPT sign-in and a server allowlist for atzilul@gmail.com. All admin APIs recheck identity; mutations additionally require the same origin. Anonymous public visitors retain access to the landing page and form only. Never trust identity passed in request bodies. The deployment dispatcher owns trusted identity headers.

Orders use indexed D1 storage with a JSON document, status, timestamps, and a version number. Optimistic conditional updates reject stale writes. The editor preserves unsaved input on failure and offers an explicit reload. History keeps the most recent 300 changes. Older R2-only orders are imported through an owner-only, paginated, insert-only sync when opening management; existing D1 edits are never overwritten.

Stages: received, designing, review, approved, printing, printed, shipped.
Customer fields, brief, address, target date, tracking, notes, package, quantity, shirts, price and revision count are editable. Adjusted prices require a note. Additional revision amounts are shown but never silently added to the agreed price. Sending a customer WhatsApp message is an explicit owner action, not automatic and not recorded as delivery.

## Files
Public form: up to 10 originals, 5MB per file, 15MB total. Admin: up to 20 images per order and 30MB retained total, at most 10 files/15MB per upload. JPG/PNG/WEBP signatures and sizes are checked on the server. References, design previews and print images can be categorized. Replacement uses remove + add + save. Removed images are deleted from R2 after the D1 update succeeds. New uncommitted objects are cleaned up when a save fails. R2 and D1 have no shared transaction; rare cleanup failure can leave private, unreferenced objects.

## Validation
Typecheck and production build. Integration test uses real in-memory SQLite with all generated migrations, mock R2 and mocked mail provider. Covers owner access rejection, origin rejection, missing selections, price validation, conflicting edits, add/remove image bytes, protected ZIP, multiple access grants, escaped HTML mail and customer WhatsApp URL, and non-overwriting legacy import. No production mail or browser UI test was performed.

## Pricing, promotions and analytics
Owner-only settings maintain versioned package prices, standalone quantity prices and extra-shirt price. Public totals and order creation fetch this price book. Existing orders keep their saved amount. Price changes while a form is open cause a review prompt rather than accepting an outdated total.

Coupons support fixed or percentage reductions, package scope, minimum subtotal/quantity, Israel-date boundaries, activation and maximum usages. One code per request; usage counts a saved request, not payment. Coupon capacity is claimed and the order inserted atomically in one D1 batch. Invalid/stale/fully-used coupons never create a discounted order. Admin edits do not automatically reapply old coupon benefits. Code history is retained by disabling instead of deleting codes.

Analytics use actual stored orders: daily count, request value (not revenue), shirt quantity, package distribution, stages, discount usage. An anonymous aggregate event counter measures page loads and start buttons from this release forward, with per-IP hourly throttling; no cookies or unique-user tracking. Page events use Israel dates; order daily groups use UTC. There is no historic visitor data or attribution.

Extra integration checks: settings conflicts, price bounds, dynamic totals, atomic coupon redemption and exhausted-code race, date/minimum constraints, forged expected price rejection, and owner-only analytics queried from SQLite.

## Daily operations
The order list supports target-date ranges, overdue/today/open/consultation/missing-mail filters, and sorting by creation, update, target date, or value. Counts use the Israel calendar. CSV export uses the same filters across all pages (maximum 5,000 rows), is owner-only and private/no-store, and neutralizes spreadsheet formula prefixes. Notes and images are not embedded in CSV; per-order ZIP remains available. Admin links retain the selected order through login. Mobile order cards use a readable single column. Missing customer fields or shirt choices direct the editor to the matching tab before saving.
