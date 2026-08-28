$ErrorActionPreference = 'Stop'
$repo = 'B-Divyesh/sf-terminal-recall'
if ($env:TERMINAL_RECALL_FIXTURE_DIR) { $release = Get-Content (Join-Path $env:TERMINAL_RECALL_FIXTURE_DIR 'release.json') | ConvertFrom-Json }
else { $release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest" }
$asset = $release.assets | Where-Object { $_.name -match 'windows-x86_64.*zip$' } | Select-Object -First 1
$sums = $release.assets | Where-Object { $_.name -eq 'SHA256SUMS' } | Select-Object -First 1
if (!$asset -or !$sums) { throw 'No Windows release asset is published yet.' }
$tmp = Join-Path $env:TEMP ('terminal-recall-' + [guid]::NewGuid()); New-Item -ItemType Directory $tmp | Out-Null
if ($env:TERMINAL_RECALL_FIXTURE_DIR) {
  Copy-Item (Join-Path $env:TERMINAL_RECALL_FIXTURE_DIR $asset.name) "$tmp\asset.zip"
  Copy-Item (Join-Path $env:TERMINAL_RECALL_FIXTURE_DIR 'SHA256SUMS') "$tmp\SHA256SUMS"
} else {
  Invoke-WebRequest $asset.browser_download_url -OutFile "$tmp\asset.zip"; Invoke-WebRequest $sums.browser_download_url -OutFile "$tmp\SHA256SUMS"
}
$expected = (Select-String -Path "$tmp\SHA256SUMS" -Pattern ([regex]::Escape($asset.name))).Line.Split(' ')[0]
$sha256 = [System.Security.Cryptography.SHA256]::Create()
$stream = [System.IO.File]::OpenRead("$tmp\asset.zip")
try { $actual = ([System.BitConverter]::ToString($sha256.ComputeHash($stream))).Replace('-', '').ToLower() }
finally { $stream.Dispose(); $sha256.Dispose() }
if ($actual -ne $expected.ToLower()) { throw 'Checksum verification failed.' }
Expand-Archive "$tmp\asset.zip" "$tmp\out"; $dest = if ($env:TERMINAL_RECALL_INSTALL_DIR) { $env:TERMINAL_RECALL_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'TerminalRecall\bin' }; New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item (Get-ChildItem "$tmp\out" -Recurse -Filter terminal-recall.exe | Select-Object -First 1).FullName "$dest\terminal-recall.exe"; if (!$env:TERMINAL_RECALL_INSTALL_DIR) { [Environment]::SetEnvironmentVariable('Path', $env:Path + ";$dest", 'User') }
Write-Host "Installed terminal-recall to $dest. Open a new terminal to use it."
