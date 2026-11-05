# Q02 — Order request before optional sizes

Date: 2026-11-02. Implementation and public source/behavior verified; Hostinger's exact receipt remains unverified.

The user approved one shirt at ILS 180 including design, printing and delivery, with no fixed response SLA. Group packs remain 4–100; 2–3 are not offered. No payment is collected by the form.

Baseline main: 5808a2ff9b06ed0fd073b5e9a0a86536686963b5. Public release was clean at 08:33:56 UTC, same commit, fingerprint fb4d18b5153c66ef1b832ec222c0bf09d76faa168868d8885f73f64961a14258. [Read-only baseline](https://github.com/atzilul/partyprint/actions/runs/41413932009/job/125173108277): 320, 390 and 430px. Price inclusion text was only 37px at 320/390. Apply-to-all worked 3/3; no claim that a bulk-selection bug reproduced. All writes blocked.

## Intended behavior

- Step 1: package, quantity and optional event date. A separate single-shirt SKU is fixed at 1, default ILS180; group ladders keep floor-tier pricing. The planning helper subtracts five Sunday–Thursday days, explicitly excludes design time, does not adjust holidays, and does not confirm delivery. Shipping exceptions and capacity still need studio confirmation.
- Step 2: required name/phone, optional email, brief and up to10 photos. Existing file limits and server validation remain. Successful DB save is the prerequisite for a receipt and Lead. Staff email failure never means the saved request is lost. With no customer email, reply_to is omitted and customer mail is not attempted.
- /thanks: noindex; tab-local receipt, reference, next steps, private tracking capability and WhatsApp message containing the reference. No personal contact data, brief or filenames in the receipt. Direct visits without a receipt do not claim success. The private capability is not in the thanks URL or measurement.
- Optional sizes: adult M/black defaults appear only after choosing the editor; no defaults are sent as confirmed specifications until explicit save. Each shirt supports adult S–XL or all9 child ages and 3 colors; bulk uses latest state. A same-origin, bounded, capability-protected PATCH updates the same saved request with optimistic versioning. Quantity, price and contacts cannot be changed there. Editing stops at review/advanced production. Pending sizes cannot request design approval or reach production-ready.
- Analytics: quote start is standard Meta InitiateCheckout next to custom FormStart (since Nov 2026; before that FormStart only). GA generate_lead and Meta Lead deduplicate separately for the local receipt, respecting existing refusal/region/consent policy, including consent after the saved receipt. New event payloads contain no order identifiers or personal values. Meta's account-side Advanced Matching setting was not changed or verified here; the historical account note in docs/analytics.md records it as enabled, so code allowlist tests are not proof of zero automatic collection by the external vendor. No Purchase event.
- Paid campaign offer: UTM source plus medium cpc/ppc/paid/paid_social/paid-social/paidsocial/display/cpm qualifies within this tab. A click id alone does not. Example: ?utm_source=meta&utm_medium=paid_social&utm_campaign=launch. The active public promotion and every quote are server-validated; the badge is shown only for a confirmed discount. Constraints, dates and usage are preserved. Manual coupon input remains; quantity changes replace the quote. The top banner communicates included value without exposing a coupon code.
- FAQ, ordering guide and llms briefs explain one-shirt price and optional sizes. Existing runtime orders, uploads, coupons and group prices are not overwritten.

## Verification and release

Required before acceptance: typecheck, existing unit suites, actual-route SQLite/bucket API tests (no external mail), production build, search/release checks, mobile/desktop order/quantity/measurement browser tests with every write intercepted, and existing hashed-media regressions. Check failed save, missing save confirmation, direct thanks, refresh dedup, late consent, single/group price rules, upload limits, size capability/version/status and mobile layout. Public acceptance requires matching clean source fingerprint plus the same UI tests. Hostinger's exact deployment receipt, Sites28 sync and Resend domain status remain separate.

Initial broader typecheck also exposed existing empty-logo-link children typing and admin team avatar view typing; small type-only corrections make the complete typecheck reviewable without suppressing it.

## Reviewed scope

PR #22 merged as d8e6be40da8001bd77c4cd6015f266398bbfb0b2. The final app fingerprint is e5a285eb533c2fc3a54bee41fdd9c9a1199c759c18ececf514972eca565ccb79.49 files reviewed; no dependency/lockfile changes or production data/secrets in Git. Small type fixes affect empty logo anchors and public team avatar view typing. A completed legacy size draft can be offered as a suggestion, still requiring explicit confirmation.

[Final candidate quality run](https://github.com/atzilul/partyprint/actions/runs/41417425757/job/125184574605): full typecheck,35 tests, actual-route in-memory SQL/bucket suite, build,339 SEO and80 media checks. Order browser22/22/20 checks at320/390/1366px, quantity19×2, media20×2, measurement22/21/23/5 across Israel/strict/late approval/refusal. No real orders or emails. Visual review caught inherited floating form/landing CTAs, which were fixed and asserted. A prior development run exposed the overlay-induced missed click; final independent runs passed.

[Final candidate performance](https://github.com/atzilul/partyprint/actions/runs/41417425922/job/125184574866):3 samples/profile, mobile median1.376s (1.296–1.384), desktop0.308s (0.300–0.332),6/6 functional passes, same fingerprint. Laboratory results, not field/p75 or conversion evidence. Known audit remains16 moderate development-only advisories,0 production/high/critical; N01 stays open.

## Public acceptance

[Public browser/price verification](https://github.com/atzilul/partyprint/actions/runs/41417850381/job/125186956576), 09:08:22–09:09 UTC: public release clean, commit d8e6be40da8001bd77c4cd6015f266398bbfb0b2, fingerprint e5a285eb533c2fc3a54bee41fdd9c9a1199c759c18ececf514972eca565ccb79 matching the candidate. Order22/22/20, quantity19/19, media20/20 and measurement21/20/22/4 checks all passed without client exceptions. Real vendor scripts are stubbed, and all browser order/tracking writes are intercepted. This proves client behavior, not a real customer submission or external account receipt.

One explicitly read-only production pricing quote returned HTTP200: quantity4, subtotal440, discount44, total396 (10%). Single shirt pricing GET is180; /thanks is HTTP200 with noindex in metadata and response header. No coupon redemption or order insert occurred.

[Main quality run](https://github.com/atzilul/partyprint/actions/runs/41417850381) passed build/typecheck/API/search/browser checks. Its first public attempt correctly recorded waiting_for_matching_deployment against5808a2f; that status was never counted as a feature pass. The completed run's public-form job was retried after deployment and passed against the new exact SHA/fingerprint above.

Remaining limits: no actual customer order, upload, mail send or Meta/GA account-side receipt was created to test production. Real API/storage logic was tested separately in isolated SQLite/bucket fixtures, including optional-email mail payloads. Hostinger's exact hPanel terminal receipt is not available to these tools, Sites remains a separate managed copy with an offline executor, and Resend domain status is not verified by this change. Dataset-side Advanced Matching remains a separate historical/unverified account setting. Do not close those tasks from public fingerprint or mocked vendor evidence.

[Public performance verification](https://github.com/atzilul/partyprint/actions/runs/41417850383/job/125187022821): three fresh contexts per profile against the same clean SHA/fingerprint. Mobile LCP median1.656s (1.624–1.744), desktop0.468s (0.468–0.492). Six functional sample passes; mobile CLS0.00254–0.00304, desktop~0.00161; no client errors. These are throttled laboratory results from a Linux CI runner, not field Core Web Vitals or real-user conversion data. No regression of the previous media fixes was observed.

Sites metadata was read again on2026-11-02: the same project [account identifier omitted] is active at version28, last updated2026-10-26, URL https://partyprint-ai.atzilul.chatgpt.site. It is not this Hostinger release and was not overwritten or duplicated. The source executor remains disconnected; formal Hostinger receipt and safe Sites packaging/sync remain blocked independently.

## Design choice on the team package

The team package (index 3) can be ordered with one shared design (the default, included in
the quantity price) or with a separate design for every shirt, which adds a fixed
`INDIVIDUAL_DESIGN_SURCHARGE` (ILS 50) per shirt. The rule lives in `lib/catalog.ts`
(`designModeFor`, `designSurcharge`, `packageLabel`) and `priceFor` applies it, so the form,
`/api/pricing`, `/api/contacts`, `/api/orders` and the admin editor share one calculation.
The form sends `designMode`; the server ignores it for every other package and rejects a
total that does not match its own (HTTP 409). An order with a design for every shirt stores
`designMode: "individual"` and its package name carries the choice, so emails, the board,
tracking and exports show it without their own logic. The choice appears in the form for the
team package and as a selector on `/lp/team`; no other page offers it.

