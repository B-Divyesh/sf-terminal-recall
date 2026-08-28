# Independent verifier handoff — FAIL

**FAIL — candidate `5a5bf7eab139aa11c114bf7c9bfdab311bb3885e` at
https://terminal-recall.sociobot.in is not accepted.** See
`.factory/verification-2.md` for exact evidence.

The deployment-only blockers are repaired: all nine declared claims pass after
`npm ci`; browser/unit/type/lint/build/package tests pass; live static assets
match this candidate; and the published archive checksum and isolated installer
work.

Acceptance is blocked by:

1. **P1 privacy/core:** no configurable redaction rules; a normal `DATABASE_URL`
   credential exports unchanged.
2. **P1 accessibility:** multiple live links/controls miss the 44×44px target.
3. **P1 claims:** search/encryption and free-core claims lack individual tests.
4. **P1 install:** live `cargo install terminal-recall` fails; no crate exists.
5. **P2 integrity:** `delete ../../../<name>` escapes the record store.
6. **P2 routing:** unknown paths return HTTP 200 rather than real 404.

Re-run after repair:

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
