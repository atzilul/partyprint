# PARTYPRINT order operations

## Current flow
The public form writes private reference originals and a summary to R2 and inserts every order in D1 before notification. An unavailable mail provider does not lose the order. Automatic WhatsApp delivery is no longer part of submission.

Resend emails go to the configured owner and current team managers (deduplicated). The branded Hebrew RTL template contains escaped order fields, a direct customer WhatsApp link, an authenticated admin link, and a protected ZIP download link. Designers and printers are excluded. Files are linked rather than attached to reduce message size. Bundle links default to 7 days, configurable with PARTYPRINT_BUNDLE_LINK_DAYS. Multiple mail links coexist and show the current saved order and images. Internal notes are excluded from the download and email. Mail provider acceptance does not prove inbox delivery or reading.

## Mail activation, still required
See [Resend activation](resend-activation.md) for domain verification, Hostinger variables and the delivery check. The admin settings panel reports configuration presence and recipients, not provider verification.

Configure RESEND_API_KEY as a secret and MAIL_FROM as an authorized sender using hosted environment settings. Keep credentials out of source and chat. No provider credentials were available during this implementation, so no actual mail was sent. After activation, use the admin retry action for a test order and verify the email, WhatsApp destination, and ZIP manually. Retry is throttled per order to one attempt per minute.

## Administration
/admin uses platform ChatGPT sign-in and a server allowlist managed by atzilul@gmail.com. All admin APIs recheck identity and current membership; mutations additionally require the same origin. Anonymous public visitors retain access to the landing page and form only. Never trust identity passed in request bodies. The deployment dispatcher owns trusted identity headers.

Orders use indexed D1 storage with a JSON document, status, timestamps, and a version number. Optimistic conditional updates reject stale writes. The editor preserves unsaved input on failure and offers an explicit reload. History keeps the most recent 300 changes. Older R2-only orders are imported through an owner-only, paginated, insert-only sync when opening management; existing D1 edits are never overwritten.

Stages: received, designing, review, approved, printing, printed, shipped.
Customer fields, brief, address, target date, tracking, notes, package, quantity, shirts, price and revision count are editable. Adjusted prices require a note. Additional revision amounts are shown but never silently added to the agreed price. Sending a customer WhatsApp message is an explicit owner action, not automatic and not recorded as delivery.

## Files
Public form: up to 10 originals, 5MB per file, 15MB total. Admin: up to 20 images per order and 30MB retained total, at most 10 files/15MB per upload. JPG/PNG/WEBP signatures and sizes are checked on the server. References, design previews and print images can be categorized. Replacement uses remove + add + save. Removed images are deleted from R2 after the D1 update succeeds. New uncommitted objects are cleaned up when a save fails. R2 and D1 have no shared transaction; rare cleanup failure can leave private, unreferenced objects.

## Validation
Typecheck and production build. Integration test uses real in-memory SQLite with all generated migrations, mock R2 and mocked mail provider. Covers owner access rejection, origin rejection, missing selections, price validation, conflicting edits, add/remove image bytes, protected ZIP, multiple access grants, escaped HTML mail and customer WhatsApp URL, and non-overwriting legacy import. No production mail or browser UI test was performed.

## Pricing, promotions and analytics
Owner-only settings maintain one versioned quantity ladder shared by all packages. The initial ladder is 4+ shirts at 110 NIS each, 6+ at 105, 8+ at 100, 10+ at 95, 15+ at 93 and 20+ at 90. Every public total is quantity × the matching per-shirt tier, rounded in agorot; the displayed unit price includes design, printing and home delivery. Legacy single-shirt settings migrate to the new default ladder. Public totals and order creation fetch this price book. Existing orders keep their saved amount. Price changes while a form is open cause a review prompt rather than accepting an outdated total.

Coupons support fixed or percentage reductions, package scope, minimum subtotal/quantity, Israel-date boundaries, activation and maximum usages. One code per request; usage counts a saved request, not payment. Coupon capacity is claimed and the order inserted atomically in one D1 batch. Invalid/stale/fully-used coupons never create a discounted order. Admin edits do not automatically reapply old coupon benefits. Code history is retained by disabling instead of deleting codes.

Analytics use actual stored orders: daily count, request value (not revenue), shirt quantity, package distribution, stages, discount usage. An anonymous aggregate event counter measures page loads and start buttons from this release forward, with per-IP hourly throttling; no cookies or unique-user tracking. Page events use Israel dates; order daily groups use UTC. There is no historic visitor data or attribution.

Extra integration checks: settings conflicts, price bounds, dynamic totals, atomic coupon redemption and exhausted-code race, date/minimum constraints, forged expected price rejection, and owner-only analytics queried from SQLite.

## Daily operations
The order list supports target-date ranges, overdue/today/open/consultation/missing-mail filters, and sorting by creation, update, target date, or value. Counts use the Israel calendar. CSV export uses the same filters across all pages (maximum 5,000 rows), is owner-only and private/no-store, and neutralizes spreadsheet formula prefixes. Notes and images are not embedded in CSV; per-order ZIP remains available. Admin links retain the selected order through login. Mobile order cards use a readable single column. Missing customer fields or shirt choices direct the editor to the matching tab before saving.

## Stage board and follow-up
The stage board loads and paginates each stage independently with the current search and filters. Quick actions advance one stage with confirmation, download the saved ZIP, or open a drafted WhatsApp message. The follow-up list selects review orders with no update or recorded follow-up for 72 hours. Marking follow-up is a manual management action, never proof of message delivery. Actions are owner-only, same-origin, bounded, version-checked, and append order history. No automatic WhatsApp messages are sent.

## Customer approval and production
The production editor creates a 30-day bearer link for an immutable copy of explicitly selected design/print images and a snapshot of shirt quantities, sizes and colors. A new link revokes the previous link. The token is shared in a URL fragment and the server stores only its hash; public API replies are no-store and expose no contact details, payments or internal notes. Anyone holding the link can respond, so it must be shared privately. Approval records the entered name, comment, revision ID and timestamp; correction requests return the order to design without charging for a revision automatically.
Changing selected source images, image roles, quantity or shirt selections invalidates approval. Production-stage advancement and the print ZIP require current customer approval. The ZIP includes only the immutable approved images and a grouped shirt specification, not reference photos or financial/customer contact records. Check technical print suitability and placement separately.
Payments are an append-only manual ledger of deposits, payments and refunds with amount, method, reference and timestamp. Refunds cannot exceed net recorded receipts. Changes are owner-only and version-checked, and do not charge cards, transfer refunds or issue tax documents. Existing order amounts are retained; balance and net receipts also appear in CSV export. No real customer messages or payments were sent during testing.

## Team access
The owner account atzilul@gmail.com alone can add or remove up to 30 team members by the email of their personal ChatGPT account in the Team and permissions tab. Members can manage orders, designs, payments, pricing, coupons and analytics, but cannot manage access. Team data and a bounded access-change history use versioned studio_settings records; no new SQL migration is required. No invitation is sent automatically: the owner shares the admin URL. Membership is rechecked for every admin API request, including after removal. Previously downloaded files cannot be recalled. Order mutations record the authenticated staff email in history. The owner cannot remove their own access.
