import {readFile,readdir} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url);
const manifest=JSON.parse(await readFile(new URL('extension/manifest.json',root),'utf8'));
assert.equal(manifest.manifest_version,3);
assert.equal(manifest.background.type,'module');
assert.match(manifest.content_security_policy.extension_pages,/(?:^|;)\s*img-src 'self' blob:(?:;|$)/,'Original remote/data images cannot reach a page Image element');
assert.ok(!manifest.content_scripts && !manifest.externally_connectable);
assert.equal(manifest.host_permissions, undefined, 'Required all-sites host access is not part of the distributed manifest');
assert.deepEqual(manifest.optional_host_permissions, ['http://*/*','https://*/*'], 'Specific image hosts are requested only when a preview or managed save needs them');
assert.equal(manifest.default_locale, 'ja');
assert.equal(manifest.name, '__MSG_extName__');
assert.equal(manifest.description, '__MSG_extDescription__');
assert.equal(manifest.action.default_title, '__MSG_actionTitle__');
assert.ok(manifest.description.length <= 132);
for (const locale of ['ja','en']) {
  const messages=JSON.parse(await readFile(new URL(`extension/_locales/${locale}/messages.json`,root),'utf8'));
  for (const key of ['extName','extDescription','actionTitle']) {
    assert.equal(typeof messages[key]?.message, 'string', `${locale} ${key}`);
    assert.ok(messages[key].message.length > 0 && messages[key].message.length <= 132, `${locale} ${key}`);
  }
  assert.equal(messages.extName.message, 'ImageCrate');
}
assert.ok(!manifest.permissions.some(x=>['debugger','webRequest','history','cookies','tabs','tabCapture'].includes(x)));
assert.deepEqual([...manifest.permissions].sort(),['activeTab','scripting','downloads','storage','alarms'].sort(),'Only the internal recovery alarm supplements temporary page access');
const html=await readFile(new URL('extension/workspace.html',root),'utf8');
assert.ok(!/<script[^>]*>\s*[^<\s]/i.test(html),'Inline scripts are forbidden');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g)) assert.ok(!/^https?:/i.test(m[1]),'No remote executable UI assets');
for(const name of await readdir(new URL('extension/',root))) {
  if(!name.endsWith('.js'))continue;
  const path=new URL(`extension/${name}`,root);
  const result=spawnSync(process.execPath,['--check',path.pathname],{encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
  const source=await readFile(path,'utf8');
  for(const m of source.matchAll(/from\s+['"](\.\/[^'"]+)['"]/g)) await readFile(new URL(m[1],path));
}
for(const path of ['workspace.html','workspace.css',manifest.background.service_worker]) await readFile(new URL('extension/'+path,root));
const bgSource = await readFile(new URL('extension/' + manifest.background.service_worker, root), 'utf8');
assert.ok(!/chrome\.downloads\.(?:onChanged|onCreated|onDeterminingFilename)\.addListener/.test(bgSource), 'Downloads listeners must be optionally chained for Safari compatibility');
assert.ok(!/tabCapture|captureLock/.test(bgSource), 'Recording lock code is outside ImageCrate');
const referenced=new Set(['manifest.json', manifest.background.service_worker, ...Object.values(manifest.icons), ...Object.values(manifest.action.default_icon), `_locales/${manifest.default_locale}/messages.json`, '_locales/en/messages.json']);
for (const relativePath of referenced) await readFile(new URL('extension/'+relativePath, root));
const safariScriptCheck = spawnSync(process.execPath, ['--check', new URL('scripts/safari-convert.mjs', root).pathname], { encoding: 'utf8' });
assert.equal(safariScriptCheck.status, 0, safariScriptCheck.stderr);
console.log(`ImageCrate: manifest, permissions, local module references, Safari compatibility and JavaScript syntax OK`);
