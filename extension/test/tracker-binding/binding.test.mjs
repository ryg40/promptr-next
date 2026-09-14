// Tracker binding: precedence, overlay env without tokens, remote inference, parse/serialize.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bindingEnv, inferBindingFromRemote, parseTrackerBinding, resolveTrackerBinding, serializeTrackerBinding,
  trackerBindingFiles, bindingSourceSuffix,
} from '../../dist/src/tracking/binding.mjs';
import { loadTrackerBinding, writeTrackerBinding } from '../../dist/src/tracking/binding-io.mjs';

const NOW = '2026-09-08T10:00:00.000Z';
const gh = { version: 1, provider: 'github', host: 'https://github.com', owner: 'octo', repo: 'promptr', boundAt: NOW };
const gt = { version: 1, provider: 'gitea', host: 'https://gitea.example.test', owner: 'octo', repo: 'promptr', boundAt: NOW };
const text = (b) => serializeTrackerBinding(b);
const ENV = { GITEA_TOKEN: 'gitea-secret', GITHUB_TOKEN: 'github-secret' };
/** A machine whose shell already names a Gitea instance; there is no baked-in host. */
/** provider/host/owner/repo of a binding, or undefined. */
function pick(b) { return b && [b.provider, b.host, b.owner, b.repo]; }
const GITEA_ENV = { ...ENV, GITEA_HOST: 'https://gitea.example.test', GITEA_OWNER: 'octo', GITEA_REPO: 'promptr' };

test('trackerBindingFiles places the project file under .promptr and the global file under the state root', () => {
  const f = trackerBindingFiles('/proj', '/agent/promptr');
  assert.equal(f.project, '/proj/.promptr/tracker.json');
  assert.equal(f.global, '/agent/promptr/tracker.json');
});

test('precedence: env wins over both files', () => {
  const r = resolveTrackerBinding({ ...GITEA_ENV, PROMPTR_TRACKER: 'gitea' }, { project: text(gh), global: text(gh) }, 'git@github.com:x/y.git');
  assert.equal(r.source, 'env');
  assert.equal(r.resolution.ok, true);
  assert.equal(r.resolution.config.provider, 'gitea');
});

test('PROMPTR_TRACKER=gitea without GITEA_HOST/OWNER/REPO is a named reason, not a guessed host', () => {
  const r = resolveTrackerBinding({ ...ENV, PROMPTR_TRACKER: 'gitea' }, {});
  assert.equal(r.source, 'env');
  assert.equal(r.resolution.ok, false);
  assert.match(r.resolution.reason, /not configured: set GITEA_HOST, GITEA_OWNER, GITEA_REPO/);
});

test('precedence: project file over global file', () => {
  const r = resolveTrackerBinding(ENV, { project: text(gh), global: text(gt) });
  assert.equal(r.source, 'project');
  assert.equal(r.resolution.config.provider, 'github');
  assert.equal(r.resolution.config.repo.owner, 'octo');
  assert.equal(r.resolution.config.tokenPresent, true);
  assert.equal(r.effectiveEnv.GITHUB_TOKEN, 'github-secret', 'tokens come from the real env');
});

test('precedence: global file over the remote', () => {
  const r = resolveTrackerBinding(ENV, { global: text(gt) }, 'git@github.com:o/r.git');
  assert.equal(r.source, 'global');
  assert.equal(r.resolution.config.provider, 'gitea');
});

test('a recognized remote wins; anything else is unbound, whatever the directory is named', () => {
  const r = resolveTrackerBinding(ENV, {}, 'https://github.com/o/r');
  assert.equal(r.source, 'remote');
  assert.equal(r.resolution.config.provider, 'github');
  assert.equal(r.resolution.config.repo.owner, 'o');
  const d = resolveTrackerBinding(ENV, {}, 'https://forge.example/o/r.git');
  assert.equal(d.source, 'unbound');
  assert.equal(d.resolution.ok, false);
  assert.match(d.resolution.reason, /tracker unbound/);
  const none = resolveTrackerBinding(ENV, {});
  assert.equal(none.source, 'unbound');
  assert.deepEqual(none.problems, []);
  // No directory name is special: a checkout that happens to be called
  // "promptr" gets exactly the same answer as any other unbound project.
  for (const env of [ENV, GITEA_ENV]) {
    const named = resolveTrackerBinding(env, {});
    assert.equal(named.source, 'unbound');
    assert.equal(named.resolution.ok, false);
  }
});

test('a corrupt project file falls through to the global file with one problems line', () => {
  const r = resolveTrackerBinding(ENV, { project: '{not json', global: text(gh) });
  assert.equal(r.source, 'global');
  assert.equal(r.problems.length, 1);
  assert.match(r.problems[0], /project tracker\.json ignored: not valid JSON/);
  const bad = resolveTrackerBinding(ENV, { project: JSON.stringify({ ...gh, provider: 'bitbucket' }) }, undefined, '/proj');
  assert.equal(bad.source, 'unbound');
  assert.match(bad.problems[0], /provider must be gitea or github/);
});

test('bindingEnv never carries a token and names the right variables', () => {
  const g = bindingEnv(gh);
  assert.deepEqual(g, { PROMPTR_TRACKER: 'github', GITHUB_HOST: 'https://github.com', GITHUB_OWNER: 'octo', GITHUB_REPO: 'promptr' });
  const withApi = bindingEnv({ ...gh, host: 'https://ghe.example/', apiOrigin: 'https://ghe.example/api/v3/' });
  assert.equal(withApi.GITHUB_API, 'https://ghe.example/api/v3');
  const t = bindingEnv(gt);
  assert.deepEqual(t, { PROMPTR_TRACKER: 'gitea', GITEA_HOST: 'https://gitea.example.test', GITEA_OWNER: 'octo', GITEA_REPO: 'promptr' });
  for (const env of [g, t, withApi]) assert.ok(!Object.keys(env).some((k) => /TOKEN/.test(k)));
});

test('inferBindingFromRemote recognises github.com, GITHUB_HOST, the Gitea host and nothing else', () => {
  assert.deepEqual(pick(inferBindingFromRemote('git@github.com:o/r.git', {}, NOW)), ['github', 'https://github.com', 'o', 'r']);
  assert.deepEqual(pick(inferBindingFromRemote('https://github.com/o/r', {}, NOW)), ['github', 'https://github.com', 'o', 'r']);
  // No GITEA_HOST in the environment: a Gitea remote is not recognised, because
  // there is no default host to match it against.
  assert.equal(inferBindingFromRemote('https://gitea.example.test/o/r.git', {}, NOW), undefined);
  assert.deepEqual(pick(inferBindingFromRemote('https://gitea.example.test/o/r.git', { GITEA_HOST: 'https://gitea.example.test' }, NOW)), ['gitea', 'https://gitea.example.test', 'o', 'r']);
  assert.deepEqual(pick(inferBindingFromRemote('git@ghe.example:o/r.git', { GITHUB_HOST: 'https://ghe.example' }, NOW)), ['github', 'https://ghe.example', 'o', 'r']);
  assert.deepEqual(pick(inferBindingFromRemote('https://my-gitea.example/o/r', { GITEA_HOST: 'https://my-gitea.example' }, NOW)), ['gitea', 'https://my-gitea.example', 'o', 'r']);
  assert.equal(inferBindingFromRemote('https://forge.example/o/r', {}, NOW), undefined);
  assert.equal(inferBindingFromRemote(undefined, {}, NOW), undefined);
  assert.equal(inferBindingFromRemote('not a url', {}, NOW), undefined);
});

test('private GitHub remotes: www.github.com, ssh://, embedded credentials and trailing slashes all bind to github.com', () => {
  // The clone form `www.github.com/ORGNAME/reponame.git` is the same tracker as github.com.
  assert.deepEqual(pick(inferBindingFromRemote('https://www.github.com/ORGNAME/reponame.git', {}, NOW)), ['github', 'https://github.com', 'ORGNAME', 'reponame']);
  assert.deepEqual(pick(inferBindingFromRemote('http://WWW.GitHub.com/ORGNAME/reponame.git/', {}, NOW)), ['github', 'https://github.com', 'ORGNAME', 'reponame']);
  assert.deepEqual(pick(inferBindingFromRemote('git@www.github.com:ORGNAME/reponame.git', {}, NOW)), ['github', 'https://github.com', 'ORGNAME', 'reponame']);
  assert.deepEqual(pick(inferBindingFromRemote('ssh://git@github.com/ORGNAME/reponame.git', {}, NOW)), ['github', 'https://github.com', 'ORGNAME', 'reponame']);
  assert.deepEqual(pick(inferBindingFromRemote('ssh://git@github.com:22/ORGNAME/reponame', {}, NOW)), ['github', 'https://github.com', 'ORGNAME', 'reponame']);
  // A token embedded in the clone URL is dropped, never carried into the binding.
  const withCreds = inferBindingFromRemote('https://octo:ghp_secret@github.com/ORGNAME/reponame.git', {}, NOW);
  assert.deepEqual(pick(withCreds), ['github', 'https://github.com', 'ORGNAME', 'reponame']);
  assert.doesNotMatch(JSON.stringify(withCreds), /ghp_secret/);
  // A user who set GITHUB_HOST to the www alias still matches a plain github.com remote.
  assert.deepEqual(pick(inferBindingFromRemote('git@github.com:o/r.git', { GITHUB_HOST: 'https://www.github.com/' }, NOW)), ['github', 'https://github.com', 'o', 'r']);
  // Only github.com folds its www alias; a self-hosted forge keeps the name it was given.
  assert.equal(inferBindingFromRemote('https://www.forge.example/o/r.git', { GITEA_HOST: 'https://forge.example' }, NOW), undefined);
  assert.deepEqual(pick(inferBindingFromRemote('https://www.forge.example/o/r.git', { GITEA_HOST: 'https://www.forge.example' }, NOW)), ['gitea', 'https://www.forge.example', 'o', 'r']);
});

test('parse/serialize round trip, key order, and rejection of bad provider/host', () => {
  const s = serializeTrackerBinding({ ...gh, note: 'trial mirror' });
  assert.ok(s.endsWith('\n'));
  assert.deepEqual(Object.keys(JSON.parse(s)), ['version', 'provider', 'host', 'owner', 'repo', 'boundAt', 'note']);
  const back = parseTrackerBinding(s);
  assert.equal(back.ok, true);
  assert.deepEqual(back.binding, { ...gh, note: 'trial mirror' });
  assert.equal(parseTrackerBinding(undefined), undefined, 'missing file');
  assert.match(parseTrackerBinding(JSON.stringify({ ...gh, provider: 'gitlab' })).error, /provider/);
  assert.match(parseTrackerBinding(JSON.stringify({ ...gh, host: 'github.com' })).error, /host must be an http\(s\) origin/);
  assert.match(parseTrackerBinding(JSON.stringify({ ...gh, host: 'ftp://x' })).error, /host/);
  assert.match(parseTrackerBinding(JSON.stringify({ ...gh, version: 2 })).error, /version/);
  assert.match(parseTrackerBinding(JSON.stringify({ ...gh, owner: '../x' })).error, /owner\/repo/);
  assert.match(parseTrackerBinding('[]').error, /object/);
});

test('bindingSourceSuffix labels every non-env source', () => {
  assert.equal(bindingSourceSuffix('env'), '');
  assert.equal(bindingSourceSuffix('project'), '(project file)');
  assert.equal(bindingSourceSuffix('global'), '(global file)');
  assert.equal(bindingSourceSuffix('remote'), '(from origin remote)');
  assert.equal(bindingSourceSuffix('unbound'), '(unbound)');
});

function fakeDeps(files = {}, remote) {
  return {
    files,
    readFile: (f) => files[f],
    exists: (f) => f in files,
    writeFile: (f, t) => { files[f] = t; },
    gitRemote: () => remote,
    stateRoot: () => '/agent/promptr',
  };
}

test('loadTrackerBinding reads both files and the remote through injected deps', () => {
  const deps = fakeDeps({ '/agent/promptr/tracker.json': text(gt) }, 'git@github.com:o/r.git');
  const r = loadTrackerBinding('/proj', ENV, deps);
  assert.equal(r.source, 'global');
  assert.deepEqual(r.present, { project: false, global: true });
  assert.equal(r.gitRemote, 'git@github.com:o/r.git');
  assert.equal(r.files.project, '/proj/.promptr/tracker.json');
});

test('writeTrackerBinding refuses to clobber without force and writes with force', () => {
  const deps = fakeDeps({ '/proj/.promptr/tracker.json': text(gt) });
  const refused = writeTrackerBinding('/proj/.promptr/tracker.json', gh, { force: false }, deps);
  assert.equal(refused.ok, false);
  assert.match(refused.error, /already exists\. Nothing was written/);
  assert.equal(deps.files['/proj/.promptr/tracker.json'], text(gt));
  const ok = writeTrackerBinding('/proj/.promptr/tracker.json', gh, { force: true }, deps);
  assert.equal(ok.ok, true);
  assert.equal(deps.files['/proj/.promptr/tracker.json'], text(gh));
  assert.ok(!deps.files['/proj/.promptr/tracker.json'].includes('secret'));
});

// ---- parity audit item 1: workstreams issue adapter follows the bound repository ----
import { buildRoutingIndex, defaultRoutingConfig, issueLocator } from '../../dist/src/project/workstreams.mjs';

test('workstreams issue locator and fallback URL follow the bound repository for both providers', () => {
  const ghRepo = { host: 'https://github.com', owner: 'octo', repo: 'promptr', provider: 'github' };
  const gtRepo = { host: 'https://gitea.example.test', owner: 'octo', repo: 'promptr', provider: 'gitea' };
  const projects = [{ slug: 'promptr-abc123', cwd: '/w/promptr', lastActivity: NOW }];
  const io = { readFile: () => undefined, realpath: (p) => p };
  const build = (repo) => buildRoutingIndex(projects, [
    { kind: 'issue', projectKey: 'promptr-abc123', issue: { number: 65, title: 'Tracker binding', state: 'closed' }, ...(repo ? { repo } : {}) },
  ], io, defaultRoutingConfig(), { nowMs: () => Date.parse(NOW) }).entries[0];
  const g = build(ghRepo);
  assert.ok(g.sources.some((s) => s.locator === 'github#65'));
  assert.ok(g.validation.some((v) => v.command === 'github#65'));
  assert.ok(g.readFirst.some((l) => l.path === 'https://github.com/octo/promptr/issues/65'));
  const t = build(gtRepo);
  assert.ok(t.sources.some((s) => s.locator === 'gitea#65'));
  assert.ok(t.readFirst.some((l) => l.path === 'https://gitea.example.test/octo/promptr/issues/65'));
  assert.ok(build(undefined).sources.some((s) => s.locator === 'gitea#65'), 'no bound repo still yields a gitea-provider locator');
  assert.equal(issueLocator(ghRepo, 3), 'github#3');
});
