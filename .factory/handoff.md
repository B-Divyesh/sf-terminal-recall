# Terminal Recall polish 1 handoff

## Result

Perfection-loop round 1 is complete. All findings F-1-1 through F-1-29 in
`.factory/review-1.md` are resolved and mapped in `.factory/polish-1.md`.
There are no unresolved findings.

- Live site: <https://terminal-recall.sociobot.in>
- Demo: <https://terminal-recall.sociobot.in/?demo=1>
- Release: <https://github.com/B-Divyesh/sf-terminal-recall/releases/tag/v0.1.4>
- Successful release workflow:
  <https://github.com/B-Divyesh/sf-terminal-recall/actions/runs/33207126734>
- Release source commit: `7553803e6da19f687298a76633eb3d2b7ea5afc7`
- Homebrew tap commit: `1822367b9ebfd6aa7a493dc190b4e2cd0a2946c4`

## What changed

- Made `?demo=1` the one-click isolated path. Back, Forward, Reset, and Start
  for real now preserve real data, discard demo data on exit, focus the new h1,
  and announce route changes.
- Changed the CLI demo to execute public capture, search, and export paths using
  the single packaged sample at `cli/examples/deploy-check.txt`.
- Added a self-hosted asciinema v2 recording generated from the compiled CLI.
  The interactive browser panel is explicitly labeled as a simulation.
- Rebuilt the static 404 with the shared header/main/footer, accessible link
  contrast, 44 px targets, focus styling, metadata, favicon, and HTTP 404 routing.
- Added route-specific titles, descriptions, canonicals, Open Graph/Twitter
  fields, a 1200×630 share image, and a 180×180 touch icon.
- Rewrote first-screen, demo, heading, and README language to close every copy
  finding. The verb-first catalog description is 83 characters.
- Replaced source-inspection claims with public CLI workflows, download
  assertions, a runtime network guard, and valid/corrupt installer fixtures.
- Added native Windows installer CI. Replaced unavailable `Get-FileHash` with
  the .NET SHA-256 API.
- Added platform-native signing-state checks and public
  `SIGNING-STATUS.json`. The checked v0.1.4 Windows and macOS files are unsigned.
- Corrected the generated Homebrew formula for macOS arm64/x86_64 and Linux,
  verified all three archive hashes, and updated the public tap.
- Updated Scoop and draft winget manifests to v0.1.4 release URLs and hashes.
- Updated Vite to 6.4.3; `npm audit` reports zero vulnerabilities.

## Verification evidence

From the working tree:

```text
npm test                         22 passed
npm run test:installers          passed valid and corrupt POSIX fixtures
npm run test:recording           cast matches compiled CLI output
npm run test:deployment          SPA routes and complete static 404 passed
npm run lint                     TypeScript and Clippy passed
cargo test --workspace           8 passed
npm run build                    passed; dist/site produced
cargo package -p terminal-recall passed and verified the packaged crate
npm audit                        0 vulnerabilities
```

Every exact command for all 19 entries in `.factory/claims.json` passed from a
fresh clone of the pushed repository. This includes the public v0.1.4 signing
report after release.

GitHub Actions run 33207126734 passed:

- Linux verification: all browser, claim, installer, recording, lint, and Rust tests.
- Windows: valid fixture installed; corrupted checksum was rejected.
- Linux, Windows, macOS arm64, and macOS x86_64 builds passed.
- The release published 19 assets, including all archives, deb/RPM/pkg packages,
  SHA256SUMS, latest.json, package-manager metadata, and signing evidence.
- The downloaded Linux archive hash matched its SHA256SUMS entry.
- The public Homebrew formula hashes matched all three referenced archives.

Cold production verification:

```text
npm run test:live                passed
verify-url.sh                    HTTP 200; 0 console errors; title/lang/h1/main/alt passed
unknown live route               HTTP 404; shared shell, metadata, Axe, targets passed
Lighthouse mobile               performance 99; accessibility 100; best practices 100; SEO 100
LCP                              1,997 ms
CLS                              0
Total blocking time              44 ms
Initial JS                       12,802 bytes (5.16 kB gzip)
CSS                              7,878 bytes (2.38 kB gzip)
```

The live suite also passed:

- exact local/live hashes for JS, CSS, hero, share image, cast, and service worker;
- Linux archive checksum, public manifest, and complete release asset set;
- no console or page errors;
- only same-origin plus the GitHub release API on home;
- no demo interaction requests;
- Back/Forward demo cleanup, reseeding, and h1 focus;
- offline demo reload under cache `terminal-recall-v4`;
- desktop and 390×844 Axe checks, touch targets, keyboard transcript, and no overflow.

Evidence:

- `.factory/evidence/live-polish-1/live-check.json`
- `.factory/evidence/live-polish-1/lighthouse.json`
- `.factory/evidence/live-polish-1/live-desktop.png`
- `.factory/evidence/live-polish-1/live-demo-desktop.png`
- `.factory/evidence/live-polish-1/live-mobile-390.png`
- `.factory/evidence/live-polish-1/live-404-mobile.png`

## Known gaps and operator notes

No review or acceptance gap remains. Windows and macOS release files are
intentionally unsigned and are disclosed in README and the generated signing
report. Future certificate signing would remove the documented macOS
right-click step. The winget files remain draft submission inputs; the site does
not claim that winget installation is available.
