import './style.css';
import './repair.css';

type Record = { id: string; label: string; command: string; captured: string; lines: string[] };
type ReleaseAsset = { name: string; browser_download_url: string };
type Release = { assets: ReleaseAsset[] };

const sample: Record = {
  id: 'demo-deploy-042',
  label: 'Deploy smoke test',
  command: './deploy-check --region fra1',
  captured: '2026-08-28 14:32 UTC',
  lines: ['checking api… ok', 'reading deployment plan', 'API_KEY=sk_demo_0123456789abcdefghijklmnop', 'migrations: 12 applied', 'health check: 200 OK', 'deploy finished'],
};
const demoKey = 'demo:terminal-recall:logs';
const app = document.querySelector<HTMLDivElement>('#app')!;
let demo = location.pathname === '/demo' || new URLSearchParams(location.search).has('demo');
let query = '';

const redacted = (value: string) => value.replace(/(?:(?:API[_-]?KEY|TOKEN|PASSWORD|SECRET)\s*[=:]\s*\S+|\b(?:sk|ghp)_[\w-]{12,}\b|Bearer\s+[\w.-]{12,})/gi, '[REDACTED]');
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]!);
const page = (...parts: string[]) => parts.join('');

function ensureDemoStorage() { if (demo) localStorage.setItem(demoKey, JSON.stringify(sample)); }
function leaveDemo() { localStorage.removeItem(demoKey); }

function platform(): 'windows' | 'macos' | 'linux' {
  if (/Win/.test(navigator.platform)) return 'windows';
  if (/Mac/.test(navigator.platform)) return 'macos';
  return 'linux';
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
    const currentPlatform = platform();
    const asset = release.assets.find(item => item.name.includes(currentPlatform) && /\.(zip|tar\.gz)$/.test(item.name));
    if (!asset) throw new Error('No matching asset is available');
    node.innerHTML = 'Download for ' + currentPlatform + ': <a href="' + escapeHtml(asset.browser_download_url) + '">' + escapeHtml(asset.name) + '</a>. Checksum is in the release.';
  } catch {
    node.textContent = 'Downloads are being published. Use the source build while release files arrive.';
  }
}

function route(to: string) {
  if (demo && to !== '/demo') leaveDemo();
  history.pushState({}, '', to);
  demo = to === '/demo';
  query = '';
  render();
  requestAnimationFrame(() => document.querySelector<HTMLElement>('h1')?.focus());
}

function head() {
  return page('<a class="skip" href="#main">Skip to content</a><header><a class="brand" href="/" data-route>Terminal <i>Recall</i></a><nav aria-label="Main navigation"><a href="/demo" data-route>Demo</a><a href="/#install">Install</a><a href="/privacy" data-route>Privacy</a></nav></header><div class="route-status" aria-live="polite">', document.title, '</div>');
}
function foot() {
  return '<footer><p>Selected terminal output, kept close.</p><p><a href="/privacy" data-route>Privacy</a> · <a href="/terms" data-route>Terms</a> · Built by Param Factory · v0.1.3</p></footer>';
}
function demoStrip() {
  return demo ? '<aside class="demo-banner"><strong>Demo — sample data, nothing is saved</strong><span><button data-reset>Reset demo</button><button data-real>Start for real</button></span></aside>' : '';
}
function product() {
  const lines = sample.lines.map((line, index) => '<code class="' + (query && line.toLowerCase().includes(query.toLowerCase()) ? 'match' : '') + '"><span>' + String(index + 1).padStart(2, ' ') + '</span>' + escapeHtml(line) + '</code>').join('');
  const matching = sample.lines.filter(item => item.toLowerCase().includes(query.toLowerCase())).length + ' matching lines';
  return page('<section class="recall" aria-labelledby="recall-heading"><div class="paper-tab">SAVED OUTPUT</div><div class="recall-head"><div><h2 id="recall-heading">Search a captured session</h2><p>Demo records use a separate local storage key.</p></div><label class="search">Find in record<input id="search" value="', escapeHtml(query), '" placeholder="Try: health check" /></label></div><div class="record-layout"><aside class="record-list" aria-label="Saved records"><button class="record selected"><b>Deploy smoke test</b><span>2026-08-28 14:32 UTC</span></button></aside><div class="terminal"><div class="terminal-bar"><span>● ● ●</span><code>', sample.command, '</code></div><pre tabindex="0" aria-label="Captured terminal output. Use arrow keys to read the scrollable output.">', lines, '</pre><div class="terminal-foot"><span>', query ? matching : '6 saved lines', '</span><button data-export>Export redacted excerpt</button></div></div></div></section>');
}
function landing() {
  return page('<main id="main"><section class="hero"><div class="hero-copy"><p class="eyebrow">LOCAL EVIDENCE LAYER</p><h1 tabindex="-1">Find terminal output after it disappears</h1><p class="lead">For developers who need a command result after the session ends.</p><div class="actions"><a class="button primary" href="/demo" data-route>Try it with sample data</a><span>Opens a saved deploy record.</span></div><ul class="facts"><li>Capture commands on purpose.</li><li>Search encrypted local records.</li><li>Free local core.</li></ul></div><img class="hero-art" src="/hero-terminal-recall.webp" width="1200" height="800" fetchpriority="high" alt="A tactile collage of terminal strips, search marks, and redacted lines." /></section>', product(), '<section class="steps"><p class="eyebrow">THREE SMALL STEPS</p><h2>Keep the command result you need</h2><ol><li><b>Run</b><code>terminal-recall run -- your-command</code></li><li><b>Search</b><code>terminal-recall search "error code"</code></li><li><b>Export</b><code>terminal-recall export ID --output excerpt.txt</code></li></ol></section><section class="privacy-note"><h2>It does not watch your terminal</h2><p>You start each capture. Records stay on this device. Exported excerpts replace common keys and tokens.</p></section><section class="install" id="install"><p class="eyebrow">INSTALL</p><h2>Install the command line tool</h2><p id="download-state" aria-live="polite">Checking for a download for your computer.</p><pre><code>curl -fsSL https://terminal-recall.sociobot.in/install.sh | sh\nterminal-recall demo</code></pre><p><a href="/install.sh">POSIX installer</a> · <a href="/install.ps1">PowerShell installer</a> · <a href="https://github.com/B-Divyesh/sf-terminal-recall/releases" target="_blank" rel="noreferrer">Release page ↗</a></p></section></main>');
}
function demoPage() {
  return page('<main id="main"><section class="demo-page"><p class="eyebrow">SANDBOX</p><h1 tabindex="-1">Search the sample deploy record</h1><p class="lead">This isolated example never reaches your records.</p>', product(), '<p><a class="button demo-back" href="/" data-route>← Back to Terminal Recall</a></p></section></main>');
}
function legal(kind: string) {
  const privacy = kind === 'privacy';
  return page('<main id="main" class="legal"><h1 tabindex="-1">', privacy ? 'Privacy for local terminal records' : 'Terms for Terminal Recall', '</h1><p>', privacy ? 'Terminal Recall stores records on your device. The site has no analytics and sends no captured output anywhere.' : 'Terminal Recall is local software supplied as-is under the MIT License.', '</p><h2>', privacy ? 'What stays local' : 'Your responsibility', '</h2><p>', privacy ? 'The command line tool creates an AES-256-GCM encrypted record store and a local key. Delete records with the command line tool.' : 'Review every exported excerpt before sharing it. Pattern redaction cannot detect every secret.', '</p><h2>', privacy ? 'No paid account required' : 'License', '</h2><p>', privacy ? 'The free local core does not require an account, payment, or third-party analytics.' : 'Terminal Recall is distributed under the MIT License.', '</p></main>');
}
function notFound() {
  return '<main id="main" class="not-found"><p class="eyebrow">MISFILED PAGE</p><h1 tabindex="-1">This record is not here</h1><p>Return home and start with a sample record.</p><a class="button primary" href="/" data-route>Return home</a></main>';
}
function render() {
  const path = location.pathname;
  document.title = path === '/demo' ? 'Demo — Terminal Recall' : path === '/privacy' ? 'Privacy — Terminal Recall' : path === '/terms' ? 'Terms — Terminal Recall' : 'Terminal Recall — save terminal output';
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', 'https://terminal-recall.sociobot.in' + path);
  ensureDemoStorage();
  const content = path === '/' ? landing() : path === '/demo' ? demoPage() : path === '/privacy' || path === '/terms' ? legal(path.slice(1)) : notFound();
  app.innerHTML = head() + demoStrip() + content + foot();
  bind();
  if (path === '/') void releaseLink();
}
function bind() {
  document.querySelectorAll<HTMLElement>('[data-route]').forEach(anchor => {
    anchor.onclick = event => {
      const href = anchor.getAttribute('href')!;
      if (href.startsWith('/')) {
        event.preventDefault();
        route(href);
      }
    };
  });
  document.querySelector<HTMLInputElement>('#search')?.addEventListener('input', event => {
    query = (event.target as HTMLInputElement).value;
    render();
    document.querySelector<HTMLInputElement>('#search')?.focus();
  });
  document.querySelector('[data-reset]')?.addEventListener('click', () => {
    localStorage.removeItem(demoKey);
    query = '';
    render();
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
  demo = location.pathname === '/demo';
  render();
});
render();
if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
