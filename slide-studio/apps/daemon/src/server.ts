/**
 * The local daemon (plan §4, §M0/M1/M2). Express HTTP for commands + a `ws`
 * WebSocket for the streamed agent events. Binds loopback-only (§15). Serves
 * the Angular build when present; otherwise a minimal fallback chat page so the
 * walking skeleton is runnable before the Angular build exists.
 */
import { createServer, type Server } from 'node:http';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import { WebSocketServer } from 'ws';
import { detectAgents } from './runtimes/detection.ts';
import { defaultRuntimeId, getAgentDef } from './runtimes/registry.ts';
import { startRun } from './runs.ts';
import { buildOnboardingPlan } from './onboarding.ts';
import { runOnboardingStep, type OnboardingExecKind } from './onboarding-exec.ts';
import { ProcessRegistry } from './process-registry.ts';
import {
  activeDeck,
  appendConversation,
  createProject,
  deckFileForTheme,
  deleteProject,
  listRecent,
  load,
  markQuestionnaireAnswered,
  projectDir,
  readConversation,
  readProject,
  registerGeneratedDeck,
  renameProject,
  setActiveDeck,
  setGate1,
  setGate2,
  setQuestionnaire,
  setTheme,
  updateRecordedBrief,
  type OutputFormat,
} from './projects.ts';
import {
  BRAINSTORM_SKILLS,
  composePrompt,
  generatePersona,
  GENERATE_SKILLS,
  stageSkills,
} from './skills.ts';
import { isKnownTheme, listThemes, readThumbnail } from './themes.ts';
import { runVerify } from './verify.ts';
import { pptxOutputPath, runConvertToPptx } from './pptx.ts';
import { collectExports, readExportFile } from './exports.ts';
import { extractBrief } from './brief.ts';
import { createQuestionnaireStripper, extractQuestionnaire, stripQuestionnaire } from './questionnaire.ts';
import { friendlyNotInstalled } from './errors.ts';
import {
  findLatestArtifact,
  readArtifactFile,
  resolveManifest,
  type ArtifactManifest,
} from './artifacts.ts';
import { watchArtifacts } from './artifact-watcher.ts';
import { buildFilesResponse } from './files.ts';
import { ANNOTATION_SDK_SOURCE } from './annotation-sdk.ts';
import {
  appendFeedback,
  clearFeedback,
  hasDeckAnnotations,
  markFeedbackSent,
  readPendingFeedback,
  serializeFeedbackForTurn,
} from './feedback-queue.ts';
import {
  attachmentsDir,
  listStagedAttachments,
  readAttachmentFile,
  serializeAttachmentsBlock,
  stageAttachments,
  type AttachmentInput,
} from './attachments.ts';
import { existsSync as fileExists } from 'node:fs';
import type { NormalizedEvent } from './runtimes/events.ts';

/** App-control frames sent over the same WS as NormalizedEvents but kept
 *  separate from the locked agent-event vocabulary (§8.4). */
type AppEvent =
  | { type: 'brief'; brief: import('./brief.ts').Brief }
  // Brief-panel intake: the agent emitted its first-turn ```questionnaire block;
  // the workspace renders it as an interactive form in the Brief panel. The user
  // answers all questions and submits in one click (sent through the chat).
  | { type: 'questionnaire'; questionnaire: import('./questionnaire.ts').Questionnaire }
  | { type: 'gate'; gate: 'gate1'; status: 'pending' | 'approved'; stage: string }
  // Slice 3 (issue #8): the artifact watcher resolved a Wireframe/Deck manifest;
  // the shell uses `kind` to pick the canvas surface and (re)loads the iframe.
  | { type: 'artifact'; manifest: ArtifactManifest }
  // Slice 5 (issue #12, AC2): the html-slides verify gate finished for a generated
  // Deck. The shell presents the Deck as done only when `passed` is true (§12).
  | { type: 'verify'; passed: boolean; summary: string; output?: string }
  // Slice 6 (issue #13, AC2): the editable-PPTX conversion finished. `ok` is true
  // only when a real, editable .pptx landed on disk; the Export panel offers it.
  | { type: 'pptx'; ok: boolean; summary: string; output?: string }
  // Slice 6 (issue #13, M6): the generation produced the chosen output format(s);
  // the Export panel lists each downloadable file with its Brief-derived name.
  | { type: 'exports'; items: import('./exports.ts').ExportItem[] }
  // Slice 10 (issue #10, AC1): the in-app install / sign-in executor streams its
  // progress lines, then a terminal result carrying the refreshed onboarding plan
  // so the wizard advances without the user opening a terminal.
  | { type: 'onboard:progress'; runtimeId: string; kind: OnboardingExecKind; stream: 'stdout' | 'stderr'; line: string }
  | {
      type: 'onboard:result';
      runtimeId: string;
      kind: OnboardingExecKind;
      ok: boolean;
      message: string;
      plan: import('./onboarding.ts').OnboardingPlan;
    };

// The skill bodies Slice 2 stages once at startup (vendored skills/ tree).
const STAGED_BRAINSTORM_SKILLS = stageSkills(BRAINSTORM_SKILLS);
// The skill bodies Slice 5 (Gate 3 — theme + generate the Deck) stages once.
const STAGED_GENERATE_SKILLS = stageSkills(GENERATE_SKILLS);

/** Max daemon-driven fix iterations when a generated deck fails the verify gate.
 *  The agent can't launch the visual verifier in its own sandbox, so the daemon
 *  feeds it the verifier's exact findings and has it fix + re-verify up to this
 *  many times before giving up (each attempt is a full agent run). */
const GENERATE_FIX_ATTEMPTS = 4;

/**
 * Compose the scoped "fix the deck so it passes the gate" prompt from the
 * verifier's exact findings. The agent fixes BLIND — it cannot render the deck
 * itself — so we hand it the precise, pixel-quantified errors (which the daemon's
 * verify produced with a real browser) and tell it exactly how to act on each.
 */
function composeDeckFixPrompt(entry: string, verifierOutput: string, attempt: number, max: number): string {
  const findings = (verifierOutput || '').trim().slice(0, 4500);
  return [
    `The deck "${entry}" FAILED the html-slides verify gate (fix attempt ${attempt} of ${max}).`,
    `You CANNOT launch the visual verifier in this sandbox, so TRUST these exact findings from the gate (it ran with a real browser) and fix them directly — do not try to run verify.py yourself:`,
    '',
    findings,
    '',
    `Apply the fixes in ${entry} only, keeping the same theme + narrative:`,
    `- "content clipped off the slide stage … → bottom/right/top by Npx": that content renders OUTSIDE the 1600×900 stage and is cut off. Pull it in by at least that many px — condense copy, tighten the title to <=2 lines, reduce a section's height, or move a block to another slide.`,
    `- "text clipped inside its container … Npx of text cut off below": that box has a FIXED/constrained height (or max-height) plus overflow:hidden, so its own text is cut off. REMOVE the fixed height / max-height and the overflow:hidden so the box grows to fit its content (or genuinely shorten the text) — do NOT just nudge its position; the text is being clipped, not pushed off-slide.`,
    `- Never shrink text below the readability floors (body >=24px, titles >=60px) — if content only fits by shrinking, SPLIT it onto another slide instead.`,
    `Rewrite ${entry} now with every slide fitting inside the stage. The app will re-verify automatically.`,
  ].join('\n');
}

/** Coerce a request body's `formats` field into the valid OutputFormat[] (§12).
 *  Unknown / empty input falls back to HTML — the format issue #12 wires. */
function normalizeFormats(raw: unknown): OutputFormat[] {
  if (!Array.isArray(raw)) return ['html'];
  const valid = raw.filter((f): f is OutputFormat => f === 'html' || f === 'pptx');
  return valid.length ? valid : ['html'];
}

const __dirname = dirname(fileURLToPath(import.meta.url));

export type DaemonOptions = {
  port?: number;
  host?: string;
};

/** Resolve the static web root (Angular build output), or null if not built. */
function webRoot(): string | null {
  const candidates = [
    join(__dirname, '..', '..', 'web', 'dist', 'web', 'browser'),
    join(__dirname, '..', '..', 'web', 'dist', 'web'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

export async function createDaemon(
  options: DaemonOptions = {},
): Promise<{ server: Server; port: number; host: string; registry: ProcessRegistry; close: () => Promise<void> }> {
  const host = options.host ?? '127.0.0.1';
  // Orphan cleanup (Slice 10, AC3): one registry per daemon. Every agent child
  // the run manager spawns registers here, so `close()` can SIGTERM/SIGKILL them
  // all before the server shuts down — no orphaned codex/copilot process.
  const registry = new ProcessRegistry();
  const app = express();
  // Base64-encoded source files ride the JSON body from the loopback UI; allow a
  // generous ceiling (the Attachment Stager enforces the real per-file cap).
  app.use(express.json({ limit: '64mb' }));

  // --- Commands (HTTP) -----------------------------------------------------
  app.get('/api/health', (_req, res) => res.json({ ok: true }));

  app.get('/api/agents', async (_req, res) => {
    try {
      const agents = await detectAgents();
      res.json({ agents });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // First-run onboarding (Slice 10, issue #10, §13). Detects runtimes + auth
  // state and returns a plain-language, step-by-step plan (install → sign-in) the
  // wizard renders. No CLI flags exposed; Copilot recommended when present.
  app.get('/api/onboarding', async (_req, res) => {
    try {
      const agents = await detectAgents();
      res.json({ plan: buildOnboardingPlan(agents) });
    } catch (err) {
      res.status(500).json({ error: (err as Error).message });
    }
  });

  // Home "recent projects" surface (Slice 11): newest-first, bounded.
  app.get('/api/projects', async (_req, res) => {
    res.json({ projects: await listRecent() });
  });

  app.post('/api/projects', async (req, res) => {
    const brief = String(req.body?.brief ?? '').trim();
    if (!brief) return res.status(400).json({ error: 'brief is required' });
    const project = await createProject({
      brief,
      title: req.body?.title,
      runtimeId: req.body?.runtimeId ?? null,
    });
    return res.status(201).json({ project });
  });

  app.get('/api/projects/:id', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ project });
  });

  // Rename a Project (the library card's title). 400 on a missing/empty title;
  // 404 when the Project does not exist; otherwise the renamed record.
  app.patch('/api/projects/:id', async (req, res) => {
    const title = String(req.body?.title ?? '').trim();
    if (!title) return res.status(400).json({ error: 'title is required' });
    const project = await renameProject(req.params.id, title);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ project });
  });

  // Delete a Project (its whole directory). 200 { ok: true } when it existed,
  // 404 when there was nothing to delete.
  app.delete('/api/projects/:id', async (req, res) => {
    const removed = await deleteProject(req.params.id);
    if (!removed) return res.status(404).json({ error: 'not found' });
    return res.json({ ok: true });
  });

  // Resume a past Project into its prior state (Slice 11): record + the full
  // conversation transcript, so the workspace can restore every prior turn.
  app.get('/api/projects/:id/load', async (req, res) => {
    const loaded = await load(req.params.id);
    if (!loaded) return res.status(404).json({ error: 'not found' });
    return res.json(loaded);
  });

  // --- Feedback queue (Slice 13, AC2) --------------------------------------
  // Queue one piece of feedback (a comment or a wireframe annotation). The item
  // is persisted immediately, so it survives an interrupted run and is replayed
  // on the next turn. Returns the durable pending list so the composer mirrors it.
  app.post('/api/projects/:id/feedback', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    const text = String(req.body?.text ?? '').trim();
    if (!text) return res.status(400).json({ error: 'text is required' });
    const anchor = req.body?.anchor && typeof req.body.anchor === 'object' ? req.body.anchor : undefined;
    // Keep flat `selector`/`anchorText` for the UI + legacy serializer; prefer the
    // anchor's own fields when a structured anchor came in (Slice 4 / issue #11).
    const selector =
      req.body?.selector ?? (anchor?.kind === 'element' ? anchor.selector : anchor?.commonAncestorSelector);
    const anchorText = req.body?.anchorText ?? (anchor ? anchor.text : undefined);
    // Slice 12 (issue #15): which artifact the annotation was pinned on. 'deck'
    // annotations drive a regenerate; default to 'wireframe' (the Slice-4 surface).
    const surface = req.body?.surface === 'deck' ? 'deck' : req.body?.surface === 'wireframe' ? 'wireframe' : undefined;
    await appendFeedback(req.params.id, {
      kind: req.body?.kind === 'annotation' ? 'annotation' : 'comment',
      text,
      selector,
      anchorText,
      slideIndex: typeof req.body?.slideIndex === 'number' ? req.body.slideIndex : undefined,
      surface,
      anchor,
      screenshot: typeof req.body?.screenshot === 'string' ? req.body.screenshot : undefined,
    });
    return res.status(201).json({ pending: await readPendingFeedback(req.params.id) });
  });

  // Read the pending feedback that survived any interruption (AC2). On resume,
  // the composer rehydrates its pills from here.
  app.get('/api/projects/:id/feedback', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ pending: await readPendingFeedback(req.params.id) });
  });

  // Remove ONE queued item (the user clicks the × on a single pill). Marking it
  // sent drops it from pending without touching the others — so removing one
  // annotation no longer wipes the whole queue.
  app.delete('/api/projects/:id/feedback/:itemId', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    await markFeedbackSent(req.params.id, [req.params.itemId]);
    return res.json({ pending: await readPendingFeedback(req.params.id) });
  });

  // Discard the pending feedback (the user clears the whole queue).
  app.delete('/api/projects/:id/feedback', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    await clearFeedback(req.params.id);
    return res.json({ pending: [] });
  });

  // --- Source-material attachments (Slice 8, issue #9) ---------------------
  // Stage source files (xlsx/csv/pptx/pdf/images) from the Home screen or the
  // chat composer into the Project dir (and the agent's --add-dir scope) so the
  // agent reads them and cites REAL figures (§9.5, AC1). Files arrive base64 on
  // the loopback JSON body. An unsupported / oversized file is skipped with a
  // friendly note and NEVER blocks the run (AC2) — the response carries both the
  // staged set and the skipped notes for the composer to surface.
  app.post('/api/projects/:id/attachments', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    const raw = Array.isArray(req.body?.files) ? req.body.files : [];
    const inputs: AttachmentInput[] = [];
    for (const f of raw) {
      const filename = String(f?.filename ?? '').trim();
      if (!filename) continue;
      if (typeof f?.data === 'string') {
        let data: Buffer;
        try {
          data = Buffer.from(f.data, 'base64');
        } catch {
          continue;
        }
        inputs.push({ filename, data });
      } else if (typeof f?.sourcePath === 'string' && f.sourcePath.trim()) {
        inputs.push({ filename, sourcePath: f.sourcePath.trim() });
      }
    }
    const result = await stageAttachments(project.id, inputs);
    return res.status(201).json(result);
  });

  // The source files already staged for a Project (so a resumed/reopened
  // workspace re-surfaces them). Newest workspace load reads this.
  app.get('/api/projects/:id/attachments', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ staged: await listStagedAttachments(project.id) });
  });

  // Serve one staged source file for the file browser's preview (image / PDF) and
  // download. Path-safe: `entry` is contained to the project's attachments dir
  // (no traversal / absolute paths) and must be a real, supported, non-empty
  // file. Served inline (nosniff); the UI's download button uses an `<a download>`
  // so the original filename is restored without a separate route.
  app.get('/api/projects/:id/attachment/content', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    const entry = String(req.query.entry ?? '');
    if (!entry) return res.status(400).json({ error: 'entry is required' });
    const file = await readAttachmentFile(req.params.id, entry);
    if (!file) return res.status(404).json({ error: 'attachment not found' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.type(file.contentType).send(file.body);
  });

  // Brief-panel intake: mark the agent-generated questionnaire answered. The web
  // workspace calls this AFTER it compiles the user's selections into a readable
  // message and sends it through the existing chat path. The Brief panel then
  // reverts to the normal recorded-discussion display; the questionnaire shape is
  // cleared so a resumed Project never re-renders the form.
  app.post('/api/projects/:id/questionnaire/answered', async (req, res) => {
    const project = await markQuestionnaireAnswered(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ project });
  });

  // Gate 1 (arc approval). `approve` advances Brief → Wireframe; `request-changes`
  // loops back to the Brief stage so the user keeps refining in chat (§7.2).
  app.post('/api/projects/:id/gate1', async (req, res) => {
    const action = req.body?.action === 'approve' ? 'approve' : 'request-changes';
    const project = await setGate1(req.params.id, action);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ project });
  });

  // Gate 2 (wireframe approval, Slice 4 / issue #11). `approve` advances
  // Wireframe → Theme; `request-changes` holds the stage on Wireframe so the user
  // keeps annotating and the agent keeps revising (§7.3, §10).
  app.post('/api/projects/:id/gate2', async (req, res) => {
    const action = req.body?.action === 'approve' ? 'approve' : 'request-changes';
    const project = await setGate2(req.params.id, action);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ project });
  });

  // --- Themes + Gate 3 (Slice 5, issue #12) --------------------------------
  // The Theme picker (Gate 3) lists the existing `html-slides` Micron themes with
  // thumbnails (plan §11). Read live from the vendored themes.json so a new
  // upstream theme appears without a code change. The Wireframe stays theme-less;
  // a theme applies ONLY at Deck generation (§7.4, §11).
  app.get('/api/themes', (_req, res) => {
    res.json({ themes: listThemes() });
  });

  // Serve a theme's preview thumbnail for the picker. Path-safe: the preview ref
  // comes from the catalogue and is contained to the themes dir (no traversal).
  app.get('/api/themes/:id/thumbnail', (req, res) => {
    const theme = listThemes().find((t) => t.id === req.params.id);
    if (!theme || !theme.preview) return res.status(404).json({ error: 'no thumbnail' });
    const thumb = readThumbnail(theme.preview);
    if (!thumb) return res.status(404).json({ error: 'no thumbnail' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.type(thumb.contentType).send(thumb.body);
  });

  // Gate 3 (theme picked, AC1): persist the user's theme selection and advance
  // Theme → Deck so the themed Deck is generated. The theme id is validated
  // against the live catalogue so no junk id reaches generation / the verify gate.
  app.post('/api/projects/:id/theme', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    const theme = String(req.body?.theme ?? '').trim();
    if (!theme) return res.status(400).json({ error: 'theme is required' });
    if (!isKnownTheme(theme)) return res.status(400).json({ error: `unknown theme: ${theme}` });
    const formats = normalizeFormats(req.body?.formats);
    const updated = await setTheme(req.params.id, theme, formats);
    return res.json({ project: updated });
  });

  // --- Artifacts (Slice 3, issue #8) ---------------------------------------
  // The current Artifact Manifest for a Project: the watcher pushes live updates
  // over WS, but on workspace load / resume the shell reads the latest artifact
  // here to pick the canvas surface (kind = 'wireframe' → sandboxed iframe).
  app.get('/api/projects/:id/artifact', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    let entry: string | null = null;
    const active = activeDeck(project);
    if (project.stage === 'deck' && active && fileExists(join(projectDir(project.id), active.file))) {
      entry = active.file;
    } else {
      entry = await findLatestArtifact(req.params.id);
    }
    if (!entry) return res.json({ manifest: null });
    const manifest = await resolveManifest(req.params.id, entry);
    return res.json({ manifest });
  });

  // Serve an artifact's bytes for the sandboxed iframe. Path-safe (rejects
  // traversal / absolute paths). The iframe loads this via `srcdoc` for HTML so
  // the cross-origin sandbox is preserved; this route also backs a direct fetch.
  app.get('/api/projects/:id/artifact/content', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    const entry = String(req.query.entry ?? '');
    if (!entry) return res.status(400).json({ error: 'entry is required' });
    const file = await readArtifactFile(req.params.id, entry);
    if (!file) return res.status(404).json({ error: 'artifact not found' });
    // No same-origin leakage: the shell wraps this in a sandboxed iframe.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.type(file.contentType).send(file.body);
  });

  app.get('/api/projects/:id/files', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ files: await buildFilesResponse(project) });
  });

  app.post('/api/projects/:id/active-deck', async (req, res) => {
    const deckId = String(req.body?.deckId ?? '').trim();
    if (!deckId) return res.status(400).json({ error: 'deckId is required' });
    const updated = await setActiveDeck(req.params.id, deckId);
    if (!updated) return res.status(404).json({ error: 'project or deck variant not found' });
    return res.json({ project: updated });
  });

  // --- Export Collector (Slice 7, issue #14, M6) ---------------------------
  // List the downloadable output(s) for a Project — only files that actually
  // exist on disk — each with its Brief-derived download filename + size (§12).
  // The Deck is built as `deck.html` / `deck.pptx`; the panel renames them.
  app.get('/api/projects/:id/exports', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    return res.json({ items: await collectExports(project) });
  });

  // Download one export with its Brief-derived filename (§12, one-way export).
  // Path-safe: `entry` is contained to the project dir (no traversal / absolute
  // paths) and must be a real HTML/PPTX output. Sets a Content-Disposition so the
  // browser saves `q3-yield-ops-review.pptx`, not the on-disk `deck.pptx`.
  app.get('/api/projects/:id/export/download', async (req, res) => {
    const project = await readProject(req.params.id);
    if (!project) return res.status(404).json({ error: 'not found' });
    const entry = String(req.query.entry ?? '');
    if (!entry) return res.status(400).json({ error: 'entry is required' });
    const file = await readExportFile(project, entry);
    if (!file) return res.status(404).json({ error: 'export not found' });
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', `attachment; filename="${file.filename}"`);
    return res.type(file.contentType).send(file.body);
  });

  // The Annotation SDK source (Slice 4 / issue #11), served as JS so the web
  // shell injects it into the sandboxed Wireframe iframe alongside the pager. Kept
  // as an endpoint (not baked into the artifact) so the artifact stays portable:
  // opened standalone it has no SDK; only the in-app iframe gets the overlay.
  app.get('/api/annotation-sdk.js', (_req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.type('application/javascript').send(ANNOTATION_SDK_SOURCE);
  });

  // --- Static web shell ----------------------------------------------------
  const root = webRoot();
  if (root) {
    // Hashed bundles (main-*.js, styles-*.css) are immutable and may cache; but
    // index.html must NEVER cache — it names the current bundle hashes, so a stale
    // copy points at a deleted bundle and renders a blank page (C6). Serve it with
    // no-store on both the static `/` route and the SPA fallback below.
    app.use(
      express.static(root, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('index.html')) res.setHeader('Cache-Control', 'no-store');
        },
      }),
    );
    // SPA fallback (Express 5: no bare '*' route — use a terminal middleware
    // that only handles GET navigations, leaving /api + /ws untouched). Read the
    // index fresh per navigation (it is tiny) so a rebuild's new bundle hashes are
    // always served and an open tab / deep link is never stranded on a stale index.
    const indexPath = join(root, 'index.html');
    app.use((req, res, next) => {
      if (req.method !== 'GET' || req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        return next();
      }
      res.setHeader('Cache-Control', 'no-store');
      return res.type('html').send(readFileSync(indexPath, 'utf8'));
    });
  } else {
    app.get('/', (_req, res) => res.type('html').send(FALLBACK_PAGE));
  }

  const server = createServer(app);

  // --- Streamed agent events (WebSocket) -----------------------------------
  const wss = new WebSocketServer({ server, path: '/ws' });
  wss.on('connection', (socket) => {
    let activeCancel: (() => void) | null = null;
    // Slice 3: one artifact watcher per (socket, project). Subscribing is
    // idempotent per project; we unsubscribe everything when the socket closes.
    const unwatchers = new Map<string, () => void>();

    const send = (event: NormalizedEvent | AppEvent) => {
      if (socket.readyState === socket.OPEN) socket.send(JSON.stringify(event));
    };

    /** Begin watching a Project's dir for Wireframe/Deck artifacts (idempotent). */
    const ensureWatching = (projectId: string) => {
      if (unwatchers.has(projectId)) return;
      const off = watchArtifacts(projectId, (evt) => send(evt));
      unwatchers.set(projectId, off);
    };

    socket.on('close', () => {
      for (const off of unwatchers.values()) off();
      unwatchers.clear();
    });

    socket.on('message', async (raw) => {
      let msg: { type?: string; projectId?: string; text?: string; runtimeId?: string; model?: string; kind?: string };
      try {
        msg = JSON.parse(String(raw));
      } catch {
        return;
      }

      if (msg.type === 'cancel') {
        activeCancel?.();
        return;
      }

      // Slice 10 (issue #10, AC1): run an in-app install / sign-in for a runtime,
      // streaming progress, then push the refreshed onboarding plan so the wizard
      // advances — the non-technical user never touches a terminal. The child is
      // tracked in the daemon registry so a hung install can't orphan (AC3).
      if (msg.type === 'onboard' && msg.runtimeId && (msg.kind === 'install' || msg.kind === 'signin')) {
        const runtimeId = msg.runtimeId;
        const kind = msg.kind as OnboardingExecKind;
        const result = await runOnboardingStep({
          runtimeId,
          kind,
          registry,
          onProgress: (p) => send({ type: 'onboard:progress', runtimeId, kind, stream: p.stream, line: p.line }),
        });
        send({ type: 'onboard:result', runtimeId, kind, ok: result.ok, message: result.message, plan: result.plan });
        return;
      }

      // Slice 3: the shell asks to watch a Project's artifacts (and get the
      // current one immediately). Used on workspace load / resume.
      if (msg.type === 'watch' && msg.projectId) {
        const project = await readProject(msg.projectId);
        if (!project) return;
        ensureWatching(msg.projectId);
        // Active-aware initial emit (mirrors GET /api/projects/:id/artifact): on the
        // deck stage, surface the active variant — never the merely-newest file (the
        // wireframe can be newest and would clobber the deck the client just resolved
        // over HTTP, flashing the theme picker).
        const active = activeDeck(project);
        const entry = (project.stage === 'deck' && active && fileExists(join(projectDir(msg.projectId), active.file)))
          ? active.file
          : await findLatestArtifact(msg.projectId);
        if (entry) send({ type: 'artifact', manifest: await resolveManifest(msg.projectId, entry) });
        return;
      }

      // Slice 5 (issue #12, AC2): generate the themed Deck. The user has picked a
      // Theme (Gate 3) and the flow is at the Deck stage. The agent runs the staged
      // `html-slides` skill to write `deck.html` (+ its Artifact Manifest) in the
      // project dir in the chosen theme; the watcher surfaces it as a Deck (the
      // sandboxed-iframe Deck canvas). Then the daemon runs the html-slides verify
      // gate and emits a `verify` frame — the Deck is presented as done only when
      // it passes (§12). The Wireframe stays theme-less; theme applies only here.
      if (msg.type === 'generate' && msg.projectId) {
        const project = await readProject(msg.projectId);
        if (!project) {
          send({ type: 'error', message: `Project ${msg.projectId} not found` });
          return;
        }
        const theme = project.theme;
        if (!theme || !isKnownTheme(theme)) {
          send({ type: 'error', message: 'Pick a theme before generating the deck.', recovery: 'none' });
          return;
        }
        ensureWatching(msg.projectId);

        const agents = await detectAgents();
        const availableIds = agents.filter((a) => a.available).map((a) => a.id);
        const runtimeId = msg.runtimeId || project.runtimeId || defaultRuntimeId(availableIds) || 'codex';
        const def = getAgentDef(runtimeId);
        if (!def) {
          send({ type: 'error', message: `Unknown runtime: ${runtimeId}` });
          return;
        }
        const detected = agents.find((a) => a.id === runtimeId && a.available);
        if (!detected?.path) {
          const f = friendlyNotInstalled(def.name);
          send({ type: 'error', message: f.message, recovery: f.recovery });
          return;
        }

        // Compose the generation turn: the html-slides persona (theme + entry +
        // manifest contract) + the staged engine skills + the approved Brief and
        // the full transcript so the agent has the agreed narrative arc in context.
        const prior = await readConversation(project.id);
        const transcript = prior.map((c) => ({ role: c.role, text: c.text }));
        // The output format(s) the user chose at Gate 3 (§12, Slice 6). The agent
        // always writes the HTML Deck (the PPTX is converted from it); the choice
        // drives which file(s) the Export panel ultimately offers.
        const formats: OutputFormat[] = project.formats?.length ? project.formats : ['html'];
        const wantsPptx = formats.includes('pptx');

        const projDir = projectDir(project.id);
        const deckEntry = deckFileForTheme(project, theme); // deck.<theme>.html, or legacy deck.html
        const deckAbs = join(projDir, deckEntry);

        // Slice 12 (issue #15): deck-level annotate & iterate. If the user pinned
        // annotations on the EXISTING Deck, this run is a **regenerate** — the agent
        // rewrites only the affected slides. The pending feedback serializes into the
        // scoped `<attached-preview-comments>` block (regenerate-flavored header), is
        // attached to this turn, and is marked sent only if the run completes cleanly
        // (so a cancel/error keeps it pending for the next regenerate). A first
        // generation (no pending feedback) keeps the original wording.
        const pendingFeedback = await readPendingFeedback(project.id);
        const isRegenerate = hasDeckAnnotations(pendingFeedback);
        const feedbackBlock = serializeFeedbackForTurn(pendingFeedback);
        const baseRequest = isRegenerate
          ? [
              `Regenerate the Deck in the "${theme}" theme, applying the pinned annotations`,
              `below. Change only the affected slides — keep every other slide, the theme,`,
              `and the structure as-is. Rewrite ${deckEntry}; the app then re-runs the`,
              `html-slides verify gate and returns any fixes for you to apply.`,
            ].join(' ')
          : [
              `Generate the final Deck now in the "${theme}" theme, following the approved`,
              `narrative arc and the theme-less wireframe we agreed on. Write it to ${deckEntry};`,
              `the app then runs the html-slides verify gate and returns any fixes to apply.`,
            ].join(' ');
        const generatePrompt = composePrompt({
          userRequest: [baseRequest, feedbackBlock].filter((s) => s && s.trim()).join('\n\n'),
          transcript,
          skillBodies: STAGED_GENERATE_SKILLS,
          persona: generatePersona(theme, deckEntry, formats),
        });

        let runFailed = false;
        await appendConversation(project.id, {
          role: 'user',
          text: isRegenerate
            ? `Regenerate the deck with my deck annotations applied.`
            : `Generate the deck in the ${theme} theme.`,
          at: new Date().toISOString(),
        });
        let assistantText = '';
        const handle = startRun(
          {
            def,
            bin: detected.path,
            prompt: generatePrompt,
            model: msg.model ?? null,
            ctx: { cwd: projDir },
            // The agent needs the html-slides skill + themes on its --add-dir scope
            // so it reaches the theme assets/design.md and the verifier by path.
            extraAllowedDirs: [join(__dirname, '..', '..', '..', 'skills', 'html-slides')],
            registry,
          },
          (event) => {
            if (event.type === 'text_delta') assistantText += event.delta;
            if (event.type === 'error') runFailed = true;
            if (event.type === 'status' && event.label === 'cancelled') runFailed = true;
            send(event);
          },
        );
        activeCancel = handle.cancel;
        const outcome = await handle.done;
        activeCancel = null;
        // Slice 12 (issue #15): a clean regenerate consumed the pinned deck
        // annotations — mark them sent so they don't re-attach next time. An
        // interrupted run leaves them pending so the next regenerate re-applies them.
        if (!runFailed && !outcome.cancelled && pendingFeedback.length) {
          await markFeedbackSent(
            project.id,
            pendingFeedback.map((i) => i.id),
          );
        }
        if (assistantText) {
          await appendConversation(project.id, { role: 'assistant', text: assistantText, at: new Date().toISOString() });
        }

        // Run the html-slides verify gate on the produced Deck (§12, AC2). The Deck
        // is presented as done only when it passes. A missing deck / failed run
        // skips the gate with a friendly "couldn't verify" rather than claiming a pass.
        let verifyPassed = false;
        if (!runFailed && !outcome.cancelled) {
          if (fileExists(deckAbs)) {
            const verifyOnce = () =>
              runVerify({ htmlPath: deckAbs, theme, outputDir: join(projDir, 'verify-screenshots') });

            send({ type: 'status', label: 'verifying' });
            let result = await verifyOnce();
            send({ type: 'verify', passed: result.passed, summary: result.summary, output: result.output });

            // The agent can't render the deck in its OWN sandbox (Playwright is
            // blocked there), so it cannot SEE overflow / clipped-text issues to fix
            // them — its self-verify loop is a no-op here. Close the loop daemon-side:
            // when verify fails, feed the EXACT verifier findings back to the agent,
            // have it fix + re-verify, up to GENERATE_FIX_ATTEMPTS, before giving up.
            // Each retry streams to the UI so the user watches it work.
            let fixAttempt = 0;
            let fixAborted = false;
            while (!result.passed && fixAttempt < GENERATE_FIX_ATTEMPTS && !fixAborted) {
              fixAttempt++;
              send({ type: 'status', label: 'running' });
              let fixText = '';
              const fixHandle = startRun(
                {
                  def,
                  bin: detected.path,
                  prompt: composeDeckFixPrompt(deckEntry, result.output ?? result.summary, fixAttempt, GENERATE_FIX_ATTEMPTS),
                  model: msg.model ?? null,
                  ctx: { cwd: projDir },
                  extraAllowedDirs: [join(__dirname, '..', '..', '..', 'skills', 'html-slides')],
                  registry,
                },
                (event) => {
                  if (event.type === 'text_delta') fixText += event.delta;
                  if (event.type === 'error' || (event.type === 'status' && event.label === 'cancelled')) fixAborted = true;
                  send(event);
                },
              );
              activeCancel = fixHandle.cancel;
              const fixOutcome = await fixHandle.done;
              activeCancel = null;
              if (fixText) await appendConversation(project.id, { role: 'assistant', text: fixText, at: new Date().toISOString() });
              if (fixAborted || fixOutcome.cancelled) break;
              send({ type: 'status', label: 'verifying' });
              result = await verifyOnce();
              send({ type: 'verify', passed: result.passed, summary: result.summary, output: result.output });
            }

            verifyPassed = result.passed;

            // Slice 6 (issue #13, AC2): if the user chose PPTX (or PPTX+HTML), build
            // the EDITABLE PowerPoint from the VERIFIED HTML Deck via the html-to-pptx
            // layered converter — real, editable text boxes, not a flat image. Done
            // deterministically by the daemon (the agent never writes the .pptx). A
            // failed conversion surfaces a friendly note rather than crashing the run.
            //
            // Gate on verify PASS (§12, "the Deck is done only when it passes"): never
            // ship a PowerPoint built from a deck that failed the gate (e.g. clipped /
            // overflowing slides) — that just bakes the defects into the .pptx. The
            // agent must fix the flagged issues and regenerate first.
            if (wantsPptx && result.passed) {
              send({ type: 'status', label: 'building-pptx' });
              const pptx = await runConvertToPptx({
                htmlPath: deckAbs,
                outPath: pptxOutputPath(deckAbs),
                workdir: join(projDir, 'pptx-build'),
              });
              send({ type: 'pptx', ok: pptx.ok, summary: pptx.summary, output: pptx.output });
            } else if (wantsPptx && !result.passed) {
              // Drop any stale .pptx from a prior pass so the Export panel never
              // offers a PowerPoint for a deck that no longer passes the gate.
              const stalePptx = pptxOutputPath(deckAbs);
              try {
                if (existsSync(stalePptx)) rmSync(stalePptx);
              } catch {
                /* best-effort cleanup */
              }
              send({
                type: 'pptx',
                ok: false,
                summary: 'Skipped the PowerPoint — the deck has not passed the verify gate yet. Fix the flagged issues and regenerate, then the editable .pptx will be built from the clean deck.',
              });
            }
          } else {
            send({
              type: 'verify',
              passed: false,
              summary: 'The deck file was not produced, so it could not be verified. Try generating again.',
            });
          }
        }

        // Slice 7 (issue #14, M6): collect the produced output(s) — only files that
        // actually exist — and push the Export panel its downloadable list with
        // Brief-derived filenames (§12). A format the user chose but generation
        // didn't produce is omitted; the panel shows what's truly downloadable.
        if (verifyPassed) {
          await registerGeneratedDeck(project.id, theme);
        }
        const exportProject = await readProject(project.id);
        if (exportProject) {
          send({ type: 'exports', items: await collectExports(exportProject) });
        }
        send({ type: 'status', label: 'done' });
        return;
      }

      if (msg.type !== 'chat' || !msg.projectId || !msg.text) return;

      // A chat turn may produce a fresh Wireframe — make sure we're watching.
      ensureWatching(msg.projectId);

      const project = await readProject(msg.projectId);
      if (!project) {
        send({ type: 'error', message: `Project ${msg.projectId} not found` });
        return;
      }
      // The conversation so far (BEFORE this turn) becomes the rendered
      // transcript the Prompt Composer stages — preserving turn-taking (§9.3).
      const prior = await readConversation(project.id);
      await appendConversation(project.id, { role: 'user', text: msg.text, at: new Date().toISOString() });

      const agents = await detectAgents();
      const availableIds = agents.filter((a) => a.available).map((a) => a.id);
      // Resolve the runtime: explicit pick on this turn > the Project's stored
      // runtime > the production default (Copilot when present, then codex).
      const runtimeId = msg.runtimeId || project.runtimeId || defaultRuntimeId(availableIds) || 'codex';
      const def = getAgentDef(runtimeId);
      if (!def) {
        send({ type: 'error', message: `Unknown runtime: ${runtimeId}` });
        return;
      }

      const detected = agents.find((a) => a.id === runtimeId && a.available);
      if (!detected?.path) {
        // Friendly + recovery, never a bare "not installed" line (AC1).
        const f = friendlyNotInstalled(def.name);
        send({ type: 'error', message: f.message, recovery: f.recovery });
        return;
      }

      // Build the transcript: everything before this turn. Drop a trailing prior
      // turn that exactly duplicates the current message (the seeded opening
      // brief equals the auto-run first user turn).
      const transcript = prior
        .filter((c) => !(c.role === 'user' && c.text.trim() === msg.text!.trim()))
        .map((c) => ({ role: c.role, text: c.text }));

      // AC2: pending feedback that survived any prior interruption is attached
      // to THIS turn as the structured comments block. It is marked sent only if
      // this run completes cleanly (below) — so a cancel/error/disconnect keeps
      // it pending for the next turn.
      const pendingFeedback = await readPendingFeedback(project.id);
      // Pinned wireframe annotations serialize through the rich Slice-4 block
      // (full anchor + current text + slide + screenshot ref + the scoped "change
      // ONLY these elements" instruction); free-text comments keep the thin block.
      const feedbackBlock = serializeFeedbackForTurn(pendingFeedback);

      // Slice 8 (issue #9): the source files staged for this Project are listed
      // in the prompt so the agent reads them and cites REAL figures (§9.5, AC1).
      // The attachments dir is added to the CLI's --add-dir scope below so it can
      // reach the files; cwd is the project dir (relative-path reads + the codex
      // Windows-sandbox compensating control, §15).
      const staged = await listStagedAttachments(project.id);
      const attachmentsBlock = serializeAttachmentsBlock(staged);

      const userRequest = [msg.text, attachmentsBlock, feedbackBlock]
        .filter((s) => s && s.trim())
        .join('\n\n');

      const prompt = composePrompt({
        userRequest,
        transcript,
        skillBodies: STAGED_BRAINSTORM_SKILLS,
      });

      const projDir = projectDir(project.id);
      const attachDir = attachmentsDir(project.id);
      const extraAllowedDirs = fileExists(attachDir) ? [attachDir] : [];
      let assistantText = '';
      let runFailed = false;
      // Brief-panel intake: the agent emits its first-turn ```questionnaire block
      // alongside a one-line intro. The chat must show ONLY the intro, so strip the
      // block off the streamed text_delta on the wire (the daemon can't edit the
      // web chat's display transform). Once the questionnaire is answered the agent
      // stops emitting it, so the stripper is a harmless pass-through thereafter.
      const stripper = createQuestionnaireStripper();
      const handle = startRun(
        {
          def,
          bin: detected.path,
          prompt,
          model: msg.model ?? null,
          // Scope the run to the Project dir so the agent reads staged source
          // files by relative path; add the attachments dir to --add-dir (§9.5).
          ctx: { cwd: projDir },
          extraAllowedDirs,
          // Track the agent child for orphan cleanup on app exit (Slice 10, AC3).
          registry,
        },
        (event) => {
          if (event.type === 'text_delta') {
            // Keep the FULL text (block included) for parsing/persistence below;
            // forward only the questionnaire-stripped text to the chat. Preserve
            // `final` so the chat still seals each COMPLETE codex message into its
            // own bubble (without it, two messages with no tool between re-merge).
            assistantText += event.delta;
            const visible = stripper.push(event.delta);
            if (visible) send({ type: 'text_delta', delta: visible, final: event.final });
            return;
          }
          // A friendly error mid-run means the turn did not complete cleanly —
          // pending feedback must NOT be marked sent (AC2).
          if (event.type === 'error') runFailed = true;
          if (event.type === 'status' && event.label === 'cancelled') runFailed = true;
          send(event);
        },
      );
      activeCancel = handle.cancel;
      const outcome = await handle.done;
      activeCancel = null;
      // Defensive: release any text the streaming stripper was holding back for a
      // (never-closed) block tail, so no in-flight prose is lost on the wire.
      const tail = stripper.flush();
      if (tail) send({ type: 'text_delta', delta: tail });
      const cleanRun = !runFailed && !outcome.cancelled;
      // Only a clean run consumes the queued feedback; an interrupted one leaves
      // it pending so the next turn re-attaches it (AC2).
      if (cleanRun && pendingFeedback.length) {
        await markFeedbackSent(
          project.id,
          pendingFeedback.map((i) => i.id),
        );
      }
      if (assistantText) {
        // Brief-panel intake: parse the first-turn ```questionnaire block out of
        // the assistant text, persist it, and push it so the Brief panel renders
        // the interactive form. Strip the block from the saved conversation so a
        // resumed Project's transcript shows only the one-line intro (mirrors how
        // the brief block is stripped from chat display).
        const questionnaire = extractQuestionnaire(assistantText);
        const savedText = questionnaire ? stripQuestionnaire(assistantText) : assistantText;
        await appendConversation(project.id, { role: 'assistant', text: savedText, at: new Date().toISOString() });
        if (questionnaire) {
          const updated = await setQuestionnaire(project.id, questionnaire);
          // Only push the form while it is still unanswered (setQuestionnaire is a
          // no-op once answered, so a stray re-emission can't reopen it).
          if (updated && !updated.questionnaireAnswered) {
            send({ type: 'questionnaire', questionnaire });
          }
        }
        // Parse the live Brief out of the assistant's structured output and push
        // it to the workspace so the Brief panel fills in (audience/goal/arc/messages).
        const brief = extractBrief(assistantText);
        if (brief) {
          await updateRecordedBrief(project.id, brief);
          const updated = await readProject(project.id);
          send({ type: 'brief', brief: updated?.recordedBrief ?? brief });
        }
      }
      send({ type: 'status', label: 'done' });
    });
  });

  const port = await new Promise<number>((resolve) => {
    server.listen(options.port ?? 4317, host, () => {
      const addr = server.address();
      resolve(typeof addr === 'object' && addr ? addr.port : (options.port ?? 4317));
    });
  });

  // Orphan cleanup (Slice 10, AC3): kill every tracked agent child, then close
  // the WS + HTTP server. The launcher wires this to the process exit signals so
  // closing the app leaves no orphaned child or daemon behind.
  const close = async (): Promise<void> => {
    await registry.killAll();
    await new Promise<void>((resolve) => {
      wss.close(() => resolve());
    });
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  };

  return { server, port, host, registry, close };
}

const FALLBACK_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Slide Studio</title>
<style>body{font-family:system-ui;background:#faf8f5;color:#1a1a1a;max-width:680px;margin:6vh auto;padding:0 20px}
.bubble{padding:10px 14px;border-radius:12px;margin:6px 0;white-space:pre-wrap}
.u{background:#efe9ff;text-align:right}.a{background:#fff;border:1px solid #eee}
input{width:100%;padding:12px;border:1px solid #ddd;border-radius:10px;font-size:15px}</style></head>
<body><h1>Slide Studio</h1><p>Walking skeleton. The Angular + Atlas shell is not built into this folder yet; this fallback proves the daemon ↔ codex ↔ WebSocket spine.</p>
<div id="log"></div><input id="in" placeholder="Describe the deck you want…" autofocus>
<script>
const log=document.getElementById('log'),inp=document.getElementById('in');let ws,pid;
function add(t,c){const d=document.createElement('div');d.className='bubble '+c;d.textContent=t;log.appendChild(d);return d}
inp.addEventListener('keydown',async e=>{if(e.key!=='Enter'||!inp.value.trim())return;const text=inp.value.trim();inp.value='';
add(text,'u');
if(!pid){const r=await fetch('/api/projects',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({brief:text})});pid=(await r.json()).project.id;}
ws=ws||new WebSocket('ws://'+location.host+'/ws');
const ready=ws.readyState===1?Promise.resolve():new Promise(r=>ws.addEventListener('open',r,{once:true}));
let bubble=null;ws.onmessage=ev=>{const e=JSON.parse(ev.data);if(e.type==='text_delta'){if(!bubble)bubble=add('','a');bubble.textContent+=e.delta;}else if(e.type==='error'){add('⚠ '+e.message,'a');}else if(e.type==='status'&&e.label==='done'){bubble=null;}};
await ready;ws.send(JSON.stringify({type:'chat',projectId:pid,text}));});
</script></body></html>`;
