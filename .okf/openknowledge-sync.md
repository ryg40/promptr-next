---
type: Integration
title: OpenKnowledge sync
description: Per-project brief, inbox, workspace, handoffs, and prompt-log pages with local-first sync.
tags: [promptr, openknowledge, sync, briefing, prompt-log]
generated:
  by: process:promptr-okf
  at: 2026-09-14
sources:
  - id: extension-readme
    path: extension/README.md
    resource: https://github.com/ryg40/promptr-next/blob/main/extension/README.md
    last_modified: 2026-09-14
  - id: design
    path: docs/design.md
    resource: https://github.com/ryg40/promptr-next/blob/main/docs/design.md
    last_modified: 2026-09-14
stale_after: 2026-12-31
---

# OpenKnowledge sync

OpenKnowledge stores a private per-project tree usable outside Pi from
multiple clients. Saving is local-first; sync is best-effort. A failed
sync leaves the local copy authoritative with `pending`/`offline`
status and never blocks the TUI.

## Page tree

Slug: project directory basename, lowercased, `[^a-z0-9_-]` runs turned
into `-`, max 80 chars (`promptr`).

* `projects/<slug>/brief`: current orientation. Humans and Promptr edit;
  `replace` only after a read comparison. Local copy
  `<cwd>/.promptr/briefing.md` with history in `briefing-history/`.
  Never seed remotely outside Save + sync.
* `projects/<slug>/inbox`: owner-typed thoughts, one block each (`## `
  heading or `---`-separated group). Promptr reads and appends
  `<!-- promptr:queued <hash> <iso> -->` trailers (`position: append`);
  never edits owner text.
* `projects/<slug>/workspace`: Promptr-written mirror of queue/composer
  head (`replace`); humans read, edits are overwritten.
* `projects/<slug>/handoffs`: append-only handoffs, 200k wrap-ups,
  checkpoints. Corrections append, never rewrite.
* `projects/<slug>/prompt-log`: append-only prompt history (local JSONL
  source, batch markers, offline retention, reconnect catch-up).
* `projects/<slug>/okf-bundle`: single-page mirror of this `.okf/`
  bundle overview; replaced (never appended) on every bundle update,
  stamped with the commit hash it mirrors.

Do not touch the root `promptr.md` notebook; do not dump raw traces or
tool output into shared pages.

## Credentials and API

Origin `OPENKNOWLEDGE_ORIGIN` (user-supplied; there is no default),
Basic auth from
`OPENKNOWLEDGE_USERNAME` / `OPENKNOWLEDGE_PASSWORD` at request time.
Reads are `GET /api/document?docName=...`; creates are
`POST /api/create-page`; writes are `POST /api/agent-write-md` with
`clientName: promptr`. 404 is missing, 401 is auth, anything else is
offline.

## Related

* [Handoffs and checkpoints](/handoff-checkpoint.md) for what gets appended.
* [Install and operations](/install-operations.md) for credential setup.
