import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const executable = process.platform === 'win32'
  ? join(root, 'target', 'debug', 'terminal-recall.exe')
  : join(root, 'target', 'debug', 'terminal-recall');

const build = spawnSync('cargo', ['build', '-p', 'terminal-recall'], { cwd: root, encoding: 'utf8' });
assert.equal(build.status, 0, build.stderr);
const run = spawnSync(executable, ['demo'], { cwd: root, encoding: 'utf8' });
assert.equal(run.status, 0, run.stderr);

const transcript = run.stdout
  .replaceAll(root, '<repo>')
  .replace(/[/\\]tmp[/\\]terminal-recall-demo-[\w-]+/g, '<temporary demo folder>')
  .replace(/\b[0-9a-f]{12}\b/g, '<record-id>')
  .replace(/\r\n/g, '\n')
  .trimEnd();
const lines = transcript.split('\n');
const cast = [
  JSON.stringify({ version: 2, width: 96, height: 18, timestamp: 1787947200, env: { TERM: 'xterm-256color', SHELL: 'terminal-recall demo' } }),
  ...lines.map((line, index) => JSON.stringify([Number((index * 0.12).toFixed(2)), 'o', `${line}\r\n`])),
].join('\n') + '\n';
const output = join(root, 'public', 'terminal-recall-demo.cast');

if (process.argv.includes('--check')) {
  assert.equal(await readFile(output, 'utf8'), cast, 'terminal recording is stale; run npm run generate:recording');
  console.log('@claim:cli-demo-recording recording matches the compiled public CLI and bundled sample.');
} else {
  await writeFile(output, cast);
  console.log(`Wrote ${output}`);
}
