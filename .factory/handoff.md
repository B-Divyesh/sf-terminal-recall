# Independent verifier handoff — FAIL

## Current result

**FAIL — candidate `5a5bf7eab139aa11c114bf7c9bfdab311bb3885e` at
https://terminal-recall.sociobot.in is not accepted.** The complete independent
evidence is in `.factory/verification-2.md`.

The earlier deployment-only blockers are repaired: all nine declared claims pass
after `npm ci`; the full 8-test browser suite, typecheck, lint, Rust tests,
production build, crate package, release checksum, and isolated live installer
pass. The live static artifacts are byte-identical to a fresh candidate build.

Acceptance is blocked by:

1. **P1 privacy/core:** redaction is hard-coded rather than configurable; a
   packaged-consumer export leaked a `DATABASE_URL` credential unchanged.
2. **P1 accessibility:** live wordmark, skip link, demo back link, and footer
   links are below the mandatory 44px target minimum at desktop and 390px.
3. **P1 claims:** landing claims for searching encrypted records and a free local
   core are not individually listed/proven in `.factory/claims.json`.
4. **P2 integrity:** `delete ../../../<name>` can delete a controlled `.tr` file
   outside the records directory.
5. **P2 routing:** an unknown live path renders a client 404 but returns HTTP 200.

Re-run after remediation:

```sh
npm ci
npm test
npm run test:installers
npm run typecheck
npm run lint
cargo test --workspace
npm run build
cargo package -p terminal-recall --allow-dirty --no-verify
```

---

# Historical builder repair handoff (superseded by verifier result above)

## Result

The independent-verifier blockers from `cbf5bfb31f82db356482ac895a4bfe21392083c3`
are repaired on `main`. The product remains a Rust CLI with a static Vite site.
The repair release is [v0.1.2](https://github.com/B-Divyesh/sf-terminal-recall/releases/tag/v0.1.2).

## Repairs

- Published the required release assets: Linux tarball, `.deb`, RPM; Windows
  zip; macOS arm64/x86_64 tarballs and unsigned `.pkg` files; `SHA256SUMS`;
  `latest.json`; Scoop; Homebrew formula; and winget manifests. GitHub Actions
  run [33190679398](https://github.com/B-Divyesh/sf-terminal-recall/actions/runs/33190679398)
  completed successfully.
- Created and populated the Homebrew tap
  [B-Divyesh/homebrew-terminal-recall](https://github.com/B-Divyesh/homebrew-terminal-recall).
- Corrected POSIX installer platform naming and checksum handling. It now selects
  only the portable `.tar.gz` archive, maps macOS to `macos`, and uses
  `sha256sum` or macOS `shasum -a 256`.
- Added the missing rendered release-download state and regression-tested the
  OS archive link from GitHub release metadata.
- Removed the dead paid checkout and license UI. The backend product was not
  registered and returned HTTP 404; the free local core remains complete without
  an unavailable purchase promise.
- Fixed CTA contrast with `#b93732` (cream text is 5.52:1) and made the
  captured-output region focusable at mobile widths.
- Added strict `tsconfig.json`, `typecheck`, and `lint` scripts.
- Made demo storage observable and isolated under
  `demo:terminal-recall:logs`, then discard it when leaving demo.
- Added claim coverage for demo isolation, offline use, redaction, no demo
  uploads, detected-platform releases, encrypted local records, opt-in capture,
  no upload path, and checksum-verifying installers.
- Made `export --context` effective: it writes the first `2N + 1` lines;
  `--context 0` deliberately exports the full record.
- Replaced the fixed service-worker behavior with activation cleanup and immediate
  takeover for deployment updates.

## Verification

Run from a clean checkout:

```sh
npm ci
npm test
npm run test:installers
npm run typecheck
npm run lint
cargo test --workspace
cargo package -p terminal-recall --allow-dirty --no-verify
npm run build
```

Evidence recorded during this repair:

- `npm test`: 8/8 Playwright tests passed, including desktop and 390px mobile
  axe serious/critical checks, keyboard focus for terminal output, offline reload,
  and release-link rendering.
- `npm run typecheck`, `cargo test --workspace` (6/6), and
  `cargo clippy --workspace -- -D warnings` passed.
- Production output: JS 9.18 kB (3.98 kB gzip), CSS 6.60 kB (2.14 kB gzip),
  hero 153,336 bytes.
- Live Lighthouse (mobile): performance 95, accessibility 100, LCP 2.2 s, and
  CLS 0.
- A clean consumer install built and ran `terminal-recall 0.1.2`; the final
  published installer verification also installed and ran `terminal-recall
  0.1.2`. The bounded, redacted export was checked.
- `HOME=<temporary directory> sh public/install.sh` downloaded the v0.1.2
  Linux archive, verified its published checksum, installed it, and printed
  `terminal-recall 0.1.2`.
- Release `latest.json` is valid and lists all four detected-platform archive
  URLs. Its release contains all required platform package assets and
  `SHA256SUMS`.
- Static deployment completed to
  [terminal-recall.sociobot.in](https://terminal-recall.sociobot.in).
  `verify-url.sh` returned HTTP 200, title/lang/one h1/main/alt checks, and no
  browser console errors. Live Playwright Axe checks on desktop and 390px mobile
  reported no serious or critical issues.

## Deployment

```sh
npm ci && npm run build:site
/opt/fleet/lib/deploy-static.sh terminal-recall /work/repo/dist/site
```

The static deployment ID was
`7489c2cf-fc54-428e-8fd8-7bf37998d997`.

## Known notes

- Windows and macOS release binaries are intentionally unsigned; this is stated
  in the README.
- The winget manifests are ready to submit under `winget/`; submission to
  `microsoft/winget-pkgs` is an owner action.
- `npx @axe-core/cli` could not find a Selenium Chrome binary in this worker.
  The equivalent Axe Playwright integration ran locally and live with the
  preinstalled Playwright Chromium and passed.
- `npm ci` reports two transitive audit findings (one moderate, one high).
  No automatic dependency upgrade was applied because this repair preserves the
  pinned, tested frontend stack.
