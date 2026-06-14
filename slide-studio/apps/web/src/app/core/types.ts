/** Shared contracts with the daemon. Mirror of apps/daemon/src/runtimes/events.ts
 *  and projects.ts — kept thin and hand-synced for the walking skeleton. */

/** Recovery affordance the shell offers for a friendly error (Slice 13, AC1). */
export type RecoveryAction = 'retry' | 'signin' | 'reconnect' | 'install' | 'none';

export type NormalizedEvent =
  | { type: 'status'; label: string; model?: string }
  | { type: 'thinking_delta'; delta: string }
  // `final` marks a COMPLETE message (codex sends each agent_message whole, not
  // token-by-token). The chat seals the bubble on a final delta so the next
  // agent message opens its OWN bubble instead of concatenating into one wall.
  | { type: 'text_delta'; delta: string; final?: boolean }
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  | { type: 'tool_result'; toolUseId: string; content: string; isError: boolean }
  | { type: 'usage'; usage: Record<string, number>; durationMs?: number; stopReason?: string }
  // `message` is always plain-language; `recovery` tells the shell which button
  // to offer; `raw` is for debugging only (Slice 13, AC1).
  | { type: 'error'; message: string; recovery?: RecoveryAction; raw?: string }
  | { type: 'raw'; line: string }
  // App-control frames (not part of the locked agent vocabulary): the daemon
  // pushes the live Brief and gate state over the same socket.
  | { type: 'brief'; brief: Brief }
  // Brief-panel intake: the agent emitted its first-turn ```questionnaire block;
  // the workspace renders it as an interactive form in the Brief panel.
  | { type: 'questionnaire'; questionnaire: Questionnaire }
  | { type: 'gate'; gate: 'gate1'; status: GateStatus; stage: FlowStage }
  // Slice 3 (issue #8): the artifact watcher resolved a Wireframe/Deck manifest.
  // The shell uses `kind` to pick the canvas surface (wireframe → sandboxed iframe).
  | { type: 'artifact'; manifest: ArtifactManifest }
  // Slice 5 (issue #12, AC2): the html-slides verify gate finished for a generated
  // Deck. The shell presents the Deck as done only when `passed` is true (§12).
  | { type: 'verify'; passed: boolean; summary: string; output?: string }
  // Slice 6 (issue #13, AC2): the editable-PPTX conversion finished. `ok` is true
  // only when a real, editable .pptx landed on disk; the Export panel offers it.
  | { type: 'pptx'; ok: boolean; summary: string; output?: string }
  // Slice 7 (issue #14, M6): the produced output format(s) the Export panel lists,
  // each with a Brief-derived download filename + size.
  | { type: 'exports'; items: ExportItem[] }
  // Slice 10 (issue #10, AC1): the in-app install / sign-in executor streams its
  // progress, then a terminal result with the refreshed plan so the wizard advances.
  | { type: 'onboard:progress'; runtimeId: string; kind: 'install' | 'signin'; stream: 'stdout' | 'stderr'; line: string }
  | { type: 'onboard:result'; runtimeId: string; kind: 'install' | 'signin'; ok: boolean; message: string; plan: OnboardingPlan };

/** The live Recorded Discussion rendered in the Brief panel. */
export interface Brief {
  audience?: string;
  goal?: string;
  narrativeArc?: string[];
  keyMessages?: string[];
}

// --- Intake questionnaire (Brief-panel intake) ----------------------------
// Mirror of daemon src/questionnaire.ts. On the FIRST brainstorm turn the agent
// emits a contextual set of common framing questions the Brief panel renders as
// an interactive form. The user answers all of them and submits in one click;
// only then does the agent continue with conversational follow-ups.

/** One framing question's input type. `single` = pick one; `multi` = pick any. */
export type QuestionType = 'single' | 'multi';

/** One framing question the Brief-panel questionnaire renders. */
export interface QuestionnaireQuestion {
  id: string;
  label: string;
  type: QuestionType;
  options: string[];
  /** When true, the form offers an "Other…" chip with a free-text input. */
  allowOther?: boolean;
}

/** The agent-generated, deck-contextual intake questionnaire. */
export interface Questionnaire {
  /** The one-line intro shown above the questions. */
  intro: string;
  questions: QuestionnaireQuestion[];
}

/** Pipeline steps the top stepper walks. */
export type FlowStage = 'brief' | 'wireframe' | 'theme' | 'deck';

/** Gate status (Gate 1 arc approval, Gate 2 wireframe approval, Gate 3 theme picked). */
export type GateStatus = 'pending' | 'approved';

/** Slide-output format(s) the Deck is generated in (plan §12). */
export type OutputFormat = 'html' | 'pptx';

// --- Source-material attachments (Slice 8, issue #9, §9.5) -----------------
// Mirror of the daemon's attachments.ts. Source files the user attaches from the
// Home screen / chat composer are classified, size-capped, and STAGED into the
// Project dir so the agent cites REAL figures (AC1). An unsupported / oversized
// file is skipped with a friendly note and NEVER blocks the run (AC2).

/** The category a staged attachment classified into (mirror of daemon
 *  AttachmentCategory, minus 'unsupported' — skipped files carry a note). */
export type AttachmentCategory = 'data' | 'document' | 'image';

/** One file the daemon successfully staged for the agent to read. Mirror of the
 *  daemon's StagedAttachment (src/attachments.ts). */
export interface StagedAttachment {
  filename: string;
  category: AttachmentCategory;
  /** Path relative to the project dir (e.g. `attachments/yield-q3.csv`). */
  relPath: string;
  bytes: number;
}

/** One file the daemon did NOT stage, with a friendly, plain-language note
 *  (never a raw error). Mirror of the daemon's SkippedAttachment. */
export interface SkippedAttachment {
  filename: string;
  reason: 'unsupported' | 'too-large' | 'empty' | 'unreadable';
  note: string;
}

/** The result of staging a batch of attachments (mirror of daemon StageResult):
 *  what was staged + the friendly notes for everything skipped (AC2). */
export interface StageAttachmentsResult {
  staged: StagedAttachment[];
  skipped: SkippedAttachment[];
}

/**
 * One downloadable output the Export panel lists (Slice 7 / issue #14, M6).
 * Mirror of the daemon's ExportItem (src/exports.ts): the produced format, the
 * on-disk entry the download reads, the Brief-derived save filename, and the size.
 */
export interface ExportItem {
  format: OutputFormat;
  entry: string;
  filename: string;
  bytes: number;
}

/**
 * One theme as the picker renders it (Gate 3, plan §11). Mirror of the daemon's
 * ThemeCard (src/themes.ts) — the existing `html-slides` Micron themes the user
 * picks for the Deck. The thumbnail is served at
 * `/api/themes/:id/thumbnail`; `when` is the "use this when…" guidance.
 */
/** Representative colours the Theme picker uses to render a crafted preview card
 *  (no screenshot). All hex; `accent2` is optional. Mirror of daemon ThemePalette. */
export interface ThemePalette {
  mode: 'light' | 'dark';
  bg: string;
  ink: string;
  accent: string;
  accent2?: string;
}

export interface ThemeCard {
  id: string;
  name: string;
  status: string;
  role: string;
  when: string;
  preview: string | null;
  palette: ThemePalette | null;
  deprecated: boolean;
}

// --- Annotations (Slice 4, issue #11, §10) --------------------------------
// Mirror of daemon src/annotation.ts. The injected SDK captures these anchors in
// the sandboxed iframe and posts them to the host; the workspace queues them.

/** A re-locatable boundary inside an element (text-range anchoring). */
export interface TextBoundary {
  selector: string;
  path: number[];
  offset: number;
}

/** A text-range anchor: the common-ancestor element + start/end boundaries. */
export interface TextRangeAnchor {
  kind: 'text-range';
  commonAncestorSelector: string;
  start: TextBoundary;
  end: TextBoundary;
  text: string;
}

/** An element anchor: a CSS selector path + a trimmed text snapshot. */
export interface ElementAnchor {
  kind: 'element';
  selector: string;
  tag: string;
  text: string;
}

export type Anchor = ElementAnchor | TextRangeAnchor;

/** Which reviewable artifact an annotation was pinned on (Slice 12 / issue #15).
 *  A 'deck' annotation drives a regenerate; 'wireframe' an in-place revise. */
export type AnnotationSurface = 'wireframe' | 'deck';

/** One annotation the user pinned on the wireframe or deck (element / text /
 *  whole-slide). `surface` selects the revise vs regenerate path (issue #15). */
export interface Annotation {
  id: string;
  comment: string;
  slideIndex: number;
  anchor: Anchor | null;
  screenshot?: string;
  surface?: AnnotationSurface;
}

/** A reviewable artifact's kind (mirror of daemon ArtifactKind, plan §9.4). */
export type ArtifactKind = 'wireframe' | 'deck';

/** A reviewable artifact's output format (mirror of daemon ArtifactFormat). */
export type ArtifactFormat = 'html' | 'pptx';

/**
 * The Artifact Manifest the daemon resolves so the shell renders the right
 * canvas surface (plan §9.4, issue #8). `kind = 'wireframe'` selects the
 * sandboxed-iframe wireframe surface; `entry` is the artifact-relative entry the
 * iframe loads; `slides` drives the slide-by-slide pager; `theme` is null for a
 * theme-less Wireframe. Mirror of daemon src/artifacts.ts::ArtifactManifest.
 */
export interface ArtifactManifest {
  kind: ArtifactKind;
  format: ArtifactFormat;
  entry: string;
  slides: number;
  theme: string | null;
  inferred?: boolean;
}

export interface DetectedAgent {
  id: string;
  name: string;
  available: boolean;
  authStatus?: 'ok' | 'missing' | 'unknown';
  authMessage?: string;
  version?: string | null;
}

// --- First-run onboarding (Slice 10, issue #10, §13) ----------------------
// Mirror of daemon src/onboarding.ts. The wizard renders this plain-language
// install→sign-in plan; no agent-id branching, no CLI flags shown.

export type OnboardingStepKind = 'install' | 'signin' | 'ready';
export type SignInProvider = 'openai' | 'github-sso';

export interface OnboardingRuntime {
  id: string;
  name: string;
  ready: boolean;
  installed: boolean;
  authStatus: 'ok' | 'missing' | 'unknown';
  step: OnboardingStepKind;
  title: string;
  detail: string;
  signInProvider?: SignInProvider;
  actionUrl?: string;
  recommended: boolean;
  /** Optional command, surfaced only behind an "advanced / IT" disclosure. */
  commandHint?: string;
  /** True when the wizard can run this step IN-APP (AC1): the daemon executes the
   *  install/login command and streams progress — no terminal for the user. */
  canRunInApp: boolean;
}

export interface OnboardingPlan {
  canStart: boolean;
  defaultRuntimeId: string | null;
  runtimes: OnboardingRuntime[];
  summary: string;
}

export interface ProjectRecord {
  id: string;
  title: string;
  brief: string;
  runtimeId: string | null;
  theme: string | null;
  stage: FlowStage;
  recordedBrief: Brief;
  /** The agent-generated intake questionnaire (Brief-panel intake), or null when
   *  none is pending / it has been answered. */
  questionnaire: Questionnaire | null;
  /** True once the user has submitted their questionnaire answers. The Brief panel
   *  then reverts to the normal recorded-discussion display. */
  questionnaireAnswered: boolean;
  gate1: GateStatus;
  /** Gate 2 (wireframe approval) status (Slice 4 / issue #11). */
  gate2: GateStatus;
  /** Gate 3 (theme picked) status (Slice 5 / issue #12). */
  gate3: GateStatus;
  /** The output format(s) the Deck is generated in (plan §12). */
  formats: OutputFormat[];
  createdAt: string;
  updatedAt: string;
}

/** A chat timeline entry. The transcript is an ORDERED list of these so the
 *  conversation reads chronologically:
 *   - `user` / `assistant` are message bubbles (one bubble per agent message);
 *   - `status` is a discrete status row (verify gate, PPTX build, …);
 *   - `tool` is a tool-step chip.
 *  Splitting status + tools into their own entries — instead of merging them into
 *  the assistant bubble — is what keeps responses from piling into one wall of
 *  text while the status updates tick by one-by-one. */
export type ChatTurnRole = 'user' | 'assistant' | 'status' | 'tool';

export interface ChatTurn {
  role: ChatTurnRole;
  text: string;
  thinking?: string;
  pending?: boolean;
  /** assistant: once sealed, this message is complete; the NEXT agent message
   *  opens a fresh bubble rather than appending here. */
  sealed?: boolean;
  /** status row tone — drives the icon + color (info = in-progress). */
  tone?: 'info' | 'ok' | 'warn';
  /** tool row: the tool_use id its result matches, plus live run state. */
  toolId?: string;
  running?: boolean;
  failed?: boolean;
}

/** One persisted conversation turn (mirror of daemon ConversationEntry). */
export interface ConversationEntry {
  role: 'user' | 'assistant';
  text: string;
  at: string;
}

/** A Project's full prior state — record + transcript — for resume (Slice 11). */
export interface LoadedProject {
  project: ProjectRecord;
  conversation: ConversationEntry[];
}

/** One piece of queued feedback (mirror of daemon FeedbackItem, Slice 13 AC2).
 *  Persisted on the daemon so it survives an interrupted run. */
export interface QueuedFeedback {
  id: string;
  kind: 'comment' | 'annotation';
  text: string;
  selector?: string;
  anchorText?: string;
  slideIndex?: number;
  /** Which artifact the annotation targets (Slice 12 / issue #15) — 'deck' drives
   *  a regenerate. Unset defaults to 'wireframe'. */
  surface?: AnnotationSurface;
  /** The full element / text-range anchor (Slice 4 / issue #11), when pinned. */
  anchor?: Anchor | null;
  /** Project-relative screenshot ref of the targeted region. */
  screenshot?: string;
  sent?: boolean;
  at: string;
}
