---
type: Workflow
title: Workflows and providers
description: Per-client provider/model/thinking overrides, capability probes, and prompt generation.
tags: [promptr, workflows, providers, generator, models]
generated:
  by: process:promptr-okf
  at: 2026-09-14
sources:
  - id: overrides
    path: docs/workflow-overrides.md
    resource: https://github.com/ryg40/promptr-next/blob/main/docs/workflow-overrides.md
    last_modified: 2026-09-14
  - id: extension-readme
    path: extension/README.md
    resource: https://github.com/ryg40/promptr-next/blob/main/extension/README.md
    last_modified: 2026-09-14
stale_after: 2026-12-31
---

# Workflows and providers

Per-client workflow intelligence (provider, model, thinking per role)
is configured during install/init and kept in an editable local JSON
override. No silent provider fallback: the only pre-authorized runtime
change is the catalog's `Provider quota fallback (pre-authorized):`
instruction, which names the next provider in picker order for
usage-limit errors on Pi-route roles; an override recomputes it from its
own provider list. Credentials never live in overrides.

## Override model

* File: `PROMPTR_WORKFLOWS_FILE` (default
  `<agent dir>/promptr/workflows.json`); capability probe:
  `PROMPTR_WORKFLOW_CAPABILITIES` (default
  `<agent dir>/promptr/capabilities.json`, written by
  `/promptr-workflows probe`).
* Init: `promptr-workflows-init --provider <name>` (`--keep-models`,
  `--all-pi` for Copilot-only machines); inspect with
  `/promptr-workflows status|check|probe`.
* Configured workflows require a readable probe; malformed thinking and
  unknown default providers are rejected. Dispatch reads the probe and
  reports `runtime unverified` when absent.
* Model-role guidance: inexpensive scout/review, stronger planning only
  when needed, capable workers. Validate actual model names; examples
  are not runtime IDs.

## Shipped workflow matrix

* `openai-codex-simple`: Sol xhigh coordinator, Sol medium worker.
* `openai-codex-medium`: Astra low coordinator, Sol medium worker.
* `openai-codex-high`: Astra medium coordinator, Astra low worker.
* `openai-claude-simple`: Sol xhigh coordinator, Claude Opus 5 high worker and Claude Sonnet 5 high reviewer through Herdr.
* `openai-claude`: Astra low coordinator with the same Claude worker/reviewer route.

All templates retain Luna xhigh scout/researcher stages and a Sol medium generator. Both `*-simple` templates require a well-developed task and reject unresolved design.

## Prompt generation

Preview-pane `g` prepares a packet, drops a deterministic draft for
explicit review, then starts a fresh Pi in a new Herdr tab with a pinned
skill/tool allowlist, polls to idle/done, validates `output.md`, and
replaces the draft only if unedited. Overrides:
`PROMPTR_GENERATOR_RUNTIME=<provider>/<model>:<thinking>`,
`PROMPTR_GENERATOR_SKILL=<path>`. The generator skill ships versioned
in `extension/skills/promptr-generate-task-prompt/` (v5).

Execution mode: after the provider, the picker asks whether delegated
roles run through the headless `pi-subagents` tool (default) or as
`herdr-native` interactive Pi sessions, one visible Herdr tab per role
named `<prefix>-<suffix>`, that a person can watch, type into and
`/model`-switch mid-run. The packet carries `workflow.execution`; the
catalog, draft and skill emit the mode's launch, interactivity, quota,
collect-then-close and one-writer rules.

Both the deterministic draft and the skill carry the token-efficiency
token-efficiency contract: a `Route and budget`
section (solo implementation at five or fewer source files with no new
module, one worker packet otherwise, context hygiene, full suite once
before review and once before commit, at most one handoff), a
diff-scoped reviewer brief with a `FOLLOW-UP:` bucket for hardening the
issue does not name, a re-review brief over the repair diff only, and
Coordinator self-review under 200 changed lines.

## Related

* [Install and operations](/install-operations.md) for init commands.
* [Companion workspace](/companion-workspace.md) for the `g` flow entry.
