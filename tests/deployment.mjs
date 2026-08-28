import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../public/staticwebapp.config.json', import.meta.url), 'utf8'));
assert.equal('navigationFallback' in config, false, 'unknown paths must not fall back to the SPA with HTTP 200');
assert.deepEqual(config.responseOverrides?.['404'], { rewrite: '/404.html' }, 'the static host must serve the designed 404 response');
for (const route of ['/demo', '/privacy', '/terms']) {
  assert.ok(config.routes?.some(entry => entry.route === route && entry.rewrite === '/index.html'), `${route} must remain a real SPA route`);
}
console.log('Static deployment serves known SPA routes and leaves unknown paths as HTTP 404.');
