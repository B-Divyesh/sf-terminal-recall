import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const posix = readFileSync(join(root, 'public/install.sh'), 'utf8');
const powershell = readFileSync(join(root, 'public/install.ps1'), 'utf8');

assert.match(posix, /Checksum verification failed/);
assert.match(posix, /TERMINAL_RECALL_INSTALL_DIR/);
assert.match(powershell, /Checksum verification failed/);
assert.match(powershell, /TERMINAL_RECALL_INSTALL_DIR/);

function hash(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

if (process.platform === 'win32') {
  const fixture = mkdtempSync(join(tmpdir(), 'terminal-recall-ps-fixture-'));
  const install = join(fixture, 'install');
  const payload = join(fixture, 'payload');
  mkdirSync(payload);
  writeFileSync(join(payload, 'terminal-recall.exe'), 'fixture executable');
  const archive = join(fixture, 'terminal-recall-windows-x86_64.zip');
  execFileSync('powershell', ['-NoProfile', '-Command', `Compress-Archive -Path '${join(payload, 'terminal-recall.exe')}' -DestinationPath '${archive}'`]);
  writeFileSync(join(fixture, 'SHA256SUMS'), `${hash(archive)}  terminal-recall-windows-x86_64.zip\n`);
  writeFileSync(join(fixture, 'release.json'), JSON.stringify({ assets: [
    { name: 'terminal-recall-windows-x86_64.zip', browser_download_url: 'https://fixture.test/terminal-recall-windows-x86_64.zip' },
    { name: 'SHA256SUMS', browser_download_url: 'https://fixture.test/SHA256SUMS' },
  ] }));
  const valid = spawnSync('powershell', ['-NoProfile', '-File', join(root, 'public/install.ps1')], { encoding: 'utf8', env: { ...process.env, TERMINAL_RECALL_FIXTURE_DIR: fixture, TERMINAL_RECALL_INSTALL_DIR: install } });
  assert.equal(valid.status, 0, valid.stderr);
  assert.ok(existsSync(join(install, 'terminal-recall.exe')));
  writeFileSync(join(fixture, 'SHA256SUMS'), `${'0'.repeat(64)}  terminal-recall-windows-x86_64.zip\n`);
  const invalid = spawnSync('powershell', ['-NoProfile', '-File', join(root, 'public/install.ps1')], { encoding: 'utf8', env: { ...process.env, TERMINAL_RECALL_FIXTURE_DIR: fixture, TERMINAL_RECALL_INSTALL_DIR: join(fixture, 'bad-install') } });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Checksum verification failed/);
} else {
  const fixture = mkdtempSync(join(tmpdir(), 'terminal-recall-sh-fixture-'));
  const payload = join(fixture, 'payload');
  const install = join(fixture, 'install');
  mkdirSync(payload);
  const fakeBinary = join(payload, 'terminal-recall');
  writeFileSync(fakeBinary, '#!/bin/sh\necho terminal-recall fixture\n');
  chmodSync(fakeBinary, 0o755);
  const archiveName = 'terminal-recall-linux-x86_64.tar.gz';
  const archive = join(fixture, archiveName);
  execFileSync('tar', ['-czf', archive, '-C', payload, 'terminal-recall']);
  writeFileSync(join(fixture, 'SHA256SUMS'), `${hash(archive)}  ${archiveName}\n`);
  writeFileSync(join(fixture, 'release.json'), JSON.stringify({ assets: [
    { name: archiveName, browser_download_url: `https://fixture.test/${archiveName}` },
    { name: 'SHA256SUMS', browser_download_url: 'https://fixture.test/SHA256SUMS' },
  ] }));
  const valid = spawnSync('sh', [join(root, 'public/install.sh')], { encoding: 'utf8', env: { ...process.env, TERMINAL_RECALL_FIXTURE_DIR: fixture, TERMINAL_RECALL_INSTALL_DIR: install } });
  assert.equal(valid.status, 0, valid.stderr);
  assert.equal(execFileSync(join(install, 'terminal-recall'), { encoding: 'utf8' }).trim(), 'terminal-recall fixture');

  const corruptFixture = mkdtempSync(join(tmpdir(), 'terminal-recall-sh-corrupt-'));
  for (const file of ['release.json', archiveName]) copyFileSync(join(fixture, file), join(corruptFixture, file));
  writeFileSync(join(corruptFixture, 'SHA256SUMS'), `${'0'.repeat(64)}  ${archiveName}\n`);
  const invalidInstall = join(corruptFixture, 'install');
  const invalid = spawnSync('sh', [join(root, 'public/install.sh')], { encoding: 'utf8', env: { ...process.env, TERMINAL_RECALL_FIXTURE_DIR: corruptFixture, TERMINAL_RECALL_INSTALL_DIR: invalidInstall } });
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Checksum verification failed/);
  assert.equal(existsSync(join(invalidInstall, 'terminal-recall')), false);
}

console.log('@claim:verified-installer valid fixtures install and corrupted fixtures are rejected.');
