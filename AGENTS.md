# Promptr — agent entry point

## Orient in one pass

1. Read [`README.md`](README.md) for what Promptr is, how it is configured and
   what its current limitations are, and [`CONTEXT.md`](CONTEXT.md) for the
   product vocabulary. Use the words defined there.
2. Read the configured issue tracker — whatever repository the user bound with
   `promptr-tracker-init` / `/promptr-tracker init`. That tracker, not this
   repository's Markdown, owns task state. Open the one ticket you are working
   on; do not load the whole backlog or every historical design note by default.
3. Check `git status --short --branch` and `git log -3 --oneline`. A saved
   handoff or briefing is a snapshot, not current Git truth.
4. If the tracker is unreachable, work from the local briefing and say plainly
   that the tracker was not refreshed.
5. For the extension itself, [`extension/README.md`](extension/README.md) is the
   authority on requirements, install, commands and recovery.
6. [`.okf/index.md`](.okf/index.md) is a portable knowledge bundle describing the
   architecture, workspace, tracking, sync, handoff and workflow concepts.
   Follow only the links a task needs.

## Product direction

Promptr is a supplemental convenience tool, not a critical system. Make it
effortless to use, then improve it from real use. Occasional lost prompts or
stale context are acceptable; do not make enterprise resilience or exhaustive
qualification a prerequisite for a usable increment.

- Promptr assists a Pi + Herdr + tracker + knowledge-base workflow with
  Coordinator-led role delegation. It is not another orchestration framework.
- **Keep sends explicit.** One item at a time, reviewed before submission, no
  automatic draining or retries. *Attempted* is never reported as *delivered*.
- **Keep credentials out of tracked files.** Tokens and passwords come from the
  process environment only, are sent as headers, and are never logged,
  persisted, or committed. Binding files hold hosts and repository names only.
- **Do not touch unrelated user data.** Notebooks, sessions, auth stores and
  other projects' state are off limits unless the task is about them.
- `extension/` is the published source; the Pi agent extensions directory holds
  a separate installed copy. Editing one does not update the other — rebuild and
  reinstall.
- `.promptr/` in a project is ignored local working data (briefing, retained
  revisions, attempt packets). Never commit it.
- Prefer a small real implementation and actual use over an extended
  architecture debate. OpenKnowledge, in particular, is a replaceable working
  hypothesis.
- Proportionate build and behaviour checks are enough for an increment. Never
  invent a test result or claim user acceptance that was not given.

## Optional: model and role preferences

Promptr's workflow catalog names provider/model/thinking per role, and a
machine-local override file retargets it — see
[`docs/workflow-overrides.md`](docs/workflow-overrides.md). Any role/model
mapping described there or in a project's override is an **example of one
machine's configuration**, not a runtime requirement. Discover the agents and
models actually available before assuming any of them exist, and do not launch
every role in the matrix just because it is defined.

## Tracking and continuation

The configured tracker owns task state. Local Markdown here is an entry point
and a scope guide, not a second task database. Project progress and handoffs are
shared through the configured knowledge base when one is connected.

Record continuation where it belongs: a checkpoint or handoff packet through
Promptr's own commands, or the ticket you are working on. Do not accumulate new
`handoff-*.md` files at the repository root, and keep private traces, machine
paths and session artifact locators out of tracked files.

Commit, push, install, deploy, and any live remote write or session launch are
separate, explicitly authorized actions. If a delegated execution route fails,
record the failure and retry through the supported protocol rather than silently
switching modes.
