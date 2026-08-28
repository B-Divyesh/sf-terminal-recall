# Terminal Recall review 1 handoff

## Result

Adversarial first-read review 1 is complete. Verdict: **FAIL**.

The detailed report is [`.factory/review-1.md`](review-1.md). Product code was
not changed.

## What was done

- Cold-read the live site in fresh desktop and 390 px Chromium contexts.
- Exercised the one-click browser demo, search, export, Reset, Start for real,
  browser Back/Forward, real-storage isolation, request logging, and offline reload.
- Ran `terminal-recall demo` from a temporary directory and inspected its
  encrypted store and redacted output.
- Ran every exact command in `.factory/claims.json` from a separate clean clone.
- Re-ran the complete local test, lint, Cargo, deployment, build, live, basic URL,
  link, route, metadata, target-size, and Axe checks.
- Read the existing handoff and historical verification reports and rechecked
  each earlier defect.
- Audited every landing/README sentence, plus headings, actions, labels, and
  terminology.

## Verification

Passing commands:

```sh
npm ci
npm test
npm run lint
cargo test --workspace
npm run test:deployment
npm run build
npm run test:live
```

All 12 declared claim commands exited zero. The live route/link checks resolved
all expected links, and the main four routes passed serious/critical Axe checks.

## Blocking gaps

- Browser Back leaves `demo:terminal-recall:logs` behind, contradicting the
  declared demo-discard claim; Back/Forward also lose h1 focus.
- The one-click site demo is a JavaScript facsimile, not a self-hosted recording
  of the real CLI using the bundled sample.
- The real 404 has a 4.38:1 link contrast failure, a 119×21 px target, and none of
  the shared header/main/footer/metadata skeleton.
- Material README/landing claims are absent from `claims.json`, and several
  declared tests inspect source strings instead of observable outcomes.

See F-1-1 through F-1-29 in the review for exact quotes and fixes.
