import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const base = (process.env.LIVE_URL || 'https://terminal-recall.sociobot.in').replace(/\/$/, '');
const evidence = process.env.LIVE_EVIDENCE_DIR || '/tmp/terminal-recall-live-evidence';
await mkdir(evidence, { recursive: true });

const sha256 = value => createHash('sha256').update(value).digest('hex');
const seriousAxeFindings = async page => {
  const result = await new AxeBuilder({ page }).analyze();
  return result.violations.filter(finding => ['serious', 'critical'].includes(finding.impact || ''));
};
const undersizedTargets = page => page.locator('a:visible, button:visible, input:visible').evaluateAll(elements =>
  elements.map(element => {
    const rect = element.getBoundingClientRect();
    return {
      name: (element.textContent || element.getAttribute('aria-label') || '').trim(),
      width: rect.width,
      height: rect.height,
    };
  }).filter(target => target.width < 44 || target.height < 44),
);

const response = await fetch(`${base}/`);
assert.equal(response.status, 200);
const headers = Object.fromEntries(response.headers);
for (const name of ['content-security-policy', 'strict-transport-security', 'referrer-policy', 'x-content-type-options']) {
  assert.ok(headers[name], `missing ${name}`);
}
assert.equal((await fetch(`${base}/definitely-not-a-route`)).status, 404);

const localHtml = await readFile('dist/site/index.html', 'utf8');
const liveHtml = await response.text();
const assetPattern = /assets\/index-[A-Za-z0-9_-]+\.(?:js|css)/g;
assert.deepEqual(liveHtml.match(assetPattern)?.sort(), localHtml.match(assetPattern)?.sort());
const identity = {};
for (const asset of [...new Set(liveHtml.match(assetPattern) || []), 'hero-terminal-recall.webp', 'terminal-recall-share.webp', 'terminal-recall-demo.cast', 'sw.js']) {
  const local = await readFile(`dist/site/${asset}`);
  const live = Buffer.from(await (await fetch(`${base}/${asset}`)).arrayBuffer());
  assert.equal(sha256(live), sha256(local), `${asset} differs from the local build`);
  identity[asset] = sha256(live);
}

const release = await (await fetch('https://api.github.com/repos/B-Divyesh/sf-terminal-recall/releases/latest')).json();
assert.equal(release.tag_name, 'v0.1.4');
for (const name of ['terminal-recall-linux-x86_64.tar.gz', 'terminal-recall-windows-x86_64.zip', 'terminal-recall-macos-arm64.tar.gz', 'terminal-recall-macos-x86_64.tar.gz', 'terminal-recall-linux-x86_64.deb', 'terminal-recall-linux-x86_64.rpm', 'terminal-recall-macos-arm64.pkg', 'terminal-recall-macos-x86_64.pkg', 'SHA256SUMS', 'latest.json', 'SIGNING-STATUS.json']) {
  assert.ok(release.assets.some(asset => asset.name === name), `release is missing ${name}`);
}
const releaseAsset = name => release.assets.find(asset => asset.name === name);
const checksumText = await (await fetch(releaseAsset('SHA256SUMS').browser_download_url)).text();
const linuxArchive = Buffer.from(await (await fetch(releaseAsset('terminal-recall-linux-x86_64.tar.gz').browser_download_url)).arrayBuffer());
const expectedLinuxHash = checksumText.split('\n').find(line => line.endsWith('  terminal-recall-linux-x86_64.tar.gz'))?.split(/\s+/)[0];
assert.equal(sha256(linuxArchive), expectedLinuxHash, 'published Linux archive does not match SHA256SUMS');
const releaseManifest = await (await fetch(releaseAsset('latest.json').browser_download_url)).json();
assert.equal(releaseManifest.version, '0.1.4');
for (const platform of ['linux', 'windows', 'macos_arm64', 'macos_x86_64']) assert.ok(releaseManifest.assets[platform]);
console.log('live: release assets and checksum passed');

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1366, height: 900 } });
const page = await context.newPage();
const errors = [];
const origins = new Set();
page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
page.on('pageerror', error => errors.push(String(error)));
page.on('request', request => origins.add(new URL(request.url()).origin));
await page.goto(`${base}/`, { waitUntil: 'networkidle' });
assert.equal(await page.title(), 'Terminal Recall — save and find terminal output');
assert.equal(await page.locator('html').getAttribute('lang'), 'en');
assert.equal(await page.locator('h1').count(), 1);
assert.equal(await page.locator('main').count(), 1);
assert.match(await page.locator('footer').innerText(), /v0\.1\.4/);
const platformDownload = page.getByRole('link', { name: 'terminal-recall-linux-x86_64.tar.gz' });
assert.match(await platformDownload.getAttribute('href'), /\/v0\.1\.4\/terminal-recall-linux-x86_64\.tar\.gz$/);
assert.deepEqual(await seriousAxeFindings(page), []);
assert.deepEqual(await undersizedTargets(page), []);
assert.deepEqual([...origins].sort(), [new URL(base).origin, 'https://api.github.com'].sort());
await page.screenshot({ path: `${evidence}/live-desktop.png`, fullPage: true });
console.log('live: home passed');

await page.keyboard.press('Tab');
assert.equal(await page.evaluate(() => document.activeElement?.classList.contains('skip')), true);
await page.keyboard.press('Enter');
assert.equal(new URL(page.url()).hash, '#main');

await page.getByRole('link', { name: 'Try it with sample data' }).click();
await page.waitForURL(`${base}/?demo=1`);
assert.equal(await page.locator('h1').count(), 1);
assert.equal(await page.evaluate(() => localStorage.getItem('terminal-recall:logs')), null);
assert.ok(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs')));
const demoOrigins = new Set();
page.on('request', request => demoOrigins.add(new URL(request.url()).origin));
await page.getByLabel('Find in record').fill('health');
const downloadEvent = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export redacted excerpt' }).click();
const download = await downloadEvent;
const excerpt = await readFile(await download.path(), 'utf8');
assert.match(excerpt, /\[REDACTED\]/);
assert.doesNotMatch(excerpt, /sk_demo_/);
assert.deepEqual([...demoOrigins], []);
assert.deepEqual(await seriousAxeFindings(page), []);
await page.screenshot({ path: `${evidence}/live-demo-desktop.png`, fullPage: true });
console.log('live: demo passed');

await page.goBack();
await page.waitForURL(url => url.pathname === '/' && !url.searchParams.has('demo'));
assert.equal(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs')), null);
await page.waitForFunction(() => document.activeElement === document.querySelector('h1'));
await page.goForward();
await page.waitForURL(`${base}/?demo=1`);
assert.ok(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs')));
await page.waitForFunction(() => document.activeElement === document.querySelector('h1'));

await page.evaluate(() => navigator.serviceWorker.ready);
await page.reload();
await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
const cacheNames = await page.evaluate(() => caches.keys());
assert.ok(cacheNames.includes('terminal-recall-v4'));
assert.ok(!cacheNames.includes('terminal-recall-v3'));
await context.setOffline(true);
await page.reload();
assert.equal(await page.getByRole('heading', { name: 'Search the sample deploy record' }).isVisible(), true);
await context.setOffline(false);
assert.deepEqual(errors, []);
console.log('live: history and offline passed');

for (const [route, title] of [['/privacy', 'Privacy — Terminal Recall'], ['/terms', 'Terms — Terminal Recall']]) {
  const legalPage = await context.newPage();
  const legalErrors = [];
  legalPage.on('console', message => { if (message.type() === 'error') legalErrors.push(message.text()); });
  legalPage.on('pageerror', error => legalErrors.push(String(error)));
  const legalResponse = await legalPage.goto(`${base}${route}`, { waitUntil: 'networkidle' });
  assert.equal(legalResponse.status(), 200);
  assert.equal(await legalPage.title(), title);
  assert.equal(await legalPage.locator('h1').count(), 1);
  assert.equal(await legalPage.locator('header').count(), 1);
  assert.equal(await legalPage.locator('main').count(), 1);
  assert.equal(await legalPage.locator('footer').count(), 1);
  assert.equal(await legalPage.locator('link[rel="canonical"]').getAttribute('href'), `${base}${route}`);
  assert.equal(await legalPage.locator('meta[property="og:url"]').getAttribute('content'), `${base}${route}`);
  assert.deepEqual(await seriousAxeFindings(legalPage), []);
  assert.deepEqual(legalErrors, []);
  await legalPage.close();
}
console.log('live: legal routes passed');

const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const mobilePage = await mobile.newPage();
const mobileErrors = [];
mobilePage.on('console', message => { if (message.type() === 'error') mobileErrors.push(message.text()); });
mobilePage.on('pageerror', error => mobileErrors.push(String(error)));
await mobilePage.goto(`${base}/?demo=1`, { waitUntil: 'networkidle' });
assert.equal(await mobilePage.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
assert.deepEqual(await undersizedTargets(mobilePage), []);
assert.deepEqual(await seriousAxeFindings(mobilePage), []);
const transcript = mobilePage.getByLabel(/Saved terminal output/);
await transcript.focus();
assert.equal(await transcript.evaluate(element => element === document.activeElement), true);
await mobilePage.keyboard.press('ArrowDown');
await mobilePage.screenshot({ path: `${evidence}/live-mobile-390.png`, fullPage: true });
assert.deepEqual(mobileErrors, []);
console.log('live: mobile passed');

const missingPage = await context.newPage();
const missingResponse = await missingPage.goto(`${base}/missing-live-review-route`, { waitUntil: 'networkidle' });
assert.equal(missingResponse.status(), 404);
assert.equal(await missingPage.title(), 'Not found — Terminal Recall');
assert.equal(await missingPage.locator('header').count(), 1);
assert.equal(await missingPage.locator('main').count(), 1);
assert.equal(await missingPage.locator('footer').count(), 1);
assert.ok(await missingPage.locator('meta[name="description"]').getAttribute('content'));
assert.ok(await missingPage.locator('meta[property="og:image"]').getAttribute('content'));
assert.deepEqual(await undersizedTargets(missingPage), []);
assert.deepEqual(await seriousAxeFindings(missingPage), []);
await missingPage.screenshot({ path: `${evidence}/live-404-mobile.png`, fullPage: true });
console.log('live: 404 passed');

await context.close();
await mobile.close();
await browser.close();

const report = { base, headers, identity, cacheNames, errors, mobileErrors, release: release.tag_name };
await writeFile(`${evidence}/live-check.json`, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
