import './style.css';
import sampleText from '../cli/examples/deploy-check.txt?raw';
import recordingCast from '../public/terminal-recall-demo.cast?raw';

type SavedRecord = { id: string; label: string; command: string; captured: string; lines: string[] };
type ReleaseAsset = { name: string; browser_download_url: string };
type Release = { assets: ReleaseAsset[] };
type PageMetadata = { title: string; description: string; url: string };

const VERSION = '0.1.4';
const ORIGIN = 'https://terminal-recall.sociobot.in';
const demoKey = 'demo:terminal-recall:logs';
const sample: SavedRecord = {
  id: 'demo-deploy-042',
  label: 'Deploy smoke test',
  command: './deploy-check --region fra1',
  captured: '2026-08-28 14:32 UTC',
  lines: sampleText.trim().split('\n'),
};
const recording = recordingCast.trim().split('\n').slice(1)
  .map(line => (JSON.parse(line) as [number, string, string])[2].replace(/\r?\n$/, ''));
const app = document.querySelector<HTMLDivElement>('#app')!;
let demo = isDemoLocation();
let query = '';

const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
const page = (...parts: string[]) => parts.join('');
const redacted = (value: string) => value.replace(/(?:(?:API[_-]?KEY|TOKEN|PASSWORD|SECRET)\s*[=:]\s*\S+|\b(?:sk|ghp)_[\w-]{12,}\b|Bearer\s+[\w.-]{12,})/gi, '[REDACTED]');

function isDemoLocation() {
  return location.pathname === '/demo' || (location.pathname === '/' && new URLSearchParams(location.search).get('demo') === '1');
}

function metadata(): PageMetadata {
  if (demo) return { title: 'Demo — Terminal Recall', description: 'Try search and redacted export with an isolated sample record.', url: `${ORIGIN}/?demo=1` };
  if (location.pathname === '/privacy') return { title: 'Privacy — Terminal Recall', description: 'How Terminal Recall keeps command output and keys on your device.', url: `${ORIGIN}/privacy` };
  if (location.pathname === '/terms') return { title: 'Terms — Terminal Recall', description: 'Terms for using the Terminal Recall command line tool and website.', url: `${ORIGIN}/terms` };
  if (location.pathname !== '/') return { title: 'Not found — Terminal Recall', description: 'This Terminal Recall page does not exist.', url: `${ORIGIN}${location.pathname}` };
  return { title: 'Terminal Recall — save and find terminal output', description: 'Save selected terminal output locally. Search it later and export a redacted excerpt.', url: `${ORIGIN}/` };
}

function setMeta(selector: string, value: string) {
  document.querySelector<HTMLMetaElement>(selector)?.setAttribute('content', value);
}

function updateMetadata() {
  const current = metadata();
  document.title = current.title;
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', current.url);
  setMeta('meta[name="description"]', current.description);
  setMeta('meta[property="og:title"]', current.title);
  setMeta('meta[property="og:description"]', current.description);
  setMeta('meta[property="og:url"]', current.url);
  setMeta('meta[name="twitter:title"]', current.title);
  setMeta('meta[name="twitter:description"]', current.description);
}

function ensureDemoStorage() {
  if (demo && !localStorage.getItem(demoKey)) localStorage.setItem(demoKey, JSON.stringify(sample));
}

function clearDemoStorage() {
  localStorage.removeItem(demoKey);
}

function afterRouteChange() {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>('h1')?.focus();
    const status = document.querySelector<HTMLElement>('#route-status');
    if (status) status.textContent = `${document.title}. Page loaded.`;
  });
}

function route(to: string) {
  const leavingDemo = demo;
  const next = new URL(to, location.href);
  history.pushState({}, '', `${next.pathname}${next.search}${next.hash}`);
  demo = isDemoLocation();
  if (leavingDemo && !demo) clearDemoStorage();
  query = '';
  render();
  afterRouteChange();
}

function head() {
  return page(
    '<a class="skip" href="#main">Skip to content</a>',
    '<header><a class="brand" href="/" data-route>Terminal <i>Recall</i></a>',
    '<nav aria-label="Main navigation"><a href="/?demo=1" data-route>Demo</a><a href="/#install">Install</a><a href="/privacy" data-route>Privacy</a></nav></header>',
    '<div id="route-status" class="route-status" aria-live="polite" aria-atomic="true"></div>',
  );
}

function foot() {
  return `<footer><p>Save selected terminal output on your device.</p><p><a href="/privacy" data-route>Privacy</a> · <a href="/terms" data-route>Terms</a> · Built by Param Factory · v${VERSION}</p></footer>`;
}

function demoStrip() {
  return demo ? '<aside class="demo-banner" aria-label="Demo controls"><strong>Demo — sample data, nothing is saved</strong><span><button type="button" data-reset>Reset demo</button><button type="button" data-real>Start for real</button></span></aside>' : '';
}

function recordingPanel() {
  const transcript = recording.map(line => escapeHtml(line)).join('\n');
  return page(
    '<figure class="cli-recording" aria-labelledby="recording-title">',
    '<figcaption><strong id="recording-title">Real CLI run</strong><span>Recorded from terminal-recall v', VERSION, ' using cli/examples/deploy-check.txt.</span></figcaption>',
    '<pre tabindex="0" aria-label="Terminal recording transcript"><code>', transcript, '</code></pre>',
    '</figure>',
  );
}

function product() {
  const lines = sample.lines.map((line, index) => '<code class="' + (query && line.toLowerCase().includes(query.toLowerCase()) ? 'match' : '') + '"><span>' + String(index + 1).padStart(2, ' ') + '</span>' + escapeHtml(line) + '</code>').join('');
  const matching = sample.lines.filter(item => item.toLowerCase().includes(query.toLowerCase())).length;
  return page(
    '<section class="recall" aria-labelledby="recall-heading"><div class="paper-tab">SAMPLE RECORD</div>',
    '<div class="recall-head"><div><h2 id="recall-heading">Search a saved record</h2><p>The demo never reads or changes your saved records.</p></div>',
    '<label class="search" for="search">Find in record<input id="search" value="', escapeHtml(query), '" placeholder="Try: health check" /></label></div>',
    '<p class="simulation-note"><strong>Browser simulation.</strong> Install the CLI to save your own output.</p>',
    '<div class="record-layout"><aside class="record-list" aria-label="Saved records"><div class="record selected"><b>Deploy smoke test</b><span>2026-08-28 14:32 UTC</span></div></aside>',
    '<div class="terminal"><div class="terminal-bar"><span aria-hidden="true">● ● ●</span><code>', sample.command, '</code></div>',
    '<pre tabindex="0" aria-label="Saved terminal output. Use arrow keys to read the scrollable output.">', lines, '</pre>',
    '<div class="terminal-foot"><span aria-live="polite">', query ? `${matching} matching ${matching === 1 ? 'line' : 'lines'}` : `${sample.lines.length} saved lines`, '</span><button type="button" data-export>Export redacted excerpt</button></div></div></div></section>',
  );
}

function landing() {
  return page(
    '<main id="main"><section class="hero"><div class="hero-copy"><p class="eyebrow">SAVED ON YOUR DEVICE</p>',
    '<h1 tabindex="-1">Find terminal output after it disappears</h1>',
    '<p class="lead">For developers who need a command result after the session ends.</p>',
    '<div class="actions"><a class="button primary" href="/?demo=1" data-route>Try it with sample data</a><span>Opens a saved deploy record.</span></div>',
    '<ul class="facts"><li>Capture only commands you choose.</li><li>Search encrypted local records.</li><li>Free. No account needed.</li></ul></div>',
    '<img class="hero-art" src="/hero-terminal-recall.webp" width="1200" height="800" fetchpriority="high" alt="A tactile collage of terminal strips, search marks, and redacted lines." /></section>',
    '<section class="recording-section" aria-labelledby="proof-heading"><p class="eyebrow">REAL COMMAND OUTPUT</p><h2 id="proof-heading">See the command line tool run</h2><p>The recording uses the bundled deploy sample. Its generated file is checked against the compiled CLI in every test run.</p>', recordingPanel(), '</section>',
    product(),
    '<section class="steps"><p class="eyebrow">HOW TO SAVE AND FIND OUTPUT</p><h2>Keep the command result you need</h2><ol>',
    '<li><b>Run a chosen command</b><code>terminal-recall run -- your-command</code></li>',
    '<li><b>Search saved records</b><code>terminal-recall search "error code"</code></li>',
    '<li><b>Export a redacted excerpt</b><code>terminal-recall export ID --output excerpt.txt</code></li></ol></section>',
    '<section class="privacy-note"><h2>It does not watch your terminal</h2><p>You start each capture. Records stay on this device. Export removes common keys, tokens, passwords, and bearer tokens.</p></section>',
    '<section class="install" id="install"><p class="eyebrow">INSTALL</p><h2>Install the command line tool</h2>',
    '<p id="download-state" aria-live="polite">Checking for a download for your computer.</p>',
    '<pre><code>curl -fsSL https://terminal-recall.sociobot.in/install.sh | sh\nterminal-recall demo</code></pre>',
    '<p><a href="/install.sh">POSIX installer</a> · <a href="/install.ps1">PowerShell installer</a> · <a href="https://github.com/B-Divyesh/sf-terminal-recall/releases" target="_blank" rel="noreferrer">Release files ↗</a></p></section></main>',
  );
}

function demoPage() {
  return page(
    '<main id="main"><section class="demo-page"><p class="eyebrow">ISOLATED SAMPLE</p><h1 tabindex="-1">Search the sample deploy record</h1>',
    '<p class="lead">This example uses separate demo data and never changes your saved records.</p>',
    recordingPanel(), product(),
    '<p><a class="button demo-back" href="/" data-route>Start for real</a></p></section></main>',
  );
}

function legal(kind: 'privacy' | 'terms') {
  const privacy = kind === 'privacy';
  return page(
    '<main id="main" class="legal"><h1 tabindex="-1">', privacy ? 'Privacy for local terminal records' : 'Terms for Terminal Recall', '</h1>',
    '<p>', privacy ? 'Terminal Recall saves records on your device. The site has no analytics. Captured output is never sent by the CLI.' : 'Terminal Recall is local software supplied as-is under the MIT License.', '</p>',
    '<h2>', privacy ? 'What stays local' : 'Your responsibility', '</h2><p>', privacy ? 'The command line tool creates encrypted records and a local key. Delete any record with the command line tool.' : 'Review every exported excerpt before sharing it. Pattern redaction cannot detect every secret.', '</p>',
    '<h2>', privacy ? 'No account required' : 'License', '</h2><p>', privacy ? 'The local command line tool works without an account or payment.' : 'Terminal Recall is distributed under the MIT License.', '</p></main>',
  );
}

function notFound() {
  return '<main id="main" class="not-found"><p class="eyebrow">PAGE NOT FOUND</p><h1 tabindex="-1">This record is not here</h1><p>Return home and start with the sample record.</p><a class="button primary" href="/" data-route>Return home</a></main>';
}

async function releaseLink() {
  const node = document.querySelector<HTMLElement>('#download-state');
  if (!node) return;
  try {
    const cached = JSON.parse(localStorage.getItem('terminal-recall:release') || 'null') as { checked: number; release: Release } | null;
    const release = cached && Date.now() - cached.checked < 3_600_000
      ? cached.release
      : await fetch('https://api.github.com/repos/B-Divyesh/sf-terminal-recall/releases/latest').then(async response => {
        if (!response.ok) throw new Error('No release is available');
        return response.json() as Promise<Release>;
      });
    if (!cached || release !== cached.release) localStorage.setItem('terminal-recall:release', JSON.stringify({ checked: Date.now(), release }));
    const currentPlatform = /Win/.test(navigator.platform) ? 'windows' : /Mac/.test(navigator.platform) ? 'macos' : 'linux';
    const asset = release.assets.find(item => item.name.includes(currentPlatform) && /\.(zip|tar\.gz)$/.test(item.name));
    if (!asset) throw new Error('No matching asset is available');
    node.innerHTML = `Download for ${currentPlatform}: <a href="${escapeHtml(asset.browser_download_url)}">${escapeHtml(asset.name)}</a>.`;
  } catch {
    node.innerHTML = 'Downloads are being published. <a href="https://github.com/B-Divyesh/sf-terminal-recall/releases">Open the release files ↗</a>';
  }
}

function render() {
  demo = isDemoLocation();
  updateMetadata();
  ensureDemoStorage();
  const content = demo ? demoPage() : location.pathname === '/' ? landing() : location.pathname === '/privacy' || location.pathname === '/terms' ? legal(location.pathname.slice(1) as 'privacy' | 'terms') : notFound();
  app.innerHTML = head() + demoStrip() + content + foot();
  bind();
  if (location.pathname === '/' && !demo) void releaseLink();
}

function bind() {
  document.querySelectorAll<HTMLAnchorElement>('[data-route]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      route(anchor.href);
    });
  });
  document.querySelector<HTMLInputElement>('#search')?.addEventListener('input', event => {
    query = (event.target as HTMLInputElement).value;
    render();
    document.querySelector<HTMLInputElement>('#search')?.focus();
  });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    clearDemoStorage();
    query = '';
    ensureDemoStorage();
    render();
    document.querySelector<HTMLInputElement>('#search')?.focus();
  });
  document.querySelector('[data-real]')?.addEventListener('click', () => route('/'));
  document.querySelector('[data-export]')?.addEventListener('click', () => {
    const blob = new Blob([sample.lines.map(redacted).join('\n')], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'terminal-recall-excerpt.txt';
    link.click();
    URL.revokeObjectURL(link.href);
  });
}

window.addEventListener('popstate', () => {
  const wasDemo = demo;
  demo = isDemoLocation();
  if (wasDemo && !demo) clearDemoStorage();
  query = '';
  render();
  afterRouteChange();
});

render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
