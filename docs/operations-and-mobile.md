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
