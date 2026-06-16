# Slide Studio — hands-on UX walkthrough & redesign findings (2026-06-16)

**Method:** drove the **running app** (daemon `:4317`, real `codex` CLI 0.133.0,
signed in) through Chrome as a non-technical user would, end-to-end:
Home → resume → Brief → **arc approval** → Wireframe → **annotate** → Gate 2 →
**Theme picker (all 14)** → **generate Micron-dark deck** → Deck annotate →
**export HTML + PPTX**. Catalogued every concrete bug + friction point, then
fixed the most acute one (the chat composer) and propose a smoothness redesign.

**Scope note (unchanged & still correct):** I ran one full live generation
end-to-end + deep-inspected every surface (incl. the 14-theme picker), rather
than 14 full LLM regenerations. The friction lives in the **workflow**, not in
re-running the model 14×; per-theme generation is the same code path. The theme
**picker** is the surface where "all 14 templates" actually matters to a user,
and it is inspected in full below.

---

## SEVERITY-RANKED FINDINGS

| # | Sev | Surface | One-liner |
|---|-----|---------|-----------|
| **C1** | 🔴 Critical | Brief→Wireframe gate | **Approving the arc dead-ends — nothing generates the wireframe, no button, no progress.** Root of I2. |
| **C2** | 🟠 High | Theme picker (Gate 3) | **All 14 themes show gray boxes with 2-letter initials** — real pixel-perfect screenshots exist & are served but are unused. Choosing a design is near-blind. |
| C3 | 🟡 Med | Deck generation | Weak progress feedback — the canvas keeps showing the theme grid; only a thin green bar + chat spinner signal that a multi-minute build is running. |
| C4 | 🟡 Med | Wireframe annotate | Interaction model is a hidden mode: "Annotate" is a persistent toggle (crosshair); no per-element affordance. Discoverable only via the one-line hint. |
| C5 | 🟢 Low | Home | Recent projects sit **below the fold** under a tall empty hero; a returning user must scroll to find their work. |
| C6 | 🟢 Low | Daemon serving | `index.html` is read into memory once at startup (`server.ts:488`); after a rebuild, deep-link/SPA-fallback routes serve a stale index → blank page until daemon restart. |
| **C7** | 🟠 High | "+ Add a style" | **The variant picker is locked to the already-chosen theme** — `select()` early-returns when `current()` is set, and `current` inits from the project's theme, so re-opening to add a style can't pick a different theme (its whole purpose). Found while generating all 14 themes. |
| **F-fixed** | ✅ Fixed | Chat composer | Cramped 3-column row w/ resize handle + shifting Send → **rebuilt as the modern unified composer** (done this session, see below). |

Prior-session findings still valid: **I1** (opening brief stored twice —
`server.ts:819` dual-write), **I2** (projects stranded at brief/wireframe — now
**root-caused as C1**), **F1–F3** (agent keeps asking free-text questions before
Gate 1; two parallel surfaces ask the same thing; no "draft the arc now"
shortcut).

---

## C1 — Arc approval dead-ends (CRITICAL, root-caused) 🔴

**Symptom (reproduced live):** resumed a project at `stage: wireframe`,
`gate1: approved`, but `wireframeRev: 0`. The canvas shows
"✓ Arc approved — moving to the wireframe" with **no wireframe, no spinner, no
button**. The user is stranded with no way forward.

**Root cause:** `approveArc()` (`workspace.component.ts:651`) only flips the gate
(`setGate1` → `{gate1:'approved', stage:'wireframe'}`, `projects.ts:254`). It
fires **no generation run**. The daemon's `generate` path is **deck-only**
(always themed, writes `deck.<theme>.html`, `server.ts:~640`) — it never builds a
wireframe. The wireframe HTML is only ever produced when the **agent** writes it
during a chat turn. But nothing tells the agent to do that after approval.

Compare `requestChanges()` (`workspace.component.ts:680`) — it *does* auto-send a
chat turn. `approveArc()` is the asymmetric one: it sends the agent nothing.

**Confirmed fix path (live):** typing "build the wireframe now" into chat made
codex write `docs/brainstorms/…-brainstorm.html` and bump `wireframeRev → 1`; the
wireframe surface then rendered correctly. So the only gap is the missing
trigger.

**Fix direction:** on `approveArc()`, after flipping the gate, auto-kick the
wireframe build — either (a) auto-send a scoped chat turn ("The arc is approved.
Build the wireframe now."), mirroring `requestChanges()`, or (b) give the daemon
a first-class `buildWireframe` run (like `generate`) the gate calls. (a) is the
1-line, lowest-risk fix. Either way, show a "Building your wireframe…" canvas
state while it runs (ties into C3).

## C2 — Theme picker is near-blind (HIGH) 🟠

**Symptom (reproduced live):** the "Pick a theme" screen renders all 14 themes as
**gray boxes with 2-letter monograms** (MD, ML, GL, P, H, AG…).

**Root cause:** `themes.component.ts` renders a crafted *palette-swatch* card when
`t.palette` exists, else a monogram. **0 of 14 themes define a `palette`** in
`themes.json` → every card hits the monogram fallback. Meanwhile **all 14 ship a
real screenshot** and the daemon already serves them:
`GET /api/themes/micron-dark/thumbnail` → `200, image/png, 340 KB`. The picker
never uses them.

**Fix direction:** use the real screenshot as the card preview
(`<img src="/api/themes/{{id}}/thumbnail" loading="lazy">`), monogram only as the
last-resort fallback when a theme ships no preview. This is the single
highest-leverage change for "non-technical users choosing a design" — it turns 14
gray initials into 14 real slides.

## C3 — Weak generation progress

During the multi-minute deck build the **canvas keeps showing the theme grid**;
the only signals are a thin green "generating the deck" bar and the chat
"Thinking…". No prominent "building your deck…" state, no step/elapsed cue. A
non-technical user can't tell whether anything is happening. (Same gap applies to
wireframe build per C1.)

## C4 — Annotation model is a hidden mode

The annotate UX (`annotation-sdk.ts`) is: a fixed bottom toolbar with **"Annotate"
(a persistent mode toggle, on by default, crosshair cursor) + "Comment on this
slide"**. With the mode on, clicking any element opens a "Tell the agent what to
change…" card; selecting text annotates a range. It **works** (verified the host
pipeline: capture → `postMessage{source:'ss-annotation',type:'queue'}` →
`queueFeedback` → pill "1 queued for the next message" → persisted to
`feedback-queue.jsonl` with `sent:false`, surviving interruption). But the only
hint that elements are clickable is one line of helper text; there's no
per-element affordance, and the toggle's purpose is easy to miss.

> Automation note: the annotation **capture** (clicking inside the sandboxed,
> opaque-origin wireframe iframe) could not be driven by synthetic clicks — a
> tooling limitation of the cross-origin sandbox, **not** a product defect (a
> real mouse works). The host-side queue/pill/persist path was verified directly.

## C5 / C6 — minor

- **C5 Home:** recent projects render below a tall empty hero — scroll required.
- **C6 stale index:** daemon caches `index.html` at startup; deep links serve a
  stale bundle reference after a rebuild → blank page (dev/infra; restart fixes).

---

## CHAT COMPOSER — FIXED THIS SESSION ✅

User flagged the chat input as "ugly." Rebuilt it to the modern AI-chat pattern.

- **Before:** horizontal row `Attach pill | short narrow textarea (visible
  scrollbar + drag-to-resize handle) | Send`; auto-grow shifted the Send button (F4).
- **After:** one **unified rounded container** — textarea full-width on top
  (bare, `resize:none`); an action bar inside the bottom (ghost paperclip left,
  circular ↑ Send right); the whole box shows the `focus-within` ring; auto-grows
  to 200 px then scrolls internally; Send dimmed when empty, solid when typed;
  the action bar stays anchored (F4 gone).
- **Files:** `chat.component.ts` (markup + styles + `autoGrow` cap),
  `attach-control.component.ts` (new `compact` icon-only variant — Home keeps its
  labeled pill). Rebuilt; verified live in **dark + light** mode. Not committed.

---

## DECK + EXPORT (HTML + PPTX) — live run ✅

Generated a **Micron-dark** deck, format **Both (HTML + PPTX)**, end-to-end:

- **Timing:** ~10 min wall-clock. The agent (a) copies the theme `example.html`
  scaffold, then (b) replaces slides with the approved content, then (c) runs the
  html-slides verify gate (real-browser screenshots), then (d) builds the
  editable PPTX. During (a)→(b) the live-reloading canvas briefly shows the
  generic "Universal deck shell" scaffold and a wrong slide count (4 → 5) — see C3.
- **Result:** Deck — Micron-dark, **5 slides**, **"✓ Passed verify gate"**. The
  title slide renders correct dark theme + "Coffee brewing basics" + Micron logo.
- **Exports (both verified serving over HTTP 200):**
  - HTML — `…french-.html`, 59 KB, `text/html`.
  - PowerPoint — `…french-.pptx`, **10.5 MB**, correct PPTX content-type,
    **"✓ Editable PowerPoint ready — real text boxes you can edit"** (layered mode).
  - Brief-derived download filenames (minor: the name truncates mid-word at
    `…pour-over-and-french-.pptx`).
- **Deck annotate-to-edit (Slice 12):** pinning a deck annotation queues a pill
  **and** surfaces **"1 deck annotation pinned — Regenerate the deck…"** with a
  **Regenerate deck** button (surface-aware, tagged `surface:'deck'`). Verified
  the affordance + queue; the regenerate reuses the proven `generate` path.

**The export panel itself is a strong surface** — format, filename, size,
verify-gate badge, "Editable PowerPoint ready", per-file Download. No friction
here. Minor: left rail shows the variant as "1 slides" (should be 5).

---

## SMOOTHNESS REDESIGN — APPROVED, BUILT & VERIFIED LIVE ✅

User approved **all of P1–P5**; all are implemented, unit-tested (303 daemon
tests green), rebuilt, and verified in the running app. Not committed (per the
"never commit unless asked" rule).

| Fix | What changed | Verified live |
|-----|--------------|---------------|
| **P1** | `approveArc()` now auto-sends the wireframe-build turn (`workspace.component.ts`) | ✅ Approving the recycling arc auto-sent "build the wireframe now" + agent built it — **no dead-end** |
| **P2** | Theme picker renders the real `/api/themes/:id/thumbnail` screenshot (`themes.component.ts`) | ✅ 14 cards now show real slides, not gray initials |
| **P3** | "Building your wireframe / deck…" canvas state (`workspace.component.ts`), gated on `agentWorking()` | ✅ Shown on arc-approve; picker still opens via "+ Add a style" (fixed a first-cut `buildingDeck` bug) |
| **P4** | Annotation toolbar relabeled "✎ Click-to-comment: ON" + one-time coachmark (`annotation-sdk.ts`) | ✅ Visible on the deck; 35 annotation/deck tests still green |
| **P5a** | Home top-aligned so recents sit above the fold (`home.component.ts`) | ✅ 5 recents visible without scrolling |
| **P5b** | `index.html` served `Cache-Control: no-store` + re-read per nav (`server.ts`) | ✅ Deep-link reload no longer blanks; headers confirmed |
| **C7** | "+ Add a style" passes `chosen=null` to the picker when `addingStyle()` so it unlocks (`workspace.component.ts`) | ✅ Can now pick + generate a different theme variant |
| composer | Unified rounded composer (`chat.component.ts` + `attach-control.component.ts`) | ✅ Dark + light |

Goal: make the **brief → wireframe → annotate → theme → deck → export** loop
flow with no dead-ends and no blind choices for a non-technical user. Original
plan (ranked by impact ÷ effort) below.

**P1 — Kill the arc-approval dead-end (C1).** `approveArc()` auto-kicks the
wireframe build (auto-send the scoped "build the wireframe now" turn, mirroring
`requestChanges()`), so approving the arc *always* produces a wireframe. ~1–5
lines, the single biggest smoothness win. Removes the I2 stall for every user.

**P2 — Real theme previews (C2).** Swap the picker's monogram for the real
screenshot the daemon already serves:
`<img src="/api/themes/{{t.id}}/thumbnail" loading="lazy" alt="">`, monogram only
when a theme ships no preview. ~10 lines in `themes.component.ts`. Turns 14 gray
initials into 14 real slides — the core "choose your design" moment.

**P3 — Honest generation progress (C3).** While a build runs, replace the canvas
with a calm "Building your wireframe / deck…" state (step + light skeleton),
instead of leaving the theme grid / a half-built scaffold on screen. Covers both
the wireframe build (P1) and the deck build. Medium effort.

**P4 — Annotation discoverability (C4).** Make "click to comment" obvious: a
subtle hover affordance on annotatable elements + a one-time coachmark, and label
the toolbar toggle "✎ Click-to-comment: ON". Low–medium effort.

**P5 — Home (C5) & stale index (C6).** Lift recent projects above the fold (or a
compact two-column list beside the hero); send `Cache-Control: no-store` for
`index.html` (or re-read it per request) so a rebuild never strands a deep link.
Low effort.

**Sequencing:** P1 + P2 first (highest impact, lowest risk, both near-trivial),
then P3, then P4/P5. The chat composer (F-fixed) is already done.
