# Independent verification 4 — PASS

**Candidate:** `00a8cecd3465fcfe9535db9b0f82f1cb044131cb`  
**Live URL:** <https://terminal-recall.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean local install and production build, public CLI/package/release,
live site/demo/PWA, privacy, accessibility, mobile, and deployment identity.
Product source was not modified.

## Decision

**PASS.** The live deployment is the candidate build, all mandatory claims and
available quality checks pass, and the previously reported negative-expiry data
loss has been repaired. No release-blocking defect was found.

## Required first-read and demo gate

Cold Playwright navigation to the live home page returned HTTP 200, no console
or page errors, and showed:

* **What it does:** “Find terminal output after it disappears.”
* **For whom:** “For developers who need a command result after the session
  ends.”
* **What to do first:** the first primary action is **Try it with sample data**,
  followed by “Opens a saved deploy record.”

This passes the plain-words first-read gate. One click opened `/demo`, which
showed a realistic deploy transcript, the persistent “Demo — sample data,
nothing is saved” banner, **Reset demo**, and **Start for real**. It stored
only `demo:terminal-recall:logs`; leaving demo removed that key and never
created `terminal-recall:logs`.

## Mandatory claims — all pass

`.factory/claims.json` is present with 12 entries. After `npm ci` from this
candidate, every exact declared command passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| demo-private | `npm test -- --grep @claim:demo-private` | PASS (1) |
| redacted-export | `npm test -- --grep @claim:redacted-export` | PASS (1) |
| offline-demo | `npm test -- --grep @claim:offline-demo` | PASS (1) |
| no-demo-uploads | `npm test -- --grep @claim:no-demo-uploads` | PASS (1) |
| release-download | `npm test -- --grep @claim:release-download` | PASS (1) |
| encrypted-local-records | `cargo test --workspace claim_encrypted_local_records_are_not_plaintext` | PASS (1) |
| chosen-capture | `cargo test --workspace claim_capture_requires_explicit_command_or_stdin` | PASS (1) |
| no-upload-path | `cargo test --workspace claim_no_upload_path_is_present` | PASS (1) |
| verified-installers | `npm run test:installers` | PASS |
| configured-redaction | `cargo test --workspace claim_custom_redaction_rules_protect_database_urls_before_export` | PASS (1) |
| encrypted-search | `cargo test --workspace claim_search_encrypted_local_records_returns_saved_match` | PASS (1) |
| free-local-core | `cargo test --workspace claim_free_local_core_requires_no_account_or_payment` | PASS (1) |

## Local quality gates

All available repository checks passed:

```sh
npm ci
npm test                         # 11/11 Playwright
npm run lint                     # TypeScript plus Clippy, warnings denied
cargo test --workspace           # 10 unit + 1 public-CLI integration
npm run test:deployment
npm run build                    # Vite production site + release CLI
cargo package -p terminal-recall --allow-dirty --no-verify
```

The production output is 9,272 bytes JavaScript (4.01 kB gzip) and 6,957
bytes CSS (2.22 kB gzip), well under the static budgets. The 153,336-byte hero
WebP is within the mobile hero budget. `npm ci` reported two pre-existing
transitive `npm audit` advisories (one moderate and one high); this is a
non-blocking dependency-maintenance note, not a runtime test failure.

## CLI, package, and installer verification

The release build captured piped output into an isolated encrypted store,
listed and searched it with `--json`, applied a local `DATABASE_URL` redaction
rule, and produced an excerpt containing `[REDACTED]` but not the credential.
Invalid record IDs and invalid regex rules returned actionable exit code 2.
`expire --days=-1` returned exit code 2 with “days must be zero or greater”;
the pre-existing record remained listed. This directly rechecks the prior P1.

A 10,000-line isolated capture returned the known line-5,000 search match in
4.37 ms. A packaged `terminal-recall-0.1.3.crate` installed into a fresh
consumer root and its installed binary successfully ran `--version`, `--help`,
and `demo`.

GitHub release `v0.1.3` exposes the expected Linux, Windows, and macOS archive
assets plus `SHA256SUMS` and `latest.json`. Downloaded
`terminal-recall-linux-x86_64.tar.gz` passed `sha256sum -c` and its extracted
binary reported `terminal-recall 0.1.3`. The checked installer regression also
requires SHA-256 verification in both POSIX and PowerShell installers.

## Live deployment, privacy, PWA, and accessibility

`npm run test:live` passed against the live URL after the fresh local build.
It asserts the live HTML asset names and byte hashes equal the candidate build:

* JS `2661bc41eb5d10ba3cc5fa863b82b304387d42419cb6df9f68eaefca90fdc260`
* CSS `aa54bfc53e1270587a179d63eb29c7ba535b12ea865f1762d460388d917d0dd6`
* Service worker `dab544d285d2ef5a38928e1395f1c6684865b9985a3556ec45994ef0bcbcfee3`
* Hero image `b106d20744b0acffdb88c04f9c4d5ef4f22ee6b138e71497c62ee41a92dc2dd4`

Fresh live request logging saw same-origin assets plus only the documented
GitHub release-metadata request on landing. During demo search and redacted
export, it saw no additional network requests. The live headers include CSP,
HSTS, `X-Content-Type-Options: nosniff`, and strict-origin referrer policy.
Hashed JS/CSS use `public, max-age=31536000, immutable`; HTML and the worker
use 30-second revalidation.

The supplied `verify-url.sh` passed (HTTP 200; title; `lang=en`; one h1; main;
zero missing image alt attributes; zero console errors; 679 ms cold load).
Live desktop and 390 px mobile checks found no horizontal overflow, visible
undersized interactive targets, console/page errors, or Axe serious/critical
findings. Keyboard-only testing reached and operated the skip link, navigation,
demo action, record search, transcript, export, and footer links; the designed
focus indicator is visible. Under reduced motion, the transcript remained
keyboard-focusable. `/demo`, `/privacy`, and `/terms` served successfully;
an unknown route returned the designed HTTP 404.

The current `terminal-recall-v3` service worker replaced v2, and controlled
`/demo` reloaded successfully while offline. There is no product sign-in,
backend endpoint, paid unlock, or runtime Sociobot call, so Entra and API
allowance/429 checks are not applicable.

## Defects by severity

No P0, P1, P2, or P3 product defects found.

## Evidence and recheck

Repository tests are reproducible with the commands above. Live evidence from
the current run is in `/tmp/terminal-recall-live-evidence/` for this disposable
verification environment. Re-run `npm run test:live` after any deployment; it
will fail if the deployed hashed assets diverge from a fresh local build.
