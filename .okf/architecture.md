---
type: Architecture
title: System architecture
description: Pi extension, companion TUI, Herdr panes, tracker adapters, and OpenKnowledge pages.
tags: [promptr, architecture, pi-extension, herdr, gitea, openknowledge]
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

# Architecture

Promptr is a Pi extension (`extension/`, TypeScript, Node >=22.22 <23)
that loads inside Pi 0.85.x and renders a companion TUI in a Herdr 0.9.x
right pane. The hosted `/promptr` view works without Herdr; the full
`/coordinatr` split companion needs it.

## Components

* **Queue / composer / notebook**: the working surface. Exact fenced
  text, one-item explicit send, no auto-drain or retry. See
  [companion workspace](/companion-workspace.md).
* **Tracking**: Gitea (default) or GitHub read-only adapters, one
  tracker per project, Wayfinder map/child tree. See
  [project tracking](/tracking.md).
* **OpenKnowledge sync**: per-project `brief`, `inbox`, `workspace`,
  `handoffs`, `prompt-log` pages; local-first with best-effort sync. See
  [OpenKnowledge sync](/openknowledge-sync.md).
* **Handoff / checkpoint**: manual checkpoints, staged successor
  handoffs, 200k auto-wrap, catch-up digest. See
  [handoffs and checkpoints](/handoff-checkpoint.md).
* **Generation / workflows**: Coordinator prompt packets, generator Pi
  launch, per-client provider/model/thinking overrides. See
  [workflows and providers](/workflows-providers.md).

## Stable constraints

* Pi, Herdr, a wiki, and Coordinator-led role-based delegation are the
  six-month stable foundation.
* Pi + model choices are hypotheses: inexpensive scout/review models,
  stronger planning only when needed, capable workers.
* Credentials are never bundled, stored, or printed; they come from the
  launching shell environment. See
  [install and operations](/install-operations.md).
* Last-write-wins shared state; the prompt-log is the durable history.
* `extension/` is published source; `~/.pi/agent/extensions/promptr/` is
  a separate installed copy.
