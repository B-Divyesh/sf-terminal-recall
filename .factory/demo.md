# Demo sandbox

Open <https://terminal-recall.sociobot.in/?demo=1> for the one-click browser
demo. The legacy `/demo` deep link opens the same isolated state.

The page starts with a real CLI transcript generated from
`terminal-recall demo`. Below it, a labeled browser simulation supports search
and redacted export without installing anything.

The sample comes from `cli/examples/deploy-check.txt`. It contains a deploy check,
an API key, a token, a password, a bearer token, a migration result, and a health
check. All values are fictional.

Browser demo data uses only `demo:terminal-recall:logs`. It never reads or
writes `terminal-recall:logs`. **Reset demo** recreates the clean sample.
**Start for real**, the in-page Start for real link, and browser Back all delete
the demo key. Browser Forward creates a fresh sample without changing real data.

The CLI demo executes the public `capture`, `search`, and `export` command
paths in a new temporary directory. It prints that directory and leaves the
redacted excerpt there for inspection.

After one online visit, the service worker caches the demo shell and sample.
Reloading `?demo=1` offline remains usable.
