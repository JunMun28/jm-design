import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AttachControlComponent } from '../attach/attach-control.component';
import { ApiService } from '../core/api.service';
import { DeckThumbnailComponent } from '../files/deck-thumbnail.component';
import type { DetectedAgent, FlowStage, ProjectRecord } from '../core/types';

/**
 * Home / Start screen (plan §7, §M2). A clean centered prompt, a runtime
 * selector when >1 is detected, starter chips, and a recent-projects list.
 * Submitting CREATES a Project and routes to the workspace with the request as
 * the first turn.
 */
@Component({
  selector: 'ss-home',
  standalone: true,
  imports: [FormsModule, DatePipe, AttachControlComponent, DeckThumbnailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <div class="home__center">
        <div class="wordmark">Slide&nbsp;Studio</div>
        <h1 class="headline">What deck do you want to build?</h1>

        <form class="start" (submit)="$event.preventDefault(); start()">
          <textarea
            class="start__input"
            [(ngModel)]="brief"
            name="brief"
            rows="3"
            placeholder="Describe the deck you want…"
            autocomplete="off"
          ></textarea>
          <div class="start__row">
            <ss-attach-control #attach class="start__attach" (filesChanged)="onAttachChanged()" />
            @if (availableAgents().length > 1) {
              <select class="start__runtime" [(ngModel)]="runtimeId" name="runtime" aria-label="Agent runtime">
                @for (a of availableAgents(); track a.id) {
                  <option [value]="a.id">{{ a.name }}</option>
                }
              </select>
            }
            <button class="mic-btn mic-btn--primary start__go" type="submit" [disabled]="!brief().trim() || busy()">
              {{ busy() ? 'Creating…' : 'Start' }}
            </button>
          </div>

          <!-- AC2: when the daemon skipped a file (unsupported / too large), the
               attach control shows the friendly note and we hold here with a
               Continue affordance — the staged files still ride into the workspace,
               nothing is blocked. -->
          @if (pendingProjectId(); as pid) {
            <button class="mic-btn mic-btn--primary start__continue" type="button" (click)="continueToWorkspace(pid)">
              Continue to workspace →
            </button>
          }
        </form>

        <div class="chips">
          @for (chip of starters; track chip) {
            <button class="chip" type="button" (click)="brief.set(chip)">{{ chip }}</button>
          }
        </div>

        @if (recents().length) {
          <section class="library">
            <div class="library__head">
              <h2 class="library__title">Your decks <span class="library__count">· {{ recents().length }}</span></h2>
              <div class="seg" role="group" aria-label="Library layout">
                <button class="seg__btn" type="button" [class.seg__btn--on]="view() === 'cards'" [attr.aria-pressed]="view() === 'cards'" (click)="setView('cards')">Cards</button>
                <button class="seg__btn" type="button" [class.seg__btn--on]="view() === 'list'" [attr.aria-pressed]="view() === 'list'" (click)="setView('list')">List</button>
              </div>
            </div>

            @if (view() === 'cards') {
              <ul class="cards">
                @for (p of recents(); track p.id) {
                  <li>
                    <button class="card" type="button" (click)="openFiles(p)">
                      <ss-deck-thumbnail class="card__thumb" [projectId]="p.id" [entry]="deckEntry(p)" [placeholder]="stageLabel(p.stage)" />
                      <span class="card__foot">
                        <span class="card__name">{{ p.title }}</span>
                        <span class="card__row">
                          <span class="badge" [class.badge--soft]="p.stage !== 'deck'">{{ stageLabel(p.stage) }}</span>
                          <span class="card__date">{{ p.updatedAt | date: 'mediumDate' }}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                }
              </ul>
            } @else {
              <ul class="rows">
                @for (p of recents(); track p.id) {
                  <li>
                    <button class="row" type="button" (click)="openFiles(p)">
                      <span class="row__name">{{ p.title }}</span>
                      <span class="badge" [class.badge--soft]="p.stage !== 'deck'">{{ stageLabel(p.stage) }}</span>
                      <span class="row__date">{{ p.updatedAt | date: 'medium' }}</span>
                    </button>
                  </li>
                }
              </ul>
            }
          </section>
        }

        @if (agentNote()) {
          <p class="agent-note">{{ agentNote() }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      /* C5: top-align (not vertical-center) so a returning user sees their recent
         projects without scrolling past a full-viewport empty hero. */
      .home { min-height: 100vh; display: grid; place-items: start center; padding: 7vh 20px 48px; }
      .home__center { width: 100%; max-width: 960px; text-align: center; }
      .wordmark { font-weight: 700; letter-spacing: -0.02em; color: var(--mic-accent); font-size: 15px; text-transform: uppercase; }
      .headline { font-size: 30px; font-weight: 600; margin: 12px 0 28px; letter-spacing: -0.02em; }
      .start { display: flex; flex-direction: column; gap: 12px; max-width: 600px; width: 100%; margin: 0 auto; }
      .start__input {
        font: inherit; resize: vertical; padding: 14px 16px; border-radius: var(--mic-radius);
        border: 1px solid var(--mic-border-strong); background: var(--mic-surface); color: var(--mic-ink);
      }
      .start__input:focus-visible { outline: 3px solid var(--mic-accent-soft); border-color: var(--mic-accent); }
      .start__row { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
      .start__attach { margin-right: auto; }
      .start__runtime { font: inherit; padding: 9px 12px; border-radius: var(--mic-radius-sm); border: 1px solid var(--mic-border-strong); background: var(--mic-surface); color: var(--mic-ink); }
      .start__go { min-width: 120px; }
      .start__continue { align-self: flex-end; }
      .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 18px; }
      .chip { font: inherit; font-size: 13px; padding: 6px 12px; border-radius: 999px; border: 1px solid var(--mic-border); background: var(--mic-surface-2); color: var(--mic-ink-2); cursor: pointer; }
      .chip:hover { border-color: var(--mic-accent); color: var(--mic-accent); }
      /* "Your decks" library (cards / list) — the home now surfaces every past
         deck, each opening its file browser. */
      .library { margin-top: 44px; text-align: left; }
      .library__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 14px; }
      .library__title { font-size: 15px; font-weight: 600; margin: 0; }
      .library__count { color: var(--mic-faint); font-weight: 400; }
      .seg { display: inline-flex; border: 1px solid var(--mic-border-strong); border-radius: var(--mic-radius-sm); overflow: hidden; }
      .seg__btn { font: inherit; font-size: 13px; padding: 5px 14px; border: 0; background: var(--mic-surface); color: var(--mic-muted); cursor: pointer; }
      .seg__btn + .seg__btn { border-left: 1px solid var(--mic-border); }
      .seg__btn--on { background: var(--mic-accent); color: #fff; }

      .cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
      .card { width: 100%; display: flex; flex-direction: column; font: inherit; text-align: left; padding: 0; overflow: hidden; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface); color: var(--mic-ink); cursor: pointer; }
      .card:hover { border-color: var(--mic-accent); }
      .card:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: 1px; }
      .card__thumb { display: block; border-bottom: 1px solid var(--mic-border); }
      .card__foot { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; }
      .card__name { font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .card__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .card__date { font-size: 12px; color: var(--mic-faint); white-space: nowrap; }

      .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .row { width: 100%; display: flex; align-items: center; gap: 12px; font: inherit; text-align: left; padding: 11px 14px; border-radius: var(--mic-radius-sm); border: 1px solid var(--mic-border); background: var(--mic-surface); color: var(--mic-ink); cursor: pointer; }
      .row:hover { border-color: var(--mic-accent); background: var(--mic-surface-2); }
      .row__name { font-size: 14px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .row__date { color: var(--mic-faint); font-size: 13px; white-space: nowrap; }

      .badge { font-size: 11px; padding: 2px 9px; border-radius: 999px; background: var(--mic-accent-soft); color: var(--mic-accent-strong); white-space: nowrap; }
      .badge--soft { background: var(--mic-surface-2); color: var(--mic-muted); }

      .agent-note { margin-top: 24px; color: var(--mic-muted); font-size: 13px; }
    `,
  ],
})
export class HomeComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly attach = viewChild(AttachControlComponent);

  readonly brief = signal('');
  readonly runtimeId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly availableAgents = signal<DetectedAgent[]>([]);
  readonly recents = signal<ProjectRecord[]>([]);
  readonly agentNote = signal<string>('');

  /** "Your decks" layout, persisted across reloads (cards is the default). */
  readonly view = signal<'cards' | 'list'>(this.initialView());

  /** Slice 8 (issue #9): when the user attached source files that the daemon
   *  skipped (unsupported / too large), the project IS created + the supported
   *  files staged, but we HOLD on Home so the friendly note is seen (AC2) before
   *  continuing. Holds the created project's id for the Continue affordance. */
  readonly pendingProjectId = signal<string | null>(null);

  readonly starters = ['Executive update', 'Training deck', 'Q3 yield review'];

  // Production-runtime preference (plan §1 N3, Slice 9 AC1): the selector
  // DEFAULTS to enterprise GitHub Copilot when present; codex is the
  // development/fallback runtime. Mirror of the daemon's RUNTIME_DEFAULT_ORDER.
  private readonly runtimeDefaultOrder = ['copilot', 'codex'];

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const [agents, projects] = await Promise.all([this.api.listAgents(), this.api.listProjects()]);
    const available = agents.filter((a) => a.available);
    this.availableAgents.set(available);
    // The home is now the deck library — surface every past deck (newest-first),
    // not just a handful, since each opens its own file browser.
    this.recents.set(projects);
    this.runtimeId.set(this.pickDefaultRuntime(available));

    // First-run onboarding (Slice 10, §13): if NO runtime is ready (none
    // installed, or the only ones present aren't signed in), send the user to
    // the wizard, which walks install → sign-in in plain language. Otherwise
    // surface a gentle sign-in note for any present-but-unauthenticated runtime.
    const ready = available.filter((a) => a.authStatus !== 'missing');
    if (ready.length === 0) {
      void this.router.navigate(['/welcome']);
      return;
    }
    const needsAuth = available.find((a) => a.authStatus === 'missing');
    if (needsAuth) {
      this.agentNote.set(needsAuth.authMessage ?? `Sign in to ${needsAuth.name}.`);
    }
  }

  /** Copilot when present, else codex, else the first available, else null. */
  private pickDefaultRuntime(available: DetectedAgent[]): string | null {
    const ids = available.map((a) => a.id);
    for (const preferred of this.runtimeDefaultOrder) {
      if (ids.includes(preferred)) return preferred;
    }
    return ids[0] ?? null;
  }

  /** A fresh selection clears any held "go to workspace" state (the user is still
   *  curating attachments before starting). */
  onAttachChanged(): void {
    this.pendingProjectId.set(null);
  }

  async start(): Promise<void> {
    const brief = this.brief().trim();
    if (!brief || this.busy()) return;
    this.busy.set(true);
    try {
      const project = await this.api.createProject(brief, this.runtimeId());

      // Slice 8 (issue #9): stage any attached source files into the new Project so
      // the agent reads them and cites REAL figures (AC1). A skipped file surfaces
      // a friendly note and NEVER blocks (AC2): if anything was skipped we keep the
      // user on Home to read the note, then continue; otherwise navigate straight in.
      const attach = this.attach();
      const files = attach?.currentFiles() ?? [];
      if (files.length && attach) {
        attach.disabled.set(true);
        try {
          const result = await this.api.uploadAttachments(project.id, files);
          attach.clear();
          if (result.skipped.length) {
            attach.showNotes(result.skipped);
            this.pendingProjectId.set(project.id);
            return; // hold on Home so the friendly note is seen; flow continues on Continue.
          }
        } finally {
          attach.disabled.set(false);
        }
      }

      await this.router.navigate(['/workspace', project.id]);
    } finally {
      this.busy.set(false);
    }
  }

  /** Proceed into the workspace after the user has seen the skipped-file note. */
  continueToWorkspace(id: string): void {
    this.pendingProjectId.set(null);
    void this.router.navigate(['/workspace', id]);
  }

  /** Open a past deck's file browser (the workspace is reached from there via
   *  "Open in workspace"). */
  openFiles(p: ProjectRecord): void {
    void this.router.navigate(['/files', p.id]);
  }

  /** The active deck variant's file to preview on the card, or null when the
   *  project hasn't produced a deck yet (a stage placeholder shows instead). */
  deckEntry(p: ProjectRecord): string | null {
    const active = p.decks.find((d) => d.id === p.activeDeckId) ?? p.decks[0];
    return active?.file ?? null;
  }

  stageLabel(stage: FlowStage): string {
    return STAGE_LABELS[stage] ?? stage;
  }

  setView(view: 'cards' | 'list'): void {
    this.view.set(view);
    try {
      localStorage.setItem(LIBRARY_VIEW_KEY, view);
    } catch {
      /* storage unavailable — in-memory toggle still works */
    }
  }

  private initialView(): 'cards' | 'list' {
    try {
      return localStorage.getItem(LIBRARY_VIEW_KEY) === 'list' ? 'list' : 'cards';
    } catch {
      return 'cards';
    }
  }
}

const LIBRARY_VIEW_KEY = 'slide-studio.library-view';

/** Stage → the badge label shown on each deck in the library. */
const STAGE_LABELS: Record<FlowStage, string> = {
  brief: 'Brief',
  wireframe: 'Wireframe',
  theme: 'Theme',
  deck: 'Deck',
};
