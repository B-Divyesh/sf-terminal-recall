# Terminal Recall handoff

## Delivered

- Rust `terminal-recall` CLI with opt-in `run` and `capture`, encrypted local
  AES-256-GCM records, full-text search, configured secret-shaped redaction,
  export, expiry, delete, JSON output, status, and an isolated `demo` command.
- Static Vite landing site in `dist/site`, plus real `/demo`, `/privacy`,
  `/terms`, offline service worker, error state, installer scripts, release
  metadata lookup, and paid team-rule license storage and verification.
- Risograph collage system documented in `design.md`; the original generated hero
  is `public/hero-terminal-recall.webp` (153 KB) with generation metadata.
- GitHub Actions release workflow, Scoop starter manifest, winget starter
  manifest, documented POSIX and PowerShell checksum-verifying installers.

## Verify

```sh
npm install
npm test
cargo test
npm run build
```

Verified locally on 2026-08-28:

- `npm test`: 4 Playwright tests pass, including all claims and axe serious/
  critical checks.
- `cargo test`: 2 tests pass.
- `npm run build`: succeeds; `dist/site/index.html` exists.
- Manual CLI flow: captured output, searched it, confirmed the encrypted record
  did not contain plaintext, and exported `[REDACTED]` for a sample API key.
- Build output: 10.3 KB JS (4.3 KB gzip), 6.5 KB CSS (2.1 KB gzip), 153 KB hero.

## Lighthouse-class checks

The checked build has a single h1 per route, language, landmarks, skip link,
semantic controls, focus styles, mobile stacking, reduced-motion treatment,
offline demo reload, no runtime font/CDN dependency, and no axe serious or
critical violations. Asset budgets are below the stated limits. A browser
Lighthouse numeric report was not available in this container.

## Known release gaps / operator action

No remote GitHub release was created because this worker was not given GitHub
publishing credentials. After pushing the committed tag `v0.1.0`, run the release
workflow and verify `SHA256SUMS` against an uploaded asset. The current workflow
ships portable Linux/macOS archives and a Windows zip. Before public release, the
owner should add the requested `.deb`, `.rpm`, and unsigned macOS `.pkg` release
steps plus a Homebrew tap update; these require release ownership and package
metadata beyond this local build. Windows and macOS binaries remain unsigned.

The redaction rules are intentionally conservative examples. They cannot prove
that every secret format will be detected, so exported excerpts need human review.
