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
(`/ar/...`) and English (`/en/...`) are produced from it by the translation gate in `i18n/`:
a sentence is looked up by its Hebrew text, so an edited Hebrew sentence no longer matches its
old translations and appears in Hebrew on the translated pages until it is translated.
Nothing goes stale silently, but nothing translates itself either.

Every change to Hebrew text on a translated page ends, in the same commit, with its
translations in every language. The translated pages are listed by
`node scripts/i18n-pages.mjs <language>`; the languages are the `i18n/<language>.json` files.

1. `npm run build`, then start the built site with `PP_I18N_COLLECT=1`.
2. For each language: `node scripts/i18n-sync.mjs collect <language> http://localhost:3333 $(node scripts/i18n-pages.mjs <language>)`
   writes the sentences without a translation to `i18n/<language>.missing.json`. For text
   that appears only after a click (errors, dialogs, later form steps), first run
   `node scripts/i18n-sync.mjs scan <language> <changed files>` and walk the page in a browser.
3. Translate the list in its order, following `i18n/<language>.style.md`, into a JSON array;
   `node scripts/i18n-sync.mjs merge <language> <file>`, then `node scripts/i18n-sync.mjs publish <language>`.
4. `npm run build` and `node scripts/check-translations.mjs`: it must report 0 problems for
   every language. `node --test scripts/i18n-gate.test.mjs` must pass.

- A new page is translated by adding it to `PATTERNS` in `i18n/routes.ts` and to
  `PAGE_MODULES` in `i18n/pages.ts`; a page with a Hebrew slug also needs its slug in
  `i18n/<language>.slugs.json` for every language. The sitemap, the language menu and the
  checks follow these lists.
- English reads left to right. The stylesheets stay written for a right-to-left page:
  `build/direction-css.mjs` (in `postcss.config.mjs`) gives every direction-dependent rule a
  mirrored twin under `html[dir="ltr"]` at build time. Write CSS as usual; a rule that must
  not be mirrored (the inside of a Latin logo, a motion that should run the same way) gets a
  `/* rtl:ignore */` comment before it. `direction:ltr` is always kept. An element that sets
  `dir="rtl"` in the code follows the reader's language. On left-to-right pages the gate also
  writes prices as `₪440` and turns separator arrows (`←`, `↖`) around; horizontal arrow icons
  are mirrored in `app/globals.css`. The customer email is mirrored in `i18n/html.ts`.
- After a layout change, check an English page at phone, tablet and desktop width as well as
  the Hebrew one.
- An urgent Hebrew fix may be released before its translation; the "Search discovery
  quality" workflow then fails on `check-translations` until the translation follows.
- Never set `PP_I18N_COLLECT` in production. Never turn the root layout's `metadata` into a
  function: it moves the title and description out of `<head>` on static pages.
- Names of languages and other text that must stay as written carry `translate="no"`.
- The translated legal pages are a convenience translation; the Hebrew text is the binding one.
