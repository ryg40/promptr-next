# Promptr runtime contract inspection

Read-only inspection of the interfaces Promptr depends on: Pi's public extension
surface, Herdr's CLI and socket schema, and the OpenKnowledge write API. This is
source-and-schema evidence, not a live integration canary, and the upstream
versions it names are the ones that were inspected, not a support matrix.

Versions at inspection: Node 22.22.x, Pi 0.85.x, pi-subagents 0.65.x, Herdr
0.8.x/0.9.x, Gitea 1.26.x.

## Evidence levels

- **Observed:** CLI/schema/local installed source or an actual read-only response.
- **Upstream only:** pinned public source; deployed compatibility is unknown.
- **Proposed:** a Promptr design contract, not a capability supplied by its dependencies.

## Gitea issue API

Read-only issue listing uses `GET /repos/<owner>/<repo>/issues?state=open&limit=50`
with pagination. A request using `state=all&type=issues` returned an empty array
on one deployment even though individual issue GETs and the open-issue listing
both worked; do not interpret that query's empty result as proof the backlog is
absent.

## Subagent runner alias requirement

Installed `pi-subagents/src/runs/background/runner-aliases.ts` requires host aliases for `@earendil-works/pi-server`, `@earendil-works/pi-server/unix`, and `@earendil-works/pi-client/unix`. The Pi `0.85.1` package manifest does not include those dependencies, and the inspected host package locations contain neither package. A supplemental `pi-server@0.85.0` exists under the extension's npm root, but the resolver permits its fallback **only for host Pi 0.85.0**; `pi-client` is absent there as well.

A CommonJS `require.resolve` probe also rejected the supplemental server's import-only exports. That alone is not evidence that an ESM import is broken; the stronger evidence is the actual alias resolver's host/version rule and absent host packages.

A repair here must select a documented compatible Pi and subagent package pair, preserve a rollback inventory, and obtain approval before installation. Do not widen the fallback version check or copy arbitrary packages into the global tree. Promptr itself does not depend on these packages.

## Pi public interface

Installed package root: `~/.local/lib/node_modules/@earendil-works/pi-coding-agent`.

Read completely: `README.md`, `docs/extensions.md`, `docs/tui.md`, `docs/packages.md`, `docs/session-format.md`. Inspected `examples/extensions/send-user-message.ts` and the installed implementation/declarations below. Documentation links here refer to that installed version, not moving online documentation.

| Source | Observed contract | Consequence |
|---|---|---|
| `dist/core/extensions/types.d.ts`, `AgentSettledEvent`; `dist/core/agent-session.js:347–351,773–785` | `agent_settled` has only its event type. Settlement is emitted from `finally`, including unsuccessful runs. | Derive a conservative outcome from observed messages/errors and readiness; never equate settlement with success. |
| `docs/extensions.md`, agent/input/session events | Low-level runs, retries/compaction, input transforms, blocking UI, session replacement and tree navigation are distinct. | Track a local generation across low-level runs; invalidate on replacement/navigation/reload. |
| `dist/core/extensions/types.d.ts:980–983`; `dist/core/agent-session.js:2020–2028` | Public `pi.sendUserMessage()` returns `void`. The runtime catches asynchronous failures and emits an extension error internally. No caller-supplied request ID or delivery receipt is exposed. | A returned call is only an **attempt**, not accepted delivery. Awaiting it does not fix this. Correlation remains a certification gate. |
| `dist/core/agent-session.js:821–945,1161–1188` | Input handlers may handle/transform text; asynchronous auth/preflight precedes the run. `expandPromptTemplates` defaults false for extension sends. Busy delivery uses `steer` or `followUp`. | Use literal text by default. Account for intercepted/transformed input, busy races and pre-run failures. Do not claim an atomic idle-check-and-submit operation. |
| `docs/extensions.md`, `ctx.isIdle`, `ctx.hasPendingMessages`, `ctx.signal`, `message_end`, `tool_execution_end` | Public hooks expose readiness and message/tool results, but not a durable external dispatch token. | Build evidence in the extension; absence of an observed message is not proof of rejection after a crash. |
| `docs/extensions.md`, session replacement lifecycle | Old session-bound closures become stale after shutdown/replacement. | Revoke the old IPC capability and cancel pending callbacks. Never redirect old work into a newly opened session. |
| `docs/extensions.md`, `appendEntry` / `registerEntryRenderer` | Custom entries do not enter model context; custom messages do. | Use entries/status/widgets for Coordinator/resume UI, not hidden context injection. |
| `docs/tui.md` / `docs/extensions.md` | Public Pi UI supports overlays, editor replacement, widgets and status. | These are not an exposed full-height transcript reflow/split interface; retain native Herdr layout. |
| `docs/session-format.md` | Versioned JSONL, parent-linked branches, compaction/retained-tail records; session metadata is not task acceptance. | A bounded read-only parser must preserve lineage and unknowns. Do not open historical files through an API that may migrate/write them. |

### Original standalone terminal candidate inspection

**Qualification outcome:** a standalone `pi-tui` spike proved that the library packages and builds outside Pi, but its note surface failed acceptance on exact-byte fidelity, safe display of untrusted text, selector behaviour and path handling. The source inspection below is not adoption approval.

Installed `@earendil-works/pi-tui@0.85.1/dist/index.d.ts` exports `ProcessTerminal`, `TuiAltScreen`, `Editor`, `VStack`, `HStack`, `ScrollView`, `stripTerminalSequences`, and width utilities. It exports `TUI` as a **type**, not a constructible class. This is a credible library candidate, not a proven companion implementation. A standalone distribution must resolve its own dependency; Pi extension loader aliases do not apply outside Pi. Viewport sizing, selection, multiline paste and production-only packaging need the first checkpoint spike.

## Herdr schema and lifecycle authority

Commands inspected: `herdr --help`, `herdr api --help`, `herdr api schema --help`, `herdr pane --help`, `herdr agent --help`, and help for `pane split`, `pane report-metadata`, `pane get`, `pane run`.

Export schema with **either** `herdr api schema --json` **or** `herdr api schema --output PATH`; the installed CLI rejects combining both flags. Exported protocol is **20**.

| Interface | Observed shape | Limit |
|---|---|---|
| `pane.split` / `PaneSplitParams` | `direction`, `target_pane_id`, `workspace_id`, `cwd`, `env`, `ratio`, `focus` (default false), `right_click`. CLI direction supports `right`/`down`. | No executable/argv field in this schema. Preserve original pane; create right split with explicit target and no focus. |
| `pane.get` | `{pane_id}`; response envelope `{id,result:{type:"pane_info",pane:...}}`. Pane includes `terminal_id`, `revision`, cwd, workspace/tab, optional `agent_session`, display metadata/tokens. | Identity/liveness observation, not an atomic process-ownership precondition for a later mutation. |
| `pane.report_metadata` | Required `pane_id`, `source`; optional `applies_to_source`, `display_agent`, `seq`, `ttl_ms`, `tokens`. Token keys match `[A-Za-z0-9_-]{1,32}`, max 16 supplied; TTL 1–86400000 ms. | Display-only metadata, not lifecycle authority or proof a task succeeded. |
| Success envelope | `{id,result}`; schema includes `{type:"ok"}` and typed results; failures use a separate error envelope. | Must parse a full LF-delimited response, match ID and validate type/error. Receiving arbitrary bytes is not success. |
| `pane.close` | `{pane_id}`. | No ownership token/CAS in request. Prefer the owned companion exiting itself; do not close a reused pane on stale identity. |
| CLI `pane run <PANE_ID> <COMMAND>...` | Launch helper exists; **no `pane.run` method** in exported request methods. | Do not invent a socket method or send note text to this helper. Qualify launch behavior on an owned disposable shell before using it. |

One live `pane.get` on the current pane showed agent `pi`, state `working`, correct repo cwd, and an `agent_session` path attributed to **`herdr:pi`**. No transcript was read and no metadata was changed.

Installed lifecycle integration: `~/.pi/agent/extensions/herdr-agent-state.ts`, managed v8. It uses `pane.report_agent_session` and `pane.report_agent` under source `herdr:pi`, tracks blocking state, and publishes idle on settled plus `ctx.isIdle()`. It neither classifies task success nor emits a public correlated completion acknowledgment for Promptr. Its private socket helper treats the first incoming data as delivery and retries; do not reuse that as Promptr's acknowledgment contract or modify this managed file.

Proposed Promptr acknowledgment: report display-only tokens under `source:"promptr"`, `applies_to_source:"herdr:pi"`, then parse the response and read the exact tokens back with `pane.get`. Use opaque session/generation/outcome hashes only, not prompts, secrets or absolute session paths. Check actual session identity separately. This acknowledges publication of **Promptr's own classification**, not independent verification by Herdr. Token echo, stale-sequence behavior, TTL expiry and authority coexistence remain untested live.

## OpenKnowledge: upstream evidence is not deployment verification

`GET https://openknowledge.example.com` returned **401 / Basic**. No configured OpenKnowledge credential variables were present. The existing document `promptr` was **not read**; its content, revision and deployed version remain unknown. No guessed read/save endpoint was requested. No credentials were sought in session history.

Pinned upstream inspected: [`inkeep/open-knowledge@53863bad7040466108d22ad7a272dda1a4213ad4`](https://github.com/inkeep/open-knowledge/tree/53863bad7040466108d22ad7a272dda1a4213ad4).

- [`packages/core/src/schemas/api/agent-write.ts`](https://github.com/inkeep/open-knowledge/blob/53863bad7040466108d22ad7a272dda1a4213ad4/packages/core/src/schemas/api/agent-write.ts): `AgentWriteMdRequestSchema` includes `docName`, `markdown`, optional `position: append|prepend|replace`, identity and summary; it exposes **no explicit expected-revision field**. `AgentPatchRequestSchema` uses find/replace and optional offset, which is not a whole-document CAS contract.
- [`packages/server/src/api-extension.ts`, `handleAgentWriteMd`](https://github.com/inkeep/open-knowledge/blob/53863bad7040466108d22ad7a272dda1a4213ad4/packages/server/src/api-extension.ts#L3579): includes disk reconciliation, CRDT transactions, divergence detection and persistence handling. These do not establish a client revision-precondition guarantee. The inspection did not establish a supported HTTP `If-Match` contract.
- [`packages/core/src/schemas/api/pages.ts`](https://github.com/inkeep/open-knowledge/blob/53863bad7040466108d22ad7a272dda1a4213ad4/packages/core/src/schemas/api/pages.ts): create-page requires a path; this is not a save API for existing content.

**Decision:** remote publishing remains disabled until deployed read/write semantics and stale-write refusal are demonstrated. A read-before-write plus read-after-write client cannot eliminate an intervening remote writer. Do not assume CRDT internals, local locks, or content hashes solve that race. If the deployed interface lacks conditional writes covering all writers, obtain a separate owner decision: a server-side mediated write contract, an actually enforced exclusive-writer arrangement, or explicitly limited manual export. None is silently substituted for the required two-way sync feature.

## ACP request — explicitly deferred

The intended ACP setup is **Pi running on the knowledge-base server**. It was deferred because it is not simple. No ACP config, trust entry, package install, provider authentication, or agent launch was changed. This is separate from Promptr's note-sync interface.

Upstream evidence for a later setup session:

- [`packages/server/src/acp/registry.ts`](https://github.com/inkeep/open-knowledge/blob/53863bad7040466108d22ad7a272dda1a4213ad4/packages/server/src/acp/registry.ts) maps `pi-acp` to `pi` and reads custom agents from `acp-agents.json` under its supplied `localDir`. Do not guess that directory on the deployment.
- [`packages/server/src/acp/harness-availability.ts`](https://github.com/inkeep/open-knowledge/blob/53863bad7040466108d22ad7a272dda1a4213ad4/packages/server/src/acp/harness-availability.ts) probes the `pi` executable; presence is not authenticated launch proof.
- [`packages/cli/src/commands/pi-acp-bridge.ts`](https://github.com/inkeep/open-knowledge/blob/53863bad7040466108d22ad7a272dda1a4213ad4/packages/cli/src/commands/pi-acp-bridge.ts) can write a project bridge **and modify Pi's trust store**. Do not run setup as an innocuous read-only probe.
- Upstream README requires Node 24+ for its current web CLI; this workstation's Node 22 says nothing about the server's runtime.

Resume only on renewed request: obtain an SSH target/workspace path through a non-secret channel, inspect deployed version/service user/PATH/workspace/registry, verify the supported Pi ACP adapter and provider authentication, propose bounded config/trust changes with rollback, then perform an approved handshake-only test before any model turn. Never mount the workstation's entire Pi credential/config tree into a remote service by default.

## Reproducing this

Re-run the inspection against your own installed versions: export the Herdr
schema with `herdr api schema --json`, read Pi's installed `docs/extensions.md`,
`docs/tui.md`, `docs/packages.md` and `docs/session-format.md` plus the bundled
type declarations, and read the pinned upstream knowledge-base sources linked
above. Record the versions you inspected alongside the findings.

This inspection establishes none of the live delivery, editor-draft
preservation, crash durability, server conditional-write, production-packaging
or ACP claims. Those need their own evidence.
