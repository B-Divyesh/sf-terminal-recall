# Independent verification 3 — FAIL

**Candidate:** `8fc734c54eea0fe112a9c3480d09a0b8bf0660bd`
**Live URL:** <https://terminal-recall.sociobot.in>
**Verified:** 2026-08-28 UTC
**Scope:** fresh local clone, released CLI, live site, demo, PWA, accessibility,
privacy, and deployment; product source was not changed.

## Decision

**FAIL.** The deployment-only issue reported previously is not present: the live
site serves the exact candidate build, the release exists, and all declared
claim tests pass. A new independent CLI boundary check found that an invalid
negative retention period is accepted and immediately removes current records.
That violates the brief's verifiable local deletion/expiry requirement and is
unrecoverable user-data loss.

## First read and demo gate

A cold live `GET /` returned 200 with title `Terminal Recall — save terminal
output`, `lang="en"`, one h1, and a main landmark. The first viewport says
**“Find terminal output after it disappears”**, says it is **“For developers
who need a command result after the session ends”**, and the first action is
**“Try it with sample data”** with the plain result **“Opens a saved deploy
record.”** The required first-read gate passes.

The action opens `/demo` in one click. It showed the realistic deploy record,
the persistent `Demo — sample data, nothing is saved` banner, Reset demo, and
Start for real. The live demo wrote only
`demo:terminal-recall:logs`, not `terminal-recall:logs`; its downloaded excerpt
contained `[REDACTED]` and no sample `sk_demo_` key.

## Mandatory claims — all pass

I cloned the candidate into `/tmp/terminal-recall-qa-FWVLvC`, ran `npm ci`, and
ran every exact command in `.factory/claims.json` from that clean clone. The
manifest is present and contains 12 claims.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-private` | `npm test -- --grep @claim:demo-private` | PASS (1) |
| `redacted-export` | `npm test -- --grep @claim:redacted-export` | PASS (1) |
| `offline-demo` | `npm test -- --grep @claim:offline-demo` | PASS (1) |
| `no-demo-uploads` | `npm test -- --grep @claim:no-demo-uploads` | PASS (1) |
| `release-download` | `npm test -- --grep @claim:release-download` | PASS (1) |
| `encrypted-local-records` | `cargo test --workspace claim_encrypted_local_records_are_not_plaintext` | PASS (1) |
| `chosen-capture` | `cargo test --workspace claim_capture_requires_explicit_command_or_stdin` | PASS (1) |
| `no-upload-path` | `cargo test --workspace claim_no_upload_path_is_present` | PASS (1) |
| `verified-installers` | `npm run test:installers` | PASS |
| `configured-redaction` | `cargo test --workspace claim_custom_redaction_rules_protect_database_urls_before_export` | PASS (1) |
| `encrypted-search` | `cargo test --workspace claim_search_encrypted_local_records_returns_saved_match` | PASS (1) |
| `free-local-core` | `cargo test --workspace claim_free_local_core_requires_no_account_or_payment` | PASS (1) |

## Local verification

All available checks passed in the clean clone:

```sh
npm test                       # 11 passed
npm run typecheck
npm run lint
npm run test:installers
npm run test:deployment
cargo test --workspace         # 10 passed
npm run build
cargo package -p terminal-recall --allow-dirty --no-verify
```

The exact production build produced `dist/site`, a 9,272-byte JS bundle
(4.01 kB gzip), a 6,957-byte CSS bundle (2.22 kB gzip), and a 153,336-byte
hero WebP—within the static budgets. A Lighthouse mobile report measured 91
performance, 100 accessibility, 2.1 s LCP, 0 CLS, and 340 ms TBT.

## CLI and installer evidence

`cargo install --path cli --root <fresh temporary consumer root>` produced a
working `terminal-recall 0.1.2`. In an isolated record store I exercised stdin
capture, `--json` list/search, custom `DATABASE_URL` redaction, redacted export,
plaintext-at-rest inspection, invalid regexp recovery, invalid record-ID
recovery, and the bundled `demo`. The encrypted record did not contain the
known API key, database password, or search phrase; the exported file contained
two `[REDACTED]` replacements and no password/key.

A representative 10,000-line captured record returned its known line 5,000
match in 13 ms (capture plus search wall time), well inside the five-second
brief measure.

GitHub release `v0.1.2` is published with Linux tarball, deb, rpm; Windows zip;
both macOS tarballs and pkg files; `SHA256SUMS`; and `latest.json`. Downloaded
`terminal-recall-linux-x86_64.tar.gz` passed `sha256sum -c` against the release
manifest, extracted, and reported `terminal-recall 0.1.2`. The POSIX and
PowerShell checksum assertion is covered by the passing installer claim test.

## Live deployment, privacy, and accessibility

The live JS and CSS SHA-256 values exactly equal the fresh candidate output:

* JS `982e222765525d3f21c0703b5f84dd79b3ac8f7761961cdba365e354679615a5`
* CSS `aa54bfc53e1270587a179d63eb29c7ba535b12ea865f1762d460388d917d0dd6`
* Hero WebP `b106d20744b0acffdb88c04f9c4d5ef4f22ee6b138e71497c62ee41a92dc2dd4`
* Service worker `31d16a614069c8f9a24a929da35dc68c2fff0a6ffd4aac0b300fdf7b35bb6190`

Fresh live Playwright checks at desktop and 390px mobile found zero console or
page errors, zero Axe serious/critical findings on landing and demo, and zero
visible links/buttons/inputs under 44 by 44 CSS pixels. Keyboard Tab reaches
the skip link, navigation, sample action, search field, transcript, export,
install links, and footer links. The focus ring is visible; with reduced motion
the hero transition computed to `0s`.

The landing page requests only same-origin assets plus the documented
`https://api.github.com/.../releases/latest` metadata request. After entering
the demo and searching/exporting, there were no additional network requests;
thus captured sample content has no third-party path. Live headers include CSP
(`connect-src` only self, GitHub API, and the unused Sociobot API allowance),
HSTS, `nosniff`, and strict-origin referrer policy. Hashed JS/CSS are
`max-age=31536000, immutable`; HTML and worker use 30-second revalidation.

`/demo`, `/privacy`, and `/terms` return 200; an unknown route returns the
designed 404 with HTTP 404. The active PWA cache is `terminal-recall-v2`; a
live controlled `/demo` reload worked offline with no errors. The worker's
activation path removes non-current cache versions, and the repository
regression for replacement cache version passed.

There is no sign-in flow, application backend endpoint, paid unlock, or
factory product-unlock call. Entra tenant and application rate-limit/429 checks
are therefore not applicable.

## Release-blocking defect

### P1 — negative expiry value deletes valid local records

In a temporary store containing one newly captured record, the public CLI
accepted this input:

```sh
terminal-recall --home <temporary-store> expire --days=-1
```

It returned exit 0 and printed `Deleted 1 record(s) older than -1 days.` A
following `terminal-recall --home <temporary-store> --json list` returned `[]`.
The space form `--days -1` is rejected by Clap, but the equals form is accepted.
Negative days is not a valid expiry policy; it must be rejected before any
record is considered. The deletion has no recovery path.

## Required remediation and recheck

1. Reject `days < 0` before computing the cutoff, returning an actionable
   nonzero error and leaving every record unchanged. Add a regression test for
   `expire --days=-1` using a temporary store.
2. Re-run every claim command, the full local suite, packaged-consumer CLI
   exercise, and the live verification after deployment.

## Non-blocking notes

`npm ci` reports two pre-existing transitive audit advisories (one moderate and
one high). No dependency upgrade was made during verification. The supplied
Chromium emitted a Lighthouse tab-crash diagnostic after producing its JSON
report; the reported scores above are supplemental to the direct Playwright,
bundle, and accessibility checks.
