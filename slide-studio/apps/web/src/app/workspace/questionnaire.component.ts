import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import type { Questionnaire, QuestionnaireQuestion } from '../core/types';

/** The "Other…" sentinel chip value (never a real option label). */
const OTHER = '__other__';
/** The "Decide for me" sentinel — the user is unsure, so the agent should pick. */
const DECIDE = '__decide__';

/**
 * Intake questionnaire (Brief-panel intake). On the FIRST brainstorm turn the
 * agent emits a contextual set of COMMON framing questions; the daemon parses
 * them and the workspace renders THIS interactive form inside the Brief panel.
 *
 * Each question is a label + option chips: a single-select renders radio-style
 * pill chips (pick one); a multi-select renders checkbox-style chips (pick any).
 * When `allowOther` is set, an "Other…" chip reveals a small text input. A footer
 * shows "N of M answered" + a primary "Send answers to agent →" button, enabled
 * once every required (single-select) question is answered.
 *
 * On submit the component compiles the selections into ONE readable user message
 * (e.g. "Here are my answers — Audience: Ops leadership. Goal: …") and emits it;
 * the workspace sends it through the existing chat send path, marks the
 * questionnaire answered, and reverts the Brief panel to the recorded-discussion
 * display. The agent then continues with sharper, conversational follow-ups — NOT
 * another questionnaire.
 */
@Component({
  selector: 'ss-questionnaire',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="q" role="group" aria-label="Intake questionnaire">
      <p class="q__intro">{{ questionnaire().intro }}</p>

      @for (question of questionnaire().questions; track question.id) {
        <fieldset class="q__field">
          <legend class="q__label">
            {{ question.label }}
            @if (question.type === 'multi') {
              <span class="q__multi">choose any</span>
            }
          </legend>

          <div class="q__chips">
            @for (option of question.options; track option) {
              <button
                type="button"
                class="q__chip"
                [class.q__chip--on]="isSelected(question, option)"
                [attr.aria-pressed]="isSelected(question, option)"
                (click)="toggle(question, option)"
              >
                {{ option }}
              </button>
            }

            <button
              type="button"
              class="q__chip q__chip--decide"
              [class.q__chip--on]="isDecideOn(question)"
              [attr.aria-pressed]="isDecideOn(question)"
              (click)="toggleDecide(question)"
            >
              Decide for me
            </button>

            @if (question.allowOther) {
              <button
                type="button"
                class="q__chip q__chip--other"
                [class.q__chip--on]="isOtherOn(question)"
                [attr.aria-pressed]="isOtherOn(question)"
                (click)="toggleOther(question)"
              >
                Other…
              </button>
            }
          </div>

          @if (isOtherOn(question)) {
            <input
              class="q__other-input"
              type="text"
              [attr.aria-label]="'Other answer for: ' + question.label"
              placeholder="Type your answer…"
              [value]="otherText(question.id)"
              (input)="setOther(question.id, $event)"
            />
          }
        </fieldset>
      }

      <div class="q__footer">
        <span class="q__count">{{ answeredCount() }} of {{ requiredCount() }} answered</span>
        <button
          type="button"
          class="mic-btn mic-btn--primary q__send"
          [disabled]="!canSend() || busy()"
          (click)="submit()"
        >
          Send answers to agent →
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .q { display: flex; flex-direction: column; gap: 22px; max-width: 60ch; }
      .q__intro { margin: 0; font-size: 16px; line-height: 1.5; color: var(--mic-ink); }
      .q__field { border: 0; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
      .q__label { padding: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-muted); display: flex; align-items: baseline; gap: 8px; }
      .q__multi { text-transform: none; letter-spacing: 0; font-size: 11px; color: var(--mic-faint); font-weight: 400; }
      .q__chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .q__chip {
        font: inherit; font-size: 14px; padding: 7px 14px; border-radius: 999px;
        border: 1px solid var(--mic-border); background: var(--mic-surface);
        color: var(--mic-ink-2); cursor: pointer; transition: border-color 0.12s, background 0.12s, color 0.12s;
      }
      .q__chip:hover { border-color: var(--mic-accent); color: var(--mic-accent); }
      .q__chip--on { background: var(--mic-surface); border-color: var(--mic-accent); color: var(--mic-accent); box-shadow: inset 0 0 0 1px var(--mic-accent); font-weight: 500; }
      .q__chip--on:hover { color: var(--mic-accent); border-color: var(--mic-accent); }
      .q__chip--other { font-style: italic; }
      .q__chip--decide:not(.q__chip--on) { font-style: italic; color: var(--mic-muted); }
      .q__chip:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: 1px; }
      .q__other-input {
        font: inherit; font-size: 14px; padding: 9px 12px; border-radius: var(--mic-radius-sm);
        border: 1px solid var(--mic-border-strong); background: var(--mic-surface); color: var(--mic-ink); max-width: 40ch;
      }
      .q__other-input:focus-visible { outline: 3px solid var(--mic-accent-soft); border-color: var(--mic-accent); }
      .q__footer {
        display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;
        margin-top: 6px; padding-top: 18px; border-top: 1px solid var(--mic-border);
      }
      .q__count { font-size: 13px; color: var(--mic-muted); }
      .q__send { white-space: nowrap; }
      @media (prefers-reduced-motion: reduce) {
        .q__chip { transition: none; }
      }
    `,
  ],
})
export class QuestionnaireComponent {
  /** The agent-generated questionnaire the daemon parsed (the form to render). */
  readonly questionnaire = input.required<Questionnaire>();
  /** True while the parent is sending the compiled answers (disables the button). */
  readonly busy = input(false);

  /** Fires with the compiled, readable answer message for the existing chat path. */
  readonly send = output<string>();

  /** Per-question selections. Single-select holds one value; multi holds many.
   *  The "Other…" sentinel ({@link OTHER}) is stored like any other selection. */
  private readonly selections = signal<Record<string, Set<string>>>({});
  /** The free text typed into each question's "Other…" input, keyed by question id. */
  private readonly others = signal<Record<string, string>>({});

  /** Required questions = the single-selects (multi-selects + "must include" are
   *  optional, so the user can submit without ticking every box). */
  readonly requiredCount = computed(
    () => this.questionnaire().questions.filter((q) => q.type === 'single').length,
  );

  /** How many required (single-select) questions have a real answer. */
  readonly answeredCount = computed(() => {
    const sel = this.selections();
    const others = this.others();
    return this.questionnaire().questions.filter((q) => q.type === 'single' && this.hasAnswer(q, sel, others)).length;
  });

  /** The Send button is enabled once every required question is answered. */
  readonly canSend = computed(() => this.answeredCount() === this.requiredCount() && this.requiredCount() >= 0);

  isSelected(question: QuestionnaireQuestion, option: string): boolean {
    return this.selections()[question.id]?.has(option) ?? false;
  }

  isOtherOn(question: QuestionnaireQuestion): boolean {
    return this.selections()[question.id]?.has(OTHER) ?? false;
  }

  isDecideOn(question: QuestionnaireQuestion): boolean {
    return this.selections()[question.id]?.has(DECIDE) ?? false;
  }

  otherText(questionId: string): string {
    return this.others()[questionId] ?? '';
  }

  /** Toggle one option. Single-select replaces the set (and clears "Other…");
   *  multi-select adds/removes the value. */
  toggle(question: QuestionnaireQuestion, option: string): void {
    this.selections.update((prev) => {
      const next = { ...prev };
      const current = new Set(next[question.id] ?? []);
      if (question.type === 'single') {
        const wasOn = current.has(option);
        next[question.id] = wasOn ? new Set() : new Set([option]);
      } else {
        current.delete(DECIDE);
        if (current.has(option)) current.delete(option);
        else current.add(option);
        next[question.id] = current;
      }
      return next;
    });
  }

  /** Toggle the "Other…" chip. For a single-select, picking "Other…" clears the
   *  other option chips (it is one mutually-exclusive choice). */
  toggleOther(question: QuestionnaireQuestion): void {
    this.selections.update((prev) => {
      const next = { ...prev };
      const current = new Set(next[question.id] ?? []);
      const wasOn = current.has(OTHER);
      if (question.type === 'single') {
        next[question.id] = wasOn ? new Set() : new Set([OTHER]);
      } else {
        current.delete(DECIDE);
        if (wasOn) current.delete(OTHER);
        else current.add(OTHER);
        next[question.id] = current;
      }
      return next;
    });
  }

  /** Toggle the "Decide for me" chip — the user is unsure, so the agent will pick.
   *  Mutually exclusive with the options + "Other…" (selecting it clears them, and
   *  picking any option/Other clears it). */
  toggleDecide(question: QuestionnaireQuestion): void {
    this.selections.update((prev) => {
      const next = { ...prev };
      const wasOn = next[question.id]?.has(DECIDE) ?? false;
      next[question.id] = wasOn ? new Set() : new Set([DECIDE]);
      return next;
    });
  }

  setOther(questionId: string, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.others.update((prev) => ({ ...prev, [questionId]: value }));
  }

  /** True when a question has a usable answer (a picked option, or "Other…" with
   *  non-empty text). Used for the required-count + the compiled message. */
  private hasAnswer(
    question: QuestionnaireQuestion,
    sel: Record<string, Set<string>> = this.selections(),
    others: Record<string, string> = this.others(),
  ): boolean {
    const set = sel[question.id];
    if (!set || set.size === 0) return false;
    // "Decide for me" always counts as answered (the agent will pick).
    if (set.has(DECIDE)) return true;
    // "Other…" only counts when its text input is non-empty.
    const picked = [...set].filter((v) => v !== OTHER);
    if (picked.length > 0) return true;
    return set.has(OTHER) && (others[question.id]?.trim().length ?? 0) > 0;
  }

  /** The human-readable answer text for one question (joins multi picks; appends
   *  the "Other…" free text). Empty string when unanswered. */
  private answerFor(question: QuestionnaireQuestion): string {
    const set = this.selections()[question.id];
    if (!set || set.size === 0) return '';
    if (set.has(DECIDE)) return '(you decide)';
    const parts = [...set].filter((v) => v !== OTHER);
    if (set.has(OTHER)) {
      const txt = this.others()[question.id]?.trim();
      if (txt) parts.push(txt);
    }
    return parts.join(', ');
  }

  /**
   * Compile the selections into ONE readable user message and emit it, e.g.
   * "Here are my answers — Audience: Ops leadership. Goal: Align on actions &
   * owners. Length: ~5 slides. Tone: Confident. Must include: Key metrics, Next
   * steps." Only answered questions are included.
   */
  submit(): void {
    if (!this.canSend() || this.busy()) return;
    const parts: string[] = [];
    for (const q of this.questionnaire().questions) {
      const answer = this.answerFor(q);
      if (answer) parts.push(`${q.label.replace(/[?:]\s*$/, '')}: ${answer}`);
    }
    const anyDecide = this.questionnaire().questions.some((q) => this.selections()[q.id]?.has(DECIDE));
    const note = anyDecide
      ? ' For anything I marked "(you decide)", choose the best fit for this deck and keep going — don\'t ask me about it again.'
      : '';
    const message = `Here are my answers — ${parts.join('. ')}.${note}`;
    this.send.emit(message);
  }
}
