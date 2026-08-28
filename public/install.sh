#!/usr/bin/env sh
set -eu

repo="B-Divyesh/sf-terminal-recall"
os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m)
case "$arch" in
  x86_64) arch=x86_64 ;;
  arm64|aarch64) arch=arm64 ;;
  *) echo "Unsupported architecture: $arch" >&2; exit 1 ;;
esac
case "$os" in
  linux) platform=linux ;;
  darwin) platform=macos ;;
  *) echo "Use install.ps1 on Windows." >&2; exit 1 ;;
esac

api="https://api.github.com/repos/$repo/releases/latest"
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl -fsSL "$api" -o "$tmp/release.json"
url=$(grep -o 'https:[^"]*terminal-recall-[^"]*' "$tmp/release.json" | grep "$platform-$arch" | head -1)
sumurl=$(grep -o 'https:[^"]*SHA256SUMS[^"]*' "$tmp/release.json" | head -1)
[ -n "$url" ] && [ -n "$sumurl" ] || { echo "No matching release asset is published yet." >&2; exit 1; }

curl -fsSL "$url" -o "$tmp/asset"
curl -fsSL "$sumurl" -o "$tmp/SHA256SUMS"
name=$(basename "$url")
expected=$(awk -v name="$name" '$2 == name { print $1 }' "$tmp/SHA256SUMS")
[ -n "$expected" ] || { echo "Release checksum is missing for $name." >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then
  actual=$(sha256sum "$tmp/asset" | awk '{print $1}')
elif command -v shasum >/dev/null 2>&1; then
  actual=$(shasum -a 256 "$tmp/asset" | awk '{print $1}')
else
  echo "SHA-256 tool not found (need sha256sum or shasum)." >&2
  exit 1
fi
[ "$actual" = "$expected" ] || { echo "Checksum verification failed for $name." >&2; exit 1; }

mkdir -p "$HOME/.local/bin"
tar -xf "$tmp/asset" -C "$tmp"
bin=$(find "$tmp" -type f -name terminal-recall | head -1)
[ -n "$bin" ] || { echo "Release archive does not contain terminal-recall." >&2; exit 1; }
install -m 755 "$bin" "$HOME/.local/bin/terminal-recall"
echo "Installed terminal-recall to $HOME/.local/bin/terminal-recall"
