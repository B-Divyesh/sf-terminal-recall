# Terminal Recall repair handoff

## Result

PASS. Repaired independent-verifier report commit
`55a8c7a0fc93a4c49f54742464407a11436a08f6` for candidate
`8fc734c54eea0fe112a9c3480d09a0b8bf0660bd`. Terminal Recall remains a Rust
single-binary CLI with a Vite static landing site.

Repair commit: `57fd2ad0fc40e53e445151fa8b2681815b1fdf46`.

## Release-blocking finding repaired

`terminal-recall expire --days=-1` previously accepted Clap's equals form,
calculated a future cutoff, and deleted current records. `--days` now uses a
boundary parser that rejects negative and duration-overflowing values before the
store is opened or records are considered. The error exits 2 and says `days must
be zero or greater`.

`cli/tests/expire_cli.rs` is an exact public-CLI regression. It captures a current
record in a temporary store, runs `expire --days=-1`, asserts the nonzero exit and
actionable error, then lists the store and proves the same record remains.

## Local verification

The following passed after a clean `npm ci`:

```sh
npm test                         # 11/11 Playwright
npm run typecheck
npm run lint                    # TypeScript + Clippy warnings denied
npm run test:installers
npm run test:deployment
cargo test --workspace          # 10 unit + 1 CLI integration
npm run build
cargo package -p terminal-recall --allow-dirty --no-verify
```

All 12 exact commands in `.factory/claims.json` passed. The production site is
9.25 kB JS (4.01 kB gzip), 6.96 kB CSS (2.22 kB gzip), and a 153,336-byte hero
WebP. The generated crate is 47.5 KiB (13.8 KiB compressed).

## Packaged consumer verification

The `terminal-recall-0.1.3.crate` was extracted and installed with `cargo install
--path` into an isolated consumer root. The installed binary reported 0.1.3 and
passed capture, JSON list/search, custom `DATABASE_URL` redaction, redacted
export, plaintext-at-rest inspection, invalid-regexp recovery, invalid-ID
recovery, negative-expiry record preservation, and the bundled demo. Searching a
10,000-line encrypted record for its known line 5,000 match took 4 ms.

## Release and installers

GitHub Actions run `33199895513` completed successfully for Linux x86_64,
Windows x86_64, macOS arm64, and macOS x86_64. Release
[`v0.1.3`](https://github.com/B-Divyesh/sf-terminal-recall/releases/tag/v0.1.3)
is public with archives, deb, rpm, both pkg files, `SHA256SUMS`, `latest.json`,
and package-manager metadata. All eight binary/package assets passed
`sha256sum -c`.

The downloaded Linux archive reports 0.1.3 and passes the exact negative-expiry
preservation exercise. Its SHA-256 is
`f6cdd401a662bb851a966d894f846a7be53063c8a92de64b3e9320cb752e7e85`.
The Windows zip SHA-256 is
`02203cae48caef48156e30cf858aeedf802326037e5d9b2843c62c4e3cff7ddf`.
The checked-in Homebrew, Scoop, and winget metadata uses those release hashes.
The Homebrew tap update is commit `26b0d6c` in
`B-Divyesh/homebrew-terminal-recall`.

## Deployment and live verification

Built with `npm run build:site` and deployed with:

```sh
/opt/fleet/lib/deploy-static.sh terminal-recall /work/repo/dist/site
```

Azure Static Web Apps deployment
`3e355a1d-5237-4ce3-b405-5d5fb193e788` succeeded. The live URL is
<https://terminal-recall.sociobot.in>.

`verify-url.sh` returned HTTP 200 in 898 ms with the correct title, `lang`, one
h1, main landmark, alt text, and no console errors. `npm run test:live` verified:

- first-read copy and the one-click sample demo;
- desktop and 390px mobile with no horizontal loss, undersized targets, console
  errors, page errors, or serious/critical Axe findings;
- keyboard skip-link operation and transcript focus;
- isolated demo storage and a redacted downloaded excerpt;
- only same-origin and GitHub release-metadata requests on landing, with no
  requests during demo search/export;
- `terminal-recall-v3` activation, removal of v2, and a successful offline demo
  reload;
- live v0.1.3 detected-platform download, GitHub release assets, CSP, HSTS,
  `nosniff`, referrer policy, and a real HTTP 404;
- exact live/local identity for JS
  `2661bc41eb5d10ba3cc5fa863b82b304387d42419cb6df9f68eaefca90fdc260`,
  CSS `aa54bfc53e1270587a179d63eb29c7ba535b12ea865f1762d460388d917d0dd6`,
  service worker
  `dab544d285d2ef5a38928e1395f1c6684865b9985a3556ec45994ef0bcbcfee3`,
  and hero
  `b106d20744b0acffdb88c04f9c4d5ef4f22ee6b138e71497c62ee41a92dc2dd4`.

Evidence is under `.factory/evidence/repair-v013/`. Lighthouse 12.8.2 mobile:
95 performance, 100 accessibility, 100 best practices, 100 SEO, 2.0 s LCP,
0 CLS, and 230 ms TBT.

## Known notes and operator action

- `npm ci` reports the verifier-noted two transitive audit advisories: one
  moderate and one high. No unreviewed forced major upgrade was applied.
- Windows and macOS binaries are unsigned. The site states this; signing needs
  owner certificates.
- The winget manifests are ready for owner submission to
  `microsoft/winget-pkgs`.
