# Q04 contact-first request acceptance

Application source: `0eec69daee0d124b53a4539ea063bad005ccb84a` on main.

Owner-requested implementation and operational details: [contact-capture.md](../contact-capture.md). This session preserves all 80 stable task IDs.

## Public acceptance — 2026-11-02

PR34 merged at 0eec69daee0d124b53a4539ea063bad005ccb84a. [Public form acceptance](https://github.com/atzilul/partyprint/actions/runs/41490324258/job/125433486595) observed this exact clean application revision and source fingerprint da18ca54bff76d8e0a5b333d1d584538b411b00c3dd4ae27dab73f0c614bd6bb. All six reports passed, with zero client errors and zero forwarded synthetic writes.

- Form: 27 checks at each of 320/375/414/768/1366 pixels.
- Quantity: 28 checks at 375/1366, including the actual owner-managed promotion text/code and server quote; coupon redemption is mocked.
- UX: 23/26/23/23/23 checks, including visible sizing, motion/reduced-motion, contact-save failure/recovery, field/file retention, price/version conflicts and late sizing.
- Consent/measurement: early captured-contact Lead, completed request separately, no duplicate vendor event, refusal and region rules, no PII in our allowlisted payloads. Vendors are stubbed; this is not account-side delivery evidence.
- Media and non-mutating quote/thanks checks passed. No contact/order was created, no real coupon was consumed and no real mail was sent by this QA.

Implementation and public behavior are accepted within the scope above. A direct hPanel deployment receipt remains unavailable; public source identity is separate evidence. Sites get_site still reports version28, unsynchronized; the execution environment needed to prepare its matching source is unavailable. Resend domain/key/from-address validity and actual owner/customer delivery remain unverified. The operator's legal name, registration number and postal address still require the owner's facts. N01 remains open for pre-existing moderate dev-tool dependency findings; the production dependency audit had zero findings. No scheduled job or paid dependency was added.
