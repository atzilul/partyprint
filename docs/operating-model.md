# PARTYPRINT operating model

This document defines which system is authoritative and how to keep the live
site, GitHub source, and Sites project aligned.

## Source roles

| Surface | Role | What it proves |
| --- | --- | --- |
| https://partyprint.co.il/ | Public production on Hostinger | What visitors can see now |
| https://github.com/atzilul/partyprint, `main` | Editable application source | The intended source at a specific commit |
| The existing Sites project | Managed preview and copy of the application | Only the saved Sites version and URL shown by Sites |

A GitHub commit is not a deployment receipt. A Sites screenshot or version is
not proof of what Hostinger serves. Production is current only after the
deployed commit is identified and the public page is checked.

## Before each change

1. Open the public site and record the exact current title, logo, offer text,
   and the relevant page behavior.
2. Read the current `main` head and inspect the matching source files. Reconcile
   differences before editing; start from the latest branch head.
3. Check Hostinger's latest deployment state and target commit. If there is a
   failed build, inspect its log and fix that failure before starting another
   deployment.
4. Confirm the existing Sites project ID from `.openai/hosting.json`. Reuse
   that project; never create a duplicate.
5. Inspect runtime configuration by key and presence only. Keep secret values
   hidden and preserve production orders and uploaded files.

## Release sequence

1. Make one focused change from the current GitHub source. Do not copy a stale
   Sites archive over newer GitHub files.
2. Build the selected runtime using the repository's existing build command.
   Keep runtime state and secrets outside the source tree.
3. Review the complete change, then update `main`. A push triggers Hostinger's
   automatic production build.
4. In Hostinger, confirm the deployment used the same commit SHA and reached a
   successful terminal state. Then load https://partyprint.co.il/ and compare
   the requested visible and functional details with the intended source.
5. Only after production passes those checks, sync the same application source
   into the existing Sites project. Confirm its homepage, logo, offer, and
   requested behavior against production.
6. Report the GitHub SHA, Hostinger deployment status, public-site result, Sites
   version, and any remaining configuration work. Mark any unavailable signal
   as unverified; never infer success from a toast or a newer version number.

If Hostinger status or the public site cannot be inspected, keep the production
state explicitly unverified. Do not call a stale Sites page current.

## Promotion checks

For a requested discount, compare the configured coupon percentage and code
with the top-site offer and the server-side order calculation. Check that the
same offer is displayed on desktop and mobile and that the discount is applied
to a controlled quote. Do not treat hard-coded fallback text or a different
Sites database as proof that the live coupon works.

## Resend checks

Verify the sending domain's status inside Resend. Confirm that `MAIL_FROM`
uses a sender on that verified domain. Hostinger showing `RESEND_API_KEY` and
`MAIL_FROM` as configured proves only that variables exist; it does not prove
domain verification, key validity, or message delivery. Keep the API key out of
source, logs, screenshots, and chat.
