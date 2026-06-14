# Slide-Design Desktop App — Research Synthesis (2026-06-14)

Research done **before** the brainstorming/grilling session, per request. Goal: decide whether to
build a Windows desktop app that wraps the **codex CLI** so non-technical users can chat with an AI
agent to design slides — brainstorm like a consultant, review a low-fi wireframe, annotate it,
then generate final **PPTX or HTML** with selectable templates. Specifically asked: can we
**leverage `kunchenguid/lavish-axi`** instead of building from scratch, and what other prior art exists.

Four parallel research agents ran: (1) deep dive on lavish-axi, (2) similar GUI-wraps-CLI + AI
slide products, (3) Windows packaging + codex internals, (4) mapping the existing jm-design slide
skills as the generation engine.

---

## TL;DR / The four load-bearing findings

1. **The generation engine already exists and already runs under codex.** The jm-design slide skills
   (`slide-brainstorm`, `slide-consultant`, `slide-quick`, `html-slides`, `html-to-pptx`) form a
   complete, gated pipeline (~85–95% reusable). codex already executes these `SKILL.md` skills via the
   "Compound Codex Tool Mapping" block in `~/.codex/AGENTS.md` (`Skill: open the referenced SKILL.md
   and follow it`). **codex + these skills is a proven combination.** The app does not build slide logic.

2. **lavish-axi gives us the annotation/review loop for ~free, but NOT the chat-with-agent shell.**
   MIT licensed. Its crown jewel is the annotation SDK (precise element selectors + text-range DOM
   anchoring) and an embeddable browser chrome. But lavish **does not host the agent** — it assumes a
   separate terminal agent drives it through a long-poll bridge. Verdict: **borrow the annotation SDK +
   visual shell, do NOT inherit the detached-server/long-poll architecture.**

3. **The "outline/wireframe review gate" is industry best practice.** Gamma (gold standard), Beautiful.ai,
   Manus, Genspark all insert a structured review step *before* generating the final deck. The user's
   instinct (low-fi wireframe → review → annotate → generate) is well-validated. "Annotate a wireframe →
   AI revises" is largely **greenfield** for slides = a real differentiator.

4. **Windows packaging is feasible. Recommended stack: Tauri + bundled `codex.exe` sidecar.**
   codex ships a native Windows binary (~3.6 MB zipped). Auth via "Sign in with ChatGPT" is friendliest.
   Drive codex via `codex mcp-server` (kept alive) or `codex exec --json resume`. Sandbox works on
   Windows (`workspace-write`). Main non-technical risks: code-signing cost (EV cert for SmartScreen),
   antivirus, and Windows path-quoting when spawning the child process.

---

## 1. lavish-axi deep dive (`github.com/kunchenguid/lavish-axi`)

**What it is:** a Node/TS CLI — "an editor for agent-generated HTML artifacts." An agent writes an HTML
file; `lavish-axi <file>` opens it in a local browser; the human annotates elements or selected text and
sends feedback; the agent receives it via a blocking long-poll and edits the file.

**Architecture (5 loopback-local layers):** CLI → detached Express server → browser "chrome" shell →
SDK injected into the artifact iframe → long-poll loop. Sessions keyed by `sha256(realpath(file))` — the
file path *is* the identity (no opaque IDs). State in a single shared `~/.lavish-axi/state.json`.

**Annotation mechanism (the crown jewel, `src/artifact-sdk.js`):**
- *Element click* → builds a CSS selector path (up to 5 levels, prefers `id`, `:nth-of-type` for siblings)
  plus trimmed `innerText`.
- *Text-range selection* → a structured `{type:"text-range", text, commonAncestorSelector,
  start:{path,offset}, end:{path,offset}}` where start/end are child-index DOM paths from the common
  ancestor + char offsets — a **re-locatable anchor that survives minor DOM changes**. This is the
  single hardest-to-rebuild asset; worth copying near-verbatim.
- Annotations post via `postMessage` → chrome queues them → `POST /api/:key/prompts` with a whole-page
  DOM snapshot. Agent reads them off the long-poll stdout (TOON-serialized).

**Browser chrome (`chrome-client.js` + `chrome.css`):** dark/brass shell — top bar with an Annotate
toggle + overflow menu; left = sandboxed `<iframe>` artifact; right = Conversation panel (chat bubbles,
queued-annotation pills, composer with split "Send to Agent"). Plain server-rendered HTML/CSS/vanilla-JS
over loopback — **trivially embeddable in an Electron/Tauri webview**. But the chat panel only *displays*
an external agent's `--agent-reply`; it has **no LLM wiring, no streaming, no send-to-model**.

**Verdict for our app:**
- (a) Annotation + feedback loop — **reusable as-is; copy it.**
- (b) Browser chrome — reusable visual shell, but **rebuild the chat side** to drive codex.
- (c) Does lavish host the agent? **No** — this is the central mismatch. lavish is a review surface for
  an agent that runs elsewhere. Our app must own launching/streaming codex.
- (d) Risks of building *on top of* lavish: inverted control flow (it assumes agent-calls-CLI-and-blocks),
  no slide engine at all (the `slides` playbook is just LLM prose), single shared unlocked global state,
  macOS/Linux assumptions (`lsof`/`ps`/`realpath`; AGENTS.md says not shipped for Windows), and a
  telemetry phone-home (`a.kunchenguid.com`) that must be stripped.

**Recommendation:** lift `artifact-sdk.js` (selector + text-range anchoring + snapshot) and the chrome's
visual shell; replace the HTTP long-poll seam with an in-process codex driver + real chat loop.

---

## 2. Similar projects & prior art

**Desktop GUIs wrapping a coding-agent CLI:**
| Project | Stack | How it drives the CLI | License |
|---|---|---|---|
| Conductor (conductor.build) | native macOS | spawns Claude Code/Codex per git-worktree task | proprietary |
| Crystal → Nimbalyst | Electron | parallel Claude Code + Codex sessions, diff viewer | MIT (Crystal deprecated) |
| Claudia → Opcode (getAsterisk) | **Tauri 2 + React + Rust** | manages Claude Code sessions, checkpoints, security profiles | OSS (~21k★; verify license) |
| OpenAI Codex desktop app | first-party | built on the codex "App Server" event stream | proprietary |

**AI slide generators — the consistent best-in-class flow is `prompt → editable OUTLINE → review →
generate → AI-assisted edit`:** Gamma (gold standard; outline is the review gate; inline "shorten /
formalize / add detail" buttons), Beautiful.ai, Decktopus, Plus AI / Presentations.ai (real editable
.pptx, not flat images), Manus & Genspark (content-structure-first, closest to the "consultant" framing),
Tome (narrative-first).

**Annotate-a-wireframe → AI revises:** exists in UI-design tools (Visily: AI wireframes + on-canvas chat;
Figma "Annotate it!" plugin) but **not yet in slide tools** → differentiator.

**Key UX lessons:** (1) never go prompt → final deck; the review gate is essential. (2) drive codex via
`codex exec --json` + resume (parse JSONL for thinking/tool events) or `mcp-server`. (3) translate
approval/sandbox modes into friendly dialogs (default `workspace-write` + `on-request`). (4) ship real
editable PPTX. (5) offer inline AI-edit affordances, not just a blank chat box. (6) borrowable patterns:
collapsible "thinking" panel, checkpoint/undo timeline, per-change accept/reject.

---

## 3. Windows packaging + codex internals

- **codex today:** OpenAI's open-source agent, rewritten in **Rust**, single native binary; distributed as
  GitHub binary releases *and* npm wrapper `@openai/codex`. **Native Windows build exists**
  (`codex-x86_64-pc-windows-msvc.zip`, ~3.6 MB). For bundling, ship the raw `codex.exe`, don't depend on
  Node/npm. (Locally installed here: `codex-cli 0.133.0`, model `gpt-5.5`.)
- **Auth:** "Sign in with ChatGPT" (OAuth browser flow) is the friendliest for non-technical users; API
  key is the headless alternative. Creds in `~/.codex/auth.json`, config in `~/.codex/config.toml`.
- **Driving codex:** `codex exec "<prompt>"` (non-interactive); `--json` → JSONL event stream
  (`thread.started`, `turn.*`, `item.*` incl. reasoning, tool calls, file changes, MCP calls); `codex exec
  resume <id>/--last` (multi-turn); `-o` writes final message to a file; `codex mcp-server` (stdio MCP).
  **For a persistent GUI chat, prefer `codex mcp-server` kept alive** (lower latency, clean session state);
  `exec resume` is the simpler/robust fallback.
- **Customizing persona/skills:** ship a controlled `AGENTS.md` (persona) + `config.toml`; expose our slide
  skills (already done via the Compound mapping + `.agents/skills/` here) and/or register an MCP server.
- **Sandbox on Windows:** works natively now (restricted tokens + ACLs); modes `read-only` /
  `workspace-write` / `danger-full-access`. Point the workspace at the user's output folder so codex can
  write `.pptx`/`.html`. Native sandbox needs one-time UAC; AV can interfere → have a non-elevated fallback.
- **Stack — Tauri vs Electron:** Tauri wins on sidecar bundling of `codex.exe`, .exe size (~3–10 MB vs
  ~80–120 MB), and matches the Claudia/Opcode precedent; Electron wins only on pixel-perfect bundled-Chromium
  slide-preview fidelity. **Recommend Tauri** unless preview rendering fidelity proves to be a problem.
- **Gotchas:** SmartScreen/AV will flag an unsigned child-process-spawning .exe → budget an **EV
  code-signing cert**; pass spawn args as an array (never concatenated); bundle the runtime, don't assume
  Node; kill the codex child on exit to avoid zombies.

---

## 4. The existing jm-design slide skills = the engine

Skills live in `jm-design/.claude/skills/` and `jm-design/.agents/skills/`.

**Two existing paths, branched by stakes:**
- **Full pipeline** (executive / persuasion / HTML): `slide-brainstorm` (content + wireframe) →
  `html-slides` (themed single-file HTML, `verify.py` gate + subagent review) → `html-to-pptx`
  (image or layered/editable PPTX).
- **Fast path** (`slide-quick`, internal/training, ~15 min, 2 replies): intake → outline →
  `slide-consultant` → wireframe → native editable PPTX (PptxGenJS).

**Stage → skill → human gate:**
| Stage | Skill | Gate |
|---|---|---|
| Discovery / framing Q&A | `slide-brainstorm` Ph1–2 | Gate 1: approve narrative arc |
| Low-fi wireframe HTML | `slide-brainstorm` Ph3 (`references/wireframe-skeleton.html`) | Gate 2: approve wireframe |
| Copy review (McKinsey) | `slide-consultant` | auto in fast path |
| Theme selection | `html-slides` Style Selection (`themes/selector.html`) | Gate 3: pick theme |
| Themed HTML deck | `html-slides` + `theme-factory` + `micron-icons` | `verify.py` + subagent review |
| HTML → PPTX | `html-to-pptx` (image/layered) | validator + contact-sheet |
| Native PPTX | `slide-quick` (PptxGenJS) | QA-lite |

**McKinsey frameworks (`slide-consultant/references/frameworks.md`):** Pyramid Principle (answer first),
SCQA opening, action titles + horizontal-logic "skim test", MECE grouping, one-message-per-slide,
so-what test, evidence honesty (never invent stats; mark "Illustrative").

**Reuse assessment (app stage → existing skill):**
- Chat brainstorm → `slide-brainstorm` Ph1–2 — **~90% built** (only the chat shell is missing).
- Recorded discussion → brainstorm HTML header + `ARGUMENT`/`DESIGN INTENT` comments — **~60%** (no live
  side-panel transcript).
- Low-fi wireframe + annotate → `wireframe-skeleton.html` is annotation-friendly — **wireframe ~95%**,
  **annotation UI 0%** (this is where lavish-axi's SDK plugs in).
- Theme/template select → `html-slides` Style Selection + `theme-factory` (10 presets) — **~85%**.
- Generate PPTX/HTML → `html-slides`, `html-to-pptx`, `slide-quick`, `pptx` — **~95% built**.

**Gaps the app must add (orchestration + UI, NOT generation):** the chat shell; codex run-loop that calls
skills in order and enforces gates; a live recorded-discussion panel; the annotation layer; export/download
UX + naming; session persistence across brainstorm→wireframe→generate.

**Key insight (holds strongly):** the app is a **thin-but-real GUI + codex conductor over a mature engine**.
The main risk is that the skills are written for an interactive agent that asks one question at a time and
waits — the app must preserve that turn-taking rhythm rather than batch-calling.

---

## Emerging architecture (pre-grilling hypothesis, to be challenged)

```
┌─────────────────────────── Tauri desktop app (.exe, Windows) ───────────────────────────┐
│  Chat panel (new)        Recorded-discussion panel (new)     Wireframe preview (iframe)  │
│  + inline AI-edit buttons   live decisions log                + lavish annotation SDK     │
│           │                                                          │ annotations        │
│           ▼                                                          ▼                     │
│   ┌──────────────────────────── codex conductor (new) ────────────────────────────┐      │
│   │ spawns codex (mcp-server kept alive or exec --json resume); streams events;     │      │
│   │ feeds annotations back; enforces Gate 1 (arc) / Gate 2 (wireframe) / Gate 3 (theme)│   │
│   └───────────────────────────────────┬───────────────────────────────────────────┘      │
└───────────────────────────────────────│──────────────────────────────────────────────────┘
                                         ▼
        codex CLI  ──uses──▶  slide-brainstorm · slide-consultant · html-slides · html-to-pptx · slide-quick
                                         │
                                         ▼
                               PPTX  /  single-file HTML   (+ theme/template selection)
```

**Build = borrow lavish annotation SDK + chrome shell · build chat + recorded-discussion + codex conductor ·
reuse the slide skills wholesale · package with Tauri.** Open questions for grilling: who exactly the users
are + deployment context, codex auth/billing for non-technical users, MVP scope, where the app lives
(new repo vs jm-design), and how much of lavish to take vs build fresh.
