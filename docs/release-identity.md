# Build-source identity

`GET /api/release` reports the source embedded at compilation. It is a public,
read-only diagnostic, with `Cache-Control: no-store` and `X-Robots-Tag: noindex`.
It exposes no account details, orders, credentials or runtime configuration.

## Public fields

| Field | Meaning |
| --- | --- |
| app | PARTYPRINT |
| schemaVersion | 1 |
| target | node or cloudflare; unknown if no compiled identity exists |
| mode | production or development; unknown if unavailable |
| builtAt | UTC time when build configuration was evaluated; not publication time |
| sourceState | clean, modified or unavailable for the selected source scope |
| sourceCommit | Full Git revision only when the selected source inputs are clean |
| sourceFingerprint | SHA-256 of selected tracked paths and bytes, or null |

The scope includes application, components, library, runtime source, build
scripts, public assets, dependency manifests/locks and the listed build configs.
It also includes `.openai/hosting.json` and `.gitignore`. The exact allowlist is
in `scripts/build-identity.mjs`. Documentation, runtime data and host-generated
files outside that scope do not alter the fingerprint. Two documentation-only
revisions can have different commit IDs and the same source fingerprint.

Uncommitted changes or new files in the selected scope return `modified`, with
null commit and fingerprint. Missing Git, unreadable source or tracked source
symlinks return `unavailable`, also with null evidence. The build still runs.
No environment variable fallback can label an older artifact as a newer commit.

## Verification

The local build harness checks the served identity against its checkout's full
Git revision. It checks the public schema, cache/index headers and clean
production state. The public CI probe records an absent endpoint on an older
deployment without claiming rollout success.

For an explicit production comparison:

```sh
PARTYPRINT_REQUIRE_RELEASE=1 PARTYPRINT_EXPECT_RELEASE_COMMIT=<full-sha> node scripts/check-release-identity.mjs
```

Inspect `artifacts/release-identity.json`. Only schema-validated public fields
are retained. A production artifact must report the expected revision; when
comparing documentation-only revisions, inspect the known source diff and
fingerprint separately instead of silently accepting a different SHA.

## Limits

This is a source diagnostic, not a signed attestation or a Hostinger control
panel receipt. It does not prove installed dependency bytes, runtime settings,
database persistence, staff permissions, mail delivery or search indexing.
Continue to obtain Hostinger's successful deployment result for the exact
revision before closing V02 or synchronizing the Sites copy.

The worker source uses the same compile-time mechanism, but the Sites copy is
not deployed by publishing a GitHub change. Preserve the existing project and
its audience. Never copy old Sites source over the current production source.
