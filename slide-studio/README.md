# Slide Studio

A local, desktop-feel web app that lets non-technical Micron colleagues chat
with a coding-agent CLI (codex or GitHub Copilot) to design professional slide
decks. Lives **inside** the `jm-design` repo as an app subtree — not a separate
repo. North-star spec: [`docs/slide-app-implementation-plan-2026-06-14.md`](../docs/slide-app-implementation-plan-2026-06-14.md).

## Status

**Slice 1 — Walking skeleton (jm-design#3) shipped.** A thin end-to-end path
through every layer: launcher → Node daemon → detect + spawn codex (prompt via
stdin) → normalize its JSON event stream → stream over WebSocket → Angular +
Atlas chat. A Home input creates a Project (persisted on disk) and opens the
workspace; the streamed reply renders token-by-token.

**Slice 2 — Guided brainstorm + live Brief + Gate 1 (jm-design#4) shipped.** The
Prompt Composer (`apps/daemon/src/skills.ts`) assembles persona + the staged
`slide-brainstorm`/`slide-consultant` skill bodies + the conversation transcript
into one user message (no system-prompt flag). The agent emits a structured
\`\`\`brief\`\`\` block each turn; the daemon parses it (`apps/daemon/src/brief.ts`)
and pushes it to the **Brief (Recorded Discussion)** panel, which fills in
audience / goal / narrative arc / key messages live. A **Gate 1** affordance
(Approve arc / Request changes) advances the flow to Wireframe or loops it back
into chat; the top stepper tracks the stage.

**Slice 4 — Annotate the wireframe → agent revises + Gate 2 (jm-design#11)
shipped.** The daemon injects a vanilla-JS **Annotation SDK**
(`apps/daemon/src/annotation-sdk.ts`, served at `/api/annotation-sdk.js`) into the
sandboxed Wireframe iframe. The user **clicks an element**, **selects text**, or
**comments on the whole slide**; the SDK captures a re-locatable anchor (CSS
selector path ≤5 levels preferring `id`/`:nth-of-type`, or a text-range
common-ancestor + start/end boundaries — borrowed from lavish, plan AD-6) and
posts it to the host, which queues it as a composer pill in the durable feedback
queue. On send, `apps/daemon/src/annotation.ts` serializes the queue into a
structured `<attached-preview-comments>` block — anchor, current text, slide
index, screenshot ref, and the scoped **"change ONLY these elements"**
instruction — so the agent revises exactly those elements and the iframe
live-reloads (chokidar). **Gate 2** (Approve wireframe) advances Wireframe →
Theme; the anchoring (capture → mutate the DOM → relocate) and the serializer are
proven by the `annotation-anchoring` (jsdom) and `annotation-serializer` suites.

**Slice 12 — Deck-level annotation & iterate (jm-design#15) shipped.** The final
**Deck** reuses the **same** Annotation SDK the Wireframe does (plan §M8). The Deck
iframe injects the daemon's single SDK source (`apps/web/.../deck/deck.component.ts`),
which now listens on either host channel (`ss-wireframe-host` / `ss-deck-host`) and
**tags each queued annotation with its `surface`** — `deck` when the Deck host drives
it. A `surface: 'deck'` annotation serializes through a **regenerate-scoped** header
(`apps/daemon/src/annotation.ts`: "Regenerate ONLY the slides named below… re-run the
verify gate") instead of the wireframe's in-place wording. The workspace queues deck
annotations as pills and shows a **Regenerate deck** affordance; on regenerate the
daemon's `generate` path detects the pending deck annotations
(`feedback-queue.ts::hasDeckAnnotations`), carries them as the scoped block, runs the
agent so it rewrites exactly the affected slides, re-runs the html-slides verify gate,
and consumes the annotations only on a clean run (an interrupted regenerate leaves
them pending). Proven by the `deck-annotation` (surface-aware serializer + queue
survival) and `deck-sdk` (jsdom — a deck-host click emits `surface: 'deck'`) suites.

**Slice 11 — Recent projects + resume (jm-design) shipped.** Home lists recent
Projects newest-first; reopening one restores the full record + conversation
transcript (`apps/daemon/src/projects.ts` `load`/`listRecent`).

**Slice 13 — Reliability & friendly errors (jm-design#7) shipped.** A thin
end-to-end reliability pass:

- **Friendly errors + recovery (AC1).** Every failure the run surface can
  produce — a raw spawn/Node error (`EACCES`/`ENOENT`/…), an agent CLI `error`
  line, the inactivity-watchdog stop, a dropped socket — is mapped by
  `apps/daemon/src/errors.ts` into a plain-language message + a `recovery` action
  (`retry` | `signin` | `reconnect` | `install`). The chat renders a friendly
  **error card** with a recovery button (Retry / Sign in & retry / Reconnect &
  retry), never a raw CLI error inlined into the bubble. The WebSocket client
  surfaces a dropped connection as a recoverable error and re-opens on retry.
- **Queued feedback survives interruption (AC2).** Queued annotations / feedback
  are persisted per-project in `feedback-queue.jsonl`
  (`apps/daemon/src/feedback-queue.ts`) the moment they're queued, attached to the
  next turn as an `<attached-preview-comments>` block, and marked sent **only**
  after a clean run. A cancel / error / disconnect never marks them sent, so they
  stay pending and ride the next turn. The composer shows them as pills,
  rehydrated from the daemon on load.
- **Theming + reduced motion (AC3).** Light is canonical, dark via
  `[data-theme="dark"]`; the toggle persists to `localStorage` and the first load
  honors the OS `prefers-color-scheme`. `prefers-reduced-motion: reduce` disables
  transitions/animations globally.

**Slice 10 — First-run onboarding + portable-Node launcher + orphan cleanup
(jm-design#10) shipped.** The packaging + first-run pass (plan §13, M7):

- **First-run wizard with IN-APP install/sign-in (AC1).**
  `apps/daemon/src/onboarding.ts` turns the runtime detection (§8.5/§8.6) into a
  plain-language **install → sign-in** plan (`/api/onboarding`). The
  `apps/web/.../onboarding` wizard walks a non-technical user from launch →
  installed → signed-in, never exposing a CLI flag. The step RUNS IN-APP: when a
  runtime declares an in-app command (`canRunInApp`), the wizard's primary button
  ("Install now" / "Sign in") asks the daemon to actually execute it —
  `apps/daemon/src/onboarding-exec.ts` spawns the install/login command (argv
  arrays, §13 quoting), **streams progress** over the WS (`onboard:progress`),
  maps any failure to a **friendly** message (never raw npm/CLI output), enforces
  a timeout, and re-detects so the card advances on its own (`onboard:result`).
  The external setup page remains a secondary fallback. Enterprise **GitHub
  Copilot is recommended** when present (codex is the fallback).
- **Portable-Node launcher (AC2).** `apps/daemon/src/portable-node.ts` resolves a
  **bundled** Node at `runtime/node/<os>/…` so the app runs with **no system Node
  install or admin rights**; the `.bat`/`.sh` + `bin/slide-studio.mjs` launch on
  it (falling back to the dev interpreter only when no bundle is present). The
  bundle is provisioned with `node scripts/provision-portable-node.mjs --download`
  (fetches + checksum-verifies the official Node distribution into the layout) or
  `--link` (dev convenience). The git-ignored `runtime/` tree is never committed.
- **Orphan cleanup (AC3).** `apps/daemon/src/process-registry.ts` tracks every
  spawned agent child; on app exit (Ctrl-C / launcher-window close → SIGTERM /
  SIGHUP) the daemon SIGTERMs every child, escalates to **SIGKILL** after a grace
  window for any process the OS still reports alive (a child that *traps* SIGTERM
  — aliveness is a real `process.kill(pid,0)` probe, NOT the misleading
  `ChildProcess.killed` flag), then closes the WS + HTTP server. The launcher
  forwards the signal + force-kills the daemon if it lingers. **No orphaned
  `codex`/`copilot` process or daemon is left behind.**

## Stack (locked, plan §5)

| Layer | Choice |
|---|---|
| App shell | Angular 22 (standalone + signals) |
| UI system | Atlas (Micron design tokens) — no Tailwind |
| Streaming | WebSocket (`ws`) ↔ browser WebSocket |
| Backend | Node 22+ + Express 5 (the "daemon") |
| Agent driving | `child_process` spawn + JSON event stream, prompt via **stdin** |
| State | per-project JSON files on disk |

## Layout

```
slide-studio/
├─ apps/
│  ├─ daemon/    # Node + Express + ws (the engine host)
│  │  ├─ src/runtimes/   # Runtime Adapters: types, events, detection, defs/{codex,copilot}
│  │  ├─ src/runs.ts     # run manager: spawn, stream, cancel, inactivity watchdog
│  │  ├─ src/projects.ts # Project CRUD + JSON persistence
│  │  ├─ src/skills.ts   # persona/context composition
│  │  ├─ src/server.ts   # http + ws; serves the Angular build
│  │  ├─ bin/            # launcher entry
│  │  └─ test/           # node:test suites
│  └─ web/       # Angular 22 + Atlas shell (home, workspace, chat, core)
├─ skills/       # vendored slide skills (one-way sync from jm-design)
├─ launcher/     # slide-studio.bat / .sh
└─ scripts/      # sync-skills.mjs
```

## Run it

```sh
pnpm install
pnpm --filter @slide-studio/web build      # build the Angular shell
pnpm --filter @slide-studio/daemon start    # or: launcher/slide-studio.sh
```

Then open `http://127.0.0.1:4317`. You need a `codex` (or `copilot`) CLI on PATH,
signed in. The daemon binds loopback-only (§15); no telemetry.

## Test

```sh
pnpm --filter @slide-studio/daemon test     # node:test, all daemon suites (253 tests)
pnpm --filter @slide-studio/web build       # Angular build (typecheck + bundle)
```

Slice 4 adds the `annotation-anchoring` (jsdom — capture an element / text-range
anchor, mutate the DOM, relocate) and `annotation-serializer` (the
`<attached-preview-comments>` block structure incl. the scoped instruction)
suites, plus a Gate 2 case in `projects`. Slice 12 adds the `deck-annotation`
(the surface-aware serializer — a `deck` annotation gets the regenerate-scoped
header — plus `hasDeckAnnotations` and the deck-surface queue-survival guarantee)
and `deck-sdk` (jsdom — the injected SDK listens on both host channels and a
deck-host click emits an annotation tagged `surface: 'deck'`) suites. Slice 13 adds the `errors`,
`feedback-queue`, and `theming` suites (friendly /
unauthenticated-error mapping, queued-feedback survival, light/dark +
reduced-motion contracts). Slice 10 adds the `onboarding`, `onboarding-exec`,
`process-registry`, `orphan-real-process`, and `portable-node` suites
(install→sign-in plan + IN-APP execution against real child processes,
SIGTERM→SIGKILL orphan cleanup proven by spawning and reaping **real** OS
processes, shutdown wiring, bundled-vs-system Node resolution). AC2/AC3 are also
proven by booting the daemon on a real **bundled** Node (`provision-portable-node
--download`) and confirming `lsof` shows the bundled binary plus an orphan-free
SIGTERM shutdown.

## Decision contracts (plan §8)

- **NormalizedEvent vocabulary** (`apps/daemon/src/runtimes/events.ts`):
  `status · thinking_delta · text_delta · tool_use · tool_result · usage · error · raw`.
- **RuntimeAgentDef** (`apps/daemon/src/runtimes/types.ts`): `bin`, `versionArgs`,
  `buildArgs(...)→string[]`, `promptViaStdin`, `streamFormat`, `eventParser`,
  `env`, `authProbe`, `inactivityTimeoutMs`, `capabilityFlags`. Each CLI is a
  declarative data file in `defs/`; the daemon never branches on agent id.
