import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';

const run = promisify(execFile);
const cli = new URL('../scripts/agent-cli.mjs', import.meta.url).pathname;

async function agent(args, dir) {
  try {
    const { stdout } = await run(process.execPath, [cli, ...args, '--state-dir', dir], { encoding: 'utf8' });
    return { code: 0, json: JSON.parse(stdout) };
  } catch (e) {
    return { code: e.code, json: JSON.parse(e.stdout) };
  }
}

test('agent CLI: status returns the unified envelope and presence-only permissions', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  const r = await agent(['status'], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.ok, true);
  assert.equal(r.json.meta.schema_version, 1);
  assert.equal(r.json.data.app, 'imagecrate');
  assert.equal(r.json.data.agent_level, 2);
  assert.equal(r.json.data.permissions.required.activeTab, true);
  assert.deepEqual(r.json.data.permissions.forbidden_present, []);
  assert.equal(r.json.data.permissions.host_permissions_present, false);
  assert.equal(r.json.data.live_browser_data_reachable, false);
});

test('agent CLI: every command has --help', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  for (const cmd of ['status', 'list', 'get', 'plan', 'create', 'update', 'delete', 'history', 'doctor', 'verify']) {
    const r = await agent([cmd, '--help'], dir);
    assert.equal(r.code, 0, cmd);
    assert.match(String(r.json.data), /Usage:/, cmd);
  }
});

test('agent CLI: unknown command and missing target use unified errors and exit codes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  const bad = await agent(['frobnicate'], dir);
  assert.equal(bad.code, 1);
  assert.equal(bad.json.error.code, 'unknown_command');
  const missing = await agent(['get', 'profile', 'prof_nope'], dir);
  assert.equal(missing.code, 4);
  assert.equal(missing.json.error.code, 'not_found');
  const missingOp = await agent(['get', 'operation', 'op.nope'], dir);
  assert.equal(missingOp.code, 4);
});

test('agent CLI: list/get operations and permissions come from the catalog and manifest', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  const ops = await agent(['list', 'operations'], dir);
  assert.equal(ops.json.data.items.length, 29);
  assert.ok(ops.json.data.items.some(o => o.id === 'op.grant-origin' && o.class === 'human-only'));
  const perm = await agent(['get', 'permission', 'activeTab'], dir);
  assert.equal(perm.json.data.kind, 'required');
});

test('agent CLI: plan settings normalizes through the shared GUI core and writes nothing', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  const r = await agent(['plan', 'settings', '--settings', '{"destination":"zip","format":"png","folderName":"  My <Page>  "}'], dir);
  assert.equal(r.code, 0);
  assert.equal(r.json.data.dry_run, true);
  assert.equal(r.json.data.settings.destination, 'zip');
  assert.equal(r.json.data.settings.format, 'png');
  assert.equal(r.json.data.requires_workspace_tab, true);
  const profiles = await agent(['list', 'profiles'], dir);
  assert.equal(profiles.json.data.items.length, 0);
  const badJson = await agent(['plan', 'settings', '--settings', '{oops'], dir);
  assert.equal(badJson.code, 1);
  assert.equal(badJson.json.error.code, 'invalid_settings_json');
});

test('agent CLI: profile CRUD with dry-run, idempotency and --yes gate', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  const dry = await agent(['create', 'profile', '--name', 'blog', '--settings', '{"destination":"downloads"}', '--dry-run'], dir);
  assert.equal(dry.json.data.dry_run, true);
  assert.equal((await agent(['list', 'profiles'], dir)).json.data.items.length, 0);

  const created = await agent(['create', 'profile', '--name', 'blog', '--settings', '{"destination":"downloads"}', '--idempotency-key', 'k1'], dir);
  assert.equal(created.code, 0);
  const id = created.json.data.profile.id;
  assert.match(id, /^prof_[0-9a-f-]{36}$/);

  const replay = await agent(['create', 'profile', '--name', 'blog', '--settings', '{"destination":"downloads"}', '--idempotency-key', 'k1'], dir);
  assert.equal(replay.json.data.idempotent_replay, true);
  assert.equal(replay.json.data.profile.id, id);
  assert.equal((await agent(['list', 'profiles'], dir)).json.data.items.length, 1);

  const conflict = await agent(['create', 'profile', '--name', 'other', '--settings', '{"destination":"zip"}', '--idempotency-key', 'k1'], dir);
  assert.equal(conflict.code, 1);
  assert.equal(conflict.json.error.code, 'idempotency_conflict');

  const updated = await agent(['update', 'profile', id, '--settings', '{"destination":"zip","format":"webp"}'], dir);
  assert.equal(updated.json.data.profile.settings.format, 'webp');

  const noYes = await agent(['delete', 'profile', id], dir);
  assert.equal(noYes.code, 1);
  assert.equal(noYes.json.error.code, 'confirmation_required');
  assert.equal((await agent(['list', 'profiles'], dir)).json.data.items.length, 1);

  const deleted = await agent(['delete', 'profile', id, '--yes'], dir);
  assert.equal(deleted.json.data.deleted_id, id);
  assert.equal((await agent(['get', 'profile', id], dir)).code, 4);
});

test('agent CLI: history records successes and failures with error codes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  await agent(['status'], dir);
  await agent(['get', 'profile', 'prof_nope'], dir);
  const history = await agent(['history', '--limit', '10'], dir);
  assert.equal(history.code, 0);
  assert.ok(history.json.data.items.some(e => e.command === 'status' && e.ok === true));
  assert.ok(history.json.data.items.some(e => e.error_code === 'not_found'));
  const raw = await readFile(join(dir, 'history.jsonl'), 'utf8');
  assert.ok(raw.trim().split('\n').length >= 2);
});

test('agent CLI: doctor is honest about unreachable browser surfaces', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  const r = await agent(['doctor'], dir);
  assert.equal(r.code, 0);
  const live = r.json.data.checks.find(c => c.name === 'live_browser_data');
  assert.equal(live.ok, false);
  assert.equal(live.severity, 'unavailable');
});

test('agent CLI: verify passes on the repository itself', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'ic-agent-'));
  const r = await agent(['verify', '--timeout', '120'], dir);
  assert.equal(r.code, 0, JSON.stringify(r.json));
  assert.equal(r.json.data.passed, true);
  assert.ok(r.json.data.checks.every(c => c.ok));
});

test('agent CLI: workspace exposes stable data-testid selectors', async () => {
  const html = await readFile(new URL('../extension/workspace.html', import.meta.url), 'utf8');
  const ids = [...html.matchAll(/data-testid="([^"]+)"/g)].map(m => m[1]);
  assert.ok(ids.length >= 8, `only ${ids.length} testids`);
  for (const required of ['image-grid', 'save-button', 'rescan-button', 'save-settings-apply']) {
    assert.ok(ids.includes(required), required);
  }
  assert.equal(new Set(ids).size, ids.length, 'testids must be unique');
});
