import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));
assert.equal('navigationFallback' in config, false, 'unknown paths must not fall back to the SPA with HTTP 200');
assert.deepEqual(config.responseOverrides?.['404'], { rewrite: '/404.html' }, 'the static host must serve the designed 404 response');
for (const route of ['/demo', '/privacy', '/terms']) {
  assert.ok(config.routes?.some(entry => entry.route === route && entry.rewrite === '/index.html'), `${route} must remain a real SPA route`);
}
console.log('Static deployment serves known SPA routes and leaves unknown paths as HTTP 404.');

const notFound = await readFile(new URL('../public/404.html', import.meta.url), 'utf8');
for (const required of ['<header>', '<main id="main">', '<footer>', 'Skip to content', 'meta name="description"', 'property="og:title"', 'rel="canonical"', 'apple-touch-icon']) {
  assert.ok(notFound.includes(required), `404 is missing ${required}`);
}
assert.match(notFound, /<title>Not found — Terminal Recall<\/title>/);
assert.match(notFound, /<h1>This record is not here<\/h1>/);
console.log('The static 404 includes the shared shell, route metadata, and one plain-language h1.');
