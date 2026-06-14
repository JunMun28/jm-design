# Atlas Slides — Implementation Plan & Checklist (v1)

> **App home:** lives **inside the `jm-design` repo** as an app subtree (working folder `slide-studio/`) — **not a separate repo**. Working name "Slide Studio". Published PRD: jm-design#1.
> **Status:** approved direction, pre-build. **Date:** 2026-06-14.
> **Companion research:** [slide-app-research-2026-06-14.md](./slide-app-research-2026-06-14.md).

---

## 0. How to use this document (READ FIRST, every session)

This is the **north-star spec** for the coding agent building Atlas Slides. The rules:

1. **Do not deviate from the locked decisions** in §1, §5, §16 without explicit human sign-off. If a decision seems wrong, raise it — don't silently change course.
2. **Build in the milestone order** of §20. Each checklist item has an **acceptance criterion**; do not check it off until that criterion is met and verified (run it, screenshot it).
3. **Copy the proven patterns** from the three reference repos in §19 — do not re-research solved problems (codex/Copilot driving, annotation payloads, sandbox bridges).
4. **When in doubt about domain words, use §3 (Glossary).** Keep code and UI labels consistent with it.
5. **Respect the non-goals in §16.** This is a *slides-only internal tool*. Do not add image/video/audio generation, cloud model routers, marketplaces, or telemetry.
6. This doc is the source of truth over any individual chat message. Update it (with human approval) when scope genuinely changes; never let the code and this doc drift.

---

## 1. Product summary & non-negotiables

**What:** A local desktop-feel web app that lets **non-technical Micron colleagues** chat with an AI agent to design professional presentation slides. The agent brainstorms like a McKinsey-grade slide consultant, keeps a live record of the discussion, shows a **low-fi wireframe** of each slide for review, lets the user **annotate** it with comments that go back to the agent, then generates the final deck as **PPTX or HTML** in a selectable Micron theme.

**Why:** The same generation power exists today only through a raw coding-agent CLI (codex), which non-technical users cannot operate or iterate on. This app is the friendly wrapper.

**Non-negotiables (v1):**
- **N1.** Runs locally on the user's own **Windows** desktop; launched by double-clicking a wrapper (`.bat`/`.exe`) — no terminal use required by the end user.
- **N2.** Uses the **user's own installed agent CLI and account** (codex *or* GitHub Copilot CLI). If the CLI is missing, the app **helps install it**.
- **N3.** Supports **both** codex CLI **and** GitHub Copilot CLI through one runtime-adapter abstraction (§8). **Enterprise GitHub Copilot is the production runtime** (the Micron-sanctioned endpoint); **codex is the development/fallback runtime**. The app **defaults to Copilot when present** and labels codex as the fallback.
- **N4.** The full flow ships in v1: chat brainstorm → live recorded discussion → low-fi wireframe review + annotation → generate → export **PPTX and HTML**, with **theme/template selection**.
- **N5.** The **app shell** is **Angular + Atlas** (Micron design system). The **slide output** uses the existing **`html-slides` Micron themes** (separate styling surface — see §11).
- **N6.** The **generation engine is the existing slide skills run by the agent** (§9) — we do not reimplement slide logic.
- **N7.** **No telemetry, no cloud calls** beyond the agent CLI's own model API. Internal-tool privacy posture (§15).

---

## 2. Users & context

- **Primary users:** Micron internal colleagues, non-technical, building decks for engineering reviews, trainings, board/townhall updates. Time-constrained, skeptical of stock visuals (see `jm-design/PRODUCT.md`).
- **Deployment:** each user runs it on their own Windows machine, signed into their own codex/Copilot account. Internal distribution (company cert / file share / internal registry).
- **Operators/maintainers:** Micron Angular developers — hence the Angular + Atlas alignment.

---

## 3. Glossary (domain language — keep code & UI consistent with this)

> This seeds the app's `CONTEXT.md` (in `jm-design`). Avoid the listed alternatives.

- **Project** — a single deck-building workspace: one brief, its conversation, its artifacts, its outputs. _Avoid:_ session, folder, file.
- **Agent Runtime** — a supported coding-agent CLI the app can drive (codex, Copilot). _Avoid:_ model, LLM, backend.
- **Runtime Adapter** — the declarative definition of how to detect, launch, prompt, and parse one Agent Runtime (§8). _Avoid:_ driver hack, per-agent if-branch.
- **Brief (Recorded Discussion)** — the live, structured record of decisions from the brainstorm (audience, goal, narrative arc, key messages, constraints). Rendered in the canvas; updated as the conversation progresses. _Avoid:_ chat log, transcript, notes.
- **Wireframe** — the **low-fi**, theme-less, per-slide draft layout the user reviews and annotates **before** the high-fi deck is built. _Avoid:_ draft deck, mockup, preview.
- **Deck** — the final, themed, high-fi slide output (HTML and/or PPTX). _Avoid:_ wireframe, artifact (too generic).
- **Artifact** — any agent-produced reviewable file (Wireframe or Deck), described by an **Artifact Manifest**. _Avoid:_ output, asset.
- **Artifact Manifest** — a small sidecar JSON the app reads to know an artifact's kind (`wireframe`|`deck`), format, entry file, and slide count, so it renders the right canvas surface (§9.4). _Avoid:_ project metadata.
- **Annotation** — a user comment pinned to a specific element / text range / slide on a Wireframe (or Deck), sent back to the agent as a structured instruction (§10). _Avoid:_ note, highlight.
- **Theme / Template** — a named `html-slides` visual style the user picks for the Deck (e.g. `micron-dark`). _Avoid:_ design system (that's Atlas, the app shell), skin.
- **Gate** — an explicit human approval checkpoint: **Gate 1** approve the Brief/arc, **Gate 2** approve the Wireframe, **Gate 3** pick the Theme. _Avoid:_ step, milestone.
- **Skill** — a `SKILL.md` the agent follows to do a stage of work (brainstorm, consultant review, html-slides, etc.). _Avoid:_ plugin, tool.
- **Run / Turn** — one agent invocation streaming a normalized event sequence to the chat. _Avoid:_ request, job.

---

## 4. Architecture

```
┌──────────────────────── Windows desktop (the user's machine) ───────────────────────┐
│                                                                                       │
│  Launcher (.bat/.exe)                                                                  │
│   ├─ ensure Node + agent CLI present (help install if missing)                         │
│   ├─ start the local server (daemon)                                                   │
│   └─ open the browser at http://127.0.0.1:<port>                                       │
│                                                                                        │
│  ┌──────────────── Browser: Angular + Atlas app shell ─────────────────┐               │
│  │  LEFT: Canvas                          RIGHT: Persistent chat        │               │
│  │   ├─ Brief (recorded discussion)        ├─ streamed agent turns      │               │
│  │   ├─ Wireframe preview (sandboxed       │   (thinking/text/tools)    │               │
│  │   │   iframe + annotation SDK)          ├─ user composer             │               │
│  │   ├─ Deck preview (sandboxed iframe)    └─ Gate approvals + theme    │               │
│  │   └─ Export panel (PPTX / HTML)             picker affordances       │               │
│  └───────────▲───────────────────────────────────────▲─────────────────┘               │
│              │ WebSocket (events) + HTTP (commands)    │                                 │
│  ┌───────────┴────────────────── Node daemon (Express + ws) ───────────────────────┐   │
│  │  Runtime registry & detection ── Runtime Adapters: [codex] [copilot]            │   │
│  │  Run manager → spawn CLI (stdin prompt) → parse JSON event stream → normalize   │   │
│  │  Skills/design staging · Artifact watcher (chokidar) + manifest reader          │   │
│  │  Annotation → structured prompt block · Export (collect PPTX/HTML) · Project DB │   │
│  └───────────────────────────────────────┬────────────────────────────────────────┘   │
│                                           ▼                                              │
│            agent CLI (codex | copilot)  ──runs──▶  slide SKILL.md skills                 │
│             (user's own account/auth)                (brainstorm→consultant→             │
│                                                       html-slides→html-to-pptx/quick)    │
│                                           ▼                                              │
│                              Wireframe (low-fi HTML)  →  Deck (themed HTML + PPTX)        │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

**Control-flow principle:** *orchestration lives in the skills* (the agent follows them), *the app provides surfaces + tools* (chat, brief, wireframe/annotation, theme picker, export) and reacts to what the agent produces (via the Artifact Manifest + file watcher). The daemon never hard-codes the slide pipeline.

---

## 5. Tech stack (LOCKED)

| Layer | Choice | Notes |
|---|---|---|
| App shell | **Angular 22** (standalone + signals) | matches Atlas |
| UI system | **Atlas (`atlas-ui`)** via its shadcn-style schematics + `micron-tokens.css`; Bootstrap 5.3 + Angular CDK base | **no Tailwind**; consume Atlas from `atlas-design-system/atlas-ng` (internal) |
| Streaming | **RxJS `webSocket()`** ↔ Node **`ws`** | normalized agent events |
| Backend | **Node 22+ + Express 5** (the "daemon") | serves Angular build, hosts adapters |
| Agent driving | **`child_process` spawn + JSON event stream** | codex + Copilot; prompt via **stdin** (§8) |
| Annotation | **lavish-style SDK** (vanilla JS) injected into a sandboxed `<iframe>`; per-slide comment payload modeled on open-design | §10 |
| Engine | **agent + existing slide SKILL.md skills**; Deck output uses `html-slides` themes | §9, §11 |
| State | per-project **JSON files** on disk (SQLite only if needed) | §14 |
| Packaging | **`.bat`/`.exe` launcher** + bundled Node server + Angular static build | §13 |

---

## 6. Repo & module layout (target)

```
jm-design/slide-studio/        # app subtree INSIDE the jm-design repo (not a separate repo)
├─ apps/
│  ├─ daemon/                 # Node + Express + ws server (the engine host)
│  │  ├─ src/
│  │  │  ├─ server.ts         # http + ws, serves the Angular build
│  │  │  ├─ runtimes/         # Runtime Adapter abstraction (§8)
│  │  │  │  ├─ types.ts       # RuntimeAgentDef interface
│  │  │  │  ├─ registry.ts    # list/detect adapters
│  │  │  │  ├─ detection.ts   # PATH probe, version, auth state
│  │  │  │  ├─ events.ts      # normalized event model + per-CLI parsers
│  │  │  │  └─ defs/
│  │  │  │     ├─ codex.ts
│  │  │  │     └─ copilot.ts
│  │  │  ├─ runs.ts           # run manager: spawn, stream, cancel
│  │  │  ├─ skills.ts         # stage skills + compose persona/system block
│  │  │  ├─ artifacts.ts      # watch project dir, read Artifact Manifests
│  │  │  ├─ annotations.ts    # comments → structured prompt block
│  │  │  ├─ export.ts         # collect/serve PPTX + HTML outputs
│  │  │  ├─ projects.ts       # project CRUD + JSON persistence
│  │  │  └─ onboarding.ts     # node/CLI/auth checks + install helpers
│  │  └─ bin/slide-studio.mjs # CLI entry the launcher calls
│  └─ web/                    # Angular 22 + Atlas app shell
│     └─ src/app/
│        ├─ home/             # clean centered start screen (prompt → creates Project)
│        ├─ workspace/        # the one-workspace layout (canvas left, chat right)
│        ├─ chat/             # streamed turns + composer + gate affordances
│        ├─ brief/            # recorded-discussion panel
│        ├─ wireframe/        # sandboxed iframe + annotation overlay
│        ├─ deck/             # sandboxed iframe deck preview + nav
│        ├─ themes/           # theme/template picker
│        ├─ export/           # PPTX/HTML export panel
│        └─ core/             # ws client (RxJS), project state (signals), api
├─ skills/                    # copied/symlinked slide SKILL.md skills (the engine)
├─ design/                    # Atlas DESIGN.md reference for slide styling context
├─ launcher/                  # slide-studio.bat / .exe wrapper + install helpers
├─ docs/                      # CONTEXT.md (from §3), this plan, ADRs
└─ package.json               # pnpm workspace
```

---

## 7. User flow & UI

**Home / Start screen (entry):** a clean, centered, uncluttered prompt — app wordmark, a short headline ("What deck do you want to build?"), and **one large input** ("Describe the deck you want…") with an **attach control (for source files — data, an existing deck/PDF, screenshots; see §9.5)** and a send button. A small **runtime selector** (codex / Copilot) sits near the input when more than one is detected. Optional **starter chips** (e.g. "Executive update", "Training deck", "Yield review") prefill the input. Submitting **creates a Project** and routes to the workspace. Model the composition on open-design's Home screen, restyled to Atlas (warm off-white, near-black ink, one purple accent). This is the **first screen the user sees**; the workspace below is only reached after submitting. A minimal **recent projects** list on Home lets the user reopen and resume a past Project.

**Layout (workspace):** one workspace. **Canvas on the left**, **persistent chat on the right**, a slim **stepper** across the top (Brief → Wireframe → Theme → Deck). Chat is always available.

**Flow:**

1. **Start a Project.** From the Home screen, the user's typed request creates the Project, opens the workspace, and becomes the first chat turn (runtime is whatever they picked on Home, else auto).
2. **Brainstorm (Gate 1).** Agent runs `slide-brainstorm` — asks **one question at a time** in chat (audience, goal, must-include, tone). The **Brief panel** on the canvas fills in live (audience, goal, narrative arc, key messages). When the agent proposes the arc, the chat shows an **Approve arc / Request changes** affordance. Approving passes Gate 1.
3. **Wireframe (Gate 2).** Agent produces the **low-fi Wireframe** (theme-less, per-slide) via the brainstorm wireframe skeleton. App detects the Artifact Manifest, renders it in the **sandboxed iframe** with the **annotation layer** on. User pages through slides, **annotates** (click element / select text / per-slide comment). Annotations queue, then send to chat as a structured block; the agent revises the wireframe (live reload). **Approve wireframe** passes Gate 2.
4. **Theme (Gate 3).** Theme picker shows the available `html-slides` themes (with thumbnails). User picks one.
5. **Generate.** User picks output format(s): **PPTX**, **HTML**, or both. Agent runs `html-slides` (HTML) and/or `html-to-pptx` / `slide-quick` (PPTX). Progress streams in chat; the **Deck preview** renders when ready.
6. **Review & iterate.** User can annotate the Deck too (same mechanism) or chat further edits; regenerate.
7. **Export.** Export panel offers download of the final files (named from the Brief).

**Gate affordances** are both conversational (agent asks) and explicit (UI button tied to the current artifact). A user can always just keep chatting.

---

## 8. Runtime Adapter spec (codex + Copilot) — COPY THIS

> Source of truth: open-design `apps/daemon/src/runtimes/` (read it — §19). Each CLI is a **declarative data file**; the daemon never branches on agent id.

### 8.1 The adapter interface (`runtimes/types.ts`)

```ts
type RuntimeAgentDef = {
  id: string; name: string;
  bin: string;                         // 'codex' | 'copilot'
  fallbackBins?: string[];
  versionArgs: string[];               // ['--version'] detection probe
  fallbackModels: { id: string; label: string }[];
  listModels?: { args: string[]; timeoutMs: number; parse(stdout: string): Model[] };
  reasoningOptions?: { id: string; label: string }[];
  // turn (prompt, images, allowedDirs, {model,reasoning}, ctx) → argv
  buildArgs: (prompt: string, imagePaths: string[], extraAllowedDirs?: string[],
              options?: { model?: string; reasoning?: string }, ctx?: RuntimeContext) => string[];
  promptViaStdin?: boolean;            // TRUE for both codex + copilot
  promptInputFormat?: 'text' | 'stream-json';
  streamFormat: string;               // selects the parser
  eventParser?: string;               // 'codex' | 'copilot'
  env?: Record<string, string>;       // auth tokens injected here
  authProbe?: { args: string[]; timeoutMs: number };
  inactivityTimeoutMs?: number;       // copilot needs ≥30 min
  capabilityFlags?: boolean;          // probe --help, gate flags that drift
  maxPromptArgBytes?: number;
};
// RuntimeContext: { cwd, resumeSessionId?, newSessionId?, promptFilePath?, hasPriorAssistantTurn }
```

### 8.2 codex adapter (`defs/codex.ts`)

- **Spawn:** `codex exec --json --skip-git-repo-check --sandbox workspace-write -c sandbox_workspace_write.network_access=true -c default_permissions=":workspace"` then `-C <cwd>`, repeated `--add-dir <dir>`, `--model <id>`, reasoning as `-c model_reasoning_effort="<effort>"`.
- **Prompt:** `promptViaStdin: true` — write composed prompt to stdin and `end()`. **Do not** pass a bare `-` (modern codex rejects it, exit 2).
- **Stream:** `streamFormat: 'json-event-stream'`, `eventParser: 'codex'`.
- **Windows/WSL sandbox:** switch to `--sandbox danger-full-access` when `process.platform === 'win32'`, when `WSL_DISTRO_NAME` is set, or via override env — codex has no working OS sandbox on Windows. **Keep `cwd` tightly scoped to the project output dir** as the compensating control.
- **Models:** `codex debug models` (live) → static fallback.
- **Auth:** OpenAI sign-in or `OPENAI_API_KEY` (inject via `env`).

### 8.3 Copilot adapter (`defs/copilot.ts`)

- **Spawn (as open-design does):** `copilot --allow-all-tools --output-format json` then `--model <id>`, repeated `--add-dir <dir>`. No `exec` subcommand.
- **Prompt:** `promptViaStdin: true` — **omit `-p`** and pipe to stdin (a `-p <body>` blows the Windows ~32 KB / ~8 KB-via-`.cmd` command-line cap).
- **Auto-approve:** `--allow-all-tools` (or current equivalent) required, or it blocks on per-tool approval.
- **Stream:** `streamFormat: 'copilot-stream-json'`, `eventParser: 'copilot'`.
- **Watchdog:** `inactivityTimeoutMs: 30*60*1000` — Copilot goes silent on long deck turns (default 10 min is too short).
- **Models:** no list subcommand → static hints (`claude-sonnet-4.6`, `gpt-5.2`), refresh from docs.
- **Auth:** GitHub token precedence `COPILOT_GITHUB_TOKEN` > `GH_TOKEN` > `GITHUB_TOKEN` + a Copilot subscription (inject via `env`).
- **⚠️ FLAG DRIFT (must handle):** `--allow-all-tools` / `--add-dir` may be renamed to `--allow-all-paths` / `--available-tools` in newer Copilot CLI. **Set `capabilityFlags: true`: probe `<bin> --help` at detection, gate each flag on presence, ship a fallback.** Mirror open-design's claude `capabilityFlags` pattern.

### 8.4 Normalized event model (`runtimes/events.ts`)

One vocabulary the chat UI consumes regardless of CLI:
`status{label,model}` · `thinking_delta{delta}` · `text_delta{delta}` · `tool_use{id,name,input}` · `tool_result{toolUseId,content,isError}` · `usage{usage,durationMs,stopReason}` · `error{message}` · `raw{line}`.

- **codex mapping:** `thread.started`→status; `turn.started`→status; `item.*` `command_execution`→tool_use+tool_result; `agent_message`→text_delta; `reasoning`→thinking_delta; `turn.completed.usage`→usage; `turn.failed`/`error`→error.
- **copilot mapping:** `assistant.turn_start`→status; `assistant.reasoning_delta`→thinking_delta; `assistant.message_delta`→text_delta; `tool.execution_start`→tool_use; `tool.execution_complete`→tool_result; `result`→usage.

### 8.5 Detection (`runtimes/detection.ts`)

- Resolve bin on `PATH` **plus** toolchain dirs (nvm/fnm/mise, `~/.local/bin`, Homebrew); honor `PATHEXT` (`.EXE;.CMD;.BAT`) on Windows; allow `CODEX_BIN`/`COPILOT_BIN` overrides.
- Probe `<bin> --version`: split OS-reject (ENOENT/EACCES/126/127 → not invocable) from ran-but-unhappy (still available).
- Then in parallel: capability probe (`--help`), model fetch, auth probe.
- **GUI-launched PATH is stripped** — append known toolchain dirs before spawning (resolve `.cmd` shims to the native binary).

### 8.6 Auth state

- codex/Copilot don't ship a clean whoami. Infer auth from token-env presence + a cheap run, classify failure text (`401`/`unauthorized`/`please log in`) → `ok|missing|unknown`. Surface a friendly "Sign in to <runtime>" state in onboarding (§13).

---

## 9. Generation engine integration (the skills)

### 9.1 Reuse, don't rebuild
The agent runs the existing slide skills (in `jm-design/.claude/skills` / `.agents/skills`): **`slide-brainstorm`** (brainstorm + wireframe), **`slide-consultant`** (McKinsey copy review), **`html-slides`** (themed single-file HTML + verify gate), **`html-to-pptx`** (editable PPTX), **`slide-quick`** (native PPTX fast path), plus `theme-factory`, `micron-icons`, `pptx`.

**Vendoring:** copy these skills into the app's `skills/` so the distributable is **self-contained** (end users won't have `jm-design`). `jm-design` stays the **upstream source of truth** — document a one-way sync step; do not fork-and-drift. Skill bodies are injected into the composed prompt (§9.2), so they work under **both** codex and Copilot regardless of each CLI's native skill support.

### 9.2 Persona + context injection
Follow open-design's approach: **no system-prompt flag** — compose everything into the **user message**: an `# Instructions (read first)` block (app contract + the "act as a McKinsey-grade slide consultant" persona + the relevant skill bodies) then `--- # User request` (the rendered chat). Stage skill folders into `<cwd>/.atlas-skills/<skill>/` so any CLI reaches side-files by in-cwd path; pass `--add-dir` for the skills + themes dirs as the absolute fallback. `AGENTS.md` in the project cwd is the one file **both** CLIs honor if file-based injection is preferred.

### 9.3 Keep the turn-taking rhythm
The skills are written for an agent that **asks one question and waits**. Preserve that: each agent question streams to chat; the user replies in chat; the agent resumes (codex/Copilot `resume`/`continue`). Do **not** batch-call or auto-answer.

### 9.4 Artifact Manifest contract (thin integration we add)
When a skill produces a reviewable artifact, it (or a small post-step) writes `<file>.manifest.json`:
```json
{ "kind": "wireframe" | "deck", "format": "html" | "pptx", "entry": "slides.html", "slides": 12, "theme": "micron-dark" }
```
The daemon's artifact watcher (chokidar) reads it and tells the UI which canvas surface to render. If a skill can't be made to emit this, the daemon infers `kind`/`format` from output path/naming — but the manifest is preferred. (Document any skill edits needed; keep them minimal and upstream-compatible.)

### 9.5 Source material (attachments)
Users may attach **source files** from the Home screen and the chat composer — `xlsx`/`csv` (data), `pptx`/`pdf`/`docx` (existing content), and images/screenshots (evidence). On attach, files are copied into the **project dir** (and into `--add-dir` scope) so the agent reads them by relative path. Parsing is **best-effort**: the agent reads text/data directly and may use a helper (the `pptx` skill, a small csv/xlsx read step) for structured files; images are referenced as evidence/screenshots. Attachments feed the Brief and the Deck (honoring "show, don't tell"). Never block a run on a file the agent can't parse — surface a friendly note and continue. Cap file size/type sensibly.

---

## 10. Annotation system spec

Borrow lavish's annotation SDK (`/tmp/slide-research/lavish-axi/src/artifact-sdk.js`) and model the payload on open-design's mature per-slide comments.

- **Injection:** the Wireframe/Deck renders in a **sandboxed `<iframe>`** (`sandbox="allow-scripts allow-forms allow-popups allow-downloads"`, no `allow-same-origin`); the daemon injects a small **vanilla-JS SDK** before `</body>`. Artifact stays portable (renders identically opened standalone).
- **Capture (from lavish):** (a) **element click** → CSS selector path (≤5 levels, prefers `id`, `:nth-of-type`) + trimmed `innerText`; (b) **text-range select** → `{commonAncestorSelector, start:{path,offset}, end:{path,offset}, text}` re-locatable anchors that survive small edits.
- **Per-slide + screenshot (from open-design):** each annotation records its `slideIndex` and an optional screenshot of the targeted region.
- **Round-trip:** annotations queue as **pills** in the composer; on send, the daemon serializes them into a structured `<attached-preview-comments>` block (selector, position, current text, slideIndex, screenshot ref, scoped "change ONLY these elements" instruction) appended to the user turn. The agent edits the artifact; chokidar live-reloads the iframe.
- **UX:** Atlas styling for the overlay/cards; `rough-notation` (already in Atlas) for the sketchy highlight marks. Enter queues, Ctrl/Cmd+Enter queues+sends.

---

## 11. Themes / templates

- **App shell** = Atlas (Micron design system) — light mode canonical, dark supported.
- **Slide output** = existing **`html-slides` themes**, surfaced in the Theme picker (Gate 3): e.g. `micron-dark`, `micron-light`, `micron-dark-engineering`, `guided-learning`, `playful`, `aurora-glass`, `seventies-sunset` (read `html-slides/themes/themes.json` for the live list). Picker shows thumbnails (reuse `themes/selector.html` rendering).
- **Wireframe** = theme-less low-fi (brainstorm skeleton). Theme applies only at Deck generation.
- These are **two separate styling surfaces** — never style slides with Atlas Angular components or vice-versa.

---

## 12. Output & export

- Formats: **HTML** (single-file via `html-slides`) and **PPTX** (editable via `html-to-pptx` layered mode, or `slide-quick` native PptxGenJS). User chooses one or both per generation.
- The daemon collects outputs from the project dir, validates they exist, and the **Export panel** offers download with Brief-derived filenames (e.g. `q3-yield-ops-review.pptx`).
- Honor `html-slides`' own verification gate (fixed-stage screenshots, contrast, overflow) before presenting the Deck as done.
- **One-way export (v1):** the app exports PPTX/HTML **out**; it does **not** re-import an edited PPTX to continue in-app. Users refine by chatting/annotating *before* export; post-export edits happen in PowerPoint.

---

## 13. Onboarding & packaging

- **Launcher** (`slide-studio.bat` / `.exe`): start the daemon using the **bundled portable Node runtime** (shipped in the app folder — **no system Node install, no admin rights**) → check at least one Agent Runtime present → open browser. If a CLI is missing, run a guided **install helper / fallback**. Pass spawn args as **arrays**, never concatenated strings (Windows quoting).
- **First-run wizard (in-app):** detect runtimes (§8.5), show which are installed + signed in, walk the user through **install** (if missing) and **sign-in** (codex: OpenAI/ChatGPT; Copilot: GitHub **org SSO**) in plain language — never expose raw CLI flags. **Default to enterprise Copilot when detected**; offer codex as the fallback/dev option.
- **Orphan cleanup:** kill the agent child + daemon on app exit.
- **Distribution:** internal, **IT-managed deployment assumed for rollout** (push the app + the agent CLI via the enterprise's management tooling; the app bundles its own **portable Node**, so the only external dependency is the CLI). Signed with company cert if a true `.exe`; a `.bat` over a file share is fine for dev/early use. Budget for code-signing if SmartScreen friction appears.

---

## 14. State & persistence

- Per-project directory on disk holding: `project.json` (brief, settings, chosen runtime/theme/formats), the conversation log, staged skills, artifacts + manifests, outputs.
- Keep it simple (JSON). Move to SQLite (`better-sqlite3`) only if multi-project history/perf demands it.
- A run is resumable via the CLI's own session resume (codex `resume`, Copilot `--resume`/`--continue`).
- A **recent projects** list on Home reads from these on-disk project dirs so users can reopen/resume.

---

## 15. Security & privacy

- **Data governance (decided 2026-06-14):** the **production runtime is enterprise GitHub Copilot** (Micron org-managed; enterprise data protections — content is not used for model training and stays under org controls). **codex is the development/fallback runtime** (used where no enterprise Copilot license is available, e.g. the developer's machine today) and is suitable for **non-sensitive** decks only, unless an equally-sanctioned OpenAI endpoint is configured. The app **defaults to Copilot when present**. _Keep the endpoint swappable_ — the runtime adapter's `env`/config must be repointable (Copilot Enterprise / approved Azure OpenAI) without code changes.
- **No telemetry. No analytics. No cloud beyond the agent CLI's own model API.** (Explicitly strip anything analogous to lavish's Umami or open-design's PostHog/AMR.)
- Server binds to **loopback `127.0.0.1`** only.
- Auth tokens injected via spawn `env`, not logged. Don't print secrets.
- `cwd` scoping is the compensating control for codex's disabled Windows sandbox — never point the workspace at anything but the project dir.

---

## 16. Non-goals (DO NOT BUILD)

Explicitly out of scope — these are how open-design over-reaches; we stay lean:
- ❌ Image / video / audio / "HyperFrames" generation.
- ❌ A cloud model router / managed accounts (use the user's own CLI only).
- ❌ A plugin marketplace / community content sync.
- ❌ Telemetry, A/B, i18n beyond English (v1).
- ❌ A general "design any artifact" tool — **slides only.**
- ❌ Multi-user / server-hosted mode — **local single-user only.**
- ❌ Reimplementing slide generation — **the skills do it.**
- ❌ A native desktop framework (Electron/Tauri) — **local web app + launcher.**
- ❌ Re-importing an edited PPTX back into the app — **export is one-way in v1.**

---

## 17. Risks & landmines (carry these forward)

1. **Windows argv length** — always stdin for prompts; never `-p <body>`.
2. **codex Windows sandbox broken** — force `danger-full-access` + scope cwd.
3. **Copilot flag drift** — probe `--help`, gate flags, fallback.
4. **Copilot long-turn silence** — ≥30-min inactivity watchdog.
5. **GUI-stripped PATH** — append toolchain dirs; resolve `.cmd` shims.
6. **Skills assume turn-taking** — preserve one-question-at-a-time; don't batch.
7. **Two styling surfaces** — never cross Atlas (shell) with html-slides themes (slides).
8. **Skill ↔ app coupling** — keep the Artifact Manifest contract thin and upstream-compatible.
9. **Auth divergence** — codex vs GitHub; friendly per-runtime sign-in.
10. **Don't inherit open-design's bulk** — copy patterns, not its monorepo.
11. **Copilot enterprise path is unverifiable on the dev machine** (no enterprise Copilot license locally) — dev exercises the **codex** adapter; build the **Copilot** adapter strictly to spec (open-design `copilot.ts` + GitHub docs) with `--help` capability probing, and **validate it end-to-end in the Micron enterprise environment before rollout**. Treat the Copilot path as "built but not yet proven" until then.
12. **Source-file parsing is best-effort** — xlsx/pdf/docx extraction can be imperfect and files can be large/binary. Never block a run on an unparseable file; surface a friendly note, cap size/type, and keep attachments scoped to the project dir.

---

## 18. Key decisions & rationale (ADR-style)

- **AD-1 Build fresh (Path B), not fork open-design.** open-design does ~80% but is React/Next/Electron + a large multi-modal product; we're an Angular shop building a slides-only internal tool. We copy its proven patterns for a lean, owned, aligned codebase. _Trade-off:_ more code than forking, but no carrying/ trimming a big opinionated repo, and full company-stack fit.
- **AD-2 Local web app + launcher, not a desktop framework.** The `.exe` is only a wrapper; a Node server + browser (lavish's family) is simpler and Node is already required by the CLIs.
- **AD-3 Angular + Atlas shell.** Company-stack alignment + a ready Micron design system. Atlas styles the *shell*; html-slides themes style the *slides*.
- **AD-4 Dual runtime via declarative adapters.** One `RuntimeAgentDef` shape, codex + Copilot as data files — no per-agent branching; easy to add more later.
- **AD-5 Orchestration in skills, surfaces in app.** Keeps the mature gated pipeline intact and the app thin.
- **AD-6 Borrow lavish annotation SDK + open-design comment payload.** The annotation anchoring is the hardest-to-rebuild asset; copy it.

---

## 19. Reference implementations to read (exact paths)

- **lavish-axi** (annotation SDK + iframe injection): `/tmp/slide-research/lavish-axi/src/artifact-sdk.js`, `server.js`, `chrome-client.js`. License MIT.
- **open-design** (dual-CLI driving, events, detection, comments, deck/pptx, skill staging): `/tmp/slide-research/open-design/apps/daemon/src/runtimes/{types,detection,executables,auth}.ts`, `runtimes/defs/{codex,copilot,claude}.ts`, `json-event-stream.ts`, `copilot-stream.ts`, `skills.ts`, `server.ts` (~11697 staging, ~11835 compose, ~13509 stream dispatch, ~14132 stdin write); annotation: `apps/web/src/comments.ts`, `apps/web/src/runtime/srcdoc.ts`, `edit-mode/bridge.ts`, `packages/contracts/src/api/comments.ts`. License Apache-2.0. **NOTE the product-neutrality / rename obligation.**
- **Atlas design system** (app shell): `/Users/wongjunmun/development/ai-development/atlas-design-system/atlas-ng` (Angular 22, `atlas-ui` schematics, `micron-tokens.css`), `DESIGN.md`.
- **Slide skills** (the engine): `jm-design/.claude/skills/{slide-brainstorm,slide-consultant,slide-quick,html-slides,html-to-pptx}` + `.agents/skills/...`.
- **Copilot CLI docs:** programmatic reference, run-CLI-programmatically, custom-instructions (AGENTS.md), streaming events (URLs in the research doc).

---

## 20. Implementation checklist (build in this order)

> Full scope ships in v1; milestones order the work so the riskiest seam (the dual-CLI driver) is proven first. Every item: **build → meet acceptance → verify (run/screenshot) → check off.**

### M0 — Scaffolding
- [ ] pnpm workspace at `jm-design/slide-studio/` with `apps/daemon` (Node 22 + Express + ws + TS) and `apps/web` (Angular 22).
- [ ] Wire Atlas into `apps/web` via `atlas-ui` schematics + `micron-tokens.css`; render one Atlas button + dark/light toggle. **Accept:** Atlas-styled page served by the daemon at `127.0.0.1:<port>`.
- [ ] Launcher `.bat` that starts the daemon and opens the browser. **Accept:** double-click → app loads.

### M1 — Runtime Adapters + detection (the riskiest seam — do first)
- [ ] `RuntimeAgentDef` interface + registry + normalized event model (§8.1, §8.4).
- [ ] `codex.ts` adapter (§8.2) and `copilot.ts` adapter (§8.3) incl. `capabilityFlags` probing for Copilot.
- [ ] Detection (§8.5): PATH+toolchain resolve, version, capability, auth state, on Windows. **Accept:** app correctly reports installed/missing/signed-in for codex and Copilot on a Windows machine.
- [ ] Run manager: spawn with **stdin** prompt, parse JSON stream, emit normalized events over ws, support cancel + inactivity watchdog. **Accept:** a raw "say hello and write hello.txt" prompt streams thinking/text/tool events to a test UI and writes the file, for **both** codex and Copilot.

### M2 — Home screen + Chat workspace
- [ ] **Home/Start screen:** clean centered prompt, runtime selector (when >1 detected), starter chips, attach control, and a **recent projects** list; submit **creates a Project** and routes to the workspace with the request as the first turn. **Accept:** typing a request on Home opens the workspace and the agent starts on it; a past Project can be reopened from the recents list.
- [ ] One-workspace layout: canvas left, persistent chat right, top stepper (Atlas).
- [ ] Chat: streamed turns (thinking/text/tool bubbles), composer, runtime picker, multi-turn resume. **Accept:** a real multi-turn conversation with each CLI, with visible streaming.

### M3 — Brainstorm + Brief (Gate 1)
- [ ] Skill staging + persona/system composition (§9.2); run `slide-brainstorm` preserving one-question-at-a-time (§9.3).
- [ ] **Source-material attachments (§9.5):** files from Home/composer are staged into the project dir + `--add-dir` scope and read by the agent. **Accept:** attaching a CSV of yield numbers, the agent cites the real figures in the Brief/wireframe instead of inventing them.
- [ ] Brief panel renders live (audience, goal, narrative arc, key messages) from the agent's structured output.
- [ ] Gate 1 affordance (Approve arc / Request changes). **Accept:** user reaches an approved Brief via chat for a sample topic.

### M4 — Wireframe + annotation (Gate 2)
- [ ] Artifact Manifest contract + chokidar watcher → render wireframe in sandboxed iframe (§9.4).
- [ ] Inject annotation SDK; element + text-range + per-slide capture; queue pills; send `<attached-preview-comments>` block; live-reload on agent edit (§10).
- [ ] Gate 2 (Approve wireframe). **Accept:** user annotates a low-fi wireframe, the agent revises exactly those elements, user approves.

### M5 — Theme + Generate + Deck preview (Gate 3)
- [ ] Theme picker from `html-slides/themes/themes.json` with thumbnails (Gate 3).
- [ ] Format selection (PPTX / HTML / both); run `html-slides` and `html-to-pptx`/`slide-quick`; stream progress; honor html-slides verify gate.
- [ ] Deck preview in sandboxed iframe with slide nav. **Accept:** an approved wireframe becomes a themed Deck previewable in-app, for both formats.

### M6 — Export
- [ ] Export panel: collect outputs, Brief-derived filenames, download. **Accept:** user downloads a valid `.pptx` (opens in PowerPoint, editable) and a single-file `.html`.

### M7 — Onboarding & packaging
- [ ] First-run wizard: detect/install Node + CLI, guide sign-in per runtime in plain language (§13).
- [ ] Orphan cleanup on exit; loopback-only; no telemetry (§15). **Accept:** on a clean Windows VM with no CLI, the wizard gets a non-technical user from launch → signed-in → first deck.

### M8 — Deck-level iteration & polish
- [ ] Annotate/iterate on the final Deck (reuse M4 mechanism); regenerate.
- [ ] Empty/error/loading states (Atlas); friendly auth/runtime-failure messages; reduced-motion.
- [ ] Light + dark app themes verified (screenshots).

### M9 — QA & docs
- [ ] End-to-end run on Windows for **each** CLI: topic → deck (PPTX+HTML), with annotations.
- [ ] Seed `docs/CONTEXT.md` from §3; record ADRs from §18; write a short user guide.
- [ ] Verify every Non-goal (§16) is absent and every Non-negotiable (§1) is met.

---

## 21. Definition of Done (v1)

A non-technical Micron user, on their own Windows desktop, double-clicks the launcher, signs into **either** codex **or** GitHub Copilot, describes a deck in plain language, is guided through a one-question-at-a-time brainstorm with a live Brief, reviews and **annotates a low-fi wireframe** that the agent revises, picks a Micron theme, and exports a polished, editable **PPTX** and/or single-file **HTML** deck — **without ever touching a terminal**, with **no telemetry**, using the **existing slide skills** as the engine and **Atlas** as the app shell.
```
