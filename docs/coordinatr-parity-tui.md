# Coordinatr parity, direct send, Clear Queue, TUI redesign, composer archive

An increment implemented directly against the locally installed Pi extension and
published here as `extension/` source. Prior state:
`/promptr` (hosted, persistent, submittable) vs `/coordinatr` right pane
(session-only demo, sample note, no send). This increment closes that gap.

## What changed (all in `extension/src`)

1. **Full parity in the right pane** (`companion/spike.mts`, `coordinatr/layout.mts`,
   `extension/coordinatr.mts`). New CLI surface:
   `demo --state-dir <projectDir> [--tracking-file <t.json>] [--pi-pane <id>]`.
   With `--state-dir` the companion loads/saves the same `scratch.md` /
   `queue.json` / `composer.md` the hosted `/promptr` view uses, renders the
   same board/composer/note UI as `hosted:true` (persistent banner, `Ctrl+S`
   review, panel `s` submit), refreshes tracking every 5 s, and closes with
   state kept (last-write-wins with a concurrently open `/promptr`; restart
   converges). Without `--state-dir` the historical session-only demo is
   unchanged. The `/coordinatr` launcher now passes `--state-dir` (project
   state dir) and `--pi-pane` (calling Pi pane); launcher strings remain fixed
   code plus quoted owner-controlled paths/ids only.
2. **Explicit direct send** (`companion/spike.mts` `sendViaHerdr` + in-window
   `SendReview`). `Ctrl+S` (or panel `s` on the `j/k`-focused thought) opens a
   review showing the exact text; `Enter` submits via
   `herdr agent prompt <pi-pane> <text>` with no shell (argv only),
   `Esc` cancels. One item only; items retained (attempted != delivered); no
   auto-drain, no retries. Invalid pane, whitespace-only, missing `herdr`,
   `agent_blocked`, and `agent_prompt_stalled` all keep the queue with a
   notice. Without `--pi-pane` nothing is sent; the notice points at `/promptr`.
3. **Clear Queue** (`queue/pending.mts` `clearQueue()` + view wiring). `Ctrl+U`
   anywhere, or `x` in the panel, arms a `y/n` confirmation naming the item
   count; confirming drops all items, keeps composer and note, bumps revision
   by one (clearing an empty queue is a no-op). Works identically in `/promptr`
   and `/coordinatr`.
4. **TUI redesign, proqi-style** (`companion/view.mts`, review dialog in
   `spike.mts`). Full-width `── TITLE ──` section rules padded to the viewport;
   focused section header and editor borders glow bold cyan while idle sections
   recede to gray; dim hints, cyan focus row, green progress-fill on dim track
   for tracker bars, colored review dialog. Painters wrap whole lines only, so
   content substrings are never split by escape codes; all width math stays
   ANSI-aware; `NO_COLOR` disables color.
5. **Composer archive** (`companion/view.mts` `archiveComposerToNote`). Every
   queued composer prompt is appended to the note as
   `-- Queued YYYY-MM-DD HH:MMZ --` plus the text (ASCII-only stamp, appended
   at end, selection undisturbed, buffer bound honored with an honest notice).
   Footer confirms `stored in note`.

## Verification (against the installed tree)

- `tsc` typecheck and build pass (clean-room install in a scratch directory plus a
  host peer link).
- 29/29 compiled behavior tests pass (board/combo/paste, layout,
  single-dialog). One intermediate failure during the redesign (renamed
  tracking header) was caught by the suite and reverted.
- `spike.mjs demo --self-check` green, extended with Clear Queue and
  composer-archive probes.
- Shared-state round-trip, clear-then-save round-trip, launcher quoting and
  `--pi-pane` validation, and `herdr` error paths exercised via node one-liners.
- Live check: a direct `sendViaHerdr(<pane id>, 'Reply with hello only')` call was
  accepted by Herdr; the prompt arrived as a real left-pane turn and got its
  `hello` reply.

## Limits

- No live TUI-driven send from an actual right pane was exercised (canary used
  the same function the review-confirm path calls, not the keypress path).
- Last-write-wins between `/promptr` and `/coordinatr`; no live queue merge.
- `test/*.mts` sources were not preserved (see `extension/README.md`); only
  the self-check and the stale compiled suite back this increment.
- The configured tracker remains the roadmap; no issue was closed by this
  increment.
