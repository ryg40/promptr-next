# Pre-release checklist

A generic checklist for cutting a Promptr release. Nothing here is a claim that
a particular release passed: record the actual results next to each item.
Acceptance is never inferred from a green build.

## 1. Source checks

Run from `extension/`:

| Check | Expectation |
| --- | --- |
| `npm run build` | clean |
| `npm run typecheck` | clean |
| `npm test` | full suite passes, zero failures |
| `npm run smoke` | every offline smoke check passes (companion self-check, workflow init `--print`, init `--keep-models` and refuse-overwrite, doctor against an isolated agent dir, tracker init, package inventory) |
| `npm pack --dry-run` | ships `dist/`, `skills/`, `examples/`, `index.ts`, `package.json`, `README.md`; ships no `src/`, `test/` or `node_modules/` |
| `git diff --check` | clean |

## 2. Fresh-client install trial

Run with `HOME` and `PI_CODING_AGENT_DIR` pointing at empty scratch directories,
with no credentials exported, using the real `scripts/install.mjs`:

1. `node scripts/install.mjs --agent-dir <scratch>/agent --backup-root <scratch>/backups --tag release-trial`
   packs, unpacks, installs production dependencies only, and lands `dist/`,
   `skills/`, `examples/` and `node_modules/` under
   `<scratch>/agent/extensions/promptr`.
2. Importing the installed entrypoint exposes the extension function without
   launching Pi.
3. `promptr-doctor --cwd <empty project>` inside that environment reports no
   failures: `ok` for Node, Pi, Herdr, the installed copy and the packaged
   skills; `warn` for a missing capability probe and missing knowledge-base
   credentials; `info` for no binding and no state yet.
4. No path from the building machine appears anywhere in the installed tree.

This trial deliberately does not start Pi, open a companion, or touch the
knowledge base. Those are interactive steps below.

## 3. Interactive trial

Each step is a separate, explicitly authorized action.

1. **Install** — `npm run build && npm run install:local`, `/reload` in Pi,
   close and reopen `/coordinatr`, then `/promptr-doctor`.
2. **Registry** — `/promptr-workflows check` reports every Pi-route role `ok`
   (roles dispatched to another harness report `unverifiable`);
   `/promptr-workflows probe` writes the capability file and the doctor then
   reports the probe `ok`; the next generator launch names the file it checked
   against.
3. **Workboard** — focus the board and confirm a map thread renders its children
   indented beneath it with a free-standing section for the rest. With the
   network off, `r` shows an `offline` marker and keeps the existing rows.
4. **History round trip** — queue an item, delete it, send one, save the
   briefing, then close the companion. The local `prompt-log.jsonl` and the
   synced prompt-log page both hold the add, the delete, the send attempt and
   the briefing save, in order, with a batch marker. Reopening appends nothing
   twice.
5. **Offline then reconnect** — disconnect, make two queue changes (the header
   shows a pending state), reconnect, and confirm the header returns to a synced
   state with exactly one new batch on the page.
6. **Second client** — on another machine: install, export credentials,
   `/coordinatr`, connect the knowledge base with the project id, then read the
   shared workspace and shared history. Confirm the pages read correctly, that
   saving produces a resume draft, and that nothing was sent until *Continue
   here* was chosen. Confirm the first mirror from that client archived the
   other machine's workspace rather than overwriting it.
7. **Alternative provider client** — `promptr-workflows-init --provider <id>
   --all-pi --keep-models`, log in to that provider in Pi,
   `/promptr-workflows check` reports every role `ok`, the picker offers only
   that provider, and a generator launch runs on it. `pi --list-models` after
   login is the authority on model IDs.
8. **Disable and uninstall** — `/coordinatr off` keeps the pane and the data;
   `node scripts/install.mjs --uninstall` leaves the state root and every
   project's `.promptr/` intact.

## 4. Release hygiene

- `CHANGELOG.md` has a section for this version summarizing user-visible
  changes, with no internal issue numbers, commit hashes or session details.
- `README.md` limitations match what actually ships.
- `extension/README.md` requirements table matches the versions the checks above
  were run against.
- No credential, host, account name or machine path appears in any tracked file.
- The `.okf/` bundle validates and its `log.md` records the release.

## Known limitations to restate at release

- One tracker repository per project at a time. Issue identity already carries
  the provider, so a multi-repository portfolio is possible but not built.
- GitHub `blocked_by` dependencies need a recent API version; repositories
  without it report `unknown`, never `ready`.
- Workspace and brief writes are last-write-wins after a read; there is no lock
  or conditional write. The prompt-log is the durable history.
- The prompt-log page grows without rotation; the local JSONL is bounded per
  entry and read up to a fixed entry count.
- The Pi-hosted view syncs the prompt-log on open and close only; the companion
  syncs on a debounce and on each reachability tick.
- Capability checks cover Pi-route roles; roles dispatched through Herdr to
  another harness are reported `unverifiable`.
- The generator, Start fresh and `/coordinatr` need Herdr; without it the
  Pi-hosted view remains.
