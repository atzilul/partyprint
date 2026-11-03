# PARTYPRINT — Meta event mapping and consent queue

Date: 2026-11-03  
Canonical repository: `atzilul/partyprint`  
Base: `main` after PR #38, commit `c1a138319bdfcb83678db9af04be32b1c17070c6`  
Work branch: `feat/meta-events-consent-queue-v2`

## Requested implementation

- Map `begin_order_request` to standard Meta `InitiateCheckout` and custom `FormStart`.
- Add discounted value, `ILS`, item count and package content IDs to Lead; add standard `SubmitApplication` beside `RequestComplete`; identify the details FormStep with `content_name=details`.
- Give each Meta event a unique eventID and pass matching IDs to the CAPI route where event names overlap.
- Queue undecided events in memory, cap the queue at 50, flush in original event-time order after approval, and discard pending events on refusal.
- Keep the privacy panel closed on entry; visitors open it from the footer settings link. Default to `CONSENT_MODE=strict`. Only explicit `CONSENT_MODE=notice` permits pre-choice Meta ViewContent, InitiateCheckout and FormStep. PageView remains the pre-choice exception. Meta autoConfig is set false before every init; Meta consent grant is called only after a saved approval.
- Pass the original timestamp to CAPI `event_time`, validate the seven-day window, and expose the server-controlled mode via `/api/analytics-config`.
- Update the consent panel and privacy policy to explain actual processing; reference Amendment 13 in code as a business/legal setting without presenting the code as legal approval.

## Source changes

Updated analytics mapping/queue, consent config and runtime env types, API event-time validation, form and confirmation values, browser measurement audit, isolated order verification, CAPI payload and hashing contracts, the privacy policy, analytics documentation, `.env.example`, and project execution memory.

The previous CAPI hardening was merged as PR #37 (`c269a52`): the access token now travels in an Authorization header, and an absent `_fbc` can be derived from a valid landing `fbclid`.

## Verification status at authoring time

- Local Node contract tests: 12 passed, 0 failed (event mapping, strict default, 50-item cap, CAPI payloads, hashing, deduplication, timestamp bounds).
- `node --check`: updated browser audit and isolated API verification scripts passed.
- Browser audit assertions were updated for strict flush, notice pre-choice behavior, refusal, event IDs, event values, details naming and delayed-approval timestamps. The browser audit itself has not run yet. The repository was rebased on main after PR #38; the no-auto-open settings behavior remains intact.
- TypeScript, production build, API integration harness and GitHub Actions are pending the PR.
- No real Meta Graph requests, customer contacts, orders, emails, or production writes were sent.

## Important limits and follow-up

- The Pixel API cannot backdate the browser event's receive time. After consent, the buffered Pixel event is dispatched then; CAPI carries the event's original `event_time`. GA receives `event_time` as a custom event parameter, not as a timestamp override. This limitation is documented.
- `CONSENT_MODE` remains strict by default and notice is not enabled. A production owner/legal decision is needed before setting notice.
- Code sets Pixel `autoConfig=false` before each init and does not pass form contact data to the Pixel. Meta account-side Event Setup Tool rules/settings were not changed or verified.
- Hostinger environment, deployed `/api/analytics-config`, live `/api/release`, and Meta Events Manager receipt/dedup remain unverified. Code merge and production event receipt are separate checks.
