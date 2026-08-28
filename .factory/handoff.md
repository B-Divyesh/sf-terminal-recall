# Terminal Recall repair handoff

## Result

Repair of independent-verifier candidate `5a5bf7eab139aa11c114bf7c9bfdab311bb3885e`.
Terminal Recall remains a Rust single-binary CLI with a Vite static landing site.

## Repaired findings

- Added documented local custom redaction rules. `terminal-recall rules add
  '(?i)DATABASE_URL=\\S+'` writes `redaction-rules.json` beside the encrypted
  store; every export combines it with the built-in rules. A packaged consumer
  install exported `[REDACTED]` rather than `private-password`.
- Record paths now accept only the generated 12-character hexadecimal IDs. The
  delete regression creates a controlled file outside the store and proves a
  `../../../...` ID cannot remove it.
- Added a 44×44px minimum to every link as well as the existing controls, and
  a desktop plus 390px Playwright measurement regression test.
- Added individual claims and exact tests for configured redaction, encrypted
  search, and the free local core.
- Replaced the landing page’s nonexistent crates.io command with the verified
  release installer. Source installation remains documented only for developers.
- Removed the Static Web Apps global SPA fallback. `/demo`, `/privacy`, and
  `/terms` still rewrite to the app; other missing paths resolve through the
  designed 404 response with HTTP 404.

## Verification

From a clean dependency install:

```sh
npm ci
npm test
npm run typecheck
npm run lint
npm run test:installers
npm run test:deployment
cargo test --workspace
npm run build
cargo package -p terminal-recall --allow-dirty --no-verify
```

All commands pass. Playwright: 11/11, including desktop and 390px Axe
serious/critical checks, keyboard focus for the transcript, offline demo reload,
privacy network isolation, touch-target measurements, and installer copy.
All 12 commands declared in `.factory/claims.json` were also run individually
and passed. Production output is 9.25 kB JS (4.01 kB gzip) and 6.96 kB CSS
(2.22 kB gzip); the original 153,336-byte WebP hero remains unchanged.

Consumer evidence: the packed crate was extracted, installed into an isolated
`cargo install --path` root, reported `terminal-recall 0.1.2`, applied a custom
`DATABASE_URL` rule during a real capture/export, and rejected traversal deletion.

## Deployment

Build and deploy with:

```sh
npm run build:site
/opt/fleet/lib/deploy-static.sh terminal-recall /work/repo/dist/site
```

Deployment and live verification evidence will be appended after the static
upload completes.

## Known notes

- Windows and macOS release binaries are unsigned, as stated in the README.
- The winget manifests remain ready for owner submission to
  `microsoft/winget-pkgs`.
- `npm ci` reports two existing transitive audit findings (one moderate, one
  high); no unreviewed dependency upgrade was applied.
