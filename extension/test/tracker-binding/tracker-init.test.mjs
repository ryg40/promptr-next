// promptr-tracker-init: args, print, clobber, interactive, --check with fake ports, token presence text.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import promptr from '../../dist/src/extension/index.mjs';
import { parseTrackerInitArgs, runTrackerInit, tokenPresenceLine, TRACKER_INIT_HELP } from '../../dist/src/tracking/init.mjs';

const NOW = '2026-09-08T10:00:00.000Z';

function deps(overrides = {}) {
  const files = overrides.files ?? {};
  const logs = [];
  return {
    files, logs,
    readFile: (f) => files[f],
    exists: (f) => f in files,
    writeFile: (f, t) => { files[f] = t; },
    gitRemote: () => overrides.remote,
    stateRoot: () => '/agent/promptr',
    log: (l) => logs.push(l),
    ask: overrides.answers ? async (q) => { logs.push(`? ${q}`); return overrides.answers.shift() ?? ''; } : undefined,
    ports: overrides.ports ?? (() => ({ listPage: async () => { throw new Error('ports must not be used without --check'); } })),
    now: () => NOW,
  };
}

test('argument parsing table: usage errors, defaults and values', () => {
  const cases = [
    [['--provider', 'github'], (v) => v.provider === 'github' && v.scope === 'project'],
    [['--provider', 'GITEA', '--owner', 'o', '--repo', 'r', '--host', 'https://g.example', '--api', 'https://a.example', '--scope', 'global', '--cwd', '/p', '--force', '--print', '--check'],
      (v) => v.provider === 'gitea' && v.owner === 'o' && v.repo === 'r' && v.host === 'https://g.example' && v.api === 'https://a.example' && v.scope === 'global' && v.cwd === '/p' && v.force && v.print && v.check],
    [['--help'], (v) => v.help === true],
  ];
  for (const [argv, check] of cases) {
    const p = parseTrackerInitArgs(argv);
    assert.equal(p.ok, true, argv.join(' '));
    assert.ok(check(p.value), argv.join(' '));
  }
  for (const argv of [['--provider'], ['--provider', 'gitlab'], ['--scope', 'user'], ['--owner'], ['--bogus'], ['--host', '--force']]) {
    const p = parseTrackerInitArgs(argv);
    assert.equal(p.ok, false, argv.join(' '));
  }
});

test('usage errors exit 2 via the outcome flag and --help prints help', async () => {
  const d = deps();
  const bad = await runTrackerInit(['--provider', 'gitlab'], {}, d);
  assert.equal(bad.ok, false);
  assert.equal(bad.usage, true);
  const help = await runTrackerInit(['--help'], {}, d);
  assert.equal(help.ok, true);
  assert.equal(d.logs[0], TRACKER_INIT_HELP);
  const noProvider = await runTrackerInit(['--cwd', '/proj'], {}, deps({ remote: 'https://forge.example/o/r' }));
  assert.equal(noProvider.ok, false);
  assert.equal(noProvider.usage, true, 'no TTY, no provider, unknown remote is a usage error');
});

test('--print writes nothing and reports the token variable without its value', async () => {
  const d = deps({ remote: 'git@github.com:octo/promptr.git' });
  const out = await runTrackerInit(['--provider', 'github', '--cwd', '/proj', '--print'], { GITHUB_TOKEN: 'ghp_verysecret' }, d);
  assert.equal(out.ok, true);
  assert.equal(out.written, false);
  assert.deepEqual(Object.keys(d.files), []);
  const printed = d.logs.join('\n');
  assert.match(printed, /"provider": "github"/);
  assert.match(printed, /"owner": "octo"/);
  assert.match(printed, /# would write \/proj\/\.promptr\/tracker\.json/);
  assert.match(printed, /GITHUB_TOKEN present \(value not shown\)/);
  assert.ok(!printed.includes('verysecret'));
});

test('non-interactive provider without a remote defaults repo to basename(cwd); remote fills owner/repo; flags win', async () => {
  const local = deps();
  const noRemote = await runTrackerInit(['--provider', 'gitea', '--cwd', '/home/dev/git/another-project'],
    { GITEA_HOST: 'https://gitea.example.test', GITEA_OWNER: 'octo' }, local);
  assert.equal(noRemote.ok, true);
  const localBinding = JSON.parse(local.files['/home/dev/git/another-project/.promptr/tracker.json']);
  assert.deepEqual([localBinding.owner, localBinding.repo], ['octo', 'another-project']);
  // The remote is only recognised as Gitea when GITEA_HOST names that instance.
  const d = deps({ remote: 'https://gitea.example.test/octo/promptr.git' });
  const out = await runTrackerInit(['--provider', 'gitea', '--cwd', '/proj', '--owner', 'other'],
    { GITEA_HOST: 'https://gitea.example.test' }, d);
  assert.equal(out.ok, true);
  const written = JSON.parse(d.files['/proj/.promptr/tracker.json']);
  assert.equal(written.owner, 'other');
  assert.equal(written.repo, 'promptr');
  assert.equal(written.host, 'https://gitea.example.test');
  assert.match(d.logs.join('\n'), /GITEA_TOKEN not set/);
});

test('gitea init without a host refuses instead of guessing one', async () => {
  const d = deps();
  const out = await runTrackerInit(['--provider', 'gitea', '--cwd', '/proj', '--owner', 'octo', '--repo', 'demo'], {}, d);
  assert.equal(out.ok, false);
  assert.match(out.error, /a Gitea host is required/);
  assert.match(out.error, /GITEA_HOST/);
  assert.deepEqual(Object.keys(d.files), [], 'nothing written');
});

test('refuses to clobber without --force; --force writes; --scope global targets the state root', async () => {
  const d = deps({ files: { '/proj/.promptr/tracker.json': '{"old":true}' }, remote: 'git@github.com:o/r.git' });
  const refused = await runTrackerInit(['--provider', 'github', '--cwd', '/proj'], {}, d);
  assert.equal(refused.ok, false);
  assert.match(refused.error, /already exists/);
  assert.equal(d.files['/proj/.promptr/tracker.json'], '{"old":true}');
  const forced = await runTrackerInit(['--provider', 'github', '--cwd', '/proj', '--force'], {}, d);
  assert.equal(forced.ok, true);
  assert.equal(JSON.parse(d.files['/proj/.promptr/tracker.json']).owner, 'o');
  const global = await runTrackerInit(['--provider', 'github', '--cwd', '/proj', '--scope', 'global'], {}, d);
  assert.equal(global.ok, true);
  assert.equal(global.path, '/agent/promptr/tracker.json');
  assert.ok('/agent/promptr/tracker.json' in d.files);
});

test('interactive path: numbered choice, defaults on empty, custom host, scope by number', async () => {
  const d = deps({ remote: 'git@github.com:octo/promptr.git', answers: ['2', '', '', '', '2'] });
  const out = await runTrackerInit(['--cwd', '/proj'], {}, d);
  assert.equal(out.ok, true);
  assert.equal(out.path, '/agent/promptr/tracker.json');
  const b = JSON.parse(d.files['/agent/promptr/tracker.json']);
  assert.deepEqual([b.provider, b.host, b.owner, b.repo], ['github', 'https://github.com', 'octo', 'promptr']);
  assert.match(d.logs[0], /1\) Gitea\s+2\) GitHub\s+\[2\]/, 'default marked from the remote');

  const g = deps({ remote: 'git@github.com:octo/promptr.git', answers: ['', 'me', 'repo', 'https://gitea.internal', ''] });
  const out2 = await runTrackerInit(['--cwd', '/proj'], {}, g);
  assert.equal(out2.ok, true);
  const b2 = JSON.parse(g.files['/proj/.promptr/tracker.json']);
  assert.deepEqual([b2.provider, b2.host, b2.owner, b2.repo], ['github', 'https://gitea.internal', 'me', 'repo'].map((x, i) => i === 0 ? 'github' : x));

  // Gitea has no default host, so the interactive host answer supplies one.
  const bad = deps({ answers: ['x', '7', '1', 'own', 'rep', 'https://gitea.example.test', '1'] });
  const out3 = await runTrackerInit(['--cwd', '/proj'], {}, bad);
  assert.equal(out3.ok, true, 'invalid provider answers are re-asked');
  const b3 = JSON.parse(bad.files['/proj/.promptr/tracker.json']);
  assert.equal(b3.provider, 'gitea');
  assert.equal(b3.host, 'https://gitea.example.test');
});

test('--check reports the page-1 count or the failure reason through injected ports; env token never printed', async () => {
  const seen = [];
  const okPorts = (env) => { seen.push(env); return { listPage: async (repo, page) => ({ items: [{ number: 1 }, { number: 2 }, { number: 3 }], page, repo }) }; };
  const d = deps({ remote: 'git@github.com:octo/promptr.git', ports: okPorts });
  const out = await runTrackerInit(['--provider', 'github', '--cwd', '/proj', '--check'], { GITHUB_TOKEN: 'ghp_topsecret' }, d);
  assert.equal(out.ok, true);
  assert.match(d.logs.join('\n'), /GitHub reachable: 3 issue\(s\) on page 1/);
  assert.equal(seen[0].PROMPTR_TRACKER, 'github');
  assert.equal(seen[0].GITHUB_OWNER, 'octo');
  assert.equal(seen[0].GITHUB_TOKEN, 'ghp_topsecret', 'ports get the token from the env, not from output');
  assert.ok(!d.logs.join('\n').includes('topsecret'));

  let attempted;
  const failing = () => ({ listPage: async (repo) => { attempted = repo; throw new Error('HTTP 404 Not Found'); } });
  const f = deps({ ports: failing });
  const out2 = await runTrackerInit(['--provider', 'gitea', '--cwd', '/home/dev/git/another-project', '--check'],
    { GITEA_HOST: 'https://gitea.example.test', GITEA_OWNER: 'octo' }, f);
  assert.equal(out2.ok, true, 'a failed check is reported, not fatal');
  assert.deepEqual([attempted.owner, attempted.repo], ['octo', 'another-project']);
  assert.match(f.logs.join('\n'), /Gitea unreachable: HTTP 404 Not Found/);
  assert.ok(!f.logs.join('\n').includes('octo\/promptr'));
});

test('an env PROMPTR_TRACKER override is announced after writing', async () => {
  const d = deps({ remote: 'git@github.com:o/r.git' });
  await runTrackerInit(['--provider', 'github', '--cwd', '/proj'], { PROMPTR_TRACKER: 'gitea' }, d);
  assert.match(d.logs.join('\n'), /PROMPTR_TRACKER is set .* overrides the file/);
});

test('hosted tracker init defaults an unbound another-project repository honestly', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'another-project-'));
  const cwd = path.join(root, 'another-project');
  const agentDir = path.join(root, 'agent');
  fs.mkdirSync(cwd, { recursive: true });
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const saved = {};
  for (const k of ['PI_CODING_AGENT_DIR', 'PROMPTR_TRACKER', 'GITEA_HOST', 'GITEA_OWNER']) saved[k] = process.env[k];
  process.env.PI_CODING_AGENT_DIR = agentDir;
  delete process.env.PROMPTR_TRACKER;
  // The Gitea host and owner come from the shell; nothing is baked in.
  process.env.GITEA_HOST = 'https://gitea.example.test';
  process.env.GITEA_OWNER = 'octo';
  t.after(() => {
    for (const [k, v] of Object.entries(saved)) v === undefined ? delete process.env[k] : process.env[k] = v;
  });
  const commands = new Map();
  const defaults = [];
  const pi = new Proxy({
    on() {},
    registerCommand: (name, command) => commands.set(name, command),
  }, { get: (object, key) => key in object ? object[key] : () => {} });
  promptr(pi);
  const ctx = {
    cwd, mode: 'tui',
    ui: {
      select: async (title, choices) => title === 'Tracker provider' ? 'Gitea' : choices[0],
      input: async (title, initial) => { defaults.push([title, initial]); return initial; },
      confirm: async () => true,
      notify() {},
    },
  };
  const notices = [];
  ctx.ui.notify = (text) => notices.push(text);
  await commands.get('promptr-tracker').handler('init', ctx);
  assert.deepEqual(defaults.find(([title]) => title === 'Repository'), ['Repository', 'another-project']);
  // Finding 1: an initially unbound companion has no refresher to pick this
  // up on r, so the hosted notice must ask for a reopen instead.
  const written = notices.join('\n');
  assert.match(written, /close and reopen the companion/i);
  assert.doesNotMatch(written, /press r/i);
  // The same honesty in /promptr-tracker status.
  const status = [];
  await commands.get('promptr-tracker').handler('status', { ...ctx, ui: { ...ctx.ui, notify: (t) => status.push(t) } });
  assert.doesNotMatch(status.join('\n'), /picks up a new binding on r/i);
  assert.match(status.join('\n'), /reopen/i);
  const binding = JSON.parse(fs.readFileSync(path.join(cwd, '.promptr', 'tracker.json'), 'utf8'));
  assert.equal(binding.repo, 'another-project');
  assert.notEqual(binding.repo, 'promptr');
});

test('a written binding tells the owner to reopen, never that r picks it up', async () => {
  // Finding 1: an initially unbound persistent companion builds no navigation
  // or refresher, so pressing r cannot activate a binding created afterwards.
  // The guidance must say to reopen rather than promise an r pickup.
  const d = deps({ remote: 'https://gitea.example.test/octo/promptr.git' });
  const out = await runTrackerInit(['--provider', 'gitea', '--cwd', '/proj'],
    { GITEA_HOST: 'https://gitea.example.test' }, d);
  assert.equal(out.ok, true);
  const logged = d.logs.join('\n');
  assert.match(logged, /close and reopen the companion/i);
  assert.doesNotMatch(logged, /press r/i, 'no claim that r activates a new binding');
});

test('tokenPresenceLine never carries the value', () => {
  assert.equal(tokenPresenceLine('gitea', { GITEA_TOKEN: 'abc' }), 'GITEA_TOKEN present (value not shown)');
  assert.equal(tokenPresenceLine('github', {}), 'GITHUB_TOKEN not set; private repositories will fail');
});
