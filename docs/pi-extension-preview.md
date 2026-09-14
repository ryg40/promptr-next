# Pi extension preview: explicit manual submission

Installed locally at `~/.pi/agent/extensions/promptr/index.ts`. In **Pi**, after the current turn finishes:

```text
/reload
/promptr
```

This increment opens the reused companion UI **inside the current Pi pane**. It is not yet the planned attached right-pane `/coordinatr` integration. No pane is closed or repurposed by this extension.

## Quick try

1. `/promptr` opens the sample note. `Tab` twice moves from note to composer.
2. Type a harmless sample prompt, such as `Reply with hello only`.
3. **Ctrl+E** copies the composer into the session queue.
4. **Ctrl+S** opens the queue picker. Select one item with arrows/Enter.
5. Review its full text (arrows/PgUp/PgDn scroll). Enter continues; Escape cancels.
6. Confirm submission. This calls Pi's public `sendUserMessage` with literal text and template expansion disabled. The agent may respond and run tools according to the submitted request.

Pi must be idle and have no pending messages. Submission is rechecked after review and confirmation. Only one item is attempted; no automatic queue draining or retries.

Queue items remain available for inspection. Attempted items are labeled `attempted/unknown` in the picker and cannot be submitted again from that same item. **Attempted does not mean delivered or successful.** Check the Pi conversation before deliberately enqueuing another copy. Other extensions may intercept or transform input, and Pi may fail asynchronously; this preview does not certify delivery or task success.

## Editing and limitations

- `Tab`: note → selection panel → composer.
- Panel arrows move the line selection, Shift+arrows extend; Enter queues a copy without deleting note text.
- Composer Enter inserts a newline; Ctrl+E or Ctrl+Enter queues its text.
- Escape or Ctrl+C closes the hosted view **without discarding its in-memory state**. `/promptr` reopens it.
- **No notebook persistence.** Reload, session replacement or Pi exit loses the note, composer, queue and attempt history. Use sample text, not real notes. Closing the hosted UI alone retains them.
- Printable ASCII/LF typing only. Marked paste is rejected; unmarked paste cannot be distinguished from typing. Type, do not paste.
- No persistence, sync, right-pane IPC, busy steering, automatic FIFO, `/coordinatr` or `/handoffr` implementation in this increment.
- This is an installable local preview, not full-product acceptance.

## Scope of this preview

This guide describes the first installable extension increment: the hosted view,
the command surface and the explicit one-item submission path. Loader
verification is not live-delivery qualification, and nothing here claims full
product acceptance.

Installation contains only the compiled source, entrypoint, manifests and
production dependencies; fixtures, logs, tests and documentation are excluded.
