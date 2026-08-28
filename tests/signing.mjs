import assert from 'node:assert/strict';

const releaseResponse = await fetch('https://api.github.com/repos/B-Divyesh/sf-terminal-recall/releases/tags/v0.1.4', {
  headers: { Accept: 'application/vnd.github+json' },
});
assert.equal(releaseResponse.status, 200, 'v0.1.4 release is not public');
const release = await releaseResponse.json();
const asset = release.assets.find(item => item.name === 'SIGNING-STATUS.json');
assert.ok(asset, 'release is missing SIGNING-STATUS.json');
const statusResponse = await fetch(asset.browser_download_url);
assert.equal(statusResponse.status, 200, 'cannot download SIGNING-STATUS.json');
const statuses = await statusResponse.json();
assert.deepEqual(
  statuses.map(item => [item.platform, item.status]).sort(),
  [
    ['terminal-recall-macos-arm64', 'unsigned'],
    ['terminal-recall-macos-x86_64', 'unsigned'],
    ['windows', 'unsigned'],
  ],
);
console.log('@claim:unsigned-release public signing report confirms unsigned Windows and macOS files.');
