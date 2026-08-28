# Independent verification 2 — FAIL

**Candidate:** `5a5bf7eab139aa11c114bf7c9bfdab311bb3885e`  
**Live URL:** <https://terminal-recall.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Scope:** clean checkout, live deployment, release, installer, CLI, and browser;
no product source was modified.

## Decision

**FAIL.** The earlier deployment failures are repaired: the release is present,
the live assets match this candidate, and the declared claims/build/tests pass.
The candidate still fails configurable-redaction/privacy, touch-target, claims,
and honest-installation requirements; it also has a record-delete traversal flaw.

## First read and demo gate

Cold live `/` returned HTTP 200, title `Terminal Recall — save terminal output`,
one h1, and main. It plainly says it finds terminal output after it disappears,
is for developers needing a command result after a session ends, and says to
click `Try it with sample data` (`Opens a saved deploy record`). This gate passes.
`/demo` shows the realistic deploy output and persistent `Demo — sample data,
nothing is saved` banner with Reset demo and Start for real.

## Mandatory claims

After normal clean-checkout prerequisite `npm ci`, every exact command declared
in `.factory/claims.json` passed:

| Claim | Command | Result |
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

Before `npm ci`, Playwright was unavailable in the clean checkout; after the
documented install, no claim assertion failed.

## Positive verification evidence

* `npm test` passed 8/8. Rust tests passed 6/6. Typecheck, lint, production
  build, and `cargo package -p terminal-recall --allow-dirty --no-verify` passed.
* Fresh output: 9,206 B JS (3,980 gzip), 6,605 B CSS (2,140 gzip), and 153,336 B
  hero WebP, all within budget.
* A clean `cargo install --path cli --root <temporary directory>` produced a
  working 0.1.2 binary and demo. Explicit stdin capture, JSON search/list,
  encrypted-at-rest validation, bounded redacted export, expiry, invalid-ID
  recovery, delete, and demo were exercised. A 10,000-line record found line
  5,000 in **4 ms**.
* v0.1.2 includes Linux tarball/.deb/.rpm, Windows zip, both macOS tarballs/.pkg,
  SHA256SUMS, and `latest.json`. The Linux archive passed `sha256sum -c`, then
  extracted and ran. The isolated POSIX installer also downloaded, verified,
  installed, and ran 0.1.2.
* Live JS/CSS/hero hashes equal fresh candidate build: JS
  `9ead2249edc907a20603b2a67a1659de35f3c20a2de097df6bfa097c77418ec1`, CSS
  `7e601af93044519f8ca75ff91c6a20d8112d0bc5b8dc1ae41fec8d0f82db6f89`, hero
  `b106d20744b0acffdb88c04f9c4d5ef4f22ee6b138e71497c62ee41a92dc2dd4`.
* `verify-url.sh` passed live `/` (699 ms) and `/demo` (552 ms): title/lang/one
  h1/main/alt/label checks and zero console/page errors. Desktop and 390px mobile
  had no serious/critical Axe findings. The transcript is keyboard focusable;
  reduced motion is instant. The service-worker offline claim passed.
* Direct demo uses `demo:terminal-recall:logs`, does not create real storage, and
  the passing network claim observes only same-origin sample requests. Headers
  include CSP, HSTS, nosniff, strict-origin referrer policy, and immutable
  hashed-asset caching. No sign-in, application API, or license endpoint exists,
  so Entra and application rate-limit checks do not apply.

## Release-blocking defects

### P1 — configurable redaction rules are absent; export leaks a normal secret

The brief requires redaction by configured rules. The CLI has no configuration
command, file, or option; only hard-coded regexes. In a clean packaged-consumer
test, `DATABASE_URL=postgres://alice:private-password@db.internal/prod` was
written unchanged by `terminal-recall export <id> --context 0`.

### P1 — live interactive targets miss the mandatory 44px minimum

Fresh desktop and 390px measurements found wordmark **169×28**, skip link
**161×40**, demo-back **241×19**, footer Privacy **55×15**, and footer Terms
**39×15**. Axe does not measure this factory requirement.

### P1 — landing claims are not individually declared/proven

`Search encrypted local records.` and `Free local core.` are visitor-reliant
landing claims without individual `.factory/claims.json` tests. Encryption alone
does not prove search; no test proves the free-core claim.

### P1 — public Cargo installation instruction fails

The live Install section displays `cargo install terminal-recall`, but fresh
`cargo install terminal-recall --root <temporary directory>` returned `could not
find terminal-recall in registry crates-io`; `cargo search terminal-recall` found
no package. The README's source command (`cargo install --path cli`) is different.
Replace the site command with a proven release install, or publish and test it.

## Additional defects

### P2 — delete accepts traversal outside the store

In a controlled temporary test, `delete ../../../terminal-recall-victim.<random>`
returned 0 and deleted the controlled `.tr` file outside its record directory.

### P2 — unknown routes return HTTP 200

`/no-such-page` displays styled not-found content but returns SPA HTTP 200, not
the required designed HTTP 404 response.

### P3 — fresh numeric Lighthouse evidence unavailable

The available Lighthouse CLI could not launch a supported Chrome instance from
the supplied Playwright headless shell. Asset budget and functional accessibility
evidence pass; repeat with a supported-browser mobile Lighthouse report.

## Required remediation

1. Add local, documented, testable custom redaction rules; protect a non-built-in
   secret before export.
2. Make every target at least 44×44 CSS px.
3. Add individual sandbox tests for search/free-core claims or remove/reword them.
4. Correct or publish/test the displayed Cargo installation path.
5. Constrain delete to valid local record IDs, serve genuine HTTP 404s, and
   re-run full verification including Lighthouse.
