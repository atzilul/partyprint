# PARTYPRINT source and deployment

- Editable code: https://github.com/atzilul/partyprint, branch `main`.
- Public production: https://partyprint.co.il/ on Hostinger.
- Hostinger is connected to GitHub `main` with automatic deployment enabled.
  A branch update starts a production build; it does not prove that deployment
  succeeded.
- Sites has one separate managed project. Its generated URL and saved versions
  are not the public production domain and are not evidence of the current
  Hostinger release.
- Orders, uploaded files, coupons, team roles, mail settings, and secrets belong
  to the active runtime. GitHub source synchronization does not migrate them.

Use [operating-model.md](operating-model.md) for the mandatory preflight, release,
and post-deployment checks. Use [../HOSTINGER.md](../HOSTINGER.md) for the Node
runtime configuration. Do not describe a version as current until the deployed
commit matches the intended GitHub SHA and the public page has been checked.

## Runtime boundaries

The managed Sites build uses D1, R2, and Sites authentication. The portable
Hostinger build uses Node, SQLite, private filesystem storage, and password
sessions. They share application behavior but do not share runtime data
automatically. Reconcile the active order data and runtime settings before any
migration or hosting change.

Keep secrets, order data, and uploads out of GitHub. Hostinger environment
variable presence does not prove that Resend has verified the sender domain or
that an email was delivered.
