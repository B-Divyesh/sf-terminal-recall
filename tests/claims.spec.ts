import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('@claim:demo-private demo storage is namespaced and discarded when leaving demo', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Demo — sample data, nothing is saved')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs'))).not.toBeNull();
  expect(await page.evaluate(() => localStorage.getItem('terminal-recall:logs'))).toBeNull();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByRole('heading', { name: 'Find terminal output after it disappears' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('demo:terminal-recall:logs'))).toBeNull();
});

test('@claim:redacted-export downloaded excerpt replaces configured API keys', async ({ page }) => {
  await page.goto('/demo');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export redacted excerpt' }).click();
  const file = await download;
  const path = await file.path();
  const fs = await import('node:fs/promises');
  const text = await fs.readFile(path!, 'utf8');
  expect(text).toContain('[REDACTED]');
  expect(text).not.toContain('sk_demo_');
});

test('@claim:offline-demo sample remains available after a service-worker visit', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('/demo');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await expect(page.getByRole('heading', { name: 'Search the sample deploy record' })).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Search the sample deploy record' })).toBeVisible();
  await context.close();
});

test('@claim:no-demo-uploads sample interactions make no third-party network request', async ({ page }) => {
  const origins = new Set<string>();
  page.on('request', request => origins.add(new URL(request.url()).origin));
  await page.goto('/demo');
  await page.getByLabel('Find in record').fill('health');
  await page.getByRole('button', { name: 'Export redacted excerpt' }).click();
  expect([...origins]).toEqual(['http://127.0.0.1:4173']);
});

test('@claim:release-download release metadata renders the detected platform archive', async ({ page }) => {
  await page.route('https://api.github.com/repos/B-Divyesh/sf-terminal-recall/releases/latest', route => route.fulfill({ json: { assets: [{ name: 'terminal-recall-linux-x86_64.tar.gz', browser_download_url: 'https://github.com/B-Divyesh/sf-terminal-recall/releases/download/v0.1.1/terminal-recall-linux-x86_64.tar.gz' }] } }));
  await page.goto('/');
  const link = page.getByRole('link', { name: 'terminal-recall-linux-x86_64.tar.gz' });
  await expect(link).toHaveAttribute('href', /terminal-recall-linux-x86_64\.tar\.gz$/);
});

test('desktop has no serious or critical accessibility violations', async ({ page }) => {
  await page.goto('/demo');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
});

test('390px mobile has no serious or critical accessibility violations and transcript accepts keyboard focus', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/demo');
  const output = page.getByLabel(/Captured terminal output/);
  await output.focus();
  await expect(output).toBeFocused();
  await page.keyboard.press('ArrowDown');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations.filter(item => ['serious', 'critical'].includes(item.impact || ''))).toEqual([]);
  await context.close();
});
