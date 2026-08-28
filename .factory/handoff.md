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

Deployment completed successfully as `c9944eda-7f77-4bf2-aca3-d36fe316100f`.
Live verification at `https://terminal-recall.sociobot.in`:

- `verify-url.sh` returned HTTP 200 in 664 ms with title, `lang="en"`, one h1,
  main landmark, image alt text, and zero console/page errors.
- `/demo` returned 200 and `/no-such-page` returned a real 404 with the designed
  “This record is not here” h1.
- Live Playwright desktop and 390px checks found zero Axe serious/critical
  issues, zero targets under 44px, zero console errors, and keyboard focus on
  the captured-output transcript.
- A live service-worker session used `terminal-recall-v2` and reloaded `/demo`
  offline to “Search the sample deploy record”.
- Live JS SHA-256 `982e222765525d3f21c0703b5f84dd79b3ac8f7761961cdba365e354679615a5`
  and CSS SHA-256 `aa54bfc53e1270587a179d63eb29c7ba535b12ea865f1762d460388d917d0dd6`
  equal the deployed build. The hero asset is unchanged:
  `b106d20744b0acffdb88c04f9c4d5ef4f22ee6b138e71497c62ee41a92dc2dd4`.
- Live headers include CSP, HSTS, `nosniff`, and strict-origin referrer policy.

## Known notes

- Windows and macOS release binaries are unsigned, as stated in the README.
- The winget manifests remain ready for owner submission to
  `microsoft/winget-pkgs`.
- `npm ci` reports two existing transitive audit findings (one moderate, one
  high); no unreviewed dependency upgrade was applied.
