---
type: Workflow
title: Companion workspace
description: Queue, composer, notebook, and workboard inside the /coordinatr companion.
tags: [promptr, companion, queue, workboard, coordinatr]
generated:
  by: pi/gpt-5.6-sol
  at: 2026-09-14
sources:
  - id: extension-readme
    path: extension/README.md
    resource: https://github.com/ryg40/promptr-next/blob/main/extension/README.md
    last_modified: 2026-09-14
  - id: parity
    path: docs/coordinatr-parity-tui.md
    resource: https://github.com/ryg40/promptr-next/blob/main/docs/coordinatr-parity-tui.md
    last_modified: 2026-09-14
  - id: herdr-identity
    path: extension/src/herdr/identity.mts
    resource: https://github.com/ryg40/promptr-next/blob/main/extension/src/herdr/identity.mts
    last_modified: 2026-09-14
stale_after: 2026-12-31
---

# Companion workspace

Primary flow: in Pi run `/coordinatr`. Pi stays left; the companion
opens in a right Herdr pane bound to that Pi (`--pi-pane`,
`--project-cwd`, `--pi-session`). Herdr workspace, tab, and pane IDs may use
alphanumeric suffixes. One exact-match validator covers layout, generator,
direct send, briefing and handoff paths; it rejects malformed/newline-terminated
IDs and requires created panes to retain the expected workspace prefix.

## Surface

* **Queue**: proqi-style prompt cards, one-item explicit send/review,
  edit/duplicate/delete with session-only undo. Attempted is never
  delivered.
* **Composer**: draft area with deterministic drafts and archive; the
  generator flow drops a packet-derived draft here.
* **Notebook**: per-project notes with entry navigation and queue/send
  actions.
* **Workboard**: live Gitea-driven groups
  (`active/ready/review/blocked/later/unknown`), map thread rows,
  inline cursor navigation, detail on Enter, `g` to generate a prompt,
  `r` to refresh, `e`/`d`/`w` for card actions. Header shows branch,
  git dirty marker, and bound Pi pane status.

## Keys (stable subset)

`?` key reference, `g` generate, `p` requests browser, `c` catch-up,
`r` refresh tracking/inbox, `Ctrl+O` dialogs, `Ctrl+N` new note,
`Ctrl+C y` close companion. Full list: `promptr-companion-spike --help`
and the extension README.

## Related

* [System architecture](/architecture.md) for where the companion sits.
* [Project tracking](/tracking.md) for the workboard data source.
* [Handoffs and checkpoints](/handoff-checkpoint.md) for resume flows.
