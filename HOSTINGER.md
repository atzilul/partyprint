# PARTYPRINT: Node production deployment

The portable build now has a Node adapter for SQLite, private filesystem objects
and password-based staff sessions. The managed Sites build retains D1, R2 and
Sites authentication. The public design, prices calculation, order workflow and
role permissions are shared. The Cloudflare-only runtime adapter is generated
only during the managed build, so the portable source and `dist/standalone`
bundle contain no Worker runtime import. No `.next` compatibility directory is
generated.

## Hostinger settings (manual)

Deploy `atzilul/partyprint`, branch `main`, as a **Node.js web app**, framework
**Other**, not Next.js. Hostinger's framework selection is not a repository
setting. See [Hostinger's deployment guide](https://www.hostinger.com/support/how-to-deploy-a-nodejs-website-in-hostinger/).

| Setting | Value |
| --- | --- |
| Node | 24.x (tested); minimum 22.13 |
| Install | `npm install` |
| Build | `npm run build` |
| Output directory | `dist/standalone` |
| Start from repository root | `npm start` |
| Start command expansion | `node server.js` |
| Entry relative to output directory | `server.js` |

Keep the entire standalone directory, including its nested `dist`, `node_modules`
and `drizzle` directories. If the platform starts in the output directory itself,
the equivalent entry command is `node server.js`. The generated server reads
`PORT` from the environment (defaults to 3000) and binds to `0.0.0.0`.

The repository now also contains `server.js`, which forwards to the standalone
entry. Thus the same entry filename works whether the host starts from the
repository or the output directory. The standalone package explicitly declares
its `main` and `start` entries. The portable build ends with two HTTP boot checks:
the repository entry and a standalone copy outside the source checkout. It fails
if either cannot serve the homepage. Look for both `[partyprint] PASS` lines in
the deployment build log. These checks verify boot, not Hostinger's routing or
the production environment variables.

If a deployment still fails after both checks, obtain the post-build deployment
or startup error from Hostinger; the transform log alone cannot identify it.
Node 24 satisfies `>=22.13.0`, and npm deprecation warnings are not build errors.
With only `PARTYPRINT_PUBLIC_URL` and `VINEXT_TRUSTED_HOSTS` configured, the server
can serve the homepage, but pricing and orders cannot work until
`PARTYPRINT_DATA_DIR` is configured. Staff login also needs the two credential
variables below. Do not use a temporary directory to make this requirement pass.

Do not select Vite static hosting: this application has private server APIs.
Do not change `execution-profile.mjs`, `build-verified.sh` or the local profile.

## Runtime environment

Configure these in the hosting environment, never GitHub source or client code:

| Variable | Purpose |
| --- | --- |
| `PARTYPRINT_DATA_DIR` | Absolute private **persistent** directory outside the deployment; writable by the app user |
| `PARTYPRINT_PUBLIC_URL` | Actual HTTPS site origin, including a temporary Hostinger domain if needed |
| `PARTYPRINT_SESSION_SECRET` | Recommended random secret, at least 32 characters; if omitted, the server derives one from the owner password |
| `PARTYPRINT_ADMIN_EMAIL` | Simple owner login email; configure together with `PARTYPRINT_ADMIN_PASSWORD` |
| `PARTYPRINT_ADMIN_PASSWORD` | Simple owner login password; no hash or JSON is needed |
| `PARTYPRINT_ADMIN_PASSWORD_HASH` | Optional scrypt hash alternative to the plaintext owner password variable |
| `PARTYPRINT_STAFF_1_EMAIL`, `PARTYPRINT_STAFF_1_PASSWORD` | Optional simple login for the first staff member; repeat with `_2`, `_3`, etc. |
| `PARTYPRINT_STAFF_1_PASSWORD_HASH` | Optional scrypt hash alternative for a numbered staff password |
| `PARTYPRINT_STAFF_PASSWORD_HASHES` | Optional JSON object mapping additional staff emails to password hashes (below) |
| `VINEXT_TRUSTED_HOSTS` | Public hostnames, comma-separated when both `partyprint.co.il` and `www.partyprint.co.il` are active |
| `PARTYPRINT_TRUSTED_IP_HEADER` | A single-IP header that Hostinger confirms its edge **overwrites** (for example `x-real-ip`, only after confirmation) |
| `PARTYPRINT_CUSTOMER_LINK_DAYS` | Optional customer tracking-link lifetime; default 30, allowed 1–90 |
| `PARTYPRINT_BUNDLE_LINK_DAYS` | Optional order ZIP-link lifetime; default 7, allowed 1–30 |
| `PARTYPRINT_APPROVAL_LINK_DAYS` | Optional design-approval-link lifetime; default 30, allowed 1–30 |
| `RESEND_API_KEY`, `MAIL_FROM` | Existing mail provider credentials and verified sender |

The reverse proxy must overwrite forwarded protocol/host headers and block direct
external access to the Node port. Do not trust arbitrary client-provided IP headers.
Without a confirmed IP header, anonymous users share the conservative rate limit
(8 form attempts/hour); configure this before opening public orders.

**Confirm that Hostinger preserves the private data directory between deployments.**
SQLite and uploads must not be placed in `public`, `dist`, a temporary directory,
or a replaced checkout. Use one running application instance and a local disk with
SQLite locking support. If this plan cannot provide persistent writable storage,
do not open orders on it: an external database/object store adapter or an appropriate
persistent server is required. Back up the directory consistently with the process
stopped, or use SQLite's backup facilities; copying only a live `.sqlite` file can
omit WAL transactions. Test restore and a real redeployment before switching traffic.

## Admin credentials

For the simplest setup, add these variables in Hostinger and redeploy:

```text
PARTYPRINT_ADMIN_EMAIL=your@email.com
PARTYPRINT_ADMIN_PASSWORD=choose-a-password-with-12-or-more-characters
VINEXT_TRUSTED_HOSTS=partyprint.co.il,www.partyprint.co.il
```

The email becomes the owner login and the password is read only by the server. Do not put either value in GitHub or in client-side code. `PARTYPRINT_SESSION_SECRET` is recommended but no longer required for the simple two-variable login. When these variables are present, you can ignore `PARTYPRINT_STAFF_PASSWORD_HASHES`. The older hash-based setting remains supported for additional staff members.

To add simple staff logins, add matching pairs such as:

```text
PARTYPRINT_STAFF_1_EMAIL=designer@example.com
PARTYPRINT_STAFF_1_PASSWORD=another-password
PARTYPRINT_STAFF_2_EMAIL=printer@example.com
PARTYPRINT_STAFF_2_PASSWORD=another-password
```

After redeploying, the owner must add each staff email in the Team section of `/admin` and choose a role. The numbered accounts are limited to 20; unused numbers can be skipped.

## Staff credentials

Generate a distinct password of at least 12 characters for every staff member.
In a private Bash terminal at the project root, generate its hash without putting
the password in command arguments or history:

```bash
read -r -s -p 'Staff password: ' PARTYPRINT_INPUT
printf '%s' "$PARTYPRINT_INPUT" | node scripts/staff-password.mjs
unset PARTYPRINT_INPUT
```

Set `PARTYPRINT_STAFF_PASSWORD_HASHES` to an object such as
`{"atzilul@gmail.com":"scrypt$<salt>$<hash>"}` using the actual generated value.
Generate the session secret locally with
`node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`.
Do not paste passwords or secrets into chat or commit them.

The owner signs in at `/admin`. For additional staff, both a personal password hash
in the server environment **and** an owner-granted role in the existing team panel
are required. Removal from the team revokes authorization immediately; replacing
their password hash invalidates their old sessions. Cookies are signed, HttpOnly,
SameSite=Lax, Secure over HTTPS, use the `__Host-` prefix, and expire after 8
hours. Sites identity headers are ignored entirely by Node. Login attempts are
throttled both per email and per client IP when a confirmed Hostinger-overwritten
IP header is configured.

## Existing data and email

This is a runtime port, **not an automatic migration** of live D1/R2 data. A new
directory starts empty using the existing code's default pricing. Existing orders,
price settings, coupons, team roles, images and approval links must be migrated
and reconciled before redirecting customers. Export a complete backup from the
current admin first; the admin restore feature uses backups already in that
runtime and does not import another installation's ZIP automatically. Never treat
an empty new dashboard as proof that existing data moved successfully.

Without mail credentials, orders still save and show mail as not configured.
No successful email delivery is claimed by the runtime tests. Once credentials
are configured, verify one real controlled order's owner/customer delivery, private
download links and WhatsApp customer link before launching.

## Verification

In a clean clone without a local execution profile:

```bash
npm install
npm run build
node scripts/verify-node-runtime.mjs
```

The integration check runs `PORT=3000 npm start` with disposable data, simulates a
trusted HTTPS proxy, tests login/authorization, a ten-image order, pricing, editing,
private image/ZIP downloads and persistence across restart. It sends no email and
deletes test data afterwards. Run `node scripts/verify-orders.mjs` for the shared
business-rule regression checks and `npx tsc --noEmit` for type checking.
