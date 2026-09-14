---
type: Integration
title: Project tracking
description: Gitea/GitHub tracking with Wayfinder map tree and one tracker per project.
tags: [promptr, tracking, gitea, github, wayfinder]
generated:
  by: process:promptr-okf
  at: 2026-09-14
sources:
  - id: extension-readme
    path: extension/README.md
    resource: https://github.com/ryg40/promptr-next/blob/main/extension/README.md
    last_modified: 2026-09-14
  - id: tracking-design
    path: docs/project-tracking.md
    resource: https://github.com/ryg40/promptr-next/blob/main/docs/project-tracking.md
    last_modified: 2026-09-14
stale_after: 2026-12-31
---

# Project tracking

The configured tracker owns task state. A map issue indexes decisions;
its child tickets own their resolution details. Local Markdown is an entry point
and session snapshot, not a second task database.

## Binding

* Provider: Gitea (default) or GitHub, read-only, one repository per
  project.
* Precedence: `PROMPTR_TRACKER` env > project `.promptr/tracker.json` >
  global `<agent dir>/promptr/tracker.json` > `origin` remote on a known
  host > Gitea default.
* Bind with `promptr-tracker-init --provider gitea|github` or
  `/promptr-tracker init`; verify with `/promptr-tracker status` and
  `promptr-doctor --online`. Tokens (`GITEA_TOKEN` / `GITHUB_TOKEN`)
  stay in the environment; the binding file holds no secrets and may be
  committed.
* GitHub adapter supports `blocked_by` dependencies with honest
  unavailable/unconfigured states.
* Provider switches rebind atomically: new provider kept, old
  selection/preview dropped, stale reads cancelled.

## Verified behaviour

* A page-1 tracker check is reachable for both providers; the hosted and shell
  doctors agree on the bound repository, and an environment override reports
  `source env`. Binding a second project non-interactively works.
* The `/promptr-tracker init` dialog refuses an empty owner or repo rather than
  inferring one from `origin`; typing owner and repo, with defaults and an
  overwrite confirmation, binds. Companion rows follow the binding.

## Board semantics

The companion fetches the tracker itself on start, every 5 minutes, and
on `r`. Open issues group into active/ready/review/blocked/later with
native dependencies; map threads render child rows with explicit cache
age and best-effort local cache. See
[companion workspace](/companion-workspace.md).

## Canonical references

The tracker repository bound for the project is the canonical reference.
Promptr hardcodes no tracker link, and neither does this bundle.
