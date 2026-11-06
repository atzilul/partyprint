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
never force-push. Preserve existing content and features unless the owner explicitly
asks to remove them. Ask before any unrequested removal, including hiding public
promotion copy or access to shirt sizing. Keep production orders, uploads, credentials, and runtime
settings outside Git. Do not change production data while editing source.

After a push, verify that Hostinger built the same commit successfully and that
the public site shows the intended result. A GitHub commit or a Sites publish
alone does not prove the public site is current. If any signal is unavailable or
fails, report it as unverified and do not describe the change as live.

Only sync the existing Sites project after Hostinger production is verified.
Compare its homepage, logo, offer text, and the requested behavior with
`partyprint.co.il`. Report the GitHub SHA, Hostinger deployment result, Sites
version, and any outstanding Resend verification state.

## Search growth continuity

Before continuing search, content, indexing, analytics, or AI-discovery work, read
[the project memory](docs/search-execution/PROJECT_MEMORY.md), then the current
[task register](docs/search-execution/backlog.csv) and the latest execution record.
Resume unresolved tasks from their stable IDs; preserve all 75 original tasks.
After each work session, record actual results, evidence, dates, blockers, and
next actions. Distinguish implemented, tested, publicly observed, account-verified,
and indexed states. Do not close a task without its stated acceptance evidence.
Treat owner-reported connections separately from successful data reads. Do not
infer background execution or scheduled reviews from this file; keep any actual
automation IDs and schedules in the project memory when one is explicitly set up.

## Translations

The site is written in Hebrew, and the Hebrew text in the code is the only source. Arabic
(`/ar/...`) is produced from it by the translation gate in `i18n/`: a sentence is looked up
by its Hebrew text, so an edited Hebrew sentence no longer matches its old translation and
appears in Hebrew on the Arabic page until it is translated. Nothing goes stale silently,
but nothing translates itself either.

Every change to Hebrew text on a translated page ends, in the same commit, with its
translations. The translated pages are listed by `node scripts/i18n-pages.mjs ar`.

1. `npm run build`, then start the built site with `PP_I18N_COLLECT=1`.
2. `node scripts/i18n-sync.mjs collect ar http://localhost:3333 $(node scripts/i18n-pages.mjs ar)`
   writes the sentences without a translation to `i18n/ar.missing.json`. For text that
   appears only after a click (errors, dialogs, later form steps), first run
   `node scripts/i18n-sync.mjs scan ar <changed files>` and walk the page in a browser.
3. Translate the list in its order, following `i18n/ar.style.md`, into a JSON array;
   `node scripts/i18n-sync.mjs merge ar <file>`, then `node scripts/i18n-sync.mjs publish ar`.
4. `npm run build` and `node scripts/check-translations.mjs`: it must report 0 problems.

- A new page becomes Arabic by adding it to `PATTERNS` in `i18n/routes.ts` and to
  `PAGE_MODULES` in `i18n/pages.ts`; a page with a Hebrew slug also needs its slug in
  `i18n/ar.slugs.json`. The sitemap, the language menu and the checks follow these lists.
- An urgent Hebrew fix may be released before its translation; the "Search discovery
  quality" workflow then fails on `check-translations` until the translation follows.
- Never set `PP_I18N_COLLECT` in production. Never turn the root layout's `metadata` into a
  function: it moves the title and description out of `<head>` on static pages.
- Names of languages and other text that must stay as written carry `translate="no"`.
- The Arabic legal pages are a convenience translation; the Hebrew text is the binding one.
