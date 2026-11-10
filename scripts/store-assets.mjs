// Builds store images from a temporary extension copy and synthetic local pages.
// The copy may grant the fixture origin. The distributed manifest is not edited.
import {mkdtemp, cp, readFile, writeFile, mkdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';

const {chromium} = await import('playwright');
const repo = fileURLToPath(new URL('../', import.meta.url));
const store = join(repo, 'store');
const shots = join(store, 'screenshots');
const scratch = await mkdtemp(join(tmpdir(), 'imagecrate-store-assets-'));
const extension = join(scratch, 'extension');
const profile = join(scratch, 'profile');
await cp(join(repo, 'extension'), extension, {recursive: true});
await mkdir(profile, {recursive: true});
await mkdir(shots, {recursive: true});
const manifestPath = join(extension, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
manifest.host_permissions = ['http://127.0.0.1/*'];
await writeFile(manifestPath, JSON.stringify(manifest));
const workerPath = join(extension, 'background.js');
await writeFile(workerPath, `${await readFile(workerPath, 'utf8')}\nglobalThis.__openWorkspace=openWorkspace;\n`);

const arts = {
  'red.svg': [
    {x: 0, y: 0, w: 640, h: 480, fill: '#e7b89a'},
    {x: 0, y: 300, w: 640, h: 180, fill: '#8d3d3d'},
    {x: 250, y: 70, w: 110, h: 110, fill: '#f6e27a'},
  ],
  'blue.svg': [
    {x: 0, y: 0, w: 640, h: 480, fill: '#8eb4e8'},
    {x: 0, y: 280, w: 640, h: 200, fill: '#243e86'},
    {x: 70, y: 80, w: 180, h: 120, fill: '#f7fbff'},
  ],
  'green.svg': [
    {x: 0, y: 0, w: 640, h: 480, fill: '#d7efc8'},
    {x: 40, y: 160, w: 220, h: 260, fill: '#2f7d4a'},
    {x: 300, y: 90, w: 280, h: 330, fill: '#67a85a'},
  ],
  'gold.svg': [
    {x: 0, y: 0, w: 640, h: 480, fill: '#f3d48a'},
    {x: 0, y: 0, w: 180, h: 480, fill: '#c9842a'},
    {x: 230, y: 70, w: 340, h: 220, fill: '#fff6d8'},
  ],
  'violet.svg': [
    {x: 0, y: 0, w: 640, h: 480, fill: '#d9d0f5'},
    {x: 80, y: 60, w: 480, h: 150, fill: '#6d57c8'},
    {x: 80, y: 250, w: 480, h: 150, fill: '#3d2f86'},
  ],
  'teal.svg': [
    {x: 0, y: 0, w: 640, h: 480, fill: '#d5f2f4'},
    {x: 0, y: 320, w: 640, h: 160, fill: '#147a86'},
    {x: 360, y: 50, w: 160, h: 160, fill: '#f4b942'},
  ],
};
const svg = (name) => {
  const rects = arts[name].map(shape => `<rect x="${shape.x}" y="${shape.y}" width="${shape.w}" height="${shape.h}" fill="${shape.fill}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">${rects}</svg>`;
};
const cards = Object.keys(arts).map(name => `<img src="/art/${name}" alt="合成図形" width="640" height="480">`).join('');
const pageFor = (body) => `<!doctype html><html lang="ja"><meta charset="utf-8"><title>合成サンプル</title><body>${body}</body></html>`;

const serverModule = await import('node:http');
const server = serverModule.createServer((request, response) => {
  const url = new URL(request.url, 'http://127.0.0.1');
  const art = url.pathname.startsWith('/art/') ? url.pathname.slice('/art/'.length) : '';
  if (arts[art]) {
    response.setHeader('Content-Type', 'image/svg+xml');
    response.end(svg(art));
    return;
  }
  response.setHeader('Content-Type', 'text/html; charset=utf-8');
  if (url.pathname === '/cross') {
    const host = `http://localhost:${server.address().port}`;
    const remote = Object.keys(arts).slice(0, 4).map(name => `<img src="${host}/art/${name}" alt="別の配信元の図形" width="640" height="480">`).join('');
    response.end(pageFor(remote));
    return;
  }
  response.end(pageFor(cards));
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;

function pngSize(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR');
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20)};
}

let context;
try {
  context = await chromium.launchPersistentContext(profile, {
    channel: process.env.CHROME_CHANNEL || 'chrome',
    headless: true,
    chromiumSandbox: true,
    viewport: {width: 1280, height: 800},
    deviceScaleFactor: 1,
    ignoreDefaultArgs: ['--disable-extensions'],
    args: ['--enable-unsafe-extension-debugging', '--hide-scrollbars', '--no-first-run'],
  });
  const browserSession = await context.browser().newBrowserCDPSession();
  const {id} = await browserSession.send('Extensions.loadUnpacked', {path: extension});
  let worker = context.serviceWorkers().find(item => item.url().includes(id));
  if (!worker) worker = await context.waitForEvent('serviceworker', {predicate: item => item.url().includes(id)});
  const source = await context.newPage();
  await source.goto(origin);
  const tab = await worker.evaluate(async pageUrl => (await chrome.tabs.query({})).find(item => item.url === pageUrl), source.url());
  const [manager] = await Promise.all([
    context.waitForEvent('page'),
    worker.evaluate(sourceTab => globalThis.__openWorkspace(sourceTab), tab),
  ]);
  await manager.setViewportSize({width: 1280, height: 800});
  await manager.waitForFunction(() => document.querySelector('#message')?.textContent.includes('候補を取得'));
  await manager.waitForFunction(() => [...document.querySelectorAll('.thumb img')].filter(image => image.complete && image.naturalWidth > 0).length >= 4);
  await manager.locator('.image-select').nth(0).check();
  await manager.locator('.image-select').nth(2).check();
  await manager.evaluate(() => document.activeElement instanceof HTMLElement && document.activeElement.blur());
  await manager.mouse.move(24, 24);
  await manager.screenshot({path: join(shots, '01-choose-images.png'), animations: 'disabled'});
  await manager.locator('.preview-open').first().click();
  await manager.waitForFunction(() => {
    const image = document.querySelector('#preview-stage img');
    return image?.complete && image.naturalWidth > 0;
  });
  await manager.screenshot({path: join(shots, '02-inspect-image.png'), animations: 'disabled'});
  await manager.locator('#preview-close').click();
  await manager.locator('#destination-change').click();
  await manager.waitForSelector('#save-settings[open]');
  await manager.screenshot({path: join(shots, '03-save-settings.png'), animations: 'disabled'});

  const cross = await context.newPage();
  await cross.setViewportSize({width: 1280, height: 800});
  await cross.goto(`${origin}/cross`);
  const crossTab = await worker.evaluate(async pageUrl => (await chrome.tabs.query({})).find(item => item.url === pageUrl), cross.url());
  const [permissionPage] = await Promise.all([
    context.waitForEvent('page'),
    worker.evaluate(sourceTab => globalThis.__openWorkspace(sourceTab), crossTab),
  ]);
  await permissionPage.setViewportSize({width: 1280, height: 800});
  await permissionPage.waitForFunction(() => document.querySelector('#preview-access:not([hidden]) .preview-access-grant'));
  await permissionPage.screenshot({path: join(shots, '04-site-permission.png'), animations: 'disabled'});

  const iconBytes = (await readFile(join(repo, 'extension/icons/icon-128.png'))).toString('base64');
  const iconPage = await context.newPage();
  await iconPage.setViewportSize({width: 128, height: 128});
  await iconPage.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:128px;height:128px;overflow:hidden;background:transparent}canvas{display:block}</style><canvas id="icon" width="128" height="128"></canvas>`);
  const iconStats = await iconPage.evaluate(async encoded => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const probe = document.createElement('canvas');
    probe.width = image.naturalWidth;
    probe.height = image.naturalHeight;
    const probeContext = probe.getContext('2d');
    probeContext.drawImage(image, 0, 0);
    const pixels = probeContext.getImageData(0, 0, probe.width, probe.height).data;
    let minX = probe.width; let minY = probe.height; let maxX = 0; let maxY = 0;
    for (let y = 0; y < probe.height; y += 1) {
      for (let x = 0; x < probe.width; x += 1) {
        if (pixels[(y * probe.width + x) * 4 + 3] > 8) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    const boundsWidth = maxX - minX + 1;
    const boundsHeight = maxY - minY + 1;
    const scale = 96 / Math.max(boundsWidth, boundsHeight);
    const drawWidth = boundsWidth * scale;
    const drawHeight = boundsHeight * scale;
    const canvas = document.querySelector('#icon');
    const context2d = canvas.getContext('2d');
    context2d.clearRect(0, 0, 128, 128);
    context2d.drawImage(image, minX, minY, boundsWidth, boundsHeight, (128 - drawWidth) / 2, (128 - drawHeight) / 2, drawWidth, drawHeight);
    const corner = context2d.getImageData(0, 0, 1, 1).data;
    const center = context2d.getImageData(64, 64, 1, 1).data;
    return {cornerAlpha: corner[3], centerAlpha: center[3], drawWidth, drawHeight};
  }, iconBytes);
  assert.equal(iconStats.cornerAlpha, 0, 'store icon padding is transparent');
  assert.ok(iconStats.centerAlpha > 200, 'store icon artwork is visible');
  assert.ok(Math.abs(iconStats.drawWidth - 96) < 1 || Math.abs(iconStats.drawHeight - 96) < 1);
  await iconPage.screenshot({path: join(store, 'icon-128.png'), omitBackground: true, animations: 'disabled'});

  const promo = await context.newPage();
  await promo.setViewportSize({width: 440, height: 280});
  await promo.setContent(`<!doctype html><meta charset="utf-8"><style>
    html,body{margin:0;width:440px;height:280px;overflow:hidden}
    body{background:linear-gradient(145deg,#2a1d78 0%,#5a46d6 48%,#147a86 100%)}
    img{position:absolute;left:120px;top:40px;width:200px;height:200px;filter:drop-shadow(0 16px 24px rgba(12,8,40,.45))}
  </style><img alt="" src="data:image/png;base64,${iconBytes}">`);
  await promo.screenshot({path: join(store, 'promo-small-440x280.png'), animations: 'disabled'});

  const expected = {
    [join(shots, '01-choose-images.png')]: [1280, 800],
    [join(shots, '02-inspect-image.png')]: [1280, 800],
    [join(shots, '03-save-settings.png')]: [1280, 800],
    [join(shots, '04-site-permission.png')]: [1280, 800],
    [join(store, 'promo-small-440x280.png')]: [440, 280],
    [join(store, 'icon-128.png')]: [128, 128],
  };
  for (const [file, [width, height]] of Object.entries(expected)) {
    const size = pngSize(await readFile(file));
    assert.deepEqual([size.width, size.height], [width, height], file);
  }
  console.log('Store images written with exact dimensions.');
} finally {
  await context?.close();
  await new Promise(resolve => server.close(resolve));
  await rm(scratch, {recursive: true, force: true});
}
