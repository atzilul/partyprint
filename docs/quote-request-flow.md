# Q02 — Order request before optional sizes

Date: 2026-11-02. Implementation candidate; not yet a production acceptance record.

The user approved one shirt at ILS 180 including design, printing and delivery, with no fixed response SLA. Group packs remain 4–100; 2–3 are not offered. No payment is collected by the form.

Baseline main: 5808a2ff9b06ed0fd073b5e9a0a86536686963b5. Public release was clean at 08:33:56 UTC, same commit, fingerprint fb4d18b5153c66ef1b832ec222c0bf09d76faa168868d8885f73f64961a14258. [Read-only baseline](https://github.com/atzilul/partyprint/actions/runs/41413932009/job/125173108277): 320, 390 and 430px. Price inclusion text was only 37px at 320/390. Apply-to-all worked 3/3; no claim that a bulk-selection bug reproduced. All writes blocked.

## Intended behavior

- Step 1: package, quantity and optional event date. A separate single-shirt SKU is fixed at 1, default ILS180; group ladders keep floor-tier pricing. The planning helper subtracts five Sunday–Thursday days, explicitly excludes design time, does not adjust holidays, and does not confirm delivery. Shipping exceptions and capacity still need studio confirmation.
- Step 2: required name/phone, optional email, brief and up to10 photos. Existing file limits and server validation remain. Successful DB save is the prerequisite for a receipt and Lead. Staff email failure never means the saved request is lost. With no customer email, reply_to is omitted and customer mail is not attempted.
- /thanks: noindex; tab-local receipt, reference, next steps, private tracking capability and WhatsApp message containing the reference. No personal contact data, brief or filenames in the receipt. Direct visits without a receipt do not claim success. The private capability is not in the thanks URL or measurement.
- Optional sizes: adult M/black defaults appear only after choosing the editor; no defaults are sent as confirmed specifications until explicit save. Each shirt supports adult S–XL or all9 child ages and 3 colors; bulk uses latest state. A same-origin, bounded, capability-protected PATCH updates the same saved request with optimistic versioning. Quantity, price and contacts cannot be changed there. Editing stops at review/advanced production. Pending sizes cannot request design approval or reach production-ready.
- Analytics: quote start is custom Meta FormStart, not InitiateCheckout. GA generate_lead and Meta Lead deduplicate separately for the local receipt, respecting existing refusal/region/consent policy, including consent after the saved receipt. No order identifiers or personal values go to vendors. No Purchase event.
- Paid campaign offer: UTM source plus medium cpc/ppc/paid/paid_social/paid-social/paidsocial/display/cpm qualifies within this tab. A click id alone does not. Example: ?utm_source=meta&utm_medium=paid_social&utm_campaign=launch. The active public promotion and every quote are server-validated; the badge is shown only for a confirmed discount. Constraints, dates and usage are preserved. Manual coupon input remains; quantity changes replace the quote. The top banner communicates included value without exposing a coupon code.
- FAQ, ordering guide and llms briefs explain one-shirt price and optional sizes. Existing runtime orders, uploads, coupons and group prices are not overwritten.

## Verification and release

Required before acceptance: typecheck, existing unit suites, actual-route SQLite/bucket API tests (no external mail), production build, search/release checks, mobile/desktop order/quantity/measurement browser tests with every write intercepted, and existing hashed-media regressions. Check failed save, missing save confirmation, direct thanks, refresh dedup, late consent, single/group price rules, upload limits, size capability/version/status and mobile layout. Public acceptance requires matching clean source fingerprint plus the same UI tests. Hostinger's exact deployment receipt, Sites28 sync and Resend domain status remain separate.

Initial broader typecheck also exposed existing empty-logo-link children typing and admin team avatar view typing; small type-only corrections make the complete typecheck reviewable without suppressing it.
