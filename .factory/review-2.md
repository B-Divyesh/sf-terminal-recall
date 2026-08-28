# Adversarial first-read review 2 — Terminal Recall

**Verdict: PASS**  
**Reviewed:** 2026-08-28 UTC  
**Candidate:** `0bef815668c435748d9246f1caf550b499a8f0a4`  
**Live site:** <https://terminal-recall.sociobot.in>

There are zero findings. This was a fresh, full review rather than a diff-only check.

## 1. Cold first read

Fresh Chromium contexts visited the live site before scrolling at 390×844 and 1440×900. Both returned 200 with no console or page errors.

| Question | Answer visible on the first screen | Result |
| --- | --- | --- |
| What does it do? | `Find terminal output after it disappears` | Pass |
| For whom? | `For developers who need a command result after the session ends.` | Pass |
| What should I click first? | `Try it with sample data` — `Opens a saved deploy record.` | Pass |

The mobile first screen also shows all three plain facts: `Capture only commands you choose.`, `Search encrypted local records.`, and `Free. No account needed.`

## 2. Copy audit

Counting rule: whitespace-delimited words. Commands, filenames, URLs, and the verbatim terminal transcript are interface data rather than landing or README prose; the transcript is explicitly labelled `Real CLI run` and tested against the compiled binary. All prose sentences are at most 22 words. No banned marketing word, unexplained product term, inconsistent core term, empty mood heading, or non-result-naming button was found.

### Landing-page prose

| Text | Words | Result |
| --- | ---: | --- |
| Find terminal output after it disappears | 6 | Pass |
| For developers who need a command result after the session ends. | 11 | Pass |
| Opens a saved deploy record. | 5 | Pass |
| Capture only commands you choose. | 5 | Pass |
| Search encrypted local records. | 4 | Pass |
| Free. | 1 | Pass |
| No account needed. | 3 | Pass |
| See the command line tool run | 6 | Pass |
| The recording uses the bundled deploy sample. | 7 | Pass |
| Its generated file is checked against the compiled CLI in every test run. | 13 | Pass |
| Recorded from terminal-recall v0.1.4 using cli/examples/deploy-check.txt. | 6 | Pass |
| Search a saved record | 4 | Pass |
| The demo never reads or changes your saved records. | 9 | Pass |
| Browser simulation. | 2 | Pass |
| Install the CLI to save your own output. | 8 | Pass |
| Keep the command result you need | 6 | Pass |
| Run a chosen command | 4 | Pass |
| Search saved records | 3 | Pass |
| Export a redacted excerpt | 4 | Pass |
| It does not watch your terminal | 6 | Pass |
| You start each capture. | 4 | Pass |
| Records stay on this device. | 5 | Pass |
| Export removes common keys, tokens, passwords, and bearer tokens. | 9 | Pass |
| Install the command line tool | 5 | Pass |
| Checking for a download for your computer. | 7 | Pass |
| Download for linux: terminal-recall-linux-x86_64.tar.gz. | 4 | Pass; live platform label |
| Downloads are being published. | 4 | Pass; fallback state |
| Open the release files. | 4 | Pass |
| Save selected terminal output on your device. | 7 | Pass |

The short structural labels (`SAVED ON YOUR DEVICE`, `REAL COMMAND OUTPUT`, `SAMPLE RECORD`, `HOW TO SAVE AND FIND OUTPUT`, and `INSTALL`) name their sections. Buttons name their results: `Try it with sample data`, `Reset demo`, `Start for real`, and `Export redacted excerpt`.

### README prose

| Text | Words | Result |
| --- | ---: | --- |
| Terminal Recall saves only commands you run through it. | 9 | Pass |
| It encrypts and searches local records, then exports redacted excerpts. | 9 | Pass |
| It is for developers and operators who need a result after a terminal session ends. | 14 | Pass |
| The CLI works without an account or payment and sends no saved output over a network. | 15 | Pass |
| Try the isolated sample at https://terminal-recall.sociobot.in/?demo=1. | 5 | Pass |
| You can also run `terminal-recall demo` with the bundled deploy sample. | 11 | Pass |
| The release page provides archives for Linux, macOS, and Windows. | 10 | Pass |
| The installers compare the downloaded archive with its published SHA-256 value. | 10 | Pass |
| Windows and macOS files are unsigned in v0.1.4. | 8 | Pass |
| On macOS, use right-click → Open if Gatekeeper asks. | 9 | Pass |
| Each release includes `SIGNING-STATUS.json`, generated after the build checks its signing state. | 10 | Pass |
| The repository also contains a Homebrew formula, Scoop manifest, and draft winget manifests. | 12 | Pass |
| They are packaging inputs, not submitted package listings. | 8 | Pass |
| For a source build, install Rust and run: | 9 | Pass |
| Capture only the command you choose: | 6 | Pass |
| `export --context N` writes at most the first `2N + 1` output lines. | 9 | Pass |
| `--context 0` writes the full record. | 5 | Pass |
| Built-in export rules replace API keys, tokens, passwords, and bearer tokens. | 10 | Pass |
| Add a rule for secrets specific to your environment: | 9 | Pass |
| The rule above replaces the full `DATABASE_URL` value during later exports. | 10 | Pass |
| `terminal-recall status` prints the record folder and key fingerprint. | 8 | Pass |
| You may edit `redaction-rules.json` inside that folder. | 6 | Pass |
| Pipe output when wrapping a command is inconvenient: | 7 | Pass |
| `terminal-recall expire --days 30` removes older records. | 6 | Pass |
| `terminal-recall delete RECORD_ID` removes one chosen record. | 6 | Pass |
| Losing or replacing the local key makes saved records unreadable. | 10 | Pass |
| Use Node 22 or later and stable Rust: | 8 | Pass |
| `npm run build:site` writes the static site to `dist/site`. | 8 | Pass |
| `npm run build` also builds the release CLI. | 8 | Pass |
| The static site has no analytics. | 7 | Pass |
| Only the home page requests GitHub release metadata. | 9 | Pass |
| The CLI sends no captured output over a network. | 9 | Pass |
| The demo uses `demo:terminal-recall:logs`. | 3 | Pass |
| It never reads or changes `terminal-recall:logs`. | 5 | Pass |
| Resetting or leaving the demo discards its sample data. | 9 | Pass |
| The demo reloads offline after one successful visit. | 9 | Pass |
| See `.factory/demo.md`, `/privacy`, and `/terms`. | 4 | Pass |
| Tag `v0.1.4` to run `.github/workflows/release.yml`. | 5 | Pass |
| The workflow builds platform archives, Linux packages, macOS packages, checksums, and release manifests. | 12 | Pass |
| Deploy the static site with `npm ci && npm run build:site` from `dist/site`. | 11 | Pass |

Terminology remains consistent: a saved command output is a **record**; intentional saving is **capture**; secret removal is **redaction**; the isolated example is the **demo**; and the installed program is the **CLI**.

## 3. Demo and sandbox

One click from the fresh landing page opened `/?demo=1`. The first resulting screen already showed a realistic deploy transcript produced by the real CLI, the persistent `Demo — sample data, nothing is saved` banner, `Reset demo`, and `Start for real`.

With a pre-existing `terminal-recall:logs` sentinel, the demo created only `demo:terminal-recall:logs`. The browser export redacted the API key, token, password, and bearer token (four `[REDACTED]` replacements). Reset recreated the sample. Back and Start for real removed the demo key and preserved the real sentinel; Forward created a fresh demo key and focused the new h1. Request logging during demo search and export showed no additional request or sample-data upload. A first visit followed by offline reload remained usable.

The public `terminal-recall demo` command was run from a new temporary directory. It executed public `capture`, `search`, and `export` paths, printed its separate temporary storage directory, and wrote the redacted excerpt there.

## 4. Claims

After `npm ci`, every command named by `.factory/claims.json` passed from the candidate checkout. `npm test` passed all 22 Playwright tests; the installer and signing commands also passed. The exact claim predicates and their observable checks are present in `tests/claims.spec.ts`, `tests/installer.mjs`, and `tests/signing.mjs`.

| Claim id | Result |
| --- | --- |
| demo-private | Pass |
| cli-demo-recording | Pass |
| redacted-export | Pass |
| offline-demo | Pass |
| no-analytics | Pass |
| release-platform-assets | Pass |
| release-artifact-set | Pass |
| verified-installer | Pass |
| unsigned-release | Pass |
| encrypted-local-records | Pass |
| chosen-capture | Pass |
| no-upload-path | Pass |
| configured-redaction | Pass |
| bounded-export-context | Pass |
| status-output | Pass |
| expire-records | Pass |
| delete-record | Pass |
| lost-key-unreadable | Pass |
| free-no-account | Pass |

Every claim-like sentence on the landing page and README maps to one of those entries (or is a tested runtime label). No unlisted claim was found.

## 5. Prior-review recheck

Read `.factory/review-1.md`, `.factory/polish-1.md`, all verification reports, and the prior handoff. Each earlier finding was confirmed fixed both in the current source and on the deployment.

| Earlier finding | Current confirmation |
| --- | --- |
| F-1-1 | Back, Forward, Reset, and Start for real preserve a real sentinel and isolate/remove demo data. |
| F-1-2 | Self-hosted real-CLI recording is shown; the browser panel says `Browser simulation.` |
| F-1-3 | Live unknown route is HTTP 404 with shared landmarks, metadata, 44px targets, and no serious/critical Axe issue. |
| F-1-4 | Fixture and live checks cover Linux, macOS, and Windows archive selection. |
| F-1-5 | The public signing report and unsigned status check pass. |
| F-1-6 | README gives no Homebrew installation instruction. |
| F-1-7 | README gives no Scoop installation instruction. |
| F-1-8 | Winget is described only as draft packaging input. |
| F-1-9 | Public CLI context behavior is claim-tested. |
| F-1-10 | Browser and CLI export tests cover all four named secret classes. |
| F-1-11 | The test uses status output, edits the shown rule file, and exports. |
| F-1-12 | The unverified PowerShell behavior assertion is absent. |
| F-1-13 | Status, expiry, and deletion have public-CLI claims. |
| F-1-14 | Replacement-key unreadability has a temporary-store claim. |
| F-1-15 | Route crawl and interaction request logging cover no-analytics/no-upload copy. |
| F-1-16 | Archive, package, checksum, and manifest set is asserted. |
| F-1-17 | The unsupported checksum sentence is absent; installers test valid and corrupt fixtures. |
| F-1-18 | Claims exercise public CLI outcomes, a network guard, and installer fixtures. |
| F-1-19 | Link navigation, Back, and Forward focus the new h1 and announce the route. |
| F-1-20 | The selected sample record is non-interactive. |
| F-1-21 | The 1200×630 product share image and route-specific social metadata are live. |
| F-1-22 | `SAVED ON YOUR DEVICE` replaces the jargon label. |
| F-1-23 | `Free. No account needed.` replaces the undefined term. |
| F-1-24 | Demo safety states the outcome, not a storage implementation detail. |
| F-1-25 | The heading is consistently `Search a saved record`. |
| F-1-26 | The heading is `HOW TO SAVE AND FIND OUTPUT`. |
| F-1-27 | README opening is split into plain short sentences. |
| F-1-28 | README heading is `Capture, search, and export records`. |
| F-1-29 | Demo terminology is consistent; `browser sandbox` is absent. |

## 6. Structure, privacy, and quality

Checked live on desktop and 390px mobile:

- Correct titles, one h1, descriptions, canonical URLs, route-specific Open Graph/Twitter values, favicon, `lang=en`, and theme color.
- `/`, `/?demo=1`, `/demo`, `/privacy`, `/terms`, `/404.html`, sitemap, robots, installers, and every linked destination returned successfully; unknown app paths return a designed HTTP 404.
- Header, skip link, footer, Privacy, and Terms are present across routes.
- Back/Forward state and focus work; the app uses real paths, not hash routing.
- No console errors, no 390px overflow, no undersized visible controls, and no serious or critical Axe issue. Reduced-motion and keyboard transcript checks pass.
- Live request logging showed same-origin files plus the documented GitHub release metadata request on home only. The CSP permits that origin and contains `frame-ancestors` as a response header.
- The visual system is a distinct risograph paper/terminal collage, matching `.factory/design.md`, rather than a generic SaaS template.

`npm run typecheck`, `npm run build`, `npm run test:deployment`, `npm test`, `npm run test:installers`, `npm run test:signing`, and `npm run test:live` all passed. The production live-identity test confirms the deployed assets match the candidate build.

## 7. Missed leverage

No missing AI feature was found: this local CLI does not need one. The brief's obvious additional value—redacted export—is present in the real CLI, browser demo, and claims. Import, account sync, and provider-backed AI would conflict with the explicit local-first, no-upload job and are not expected features.

## What would make this perfect

No product change is required by this review. Keep the existing release, claim, and live-identity checks mandatory for each future version so the demonstrated installer, offline demo, and privacy behavior cannot drift.
