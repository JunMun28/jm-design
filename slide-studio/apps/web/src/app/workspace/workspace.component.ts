import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AgentSocketService, type SocketFrame } from '../core/agent-socket.service';
import { ChatComponent } from '../chat/chat.component';
import { WireframeComponent } from '../wireframe/wireframe.component';
import { ThemesComponent } from '../themes/themes.component';
import { DeckComponent } from '../deck/deck.component';
import { QuestionnaireComponent } from './questionnaire.component';
import type {
  Annotation,
  ArtifactManifest,
  Brief,
  ChatTurn,
  ExportItem,
  FlowStage,
  GateStatus,
  OutputFormat,
  ProjectRecord,
  Questionnaire,
} from '../core/types';

const STEPS: { id: FlowStage; label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'theme', label: 'Theme' },
  { id: 'deck', label: 'Deck' },
];

/**
 * The one workspace (plan §7): canvas on the left, persistent chat on the right,
 * a slim stepper across the top (Brief → Wireframe → Theme → Deck).
 *
 * Slice 2 (issue #4): the canvas hosts the live **Brief (Recorded Discussion)**
 * panel — audience, goal, narrative arc, key messages — which fills in as the
 * agent emits structured output. When the arc has landed, a **Gate 1** affordance
 * (Approve arc / Request changes) appears: approving advances the flow to
 * Wireframe; requesting changes loops back into the chat for another pass.
 *
 * Slice 3 (issue #8): the canvas surface is **selected from the Artifact
 * Manifest**. When the daemon's artifact watcher resolves a manifest whose
 * `kind === 'wireframe'`, the canvas swaps the Brief panel for the
 * {@link WireframeComponent} — a **sandboxed iframe** the user pages through
 * **slide by slide**. The Brief panel remains the surface until a wireframe lands.
 */
@Component({
  selector: 'ss-workspace',
  standalone: true,
  imports: [RouterLink, ChatComponent, WireframeComponent, ThemesComponent, DeckComponent, QuestionnaireComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ws">
      <header class="ws__top">
        <a class="ws__back" routerLink="/">← Home</a>
        <nav class="stepper" aria-label="Steps">
          @for (step of steps; track step.id) {
            <span
              class="step"
              [class.step--active]="step.id === stage()"
              [class.step--done]="isDone(step.id)"
              [attr.aria-current]="step.id === stage() ? 'step' : null"
            >{{ step.label }}</span>
          }
        </nav>
        <span class="ws__title" [title]="project()?.title ?? ''">{{ project()?.title ?? '…' }}</span>
      </header>

      <div class="ws__body">
        <!-- Slice 5 (issue #12): the Deck canvas surface is selected when the
             Artifact Manifest's kind === 'deck' — the final, themed, high-fi
             output in a sandboxed iframe. It takes priority over the picker. -->
        @if (deck(); as dk) {
          <section class="canvas canvas--deck" aria-label="Deck canvas">
            <div class="wfhead">
              <h2 class="canvas__h">Deck — {{ dk.theme || 'themed' }}</h2>
              @if (verifyState(); as v) {
                <span class="deckhead__verify" [class.deckhead__verify--ok]="v.passed" [class.deckhead__verify--fail]="!v.passed">
                  {{ v.passed ? '✓ Passed verify gate' : '⚠ ' + v.summary }}
                </span>
              } @else {
                <!-- Slice 12 (issue #15): the Deck reuses the wireframe annotation
                     mechanism — click an element or select text to pin a change, then
                     regenerate the affected slides. -->
                <span class="wfhead__hint">Click an element or select text to annotate the deck, then regenerate the affected slides — or keep chatting to refine.</span>
              }
            </div>
            <ss-deck [manifest]="dk" [projectId]="project()!.id" (annotate)="onDeckAnnotate($event)" />

            <!-- Slice 12 (issue #15): when the user has pinned deck annotations, a
                 Regenerate affordance re-runs generation so the agent rewrites only
                 the affected slides. -->
            @if (deckAnnotations() > 0) {
              <div class="gate gate--deck" role="group" aria-label="Apply deck annotations">
                <p class="gate__prompt">
                  {{ deckAnnotations() }} deck {{ deckAnnotations() === 1 ? 'annotation' : 'annotations' }} pinned. Regenerate the deck to apply them to the affected slides.
                </p>
                <div class="gate__actions">
                  <button class="mic-btn mic-btn--primary" type="button" [disabled]="regenBusy()" (click)="regenerateDeck()">
                    Regenerate deck
                  </button>
                </div>
              </div>
            }

            <!-- Export panel (Slice 7 / issue #14, M6): download the produced
                 output(s) with Brief-derived filenames. -->
            <div class="export" role="group" aria-label="Export the deck">
              <div class="export__head">
                <h3 class="export__h">Export</h3>
                @if (pptxState(); as p) {
                  <span class="export__pptx" [class.export__pptx--ok]="p.ok" [class.export__pptx--fail]="!p.ok">
                    {{ p.ok ? '✓ Editable PowerPoint ready' : '⚠ ' + p.summary }}
                  </span>
                }
              </div>
              @if (exports().length) {
                <ul class="export__list">
                  @for (item of exports(); track item.entry) {
                    <li class="export__item">
                      <span class="export__fmt">{{ item.format === 'pptx' ? 'PowerPoint' : 'HTML' }}</span>
                      <span class="export__name">{{ item.filename }}</span>
                      <span class="export__size">{{ formatBytes(item.bytes) }}</span>
                      <a class="mic-btn mic-btn--primary export__dl" [href]="exportUrl(item.entry)" [download]="item.filename">
                        Download
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <p class="export__hint">Your chosen format(s) will appear here to download once the deck is generated.</p>
              }
            </div>
          </section>
        }
        <!-- Slice 5: the Theme picker (Gate 3) shows once the Wireframe is approved
             (stage === 'theme') until a theme is picked and a Deck lands. -->
        @else if (showThemePicker()) {
          <section class="canvas canvas--theme" aria-label="Theme picker">
            <ss-themes
              [projectId]="project()!.id"
              [chosen]="project()!.theme"
              [chosenFormats]="project()!.formats"
              (themePicked)="onThemePicked($event)"
            />
          </section>
        }
        <!-- Slice 3: the canvas surface is selected from the Artifact Manifest.
             kind === 'wireframe' → the sandboxed-iframe Wireframe surface. -->
        @else if (wireframe(); as wf) {
          <section class="canvas canvas--wf" aria-label="Wireframe canvas">
            <div class="wfhead">
              <h2 class="canvas__h">Wireframe — review (theme-less)</h2>
              <span class="wfhead__hint">Click an element or select text to annotate, then send to revise.</span>
            </div>
            <ss-wireframe [manifest]="wf" [projectId]="project()!.id" (annotate)="onAnnotate($event)" />

            <!-- Gate 2: approve the wireframe (advances to Theme) or keep revising. -->
            <div class="gate gate--wf" role="group" aria-label="Gate 2: approve the wireframe">
              @if (gate2() === 'approved') {
                <p class="gate__done">✓ Wireframe approved — moving to the theme.</p>
              } @else {
                <p class="gate__prompt">Happy with the wireframe? Approve to pick a theme, or keep annotating to revise it.</p>
                <div class="gate__actions">
                  <button class="mic-btn mic-btn--primary" type="button" [disabled]="gateBusy()" (click)="approveWireframe()">
                    Approve wireframe
                  </button>
                </div>
              }
            </div>
          </section>
        } @else if (intakeForm(); as q) {
          <!-- Brief-panel intake: before the recorded discussion fills in, the
               agent's first-turn questionnaire renders here as an interactive form.
               The user answers all questions and submits in one click; the answers
               go through the existing chat path and the panel reverts below. -->
          <section class="canvas" aria-label="Intake questionnaire">
            <h2 class="canvas__h">Brief — frame your deck</h2>
            <ss-questionnaire [questionnaire]="q" [busy]="intakeBusy()" (send)="submitQuestionnaire($event)" />
          </section>
        } @else {
        <section class="canvas" aria-label="Canvas">
          <h2 class="canvas__h">Brief — Recorded Discussion</h2>

          @if (project()) {
            <dl class="brief">
              <div class="brief__field">
                <dt>Audience</dt>
                <dd [class.brief__empty]="!brief().audience">{{ brief().audience || 'Not captured yet' }}</dd>
              </div>
              <div class="brief__field">
                <dt>Goal</dt>
                <dd [class.brief__empty]="!brief().goal">{{ brief().goal || 'Not captured yet' }}</dd>
              </div>
              <div class="brief__field">
                <dt>Narrative arc</dt>
                <dd>
                  @if (brief().narrativeArc?.length) {
                    <ol class="brief__arc">
                      @for (beat of brief().narrativeArc; track $index) {
                        <li>{{ beat }}</li>
                      }
                    </ol>
                  } @else {
                    <span class="brief__empty">Not captured yet</span>
                  }
                </dd>
              </div>
              <div class="brief__field">
                <dt>Key messages</dt>
                <dd>
                  @if (brief().keyMessages?.length) {
                    <ul class="brief__msgs">
                      @for (msg of brief().keyMessages; track $index) {
                        <li>{{ msg }}</li>
                      }
                    </ul>
                  } @else {
                    <span class="brief__empty">Not captured yet</span>
                  }
                </dd>
              </div>
            </dl>

            <!-- Gate 1: appears once the agent has proposed a narrative arc. -->
            @if (gateVisible()) {
              <div class="gate" role="group" aria-label="Gate 1: approve the narrative arc">
                @if (gate1() === 'approved') {
                  <p class="gate__done">✓ Arc approved — moving to the wireframe.</p>
                } @else {
                  <p class="gate__prompt">Does this narrative arc work? Approve to build the wireframe, or request changes to keep refining.</p>
                  <div class="gate__actions">
                    <button class="mic-btn mic-btn--primary" type="button" [disabled]="gateBusy()" (click)="approveArc()">
                      Approve arc
                    </button>
                    <button class="mic-btn" type="button" [disabled]="gateBusy()" (click)="requestChanges()">
                      Request changes
                    </button>
                  </div>
                }
              </div>
            } @else {
              <p class="canvas__hint">The recorded discussion fills in here as you brainstorm. Once the agent proposes a narrative arc, you can approve it (Gate 1).</p>
            }
          } @else {
            <p class="canvas__hint">Loading project…</p>
          }
        </section>
        }

        <aside class="chatcol" aria-label="Chat">
          @if (project()) {
            <ss-chat
              [projectId]="project()!.id"
              [runtimeId]="project()!.runtimeId"
              [seedTurns]="seedTurns()"
              (briefChanged)="onBrief($event)"
              (turnComplete)="onTurnComplete()"
              (verified)="onVerified($event)"
            />
          }
        </aside>
      </div>
    </div>
  `,
  styles: [
    `
      .ws { display: flex; flex-direction: column; height: 100vh; }
      .ws__top { display: flex; align-items: center; gap: 16px; padding: 12px 116px 12px 20px; border-bottom: 1px solid var(--mic-border); background: var(--mic-surface); }
      .ws__back { color: var(--mic-muted); text-decoration: none; font-size: 14px; }
      .ws__back:hover { color: var(--mic-accent); }
      .ws__title { margin-left: auto; font-weight: 600; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .stepper { display: flex; gap: 6px; }
      .step { font-size: 13px; color: var(--mic-faint); padding: 4px 12px; border-radius: 999px; }
      .step--active { color: var(--mic-on-accent); background: var(--mic-accent); }
      .step--done { color: var(--mic-accent); }
      .ws__body { flex: 1; display: grid; grid-template-columns: 1fr 420px; min-height: 0; }
      .canvas { padding: 28px 32px; overflow-y: auto; }
      .canvas--wf, .canvas--deck { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
      .canvas--wf .canvas__h, .canvas--deck .canvas__h { flex: 0 0 auto; margin-bottom: 4px; }
      .canvas--wf ss-wireframe, .canvas--deck ss-deck { flex: 1; min-height: 0; display: block; }
      .canvas--theme { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
      .canvas--theme ss-themes { flex: 1; min-height: 0; display: flex; flex-direction: column; }
      .deckhead__verify { font-size: 12px; font-weight: 600; }
      .deckhead__verify--ok { color: var(--mic-accent); }
      .deckhead__verify--fail { color: var(--mic-warn-ink, #5a4500); }
      .export { flex: 0 0 auto; margin-top: 12px; padding: 16px 18px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface-2); }
      .export__head { display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
      .export__h { margin: 0; font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-muted); }
      .export__pptx { font-size: 12px; font-weight: 600; }
      .export__pptx--ok { color: var(--mic-accent); }
      .export__pptx--fail { color: var(--mic-warn-ink, #5a4500); }
      .export__hint { margin: 0; color: var(--mic-faint); line-height: 1.5; }
      .export__list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .export__item { display: flex; align-items: center; gap: 12px; padding: 8px 10px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius-sm); background: var(--mic-surface); }
      .export__fmt { font-size: 12px; font-weight: 600; color: var(--mic-accent); min-width: 88px; }
      .export__name { font-size: 14px; color: var(--mic-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
      .export__size { font-size: 12px; color: var(--mic-faint); }
      .export__dl { text-decoration: none; padding: 4px 14px; }
      .wfhead { flex: 0 0 auto; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
      .wfhead__hint { font-size: 12px; color: var(--mic-faint); }
      .gate--wf, .gate--deck { flex: 0 0 auto; margin-top: 12px; }
      .canvas__h { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-muted); margin: 0 0 16px; }
      .canvas__hint { color: var(--mic-faint); margin-top: 20px; max-width: 52ch; line-height: 1.5; }
      .brief { display: flex; flex-direction: column; gap: 18px; margin: 0; max-width: 60ch; }
      .brief__field dt { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-muted); margin-bottom: 4px; }
      .brief__field dd { margin: 0; font-size: 16px; line-height: 1.5; color: var(--mic-ink); }
      .brief__empty { color: var(--mic-faint); font-style: italic; }
      .brief__arc { margin: 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: 4px; }
      .brief__msgs { margin: 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: 4px; }
      .gate { margin-top: 28px; padding: 18px 20px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface-2); max-width: 60ch; }
      .gate__prompt { margin: 0 0 14px; color: var(--mic-ink-2); line-height: 1.5; }
      .gate__actions { display: flex; gap: 10px; }
      .gate__done { margin: 0; color: var(--mic-accent); font-weight: 600; }
      .chatcol { border-left: 1px solid var(--mic-border); min-height: 0; background: var(--mic-surface); }
      @media (max-width: 880px) {
        .ws__body { grid-template-columns: 1fr; }
        .chatcol { border-left: none; border-top: 1px solid var(--mic-border); }
      }
    `,
  ],
})
export class WorkspaceComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ApiService);
  private readonly socket = inject(AgentSocketService);

  readonly steps = STEPS;

  readonly project = signal<ProjectRecord | null>(null);
  readonly seedTurns = signal<ChatTurn[]>([]);

  /** Live Brief (starts from persisted record, updated by `brief` events). */
  readonly brief = signal<Brief>({});
  /** Brief-panel intake: the agent-generated questionnaire to render as a form,
   *  or null when none is pending. Set from the persisted record on load and from
   *  live `questionnaire` socket frames. */
  readonly questionnaire = signal<Questionnaire | null>(null);
  /** True once the user has submitted their questionnaire answers — the Brief
   *  panel reverts to the recorded-discussion display. */
  readonly questionnaireAnswered = signal(false);
  /** True while the compiled answers are being sent + persisted (disables Send). */
  readonly intakeBusy = signal(false);
  readonly stage = signal<FlowStage>('brief');
  readonly gate1 = signal<GateStatus>('pending');
  /** Gate 2 (wireframe approval) status (Slice 4 / issue #11). */
  readonly gate2 = signal<GateStatus>('pending');
  /** Gate 3 (theme picked) status (Slice 5 / issue #12). */
  readonly gate3 = signal<GateStatus>('pending');
  readonly gateBusy = signal(false);
  /** The html-slides verify-gate result for the generated Deck (Slice 5, AC2).
   *  null until a generation run has finished its gate. */
  readonly verifyState = signal<{ passed: boolean; summary: string } | null>(null);
  /** The editable-PPTX conversion result (Slice 6, AC2). null until a PPTX build
   *  has finished (only set when the user chose a PPTX format). */
  readonly pptxState = signal<{ ok: boolean; summary: string } | null>(null);
  /** The produced, downloadable output(s) for the Export panel (Slice 7, M6). */
  readonly exports = signal<ExportItem[]>([]);
  /** Whether the agent has streamed at least one full turn (so Gate can show). */
  private readonly turnSettled = signal(false);
  /** Slice 12 (issue #15): true while a deck regenerate is being kicked off, so the
   *  Regenerate button can't double-fire. */
  readonly regenBusy = signal(false);

  /** The latest Artifact Manifest the daemon resolved (Slice 3). The canvas
   *  surface is selected from it: kind === 'wireframe' shows the iframe surface. */
  readonly artifact = signal<ArtifactManifest | null>(null);

  private readonly chat = viewChild(ChatComponent);
  private offSocket: (() => void) | null = null;

  /**
   * Surface selection (AC2): the Wireframe canvas is shown when the Artifact
   * Manifest's `kind === 'wireframe'`. Returns the manifest to render, or null
   * to fall back to the Brief panel.
   */
  readonly wireframe = computed<ArtifactManifest | null>(() => {
    const m = this.artifact();
    return m && m.kind === 'wireframe' ? m : null;
  });

  /**
   * Slice 5 (issue #12): the Deck canvas surface is shown when the Artifact
   * Manifest's `kind === 'deck'` — the final, themed, high-fi output. Returns the
   * manifest to render, or null to fall back to the picker / wireframe / brief.
   */
  readonly deck = computed<ArtifactManifest | null>(() => {
    const m = this.artifact();
    return m && m.kind === 'deck' ? m : null;
  });

  /**
   * Slice 12 (issue #15): how many pending feedback items are **deck** annotations.
   * Drives the "Regenerate deck" affordance. Reads the chat's durable feedback
   * signal (the single source of truth — it survives an interrupted run and is
   * rehydrated on load), filtered to annotations pinned on the Deck.
   */
  readonly deckAnnotations = computed<number>(() => {
    const items = this.chat()?.feedback() ?? [];
    return items.filter((i) => i.kind === 'annotation' && i.surface === 'deck').length;
  });

  /**
   * Slice 5 (issue #12): the Theme picker (Gate 3) is shown once the Wireframe is
   * approved (the flow reached the Theme stage) and no themed Deck has landed yet.
   * It stays available after a theme is picked so the user can regenerate.
   */
  readonly showThemePicker = computed(
    () => (this.stage() === 'theme' || this.stage() === 'deck') && !this.deck(),
  );

  /**
   * Brief-panel intake: the questionnaire form is shown only while one is pending
   * AND it has not been answered. Once answered (or never emitted), the Brief panel
   * falls through to the normal recorded-discussion display. Returns the form to
   * render, or null.
   */
  readonly intakeForm = computed<Questionnaire | null>(() => {
    if (this.questionnaireAnswered()) return null;
    return this.questionnaire();
  });

  /** Gate 1 is offered once a narrative arc has been proposed (or already approved). */
  readonly gateVisible = computed(
    () => this.gate1() === 'approved' || ((this.brief().narrativeArc?.length ?? 0) > 0 && this.turnSettled()),
  );

  isDone(step: FlowStage): boolean {
    const order = STEPS.map((s) => s.id);
    return order.indexOf(step) < order.indexOf(this.stage());
  }

  ngOnDestroy(): void {
    this.offSocket?.();
  }

  /** Route incoming app-control frames from the daemon: `artifact` selects the
   *  canvas surface; `pptx` (Slice 6) drives the conversion status; `exports`
   *  (Slice 7) drives the Export panel. */
  private onSocketEvent(e: SocketFrame): void {
    if (e.type === 'artifact') {
      this.artifact.set(e.manifest);
    } else if (e.type === 'questionnaire') {
      // Brief-panel intake: the agent emitted its first-turn questionnaire. Render
      // the interactive form (ignored once already answered — the daemon won't
      // re-push, but guard anyway).
      if (!this.questionnaireAnswered()) this.questionnaire.set(e.questionnaire);
    } else if (e.type === 'pptx') {
      this.pptxState.set({ ok: e.ok, summary: e.summary });
    } else if (e.type === 'exports') {
      this.exports.set(e.items);
    }
  }

  async ngOnInit(): Promise<void> {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    // Slice 11: resume into prior state. `load` returns the record AND the full
    // conversation transcript, so reopening a past Project restores the brief,
    // stage, Gate 1, and every prior chat turn — instead of re-running the brief.
    const loaded = await this.api.loadProject(id);
    if (!loaded) {
      this.project.set(null);
      return;
    }
    const { project, conversation } = loaded;
    this.project.set(project);
    this.brief.set(project.recordedBrief ?? {});
    // Brief-panel intake: a resumed Project re-renders the form only if it is still
    // pending AND unanswered; once answered the panel shows the recorded discussion.
    this.questionnaireAnswered.set(project.questionnaireAnswered ?? false);
    this.questionnaire.set(project.questionnaireAnswered ? null : project.questionnaire ?? null);
    this.stage.set(project.stage ?? 'brief');
    this.gate1.set(project.gate1 ?? 'pending');
    this.gate2.set(project.gate2 ?? 'pending');
    this.gate3.set(project.gate3 ?? 'pending');

    // Restore the transcript. A resumed Project has prior assistant turns, so the
    // chat seeds them verbatim and does NOT auto-re-run; a brand-new Project has
    // only the seeded opening user turn, which the chat auto-runs (Slice 1).
    const turns: ChatTurn[] = conversation.length
      ? conversation.map((c) => ({ role: c.role, text: c.text }))
      : [{ role: 'user', text: project.brief }];
    this.seedTurns.set(turns);

    // If the agent already replied at least once, the discussion is settled —
    // reveal Gate 1 immediately when an arc was captured (don't wait for a new turn).
    if (conversation.some((c) => c.role === 'assistant')) {
      this.turnSettled.set(true);
    }

    // Slice 3: listen for live `artifact` frames from the watcher, ask the daemon
    // to watch this Project, and pull the current manifest so a resumed Project
    // that already has a Wireframe shows it immediately (surface selection).
    this.offSocket = this.socket.listen((e) => this.onSocketEvent(e));
    this.socket.watch(project.id);
    const current = await this.api.getArtifact(project.id);
    if (current) this.artifact.set(current);
    // Slice 7 (M6): a resumed Project whose Deck was already generated re-surfaces
    // its downloadable output(s) in the Export panel.
    if (current?.kind === 'deck') {
      this.exports.set(await this.api.listExports(project.id));
    }
  }

  onBrief(brief: Brief): void {
    // Merge so a partial later emission never wipes earlier fields.
    this.brief.update((prev) => ({ ...prev, ...brief }));
  }

  /**
   * Brief-panel intake: the user submitted their questionnaire answers. The
   * sub-component compiled them into ONE readable message; send it through the
   * EXISTING chat send path (the chat owns the send logic — we only call its public
   * `sendMessage` via @ViewChild), then mark the questionnaire answered (persisted)
   * and hide the form. The Brief panel reverts to the recorded-discussion display
   * and the agent continues with conversational follow-ups.
   */
  async submitQuestionnaire(message: string): Promise<void> {
    const id = this.project()?.id;
    if (!id || this.intakeBusy()) return;
    this.intakeBusy.set(true);
    try {
      // Reuse the chat's send path — do NOT duplicate it.
      this.chat()?.sendMessage(message);
      // Persist that the intake is answered (a no-op if it was already), then hide
      // the form. Optimistically clear locally even if the persist call fails — the
      // answers have been sent, so re-showing the form would be wrong.
      const updated = await this.api.markQuestionnaireAnswered(id);
      if (updated) this.project.set(updated);
      this.questionnaireAnswered.set(true);
      this.questionnaire.set(null);
    } finally {
      this.intakeBusy.set(false);
    }
  }

  onTurnComplete(): void {
    this.turnSettled.set(true);
  }

  async approveArc(): Promise<void> {
    const id = this.project()?.id;
    if (!id || this.gateBusy()) return;
    this.gateBusy.set(true);
    try {
      const updated = await this.api.setGate1(id, 'approve');
      if (updated) {
        this.project.set(updated);
        this.stage.set(updated.stage);
        this.gate1.set(updated.gate1);
      }
    } finally {
      this.gateBusy.set(false);
    }
  }

  async requestChanges(): Promise<void> {
    const id = this.project()?.id;
    if (!id || this.gateBusy()) return;
    this.gateBusy.set(true);
    try {
      const updated = await this.api.setGate1(id, 'request-changes');
      if (updated) {
        this.project.set(updated);
        this.stage.set(updated.stage);
        this.gate1.set(updated.gate1);
      }
      // Loop the flow: re-open the brainstorm in chat for another pass.
      this.turnSettled.set(false);
      this.chat()?.sendMessage('I would like to revise the narrative arc before approving it. What would you change, and why?');
    } finally {
      this.gateBusy.set(false);
    }
  }

  /**
   * Slice 4 (issue #11): one annotation the user pinned on the wireframe (element
   * / text-range / whole-slide). Relay it into the chat's durable feedback queue
   * as a composer pill — it survives an interrupted run and rides the next send,
   * where the daemon serializes it into the scoped `<attached-preview-comments>`
   * block so the agent revises exactly that element (§10).
   */
  onAnnotate(annotation: Annotation): void {
    this.queueAnnotation(annotation, 'wireframe');
  }

  /**
   * Slice 12 (issue #15): one annotation the user pinned on the **Deck** (element /
   * text-range / whole-slide), using the same mechanism as the wireframe. Queue it
   * as a deck-surfaced composer pill; on **Regenerate deck** the daemon serializes
   * it into the scoped `<attached-preview-comments>` block (regenerate flavor) so
   * the agent rewrites exactly the affected slides (§10, §M8).
   */
  onDeckAnnotate(annotation: Annotation): void {
    this.queueAnnotation(annotation, 'deck');
  }

  /** Shared: relay a pinned annotation into the chat's durable feedback queue,
   *  tagged with the surface it was pinned on (wireframe revise vs deck regenerate). */
  private queueAnnotation(annotation: Annotation, surface: 'wireframe' | 'deck'): void {
    const a = annotation.anchor;
    const selector = a?.kind === 'element' ? a.selector : a?.kind === 'text-range' ? a.commonAncestorSelector : undefined;
    const anchorText = a ? a.text : undefined;
    void this.chat()?.queueFeedback({
      kind: 'annotation',
      text: annotation.comment,
      selector,
      anchorText,
      slideIndex: annotation.slideIndex,
      surface,
      anchor: a ?? null,
      screenshot: annotation.screenshot,
    });
  }

  /**
   * Slice 12 (issue #15): regenerate the Deck with the pinned deck annotations
   * applied. The chat fires a `generate` run; the daemon detects the pending deck
   * annotations and runs a scoped regenerate (rewrites only the affected slides,
   * re-runs the html-slides verify gate). Reset the verify/pptx/export state so the
   * UI reflects the fresh build.
   */
  regenerateDeck(): void {
    if (this.regenBusy() || !this.deckAnnotations()) return;
    this.regenBusy.set(true);
    this.verifyState.set(null);
    this.pptxState.set(null);
    this.exports.set([]);
    try {
      this.chat()?.regenerate();
    } finally {
      this.regenBusy.set(false);
    }
  }

  /** Gate 2: approve the wireframe (advances Wireframe → Theme). */
  async approveWireframe(): Promise<void> {
    const id = this.project()?.id;
    if (!id || this.gateBusy()) return;
    this.gateBusy.set(true);
    try {
      const updated = await this.api.setGate2(id, 'approve');
      if (updated) {
        this.project.set(updated);
        this.stage.set(updated.stage);
        this.gate2.set(updated.gate2);
      }
    } finally {
      this.gateBusy.set(false);
    }
  }

  /**
   * Gate 3 (Slice 5 / issue #12, AC1+AC2): the user picked a Theme. Persist the
   * selection (advances Theme → Deck), then kick off the themed Deck generation in
   * chat. The daemon runs the staged `html-slides` skill (which produces the Deck +
   * its manifest, surfaced by the watcher as a `kind: 'deck'` artifact) and runs
   * the verify gate; the Deck is presented as done only when it passes (§12). The
   * wireframe stays theme-less — the theme applies only here (AC3).
   */
  async onThemePicked(picked: { theme: string; formats: OutputFormat[] }): Promise<void> {
    const id = this.project()?.id;
    if (!id) return;
    this.verifyState.set(null);
    this.pptxState.set(null);
    this.exports.set([]);
    // Slice 6 (AC1): persist the theme AND the chosen output format(s) so the
    // daemon's generate run produces exactly the selected format(s).
    const updated = await this.api.setTheme(id, picked.theme, picked.formats);
    if (updated) {
      this.project.set(updated);
      this.stage.set(updated.stage);
      this.gate3.set(updated.gate3);
    }
    // Start generation: the agent builds + verifies the themed Deck (streams in chat).
    this.chat()?.generate(picked.theme);
  }

  /** Slice 5 (AC2): the html-slides verify-gate result for the generated Deck. The
   *  Deck status reflects pass/fail; only a pass presents the Deck as done. */
  onVerified(result: { passed: boolean; summary: string }): void {
    this.verifyState.set(result);
  }

  /** Build a download URL for one produced output (Brief-derived save name). */
  exportUrl(entry: string): string {
    const id = this.project()?.id;
    return id ? this.api.exportDownloadUrl(id, entry) : '#';
  }

  /** A human file size for the Export panel. */
  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }
}
