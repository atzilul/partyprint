# PARTYPRINT source synchronization

The user requests that every completed site update also be published to
https://github.com/atzilul/partyprint on branch main.

Before editing, inspect GitHub main and reconcile incoming changes. Preserve
the registered Sites project and its hosting manifest. After validation, push
the complete source and assets to GitHub. Use a fast-forward push, or the
GitHub connector's blob/tree/commit/update-ref APIs with the current main
commit as parent. Never force-push or overwrite unreviewed remote changes.
Do not commit credentials, customer orders, uploads, or local runtime state.
Verify the remote commit and report synchronization failures honestly.

GitHub source synchronization does not migrate the runtime. This application
currently needs Cloudflare D1/R2 and Sites authentication. Hostinger deployment
requires adapting those capabilities before claiming it works there.
