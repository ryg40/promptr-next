---
type: Product
title: Promptr overview
description: Non-critical Pi companion for carrying project work between coding sessions.
tags: [promptr, pi, companion, briefing, resume]
generated:
  by: process:promptr-okf
  at: 2026-09-14
sources:
  - id: readme
    path: README.md
    resource: https://github.com/ryg40/promptr-next/blob/main/README.md
    last_modified: 2026-09-14
  - id: extension-readme
    path: extension/README.md
    resource: https://github.com/ryg40/promptr-next/blob/main/extension/README.md
    last_modified: 2026-09-14
stale_after: 2026-12-31
---

# Overview

Promptr is a supplemental convenience tool, not a critical system.
It helps carry project work between coding sessions without
reconstructing context from scratch. Occasional lost prompts are
acceptable; enterprise resilience is explicitly out of scope.

The Pi extension source is published under `extension/` with
installation, configuration, shortcuts and recovery documented in the
[install guide](/install-operations.md). A separate installed copy lives
under the Pi agent directory; editing the checkout changes nothing until
rebuild and reinstall.

## Direction

Make the prototype effortless to use, then improve it from real use.
A TUI project overview connects to per-project
[OpenKnowledge briefings](/openknowledge-sync.md) with explicit Resume
actions. See [system architecture](/architecture.md) and
[product vocabulary](/vocabulary.md).

## Entry points

* New task and Resume live inside the `/coordinatr` companion (`Ctrl+O`),
  documented in [companion workspace](/companion-workspace.md).
* The configured tracker owns task state; a map issue indexes
  decisions. See [project tracking](/tracking.md).
* Continuation packets, checkpoints and successor handoffs are covered in
  [handoffs and checkpoints](/handoff-checkpoint.md).
