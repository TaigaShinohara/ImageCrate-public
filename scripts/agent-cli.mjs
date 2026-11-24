#!/usr/bin/env node
// ImageCrate agent CLI — machine surface over the SAME core the GUI uses.
// Scope (honest): the package/repository and CLI-owned state in `.agent/`.
// Live browser data (chrome.storage.session) is NOT reachable from here;
// those operations stay GUI-guided or human-only (docs/AGENT_OPERATIONS.md).
import { readFile, writeFile, appendFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { saveSettings, destinationLabel, requiresWorkspace, formatLabel } from '../extension/utils.js';

const SCHEMA_VERSION = 1;
export const EXIT = { ok: 0, input: 1, app: 2, permission: 3, notFound: 4 };
const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);

export const COMMANDS = ['status', 'list', 'get', 'plan', 'create', 'update', 'delete', 'history', 'doctor', 'verify'];

const HELP = {
  status: `status — app info, version, permissions (presence only), prerequisites.
Usage: agent status [--json|--human]
Example: npm run agent -- status --json`,
  list: `list — list operations, permissions, or CLI settings profiles.
Usage: agent list <operations|permissions|profiles> [--json|--human]
Example: npm run agent -- list operations --json`,
  get: `get — one operation, permission, or profile by stable id.
Usage: agent get <operation|permission|profile> <id> [--json|--human]
Example: npm run agent -- get permission activeTab --json`,
  plan: `plan — validate save settings with the GUI's shared core and show the effect. Never writes anything (dry-run semantics).
Usage: agent plan settings --settings '<json>' [--title <page title>] [--json|--human]
Example: npm run agent -- plan settings --settings '{"destination":"zip","format":"png"}' --json`,
  create: `create — create a CLI settings profile (preparation data; NOT the live browser setting).
Usage: agent create profile --name <name> --settings '<json>' [--idempotency-key <key>] [--dry-run] [--json|--human]
Example: npm run agent -- create profile --name blog --settings '{"destination":"downloads"}' --idempotency-key k1 --json`,
  update: `update — change a CLI settings profile.
Usage: agent update profile <id> [--name <name>] [--settings '<json>'] [--idempotency-key <key>] [--dry-run] [--json|--human]
Example: npm run agent -- update profile prof_... --settings '{"format":"webp"}' --json`,
  delete: `delete — delete a CLI settings profile. Destructive: requires --yes unless --dry-run.
Usage: agent delete profile <id> --yes [--idempotency-key <key>] [--dry-run] [--json|--human]
Example: npm run agent -- delete profile prof_... --yes --json`,
  history: `history — recent CLI executions with success/failure and error codes.
Usage: agent history [--limit <n>] [--json|--human]
Example: npm run agent -- history --limit 20 --json`,
  doctor: `doctor — prerequisites and unreachable surfaces, as a list.
Usage: agent doctor [--json|--human]
Example: npm run agent -- doctor --json`,
  verify: `verify — self-check: static check, manifest/catalog consistency, shared-core round trip, data-testid coverage.
Usage: agent verify [--timeout <sec>] [--json|--human]
Example: npm run agent -- verify --json`,
};

class CliError extends Error {
  constructor(code, message, exit, retryable = false, details = {}) {
    super(message); this.code = code; this.exit = exit; this.retryable = retryable; this.details = details;
  }
}
const inputError = (code, message, details) => new CliError(code, message, EXIT.input, false, details);
const notFound = (what, id) => new CliError('not_found', `${what} not found: ${id}`, EXIT.notFound, false, { id });

function parseArgs(argv) {
  const positional = []; const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') flags.json = true;
    else if (a === '--human') flags.human = true;
    else if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--yes') flags.yes = true;
    else if (a === '--help' || a === '-h') flags.help = true;
    else if (a.startsWith('--')) {
      const key = a.slice(2);
      const value = argv[i + 1];
      if (value === undefined || value.startsWith('--')) throw inputError('invalid_arguments', `Flag --${key} needs a value`);
      flags[key] = value; i++;
    } else positional.push(a);
  }
  return { positional, flags };
}

async function readJson(url, fallback = null) {
  try { return JSON.parse(await readFile(url, 'utf8')); } catch { return fallback; }
}

async function loadCatalog() {
  const catalog = await readJson(new URL('docs/agent-manifest.json', root));
  if (!catalog) throw new CliError('app_failure', 'docs/agent-manifest.json is missing or invalid', EXIT.app);
  return catalog;
}

async function loadManifest() {
  const manifest = await readJson(new URL('extension/manifest.json', root));
  if (!manifest) throw new CliError('app_failure', 'extension/manifest.json is missing or invalid', EXIT.app);
  return manifest;
}

function stateDir(flags) {
  const dir = flags['state-dir'] || process.env.IMAGECRATE_AGENT_STATE_DIR || new URL('.agent/', root).pathname;
  return dir.endsWith('/') ? dir : dir + '/';
}

async function loadProfiles(dir) {
  const data = await readJson(new URL('profiles.json', `file://${dir}`), null);
  return data && Array.isArray(data.profiles) ? data : { schema_version: SCHEMA_VERSION, profiles: [], idempotency: {} };
}
async function saveProfiles(dir, data) {
  await mkdir(dir, { recursive: true });
  await writeFile(new URL('profiles.json', `file://${dir}`), JSON.stringify(data, null, 2) + '\n');
}

function normalizeSettings(raw, title) {
  let parsed;
  try { parsed = typeof raw === 'string' ? JSON.parse(raw) : raw; }
  catch { throw inputError('invalid_settings_json', '--settings is not valid JSON'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw inputError('invalid_settings_json', '--settings must be a JSON object');
  const settings = saveSettings(parsed, title || 'ページ');
  return {
    settings,
    destination_label: destinationLabel(settings),
    format_label: formatLabel(settings.format),
    requires_workspace_tab: requiresWorkspace(settings),
  };
}

function idempotencyReplay(store, key, fingerprint) {
  if (!key) return null;
  const prior = store.idempotency?.[key];
  if (!prior) return null;
  if (prior.fingerprint !== fingerprint) {
    throw inputError('idempotency_conflict', 'This --idempotency-key was already used with different arguments', { key });
  }
  return prior.result;
}

const OPERATION_DETAILS = {
  'op.app-status': 'Reads package.json and extension/manifest.json. Presence only for permissions; no secret values exist or are returned.',
  'op.plan-settings': 'Normalizes settings through extension/utils.js saveSettings — the same function the GUI dialog applies.',
  'op.profile-create': 'Profiles are CLI-side preparation data in .agent/profiles.json. They do not change the live browser setting.',
  'op.profile-delete': 'Destructive within CLI state only. Requires --yes unless --dry-run.',
  'op.grant-origin': 'Human-only: Chrome permission dialog needs a real user gesture; the permission model stays per-origin and user-driven.',
  'op.pick-folder': 'Human-only: the OS folder picker is the user choosing the save location.',
  'op.share-sheet': 'Human-only: the OS share sheet belongs to the user.',
  'op.revoke-permission': 'Human-only: revoking site access exists only in Chrome extension settings UI.',
  'op.store-submit': 'Human-only: submission, payment and terms require the owner\u2019s explicit approval.',
};

async function cmdStatus() {
  const pkg = await readJson(new URL('package.json', root), {});
  const manifest = await loadManifest();
  const catalog = await loadCatalog();
  return {
    app: catalog.app, app_version: pkg.version || manifest.version, manifest_version: manifest.manifest_version,
    extension_version: manifest.version, minimum_chrome_version: manifest.minimum_chrome_version || null,
    schema_version: SCHEMA_VERSION, agent_level: catalog.agent_level, agent_level_scope: catalog.agent_level_scope,
    permissions: {
      required: Object.fromEntries((manifest.permissions || []).map(p => [p, true])),
      optional_host_permissions_present: Array.isArray(manifest.optional_host_permissions) && manifest.optional_host_permissions.length > 0,
      forbidden_present: (manifest.permissions || []).filter(p => ['cookies', 'debugger', 'webRequest', 'history', 'tabs', 'tabCapture'].includes(p)),
      host_permissions_present: Boolean(manifest.host_permissions),
    },
    secrets: { values_returned: false, note: 'This app holds no API keys or tokens. Presence booleans only.' },
    live_browser_data_reachable: false,
    live_browser_data_note: 'Candidates, selection and save jobs live in chrome.storage.session inside the browser and are not reachable from this CLI.',
  };
}

async function cmdList(kind) {
  const catalog = await loadCatalog();
  if (kind === 'operations') return { items: catalog.operations };
  if (kind === 'permissions') {
    const manifest = await loadManifest();
    return { items: [
      ...(manifest.permissions || []).map(id => ({ id, kind: 'required' })),
      ...(manifest.optional_host_permissions || []).map(pattern => ({ id: 'optional_host_permissions', kind: 'optional_host', pattern })),
    ] };
  }
  if (kind === 'profiles') {
    return { items: [] }; // replaced by caller with state-aware version
  }
  throw inputError('invalid_arguments', `Unknown list target: ${kind}. Use operations, permissions or profiles`);
}

async function main(argv) {
  const requestId = randomUUID();
  let parsed;
  try { parsed = parseArgs(argv); } catch (e) { parsed = { positional: [], flags: {}, error: e }; }
  const { positional, flags } = parsed;
  const command = positional[0];
  const human = Boolean(flags.human) && !flags.json;
  let recorded = false;

  const finish = async (exit, payload) => {
    // Record every invocation (except history reads of the log itself are recorded too, after reading).
    try {
      const dir = stateDir(flags || {});
      await mkdir(dir, { recursive: true });
      const entry = { request_id: requestId, at: new Date().toISOString(), command: command || null, ok: exit === 0, exit_code: exit, error_code: payload?.error?.code || null };
      await appendFile(new URL('history.jsonl', `file://${dir}`), JSON.stringify(entry) + '\n');
      recorded = true;
    } catch { /* history is best-effort; never mask the real result */ }
    if (human) {
      if (payload.ok) console.log(typeof payload.data === 'string' ? payload.data : JSON.stringify(payload.data, null, 2));
      else console.error(`Error [${payload.error.code}]: ${payload.error.message}`);
    } else {
      console.log(JSON.stringify(payload));
    }
    process.exitCode = exit;
  };

  try {
    if (parsed.error) throw parsed.error;
    if (!command || flags.help && !COMMANDS.includes(command)) {
      const text = `ImageCrate agent CLI (schema_version ${SCHEMA_VERSION})\nCommands: ${COMMANDS.join(', ')}\nCommon flags: --json (default), --human, --dry-run, --yes, --idempotency-key <key>, --timeout <sec>, --state-dir <dir>\nExit codes: 0 ok / 1 input error / 2 app failure / 3 permission missing / 4 not found\nRun "agent <command> --help" for details.`;
      return finish(EXIT.ok, { ok: true, data: text, meta: { schema_version: SCHEMA_VERSION, request_id: requestId } });
    }
    if (!COMMANDS.includes(command)) throw inputError('unknown_command', `Unknown command: ${command}`, { commands: COMMANDS });
    if (flags.help) return finish(EXIT.ok, { ok: true, data: HELP[command], meta: { schema_version: SCHEMA_VERSION, request_id: requestId } });

    const dir = stateDir(flags);
    let data;
    switch (command) {
      case 'status': data = await cmdStatus(); break;
      case 'list': {
        const kind = positional[1];
        if (kind === 'profiles') { const store = await loadProfiles(dir); data = { items: store.profiles.map(p => ({ id: p.id, name: p.name, settings: p.settings, updated_at: p.updated_at })) }; }
        else data = await cmdList(kind);
        break;
      }
      case 'get': {
        const kind = positional[1]; const id = positional[2];
        if (!kind || !id) throw inputError('invalid_arguments', 'get needs <operation|permission|profile> <id>');
        const catalog = await loadCatalog();
        if (kind === 'operation') {
          const op = catalog.operations.find(o => o.id === id);
          if (!op) throw notFound('operation', id);
          data = { ...op, detail: OPERATION_DETAILS[id] || 'See docs/AGENT_OPERATIONS.md for the full catalog row.' };
        } else if (kind === 'permission') {
          const list = (await cmdList('permissions')).items;
          const perm = list.find(p => p.id === id);
          if (!perm) throw notFound('permission', id);
          data = { ...perm, note: 'Presence and kind only; this app stores no secret values.' };
        } else if (kind === 'profile') {
          const store = await loadProfiles(dir);
          const profile = store.profiles.find(p => p.id === id);
          if (!profile) throw notFound('profile', id);
          data = profile;
        } else throw inputError('invalid_arguments', `Unknown get target: ${kind}`);
        break;
      }
      case 'plan': {
        if (positional[1] !== 'settings') throw inputError('invalid_arguments', 'plan supports only: plan settings');
        if (!flags.settings) throw inputError('invalid_arguments', 'plan settings needs --settings <json>');
        data = { dry_run: true, writes: false, ...normalizeSettings(flags.settings, flags.title) };
        break;
      }
      case 'create': {
        if (positional[1] !== 'profile') throw inputError('invalid_arguments', 'create supports only: create profile');
        if (!flags.name) throw inputError('invalid_arguments', 'create profile needs --name');
        if (!flags.settings) throw inputError('invalid_arguments', 'create profile needs --settings <json>');
        const normalized = normalizeSettings(flags.settings, flags.title);
        const fingerprint = JSON.stringify({ op: 'create', name: flags.name, settings: normalized.settings });
        const store = await loadProfiles(dir);
        const replay = idempotencyReplay(store, flags['idempotency-key'], fingerprint);
        if (replay) { data = { ...replay, idempotent_replay: true }; break; }
        const profile = { id: `prof_${randomUUID()}`, name: String(flags.name), settings: normalized.settings, created_at: new Date().toISOString(), updated_at: new Date().toISOString() };
        data = { profile, destination_label: normalized.destination_label, dry_run: Boolean(flags.dryRun) };
        if (!flags.dryRun) {
          store.profiles.push(profile);
          if (flags['idempotency-key']) { store.idempotency = store.idempotency || {}; store.idempotency[flags['idempotency-key']] = { fingerprint, result: data }; }
          await saveProfiles(dir, store);
        }
        break;
      }
      case 'update': {
        if (positional[1] !== 'profile') throw inputError('invalid_arguments', 'update supports only: update profile');
        const id = positional[2];
        if (!id) throw inputError('invalid_arguments', 'update profile needs <id>');
        if (!flags.name && !flags.settings) throw inputError('invalid_arguments', 'update profile needs --name and/or --settings');
        const store = await loadProfiles(dir);
        const profile = store.profiles.find(p => p.id === id);
        if (!profile) throw notFound('profile', id);
        const normalized = flags.settings ? normalizeSettings(flags.settings, flags.title) : null;
        const fingerprint = JSON.stringify({ op: 'update', id, name: flags.name || null, settings: normalized?.settings || null });
        const replay = idempotencyReplay(store, flags['idempotency-key'], fingerprint);
        if (replay) { data = { ...replay, idempotent_replay: true }; break; }
        const next = { ...profile, name: flags.name ? String(flags.name) : profile.name, settings: normalized ? normalized.settings : profile.settings, updated_at: new Date().toISOString() };
        data = { profile: next, dry_run: Boolean(flags.dryRun) };
        if (!flags.dryRun) {
          store.profiles = store.profiles.map(p => p.id === id ? next : p);
          if (flags['idempotency-key']) { store.idempotency = store.idempotency || {}; store.idempotency[flags['idempotency-key']] = { fingerprint, result: data }; }
          await saveProfiles(dir, store);
        }
        break;
      }
      case 'delete': {
        if (positional[1] !== 'profile') throw inputError('invalid_arguments', 'delete supports only: delete profile');
        const id = positional[2];
        if (!id) throw inputError('invalid_arguments', 'delete profile needs <id>');
        if (!flags.yes && !flags.dryRun) throw inputError('confirmation_required', 'delete is destructive: pass --yes to execute, or --dry-run to preview');
        const store = await loadProfiles(dir);
        const profile = store.profiles.find(p => p.id === id);
        if (!profile) throw notFound('profile', id);
        const fingerprint = JSON.stringify({ op: 'delete', id });
        const replay = idempotencyReplay(store, flags['idempotency-key'], fingerprint);
        if (replay) { data = { ...replay, idempotent_replay: true }; break; }
        data = { deleted_id: id, dry_run: Boolean(flags.dryRun) };
        if (!flags.dryRun) {
          store.profiles = store.profiles.filter(p => p.id !== id);
          if (flags['idempotency-key']) { store.idempotency = store.idempotency || {}; store.idempotency[flags['idempotency-key']] = { fingerprint, result: data }; }
          await saveProfiles(dir, store);
        }
        break;
      }
      case 'history': {
        const limit = Math.min(Math.max(parseInt(flags.limit || '20', 10) || 20, 1), 200);
        let entries = [];
        try {
          const text = await readFile(new URL('history.jsonl', `file://${dir}`), 'utf8');
          entries = text.trim().split('\n').filter(Boolean).map(line => { try { return JSON.parse(line); } catch { return null; } }).filter(Boolean);
        } catch { entries = []; }
        data = { items: entries.slice(-limit), total: entries.length };
        break;
      }
      case 'doctor': {
        const checks = [];
        const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
        checks.push({ name: 'node_version', ok: nodeMajor >= 22, detail: `node ${process.versions.node} (repo asks for 22+)` });
        let manifestOk = true; try { await loadManifest(); } catch { manifestOk = false; }
        checks.push({ name: 'manifest_readable', ok: manifestOk, detail: 'extension/manifest.json' });
        checks.push({ name: 'state_dir', ok: true, detail: dir });
        checks.push({ name: 'live_browser_data', ok: false, severity: 'unavailable', detail: 'chrome.storage.session is inside the browser; the CLI cannot read candidates, selection or save jobs. GUI-guided operations are listed in docs/AGENT_OPERATIONS.md.' });
        checks.push({ name: 'browser_permissions', ok: false, severity: 'human-only', detail: 'Origin grants happen in Chrome\u2019s permission dialog by the user (per-origin model).' });
        data = { checks, summary: checks.filter(c => c.ok).length + '/' + checks.length + ' package-side checks ok; browser-side surfaces are honestly unavailable to the CLI' };
        break;
      }
      case 'verify': {
        const timeoutSec = Math.min(Math.max(parseInt(flags.timeout || '120', 10) || 120, 1), 600);
        const checks = [];
        const checkRun = await new Promise(resolve => {
          const child = spawn(process.execPath, ['scripts/check.mjs'], { cwd: rootPath, timeout: timeoutSec * 1000 });
          let out = ''; child.stdout.on('data', d => out += d); child.stderr.on('data', d => out += d);
          child.on('close', code => resolve({ code, out: out.trim().split('\n').pop() || '' }));
          child.on('error', e => resolve({ code: -1, out: String(e) }));
        });
        checks.push({ name: 'static_check', ok: checkRun.code === 0, detail: checkRun.out });
        const catalog = await loadCatalog();
        const catalogCommands = (catalog.commands || []).map(c => c.name).sort();
        checks.push({ name: 'catalog_consistency', ok: JSON.stringify(catalogCommands) === JSON.stringify([...COMMANDS].sort()), detail: `catalog commands: ${catalogCommands.join(',')}` });
        const roundTrip = normalizeSettings('{}');
        checks.push({ name: 'shared_core_round_trip', ok: roundTrip.settings.destination === 'downloads' && roundTrip.settings.format === 'original', detail: 'extension/utils.js saveSettings default' });
        const html = await readFile(new URL('extension/workspace.html', root), 'utf8');
        const testIds = [...html.matchAll(/data-testid="([^"]+)"/g)].map(m => m[1]);
        checks.push({ name: 'data_testid_coverage', ok: testIds.length >= 8, detail: `${testIds.length} testids: ${testIds.join(',')}` });
        const manifest = await loadManifest();
        const forbidden = (manifest.permissions || []).filter(p => ['cookies', 'debugger', 'webRequest'].includes(p));
        checks.push({ name: 'permission_model_unchanged', ok: forbidden.length === 0 && !manifest.host_permissions, detail: 'per-origin optional host permissions only' });
        const okAll = checks.every(c => c.ok);
        data = { passed: okAll, checks };
        if (!okAll) return finish(EXIT.app, { ok: false, error: { code: 'verify_failed', message: 'verify failed', retryable: false, details: data }, meta: { schema_version: SCHEMA_VERSION, request_id: requestId } });
        break;
      }
    }
    return finish(EXIT.ok, { ok: true, data, meta: { schema_version: SCHEMA_VERSION, request_id: requestId } });
  } catch (e) {
    const err = e instanceof CliError ? e : new CliError('app_failure', String(e?.message || e), EXIT.app, true);
    return finish(err.exit, { ok: false, error: { code: err.code, message: err.message, retryable: err.retryable, details: err.details }, meta: { schema_version: SCHEMA_VERSION, request_id: requestId } });
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main(process.argv.slice(2));
}
