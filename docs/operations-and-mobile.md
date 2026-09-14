# Order operations and mobile update

The site now keeps package pricing derived from the single shirt price and preserves existing order totals when that setting changes.

## Customer experience

- Mobile product opening is shorter; package CTAs jump directly to the form.
- Three-step order wizard defaults to ordering. The mode selector collapses after progressing on mobile. Missing sizes/colors prevent advancement; final-contact errors no longer fire while moving to the last step.
- Mobile action bar, keyboard-aware positioning, 16px inputs, safe-area spacing and grouped shirt summary.
- Device-local seven-day draft includes selections, brief and event date. No customer contact fields or image bytes are saved in local storage. Images must be reattached after reload.
- Up to ten reference images; existing file validation and aggregate limits are retained. Client image-quality prompts are heuristics, not print-quality certification.
- Event date is a request, never an automatic delivery promise. Optional configured planning days only trigger a lead-time warning.
- Measurements and consented real work can be published from the content tab. Empty measurements/reviews remain empty; no fabricated measurements, reviews or production photos.
- After order save, a 256-bit private tracking link is returned. Its hash grant expires after 90 days. Customer tracking exposes current order/status/design/payment totals, not internal notes, contact records or audit history. The link is bearer access.
- Studio notification retains customer WhatsApp and protected ZIP links. Customer receipt has its own tracking link and idempotency key. Runtime RESEND_API_KEY and MAIL_FROM are still absent; actual email delivery is not operational until these are securely configured and sender identity verified.

## Team and production

- Owner manages staff roles. Legacy members retain manager role.
- Managers retain order/pricing/payment/analytics access. Designers and printers use a separate assigned-work surface. All original admin endpoints default to manager-only; restricted staff cannot obtain financial/contact records by changing the URL.
- Designers can view assigned briefs/images and upload designs. Printers can download approved packets for assigned orders and mark a printing order ready.
- Tasks have assignee, due date (local entry normalized to UTC) and completion flag.
- Archived/cancelled orders retain history; reopening requires a reason. Cancellation does not refund money.
- Every newly replaced approval is retained for side-by-side comparison. Previously overwritten historical approvals cannot be reconstructed.
- Print instructions specify source design, side, placement, width/height and numbered shirts. Instructions participate in approval validity. All mapped source files must be selected when generating an approval.
- WhatsApp templates are editable and stage-specific. Sending remains a deliberate manual action in WhatsApp.

## Backup and analytics

- Owner can create/resume a manual backup across all orders existing at its start. Each order is copied at processing time: this is not a transactionally consistent whole-database snapshot.
- Images and immutable design snapshots are copied separately, checksummed and retained independently of active order files. Settings/coupon records are included in download metadata; public gallery image bytes are not an order backup.
- Download ZIP with JSON manifest and files, maximum 64MB per response; larger backups can be downloaded per order. Backups remain on the same storage service: download an external copy for disaster recovery.
- Restore an order using optimistic version checks; file checksums are checked before commit. A separately listed pre-restore backup preserves the current order. Files are restored under new keys. Old design-approval links are not reactivated; restored approvals require renewal. No customer messages are sent by restore.
- UI restore is for orders/files. Rebuilding settings or importing an offline backup after complete infrastructure loss requires technical recovery from the manifest and files.
- Analytics includes actual recorded net receipts by payment date, latest-response approval ratio, cancellations, tagged arrival sources and durations of completed measured stage stays. Historical gaps are not manufactured.

## Verification

`node scripts/verify-orders.mjs` uses in-memory SQLite plus mock object storage. It covers existing order/coupon/auth flows, staff scoping, print instructions, token redaction, backup and restoration after image deletion, conflicts, cancellation and analytics SQL. All emails in tests are mocked; no messages or charges are performed. Temporary ZIPs go outside the repository.

TypeScript and the production build were checked. Browser checks used the internal preview, including 360, 390 and 430 CSS-pixel iframe viewports: first-screen CTAs, direct form navigation, missing-choice blocking and final-step validation. This is responsive layout coverage, not physical iOS/Android keyboard testing. The temporary QA page is not part of the published site.

## Submission and daily workflow refinements

- Owner and customer notifications run independently in parallel after the order is stored. A failure in one does not prevent the other; statuses remain separate and do not imply delivery or reading.
- The public wizard becomes inert while submitting, with a live progress message; package entry points and quantity changes also stop until completion. Fields remain available after failure.
- Shared browser/server validation rejects punctuation-only phone numbers and nonexistent calendar dates.
- Workflow saves refresh without the stale unsaved-change warning; manual reload still warns before discarding edits.
- Managers can copy the private tracking link and inspect the customer notification status in activity. Missing mail configuration is distinguished from a failed provider request.
- Designers have the same 30MB total image limit, including original object sizes for legacy records. Invalid file signatures return actionable validation errors without changing the order.
- Verified with TypeScript, production build and the order regression suite, including malformed contact/date inputs, legacy image sizes and rejected designer uploads. No real customer messages were sent.

## Field guidance and handoff refinements

- The public event-date field now exposes its validation error, invalid state and accessible description at the field. Editing clears the old error.
- The confirmation screen offers copy actions for the short order reference and private tracking URL, with selectable text as a fallback when clipboard access fails.
- Workflow validates print files, placement, dimensions and selected shirts before submitting, scrolls to the first missing field, and shows animated inline hints respecting reduced-motion preferences.
- Task dates are checked for real calendar dates and valid hours/minutes on both client and server. Invalid legacy dates do not crash the editor. Staff-list loading failures are surfaced instead of silently presenting an empty list.
- Regression checks cover impossible dates and out-of-range times without saving the attempted edits.

## Staff workspace editing reliability

- Staff saves return an explicit role-specific projection with the new version; no contact, financial or internal-note fields are included. Only the saved card updates.
- Controlled brief and file selection remain intact on failed saves. Successful saves clear the upload queue, preventing accidental re-upload, while drafts on other cards remain unchanged.
- Page navigation, refresh, sign-out and leaving the site warn when drafts exist. Pending saves disable navigation and other edit forms. Drafts are in memory only, not persisted in browser storage.
- Staff can add files in batches, inspect names and sizes, remove individual pending files, and see per-order validation and success feedback. Uploads are checked before submission and again on the server.
- Regression coverage verifies fresh versions, redacted save responses and rejection of stale repeat submissions without adding images.
