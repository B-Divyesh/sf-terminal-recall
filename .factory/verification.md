# Independent verification — FAIL

**Candidate:** `52af3e9566287e65ef11c98cb6d4003226a84b29`  
**Live URL:** https://terminal-recall.sociobot.in  
**Verified:** 2026-08-28 UTC  
**Scope:** clean-checkout CLI-installers and deployed site verification. No product
source was modified.

## Decision

**FAIL.** The local CLI core is credible and the live site matches the candidate,
but this is not a releasable installer product. There is no GitHub release or
tagged release asset, the one-line installer fails, the advertised checkout is a
404, live accessibility has serious violations, and the available TypeScript
check fails because the repository has no `tsconfig.json`.

## First read and demo gate

Cold live desktop visit returned HTTP 200, title `Terminal Recall — save terminal
output`, and one h1: `Find terminal output after it disappears`.

* What it does: finds saved terminal output after a session ends.
* Who it is for: developers who need a command result after the session ends.
* First action: `Try it with sample data`, with the adjacent explanation `Opens a
  saved deploy record.`

This plain-language gate passes. The action opens `/demo`, displays the persistent
`Demo — sample data, nothing is saved` banner, sample output, Reset demo, and
Start for real. Keyboard Enter activated both Try and Start for real. Live offline
reload of `/demo` also passed after the service worker controlled the page.

## Mandatory claim tests (run first, clean checkout)

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-private` | `npm test -- --grep @claim:demo-private` | PASS, 1 test |
| `redacted-export` | `npm test -- --grep @claim:redacted-export` | PASS, 1 test |
| `offline-demo` | `npm test -- --grep @claim:offline-demo` | PASS, 1 test |

The aggregate `npm test` also passed (4 Playwright tests, including its local
desktop axe check). These passing tests do not cure the claim-completeness finding
below: claims for opt-in capture, encryption/local-only storage, and no uploads
are present in landing/README copy but absent from `claims.json`.

## Local build and CLI evidence

* `npm ci`: PASS (installed 18 packages; npm reported 1 moderate and 1 high
  dependency vulnerability).
* `npm test`: PASS, 4/4.
* `cargo test --workspace`: PASS, 2/2.
* `cargo clippy --workspace -- -D warnings`: PASS.
* `npm run build`: PASS; produced `dist/site` and `target/release/terminal-recall`.
  Initial JS is 10,490 bytes (4,360 gzip), CSS 6,530 bytes (2,120 gzip), and
  hero WebP 153,336 bytes, within stated static budgets.
* `npx tsc --noEmit`: **FAIL (exit 1)**. The repository has no `tsconfig.json`;
  TypeScript prints its help rather than checking `src/main.ts`. There is no
  configured lint/type-check npm script.
* `cargo package -p terminal-recall --allow-dirty --no-verify`: PASS; created the
  crate package. A clean temporary `cargo install --path cli --root <temp>`
  installed a working consumer binary.

CLI end-to-end checks against the release binary passed: stdin capture, JSON id,
case-insensitive search, AES-GCM ciphertext not containing the captured API-key
plaintext, redacted export, invalid-record recovery (exit 2 and actionable help),
delete, expiry, `demo`, `--help`, and `--json list`. A 10,000-line captured record
returned the known line in **0.005 seconds**, below the five-second brief target.

## Live deployment, browser, privacy, and security checks

The deployed JavaScript, CSS, and hero are byte-identical to this candidate build:

| Asset | SHA-256 |
| --- | --- |
| `assets/index-DN2qtGem.js` | `d0ed5e28dc0560bb40ba82f4bd94baf79b05b34f1062e953d33536c922b36881` |
| `assets/index-BRqKZTEX.css` | `a24f81547fffc8f3f57b87135e70a634529f7d991da3d5a2168b87ac7ae70a16` |
| `hero-terminal-recall.webp` | `b106d20744b0acffdb88c04f9c4d5ef4f22ee6b138e71497c62ee41a92dc2dd4` |

Desktop and 390px mobile had no horizontal overflow or console/page errors.
Skip-link focus, visible focus outlines, keyboard navigation, focus movement to
route h1, 44px interactive targets (except the compact demo-banner controls), and
reduced-motion transition duration of 0s were observed. `/`, `/demo`, `/privacy`,
`/terms`, installers, service worker, and hashed assets returned 200. Responses
include CSP, `X-Content-Type-Options: nosniff`, and strict-origin referrer policy;
hashed JS/CSS are immutable for one year. The demo flow made no third-party network
request and required no sign-in. No sign-in is offered, so Entra tenant validation
is not applicable.

Live Playwright axe evidence:

* Desktop: serious `color-contrast` on the primary Try button. `#fffaf0` on
  `#d84b42` measures **4.03:1**, below the required 4.5:1.
* 390px mobile: the same serious contrast violation plus serious
  `scrollable-region-focusable` on the horizontally/vertically scrollable captured
  output `<pre>`, which cannot receive keyboard focus.

The `/demo` offline reload worked after first visit. The service worker cache name
is the fixed `terminal-recall-v1`; no deployment update was available to exercise,
so update replacement could not be proven.

The optional billing verify endpoint was exercised with an invalid synthetic
license only. A burst of 50 requests produced 29 HTTP 200 responses then 21 HTTP
429 responses; the first 429 was request 30 and included `Retry-After: 3`.
`?license=` is stripped from the URL, stored locally, and an invalid license
quietly shows the expected inactive notice. No secrets were used.

## Release-blocking defects

### P1 — no installable release; installer fails

`GET https://api.github.com/repos/B-Divyesh/sf-terminal-recall/releases/latest`
returned **404**. There is no tag containing the candidate. The live page therefore
states that downloads are being published, and running the required command
`curl -fsSL https://terminal-recall.sociobot.in/install.sh | sh` exits **22** on
the GitHub 404. No platform asset, `SHA256SUMS`, or `latest.json` could be
downloaded and verified. This fails the cli-installers release contract.

The release workflow also does not produce the required `.deb`, `.rpm`, macOS
`.pkg`, or Homebrew tap/formula. The shipped Scoop file has
`"hash":"TO_BE_FILLED_FROM_RELEASE"` and cannot be used.

### P1 — advertised paid checkout is a dead link

`https://api.sociobot.in/api/v1/products/terminal-recall/checkout` returned HTTP
**404** with `{"error":"enabled factory product","status":404}`. The visible
`Buy team rules` action therefore cannot purchase the stated $29 product.

### P1 — serious live accessibility failures

The two axe serious findings above violate the mandatory accessibility gate. The
primary CTA’s contrast also violates the explicit 4.5:1 text requirement.

### P1 — TypeScript quality check is not configured and fails

TypeScript is a development dependency, but `npx tsc --noEmit` exits 1 because no
project configuration exists. Vite transpilation is not a type check.

### P1 — unlisted, unproven user claims

`claims.json` covers only demo separation, redacted export, and offline demo. The
landing/README additionally make user-reliant claims including `Only commands you
choose`, `Encrypted on your device`, `Records stay on this device`, `does not ...
upload captured output`, and checksum-verifying installers. They lack individual
claim entries and demo-observable tests, contrary to the claims contract. The
existing `demo-private` test only asserts that the real key is absent; it neither
asserts a `demo:` namespace nor exercises cross-namespace isolation.

### P2 — release download UI can never be populated

`releaseLink()` looks for `#download-state`, but no such element is rendered by
`landing()`. Even after a release exists, it returns immediately instead of showing
the OS-detected asset. This fails the obvious per-platform install action.

### P2 — bounded excerpt option is ignored

The CLI declares `export --context`, but its implementation discards the context
argument and writes the whole decrypted record. That is contrary to the intended
bounded, portable excerpt and can disclose more local output than requested.

### P3 — additional release and PWA quality gaps

The POSIX installer maps macOS to `darwin` while workflow filenames use `macos`,
and it invokes `sha256sum`, which macOS does not provide by default. The fixed
service-worker cache version also makes future deployment-update behaviour
uncertain. A Lighthouse numeric run was attempted but could not connect to the
preinstalled Chromium through Lighthouse; bundle measurements and live axe checks
are recorded above instead.

## Required remediation before re-verification

1. Fix the serious axe findings and add a real TypeScript project/check script.
2. Register/fix the Sociobot checkout product and prove the purchase route works.
3. Tag and publish a release for this candidate; verify all required platform
assets, checksums, manifest, landing download link, and one installer end to end.
4. Complete required installer packaging and usable Scoop/Homebrew/Linux/macOS
artifacts, then repair the macOS installer mapping/checksum command.
5. Add a rendered `#download-state` (or equivalent) and test detected-platform
release linking.
6. Either add sandbox tests for every privacy/opt-in/encryption/install claim or
remove those claims; make demo namespace isolation observable.
7. Honor `export --context` or remove the argument and describe full-record export
honestly.
