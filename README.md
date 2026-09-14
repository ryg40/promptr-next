# Promptr

Promptr is a Pi coding-agent extension for carrying project work between coding
sessions without rebuilding context from scratch. It gives a Pi + Herdr session a
prompt queue, a composer and a per-project notebook in one companion pane; reads
your issue tracker read-only to show what is in flight; turns a selected issue
into a Coordinator prompt you review before it is ever sent; and records
checkpoints and handoff packets so a successor session can pick the work up.
Every send is explicit and one item at a time — nothing drains, retries or
launches by itself.

## Status

Early prototype. It is used daily by its author and is not an enterprise-grade
system: occasional lost prompts or stale context are acceptable trade-offs for a
convenience tool. Interfaces and file formats may change without a migration
path. Feedback and issues are welcome at
<https://github.com/ryg40/promptr-next>.

## What it does

- **Queue, composer and notebook workspace** — a companion pane (`/coordinatr`)
  and a Pi-hosted view (`/promptr`) share the same per-project queue, composer
  and notebook. Selecting note text copies it into the queue without deleting
  it; queued composer text is archived back into the note.
- **Explicit send** — `Ctrl+S` opens a review of the exact text of one queued
  item. Confirming submits that item and only that item. *Attempted* is never
  reported as *delivered*.
- **Tracker-driven Coordinator prompts** — Gitea or GitHub issues are read
  read-only and grouped into active / ready / review / blocked / later, with a
  map thread rendering its children as an indented tree. Choosing an issue runs
  a Generate Prompt flow that drafts a Coordinator prompt with a route, a
  verification gate and a provider fallback line, which you review before
  queueing.
- **Checkpoints and handoffs** — manual checkpoints save a progress observation;
  a staged handoff writes a validated continuation packet (goal, progress, next
  action, references) and can launch a successor session with it. A context
  auto-wrap triggers one near the context limit.
- **OpenKnowledge project pages** — optional two-way sync of per-project brief,
  inbox, workspace, handoff and prompt-log pages, so a second client can read
  where the work stands before choosing to continue. Everything works locally
  without it.
- **Workflow overrides** — one machine-local JSON file retargets the shipped
  role matrix onto whatever provider, models and thinking levels that machine
  actually has (for example a GitHub Copilot-only client), with no source edit.

## Install

The extension source lives in [`extension/`](extension/README.md); that README
is the authority on requirements, install, shortcuts, commands and recovery. In
short: build and test in `extension/`, run `npm run install:local`, bind a
tracker with `promptr-tracker-init`, then `/reload` in Pi.

The checkout and the installed copy under the Pi agent extensions directory are
separate. Editing this repository changes nothing until you rebuild and
reinstall.

## Configuration

All configuration is user-supplied; Promptr ships no host, account or credential
defaults and never writes secrets to a tracked file. Credentials are read from
the environment of the process that runs Promptr — a companion pane needs them
exported in its own shell.

| Variable | Meaning |
| --- | --- |
| `PI_CODING_AGENT_DIR` | Pi agent directory; Promptr state lives in `<agent dir>/promptr/` |
| `PROMPTR_TRACKER` | `gitea` or `github`; overrides every tracker binding file |
| `GITEA_HOST`, `GITEA_OWNER`, `GITEA_REPO`, `GITEA_TOKEN` | Gitea tracker binding and token |
| `GITHUB_HOST`, `GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_API`, `GITHUB_TOKEN` | GitHub tracker binding and token |
| `OPENKNOWLEDGE_ORIGIN` | HTTPS origin of your OpenKnowledge deployment |
| `OPENKNOWLEDGE_USERNAME`, `OPENKNOWLEDGE_PASSWORD` | Basic-auth credentials, read at request time |
| `PROMPTR_WORKFLOWS_FILE`, `PROMPTR_WORKFLOW_CAPABILITIES` | paths to the workflow override and capability probe files |

Without a tracker binding Promptr reports an explicit unbound state and tells
you how to bind one; it never guesses a repository. `.promptr/` in a project
holds local working data and is gitignored.

## Known limitations

- Workspace and brief writes are last-write-wins after a read; there is no
  conditional write or lock. The prompt-log is the durable history.
- One tracker repository per project at a time. A portfolio spanning several
  repositories or providers at once is not built.
- GitHub `blocked_by` dependencies need a recent API version; repositories
  without it report `unknown`, never `ready`.
- The prompt-log page grows without rotation; the local JSONL is bounded per
  entry and read up to a fixed entry count.
- `/coordinatr`, Start fresh and the prompt generator need Herdr; without it the
  Pi-hosted view remains.
- Capability checks cover Pi-route roles; roles dispatched through Herdr to
  another harness are reported `unverifiable`.
- Some flows — reconnect after a long offline period, a second client, and a
  Copilot-only client — are exercised by fixtures but have had limited live use.

## Documentation

- [Extension setup, commands and recovery](extension/README.md)
- [Agent entry point](AGENTS.md) · [Product vocabulary](CONTEXT.md)
- [Design notes](docs/design.md)
- [Workflow overrides](docs/workflow-overrides.md)
- [Companion parity, direct send and TUI notes](docs/coordinatr-parity-tui.md)
- [Pi extension preview guide](docs/pi-extension-preview.md)
- [Interaction prototype demo guide](docs/prototype-demo.md)
- [Tracker integration design](docs/project-tracking.md)
- [Pre-release checklist](docs/release-checklist.md)
- [Runtime and API research](docs/research/runtime-contracts.md)
- [Source inspiration review](docs/research/inspiration-review.md)
- [Knowledge bundle for agents](.okf/index.md)

The `docs/` tree preserves design findings and research. It is not a status
board: the configured issue tracker owns task state.

## License

MIT — see [LICENSE](LICENSE).
