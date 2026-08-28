import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = process.cwd();
const binary = join(root, 'target', 'debug', process.platform === 'win32' ? 'terminal-recall.exe' : 'terminal-recall');
const temporary = () => mkdtempSync(join(tmpdir(), 'terminal-recall-claim-'));
const cli = (home: string, args: string[], input?: string) => spawnSync(binary, ['--home', home, ...args], { cwd: root, encoding: 'utf8', input });
const capture = (home: string, output: string, label = 'claim record') => {
  const result = cli(home, ['--json', 'capture', '--label', label], output);
  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout).id as string;
};

test.beforeAll(() => {
  execFileSync('cargo', ['build', '-p', 'terminal-recall'], { cwd: root, stdio: 'pipe' });
});

test('@claim:demo-private demo data stays separate and every exit discards it', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('terminal-recall:logs', 'real-record-sentinel'));
  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\?demo=1$/);
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs'))).not.toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('terminal-recall:logs'))).toBe('real-record-sentinel');

  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('terminal-recall:logs'))).toBe('real-record-sentinel');

  await page.goForward();
  await expect(page.getByRole('heading', { level: 1 })).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs'))).not.toBeNull();
  await page.getByRole('button', { name: 'Start for real' }).click();
  expect(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs'))).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('terminal-recall:logs'))).toBe('real-record-sentinel');
});

test('@claim:cli-demo-recording recording matches the real CLI and bundled sample', async ({ page }) => {
  execFileSync(process.execPath, ['scripts/generate-recording.mjs', '--check'], { cwd: root, stdio: 'pipe' });
  await page.goto('/?demo=1');
  const recording = page.getByLabel('Terminal recording transcript');
  await expect(recording).toContainText('terminal-recall capture');
  await expect(recording).toContainText('terminal-recall search');
  await expect(recording).toContainText('terminal-recall export');
  await expect(page.getByText('Browser simulation.')).toBeVisible();
});

test('@claim:redacted-export browser and CLI exports remove every named secret class', async ({ page }) => {
  await page.goto('/?demo=1');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export redacted excerpt' }).click();
  const downloaded = await downloadEvent;
  const browserExport = readFileSync((await downloaded.path())!, 'utf8');
  for (const secret of ['sk_demo_', 'deploy_token_', 'correct-horse', 'eyJhbGci']) expect(browserExport).not.toContain(secret);
  expect(browserExport.match(/\[REDACTED\]/g)?.length).toBeGreaterThanOrEqual(4);

  const home = temporary();
  const id = capture(home, readFileSync(join(root, 'cli/examples/deploy-check.txt'), 'utf8'));
  const output = join(home, 'excerpt.txt');
  const exported = cli(home, ['export', id, '--output', output, '--context', '0']);
  expect(exported.status, exported.stderr).toBe(0);
  const cliExport = readFileSync(output, 'utf8');
  for (const secret of ['sk_demo_', 'deploy_token_', 'correct-horse', 'eyJhbGci']) expect(cliExport).not.toContain(secret);
  expect(cliExport.match(/\[REDACTED\]/g)?.length).toBeGreaterThanOrEqual(4);
});

test('@claim:offline-demo sample demo reloads offline after one visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/?demo=1');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Search the sample deploy record' })).toBeVisible();
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  await context.close();
});

test('@claim:no-analytics site routes use no analytics and the demo sends no sample data', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.route('https://api.github.com/repos/B-Divyesh/sf-terminal-recall/releases/latest', route => route.fulfill({ json: { assets: [] } }));
  for (const route of ['/', '/?demo=1', '/privacy', '/terms', '/missing-test-route']) {
    await page.goto(route);
  }
  await page.goto('/?demo=1');
  await page.getByLabel('Find in record').fill('health');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export redacted excerpt' }).click();
  await download;
  const allowed = new Set(['http://127.0.0.1:4173', 'https://api.github.com']);
  expect(requests.filter(url => !allowed.has(new URL(url).origin))).toEqual([]);
  expect(requests.filter(url => /analytics|segment|sentry|telemetry|plausible/i.test(url))).toEqual([]);
});

const releaseFixture = {
  assets: [
    { name: 'terminal-recall-linux-x86_64.tar.gz', browser_download_url: 'https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.4/terminal-recall-linux-x86_64.tar.gz' },
    { name: 'terminal-recall-windows-x86_64.zip', browser_download_url: 'https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.4/terminal-recall-windows-x86_64.zip' },
    { name: 'terminal-recall-macos-arm64.tar.gz', browser_download_url: 'https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.4/terminal-recall-macos-arm64.tar.gz' },
    { name: 'terminal-recall-macos-x86_64.tar.gz', browser_download_url: 'https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.4/terminal-recall-macos-x86_64.tar.gz' },
    { name: 'terminal-recall-linux-x86_64.deb', browser_download_url: 'https://example.test/linux.deb' },
    { name: 'terminal-recall-linux-x86_64.rpm', browser_download_url: 'https://example.test/linux.rpm' },
    { name: 'terminal-recall-macos-arm64.pkg', browser_download_url: 'https://example.test/mac.pkg' },
    { name: 'SHA256SUMS', browser_download_url: 'https://example.test/SHA256SUMS' },
    { name: 'latest.json', browser_download_url: 'https://example.test/latest.json' },
  ],
};

async function assertPlatformDownload(page: Page, platform: string, asset: RegExp) {
  await page.addInitScript(value => Object.defineProperty(navigator, 'platform', { get: () => value }), platform);
  await page.route('https://api.github.com/repos/B-Divyesh/sf-terminal-recall/releases/latest', route => route.fulfill({ json: releaseFixture }));
  await page.goto('/');
  await expect(page.locator('#download-state a')).toHaveAttribute('href', asset);
}

test('@claim:release-platform-assets landing chooses a published archive for Linux, macOS, and Windows', async ({ browser }) => {
  for (const [platform, asset] of [['Linux x86_64', /linux-x86_64\.tar\.gz$/], ['MacIntel', /macos-arm64\.tar\.gz$/], ['Win32', /windows-x86_64\.zip$/]] as const) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await assertPlatformDownload(page, platform, asset);
    await context.close();
  }
});

test('@claim:release-artifact-set release fixture contains every documented artifact class', async () => {
  const names = releaseFixture.assets.map(asset => asset.name);
  for (const expected of [/linux.*\.tar\.gz$/, /windows.*\.zip$/, /macos-arm64.*\.tar\.gz$/, /macos-x86_64.*\.tar\.gz$/, /\.deb$/, /\.rpm$/, /\.pkg$/, /^SHA256SUMS$/, /^latest\.json$/]) {
    expect(names.some(name => expected.test(name)), `missing ${expected}`).toBe(true);
  }
});

test('@claim:encrypted-local-records public CLI writes ciphertext and decrypts it for search', async () => {
  const home = temporary();
  const secret = 'migration checkpoint private-48291';
  const id = capture(home, secret);
  const encrypted = readFileSync(join(home, 'records', `${id}.tr`), 'utf8');
  expect(encrypted).not.toContain(secret);
  const searched = cli(home, ['search', 'private-48291']);
  expect(searched.status, searched.stderr).toBe(0);
  expect(searched.stdout).toContain(secret);
});

test('@claim:chosen-capture public CLI saves only explicit run and capture invocations', async () => {
  const home = temporary();
  expect(JSON.parse(cli(home, ['--json', 'list']).stdout)).toHaveLength(0);
  const ran = cli(home, ['--json', 'run', '--label', 'chosen command', '--', 'printf', 'chosen-run-output']);
  expect(ran.status, ran.stderr).toBe(0);
  const piped = cli(home, ['--json', 'capture', '--label', 'chosen stdin'], 'chosen-stdin-output');
  expect(piped.status, piped.stderr).toBe(0);
  const records = JSON.parse(cli(home, ['--json', 'list']).stdout);
  expect(records).toHaveLength(2);
  expect(records.map((record: { label: string }) => record.label).sort()).toEqual(['chosen command', 'chosen stdin']);
});

test('@claim:no-upload-path CLI capture, search, and export succeed with network calls blocked', async () => {
  test.skip(process.platform !== 'linux', 'LD_PRELOAD network guard is verified on Linux');
  const directory = temporary();
  const source = join(directory, 'deny-network.c');
  const guard = join(directory, 'deny-network.so');
  const log = join(directory, 'network.log');
  writeFileSync(source, '#include <sys/socket.h>\n#include <stdlib.h>\n#include <fcntl.h>\n#include <unistd.h>\nint socket(int d,int t,int p){int f=open(getenv("TR_NETWORK_LOG"),O_WRONLY|O_CREAT|O_APPEND,0600);if(f>=0){write(f,"socket\\n",7);close(f);}return -1;}\nint connect(int s,const struct sockaddr*a,socklen_t l){return -1;}\n');
  execFileSync('cc', ['-shared', '-fPIC', source, '-o', guard]);
  const env = { ...process.env, LD_PRELOAD: guard, TR_NETWORK_LOG: log };
  const home = join(directory, 'store');
  const captured = spawnSync(binary, ['--home', home, '--json', 'capture'], { encoding: 'utf8', input: 'local only', env });
  expect(captured.status, captured.stderr).toBe(0);
  const id = JSON.parse(captured.stdout).id;
  expect(spawnSync(binary, ['--home', home, 'search', 'local'], { encoding: 'utf8', env }).status).toBe(0);
  expect(spawnSync(binary, ['--home', home, 'export', id, '--output', join(directory, 'out.txt')], { encoding: 'utf8', env }).status).toBe(0);
  expect(readdirSync(directory)).not.toContain('network.log');
});

test('@claim:configured-redaction status reveals the editable rule file used by public export', async () => {
  const home = temporary();
  const status = cli(home, ['status']);
  expect(status.status, status.stderr).toBe(0);
  expect(status.stdout).toContain(`Records: ${home}`);
  writeFileSync(join(home, 'redaction-rules.json'), '{"patterns":["(?i)DATABASE_URL=\\\\S+"]}');
  const id = capture(home, 'DATABASE_URL=postgres://alice:private-password@db.internal/prod');
  const output = join(home, 'excerpt.txt');
  expect(cli(home, ['export', id, '--output', output, '--context', '0']).status).toBe(0);
  expect(readFileSync(output, 'utf8')).not.toContain('private-password');
});

test('@claim:bounded-export-context public export handles positive, zero, and overflow-safe context', async () => {
  const home = temporary();
  const id = capture(home, 'one\ntwo\nthree\nfour\nfive\nsix');
  const bounded = join(home, 'bounded.txt');
  expect(cli(home, ['export', id, '--output', bounded, '--context', '2']).status).toBe(0);
  expect(readFileSync(bounded, 'utf8')).toContain('one\ntwo\nthree\nfour\nfive');
  expect(readFileSync(bounded, 'utf8')).not.toContain('\nsix');
  for (const [context, name] of [['0', 'full.txt'], [String(Number.MAX_SAFE_INTEGER), 'large.txt']] as const) {
    expect(cli(home, ['export', id, '--output', join(home, name), '--context', context]).status).toBe(0);
    expect(readFileSync(join(home, name), 'utf8')).toContain('six');
  }
});

test('@claim:status-output status prints the record folder and key fingerprint', async () => {
  const home = temporary();
  const result = cli(home, ['status']);
  expect(result.status, result.stderr).toBe(0);
  expect(result.stdout).toContain(`Records: ${home}`);
  expect(result.stdout).toMatch(/Key fingerprint: [0-9a-f]{16}/);
});

test('@claim:expire-records expire removes old records through the public CLI', async () => {
  const home = temporary();
  capture(home, 'remove me');
  const expired = cli(home, ['expire', '--days', '0']);
  expect(expired.status, expired.stderr).toBe(0);
  expect(expired.stdout).toContain('Deleted 1 record');
  expect(JSON.parse(cli(home, ['--json', 'list']).stdout)).toHaveLength(0);
});

test('@claim:delete-record delete removes the selected record and keeps another record', async () => {
  const home = temporary();
  const removed = capture(home, 'remove me', 'removed');
  const kept = capture(home, 'keep me', 'kept');
  expect(cli(home, ['delete', removed]).status).toBe(0);
  const records = JSON.parse(cli(home, ['--json', 'list']).stdout);
  expect(records.map((record: { id: string }) => record.id)).toEqual([kept]);
});

test('@claim:lost-key-unreadable replacing the local key makes saved records unreadable', async () => {
  const home = temporary();
  capture(home, 'cannot recover this without the key');
  writeFileSync(join(home, 'key.bin'), Buffer.alloc(32, 7));
  const searched = cli(home, ['search', 'recover']);
  expect(searched.status).toBe(2);
  expect(searched.stderr).toContain('cannot decrypt record');
});

test('@claim:free-no-account core capture, search, and export run without an account or payment', async () => {
  const home = temporary();
  const id = capture(home, 'free local workflow');
  expect(cli(home, ['search', 'workflow']).status).toBe(0);
  expect(cli(home, ['export', id, '--output', join(home, 'free.txt')]).status).toBe(0);
});

test('route titles, metadata, focus, 404 view, touch targets, and accessibility pass', async ({ page }) => {
  await page.route('https://api.github.com/**', route => route.fulfill({ json: releaseFixture }));
  for (const [route, title] of [['/', 'Terminal Recall — save and find terminal output'], ['/?demo=1', 'Demo — Terminal Recall'], ['/privacy', 'Privacy — Terminal Recall'], ['/terms', 'Terms — Terminal Recall'], ['/missing-test-route', 'Not found — Terminal Recall']] as const) {
    await page.goto(route);
    await expect(page).toHaveTitle(title);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('header')).toHaveCount(1);
    await expect(page.locator('footer')).toHaveCount(1);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/terminal-recall\.sociobot\.in/);
    await expect(page.locator('meta[property="og:url"]')).toHaveAttribute('content', /^https:\/\/terminal-recall\.sociobot\.in/);
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  }
});

test('static 404 page has its own metadata, shared landmarks, accessible contrast, and large targets', async ({ page }) => {
  await page.goto('/404.html');
  await expect(page).toHaveTitle('Not found — Terminal Recall');
  await expect(page.locator('header')).toHaveCount(1);
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('footer')).toHaveCount(1);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /does not exist/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /terminal-recall-share\.webp$/);
  const targets = await page.locator('a:visible').evaluateAll(elements => elements.map(element => {
    const rect = element.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }).filter(target => target.width < 44 || target.height < 44));
  expect(targets).toEqual([]);
  const axe = await new AxeBuilder({ page }).analyze();
  expect(axe.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('390px layouts have no overflow and every visible control is at least 44px', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  for (const route of ['/', '/?demo=1', '/privacy', '/terms']) {
    await page.goto(route);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const undersized = await page.locator('a:visible, button:visible, input:visible').evaluateAll(elements =>
      elements.map(element => {
        const rect = element.getBoundingClientRect();
        return { name: (element.textContent || element.getAttribute('aria-label') || '').trim(), width: rect.width, height: rect.height };
      }).filter(target => target.width < 44 || target.height < 44),
    );
    expect(undersized).toEqual([]);
  }
  await context.close();
});

test('reviewed wording and catalog description stay plain and consistent', async () => {
  const source = readFileSync(join(root, 'src/main.ts'), 'utf8');
  const readme = readFileSync(join(root, 'README.md'), 'utf8');
  for (const removed of ['LOCAL EVIDENCE LAYER', 'Free local core', 'browser sandbox', 'Search a captured session', 'THREE SMALL STEPS', 'Checksum is in the release', 'ready for submission']) {
    expect(source + readme).not.toContain(removed);
  }
  expect(source).toContain('SAVED ON YOUR DEVICE');
  expect(source).toContain('Search a saved record');
  expect(source).toContain('HOW TO SAVE AND FIND OUTPUT');
  expect(readme).toContain('Terminal Recall saves only commands you run through it.');
  expect(readme).toContain('## Capture, search, and export records');
  const description = readFileSync(join(root, '.factory/catalog-description.txt'), 'utf8').trim();
  expect(description.length).toBeLessThanOrEqual(120);
  expect(description).toMatch(/^Save\b/);
});

test('the product share image is exactly 1200 by 630 pixels', async ({ page }) => {
  await page.goto('/');
  const dimensions = await page.evaluate(async () => {
    const image = new Image();
    image.src = '/terminal-recall-share.webp';
    await image.decode();
    return [image.naturalWidth, image.naturalHeight];
  });
  expect(dimensions).toEqual([1200, 630]);
});
