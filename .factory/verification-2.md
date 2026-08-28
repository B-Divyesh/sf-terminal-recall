# Independent verification 2 — FAIL

**Candidate:** `5a5bf7eab139aa11c114bf7c9bfdab311bb3885e`
**Live URL:** https://terminal-recall.sociobot.in
**Verified:** 2026-08-28 UTC
**Scope:** clean checkout, deployment, release, installer, and CLI; no product source changed.

## Decision

**FAIL.** The repaired release now installs and the main local workflow works, but it misses a core brief requirement: users cannot configure redaction rules, and an export leaks a representative database credential. The deployed interface also violates the required 44px touch-target baseline. See defects below.

## First read and demo gate

A cold live visit returned HTTP 200, `Terminal Recall — save terminal output`, `lang=en`, one h1, and a main landmark. The first screen says what it does (“Find terminal output after it disappears”), who it is for (“For developers who need a command result after the session ends”), and what to do first (“Try it with sample data”; “Opens a saved deploy record”). This gate **passes**.

The action opens `/demo`, with a persistent “Demo — sample data, nothing is saved” banner, Reset demo, and Start for real. A fresh live demo flow requested only `https://terminal-recall.sociobot.in`, created `demo:terminal-recall:logs`, and did not create `terminal-recall:logs`.

## Mandatory claim gate

`.factory/claims.json` exists. Before dependencies were installed the exact browser commands could not start because the clean clone lacked `@playwright/test`; after the required `npm ci`, every declared exact command passed.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-private` | `npm test -- --grep @claim:demo-private` | PASS, 1 browser test |
| `redacted-export` | `npm test -- --grep @claim:redacted-export` | PASS, 1 browser test |
| `offline-demo` | `npm test -- --grep @claim:offline-demo` | PASS, 1 browser test |
| `no-demo-uploads` | `npm test -- --grep @claim:no-demo-uploads` | PASS, 1 browser test |
| `release-download` | `npm test -- --grep @claim:release-download` | PASS, 1 browser test |
| `encrypted-local-records` | `cargo test --workspace claim_encrypted_local_records_are_not_plaintext` | PASS |
| `chosen-capture` | `cargo test --workspace claim_capture_requires_explicit_command_or_stdin` | PASS |
| `no-upload-path` | `cargo test --workspace claim_no_upload_path_is_present` | PASS |
| `verified-installers` | `npm run test:installers` | PASS |

The declared claim tests pass, but the unlisted-claim defect remains.

## Local quality gates

`npm ci`, `npm test` (8/8), `npm run typecheck`, `npm run lint` (including `clippy -D warnings`), `cargo test --workspace` (6/6), `npm run build`, and `cargo package -p terminal-recall --allow-dirty --no-verify` all passed. `dist/site` contains 9,206 B JS (3,980 B gzip), 6,605 B CSS (2,140 B gzip), and a 153,336 B hero WebP, within budget.

## CLI, package, installer, and release evidence

I unpacked `terminal-recall-0.1.2.crate`, installed it into an empty consumer root, and exercised the public binary. `--help` and `--version` worked. A selected 10,000-line command was encrypted at rest (neither marker nor credential appeared in store bytes); search retrieved line 5,000 in **4 ms**, below the five-second brief target. Stdin capture, JSON list/search, bounded export, `expire --days 0`, invalid-ID recovery (exit 2 plus help), and demo were exercised.

The published v0.1.2 Linux archive verified against published `SHA256SUMS`; `latest.json` parsed and lists Linux, Windows, macOS arm64, and macOS x86_64 archives. The live `install.sh`, run with an isolated temporary HOME, downloaded, verified, installed, and ran `terminal-recall 0.1.2`.

## Live deployment and browser evidence

Live `index.html`, hashed JavaScript, and `sw.js` are byte-identical to a fresh candidate build. v0.1.2 resolves to `aca971d439d61bce5ae6f3768f11b6a1dee6ea85`, an ancestor of the candidate; candidate-only changes are docs, metadata, and tests, not runtime code.

Desktop and 390px mobile had no horizontal overflow, console errors, or page errors. Live Axe Playwright scans found **0 serious/critical** violations. A focused input had a visible 3px coral outline. Demo export/reset/Start for real worked. Reduced-motion mode had 0 animations and a 0s hero transition. After service-worker control, live `/demo` reloaded offline. Responses have HTTPS, CSP, `X-Content-Type-Options`, strict-origin referrer policy, and immutable one-year cache headers on hashed JS. There are no application API or sign-in endpoints, so rate-limit and Entra checks are not applicable.

## Release-blocking defects

### P1 — configured redaction rules are absent; export leaks a normal secret

The brief requires secrets redacted by configured rules. The CLI has no configuration command, file, or option for redaction rules; only a hard-coded regex list exists. In the clean packaged-consumer test, capture line 5,000 contained:

```text
needle-5000 DATABASE_URL=postgres://alice:private-password@db.internal/prod
```

`terminal-recall export <id> --context 0` wrote that exact credential unchanged at line 5004. The API-key fixture redacts, but that does not protect user-defined/customer-data patterns. This fails the privacy/success contract.

### P1 — live targets are below the mandatory 44px minimum

Fresh live measurement on desktop and 390px found wordmark **169×28**, skip link **161×40**, demo back link **241×19**, footer Privacy **55×15**, and footer Terms **39×15**. Axe does not flag this criterion, but the factory accessibility baseline requires 44×44 CSS px for every interactive target.

### P1 — landing claims lack individual declared sandbox tests

“Search encrypted local records.” and “Free local core.” are visitor-reliant landing claims but have no corresponding `.factory/claims.json` entry/test. The encryption test does not assert search behavior, and no free-core assertion is tested. The claims contract makes unlisted claims a review failure.

## Additional defects

### P2 — `delete` accepts traversal outside the record directory

In a controlled temporary test, creating `/tmp/terminal-recall-victim.<random>.tr` and running `terminal-recall --home <temporary-store> delete ../../../terminal-recall-victim.<random>` returned 0 and deleted the file. Validate generated record IDs and constrain resolved paths to the records directory.

### P2 — unknown live routes return HTTP 200

`/no-such-page` renders the styled client “This record is not here” content but returns the SPA shell with HTTP 200, not the required designed 404 response. This is wrong for crawlers and direct link consumers.

## Required remediation

1. Add a local, documented, testable custom-redaction mechanism; apply it before export and add a non-built-in secret claim test.
2. Make every target at least 44×44 CSS px and re-run desktop/mobile accessibility checks.
3. Add listed demo-observable claim tests for search and free local core, or remove/reword the claims.
4. Validate IDs/constrain delete paths; add a traversal regression test.
5. Serve unknown routes as the designed HTTP 404 while keeping documented deep links working.
