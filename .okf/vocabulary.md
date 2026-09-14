---
type: Vocabulary
title: Product vocabulary
description: Ubiquitous language for project, task, briefing, checkpoint, handoff and resume.
tags: [promptr, vocabulary, briefing, handoff, resume]
generated:
  by: process:promptr-okf
  at: 2026-09-14
sources:
  - id: context
    path: CONTEXT.md
    resource: https://github.com/ryg40/promptr-next/blob/main/CONTEXT.md
    last_modified: 2026-09-14
stale_after: 2026-12-31
---

# Language

**Project**: A continuing body of work that may be visited through
different accounts, clients, sessions, or working copies.

**Task / workstream**: A particular line of work within a project.
Starting another does not discard the previous one's continuation
context.

**Briefing**: The editable current explanation of where a project's work
stands and what to do next. Do not treat a historical handoff as
automatically current. Lives on the [OpenKnowledge sync](/openknowledge-sync.md)
`brief` page with a local copy in `.promptr/briefing.md`.

**Checkpoint**: A saved observation of useful progress at a point in
time; it need not mean completion or acceptance. See
[handoffs and checkpoints](/handoff-checkpoint.md).

**Handoff**: A continuation packet recorded for a successor session,
including goal, progress, next action, and references. Append-only on
the `handoffs` page.

**New task**: The action that begins a different line of work in the
selected project. Avoid: new session, new project.

**Resume**: The action that reviews existing continuation context and
deliberately starts the next step in a chosen session.

**Continue here**: Resume work in the current session.

**Start fresh**: Resume work in a new conversation using a portable
briefing rather than relying on the old conversation. Avoid: new task.

**Project overview**: The entry view for understanding and starting
project work before entering the queue, composer, and notebook
workspace. See [companion workspace](/companion-workspace.md).
