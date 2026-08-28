import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const posix = await readFile(new URL('../public/install.sh', import.meta.url), 'utf8');
const powershell = await readFile(new URL('../public/install.ps1', import.meta.url), 'utf8');

assert.match(posix, /darwin\) platform=macos/);
assert.match(posix, /SHA-256 tool not found/);
assert.match(posix, /sha256sum/);
assert.match(posix, /shasum -a 256/);
assert.match(posix, /Checksum verification failed/);
assert.match(posix, /\[ "\$actual" = "\$expected" \]/);
assert.match(powershell, /Get-FileHash .*SHA256/);
assert.match(powershell, /Checksum verification failed/);
assert.match(powershell, /\$actual -ne \$expected/);

console.log('@claim:verified-installers installer checksum checks are present for POSIX and PowerShell.');
