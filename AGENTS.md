# PARTYPRINT editing and release rules

Read [docs/operating-model.md](docs/operating-model.md) before changing the site,
its code, hosting, coupons, or email delivery.

The editable code source is https://github.com/atzilul/partyprint on `main`.
The public production site is https://partyprint.co.il/ on Hostinger. Hostinger
automatically deploys pushes to `main`, so every push is a production release.
The Sites project is a separate managed copy. Reuse its existing project ID from
`.openai/hosting.json`; never create another project for this site.

Before editing, inspect the live site, the current GitHub `main` head, and
Hostinger's latest deployment status. Reconcile differences before making
changes. Never use an old Sites screenshot, saved version, or archive as proof
of production content or as the base for a source update.

Base source edits on the latest `main`, preserve unreviewed remote changes, and
never force-push. Keep production orders, uploads, credentials, and runtime
settings outside Git. Do not change production data while editing source.

After a push, verify that Hostinger built the same commit successfully and that
the public site shows the intended result. A GitHub commit or a Sites publish
alone does not prove the public site is current. If any signal is unavailable or
fails, report it as unverified and do not describe the change as live.

Only sync the existing Sites project after Hostinger production is verified.
Compare its homepage, logo, offer text, and the requested behavior with
`partyprint.co.il`. Report the GitHub SHA, Hostinger deployment result, Sites
version, and any outstanding Resend verification state.
