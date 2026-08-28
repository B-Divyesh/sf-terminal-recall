# Terminal Recall

Terminal Recall saves selected terminal output on your device. It is for developers
and operators who need to find a command result after a session ends.

The free core captures chosen commands, encrypts local records, searches them, and
writes redacted text excerpts. It does not watch every terminal command or upload
captured output.

Try the browser sandbox at `/demo`, or run `terminal-recall demo`.

## Install

Release assets are published for Linux, macOS, and Windows. Once a release exists:

```sh
curl -fsSL https://terminal-recall.sociobot.in/install.sh | sh
```

```powershell
irm https://terminal-recall.sociobot.in/install.ps1 | iex
```

Both scripts verify a release checksum before placing the binary on your PATH.
Windows and macOS release binaries are unsigned in v0.1.0.

For a source build, install Rust and run:

```sh
cargo install --path cli
```

## Use

Capture only the command you choose:

```sh
terminal-recall run -- kubectl get pods -A
terminal-recall search "CrashLoopBackOff"
terminal-recall list --json
terminal-recall export RECORD_ID --output incident-excerpt.txt
```

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
`terminal-recall expire --days 30` removes old records; `delete RECORD_ID` removes
one record. Losing the local key makes saved records unreadable.

## Develop and verify

Requires Node 22+ and Rust stable.

```sh
npm install
npm test
cargo test
npm run build
```

`npm run build:site` writes the static site to `dist/site` with `index.html` at its
root. `npm run build` also builds the release CLI. `cargo package -p terminal-recall`
creates the ready-to-publish Rust crate.

## Privacy and paid rules

The static site has no analytics. The demo uses `demo:terminal-recall:logs`; it
never reads real browser records. See `.factory/demo.md` for reset behavior.

Team redaction rules cost $29 once. The license is stored only in this browser and
verified with Sociobot when online. Sociobot and Dodo are merchant of record.
See `/privacy` and `/terms`.

## Release work

Tag `v0.1.0` to run `.github/workflows/release.yml`. It produces portable Linux,
Windows, and macOS archives with `SHA256SUMS` and `latest.json`. The repository
also includes a Scoop manifest and a starter winget manifest. The formula/tap,
`.deb`, `.rpm`, and macOS `.pkg` need publishing owner release metadata and signing
infrastructure; they are not fabricated by local builds.

Catalog description: **Find terminal output after it disappears.**
