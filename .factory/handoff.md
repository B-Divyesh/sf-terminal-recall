# Verification handoff — FAIL

**Candidate:** `8fc734c54eea0fe112a9c3480d09a0b8bf0660bd`
**Live URL:** <https://terminal-recall.sociobot.in>
**Verified:** 2026-08-28 UTC

## Result

**FAIL.** Fresh evidence confirms that the former deployment/release failures
are fixed: the live assets exactly match this candidate, the v0.1.2 release is
present and checksum-valid, all 12 claim tests pass, and all local quality
checks pass. Do not release this candidate because an invalid negative expiry
period deletes current local records.

## Blocking defect

`terminal-recall --home <temporary-store> expire --days=-1` exits 0 and removes
newly captured records. The subsequent JSON list was empty. Negative retention
is invalid input and must produce a nonzero error without modifying records.
This is P1 unrecoverable local-data loss. Add an explicit `days < 0` validation
and a regression test, then repeat verification.

## Verified evidence

- Clean clone at the candidate: `npm ci`; all 12 exact `.factory/claims.json`
  commands PASS; `npm test` 11/11; typecheck; lint; deployment and installer
  checks; `cargo test --workspace` 10/10; production build; and crate package
  all PASS.
- Fresh consumer CLI install captured stdin, searched encrypted records, used a
  custom `DATABASE_URL` redaction rule, exported without plaintext secrets,
  rejected invalid regex/record IDs, and completed the shipped demo. A 10,000
  line record found line 5,000 in 13 ms.
- Live first-read and one-click demo gates pass. Demo storage is isolated and
  its export redacts the sample key.
- Live desktop and 390px mobile: zero console/page errors, zero Axe
  serious/critical findings, all visible targets at least 44px, keyboard-only
  traversal/focus works, and reduced motion is respected.
- Live demo requests no third-party origin during interactions. Landing only
  requests documented GitHub release metadata in addition to same-origin
  assets. CSP, HSTS, nosniff, referrer policy, 404, and immutable asset caching
  are correct. Offline demo reload works from `terminal-recall-v2`.
- Candidate/live hashes match: JS
  `982e222765525d3f21c0703b5f84dd79b3ac8f7761961cdba365e354679615a5`, CSS
  `aa54bfc53e1270587a179d63eb29c7ba535b12ea865f1762d460388d917d0dd6`, hero
  `b106d20744b0acffdb88c04f9c4d5ef4f22ee6b138e71497c62ee41a92dc2dd4`.
- GitHub release `v0.1.2` contains the platform artifacts, `SHA256SUMS`, and
  `latest.json`; its Linux tarball passed checksum verification and ran as
  version 0.1.2.

See `.factory/verification-3.md` for the complete command results and evidence.

## How to recheck

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

Then run every command in `.factory/claims.json`, a fresh `cargo install --path
cli --root <temporary-root>` consumer exercise, and live `/`, `/demo`, privacy,
header, offline, and responsive accessibility checks.
