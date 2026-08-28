# Perfection-loop polish 1

Candidate repaired: `00a8cecd3465fcfe9535db9b0f82f1cb044131cb`  
Review consumed: `.factory/review-1.md` at `949ded1d73a8b142aea29f047d1586909ec86ca7`  
Release: `v0.1.4`  
Live site: <https://terminal-recall.sociobot.in>

Every review finding is closed below. Screenshot evidence is under
`.factory/evidence/`; the final live suite also writes JSON and screenshots to
`.factory/evidence/live-polish-1/`.

| Finding | Change made | Evidence |
| --- | --- | --- |
| F-1-1 | Centralized demo transitions. Back, Start for real, and Reset delete only `demo:terminal-recall:logs`; Forward reseeds it and preserves a real-data sentinel. | `@claim:demo-private`; `polish-1-mobile-demo.png`; live `/?demo=1` Back/Forward check. |
| F-1-2 | The CLI demo now invokes the public capture, search, and export commands with `cli/examples/deploy-check.txt`. A generated asciinema v2 cast appears on home and demo. The browser control is labeled “Browser simulation.” | `@claim:cli-demo-recording`, `npm run test:recording`; `polish-1-demo.png`; live home and `/?demo=1`. |
| F-1-3 | Rebuilt `404.html` with skip link, header/nav/main/footer, metadata, icons, darkened teal, designed focus, and 44 px targets. | `static 404 page has…`; `npm run test:deployment`; `polish-1-404.png`; live unknown URL returns 404 and passes Axe. |
| F-1-4 | Added a platform asset claim that exercises Linux, macOS, and Windows fixture metadata and detected-platform selection. | `@claim:release-platform-assets`; live release API check. |
| F-1-5 | Platform-native release jobs now verify the files are unsigned and emit `SIGNING-STATUS.json`; README states the checked v0.1.4 status and Gatekeeper step. | `@claim:unsigned-release`; successful macOS/Windows release jobs and public signing report. |
| F-1-6 | Removed the unverified Homebrew install command. The formula is described only as a packaging input. | `reviewed wording…`; README audit. |
| F-1-7 | Removed the unverified Scoop install instruction. The manifest is described only as a packaging input. | `reviewed wording…`; README audit. |
| F-1-8 | Reworded winget “ready” to “draft winget manifests” with no submission claim. | `reviewed wording…`; README audit. |
| F-1-9 | Added a public-binary claim for positive, zero, and large overflow-safe context values. | `@claim:bounded-export-context`. |
| F-1-10 | Expanded the bundled sample and both browser/CLI outcome checks across API keys, tokens, passwords, and bearer tokens. | `@claim:redacted-export`; live downloaded excerpt check. |
| F-1-11 | The test runs status, edits its reported local rule file, then captures and exports through the public CLI. | `@claim:configured-redaction`. |
| F-1-12 | Removed the unsupported assertion that the documented run form had been verified on PowerShell. | `reviewed wording…`; README audit. |
| F-1-13 | Added public-binary status, expiry, and single-record deletion claims. | `@claim:status-output`, `@claim:expire-records`, `@claim:delete-record`. |
| F-1-14 | Added a temporary-store test that replaces the key and observes decryption failure. | `@claim:lost-key-unreadable`. |
| F-1-15 | Added a request-recording crawl of home, demo, legal, and missing routes; demo search/export emits no request. | `@claim:no-analytics`; live request-origin check. |
| F-1-16 | Added the complete archive, deb, RPM, pkg, checksum, and manifest fixture requirement. The live suite checks the public release set. | `@claim:release-artifact-set`; `npm run test:live`. |
| F-1-17 | Removed “Checksum is in the release.” Installers now prove acceptance of a valid fixture and rejection of a corrupt one before placement. | `@claim:verified-installer`; live release checksum check. |
| F-1-18 | Replaced source-string claim tests with public CLI workflows, an LD_PRELOAD network guard, and executable installer fixtures. Windows CI runs the PowerShell fixture. | `@claim:chosen-capture`, `@claim:free-no-account`, `@claim:no-upload-path`, `npm run test:installers`. |
| F-1-19 | One post-route routine now focuses the h1 and updates the polite announcement after links, Back, and Forward. | `@claim:demo-private`; live Back/Forward focus assertions. |
| F-1-20 | Replaced the inert sample button with a non-interactive selected-record block. | `npm test`; `polish-1-mobile-demo.png`; live demo keyboard pass. |
| F-1-21 | Added a product-art-derived 1200×630 WebP and route-specific canonical, Open Graph, and Twitter metadata. | `the product share image is exactly…`, `route titles, metadata…`; live route crawl. |
| F-1-22 | Replaced `LOCAL EVIDENCE LAYER` with `SAVED ON YOUR DEVICE`. | `reviewed wording…`; `polish-1-mobile-home.png`; live home. |
| F-1-23 | Replaced `Free local core.` with `Free. No account needed.` | `reviewed wording…`, `@claim:free-no-account`; live home. |
| F-1-24 | Replaced storage jargon with `The demo never reads or changes your saved records.` | `reviewed wording…`, `@claim:demo-private`; live demo. |
| F-1-25 | Standardized the heading to `Search a saved record`. | `reviewed wording…`; `polish-1-demo.png`; live demo. |
| F-1-26 | Replaced the decorative step label with `HOW TO SAVE AND FIND OUTPUT`. | `reviewed wording…`; `polish-1-home.png`; live home. |
| F-1-27 | Split the README overview into short plain sentences without “local core” or front-loaded crypto jargon. | `reviewed wording…`; `.factory/copy-audit.md`. |
| F-1-28 | Renamed `Use` to `Capture, search, and export records`. | `reviewed wording…`; README audit. |
| F-1-29 | Replaced `browser sandbox` with `isolated sample` and standardized the product term to `demo`. | `reviewed wording…`; README and live demo. |

## Cross-cutting verification

- Every one of the 19 exact commands in `.factory/claims.json` passed from a
  fresh local clone.
- `npm test` passes 22 browser, behavior, metadata, mobile, and Axe tests.
- `npm run test:installers`, `npm run test:recording`, `npm run test:deployment`,
  `npm run lint`, `cargo test --workspace`, and `npm run build` pass.
- Local mobile Lighthouse: performance 98, accessibility 100, best practices
  100, SEO 100, LCP 2.42 s, CLS 0, total blocking time 21 ms.
- The final live suite verifies deployment byte identity, all release assets,
  checksum validity, privacy request origins, offline reload, Back/Forward
  cleanup and focus, 390 px layout, 404 status/shell/targets, Axe, and console.
