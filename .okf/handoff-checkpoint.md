---
type: Workflow
title: Handoffs and checkpoints
description: Manual checkpoints, staged handoffs, 200k auto-wrap, and catch-up digest.
tags: [promptr, handoff, checkpoint, catch-up, resume]
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

# Handoffs and checkpoints

Any agent can read local continuation; Pi automates it. Automatic
checkpoints and reconciliation follow the first connected trial. Handoff
packets are explicit and reviewable before any successor launch.

## Mechanisms

* **Manual checkpoint**: save useful progress with references; does not
  imply completion or acceptance.
* **Staged handoff (`/handoffr` v2)**: packaged `promptr-handoff` skill
  writes a validated handoff file plus receipt, syncs an
  [OpenKnowledge](/openknowledge-sync.md) history marker, then offers an
  explicit same-runtime successor in a new Herdr tab. No automatic prompt
  replay. Finalization runs after `agent_settled` with shutdown/epoch
  guards; nonzero/killed commands never claim success.
* **200k auto-wrap**: at 200k current conversation context (not
  cumulative), begin a bounded wrap-up and save the handoff. The TUI
  asks **Save for later** or **Continue now**; the latter launches a
  normal interactive Pi Coordinator via Herdr and submits the handoff
  live. No response defaults to save-only and never launches. Triggers
  once per source session; the old session stays a non-writing
  reference.
* **Catch-up (`c`, `/promptr-catchup`)**: deterministic digest plus a
  generator packet (`context.catchUp`) when activity is under 24h; draft
  section seeds the composer for explicit review.
* **Resume**: overview leads to the existing workspace; drafts are
  preserved. Resume offers Continue here / Start fresh after review.
  See [product vocabulary](/vocabulary.md).

## Where state lives

Local: `.promptr/` (briefing, handoffs, prompt-log JSONL, tracker
binding, retained revisions). Shared: `projects/<slug>/handoffs`
append-only. History is preserved with additive corrections.

## Verified behaviour

* `/handoffr` end to end: a validated handoff is written and synced, a successor
  is launched on the same runtime, and it receives exactly one prompt.
* The catch-up digest runs against the tracker and local history and names the
  sources it could not reach rather than silently omitting them.
  `/promptr-status` shows the cursor line; `/promptr-resume` lists staged
  handoffs.
* Companion TUI keystrokes cannot be driven from Herdr (there is no pane key
  injection), so keyboard-driven flows need a human at the keyboard.

