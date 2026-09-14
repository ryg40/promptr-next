# Promptr interaction prototype: 10-minute demo guide

This is a throwaway interaction prototype for the companion layout. It exists to
answer one question: **is this layout and these selection/focus controls useful?**
It is not a release and it is not safe for real notes.

## Run it

```sh
node <checkout>/extension/src/companion/spike.mts demo
```

One ordinary offline terminal process. Quit with `Ctrl+C`, then `y` to confirm.

## What it does not do

- **Nothing is saved.** The note, the composer and the queue are in memory only
  and are discarded when the process exits. There is no state directory.
- **Nothing is sent.** No network, no Pi connection, no send, dispatch or sync.
  Queue entries are inert text; nothing is ever executed.
- **No real notes.** The sample note is built in. The prototype never opens,
  reads or writes a notebook.
- **Typing is printable ASCII and LF only.** No tabs, no CRLF, no accents, no
  CJK, no emoji. Unsupported text is refused with an on-screen notice.
- **Type; do not paste.** Marked paste is rejected visibly while bracketed-paste
  reporting remains enabled. Unmarked paste cannot be distinguished from typing;
  use a bracketed-paste-capable terminal. This is not a clipboard safety guarantee.
- No undo, no search, no save, no scrollback export, no mouse.

## Controls

| Key | Effect |
|---|---|
| `Tab` | Cycle focus between the note editor, the queue panel and the composer |
| typing | Edits whichever of the note or composer has focus |
| `Up` / `Down` | Move the selected physical line (panel focus) |
| `Shift+Up` / `Shift+Down` | Extend the selection (panel focus) |
| `Enter` (panel) | Copy the selected lines into the queue |
| `Enter` (composer) | Insert a line break in the composer |
| `Ctrl+Enter` or `Ctrl+E` (composer) | Add the composer text to the queue |
| `Ctrl+C` | Ask to quit; `y` confirms, `n` or `Esc` cancels |

If `Ctrl+Enter` does nothing in your terminal, use `Ctrl+E` and tell us. Some
terminals cannot send Ctrl+Enter distinctly. `npm run demo` is the interactive
script in `extension/`; `npm run demo:offline` is only a self-check.

## The five things to try

1. Edit three sample paragraphs in the note.
2. Select a range and add it to the queue twice, then check that the note is
   unchanged and the queue shows both entries in the order you added them.
3. Edit the composer and add it to the queue explicitly with `Ctrl+Enter`.
4. Switch focus with `Tab`, resize the terminal window, press `Ctrl+C` and
   cancel once, then press `Ctrl+C` again and confirm the quit.
5. Tell us whether the layout and the selection/focus controls are useful, and
   what is the first missing behaviour that stops you using this for real work.

## Three questions to answer

1. Did the two-region layout (note plus queue/composer) match how you actually
   want to pull text out of a note?
2. Was anything about selecting, adding to the queue, or switching focus
   confusing, slow, or in the wrong place?
3. What is the single first thing you would need added before this is worth
   using — and is "nothing is saved" the blocker, or something else?

Stop here. Persistence is the proposed next increment, but it is not started
until this feedback comes back.
