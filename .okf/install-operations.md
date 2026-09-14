---
type: Operations
title: Install and operations
description: Fresh-client install, tracker binding, doctor checks, and uninstall.
tags: [promptr, install, doctor, tracker-init, operations]
generated:
  by: process:promptr-okf
  at: 2026-09-14
sources:
  - id: extension-readme
    path: extension/README.md
    resource: https://github.com/ryg40/promptr-next/blob/main/extension/README.md
    last_modified: 2026-09-14
  - id: checklist
    path: docs/release-checklist.md
    resource: https://github.com/ryg40/promptr-next/blob/main/docs/release-checklist.md
    last_modified: 2026-09-14
stale_after: 2026-12-31
---

# Install and operations

## Fresh client

```sh
git clone <this repository> && cd promptr/extension
npm ci --ignore-scripts
ln -sfn "$(npm root -g)/@earendil-works/pi-coding-agent" node_modules/@earendil-works/pi-coding-agent
npm run build && npm run typecheck && npm test && npm run smoke
npm run install:local
```

`install:local` packs the extension, unpacks into
`<PI_CODING_AGENT_DIR|~/.pi/agent>/extensions/promptr`, installs
`pi-tui`, and backs up any previous copy to
`~/.local/share/promptr-handoffs/install-backups/<stamp>-<tag>/`.
Then bind the tracker (`promptr-tracker-init --provider gitea|github`),
`/reload` in Pi, reopen `/coordinatr`, and run `/promptr-doctor`.

## Configure

Environment plus one optional tracker binding file; nothing goes into
Pi `settings.json`. Required: Node 22.22–22.x, Pi 0.85.x, Herdr 0.9.x
for the split companion. Optional: OpenKnowledge origin plus
`OPENKNOWLEDGE_USERNAME`/`OPENKNOWLEDGE_PASSWORD`; tracker tokens
`GITEA_TOKEN`/`GITHUB_TOKEN`. See
[OpenKnowledge sync](/openknowledge-sync.md) and
[project tracking](/tracking.md).

## Verify and recover

* `promptr-doctor` / `/promptr-doctor` (add `--online` for bound brief
  plus tracker page-1 reads); `/promptr-tracker status`;
  `/promptr-workflows check|probe`; `npm run smoke`.
* Uninstall: `node scripts/install.mjs --uninstall`. Durable data is
  untouched: `<agent dir>/promptr/` and every project's `.promptr/`.
* Editing the checkout never updates the installed copy until rebuild +
  reinstall; a running companion needs reopen/reload to pick it up.

## Release checks

`docs/release-checklist.md` holds the pre-release checklist: source checks, a
fresh-client scratch install into empty scratch directories with no credentials
exported, then an interactive trial covering the registry probe, workboard tree,
history round trip, offline then reconnect, a second client, an
alternative-provider client, and disable/uninstall.

Verified behaviour: an empty-HOME scratch install succeeds, the installed module
imports, and a credential-free doctor reports no failures with honest
unconfigured states. Uninstall removes the copy (backup retained, durable state
untouched) and reinstall succeeds; a scratch trial never touches a live install.
Fixture tests are not live acceptance — human TUI judgment, a second physical
client and an alternative-provider login stay manual steps.

## Related

* [OpenKnowledge sync](/openknowledge-sync.md)
* [Project tracking](/tracking.md)
