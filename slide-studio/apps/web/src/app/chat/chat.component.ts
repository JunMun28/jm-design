import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AttachControlComponent } from '../attach/attach-control.component';
import { AgentSocketService } from '../core/agent-socket.service';
import { ApiService } from '../core/api.service';
import type { Anchor, AnnotationSurface, Brief, ChatTurn, QueuedFeedback, StagedAttachment } from '../core/types';
import { reduceChat, toolLabel, type ChatError, type ChatInput, type ChatState } from './chat-reducer';
import { renderMarkdown, renderMarkdownWords } from './markdown';
import { StreamBuffer } from './stream-buffer';

/** Index of the last assistant bubble in the timeline, or -1. */
function lastAssistantIndex(turns: ChatTurn[]): number {
  for (let i = turns.length - 1; i >= 0; i--) if (turns[i].role === 'assistant') return i;
  return -1;
}

/**
 * Persistent chat (plan §M2 + Slice 13). Streams agent turns from the WebSocket
 * as an ORDERED timeline: a calm pre-token "thinking" state, smoothly-revealed
 * markdown bubbles (one per agent message), discrete status rows, and inline
 * tool-step chips — never an 80s typewriter caret, and never one merged wall of
 * text. Each complete agent message gets its OWN bubble; status / verify / PPTX
 * lines render as their own rows instead of being appended into the bubble.
 *
 * Streaming technique (replaces the per-token re-render + blinking block caret):
 *  - The text of the ACTIVE (last) assistant bubble is fed into a
 *    {@link StreamBuffer} that drains on requestAnimationFrame at a paced cadence
 *    (~5ms/char, speeding up as the backlog grows). Only the committed slice
 *    updates a signal — no per-token Angular change detection.
 *  - When a NEW agent message opens mid-turn, the previous bubble freezes into a
 *    plain settled render and the buffer resets for the new one.
 *  - prefers-reduced-motion: deltas flush instantly and the CSS drops every
 *    blur/shimmer/slide; text simply appears.
 *
 * Slice 13 (issue #7) robustness is unchanged: every terminal signal flows
 * through {@link reduceChat} so `streaming` always resets (Bug A), and a failed /
 * dropped run renders the friendly error CARD with a recovery button (AC1).
 */
@Component({
  selector: 'ss-chat',
  standalone: true,
  imports: [FormsModule, AttachControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat">
      <header class="chat__head">
        <span class="chat__title">Chat</span>
        <span class="chat__runtime">{{ runtimeId() || 'auto' }}</span>
        @if (streaming()) {
          <button class="mic-btn chat__cancel" (click)="cancel()">Stop</button>
        }
      </header>

      <div class="chat__log" #log>
        @for (turn of turns(); track $index) {
          @switch (turn.role) {
            @case ('user') {
              <div class="bubble bubble--user">
                <div class="bubble__text">{{ display(turn.text) }}</div>
              </div>
            }

            @case ('status') {
              <div
                class="srow"
                [class.srow--ok]="turn.tone === 'ok'"
                [class.srow--warn]="turn.tone === 'warn'"
                role="status"
              >
                <span class="srow__icon" aria-hidden="true">
                  @if (turn.tone === 'ok') {
                    <span class="srow__mark">✓</span>
                  } @else if (turn.tone === 'warn') {
                    <span class="srow__mark srow__mark--warn">⚠</span>
                  } @else {
                    <span class="srow__dot" [class.srow__dot--static]="reducedMotion()"></span>
                  }
                </span>
                <span class="srow__label">{{ turn.text }}</span>
              </div>
            }

            @case ('tool') {
              <div class="tool" [class.tool--done]="!turn.running" [class.tool--failed]="turn.failed">
                <span class="tool__icon" aria-hidden="true">
                  @if (turn.running) {
                    <span class="tool__spin" [class.tool__spin--static]="reducedMotion()"></span>
                  } @else if (turn.failed) {
                    <span class="tool__mark tool__mark--x">×</span>
                  } @else {
                    <span class="tool__mark">✓</span>
                  }
                </span>
                <span class="tool__label">{{ turn.text }}</span>
              </div>
            }

            @case ('assistant') {
              <div class="aturn">
                <!-- Reasoning disclosure: collapsible, dimmed "Thought for Ns". -->
                @if (turn.thinking) {
                  <details class="reason" [open]="thinkOpen($index)" (toggle)="onReasonToggle($index, $event)">
                    <summary class="reason__summary">{{ thoughtLabel($index, turn) }}</summary>
                    <div class="reason__body">{{ turn.thinking }}</div>
                  </details>
                }

                @if (isActive($index)) {
                  <!-- Live bubble: paced, word-revealed markdown. -->
                  <div class="bubble bubble--assistant">
                    @if (committedText()) {
                      <div class="bubble__text bubble__md" [class.bubble__md--anim]="!reducedMotion()" [innerHTML]="liveHtml()"></div>
                    } @else {
                      <!-- Pre-first-token: a calm breathing "thinking" row. -->
                      <div class="thinking" role="status" aria-live="polite">
                        <span class="thinking__dot" aria-hidden="true"></span>
                        <span class="thinking__label" [class.thinking__label--shimmer]="!reducedMotion()">{{ phaseLabel() }}</span>
                      </div>
                    }
                    @if (showCaret()) {
                      <span class="caret" aria-hidden="true"></span>
                    }
                  </div>
                } @else if (turn.text) {
                  <!-- Settled bubble: plain markdown, no per-word DOM/animation. -->
                  <div class="bubble bubble--assistant">
                    <div class="bubble__text bubble__md" [innerHTML]="settledHtml(turn.text)"></div>
                  </div>
                }
              </div>
            }
          }
        }
        @if (turns().length === 0) {
          <p class="chat__empty">Your conversation with the agent will appear here.</p>
        }

        <!-- AC1: friendly error card + recovery path (never a raw CLI error). -->
        @if (error(); as err) {
          <div class="errcard" role="alert">
            <p class="errcard__msg">{{ err.message }}</p>
            <div class="errcard__actions">
              <button class="mic-btn mic-btn--primary errcard__act" type="button" (click)="recover()">
                {{ recoverLabel() }}
              </button>
              <button class="mic-btn errcard__dismiss" type="button" (click)="dismissError()">Dismiss</button>
            </div>
          </div>
        }
      </div>

      <!-- AC2: queued feedback pills. They survive an interrupted run and ride the
           next turn. -->
      @if (feedback().length) {
        <div class="queue" aria-label="Queued feedback">
          <span class="queue__label">{{ feedback().length }} queued for the next message</span>
          <div class="queue__pills">
            @for (item of feedback(); track item.id) {
              <span class="pill" [class.pill--annotation]="item.kind === 'annotation'">
                {{ item.text }}
                <button class="pill__x" type="button" aria-label="Remove" (click)="removeFeedback(item)">×</button>
              </span>
            }
          </div>
        </div>
      }

      <!-- Slice 8 (issue #9): source files already staged for this Project — the
           agent reads them and cites REAL figures (AC1). Rehydrated on load. -->
      @if (staged().length) {
        <div class="staged" aria-label="Attached source files">
          <span class="staged__label">{{ staged().length }} source {{ staged().length === 1 ? 'file' : 'files' }} attached</span>
          <div class="staged__chips">
            @for (a of staged(); track a.relPath) {
              <span class="staged-chip" [attr.data-category]="a.category">
                <span class="staged-chip__name" [title]="a.filename">{{ a.filename }}</span>
              </span>
            }
          </div>
        </div>
      }

      <form class="composer" (submit)="$event.preventDefault(); send()">
        <ss-attach-control class="composer__attach" (filesChanged)="onAttachFiles()" />
        <input
          class="composer__input"
          [(ngModel)]="draft"
          name="draft"
          [disabled]="streaming()"
          placeholder="Message the agent…"
          autocomplete="off"
        />
        <button class="mic-btn mic-btn--primary" type="submit" [disabled]="streaming() || !draft().trim()">Send</button>
      </form>
    </div>
  `,
  styles: [
    `
      .chat { display: flex; flex-direction: column; height: 100%; min-height: 0; }
      .chat__head {
        display: flex; align-items: center; gap: 8px;
        padding: 12px 16px; border-bottom: 1px solid var(--mic-border);
      }
      .chat__title { font-weight: 600; }
      .chat__runtime {
        margin-left: auto; font-size: 12px; color: var(--mic-muted);
        background: var(--mic-surface-2); padding: 2px 8px; border-radius: 999px;
      }
      .chat__cancel { padding: 4px 10px; font-size: 13px; }
      .chat__log { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 10px; }
      .chat__empty { color: var(--mic-faint); text-align: center; margin-top: 24px; }

      /* An assistant message group: reasoning disclosure + its bubble. */
      .aturn { align-self: flex-start; max-width: 80%; display: flex; flex-direction: column; gap: 5px; }

      .bubble { padding: 10px 14px; border-radius: var(--mic-radius); word-break: break-word; }
      .bubble--user { align-self: flex-end; max-width: 80%; background: var(--mic-accent-soft); color: var(--mic-ink); white-space: pre-wrap; }
      .bubble--assistant { background: var(--mic-surface-2); border: 1px solid var(--mic-border); }
      .bubble__text { white-space: pre-wrap; }

      /* --- Discrete status row (verify gate, PPTX build, …) --- */
      .srow {
        align-self: flex-start; max-width: 82%;
        display: inline-flex; align-items: center; gap: 8px;
        font-size: 12.5px; color: var(--mic-muted); padding: 1px 2px;
      }
      .srow__icon { display: inline-flex; width: 14px; height: 14px; align-items: center; justify-content: center; flex: 0 0 auto; }
      .srow__dot { width: 7px; height: 7px; border-radius: 50%; background: var(--mic-accent); animation: breathe 1.4s ease-in-out infinite; }
      .srow__dot--static { animation: none; }
      .srow__mark { color: var(--mic-accent); font-size: 12px; line-height: 1; }
      .srow__mark--warn { color: var(--mic-warn-ink, #5a4500); }
      .srow__label { line-height: 1.4; }
      .srow--ok { color: var(--mic-ink-2); }
      .srow--warn { color: var(--mic-warn-ink, #5a4500); }

      /* --- Light markdown rendering --- */
      .bubble__md { white-space: normal; }
      .bubble__md :first-child { margin-top: 0; }
      .bubble__md :last-child { margin-bottom: 0; }
      .bubble__md ul, .bubble__md ol { margin: 6px 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: 3px; }
      .bubble__md li { line-height: 1.5; }
      .bubble__md strong { font-weight: 650; }
      .bubble__md code {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.86em;
        background: var(--mic-surface); border: 1px solid var(--mic-border); border-radius: 5px; padding: 1px 5px;
      }
      .bubble__md pre {
        margin: 8px 0; padding: 10px 12px; overflow-x: auto;
        background: var(--mic-surface); border: 1px solid var(--mic-border); border-radius: var(--mic-radius-sm);
      }
      .bubble__md pre code { background: none; border: none; padding: 0; font-size: 0.85em; }

      /* --- Per-word blur-in reveal (only on the live bubble, GPU-only props) --- */
      .bubble__md--anim .w {
        display: inline-block;
        animation: blurIn 210ms cubic-bezier(0.22, 1, 0.36, 1) both;
      }
      @keyframes blurIn {
        from { opacity: 0; filter: blur(6px); transform: translateY(2px); }
        to { opacity: 1; filter: blur(0); transform: none; }
      }

      /* --- Pre-first-token "thinking" row --- */
      .thinking { display: inline-flex; align-items: center; gap: 8px; color: var(--mic-muted); }
      .thinking__dot {
        width: 8px; height: 8px; border-radius: 50%; background: var(--mic-accent);
        animation: breathe 1.4s ease-in-out infinite;
      }
      @keyframes breathe { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
      .thinking__label { font-size: 14px; }
      .thinking__label--shimmer {
        background: linear-gradient(90deg, var(--mic-muted) 0%, var(--mic-ink) 50%, var(--mic-muted) 100%);
        background-size: 200% 100%;
        -webkit-background-clip: text; background-clip: text;
        -webkit-text-fill-color: transparent; color: transparent;
        animation: shimmer 1.8s linear infinite;
      }
      @keyframes shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }

      /* --- Thin, calm caret (replaces the blinking block "▍") --- */
      .caret {
        display: inline-block; width: 2px; height: 1.05em; margin-left: 1px;
        vertical-align: text-bottom; background: var(--mic-accent); opacity: 0.4;
        animation: caretPulse 1.2s ease-in-out infinite;
      }
      @keyframes caretPulse { 0%, 100% { opacity: 0.18; } 50% { opacity: 0.5; } }

      /* --- Reasoning disclosure --- */
      .reason { margin: 0; }
      .reason__summary {
        list-style: none; cursor: pointer; font-size: 12px; font-style: italic;
        color: var(--mic-muted); user-select: none; display: inline-flex; align-items: center; gap: 5px;
      }
      .reason__summary::-webkit-details-marker { display: none; }
      .reason__summary::before { content: '▸'; font-style: normal; transition: transform 140ms ease; }
      .reason[open] .reason__summary::before { transform: rotate(90deg); }
      .reason__body {
        margin-top: 6px; font-size: 12px; font-style: italic; color: var(--mic-faint);
        line-height: 1.5; white-space: pre-wrap; border-left: 2px solid var(--mic-border); padding-left: 10px;
      }

      /* --- Inline tool-step chips --- */
      .tool {
        display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; max-width: 100%;
        font-size: 12px; color: var(--mic-ink-2);
        padding: 3px 9px; border-radius: 999px;
        background: var(--mic-surface); border: 1px solid var(--mic-border);
      }
      .tool--done { color: var(--mic-muted); }
      .tool--failed { color: var(--mic-warn-ink, #5a4500); border-color: var(--mic-warn-border, #e0a800); }
      .tool__icon { display: inline-flex; width: 13px; height: 13px; align-items: center; justify-content: center; }
      .tool__spin {
        width: 11px; height: 11px; border-radius: 50%;
        border: 2px solid var(--mic-border-strong); border-top-color: var(--mic-accent);
        animation: spin 0.7s linear infinite;
      }
      .tool__spin--static { animation: none; border-top-color: var(--mic-accent); }
      @keyframes spin { to { transform: rotate(360deg); } }
      .tool__mark { color: var(--mic-accent); font-size: 12px; line-height: 1; }
      .tool__mark--x { color: var(--mic-warn-ink, #5a4500); font-size: 14px; }
      .tool__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

      .errcard {
        align-self: stretch; padding: 14px 16px; border-radius: var(--mic-radius);
        border: 1px solid var(--mic-warn-border, #e0a800); background: var(--mic-warn-bg, #fff8e6);
        color: var(--mic-warn-ink, #5a4500);
      }
      .errcard__msg { margin: 0 0 12px; line-height: 1.5; }
      .errcard__actions { display: flex; gap: 8px; }
      .errcard__act { padding: 6px 14px; font-size: 13px; }
      .errcard__dismiss { padding: 6px 12px; font-size: 13px; }

      .queue { padding: 10px 16px; border-top: 1px solid var(--mic-border); background: var(--mic-surface-2); }
      .queue__label { font-size: 12px; color: var(--mic-muted); }
      .queue__pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .pill {
        display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
        padding: 4px 6px 4px 10px; border-radius: 999px; font-size: 12px;
        background: var(--mic-surface); border: 1px solid var(--mic-border-strong); color: var(--mic-ink);
      }
      .pill--annotation { border-color: var(--mic-accent); }
      .pill__x { border: none; background: none; cursor: pointer; color: var(--mic-muted); font-size: 15px; line-height: 1; padding: 0 2px; }
      .pill__x:hover { color: var(--mic-ink); }

      .staged { padding: 10px 16px; border-top: 1px solid var(--mic-border); background: var(--mic-surface-2); }
      .staged__label { font-size: 12px; color: var(--mic-muted); }
      .staged__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
      .staged-chip {
        display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
        padding: 4px 10px; border-radius: 999px; font-size: 12px;
        background: var(--mic-surface); border: 1px solid var(--mic-accent); color: var(--mic-ink);
      }
      .staged-chip__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }

      .composer { display: flex; align-items: flex-start; gap: 8px; padding: 12px 16px; border-top: 1px solid var(--mic-border); }
      .composer__attach { flex: 0 0 auto; }
      .composer__input {
        flex: 1; font: inherit; padding: 10px 14px; border-radius: var(--mic-radius-sm);
        border: 1px solid var(--mic-border-strong); background: var(--mic-surface); color: var(--mic-ink);
      }
      .composer__input:focus-visible { outline: 3px solid var(--mic-accent-soft); border-color: var(--mic-accent); }

      /* prefers-reduced-motion: text appears, status is static, no blur/shimmer/spin. */
      @media (prefers-reduced-motion: reduce) {
        .bubble__md--anim .w { animation: none; }
        .thinking__dot, .caret, .tool__spin, .thinking__label--shimmer, .srow__dot { animation: none; }
        .caret { opacity: 0.4; }
        .thinking__label--shimmer {
          -webkit-text-fill-color: var(--mic-muted); color: var(--mic-muted);
          background: none;
        }
      }
    `,
  ],
})
export class ChatComponent {
  readonly projectId = input.required<string>();
  readonly runtimeId = input<string | null>(null);
  readonly seedTurns = input<ChatTurn[]>([]);

  /** Live Brief parsed from the agent's structured output (drives the panel). */
  readonly briefChanged = output<Brief>();
  /** Fires when a run completes, so the workspace can reveal Gate 1. */
  readonly turnComplete = output<void>();
  /** Slice 5 (issue #12, AC2): the html-slides verify gate result for a generated
   *  Deck. The workspace presents the Deck as done only when `passed` is true. */
  readonly verified = output<{ passed: boolean; summary: string }>();

  private readonly socket = inject(AgentSocketService);
  private readonly api = inject(ApiService);

  private readonly attach = viewChild(AttachControlComponent);
  private readonly logEl = viewChild<{ nativeElement: HTMLElement }>('log');

  readonly turns = signal<ChatTurn[]>([]);
  readonly draft = signal('');
  readonly streaming = signal(false);

  /** The friendly error currently shown (AC1). null = no error. */
  readonly error = signal<ChatError | null>(null);
  /** The pending feedback queue (AC2) — survives an interrupted run. */
  readonly feedback = signal<QueuedFeedback[]>([]);
  /** Slice 8 (issue #9): the source files already staged for this Project. */
  readonly staged = signal<StagedAttachment[]>([]);

  // --- Streaming / active-turn presentation state (resets each run) -----------

  /** Paces the active bubble's text reveal; reset (not re-created) per bubble so
   *  the committed/draining signal references the template binds to stay stable. */
  private readonly buffer = new StreamBuffer();
  /** The committed (revealed) text of the active bubble. */
  readonly committedText = this.buffer.committed;
  /** True while the active bubble's reveal is still catching up to the stream. */
  private readonly draining = this.buffer.draining;
  /** prefers-reduced-motion (CSS handles visuals; we also skip text pacing). */
  readonly reducedMotion = signal(
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  /** The current run phase label for the pre-token thinking row. */
  readonly phaseLabel = signal('Thinking…');
  /** How much of the active bubble's text has already been pushed to the buffer
   *  (so we only ever push the newly-appended suffix). */
  private bufferedLen = 0;
  /** Index of the active (currently-streaming) assistant bubble, or -1. */
  private activeIndex = -1;

  /** Reasoning timing: when the active turn started thinking + its measured ms,
   *  recorded per settled turn index so the "Thought for Ns" label is stable. */
  private thinkingStart = 0;
  private readonly thinkingMs = signal<Record<number, number>>({});
  /** Whether the user has manually re-opened a reasoning disclosure (per index).
   *  Unset = follow the default (collapsed; auto-collapses when the answer begins). */
  private readonly reasonOpen = signal<Record<number, boolean>>({});

  readonly canSend = computed(() => !this.streaming() && this.draft().trim().length > 0);

  /** Rendered HTML for the LIVE bubble (word-wrapped while animating). */
  readonly liveHtml = computed(() => {
    const text = this.display(this.committedText());
    return this.reducedMotion() ? renderMarkdown(text) : renderMarkdownWords(text);
  });

  /** Show the thin caret while the run is live and still streaming/draining. */
  readonly showCaret = computed(() => this.streaming() && !!this.committedText() && this.draining());

  /** Button label per recovery action. */
  readonly recoverLabel = computed(() => {
    switch (this.error()?.recovery) {
      case 'signin':
        return 'Sign in & retry';
      case 'reconnect':
        return 'Reconnect & retry';
      case 'install':
        return 'Try again';
      default:
        return 'Retry';
    }
  });

  /** The last user message — so Retry can re-send the same turn. */
  private lastUserText: string | null = null;
  private seeded = false;

  constructor() {
    this.socket.connect((e) => this.onEvent(e));
    // Track reduced-motion changes live (a user can toggle the OS setting).
    if (typeof matchMedia === 'function') {
      const mq = matchMedia('(prefers-reduced-motion: reduce)');
      mq.addEventListener?.('change', (e) => this.reducedMotion.set(e.matches));
    }
    // Auto-scroll the log to the newest content as it streams in.
    effect(() => {
      this.committedText();
      this.turns();
      const el = this.logEl()?.nativeElement;
      if (el) queueMicrotask(() => (el.scrollTop = el.scrollHeight));
    });
  }

  /** Is `index` the active (currently-streaming) assistant bubble? */
  isActive(index: number): boolean {
    return index === this.activeIndex && this.streaming();
  }

  /** Whether a reasoning disclosure should render open. */
  thinkOpen(index: number): boolean {
    const override = this.reasonOpen()[index];
    if (override !== undefined) return override;
    // Default: open ONLY while it's the active turn and no answer text exists yet;
    // it auto-collapses once the answer begins (committed text appears).
    return this.isActive(index) && !this.committedText();
  }

  onReasonToggle(index: number, ev: Event): void {
    const open = (ev.target as HTMLDetailsElement).open;
    // Only record a deliberate user toggle (ignore programmatic auto-collapse echoes).
    this.reasonOpen.update((m) => ({ ...m, [index]: open }));
  }

  /** "Thought for Ns" (or a live "Reasoning…" while still reasoning). */
  thoughtLabel(index: number, _turn: ChatTurn): string {
    const ms = this.thinkingMs()[index];
    if (ms !== undefined) {
      const s = Math.max(1, Math.round(ms / 1000));
      return `Thought for ${s}s`;
    }
    return 'Reasoning…';
  }

  /** Render a SETTLED assistant bubble as plain markdown (no animation spans). */
  settledHtml(text: string): string {
    return renderMarkdown(this.display(text));
  }

  /** Seed from the project's first turn + kick off the opening run once. */
  ngOnInit(): void {
    if (this.seeded) return;
    this.seeded = true;
    void this.api.listFeedback(this.projectId()).then((items) => this.feedback.set(items));
    void this.api.listAttachments(this.projectId()).then((items) => this.staged.set(items));

    const seed = this.seedTurns();
    if (seed.length) {
      this.turns.set([...seed]);
      const lastUser = [...seed].reverse().find((t) => t.role === 'user');
      if (lastUser && !seed.some((t) => t.role === 'assistant')) {
        this.startRun(lastUser.text);
      }
    }
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.streaming()) return;
    this.draft.set('');
    this.dismissError();
    this.turns.update((t) => [...t, { role: 'user', text }]);
    this.startRun(text);
  }

  /** Send a message into the run programmatically (e.g. Gate 1 "Request changes"). */
  sendMessage(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || this.streaming()) return;
    this.dismissError();
    this.turns.update((t) => [...t, { role: 'user', text: trimmed }]);
    this.startRun(trimmed);
  }

  generate(theme: string): void {
    if (this.streaming()) return;
    this.dismissError();
    this.turns.update((t) => [
      ...t,
      { role: 'user', text: `Generate the deck in the ${theme} theme.` },
      { role: 'assistant', text: '', pending: true },
    ]);
    this.beginActiveTurn();
    this.streaming.set(true);
    this.socket.generate(this.projectId(), this.runtimeId());
  }

  regenerate(): void {
    if (this.streaming()) return;
    this.dismissError();
    this.turns.update((t) => [
      ...t,
      { role: 'user', text: 'Apply my deck annotations and regenerate the affected slides.' },
      { role: 'assistant', text: '', pending: true },
    ]);
    this.beginActiveTurn();
    this.streaming.set(true);
    this.socket.generate(this.projectId(), this.runtimeId());
  }

  cancel(): void {
    this.socket.cancel();
    this.apply({ type: 'run-cancelled' });
  }

  async onAttachFiles(): Promise<void> {
    const attach = this.attach();
    const files = attach?.currentFiles() ?? [];
    if (!files.length || !attach) return;
    attach.disabled.set(true);
    try {
      const result = await this.api.uploadAttachments(this.projectId(), files);
      attach.clear();
      attach.showNotes(result.skipped);
      if (result.staged.length) {
        this.staged.set(await this.api.listAttachments(this.projectId()));
      }
    } finally {
      attach.disabled.set(false);
    }
  }

  async queueFeedback(item: {
    kind: 'comment' | 'annotation';
    text: string;
    selector?: string;
    anchorText?: string;
    slideIndex?: number;
    surface?: AnnotationSurface;
    anchor?: Anchor | null;
    screenshot?: string;
  }): Promise<void> {
    const pending = await this.api.queueFeedback(this.projectId(), item);
    this.feedback.set(pending);
  }

  /** Remove ONE queued pill (not the whole queue) — its × button. */
  async removeFeedback(item: QueuedFeedback): Promise<void> {
    const pending = await this.api.removeFeedbackItem(this.projectId(), item.id);
    this.feedback.set(pending);
  }

  dismissError(): void {
    this.error.set(null);
  }

  recover(): void {
    const err = this.error();
    if (!err) return;
    if (err.recovery === 'reconnect') this.socket.reconnect();
    this.dismissError();
    void this.api.listFeedback(this.projectId()).then((items) => this.feedback.set(items));
    if (this.lastUserText && !this.streaming()) {
      this.startRun(this.lastUserText);
    }
  }

  /** Hide the structured ```brief … ``` block from chat — it renders in the
   *  Brief panel, not the conversation. Pure display transform. */
  display(text: string): string {
    return text.replace(/```brief[\s\S]*?```/gi, '').replace(/\n{3,}/g, '\n\n').trim();
  }

  private startRun(text: string): void {
    this.lastUserText = text;
    this.streaming.set(true);
    this.turns.update((t) => [...t, { role: 'assistant', text: '', pending: true }]);
    this.beginActiveTurn();
    this.socket.send(this.projectId(), text, this.runtimeId());
  }

  /** Reset the per-bubble streaming state for a freshly-pushed assistant bubble. */
  private beginActiveTurn(): void {
    this.buffer.reset();
    this.bufferedLen = 0;
    this.activeIndex = lastAssistantIndex(this.turns());
    this.phaseLabel.set('Thinking…');
    this.thinkingStart = 0;
  }

  /**
   * Apply ONE lifecycle input through the pure {@link reduceChat} reducer, mirror
   * the next state into signals, and run side-effects. Centralizing the
   * run-lifecycle here keeps the `streaming` reset robust (Bug A): every terminal
   * signal flows through the one reducer that always returns to idle.
   */
  private apply(input: ChatInput): void {
    // Pre-reducer presentation hooks (do NOT touch reducer state): name the phase,
    // time the reasoning. These never alter run-lifecycle logic.
    this.observe(input);

    const before = this.turns();
    const state: ChatState = { turns: before, streaming: this.streaming(), error: this.error() };
    const { next, effects } = reduceChat(state, input);

    if (next.turns !== state.turns) this.turns.set(next.turns);
    if (next.streaming !== state.streaming) this.streaming.set(next.streaming);
    if (next.error !== state.error) this.error.set(next.error);

    // Follow the active bubble: when a NEW agent message opens mid-turn, the
    // previous one freezes into its settled render and the buffer resets.
    this.syncActiveBubble(next.turns, next.streaming);

    // Tee any growth of the active bubble's text into the paced stream buffer so
    // BOTH raw deltas and a whole codex message reveal smoothly. Reduced-motion
    // flushes instantly (no pacing).
    this.feedBuffer(next.turns);

    // On a terminal transition (streaming true → false), settle the active turn:
    // flush the remaining buffer, record the thinking duration, drop active state.
    if (state.streaming && !next.streaming) this.settleActiveTurn();

    if (effects.brief) this.briefChanged.emit(effects.brief.brief);
    if (effects.verify) this.verified.emit(effects.verify);
    if (effects.turnComplete) {
      this.turnComplete.emit();
      void this.api.listFeedback(this.projectId()).then((items) => this.feedback.set(items));
    }
  }

  /** Presentation-only observation of a frame (phase label, reasoning timing). */
  private observe(input: ChatInput): void {
    switch (input.type) {
      case 'thinking_delta':
        if (this.thinkingStart === 0) this.thinkingStart = Date.now();
        break;
      case 'status':
        // Name the live phase from a non-terminal status (skip terminal labels).
        if (!['done', 'cancelled'].includes(input.label)) {
          this.phaseLabel.set(this.statusPhase(input.label));
        }
        break;
    }
  }

  /** Map a raw status label to a friendly phase line for the thinking row. */
  private statusPhase(label: string): string {
    switch (label) {
      case 'initializing':
        return 'Starting up…';
      case 'running':
        return 'Thinking…';
      case 'verifying':
        return 'Running the verify gate…';
      case 'building-pptx':
        return 'Building the PowerPoint…';
      default:
        return toolLabel(label) + '…';
    }
  }

  /**
   * Follow the active (last) assistant bubble. When a fresh agent message opens a
   * new bubble mid-turn, the previous one is already stored in `turns` and now
   * renders settled; we reset the paced buffer for the new bubble.
   */
  private syncActiveBubble(turns: ChatTurn[], streaming: boolean): void {
    if (!streaming) return;
    const last = lastAssistantIndex(turns);
    if (last !== this.activeIndex) {
      this.buffer.reset();
      this.bufferedLen = 0;
      this.activeIndex = last;
    }
  }

  /** Push the newly-appended suffix of the active bubble's text into the buffer. */
  private feedBuffer(turns: ChatTurn[]): void {
    if (this.activeIndex < 0) return;
    const turn = turns[this.activeIndex];
    if (!turn || turn.role !== 'assistant') return;
    const full = turn.text;
    if (full.length <= this.bufferedLen) return;
    const suffix = full.slice(this.bufferedLen);
    this.bufferedLen = full.length;
    if (this.reducedMotion()) {
      this.buffer.push(suffix);
      this.buffer.flushAll();
    } else {
      this.buffer.push(suffix);
    }
  }

  /** Terminal: flush the reveal, freeze the bubble into a plain settled render,
   *  record the reasoning duration, and clear active-turn presentation state. */
  private settleActiveTurn(): void {
    this.buffer.flushAll();
    const idx = this.activeIndex;
    if (idx >= 0) {
      const turn = this.turns()[idx];
      if (turn?.thinking && this.thinkingStart > 0) {
        const ms = Date.now() - this.thinkingStart;
        this.thinkingMs.update((m) => ({ ...m, [idx]: ms }));
      }
    }
    this.activeIndex = -1;
    this.phaseLabel.set('Thinking…');
  }

  private onEvent(e: ChatInput): void {
    this.apply(e);
  }
}
