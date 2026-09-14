# Changelog

All notable changes to Promptr are recorded here. Promptr is an early prototype;
interfaces and on-disk formats may change without a migration path.

## Unreleased

### Fixed

- **Private GitHub repositories cloned as `www.github.com/ORG/repo.git`.** The
  `origin` remote parser now folds the `www.` alias (and a plain `http://`
  scheme) of github.com onto `https://github.com`, so such a checkout binds to
  its GitHub tracker instead of reporting *unbound*. `ssh://git@host/…` remotes
  and https remotes carrying embedded credentials are also recognised; any
  userinfo in the URL is dropped and never stored. A GitHub 404 read without
  `GITHUB_TOKEN` now says "private repository? set GITHUB_TOKEN", since GitHub
  hides private repositories behind 404 rather than 403.

## 0.1.0 — first public release

First public source release of the Pi extension and its documentation. The
capabilities below were developed and used privately before this release and are
distilled here without their internal issue history.

### Added

- **Companion workspace.** A per-project prompt queue, composer and notebook,
  available both as a Pi-hosted view (`/promptr`) and as a Herdr companion pane
  (`/coordinatr`). Both surfaces share the same on-disk state, so either can be
  opened, closed and reopened without losing work.
- **Explicit one-item send.** `Ctrl+S` reviews the exact text of a single queued
  item before submission; confirming sends only that item. Nothing drains,
  retries or dispatches automatically, and an attempted item is never reported
  as delivered.
- **Queue management.** Clear Queue with a counted confirmation, card actions on
  individual queue entries, and an archive of every queued composer prompt back
  into the project notebook.
- **Read-only issue tracking.** Gitea and GitHub adapters behind one port, with
  bounded paged fetches, a cached snapshot that always shows its age, sanitized
  issue text, and native dependency support where the provider exposes it.
- **Tracker binding.** `promptr-tracker-init` and `/promptr-tracker init` write a
  secret-free binding file; precedence runs environment override, project file,
  global file, then the `origin` remote on a known host. An unbound project
  reports that state explicitly and refuses to guess a repository.
- **Workboard tree.** Open issues grouped into active, ready, review, blocked and
  later, with a map thread rendering its children as an indented tree and a
  free-standing section for the rest.
- **Generate Prompt flow.** Selecting an issue drafts a Coordinator prompt
  deterministically, with a route and budget summary, a context-hygiene and
  single full-suite verification gate, a diff-scoped review brief with a
  follow-up bucket, and a pre-authorized provider quota fallback line. The draft
  is reviewed before it is ever queued or sent.
- **Delegated execution modes.** Roles can be dispatched either through
  background subagents or as interactive sessions in visible Herdr tabs, with
  launch, keep-interactive, quota-switch, collect-then-close and one-writer rules
  emitted into the prompt.
- **Workflow overrides.** One machine-local JSON file retargets provider, model
  and thinking level per workflow level and role, initialized by
  `promptr-workflows-init` with refuse-overwrite, `--print`, `--keep-models` and
  placeholder-rejection behaviour. Packaged examples ship with the extension.
- **Capability checks.** `/promptr-workflows check` and `probe` verify roles
  against the live model registry and record the result, reporting roles
  dispatched to another harness as `unverifiable` rather than guessing.
- **Checkpoints and handoffs.** Manual checkpoints, automatic checkpoints with a
  global kill switch, validated handoff packets carrying goal, progress, next
  action and references, successor launch on the same runtime, and an auto-wrap
  that stages a handoff as the context limit approaches.
- **Catch-Me-Up.** A digest of tracker issues, comments and local history since a
  chosen point, with honest gap reporting when a source is unreachable.
- **OpenKnowledge sync.** Optional per-project brief, inbox, workspace, handoff
  and prompt-log pages; connect, read shared workspace and history from a second
  client, and resume from a shared briefing. Documented as last-write-wins with
  the append-only prompt-log as the durable record.
- **Shared prompt-log.** An append-only local JSONL plus a synced page recording
  queue adds and deletes, send attempts, note revisions and briefing saves in
  order, with batch markers so a reopen never appends twice.
- **Workspace mirror.** The first sync from a new client archives the previous
  client's workspace rather than overwriting it.
- **Herdr identity contract.** One exact-match workspace/tab/pane identity shared
  by the launcher, generator, direct send, briefing and handoff paths, with
  terminal invalidation and reopen guidance when the binding identity changes.
- **Portable installation.** `scripts/install.mjs` packs, unpacks and installs
  into the Pi agent extensions directory with a timestamped backup of the
  previous copy, plus `--dry-run` and `--uninstall`. No path from the building
  machine is baked into the package. Uninstall leaves durable project data
  intact.
- **Doctor.** `promptr-doctor` and `/promptr-doctor` report Node, Pi and Herdr
  versions, the installed copy, packaged skills, the capability probe, the
  resolved tracker binding and its source, and — with `--online` — one bounded
  tracker and knowledge-base read.
- **Knowledge bundle.** An Open Knowledge Format bundle under `.okf/` describing
  the product, vocabulary, architecture, workspace, tracking, sync, handoff,
  workflow and installation concepts for agents working on the repository.
- **Terminal UI.** Full-width section rules, focus-following section and editor
  highlighting, progress bars for tracker milestones, ANSI-aware width handling
  that never splits content with escape codes, and `NO_COLOR` support.

### Security

- Credentials are read from the process environment only, sent as request
  headers, and never logged, persisted, bundled or written to a tracked file.
  Binding and override files hold hosts and identifiers only, with no field able
  to carry a key, token or base URL.
- Issue and page text is treated as untrusted input and is escaped before it
  reaches the terminal.
