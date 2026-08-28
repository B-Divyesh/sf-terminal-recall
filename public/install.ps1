$ErrorActionPreference = 'Stop'
$repo = 'B-Divyesh/sf-terminal-recall'
$release = Invoke-RestMethod "https://api.github.com/repos/$repo/releases/latest"
$asset = $release.assets | Where-Object { $_.name -match 'windows-x86_64.*zip$' } | Select-Object -First 1
$sums = $release.assets | Where-Object { $_.name -eq 'SHA256SUMS' } | Select-Object -First 1
if (!$asset -or !$sums) { throw 'No Windows release asset is published yet.' }
$tmp = Join-Path $env:TEMP ('terminal-recall-' + [guid]::NewGuid()); New-Item -ItemType Directory $tmp | Out-Null
Invoke-WebRequest $asset.browser_download_url -OutFile "$tmp\asset.zip"; Invoke-WebRequest $sums.browser_download_url -OutFile "$tmp\SHA256SUMS"
$expected = (Select-String -Path "$tmp\SHA256SUMS" -Pattern ([regex]::Escape($asset.name))).Line.Split(' ')[0]
$actual = (Get-FileHash "$tmp\asset.zip" -Algorithm SHA256).Hash.ToLower(); if ($actual -ne $expected.ToLower()) { throw 'Checksum verification failed.' }
Expand-Archive "$tmp\asset.zip" "$tmp\out"; $dest = Join-Path $env:LOCALAPPDATA 'TerminalRecall\bin'; New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item (Get-ChildItem "$tmp\out" -Recurse -Filter terminal-recall.exe | Select-Object -First 1).FullName "$dest\terminal-recall.exe"; [Environment]::SetEnvironmentVariable('Path', $env:Path + ";$dest", 'User')
Write-Host "Installed terminal-recall to $dest. Open a new terminal to use it."
