# Terminal Recall

Terminal Recall saves selected terminal output on your device. It is for developers
and operators who need to find a command result after a session ends.

The local core captures a command only when you run it, encrypts records with
AES-256-GCM beside a local key, searches them, and writes redacted text excerpts.
It does not upload captured output.

Try the browser sandbox at `/demo`, or run `terminal-recall demo`.

## Install

Release assets are published for Linux, macOS, and Windows:

```sh
curl -fsSL https://terminal-recall.sociobot.in/install.sh | sh
```

```powershell
irm https://terminal-recall.sociobot.in/install.ps1 | iex
```

Both scripts verify the published SHA-256 checksum before placing the binary on
your PATH. Windows and macOS binaries are unsigned; on macOS use right-click →
Open if Gatekeeper asks.

Homebrew users can install the tap:

```sh
brew install B-Divyesh/terminal-recall/terminal-recall
```

Scoop users can add this repository as a bucket and install
`terminal-recall`. The `winget/` folder is ready for submission to
`microsoft/winget-pkgs`. For a source build, install Rust and run:

```sh
cargo install --path cli
```

## Use

Capture only the command you choose:

```sh
terminal-recall run -- kubectl get pods -A
terminal-recall search "CrashLoopBackOff"
terminal-recall list --json
terminal-recall export RECORD_ID --output incident-excerpt.txt --context 2
```

`export --context N` writes the first `2N + 1` lines as a bounded excerpt.
Use `--context 0` only when you deliberately need the full record.

## Add local redaction rules

Built-in export rules replace common API keys, tokens, passwords, and bearer
tokens. Add a rule for secrets that are specific to your environment before
exporting. Rules stay in your local record folder and are never uploaded:

```sh
terminal-recall rules add '(?i)DATABASE_URL=\S+'
terminal-recall rules list
```

For example, the rule above replaces a full `DATABASE_URL=...` credential with
`[REDACTED]` in every future export. You can also edit the local
`redaction-rules.json` file shown beside the encrypted records by
`terminal-recall status`.

Pipe output when wrapping is not convenient:

```sh
your-command 2>&1 | terminal-recall capture --label "nightly migration"
```

The same `run` form works from PowerShell:

```powershell
terminal-recall run -- pwsh -Command "Get-Process"
```

Records use AES-256-GCM with a local key stored beside the encrypted records.
Use `terminal-recall status` to print that folder and its key fingerprint.
`terminal-recall expire --days 30` removes old records; `delete RECORD_ID`
removes one record. Losing the local key makes saved records unreadable.

## Develop and verify

Requires Node 22+ and Rust stable.

```sh
npm ci
npm test
npm run test:installers
npm run lint
cargo test --workspace
npm run build
cargo package -p terminal-recall
```

`npm run build:site` writes the static site to `dist/site` with `index.html`
at its root. `npm run build` also builds the release CLI. `cargo package
-p terminal-recall` creates the ready-to-publish Rust crate.

## Privacy and demo

The static site has no analytics. The demo uses
`demo:terminal-recall:logs`; it never reads a real browser record. Starting for
real discards the demo key. See [.factory/demo.md](.factory/demo.md).

The product has no account or paid feature. See `/privacy` and `/terms`.

## Release and deployment

Tag `v0.1.3` to run [.github/workflows/release.yml](.github/workflows/release.yml).
It publishes Linux, Windows, and macOS archives, Linux `.deb`/RPM packages,
macOS `.pkg` files, checksums, a manifest, and package-manager metadata. The
static site is deployed with `npm ci && npm run build:site` from `dist/site`.

Catalog description: **Find terminal output after it disappears.**
