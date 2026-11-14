import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {packageExtension} from '../scripts/package.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = relativePath => readFileSync(new URL(relativePath, import.meta.url), 'utf8');
const manifest = JSON.parse(read('../extension/manifest.json'));

function pngSize(bytes) {
  assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bytes.subarray(12, 16).toString('ascii'), 'IHDR');
  return {width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20), colorType: bytes[25]};
}

test('the distributed manifest asks for site access only when a concrete host is needed', () => {
  assert.equal(manifest.host_permissions, undefined);
  assert.deepEqual(manifest.optional_host_permissions, ['http://*/*', 'https://*/*']);
  assert.deepEqual([...manifest.permissions].sort(), ['activeTab', 'alarms', 'downloads', 'scripting', 'storage']);
  assert.equal(manifest.default_locale, 'ja');
  assert.equal(manifest.name, '__MSG_extName__');
  for (const locale of ['ja', 'en']) {
    const messages = JSON.parse(read(`../extension/_locales/${locale}/messages.json`));
    assert.equal(messages.extName.message, 'ImageCrate');
    assert.ok(messages.extDescription.message.length <= 132);
  }
});

test('recording leftovers and install-time all-sites claims stay out of the extension and the readmes', () => {
  const background = read('../extension/background.js');
  const workspace = read('../extension/workspace.js');
  const preview = read('../extension/preview-loader.js');
  assert.equal(/tabCapture|captureLock/.test(background + workspace + preview), false);
  assert.equal(/permissions\.request\(\s*\{[^}]*https?:\/\/\*\/\*/.test(workspace + preview), false);
  assert.equal(read('../README.md').includes('インストール時にChromeが一度だけ'), false);
  assert.equal(read('../README_EN.md').includes('granted once upon installation'), false);
  assert.match(read('../README.md'), /optional_host_permissions/);
  assert.match(read('../README_EN.md'), /No install-time access to every site/);
});

test('the store privacy policy matches on-device processing and the published contact', () => {
  const policy = read('../docs/PRIVACY_POLICY.md');
  assert.match(policy, /deeple\+imagecratestaff@inkboxmail\.com/);
  assert.match(policy, /開発者へ送ることはありません/);
  assert.match(policy, /does not send them to the developer/);
  assert.match(policy, /Chrome Web Store User Data Policy/);
  assert.match(policy, /参照元（Referer）は付けません/);
  assert.equal(policy.includes('host_permissions'), false);
});

test('store images use the exact dashboard sizes', async () => {
  const expected = {
    '../store/screenshots/01-choose-images.png': [1280, 800],
    '../store/screenshots/02-inspect-image.png': [1280, 800],
    '../store/screenshots/03-save-settings.png': [1280, 800],
    '../store/screenshots/04-site-permission.png': [1280, 800],
    '../store/promo-small-440x280.png': [440, 280],
    '../store/icon-128.png': [128, 128],
  };
  for (const [relativePath, [width, height]] of Object.entries(expected)) {
    const size = pngSize(await readFile(new URL(relativePath, import.meta.url)));
    assert.deepEqual([size.width, size.height], [width, height], relativePath);
    if (relativePath.endsWith('icon-128.png')) {
      assert.equal(size.colorType, 6, 'store icon keeps an alpha channel');
      const alpha = pngAlpha(await readFile(new URL(relativePath, import.meta.url)));
      assert.equal(alpha(0, 0), 0, 'store icon padding is transparent');
      assert.ok(alpha(64, 64) > 200, 'store icon artwork is opaque near the center');
    }
  }
});

function pngAlpha(bytes) {
  const chunks = [];
  let offset = 8;
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString('ascii');
    if (type === 'IDAT') chunks.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += 12 + length;
    if (type === 'IEND') break;
  }
  const inflated = inflateSync(Buffer.concat(chunks));
  const width = 128;
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  let cursor = 0;
  let previous;
  const rows = [];
  for (let y = 0; y < 128; y += 1) {
    const filter = inflated[cursor];
    const scanline = inflated.subarray(cursor + 1, cursor + 1 + stride);
    const row = Buffer.alloc(stride);
    for (let index = 0; index < stride; index += 1) {
      const left = index >= bytesPerPixel ? row[index - bytesPerPixel] : 0;
      const up = previous ? previous[index] : 0;
      const upLeft = index >= bytesPerPixel && previous ? previous[index - bytesPerPixel] : 0;
      let value = scanline[index];
      if (filter === 1) value += left;
      else if (filter === 2) value += up;
      else if (filter === 3) value += Math.floor((left + up) / 2);
      else if (filter === 4) {
        const estimate = left + up - upLeft;
        const distanceLeft = Math.abs(estimate - left);
        const distanceUp = Math.abs(estimate - up);
        const distanceUpLeft = Math.abs(estimate - upLeft);
        value += distanceLeft <= distanceUp && distanceLeft <= distanceUpLeft ? left : distanceUp <= distanceUpLeft ? up : upLeft;
      }
      row[index] = value & 255;
    }
    rows.push(row);
    previous = row;
    cursor += stride + 1;
  }
  return (x, y) => rows[y][x * bytesPerPixel + 3];
}

test('the package zip contains the extension root and no personal data', async () => {
  const result = await packageExtension({root});
  assert.match(result.zipPath, /imagecrate-0\.1\.0\.zip$/);
  assert.ok(result.fileCount > 10);
});
