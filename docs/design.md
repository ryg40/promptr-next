# Promptr design

> **Historical design baseline.** This document records the contracts that were
> worked out before and during the first implementation. Much of it is now
> implemented in `extension/`; some sections describe options that were
> considered and constraints that still hold. Treat it as design rationale, not
> as a status board or a task list — the configured issue tracker owns task
> state.

Read alongside the [inspiration review](research/inspiration-review.md) and the
[runtime and API contract research](research/runtime-contracts.md). Requirements
that were fixed by the product owner are distinguished from engineering defaults
**selected for implementation review** below.


## 1. Product and authority

When a new Pi session opens in a project, the user should find the correct unfinished checkpoint and a usable next-step prompt without reconstructing it from scattered notes.

### Preserved requirements

- `/coordinatr` labels and schedules the **currently open session**. It does not change its model, tools, context, name, draft, or working role; no automatic orchestrator prompt.
- Original Pi stays left. One ordinary terminal companion sits right, with queue/composer above and perpetual Markdown editor below. It is not another Pi agent.
- Note storage is local-first, with required two-way OpenKnowledge sync and explicit conflicts/recovery. Default remote remains root `promptr.md`, document `promptr` at `https://openknowledge.example.com`.
- Send now and Add to queue copy selected text; neither removes it. Editing, browsing, generation, and sync never execute text.
- FIFO dispatch releases at most one item per qualifying successful settlement and correlated Herdr acknowledgment. Error, cancellation and uncertain delivery pause automatic work.
- Explicit `/handoffr` closes the dispatch gate immediately, requests a safe wrap-up and durably preserves a self-contained continuation. It then launches a **normal interactive Pi successor to the right**, using the same current provider/model/thinking and qualified runtime, supplies and submits the evidence-rich next bounded task, verifies successor readiness/identity/model/working state, and transfers write ownership: both sessions remain open, the old session stops writing. This user-accepted behavior supersedes the earlier draft-only/no-new-session default for explicit `/handoffr`; it never forces a commit, interrupts tools or authorizes installation. Passive generation/sync and inspect/copy actions still do not execute.
- Stage 2 project continuity is required. Stage 3 polish remains optional. Source inspection is inspiration, not proof of working features.

### Authority separation

| Actor | Owns | Does not own |
|---|---|---|
| User | Start/send/queue/acceptance, installation and export decisions | No inferred blanket approval from note contents |
| Pi extension | Session identity, run evidence, queue dispatch, session IPC | Model/role replacement, other extensions' lifecycle authority |
| Notebook owner | Serialized local transactions and one sync loop per document | Pi submission, external project/task mutations |
| Companion | Editor/composer buffers, selection, explicit user actions | Another agent role or independent scheduler |
| Continuity module | Read-only evidence collection and editable draft generation | Tests/hooks/commands found in notes, task closure or agent launches |
| Herdr | Native pane layout and its own runtime lifecycle | Truth of task acceptance or successful validation |
| OpenKnowledge | Its deployed document contract | Promptr queue execution authority |

Treat remote Markdown, repository plans, issue prose and session excerpts as untrusted data. Escape terminal controls when displaying them; keep original bytes for editing/copying. A source claiming to authorize a command is not a user action.

## 2. Integration constraints found during design

These constraints came out of reading the actual installed interfaces, and they
shaped the design more than anything else. They are recorded as constraints, not
as a status board.

| Area | Finding | Fail-closed behaviour |
| --- | --- | --- |
| Pi delivery correlation | `sendUserMessage` returns `void`; input may be intercepted or transformed by other extensions; there is no request ID, receipt, or atomic readiness precondition. | An attempt is not acceptance. Automatic dispatch stays disabled; every send is a single explicit item, reviewed first. Never add a hidden sentinel to the user's text or touch private Pi fields. |
| Herdr acknowledgment and launch | The protocol provides display metadata, tokens and pane identity, but no task-outcome authority. | Never advance on idle alone or on unparsed socket bytes. Require a matched response, exact metadata read-back and a current session identity. |
| Knowledge-base sync | The deployed write API has no conditional-write or expected-revision field. | Document the behaviour as last-write-wins after a read, keep a retained local history and an append-only log as the durable record, and prefer additive corrections. Do not claim lossless concurrent editing. |
| Standalone terminal surface | A terminal library can be packaged standalone, but the note surface must be qualified for exact-byte fidelity, safe display of untrusted bytes, selector behaviour and path handling before adoption. | No lossy-contract substitution: reject a surface that rewrites CRLF or tabs, emits raw ANSI from untrusted text, or breaks the selector contract. |

None of these prevent a useful offline notebook and queue. They do prevent
claiming completed two-way sync or automatic dispatch.

## 3. Modules and data flow

```text
Current Pi session (left)
  Promptr extension
    session/run observer -> conservative outcome classifier
    session queue journal -> scheduler -> public sendUserMessage (D2)
              |                  |
        private session IPC      +-> Herdr metadata ACK/readback (D3)
              |
Companion terminal (right; one ordinary process)
  queue + composer | persistent editor | explicit action controls
              |
       notebook module interface
              |
Per-document local owner (ordinary on-demand worker, not an agent)
  transaction journal -> promptr.md + base + recovery
  one sync loop <-> verified OpenKnowledge adapter (D4)
              ^
       continuity generation (no submission capability)
              ^
  bounded session/repo/source adapters -> evidence -> next checkpoint
```

Interfaces should hide transaction/recovery complexity rather than spread file manipulation across callers:

| Module | Small interface | Test seam |
|---|---|---|
| Notebook | `read`, `apply(expectedRevision, edit, requestId)`, `recover`, `observeStatus` | Real temporary filesystem/fault adapter; remote fake or verified remote adapter |
| Session queue | `mutate(expectedRevision, action, requestId)`, `observeRun`, `reconcileAttempt`, `snapshot` | Pure reducer plus durable journal adapter; fake Pi/Herdr ports |
| Pi adapter | `observe`, `attemptLiteralSend`, `readIdentity`, `readReadiness` | Fake lifecycle source and real public hooks; no private session mutations |
| Herdr adapter | `inspectTarget`, `ensureOwnedCompanion`, `publishCompletion` | Recorded schema-shaped responses and disposable runtime canary |
| Continuity | `refresh(bounds, sources)`, `draft(evidence, policy)`, `recordReceipt` | Synthetic portfolio and time-controlled source adapters |

The standalone companion and notebook owner must run without importing `pi-coding-agent`, `pi-subagents`, `pi-server`, or `pi-client`. Only the extension adapter imports Pi's public extension interface. Use Node built-ins for storage, sockets and tests where sufficient.

**Technology direction:** TypeScript ESM on Node 22.22.x and `node:test`; pure/storage candidates use native erasable `.mts`, while the terminal spike has a repo-local locked compiler toolchain. The separately packaged `@earendil-works/pi-tui@0.85.0` spike measured constructibility and production packaging, but its current Editor integration failed exact-byte/safe-display qualification. Extension host peers must follow Pi package conventions; any companion must resolve its own pinned dependency rather than rely on Pi aliases. No global installation or speculative rewrite onto another language or storage engine.

## 4. Notebook, durability and recovery

### Paths and identities

Default durable root is `${PI_CODING_AGENT_DIR:-~/.pi/agent}/promptr/`. Use a validated explicit override for tests; never fall back to a real note after an invalid test path.

```text
config.json                         # versioned settings; no secrets
install-id                          # private local identity
 documents/default/
   promptr.md                       # real editable UTF-8 Markdown
   base.md                          # last acknowledged common content
   sync.json                        # endpoint/document mapping, revisions/hashes
   journal.jsonl                    # notebook transactions and sync intent
   versions/<content-hash>.md       # retained observed/preimage/committed versions
   recovery/<transaction-id>/       # unresolved conflicts and corruption copies
 sessions/<session-key>/
   queue.json                       # compacted snapshot + checkpoint sequence
   journal.jsonl                    # actions, attempts, outcomes, handoff gate
   composer.md                      # durable unsent composer
   handoff.json                     # generation and provenance; not a second notebook
 continuity/
   index.json                       # derived and rebuildable
   receipts/                        # durable explicit outcome evidence
   generated.json                   # fingerprints, base block hashes, tombstones
```

Indentation is illustrative; `documents`, `sessions`, and `continuity` are direct children of the durable root. Document ID is a local mapping ID, not a user-provided path. Queue key includes installation/session identity and canonical session path hash; duplicate copies of a UUID must not share live ownership accidentally. Ephemeral Pi sessions get a local generated identity; persistence limitations are visible and restart requires explicit recovery, never guessed reassociation.

Runtime sockets and owner descriptors live under a private, UID-owned `$XDG_RUNTIME_DIR/promptr/`, or a verified mode-0700 temporary directory with a short path if unavailable. Directories 0700, regular files 0600; reject symlinked state targets/foreign ownership. Initial scope is a local Linux filesystem, not NFS or cross-host shared runtime state.

### One writer, multiple managed editors

The per-document owner serializes all Promptr editors, handoff insertions, draft generation and remote writes. Other companions are clients. It starts on demand while Promptr is active, not at extension discovery or through cron/system installation. A process-bound exclusive ownership mechanism must fence writes; **expiry of a heartbeat alone is not permission to steal ownership from a live process**. Check boot/process-start identity, do not trust PID reuse. Owner transfer/reconnect requires rereading durable state before any write.

Managed clients submit an expected notebook revision and immutable edit intent. A stale client gets a conflict with its buffer retained. UI edits are not acknowledged durable before persistence finishes.

An arbitrary external editor does not obey Promptr's lock. Watcher/hash checks detect observed changes, but a read-check-rename loop is **not atomic CAS against uncooperative writers**. Retain every observed version, pause automatic replacement when external editing is detected, and offer an explicit external-edit mode that suspends notebook publication and managed writes until reimport/reconciliation. Do not promise lossless simultaneous writes from arbitrary editors. This limitation must appear in help and acceptance tests.

### Local transaction contract

1. Serialize by document and validate expected revision, operation ID and filesystem ownership.
2. Persist immutable before/after content and an intent record with a monotonic sequence/checksum; fsync before materializing changes.
3. Write a same-directory private temporary file, fsync, rename to the Markdown path and fsync its parent; then persist the committed transaction.
4. On crash, validate the complete journal prefix and compare file hashes. Keep both candidates if ordering is uncertain; never replace malformed/missing data with an empty note.
5. Snapshot compaction records the last committed journal sequence. Only prune data whose durable replacement is verified. Do not claim several renamed files form one atomic transaction.

Debounce edits at 300 ms with a 2 s maximum pending interval (review defaults). Flush before explicit send/queue/handoff acknowledgment and ordinary exit. Dirty text remains in memory on disk failure, with retry/private export and an explicit discard confirmation; do not close its owning process as cleanup. A process crash before a durability acknowledgment can lose in-memory edits; the UI must never imply otherwise.

Resolved history default: retain 30 days and the latest 100 versions, subject to a visible space budget. Never prune unresolved conflicts, uncertain attempts, unexported recovery content or the sole usable copy. Stop automatic generation at the soft storage cap rather than silently discard notes. Recovery supports inspect, export, keep-local, keep-remote and edited merge; each new write rechecks its base.

### Sync state and matrix

Local status and remote status are separate dimensions: `editing/pending/local-durable/local-save-error` versus `unconfigured/offline/auth-required/dirty/syncing/synced/conflict/remote-missing/write-unknown/contract-blocked`.

Let L be local, B the acknowledged common base, and R a freshly fetched remote version:

| Condition | Action |
|---|---|
| No local data, verified existing R | Import R as a local transaction; never create/reset the remote page. |
| L exists, B unknown | Preserve L and R; equal content can establish B, otherwise explicit first-sync reconciliation. |
| L = R | No write; establish/update common base for that exact revision. |
| L = B, R differs | Pull through notebook CAS; if typing advanced L meanwhile, preserve both and reconcile. |
| R = B, L differs | Publish only through certified conditional write; bind request to captured L revision. |
| Both differ from B and each other | Persist B/L/R and enter conflict; no automatic winner. |
| Remote 404/deletion | `remote-missing`; do not erase L or recreate automatically. |
| 401/403, bad content, timeout | Preserve L/B; auth/offline/error, never interpret login HTML as Markdown. |
| Write response lost | `write-unknown`; read back and reconcile captured hashes. No blind destructive retry. |

An old write acknowledgment may advance B to the written revision, but cannot mark newer local edits synced. A read-after-write verifies the observed result only, not future convergence or absence of an intervening write. If OpenKnowledge normalizes Markdown, require an explicit canonicalization contract; protect raw local bytes and avoid normalization echo loops.

Proposed credentials: `PROMPTR_OPENKNOWLEDGE_USERNAME` and `PROMPTR_OPENKNOWLEDGE_PASSWORD` consumed only by the authorized sync process. They are **not configured**. Require HTTPS, explicit same-origin endpoints, no cross-origin credential redirects, bounded bodies and redacted errors. Do not forward inherited credential environments into companion shell command strings, model context or issue receipts.

Sync runs only while an owner is active: coalesced local changes and manual refresh, 30 s remote polling, exponential backoff capped at 5 min with jitter (review defaults). One request in flight; cancellation/late responses checked against generation. Auth errors stop retries until configuration changes. Network work never holds the editor's local-save lock.

## 5. Coordinator, IPC and companion ownership

### Activation and controls

- `/coordinatr`: idempotently enable label, bind to current TUI session and ensure the owned right pane. Initially paused; no queue starts merely by enabling.
- `status`, `pause`, `resume`, `off`, `recover`: explicit controls. Resume after a restart/error/uncertain delivery includes inspection, not automatic replay.
- `off`: pause, revoke submission capability and flush; close only owned UI resources when safe. Preserve notebook/queue/composer. Do not restore stale names or overwrite another extension's metadata.
- Startup/reload/resume: fresh runtime nonce, paused scheduler, reconcile prior in-flight state. New/fork/clone sessions do not inherit a live queue; copying pending work is explicit.
- Tree navigation: invalidate active evidence and pause. Queue history is an operational journal, not rewound with the conversation tree. `/coordinatr` activation never creates a new Pi session; the separately explicit `/handoffr` successor action follows §7.
- Unsupported non-TUI/non-Herdr mode: no split or fallback agent; offline standalone notebook remains available.

Use a namespaced Pi status/custom entry rather than `setSessionName`. No editor replacement, `setEditorText`, terminal submission, model change, tool change, or automatic system prompt mutation.

### Session IPC v1

An LF-delimited JSON protocol over a private Unix socket. Each request includes `{version, requestId, bindingId, action, expectedRevision?, payload}`; the binding incorporates installation, Pi session path/UUID, runtime nonce and owning pane terminal identity. A private capability is obtained from an owner-only descriptor, never from a note/URL/argv. This protects against accidental cross-session/other-user calls, not arbitrary hostile code running as the same OS user.

Allowlist actions: status, enqueue/edit/remove/reorder-pending, pause/start/resume, send-selection, request-handoff, read/reconcile-attempt. Notebook operations use the separate document-owner interface. No arbitrary shell/code, path read/write, target pane or agent-launch endpoint.

Review defaults: 256 KiB action frames; up to 2 MiB notebook snapshots with bounded chunking; 32 outstanding requests/client; 8 clients/session; disconnect oversized/malformed input. Bound UTF-8 bytes before parse, reject unsupported schema versions and unknown actions. Prioritize pause/handoff and keyboard events over refresh/status updates. Cap histories and stream cursors rather than send full transcripts.

A request ID is permanently bound to its action/payload digest. Same ID/same digest returns prior outcome; same ID/different digest is rejected. An enqueue acknowledgment means its journal is fsynced. A send acknowledgment can only mean `attempt-recorded` until a qualified observation establishes delivery; do not label IPC success “Pi accepted.” Reconnect asks for status, never replays a send under a new ID automatically.

### Herdr layout and acknowledgment

Verify current pane's workspace/tab/terminal/session identity before creating a right split with explicit target, cwd and `focus:false`. Record only the returned owned companion identity. The companion itself creates the horizontal queue/editor layout; no extra Pi pane.

The inspected split schema has no executable field. Qualify the installed `herdr pane run` CLI against a disposable newly owned shell. Invoke the CLI without an outer shell; any shell command string it needs must contain only fixed launcher code and correctly quoted owner-controlled paths. Note text and secrets never appear there. `pane.run` is not an approved socket method.

Re-enable reuses a companion only after authenticated IPC and pane/process identity checks. A missing/moved/reused pane cannot redirect submission. Prefer the companion voluntarily exiting after a shutdown handshake; `pane.close` has no ownership CAS and must not be used against uncertain identity. Companion closure pauses dispatch but leaves the active Pi turn alone.

Completion publication uses `pane.report_metadata` with `source:"promptr"`, `applies_to_source:"herdr:pi"` and at most a few opaque token fields, e.g. `promptr_session`, `promptr_generation`, `promptr_outcome`. Use a durable monotonic sequence and bounded TTL. Require a fully parsed response with matching request ID and validated result, followed by `pane.get` echoing exact tokens and matching agent session/terminal identity. Recheck Pi readiness and queue generation after all awaits. Missing/negative/late/mismatched responses close the gate. Do not call `pane.report_agent` or release `herdr:pi` authority.

This is an acknowledgment of Promptr's result report, **not** a Herdr-certified task success. Metadata ordering/echo/TTL behavior remains gate D3.

## 6. Durable FIFO queue and delivery

### State model

Scheduler state: `disabled | paused(reason) | armed | awaiting-recovery`.

Item state:

```text
pending -> reserved -> attempt-recorded -> observed-running -> settled-success
                    \                  \                  -> settled-failed
                     \                  -> delivery-unknown
                      -> cancelled-before-attempt
```

Removal applies only to pending items and is recoverable. Reordering is an explicit pending-order edit; after that, dispatch is FIFO in the displayed durable order. In-flight text never changes. Items carry immutable text hash, source document revision/range, item/request IDs, attempt ID, binding/generation and event evidence.

`reserved` is known not attempted only if the journal proves the attempt boundary was never crossed. Persist `attempt-recorded` **before** calling Pi. A crash between that record and the actual call is intentionally uncertain. On restart, unresolved attempts/runs require reconciliation, not retry. “Mark handled”, “retain unresolved”, and “retry as a new explicit attempt” are distinct user actions; preserving history is mandatory.

### Conservative runtime success

A logical generation spans an observed run and any automatic continuation until settlement. It qualifies only when:

1. Identity and runtime epoch still match; generation started under observation, not recovered from an idle snapshot.
2. `agent_settled` is observed and `ctx.isIdle()` is true with no pending messages, known tools or blocking prompts; no later input/start invalidated it.
3. Final assistant completion is `stop`, not `length`, `error`, `aborted`, `pending`, missing or an unexplained tool-only termination.
4. No provider/tool/compaction error or cancellation was observed in that generation. This v1 policy is intentionally conservative: even an apparently recovered tool error pauses for review. Runtime success is not issue acceptance or proof all requested work was done.
5. Herdr acknowledgment/readback succeeds for this exact generation, and the scheduler is still armed with no handoff gate.

Persist consumption of the settlement token before reserving one item. Duplicate events cannot release a second. Never accumulate “success credits” while the queue is empty or replay a historical settlement after restart.

Explicit Start while already idle creates a distinct user authorization for the first pending item, subject to current identity/readiness/recovery checks. It is not fabricated prior success. Armed mode may wait for the currently observed run to settle; Add to queue by itself does not start an idle paused queue.

### Pi delivery limitation and certification

Use `pi.sendUserMessage(text, {expandPromptTemplates:false})` for idle literal sends; busy **Send now** uses `{deliverAs:"steer", expandPromptTemplates:false}`. Automatic queue dispatch must not spill multiple items into Pi's own follow-up queue. Snapshot selection first; source Markdown remains byte-for-byte unchanged.

The public method returns void and offers no metadata receipt. Recording a custom entry beside a send is **not** an atomic association with the eventual user message. `input.source === "extension"`, matching text, matching timestamps, `before_agent_start`, or observing a nearby user message can provide evidence but cannot distinguish every identical concurrent sender or handled/transformed input. Never claim exact-once acceptance from those heuristics.

**D2 exit:** prove a conservative public-hook protocol on the installed host that never credits an unrelated event, or explicitly propose a public runtime receipt capability for owner approval. Qualify identical native/extension inputs, delayed preflight/auth, input interception/transformation, reload between awaits, busy transitions and failures before `agent_start`. Ambiguous cases remain paused/unknown. If reliable association cannot be established without changing literal text or using private APIs, automatic mode stays unavailable; do not silently relax the approved queue contract. Manual literal sends may report attempted/observed/unknown truthfully and never trigger an automatic retry.

Send now can explicitly steer a running item, making its result a combined generation; record that fact. It is permitted while the automatic queue is paused, but a pending handoff requires an explicit decision before adding competing steering. An already attempted message cannot be retracted by pause/handoff; show that race truthfully.

## 7. `/handoffr` safe checkpoint protocol

### Accepted explicit successor behaviour

A manually demonstrated interactive peer handoff was accepted as the desired
behaviour for `/handoffr`. That made it a design requirement; it was not, on its
own, evidence that Promptr implemented it.

For an explicit `/handoffr` invocation, after the safe wrap-up/durable context stages below:

1. Capture the current provider/model/thinking, exact qualified runtime, cwd/ref/dirty identity and bounded continuation; preserve approval and stop conditions, unsaved work and pending/uncertain queue context. Note content is data, not authority to add actions.
2. Launch one normal **interactive**, non-subagent Pi successor in a new pane to the right, carrying those settings unchanged. Do not use the ordinary notebook companion process as a successor, change the default runtime, install packages or silently choose another model/protocol.
3. Supply and submit the self-contained evidence-rich next bounded task as the explicit handoff action. Verify exact successor pane/session/cwd/runtime/model/thinking identity and readiness, then correlated working/task evidence. A launch ID, idle display or uncorrelated assistant prose is insufficient. The product launch/submission/acknowledgment path still needs supported-interface qualification; the manual peer demonstration is not certification of that adapter.
4. Transfer **exclusive write ownership**, leaving both sessions open and interactive. Fence the old writer before successor mutation is permitted; the old session must not race the new owner. Keep the successor write-gated while readiness or ownership is uncertain. Failure leaves preserved context and an honest blocked state, not a second writer or an automatic replay.
5. Repeated invocation/reload/retry must reconcile the same handoff generation and successor identity; never blindly create a duplicate pane or resubmit an uncertain task.

This replaces the older draft-only, no-new-session default for an explicit
`/handoffr`. Passive generation, sync, notebook edits, resume-card browsing and
copy actions remain non-executing. No tool interruption, forced commit or push,
installation, auth or trust change, or broader checkpoint authority is implied.
Blocking prompts and save or launch failures still obey the gates below.

### Gate first

The command sets an in-memory pause/generation fence **before its first await**, then durably journals a handoff request. Every dispatch path rechecks that fence immediately before attempting a send. An attempt already crossed into Pi is not retroactively cancelled; include it as in-flight/unknown. If the pause cannot be saved, keep this runtime paused, show recovery/export, and do not claim restart safety.

### Behavior by Pi state

| State | Action |
|---|---|
| Idle, healthy | Capture an initial deterministic continuation, then send one explicit wrap-up request as the command's intended action, if D2 permits. No backlog item released. |
| Busy, healthy | Send one native steering request asking for a safe stopping point after current tools. Do not abort tools or wait on an event handler for idle. |
| Blocking user prompt | Persist the gate and initial continuation immediately; show that wrap-up awaits the user's existing decision. Do not answer/dismiss it or inject another automatic request. |
| Error/cancel/disconnected | Save a deterministic partial/blocked handoff with known evidence; no automatic model retry. Offer an explicit retry later. |
| Repeated invocation / reload | Reuse the outstanding handoff generation. Show/refresh it; do not duplicate the wrap-up request or restore armed state. |

A suggested bounded wrap-up message asks the current Coordinator to report its objective, completed/partial work, exact files, validations/reviews, blockers and smallest next runnable checkpoint, with no new feature work, commits, queue draining, or continuation execution. It is ordinary user-level steering, not a changed system role or enforcement mechanism. Native already-queued follow-ups may still run; Promptr must not clear them. Report that constraint and let the user intervene if needed.

### Durable output

Immediately gather a bounded read-only Git/task/session snapshot and write an initial continuation block through the notebook module. After a clearly associated wrap-up settles, refresh the block with current Git evidence and separately labeled assistant claims. If association is uncertain, retain the initial block and expose a candidate summary for explicit review instead of crediting an unrelated reply.

Handoff key includes project/worktree/session and handoff generation. Store canonical handoff text only in `promptr.md` through the same managed-block rules as Stage 2; `handoff.json` holds IDs/status, not an alternate authoritative note. Preserve edited blocks. A local write succeeds independently of remote sync. If the notebook owner is unavailable, save to a private recovery file and say **recovery-only, not yet in promptr.md**. Never report local durability after failed writes.

Required packet fields: objective/authoritative issue plan; canonical project/worktree/ref/real HEAD; dirty status and changed paths; observed versus claimed progress; unfinished scope; read-first links/code entry; validation command/result/ref and reviewer evidence; acceptance status; blockers/decisions; queue count/IDs and uncertain attempts (not all pending prompt text); next runnable checkpoint, role route, expected output, stop conditions and exact resume instructions. Mark unknown facts explicitly. Evidence collection races with a live writer: compare Git/status before and after, and mark inconsistent snapshots stale rather than invent a stable state.

## 8. Required Stage 2 continuity

### Configuration defaults for review

- Root: `~/git`, canonicalized; direct project children plus registered worktrees, not recursive reading of every file. Pin/exclude by stable project identity; excludes win over pins. Moved repos require explicit identity remapping.
- Recency: **14 days**, configurable 1–90 days. Genuine user/assistant/tool activity timestamps count; metadata rewrites, reload, label changes and indexing do not. Future clock anomalies are flagged.
- Per refresh: max **50 projects**, **500 candidate session files**, **20 MiB session bytes total**, **2 MiB per session**, **32 selected document sources/project**, **256 KiB/source**, **16 MiB document bytes total**, **5 s wall-clock**, concurrency **2**. Stop at the first bound; retain a cursor and report partial coverage. Pins do not bypass budgets.
- Incremental identity/header/tail discovery first. Expand only selected relevant sessions/branches within budget. Truncated records, missing ancestors, unsupported formats or uncertain leaf pointers produce unknown lineage, not merged branch histories.
- Automatic drafting **off until explicitly enabled**. On enable, show tracked roots, remote publication destination and export fields. Thereafter coalesce application startup/manual refresh, qualifying session settlement, selected source changes and explicit receipt changes; minimum 60 s between automatic portfolio refreshes, 1 s debounce. No external cron/service. Ignore notebook-generated writes as source triggers.
- At most **3 new/updated draft candidates per refresh**, **12 KiB each**; show deferred work. Deterministic templates by default; optional model synthesis off, no configured provider or budget. A future opt-in must specify provider/model, allowed data, token/spend cap, timeout and cancellation. Missing price information must not be represented as a verified dollar cap.

These limits are initial bounded defaults, not performance measurements. Do not silently widen them when evidence is incomplete.

### Identity, source precedence and active writers

Project identity is installation ID plus canonical Git common directory; worktree identity adds canonical worktree root/git directory. A remote URL is only a sanitized locator, never identity. Store branch/ref and real HEAD separately, including detached/unborn states. Resolve session cwd through Git, not the encoded session-directory name. Do not attach a missing worktree's task to whichever branch currently exists in the main checkout.

Collect safe Git facts with fixed argv and time/output limits: `rev-parse`, porcelain-v2 status, worktree list and bounded relevant logs. Disable optional locks/fsmonitor where appropriate; never run tests, repository code, hooks, shell commands from source text, network fetch, or issue-closing actions during refresh. Never follow source symlinks outside approved roots. Repository-supplied executable adapters are not loaded automatically; adapters parse data only.

Evidence dimensions have separate authority, not a single numeric confidence ranking:

1. Current Git/worktree facts govern what exists now, but do not establish product acceptance.
2. Current canonical tracker and explicit user/checkpoint acceptance govern planned scope and acceptance. Gitea is canonical for Promptr; other projects declare their source adapters.
3. Validation/review receipts are scoped to their actual ref **and dirty content fingerprint**, commands, time and reviewer. A pass on the same HEAD before dirty edits is stale.
4. Session handoffs, TODOs/devlogs/maps and assistant prose supply declarations and read-first routing, not proof of landed/accepted work.
5. Conflicting/missing/stale evidence remains visible; do not choose the newest optimistic prose as truth.

Active-writer detection combines Promptr ownership, current session activity, available pane/session identity and repeated filesystem observations. Absence of a heartbeat is **unknown**, not proof no external editor/agent exists. A live or uncertain writer produces a reconcile/inspect recommendation, not an automatic second Worker. Planned/partial/implemented/validated/reviewed/user-testing/accepted/blocked/regressed are distinct evidence fields; no fabricated percentage completion.

### Privacy and export

Default indexing reads selected message text only where needed; never raw thinking, image bodies, provider auth, environment dumps, full tool output or whole transcripts. Exclude credential files and configured private paths. Sanitize userinfo/query secrets from locators. Secret detection is defense in depth, not proof a document is safe to export.

Because all text inserted into this notebook may sync, **only export-approved projects/fields may generate notebook blocks**. Before enablement, show that exact cwd/ref, issue links, filenames and short task summaries become visible on the configured OpenKnowledge instance. Private/unapproved project candidates remain in local index/preview; they are not hidden “local-only blocks” inside a remotely synced file. User-selected/manual pasted text still follows normal explicit send/sync semantics. Optional model synthesis has a separate provider/privacy authorization; OpenKnowledge approval does not authorize another provider.

### Evidence and role packet schema

```text
schemaVersion, packetId, projectId, worktreeId, workstreamId
sourceFingerprint, generatedAt, supersedes?, privacyPolicyVersion
identity: cwd, commonDir locator, ref, head?, dirtyFingerprint, observedAt
objective, authoritativeSources[], readFirst[], codeEntry[]
progress: declared, observed, validation[], review[], acceptance[], unfinished[]
coverage: scannedBounds, missingSources[], staleSources[], lineageStatus
blockers[], conflicts[], activeWriterEvidence[]
nextCheckpoint: objective, runnableResult, scope, nonGoals, validation, stopConditions
roles[]: purpose, cwd/worktree, inputs, expectedOutput, authorityLimits
queueContext: pendingCount, inFlightIds[], uncertainIds[]
```

Sources include stable locator plus revision/hash, observed time, evidence kind, and bounded excerpts only when authorized. Volatile refresh timestamps are excluded from the semantic source fingerprint; generated note content is excluded from its own inputs. Include template/policy version, selected session branch/leaf, real source hashes and Git/dirty state. Missing values stay absent with reasons; never fabricate a SHA.

Coordinator scopes/sequences/accepts. Researcher is included only for explicit evidence gaps. Worker is one writer per cwd/worktree. Reviewer independently checks actual changes against scope/evidence. Drafting discovers no imaginary agent/model names. At deliberate execution, discover actual supported capabilities and revalidate identity, writer ownership and permissions. A missing supported agent route is a blocker, not permission to change protocol.

### Managed Markdown blocks

Use inert, versioned HTML-comment delimiters with validated opaque IDs, for example:

```markdown
<!-- promptr:begin v=1 id=OPAQUE_ID kind=resume -->
## Resume: project / workstream
Source fingerprint: SHA256
Status: draft — not queued or started
[Bounded self-contained packet with visible provenance]
<!-- promptr:end id=OPAQUE_ID -->
```

The sidecar keeps the generated body hash and source fingerprint. Same fingerprint means no new block even after restart. Do not trust a comment's claimed hash as authority to overwrite user text.

If current body matches its stored generated base, replace it transactionally and preserve a historical version. If edited locally/remotely, leave it unchanged and create at most one separately identified candidate for the new fingerprint with a visible `supersedes` reference; require explicit merge/accept to retire the edited block. User deletion creates a local tombstone so ordinary refresh does not resurrect it. Duplicate IDs, malformed/nested markers or missing sidecar ownership are preserved and sent to recovery, never “fixed” by destructive rewrite.

Generation and sync have **no queue/agent port** in their interfaces; test that separation directly. Session-start resume cards use TUI-only entries/widgets and offer inspect, refresh, copy and explicit start. Opening a card/row does not alter model context or the main draft. Start rechecks current cwd/ref/evidence/writer state; creating a new session is an independent explicit action, not activation's or passive generation's default. Explicit `/handoffr` is the user-approved successor workflow in §7; its implementation/qualification gates still apply.

### Receipts and feedback

`/handoffr` and explicit checkpoint outcome actions use the same receipt schema and notebook block pipeline. Receipts carry actor/provenance, actual ref/dirty fingerprint, command/review evidence and an explicit acceptance event where applicable. Assistant “done” can populate a declaration, not an accepted receipt. Accepted work is excluded from implementation recommendations only when current identity/evidence still agree; landed-but-unaccepted work routes to validation/acceptance rather than repeated implementation. Conflicts produce reconciliation first.

Receipt refresh changes fingerprints once, not recursively. Tracker comments and project-map updates require a preview and explicit user
authorization; receipt prose does not close issues or commit and push anything.

## 9. Runnable checkpoints, not horizontal task completion

Work was sequenced as runnable checkpoints rather than by completing each
subsystem horizontally. Each checkpoint had to produce something a person could
actually run, and completing a subset of a larger requirement never counted as
completing that requirement.

The order that was used, and the reasoning behind it:

| Checkpoint | User-visible runnable result |
| --- | --- |
| Offline notebook and pending queue | A standalone companion edits a Markdown note, selects lines, copies them into a persistent **non-executing** queue, exits and restores both. A simulated disk failure retains the text and blocks accidental discard. |
| Current-session attachment and literal manual send | `/coordinatr` adds or reuses only its own companion pane while the original session's draft, model, tools and context stay intact; an explicit send reports idle/busy state truthfully. |
| Gated dispatch | Queued prompts advance one at a time on qualified success; failure, a blocking UI prompt, a late acknowledgment and a crash all pause visibly. |
| Safe interactive handoff | An explicit handoff wraps up and persists context, launches an interactive successor on the same provider, model and thinking level, supplies and submits the bounded task, verifies identity, readiness and working state, and transfers exclusive write ownership with both sessions left open. |
| Certified remote sync | A disposable page demonstrates local and remote edits, reconnect, conflict and stale-write behaviour, with the real note untouched. |
| Evidence preview | A project shows the correct next checkpoint, its unknowns and read-first evidence, without writes. |
| Editable continuity drafts and resume card | A project produces one deduplicated notebook draft, preserves manual edits, and surfaces an inert resume card; explicit receipts update the next step. |

Local editor and queue work did not wait for remote sync or automatic dispatch,
but full integration acceptance was still required before declaring those
features done. The handoff needed notebook transactions and the dispatch pause
seam, not every selection UI detail.

## 10. Verification and non-goals

Reproduced self-tests, measured incompatibilities, independent review and user
acceptance are distinct evidence levels and must never be conflated. A proposed
remedy or library choice must be measured, not presented as an established
result.

Release tests must include: crash recovery and unsaved-exit protection; one
writer and conservative ownership transfer; IPC flood fairness; malicious and
oversized frames; stale-session callbacks; expected input interception and
asynchronous preflight failure; native follow-ups and compaction; provider and
tool cancellation; duplicate settlements; coexistence with another lifecycle
authority; main-editor draft preservation; the first-sync and ambiguous-write
matrix; remote normalization; edited generated blocks; mixed branches and
worktrees; bounded scan and export policy; no execution arising from generation
or sync; and no secret in logs, argv or tracker comments.

Non-goals: another agent inside the companion, forced orchestrator roles, global
installation changes, delivering prompts as terminal text, optimistic
exactly-once claims, unconstrained cross-project scanning, implicit
external-editor concurrency guarantees, automatic issue closure, commits or
releases, running as a cron job or service, and polish features smuggled into an
earlier checkpoint.
