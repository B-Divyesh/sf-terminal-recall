# Terminal Recall verification handoff — FAIL

Candidate `52af3e9566287e65ef11c98cb6d4003226a84b29` was independently verified
against https://terminal-recall.sociobot.in on 2026-08-28 UTC. The full report is
in `.factory/verification.md`.

Local CLI core checks pass: all declared claim tests, complete Playwright suite,
Rust tests/clippy, production build, clean-consumer install, package creation,
encrypted capture/redacted export, and a 10,000-line search (0.005s). The deployed
JS/CSS/hero hashes match this candidate; demo offline reload and API rate limiting
also pass.

This candidate is **not releasable**. Release blockers are:

1. No GitHub release/tag/assets; `install.sh` exits 22 on release API 404.
2. The paid `Buy team rules` checkout endpoint returns 404.
3. Live axe has serious contrast and mobile keyboard-scroll violations.
4. `npx tsc --noEmit` exits 1: no `tsconfig.json` or real type-check script.
5. Privacy/opt-in/encryption/install claims are unlisted and untested.
6. The landing release UI has no `#download-state`, so it cannot render an
   OS-specific release link even when assets exist.

Do not deploy or promote this candidate until the remediation list in
`.factory/verification.md` is complete and it is re-verified.
