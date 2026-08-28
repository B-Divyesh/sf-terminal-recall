#!/usr/bin/env sh
set -eu
repo="B-Divyesh/sf-terminal-recall"
os=$(uname -s | tr '[:upper:]' '[:lower:]')
arch=$(uname -m); case "$arch" in x86_64) arch=x86_64;; arm64|aarch64) arch=arm64;; *) echo "Unsupported architecture: $arch" >&2; exit 1;; esac
case "$os" in linux|darwin) ;; *) echo "Use install.ps1 on Windows." >&2; exit 1;; esac
api="https://api.github.com/repos/$repo/releases/latest"
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT
curl -fsSL "$api" -o "$tmp/release.json"
url=$(grep -o 'https:[^"]*terminal-recall-[^"]*' "$tmp/release.json" | grep "$os-$arch" | head -1)
sumurl=$(grep -o 'https:[^"]*SHA256SUMS[^"]*' "$tmp/release.json" | head -1)
[ -n "$url" ] && [ -n "$sumurl" ] || { echo "No matching release asset is published yet." >&2; exit 1; }
curl -fsSL "$url" -o "$tmp/asset"; curl -fsSL "$sumurl" -o "$tmp/SHA256SUMS"
name=$(basename "$url"); grep " $name$" "$tmp/SHA256SUMS" | (cd "$tmp" && sha256sum -c -)
mkdir -p "$HOME/.local/bin"; tar -xf "$tmp/asset" -C "$tmp"; bin=$(find "$tmp" -type f -name terminal-recall | head -1); install -m 755 "$bin" "$HOME/.local/bin/terminal-recall"
echo "Installed terminal-recall to $HOME/.local/bin/terminal-recall"
