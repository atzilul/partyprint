# תכנון הטופס החדש — PARTYPRINT

התהליך מיועד לשני צרכים: מי שרוצה רק לברר ורוצה להשאיר טלפון מהר, ומי שכבר יודע מה להזמין ורוצה להשלים גם מידות. אף אחד מהם לא צריך לעבור במסלול של השני.

- **בחירה קצרה וברורה:** חולצה אחת או קבוצה, כמות חופשית ותאריך אופציונלי. שינוי סוג האירוע שומר את הכמות והמחיר מוצג יחד עם מה שכלול.
- **מידות נגישות:** כפתור ״מידות וצבעים״ בשני מסכי הטופס. עורך לכל חולצה: מבוגר/ילד, גילי2–18, צבע, החלה על כולן וביטול ההחלה. בחירה מפורשת נשמרת עם הפנייה; אפשר גם לדלג.
- **פרטי קשר ממוקדים:** שם וטלפון חובה; רעיון, תמונות ומייל אופציונליים. אפשר לחזור לעריכה בלי לאבד פרטים או קבצים. שגיאות מופיעות ליד השדה המתאים ואינן משנות את עובי המסגרת.
- **שחזור ברור:** קופון שמתעכב אינו חוסם מעבר לפרטים; יש ניסיון מחדש והסרה. שינוי מחיר מציג סכום חדש ושומר את הטופס. לחיצה כפולה בזמן שמירה אינה יוצרת שליחה נוספת.
- **אישור והמשך:** מספר פנייה, WhatsApp ומעקב. אפשר לעדכן מידות גם אחרי השליחה. כשיש שינוי מהסטודיו, הכמות והגרסה נלקחות מהשרת ושינויים מקומיים נשמרים לבדיקה.
- **מובייל ונגישות:** כפתורים גדולים, מקלדת מתאימה לשדה, סגירה וחזרת מיקוד בעורך, ניגודיות נבדקת וללא כפתורים צפים שמכסים את הפרטים.

הצלחה נמדדת בפניות אמיתיות שנשמרו, אחרי סינון בדיקות ובחלוקה למכשיר ומקור. לא מובטח שיעור המרה לפני שיש נתוני אמת. אין שינוי במינימום4 לקבוצה, במחיר יחידה180 כולל הכול או בתנאי הקופון; אין הבטחת זמן תגובה או אספקה חדשה.

---


Date: 2026-11-02. Candidate plan and acceptance matrix. Source: latest main0471381; production application fingerprint e5a285eb533c2fc3a54bee41fdd9c9a1199c759c18ececf514972eca565ccb79. No account identifiers, secrets, customer data or real orders are copied into this record.

## Goal and constraints

Make requesting a quote comfortable, clear and forgiving on a phone. The previous release reduced mandatory steps but retained a long, visually noisy interface. A higher real conversion rate is a hypothesis to measure after excluding staff/tests, not a promised outcome. Keep the two-step save-before-sizes flow, all product/contact/photo details, group minimum4 and reached-tier pricing, separate single-shirt180 inclusive offer, server pricing/coupon/security rules, private optional-size capability, consent policy and deduplicated saved Lead. No new payment, response-time or delivery promise. Preserve current routes and integration ownership; no production file deletion, new dependency or new Sites project.

## Baseline and problems

Read-only browser baseline at320/375/414/768/1366. First screen1047px and contact1661px at375;320 contact1814px. Seven visible first-screen buttons before optional content. Selecting7 shirts then another occasion reset quantity to4 at all five widths. No client exception or horizontal overflow; those facts alone did not establish usability. Source additionally disables all submit/navigation buttons while coupon validation is pending; the refined baseline explicitly waits for the async pending state before judging this interaction.

The duplicated sidebar, oversized optional upload area, competing order/consult choice, repeated price/copy and unrelated global styles obscure the primary action. Quote details and personal contacts must survive edits, back/forward, failed saves and stale prices. Optional sizing must use current server quantity/version and preserve local edits across conflicts.

## Proposed experience

1. **The shirts.** Two clear choices: personal single shirt or group. Group quantity accepts typing, plus/minus and quick reached-tier counts. Changing occasion preserves the active group count. Single/group switching remembers the last group. Date is optional and compact; timing assumptions are disclosed on demand, with no delivery guarantee. One current price summary; an eligible discount appears only after server confirmation. Coupon loading never blocks advancing to contact, and stalled/rejected checks have retry/removal recovery.
2. **Contact and idea.** Required name/phone, optional short brief, compact native multi-photo control and optional email. A compact editable quote summary sits at the top. One primary send action, no floating overlay; no charge in this step. Visible labels, blur/touched validation, associated errors, keyboard focus recovery and mobile input hints. Enter in a coupon/quantity input must not send or advance unexpectedly. Back/edit preserves contacts and selected files. Only successful stored receipt navigates to thanks and permits Lead.
3. **Confirmation.** A restrained saved-state card with reference/copy, current quote details, WhatsApp handoff and private tracking link. Next steps stay available without dominating the screen. The optional-size card is clearly separate; reload/direct visits retain correct saved/no-receipt semantics.
4. **Optional sizes.** Smart suggestions remain unconfirmed until save. A summary groups sizes/colors; a native shirt selector, previous/next controls and an expandable full table replace100 open rows. Each selected shirt still has adult/child toggle and all child ages2–18. Bulk apply uses current data and offers Undo; editing afterwards clears destructive stale Undo. Load current server quantity/price/version.409 refresh preserves edits for explicit review; advanced production/expired links recover through WhatsApp. No duplicate Lead or order from sizing.

## Visual system and implementation

Component scope, not a site-wide replacement. Preserve Rubik display, Assistant body, warm paper, dark ink and orange/acid accents. Use restrained24px spacing, readable16px controls,52px primary action,44px minimum touch controls, immediate high-contrast focus, constant input border width and visible error/success/loading states. No decorative illustration, new font or animation dependency. Isolated pp-prefixed styles consume named OKLCH brand tokens; existing global CSS/imports and media optimizations remain. Eight-state developer preview accompanies the component; it is not a production route.

Files: edit components/order-request-form.tsx, components/shirt-options.tsx, app/reference-upload.tsx, app/thanks/confirmation.tsx and the order section of app/page.tsx in place. Add components/order-flow.css, root tokens.css and .hallmark/preflight.json. Update browser regressions and add an interaction stress suite; preserve actual-route backend tests. Add a developer-only state preview under docs/preview. No production deletion. Temporary baseline tooling is kept as evidence, and its branch-only workflow is replaced by a bounded development-quality job after baseline capture.

## Acceptance matrix

-320/375/414/768 plus desktop1366: no horizontal scroll, readable type/prices, one-line primary CTA, no input overlay, required fields and focus target not behind sticky navigation. Compare current heights/screenshots with baseline; keep optional details available.
-Single180 vs groups4–100, all reached tiers/intermediate counts, typing/clamping/Enter, occasion/count preservation and single/group restoration. Actual server price remains authoritative.
-Back/forward with filled contact/brief/photo, optional-email removal/error recovery, invalid/duplicate/count/byte file checks, no-PII draft and reload behavior.
-Coupon pending8s timeout, advancing while pending, retry/remove error clearing, stale quote cancellation, quantity changes, paid UTM eligibility and current server validation.409 fresh price retains contacts/photos and cannot claim successful save.
-Synthetic save success/failure/unconfirmed response; double-click/slow save creates one request. Consent Israel/strict/late/refusal; no Lead before save or after refresh/size save, no personal values in allowlisted events. All browser order/tracking/vendor writes intercepted.
-Optional editor: adult/child ages, per-shirt edits, bulk and Undo, current server quantity,409 preserving draft, expired/locked recovery, no preconfirmed defaults. Backend capability and version tests remain.
-Full typecheck, existing35 tests and real-route isolated SQL/bucket suite, production build/339SEO/80hashed-media checks, media browser and performance lab. Review the complete diff, then main auto-deploy, exact clean fingerprint + public behavior/quote verification. Formal hPanel receipt, Sites sync, Resend and external account settings remain separate; do not infer them from mock QA.

## Measurement after release

Use existing begin_order_request → form_step(details) → form_submit_attempt → generate_lead counts, segmented by device/source and excluding tests. Also inspect validation/error categories and contact WhatsApp. Compare sessions with confirmed leads when session-grain data exists; do not call raw event ratios a user conversion rate. No new paid tool or background schedule is introduced.

## User steering: sizing must remain visible

The user reported that sizing seemed to disappear. Retain the conversion benefit while exposing a clearly labeled optional size/color action inside both form screens. A native accessible dialog offers per-shirt adult/child, all ages/colors, bulk/Undo and an explicit confirmation. Defaults are never submitted without that confirmation. The customer can defer sizes with one click and still save the request. Quantity changes retain the draft and require matching-count confirmation. Chosen sizes persist in the request payload/admin; after-save sizing remains available for later updates. Explicit complete arrays are validated for consultation mode too; legacy empty consultation semantics and production gates remain. Add actual-route tests for all request modes and browser tests before any contact is entered. No real order is generated by QA.

## Candidate acceptance

PR24 merged abe3cf9cad998f5e25d2c27d76bb503f6e67ff8b. Final candidate fingerprint de4237d8ab6b2a14247dd048cc530c3c10c298da647e69543c698304d5bb3f5c.27 files reviewed; no package/lockfile/env/hosting identity edits or production deletions.

[Quality](https://github.com/atzilul/partyprint/actions/runs/41437000647/job/125249177006): full typecheck,36 tests, isolated real-route SQL/bucket suite including confirmed sizes in all request modes/admin, build,339 SEO and80 immutable-media checks. Browser order22/22/22/20/20 and UX24/27/24/24/24 across320/375/414/768/1366; quantity19/19; media20/20; consent22/21/23/5. All passed with no real orders/emails/vendor writes.375px blank contact screen1185px vs baseline1661px, including the restored sizing entry and stable error slots. Actual selected sizing controls and nine brand text/focus pairs were contrast tested. Visual review fixed inherited yellow/white toggle styling and legacy footer alignment.

[Performance candidate](https://github.com/atzilul/partyprint/actions/runs/41437000670/job/125249177036):3 samples each, mobile median1.460s (1.440–1.496), desktop0.360s (0.348–0.372),6 functional sample passes. Laboratory results only.

Public form checks and the exact Hostinger terminal receipt remain separate until recorded below. This copy follow-up makes FAQ/guide/AI briefs consistent about optional sizing before and after saving; it does not alter interaction logic.
