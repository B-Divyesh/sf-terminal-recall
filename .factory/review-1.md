# Adversarial first-read review 1 — Terminal Recall

**Verdict: FAIL**  
**Reviewed:** 2026-08-28 UTC  
**Candidate:** `c6a04e913534cc3335a5329799fc624a9f0e0a74`  
**Live site:** <https://terminal-recall.sociobot.in>

The first screen is clear and the declared tests pass. The product does not pass
this review because demo data survives one normal exit path, the web demo is not
evidence of the real CLI running, the 404 fails the accessibility and shared-site
skeleton, and public claims remain outside compliant claim tests.

## 1. Cold first read

Fresh Chromium contexts opened the live site at 390×844 and 1440×900 with
`scrollY = 0`.

| Question | Answer from the first screen | Result |
| --- | --- | --- |
| What does it do? | It keeps selected terminal output so it can be found after the terminal session ends. | PASS |
| For whom? | Developers who need a command result after a session ends. | PASS |
| What should I click first? | `Try it with sample data`; the adjacent text says `Opens a saved deploy record.` | PASS |

The exact first-screen text that establishes this is `Find terminal output after
it disappears`, `For developers who need a command result after the session
ends.`, and `Try it with sample data`. All three facts and the primary action are
visible without scrolling at 390 px. There were no console errors.

## 2. Findings

Findings are ordered by severity. Every proposed fix is concrete and testable.

### Blocking

#### F-1-1 — Leaving the demo with browser Back does not discard demo data

- **Quote/location:** `.factory/claims.json` says `Demo data is separate from real
  local records and is discarded when leaving demo.` The banner says `Demo —
  sample data, nothing is saved`.
- **Evidence:** From a fresh context, `/` → `Try it with sample data` created
  `demo:terminal-recall:logs`. Browser Back returned to `/`, removed the banner,
  but left that key in `localStorage`. The active element also became `BODY`.
  The declared `@claim:demo-private` test passes only because it exits through
  `Start for real`; it does not exercise browser Back.
- **Why this fails:** A standard way to leave demo mode contradicts the declared
  claim and leaves data behind after the UI says demo mode ended.
- **Fix:** In `popstate`, detect a transition from demo to non-demo, remove the
  `demo:` namespace, render, focus the new h1, and announce the route. Extend
  `@claim:demo-private` with Back and Forward cases and a pre-existing
  `terminal-recall:logs` sentinel.

#### F-1-2 — The one-click browser demo is not the real CLI in use

- **Quote/location:** `/demo`; the UI presents `Search the sample deploy record`
  and `Export redacted excerpt` as the product.
- **Evidence:** `src/main.ts` hard-codes the sample, search, and a separate
  JavaScript redaction implementation. It never runs the CLI. The actual
  `terminal-recall demo` command does work in a temporary directory and writes an
  encrypted record plus a redacted export, but that real execution is not what the
  landing page shows. The Rust command and browser also duplicate rather than load
  `examples/deploy-check.txt`.
- **Why this fails:** For a CLI installer, a browser facsimile can drift from the
  shipped binary and is not the required recording of the real binary doing its
  main job. A first-time visitor cannot tell that the visible behavior is simulated.
- **Fix:** Add a self-hosted terminal recording generated from the released binary
  running the bundled sample through capture, search, and export. Label the
  interactive browser UI as a simulation if it remains. Add a test that regenerates
  or validates the recording against the shipped sample and released command.

#### F-1-3 — The production 404 fails WCAG and the required site skeleton

- **Quote/location:** `https://terminal-recall.sociobot.in/missing-review-route`
  returns the page `This record is not here` with `Return home`.
- **Evidence:** The route correctly returns HTTP 404, but Axe reports serious
  `color-contrast`: `#087d76` on `#f6f0df` is 4.38:1, below 4.5:1. At 390 px the
  only link is 119×21 px, below the 44 px touch target. The document has no
  `main`, header, footer, skip link, description, canonical, Open Graph metadata,
  or favicon.
- **Why this fails:** The error route is a real user route and violates the
  non-negotiable accessibility baseline and consistent-route skeleton.
- **Fix:** Build the 404 with the shared header/main/footer/skip-link structure,
  a designed focus state, a ≥44 px home action, and a link color of at least
  4.5:1. Add 404 Axe, target-size, landmark, and metadata checks to the live suite.

#### F-1-4 — Release availability across all named platforms is unlisted

- **Quote/location:** README: `Release assets are published for Linux, macOS, and
  Windows.`
- **Why this fails:** `release-download` tests one mocked Linux archive. No claim
  entry asserts the published Linux, macOS, and Windows set named by this sentence.
- **Fix:** Add a `release-platform-assets` entry and a fixture-backed test that
  requires every named platform asset, or narrow the sentence to the tested scope.

#### F-1-5 — The unsigned-binary disclosure is unlisted and untested

- **Quote/location:** README: `Windows and macOS binaries are unsigned; on macOS
  use right-click → Open if Gatekeeper asks.`
- **Why this fails:** Visitors may rely on this security disclosure, but no claim
  records or verifies the signing state.
- **Fix:** Add a release-artifact signing-state check and claim entry, or replace
  the assertion with a release-notes link whose signing status is generated from
  verified release metadata.

#### F-1-6 — Homebrew installation is an unlisted claim

- **Quote/location:** README: `Homebrew users can install the tap.`
- **Why this fails:** No claim entry installs through the public tap in a clean
  sandbox.
- **Fix:** Add a `homebrew-install` claim and clean macOS/Linuxbrew install smoke
  test, or remove the instruction until it is continuously verified.

#### F-1-7 — Scoop installation is an unlisted claim

- **Quote/location:** README: `Scoop users can add this repository as a bucket and
  install terminal-recall.`
- **Why this fails:** No claim entry exercises the public bucket and installed
  binary.
- **Fix:** Add a `scoop-install` claim with a clean Windows smoke test, or remove
  the instruction.

#### F-1-8 — The winget readiness statement is unlisted

- **Quote/location:** README: `The winget/ folder is ready for submission to
  microsoft/winget-pkgs.`
- **Why this fails:** “Ready” is a release-quality claim with no schema or package
  validation in `claims.json`.
- **Fix:** Add a `winget-manifest-valid` claim using the official validator, or
  rewrite: `The winget/ folder contains draft manifests that have not been
  submitted.`

#### F-1-9 — Export-context behavior is unlisted

- **Quote/location:** README: `export --context N writes the first 2N + 1 lines as
  a bounded excerpt.` and `Use --context 0 only when you deliberately need the
  full record.`
- **Why this fails:** A unit test exists, but neither sentence has a claim entry,
  so the verifier cannot discover or require it from `claims.json`.
- **Fix:** Add one `bounded-export-context` claim whose CLI test checks positive,
  zero, and overflow-safe values through the public binary.

#### F-1-10 — The built-in redaction breadth is broader than its claim test

- **Quote/location:** Landing: `Exported excerpts replace common keys and tokens.`
  README: `Built-in export rules replace common API keys, tokens, passwords, and
  bearer tokens.`
- **Why this fails:** `redacted-export` downloads one browser sample containing
  only an `API_KEY`. It does not prove tokens, passwords, bearer tokens, or the CLI
  path named in the README.
- **Fix:** Expand the claim text and tagged test to exercise every named secret
  class through the public CLI and browser demo, or narrow the copy to API keys.

#### F-1-11 — Direct rule-file editing and status discovery are unlisted

- **Quote/location:** README: `You can also edit the local redaction-rules.json
  file shown beside the encrypted records by terminal-recall status.`
- **Why this fails:** The configured-redaction claim writes the file internally;
  it does not run `status`, edit the reported file, then export through the CLI.
- **Fix:** Add a tagged public-CLI test for that exact workflow or remove the
  direct-edit instruction.

#### F-1-12 — PowerShell command support is unlisted

- **Quote/location:** README: `The same run form works from PowerShell.`
- **Why this fails:** The chosen-capture test inspects Rust source and never runs
  the shown PowerShell command on Windows.
- **Fix:** Add a Windows claim test that runs the documented command and confirms
  a searchable record, or qualify the statement as unverified.

#### F-1-13 — Status, expiry, and deletion behavior is absent from the claim ledger

- **Quote/location:** README: `Use terminal-recall status to print that folder and
  its key fingerprint.` and `terminal-recall expire --days 30 removes old records;
  delete RECORD_ID removes one record.` Privacy also says `Delete records with the
  command line tool.`
- **Why this fails:** These are user-reliant CLI outcomes. Tests exist for some
  edge cases, but no claim entry makes the documented outcomes mandatory.
- **Fix:** Add separate `status-output`, `expire-records`, and `delete-record`
  entries with public-binary tests.

#### F-1-14 — Loss-of-key behavior is unlisted

- **Quote/location:** README: `Losing the local key makes saved records
  unreadable.`
- **Why this fails:** The encryption test proves a round trip with the correct key
  but does not remove or replace the key and assert recovery fails.
- **Fix:** Add a `lost-key-unreadable` claim and destructive test contained in a
  temporary store, or remove the sentence.

#### F-1-15 — The no-analytics statement is unlisted

- **Quote/location:** README: `The static site has no analytics.` Privacy says
  `The site has no analytics and sends no captured output anywhere.` and `The free
  local core does not require an account, payment, or third-party analytics.`
- **Why this fails:** `no-demo-uploads` covers only `/demo`. The landing page is
  outside that test and intentionally contacts GitHub for release metadata.
- **Fix:** Add a `no-analytics` claim that crawls every route and classifies every
  request, explicitly allowing only the GitHub release API where needed.

#### F-1-16 — The release-workflow artifact list is unlisted

- **Quote/location:** README: `It publishes Linux, Windows, and macOS archives,
  Linux .deb/RPM packages, macOS .pkg files, checksums, a manifest, and
  package-manager metadata.`
- **Why this fails:** The current release happens to contain these files, but no
  declared claim test requires the whole list.
- **Fix:** Add a `release-artifact-set` claim that validates the generated release
  fixture and the public release manifest.

#### F-1-17 — The live checksum statement is unlisted

- **Quote/location:** Landing install section: `Checksum is in the release.`
- **Why this fails:** The mocked `release-download` claim checks only the archive
  link. `verified-installers` scans script text but does not assert that the live
  release supplies the checksum named by the page.
- **Fix:** Add a claim that resolves the shown release and matches its archive to
  a `SHA256SUMS` entry, or remove this sentence from the dynamically rendered state.

#### F-1-18 — Three declared claim tests inspect source instead of outcomes

- **Quote/location:** `@claim:chosen-capture`, `@claim:free-local-core`, and
  `@claim:verified-installers`.
- **Evidence:** The first two search `main.rs` for words. The installer test only
  regex-matches shell source. None invokes the promised workflow. The
  `no-upload-path` test is also only a small forbidden-token scan and can miss
  other process or library paths. The `offline-demo` entry says its claim appears
  in the README, but the README makes no offline statement. The `redacted-export`
  entry says “configured API keys” while its browser fixture uses a fixed built-in
  pattern.
- **Why this fails:** The claims contract requires observable sandbox outcomes,
  not proof that expected strings exist in source. These claims are therefore not
  fully tested even though their commands exit zero.
- **Fix:** Exercise the public binary for opt-in capture and account-free use;
  install valid fixtures and reject corrupted fixtures with both installers; and
  use a network-denied CLI sandbox or complete dependency/source audit for the
  no-upload claim.

### Major

#### F-1-19 — Back and Forward navigation lose route focus

- **Quote/location:** `/` ↔ `/demo` browser history.
- **Evidence:** Link navigation focuses the new h1, but browser Back and Forward
  leave `document.activeElement` on `BODY` because `popstate` renders without the
  focus step used by `route()`.
- **Why this fails:** Keyboard and screen-reader users are not placed at the new
  route content, contrary to the routing contract.
- **Fix:** Centralize post-render focus/announcement logic and call it from both
  programmatic navigation and `popstate`. Add Back/Forward assertions.

#### F-1-20 — The sample record is an inert button

- **Quote/location:** Landing and demo control `Deploy smoke test`.
- **Evidence:** It is rendered as `<button class="record selected">` but has no
  event handler and produces no result when activated.
- **Why this fails:** A keyboard or touch user reaches a control that does
  nothing, and the noun label does not name an action.
- **Fix:** Render the single selected record as non-interactive text, or implement
  record selection and label it `Open Deploy smoke test`.

#### F-1-21 — Social metadata does not use the required share image

- **Quote/location:** `index.html` uses
  `og:image=/hero-terminal-recall.webp`; its generated source is 1536×1024 and it
  is displayed as 1200×800, not the required 1200×630 share asset. Demo, Privacy,
  and Terms also retain the landing Open Graph title and description.
- **Why this fails:** Route shares are misleading and the image does not match the
  required card dimensions.
- **Fix:** Generate a product-art-derived 1200×630 image and update route-specific
  Open Graph/Twitter title, description, image, and URL during navigation.

### Minor copy findings

#### F-1-22 — `LOCAL EVIDENCE LAYER` is unexplained jargon

- **Why this fails:** “Layer” does not tell a cold visitor what is local or saved.
- **Rewrite:** `SAVED ON YOUR DEVICE`.

#### F-1-23 — `Free local core.` uses an undefined product term

- **Why this fails:** “Core” suggests that an unstated paid or hosted product also
  exists.
- **Rewrite:** `Free. No account needed.`

#### F-1-24 — `Demo records use a separate local storage key.` exposes implementation jargon

- **Why this fails:** A visitor needs the safety outcome, not browser-storage
  terminology.
- **Rewrite:** `The demo never reads or changes your saved records.`

#### F-1-25 — `Search a captured session` changes the name of the sample

- **Why this fails:** The preceding action calls it a “saved deploy record”; this
  heading calls the same object a “captured session.”
- **Rewrite:** `Search a saved record`.

#### F-1-26 — `THREE SMALL STEPS` is not meaningful out of context

- **Why this fails:** It does not name the job when headings are read as a list.
- **Rewrite:** `HOW TO SAVE AND FIND OUTPUT`.

#### F-1-27 — The README overview sentence exceeds the hard cap

- **Quote:** `The local core captures a command only when you run it, encrypts
  records with AES-256-GCM beside a local key, searches them, and writes redacted
  text excerpts.` — 26 words.
- **Why this fails:** It combines capture, encryption, search, and export in one
  sentence and uses “local core” and cryptographic jargon before the workflow is
  clear.
- **Rewrite:** `Terminal Recall saves only commands you run through it. It
  encrypts and searches local records, then exports redacted excerpts.`

#### F-1-28 — The README heading `Use` has no standalone meaning

- **Rewrite:** `Capture, search, and export records`.

#### F-1-29 — `browser sandbox` introduces a second term for demo

- **Quote:** `Try the browser sandbox at /demo, or run terminal-recall demo.`
- **Why this fails:** The site and documentation otherwise call this a demo.
- **Rewrite:** `Try the sample demo at /demo, or run terminal-recall demo.`

## 3. Complete copy audit

Counting rule: whitespace-delimited visible words; code spans, URLs, and
hyphenated terms count as one word. Commands and sample telemetry are interface
data, not prose sentences, and are listed separately. No banned marketing words
were found.

### Live landing-page prose

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Find terminal output after it disappears | 6 | Pass |
| 2 | For developers who need a command result after the session ends. | 11 | Pass |
| 3 | Opens a saved deploy record. | 5 | Pass |
| 4 | Capture commands on purpose. | 4 | Pass |
| 5 | Search encrypted local records. | 5 | Pass; claim `encrypted-search` |
| 6 | Free local core. | 3 | F-1-23 |
| 7 | Demo records use a separate local storage key. | 8 | F-1-24 |
| 8 | You start each capture. | 4 | Pass; claim `chosen-capture` |
| 9 | Records stay on this device. | 5 | Pass; claims `encrypted-local-records`, `no-upload-path` |
| 10 | Exported excerpts replace common keys and tokens. | 7 | F-1-10 |
| 11 | Download for linux: terminal-recall-linux-x86_64.tar.gz. | 4 | Pass; claim `release-download` |
| 12 | Checksum is in the release. | 5 | F-1-17 |
| 13 | Selected terminal output, kept close. | 5 | Pass |

### Landing headings, actions, labels, and sample text

| Text | Words | Result |
| --- | ---: | --- |
| Skip to content | 3 | Pass |
| Terminal Recall | 2 | Pass wordmark |
| Demo / Install / Privacy | 1 each | Pass navigation |
| LOCAL EVIDENCE LAYER | 3 | F-1-22 |
| Try it with sample data | 5 | Pass result-naming primary action |
| SAVED OUTPUT | 2 | Pass |
| Search a captured session | 4 | F-1-25 |
| Find in record | 3 | Pass form label |
| Try: health check | 3 | Pass placeholder |
| Deploy smoke test | 3 | F-1-20 |
| 6 saved lines | 3 | Pass status |
| Export redacted excerpt | 3 | Pass result-naming action |
| THREE SMALL STEPS | 3 | F-1-26 |
| Keep the command result you need | 6 | Pass |
| Run / Search / Export | 1 each | Pass step verbs |
| It does not watch your terminal | 6 | Pass |
| INSTALL | 1 | Pass |
| Install the command line tool | 5 | Pass |
| POSIX installer / PowerShell installer / Release page | 2 each | Pass link labels |
| `checking api… ok` / `reading deployment plan` / `migrations: 12 applied` / `health check: 200 OK` / `deploy finished` | 3 / 3 / 3 / 4 / 2 | Pass sample data |

### README prose

| # | Sentence | Words | Result |
| ---: | --- | ---: | --- |
| 1 | Terminal Recall saves selected terminal output on your device. | 9 | Pass |
| 2 | It is for developers and operators who need to find a command result after a session ends. | 17 | Pass |
| 3 | The local core captures a command only when you run it, encrypts records with AES-256-GCM beside a local key, searches them, and writes redacted text excerpts. | 26 | F-1-27 |
| 4 | It does not upload captured output. | 6 | Pass; `no-upload-path` |
| 5 | Try the browser sandbox at `/demo`, or run `terminal-recall demo`. | 10 | F-1-29 |
| 6 | Release assets are published for Linux, macOS, and Windows. | 9 | F-1-4 |
| 7 | Both scripts verify the published SHA-256 checksum before placing the binary on your PATH. | 14 | Pass wording; test gap F-1-18 |
| 8 | Windows and macOS binaries are unsigned; on macOS use right-click → Open if Gatekeeper asks. | 15 | F-1-5 |
| 9 | Homebrew users can install the tap. | 6 | F-1-6 |
| 10 | Scoop users can add this repository as a bucket and install `terminal-recall`. | 12 | F-1-7 |
| 11 | The `winget/` folder is ready for submission to `microsoft/winget-pkgs`. | 9 | F-1-8 |
| 12 | For a source build, install Rust and run: | 8 | Pass instruction |
| 13 | Capture only the command you choose: | 6 | Pass wording; test gap F-1-18 |
| 14 | `export --context N` writes the first `2N + 1` lines as a bounded excerpt. | 14 | F-1-9 |
| 15 | Use `--context 0` only when you deliberately need the full record. | 11 | F-1-9 |
| 16 | Built-in export rules replace common API keys, tokens, passwords, and bearer tokens. | 12 | F-1-10 |
| 17 | Add a rule for secrets that are specific to your environment before exporting. | 13 | Pass; `configured-redaction` |
| 18 | Rules stay in your local record folder and are never uploaded. | 11 | Pass; `no-upload-path` |
| 19 | For example, the rule above replaces a full `DATABASE_URL=...` credential with `[REDACTED]` in every future export. | 16 | Pass; `configured-redaction` |
| 20 | You can also edit the local `redaction-rules.json` file shown beside the encrypted records by `terminal-recall status`. | 16 | F-1-11 |
| 21 | Pipe output when wrapping is not convenient: | 7 | Pass |
| 22 | The same `run` form works from PowerShell: | 7 | F-1-12 |
| 23 | Records use AES-256-GCM with a local key stored beside the encrypted records. | 12 | Pass; `encrypted-local-records` |
| 24 | Use `terminal-recall status` to print that folder and its key fingerprint. | 11 | F-1-13 |
| 25 | `terminal-recall expire --days 30` removes old records; `delete RECORD_ID` removes one record. | 12 | F-1-13 |
| 26 | Losing the local key makes saved records unreadable. | 8 | F-1-14 |
| 27 | Requires Node 22+ and Rust stable. | 6 | Pass prerequisite |
| 28 | `npm run build:site` writes the static site to `dist/site` with `index.html` at its root. | 14 | Pass maintainer instruction; build verified |
| 29 | `npm run build` also builds the release CLI. | 8 | Pass maintainer instruction; build verified |
| 30 | `cargo package -p terminal-recall` creates the ready-to-publish Rust crate. | 9 | Pass maintainer instruction |
| 31 | The static site has no analytics. | 6 | F-1-15 |
| 32 | The demo uses `demo:terminal-recall:logs`; it never reads a real browser record. | 11 | F-1-1 test gap |
| 33 | Starting for real discards the demo key. | 7 | Pass on that exit path; `demo-private` |
| 34 | See `.factory/demo.md`. | 2 | Pass |
| 35 | The product has no account or paid feature. | 8 | Pass; `free-local-core` test gap F-1-18 |
| 36 | See `/privacy` and `/terms`. | 4 | Pass |
| 37 | Tag `v0.1.3` to run `.github/workflows/release.yml`. | 5 | Pass maintainer instruction |
| 38 | It publishes Linux, Windows, and macOS archives, Linux `.deb`/RPM packages, macOS `.pkg` files, checksums, a manifest, and package-manager metadata. | 19 | F-1-16 |
| 39 | The static site is deployed with `npm ci && npm run build:site` from `dist/site`. | 14 | Pass maintainer instruction |
| 40 | Catalog description: Find terminal output after it disappears. | 8 | Pass |

README headings: `Terminal Recall` (2), `Install` (1), `Add local redaction
rules` (4), `Develop and verify` (3), `Privacy and demo` (3), and `Release and
deployment` (3) pass. `Use` (1) fails as F-1-28. There are no banned words.

## 4. Demo and sandbox evidence

- One click from the first screen opens `/demo`.
- The first demo viewport contains the banner, `Deploy smoke test`,
  `./deploy-check --region fra1`, six realistic lines, search, and export.
- Searching `health` reports `1 matching lines`.
- Reset clears the search and restores the seeded sample.
- A preloaded real-key sentinel remained unchanged through entry, reset, and
  `Start for real`.
- `Start for real` removes the demo key. Browser Back does not; see F-1-1.
- A fresh direct `/demo` request log contained only
  `https://terminal-recall.sociobot.in`, including search, export, service-worker
  control, and an offline reload.
- `terminal-recall demo` was run from a temporary working directory. It created a
  unique `/tmp/terminal-recall-demo-*` store containing a 32-byte key, encrypted
  record, and `redacted-excerpt.txt`; the export contained `[REDACTED]` and not
  the sample key.

## 5. Declared claims

All exact commands were run after `npm ci` in clean clone
`/tmp/terminal-recall-review-1.y0TImC`.

| Claim | Exact command | Result |
| --- | --- | --- |
| `demo-private` | `npm test -- --grep @claim:demo-private` | PASS (1), but contradicted by Back; F-1-1 |
| `redacted-export` | `npm test -- --grep @claim:redacted-export` | PASS (1) |
| `offline-demo` | `npm test -- --grep @claim:offline-demo` | PASS (1) |
| `no-demo-uploads` | `npm test -- --grep @claim:no-demo-uploads` | PASS (1) |
| `release-download` | `npm test -- --grep @claim:release-download` | PASS (1) |
| `encrypted-local-records` | `cargo test --workspace claim_encrypted_local_records_are_not_plaintext` | PASS (1) |
| `chosen-capture` | `cargo test --workspace claim_capture_requires_explicit_command_or_stdin` | PASS (1), inadequate outcome test; F-1-18 |
| `no-upload-path` | `cargo test --workspace claim_no_upload_path_is_present` | PASS (1), limited source scan; F-1-18 |
| `verified-installers` | `npm run test:installers` | PASS, source regex only; F-1-18 |
| `configured-redaction` | `cargo test --workspace claim_custom_redaction_rules_protect_database_urls_before_export` | PASS (1) |
| `encrypted-search` | `cargo test --workspace claim_search_encrypted_local_records_returns_saved_match` | PASS (1) |
| `free-local-core` | `cargo test --workspace claim_free_local_core_requires_no_account_or_payment` | PASS (1), inadequate outcome test; F-1-18 |

No listed command failed. The claim set is still incomplete, and one declared
claim is false on an untested normal path.

## 6. History recheck

No earlier `.factory/review-*.md` or `.factory/polish-*.md` exists. The current
handoff and all four `verification*.md` reports were checked so their earlier
findings were not accepted on status alone.

| Earlier finding | Current evidence | Status |
| --- | --- | --- |
| No release / failing installer | Live release, archive, installers, and release links return 200; v0.1.3 exists. | Fixed |
| Dead paid checkout | Paid offer and checkout were removed; product states no paid feature. | Fixed |
| Hero contrast / transcript focus | Landing and demo have zero serious/critical Axe findings; transcript focuses. | Fixed |
| Missing TypeScript check | `npm run lint` runs `tsc --noEmit` and Clippy successfully. | Fixed |
| Unlisted/unproven claims | Manifest expanded, but F-1-4 through F-1-18 remain. | **Not fully fixed; blocking again** |
| Missing detected-platform link | Live page rendered the Linux v0.1.3 archive link. | Fixed |
| Ignored export context | Unit behavior and full Cargo suite pass. | Fixed |
| macOS installer mapping/checksum fallback | Source maps Darwin to macOS and supports `shasum -a 256`. | Fixed |
| Custom redaction absent | Public commands and claim test exist; `DATABASE_URL` test passes. | Fixed |
| App targets below 44 px | Landing/demo/privacy/terms pass; 404 is still below 44 px (F-1-3). | **Half-fixed; blocking again** |
| Cargo registry instruction failed | README now documents `cargo install --path cli`. | Fixed |
| Delete path traversal | Regression test passes. | Fixed |
| Unknown routes returned 200 | Unknown route now returns HTTP 404. | Fixed, but its page fails F-1-3 |
| Negative expiry deleted records | Public CLI regression passes; exit is nonzero and record remains. | Fixed |
| Service-worker replacement uncertainty | v3 activates, removes v2, and offline demo reload passes. | Fixed |

The current handoff's reproducible test statements were confirmed, but its `No
P0–P3 defects remain` conclusion misses the paths above.

## 7. Structure, links, visual identity, and accessibility

- `/`, `/demo`, `/privacy`, and `/terms` return 200, have route-specific titles,
  one h1, one main, correct canonical URLs, and consistent app header/footer.
- The real 404 returns 404 but fails F-1-3.
- Browser link crawl found no dead links: home, demo, install anchor, privacy,
  terms, both installer files, the v0.1.3 Linux archive, and the release page all
  resolved to 200 after redirects.
- Push navigation focuses the new h1. Back/Forward does not; F-1-19.
- `robots.txt` and `sitemap.xml` list the four intended routes.
- Landing, demo, privacy, and terms have no serious/critical Axe findings at
  390 px, no horizontal overflow, and no visible target below 44 px.
- The risograph paper/ink collage, clipped shapes, offset shadows, serif/mono
  pairing, and restrained print-settle motion are distinct and match
  `.factory/design.md`; this is not a generic gradient SaaS layout.
- The first-load JavaScript is 9.25 kB (4.01 kB gzip). The production build
  produces `dist/site`.

## 8. Missed leverage

`.factory/brief.json` is absent, so this check used the README, current feature
surface, and `.factory/design.md` as the available scope evidence.

No additional AI feature is justified. Search, local encryption, redaction, and
bounded export do not need model inference, and adding it would weaken the
local/offline promise. Import is already available through stdin capture and
export is present. Sync would conflict with the stated local-only product unless
the product scope changes. No missed-leverage finding is raised.

## 9. Verification summary

- `npm ci`: PASS; reports one moderate and one high transitive advisory.
- All 12 exact claim commands: PASS.
- `npm test`: PASS, 11/11.
- `npm run lint`: PASS.
- `cargo test --workspace`: PASS, 10 unit + 1 CLI integration.
- `npm run test:deployment`: PASS.
- `npm run build`: PASS; `dist/site` and release CLI produced.
- `npm run test:live`: PASS, which demonstrates that the current suite misses
  F-1-1, F-1-3, F-1-19, and the claim-quality gaps.
- `/opt/fleet/lib/verify-url.sh`: PASS for `/`.
- Independent live Axe: PASS on `/`, `/demo`, `/privacy`, `/terms`; FAIL serious
  contrast on `/404.html`.

## What would make this perfect

Fix every finding above, then rerun this review from a new context and clean
clone. Perfection requires the real CLI to be visibly demonstrated, every exit
from demo to erase the demo namespace without touching real data, every route
including 404 to meet the same accessible skeleton, every public claim to have a
discoverable outcome test, and every copy flag to be gone. Until all of those are
true, the verdict remains FAIL.
