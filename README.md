# Terminal Recall

Terminal Recall saves only commands you run through it. It encrypts and searches
local records, then exports redacted excerpts.

It is for developers and operators who need a result after a terminal session
ends. The CLI works without an account or payment and sends no saved output over a network.

Try the isolated sample at <https://terminal-recall.sociobot.in/?demo=1>.
You can also run `terminal-recall demo` with the bundled deploy sample.

## Install Terminal Recall

The release page provides archives for Linux, macOS, and Windows:
<https://github.com/B-Divyesh/sf-terminal-recall/releases>.

On Linux or macOS:

```sh
curl -fsSL https://terminal-recall.sociobot.in/install.sh | sh
```

On Windows:

```powershell
irm https://terminal-recall.sociobot.in/install.ps1 | iex
```

The installers compare the downloaded archive with its published SHA-256 value.
Windows and macOS files are unsigned in v0.1.4. On macOS, use right-click → Open if Gatekeeper asks.
Each release includes `SIGNING-STATUS.json`, generated after the build checks its signing state.

The repository also contains a Homebrew formula, Scoop manifest, and draft winget
manifests. They are packaging inputs, not submitted package listings.

For a source build, install Rust and run:

```sh
cargo install --path cli
```

## Capture, search, and export records

Capture only the command you choose:

```sh
terminal-recall run -- kubectl get pods -A
terminal-recall search "CrashLoopBackOff"
terminal-recall list --json
terminal-recall export RECORD_ID --output incident-excerpt.txt --context 2
```

`export --context N` writes at most the first `2N + 1` output lines.
`--context 0` writes the full record.

## Add local redaction rules

Built-in export rules replace API keys, tokens, passwords, and bearer tokens.
Add a rule for secrets specific to your environment:

```sh
terminal-recall rules add '(?i)DATABASE_URL=\S+'
terminal-recall rules list
```

The rule above replaces the full `DATABASE_URL` value during later exports.
`terminal-recall status` prints the record folder and key fingerprint.
You may edit `redaction-rules.json` inside that folder.

Pipe output when wrapping a command is inconvenient:

```sh
your-command 2>&1 | terminal-recall capture --label "nightly migration"
```

`terminal-recall expire --days 30` removes older records.
`terminal-recall delete RECORD_ID` removes one chosen record.
Losing or replacing the local key makes saved records unreadable.

## Develop and verify

Use Node 22 or later and stable Rust:

```sh
npm ci
npm test
npm run test:installers
npm run test:recording
npm run lint
cargo test --workspace
npm run build
cargo package -p terminal-recall
```

`npm run build:site` writes the static site to `dist/site`.
`npm run build` also builds the release CLI.

## Privacy and demo isolation

The static site has no analytics. Only the home page requests GitHub release
metadata. The CLI sends no captured output over a network.

The demo uses `demo:terminal-recall:logs`.
It never reads or changes `terminal-recall:logs`.
Resetting or leaving the demo discards its sample data.
The demo reloads offline after one successful visit.

See [.factory/demo.md](.factory/demo.md), [/privacy](https://terminal-recall.sociobot.in/privacy),
and [/terms](https://terminal-recall.sociobot.in/terms).

## Release and deployment

Tag `v0.1.4` to run [.github/workflows/release.yml](.github/workflows/release.yml).
The workflow builds platform archives, Linux packages, macOS packages, checksums,
and release manifests.

Deploy the static site with `npm ci && npm run build:site` from `dist/site`.
