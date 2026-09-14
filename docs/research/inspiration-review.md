# Source inspiration for Promptr

Scope: source/document/test inspection only. Neither project was installed, built, or exercised live. No upstream implementation was copied. Both sources are MIT licensed; preserve notices if code is reused later. Existing Herdr skills were excluded from the design as requested.

## Proqi

Source: [oborchers/proqi at d3f31cf153087a618445726b27dc25a33083dabf](https://github.com/oborchers/proqi/tree/d3f31cf153087a618445726b27dc25a33083dabf). Inspected Cargo version: **0.8.0**. It is a standalone Rust/Ratatui prompt composer, **not a Pi extension**, with Herdr-based Pi support. Some feature-inventory version headings lag current source; do not treat every documented claim as live verification on this host.

### Adopt/adapt

| Evidence | Promptr recommendation |
|---|---|
| [Durability tests](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/tests/ui_board/durability.rs): saving is acknowledged; save failure cancels quit; retry/export paths | Distinguish pending/local-durable/remote-synced. Protect unsaved in-memory data on local disk failure. Ordinary remote outage must still allow local editing. |
| [Submission journal tests](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/tests/sqlite_store/submission.rs): prepared recovers cancelled, sending recovers outcome_unknown without source removal | Durable dispatch intent/ack state; human reconciliation of uncertain attempts, no blind replay |
| [Herdr submission source](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/src/adapters/herdr/submission.rs): revalidate target and match receipt/session | Bind transport to the intended Coordinator and distinguish delivery acceptance from completion |
| [Pi qualification](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/context/harnesses/pi.md): idle/done distinction and concurrent-sender/native-input boundary limitation | Prefer Pi-native session-bound submission to terminal text injection; test main-editor draft preservation |
| [Fairness tests](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/tests/pty/fairness.rs) | IPC/sync floods must not starve typing, resize, pause, or quit |
| [Transformations tests](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/tests/ui_board/transformations.rs) and [feature inventory](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/context/FEATURE_INVENTORY.md) | Restart-safe undo/redo, recoverable deletion, exact split/duplicate/extract/merge for drafts; scratchpad extraction stays copy-only |
| [Reflow source](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/src/ui/paste_reflow.rs) and [tests](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/tests/ui_board/paste_reflow.rs) | Exact paste by default; explicit reversible prose reflow; fold presentation without changing submitted text |
| [Invocation catalog](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/docs/INVOCATIONS.md) | Pi-aware command/skill completion, bounded fuzzy search, provenance and inert insertion; prefer live Pi command metadata |
| [Clipboard race tests](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/tests/ui_board/clipboard.rs) | Non-destructive clipboard failures, generation-bound async results, explicit copy-only rescue mode |
| [README](https://github.com/oborchers/proqi/blob/d3f31cf153087a618445726b27dc25a33083dabf/README.md) | Contextual palette/help, keypress inspector/portable shortcuts, local attachments with truthful platform boundaries |

### Do not inherit

- Default submit-and-remove: Promptr keeps original note text.
- Local-only/no-cloud product restriction: Promptr explicitly needs two-way OpenKnowledge sync.
- Multi-agent target picking as the MVP default: Promptr is tied to its Coordinator session.
- macOS Screenshot Inbox as a Linux promise; attachments are later, explicit and local-first.
- Whole Rust/SQLite architecture or self-updater merely because Proqi has them. Plain local Markdown is required; choose the smallest sound complementary persistence model.
- Claimed exactly-once effects or atomic target preconditions not actually supplied by the runtime.

## Omakase Skills / Omakase Bar

Source: [itama8/omakase-skills at 3778c26b15a8e8da9815ed23f986e66800857bfd](https://github.com/itama8/omakase-skills/tree/3778c26b15a8e8da9815ed23f986e66800857bfd).

This repository supplies adaptable Markdown playbooks plus an actual project-local Pi extension. It is not a cross-project recent-session tracker or a ready-made Promptr sync layer.

### Evidence and adaptation

- [Checkpoint map skill](https://github.com/itama8/omakase-skills/blob/3778c26b15a8e8da9815ed23f986e66800857bfd/skills/omakase-checkpoint-map/SKILL.md): compact durable routing row—workstream/status/current state/last checkpoint/next checkpoint/read first/code entry. Adapt to existing project sources and keep Gitea authoritative, not a second writable task database.
- [Session orientation](https://github.com/itama8/omakase-skills/blob/3778c26b15a8e8da9815ed23f986e66800857bfd/skills/omakase-session-orient/SKILL.md): choose one workstream and load only its read-first context. This is the right cold-start shape for generated Coordinator prompts.
- [Session handoff](https://github.com/itama8/omakase-skills/blob/3778c26b15a8e8da9815ed23f986e66800857bfd/skills/omakase-session-handoff/SKILL.md): goal/scope, files, changes, validation, user result, issues, next action and real commit traceability. Unfinished work is not accepted closeout; never invent SHAs.
- [Checkpoint method](https://github.com/itama8/omakase-skills/blob/3778c26b15a8e8da9815ed23f986e66800857bfd/references/checkpoint-method.md): coherent runnable slices and explicit planned/implemented/user-testing/stable/blocked/regressed states. Adopt evidence distinctions, not the project's automatic commit policy.
- [Routing guide](https://github.com/itama8/omakase-skills/blob/3778c26b15a8e8da9815ed23f986e66800857bfd/references/planning-and-architecture-routing.md): use the lightest sufficient process and preserve role/authority boundaries. Adapt into Coordinator/Researcher/Worker/Reviewer packets, with optional roles and one writer per worktree.
- [Actual extension index](https://github.com/itama8/omakase-skills/blob/3778c26b15a8e8da9815ed23f986e66800857bfd/extensions/omakase-bar/index.ts): `/work-status`, card menus, linked docs, `startPrompt`, `setSessionName`, and `sendUserMessage`. Promptr should separate browse/inspect/generate/explicit-start, not immediately start a turn when selecting a workstream. Do not hardcode Neovim or require Omakase's skill names.
- [Actual model](https://github.com/itama8/omakase-skills/blob/3778c26b15a8e8da9815ed23f986e66800857bfd/extensions/omakase-bar/model.ts): parses map rows and checkpoint headings, derives accepted codes from prose, credits the next checkpoint 0.35, and uses heuristic fallback percentages. These are not proof of completed/accepted work. Its README describes some acceptance inference differently from current source; use pinned source evidence, not assumed behavior. Promptr needs explicit provenance/current Git/task/acceptance reconciliation and honest unknowns.

### Stage 2 extension beyond the reference

Promptr additionally needs discovery across recently active `~/git/*` projects using Pi sessions; identity and worktree handling; current-evidence reconciliation; idempotent generated Markdown drafts; optional new-repo-session resume cards; role packets; and checkpoint feedback. Omakase itself does not supply this pipeline. It must be designed and tested in Promptr, not advertised as already present.

## Verification status

The primary-source feature examples above were inspected, not executed. Neither
project was installed, built or run. Nothing here is a claim that a Promptr
feature derived from an example works; that needs its own evidence.
