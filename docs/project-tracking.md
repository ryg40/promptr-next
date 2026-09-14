# Project tracking (Omakase-adapted, Gitea-backed)

> **Design note:** this page records the design of the tracker integration as it
> was adopted. The implementation now lives in `extension/src/tracking/` with
> wiring in `extension/src/companion/`, `extension/src/extension/`,
> `extension/src/coordinatr/layout.mts` and `extension/src/state/paths.mts`.
> The configured tracker stays authoritative; Promptr never writes to it.

## What was adapted

Source: [itama8/omakase-skills](https://github.com/itama8/omakase-skills)
(`extensions/omakase-bar/` + `skills/omakase-checkpoint-map`).
Omakase Bar reads a local `docs/plans/checkpoint-map.md` and exposes `/work-status`
cards with a progress bar counting accepted checkpoints (next counts 0.35).

Promptr adapts the *display shape* only, per the
[inspiration review](research/inspiration-review.md):

- **Tracker issues are authoritative and read-only.** Progress is
  closed/(open+closed) per milestone from the tracker API. Promptr never writes
  issues, milestones, or labels.
- **No second writable task database.** The snapshot at
  `projects/<slug>/tracking.json` is a display cache; every surface shows its
  age/staleness next to the numbers.
- **Issue text is untrusted data.** Titles are sanitized to one line;
  the companion view escapes control bytes again on paint (no raw ESC reaches
  the terminal; verified in smoke).
- **Progress shows closed issues, not effort or time** — stated on every surface,
  same honesty rule as Omakase's bar.

## Where it displays (coordinatr window)

- **Right-pane companion** (`/coordinatr` ensure): the launcher is still fixed
  code plus quoted owner-controlled paths only —
  `node '<entry>' demo --tracking-file '<state>/tracking.json'`.
  The companion reads that one file best-effort (placeholder when missing) and
  never writes. Tracking renders at the top of the panel, above the queue.
- **Pi-hosted `/promptr`**: same panel section, fed from the cache with one
  bounded live refresh before the first frame.
- **`/promptr-status`**: appends the full milestone breakdown after the
  git/queue/handoff status.
- **`/work-status`** (new, Omakase-adapted): notifies the full breakdown,
  then milestone → open-issue pickers. Choosing an issue reviews an explicit
  orient/start prompt; confirming queues it and offers the standard one-item
  review-and-submit. Attempted != delivered; nothing auto-sends.
- **`/coordinatr status`**: appends a one-line summary
  (`tracking 0/41 closed · S1.1 0/7 · …`).

## Configuration and cache

- Provider: Gitea or GitHub, both read-only through the same ports; every read
  routes by the bound repository's `provider`, never by an issue URL.
- Binding, first hit wins: `PROMPTR_TRACKER` in the environment (with
  `GITEA_*` / `GITHUB_*`) > `<project>/.promptr/tracker.json` >
  `<agent dir>/promptr/tracker.json` > the `origin` remote when it points at
  `github.com`/`GITHUB_HOST` or the configured Gitea host. With no binding at
  all the project reports an explicit unbound state instead of guessing a
  repository. Write the file with
  `promptr-tracker-init --provider gitea|github [--owner --repo --host --api --scope project|global --force --print --check]`
  or `/promptr-tracker init`; `/promptr-tracker status` and `promptr-doctor`
  show the resolved binding and its source. The file is
  `{version: 1, provider, host, owner, repo, apiOrigin?, boundAt, note?}` and
  holds no secrets, so a project may commit it.
- Auth: `GITEA_TOKEN` or `GITHUB_TOKEN`, always from the environment (never
  from a file). Private repos need it; without it the commands keep the cache
  and say so. The token is sent as an `Authorization` header only and never
  logged or persisted.
- Fetch is bounded (8 s timeout, ≤5 pages × 50 issues, pull requests excluded).
  Milestone `open_issues`/`closed_issues` counts are authoritative for the
  bars; the issue list supplies the visible open rows (≤10 per milestone,
  titles ≤100 chars).
- Cache TTL is 5 minutes and the cache is keyed by repository; `/work-status`
  always attempts a live refresh first and falls back to cache with the reason
  shown. The companion re-reads the binding on `r`.

## Try it

In Pi, after the current turn finishes:

```text
/reload
/work-status
/promptr-status
/coordinatr status
/promptr
```

`/promptr` shows the tracking section at the top of its panel.
Bare `/coordinatr` launches the right pane with `--tracking-file` pointing at
the current project's snapshot.

## Checks

- `tsc` typecheck and build pass.
- Behaviour checks cover the progress bar, title sanitization, grouping,
  authoritative counts, snapshot round-trip, compact and full rendering, the
  start prompt, remote parsing and cache age; a fetch stub for milestones and
  issues including a surfaced 401; cache round-trip with corrupt-cache fallback;
  tracking paint with ESC escaping; launcher argv with `--tracking-file`; and a
  self-check with and without a snapshot file.
- The extension loader smoke registers every command, including `work-status`.

## Limits

- `/work-status` start prompts follow the explicit review-and-submit path; they
  are never dispatched automatically.
- Launcher argv is verified as a string; a live Herdr split is exercised
  separately.
