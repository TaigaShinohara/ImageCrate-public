import {mkdir,readFile,readdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {ZipArchive} from '../extension/zip-writer.js';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const textExtensions = new Set(['.js', '.html', '.css', '.json', '.svg', '.txt', '.md']);
const forbiddenText = [
  {name: 'email address', re: /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/},
  {name: 'private key', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/},
  {name: 'GitHub token', re: /ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/},
  {name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/},
  {name: 'Slack token', re: /xox[baprs]-[A-Za-z0-9-]{10,}/},
  {name: 'live secret key', re: /sk_live_[A-Za-z0-9]{10,}/},
  {name: 'Google API key', re: /AIza[0-9A-Za-z\-_]{35}/},
  {name: 'personal name', re: /TaigaShinohara|Taiga Shinohara/},
];

async function extensionFiles(base) {
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, {withFileTypes: true})) {
      if (entry.name === '.DS_Store' || entry.name === 'Thumbs.db') continue;
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.isFile()) files.push(full.slice(base.length + 1).split(path.sep).join('/'));
      else throw new Error(`Unexpected file type in extension/: ${full}`);
    }
  }
  await walk(base);
  files.sort();
  return files;
}

function manifestReferences(manifest) {
  const paths = new Set(['manifest.json', manifest.background?.service_worker]);
  for (const icon of Object.values(manifest.icons || {})) paths.add(icon);
  for (const icon of Object.values(manifest.action?.default_icon || {})) paths.add(icon);
  if (manifest.default_locale) paths.add(`_locales/${manifest.default_locale}/messages.json`);
  if ([...paths].some(item => !item)) throw new Error('Manifest is missing a referenced file name');
  return paths;
}

function readStoredZip(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let end = -1;
  const earliest = Math.max(0, bytes.length - 22 - 65535);
  for (let index = bytes.length - 22; index >= earliest; index -= 1) {
    if (view.getUint32(index, true) === 0x06054b50) { end = index; break; }
  }
  if (end < 0) throw new Error('The zip has no end record');
  const count = view.getUint16(end + 10, true);
  let cursor = view.getUint32(end + 16, true);
  const files = new Map();
  for (let index = 0; index < count; index += 1) {
    if (view.getUint32(cursor, true) !== 0x02014b50) throw new Error('The zip directory is invalid');
    const method = view.getUint16(cursor + 10, true);
    const size = view.getUint32(cursor + 20, true);
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const localOffset = view.getUint32(cursor + 42, true);
    const name = new TextDecoder().decode(bytes.subarray(cursor + 46, cursor + 46 + nameLength));
    if (method !== 0) throw new Error(`Zip entry is compressed: ${name}`);
    if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error(`Zip local header is invalid: ${name}`);
    const localNameLength = view.getUint16(localOffset + 26, true);
    const localExtraLength = view.getUint16(localOffset + 28, true);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    files.set(name, bytes.subarray(start, start + size));
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return files;
}

function sameBytes(left, right) {
  if (left.byteLength !== right.byteLength) return false;
  for (let index = 0; index < left.byteLength; index += 1) if (left[index] !== right[index]) return false;
  return true;
}

function assertClean(name, bytes) {
  const extension = path.posix.extname(name);
  const samples = [Buffer.from(bytes).toString('latin1')];
  if (textExtensions.has(extension)) samples.push(new TextDecoder('utf8', {fatal: false}).decode(bytes));
  for (const sample of samples) {
    for (const rule of forbiddenText) {
      if (rule.re.test(sample)) throw new Error(`Package file ${name} contains a ${rule.name}`);
    }
  }
}

export async function packageExtension({root = repoRoot} = {}) {
  const sourceRoot = path.join(root, 'extension');
  const manifest = JSON.parse(await readFile(path.join(sourceRoot, 'manifest.json'), 'utf8'));
  if (manifest.host_permissions) throw new Error('Refusing to package required host_permissions');
  const names = await extensionFiles(sourceRoot);
  const archive = new ZipArchive();
  const expected = new Map();
  for (const name of names) {
    if (name.startsWith('/') || name.split('/').includes('..')) throw new Error(`Unsafe package path: ${name}`);
    const bytes = new Uint8Array(await readFile(path.join(sourceRoot, name)));
    expected.set(name, bytes);
    await archive.addFile(name, bytes);
  }
  const zipped = new Uint8Array(await archive.generate().arrayBuffer());
  const extracted = readStoredZip(zipped);
  if (extracted.size !== expected.size) throw new Error(`Zip has ${extracted.size} files; extension/ has ${expected.size}`);
  for (const [name, bytes] of expected) {
    const unpacked = extracted.get(name);
    if (!unpacked) throw new Error(`Zip is missing ${name}`);
    if (!sameBytes(bytes, unpacked)) throw new Error(`Zip bytes differ for ${name}`);
    assertClean(name, unpacked);
  }
  for (const referenced of manifestReferences(manifest)) {
    if (!extracted.has(referenced)) throw new Error(`Manifest reference is missing from the zip: ${referenced}`);
  }
  const packedManifest = JSON.parse(new TextDecoder().decode(extracted.get('manifest.json')));
  if (packedManifest.host_permissions) throw new Error('Packaged manifest still has required host permissions');
  const outputDirectory = path.join(root, 'dist');
  await mkdir(outputDirectory, {recursive: true});
  const zipPath = path.join(outputDirectory, `imagecrate-${manifest.version}.zip`);
  await writeFile(zipPath, zipped);
  return {zipPath, fileCount: extracted.size, version: manifest.version};
}

const entry = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : '';
if (import.meta.url === entry) {
  packageExtension().then(result => {
    console.log(`Wrote ${result.zipPath} (${result.fileCount} files at the archive root)`);
  }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
