import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AttachControlComponent } from '../attach/attach-control.component';
import { ApiService } from '../core/api.service';
import type { DetectedAgent } from '../core/types';

/**
 * Composer / Create screen (`/new`, CONTEXT.md "Composer"). A clean centered
 * prompt, a runtime selector when >1 is detected, starter chips, and the attach
 * affordance. Submitting CREATES a Project and routes into the Workspace with the
 * request as the first turn.
 *
 * Split out of the old single-screen Home (which also held the deck library); the
 * library now lives at `/` in {@link LibraryComponent}. When the user already has
 * decks, a "← Decks" link returns to the Library; when there are none, this IS the
 * landing screen and the link is hidden (CONTEXT.md: nothing to go back to).
 */
@Component({
  selector: 'ss-composer',
  standalone: true,
  imports: [FormsModule, AttachControlComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      @if (hasDecks()) {
        <button class="back" type="button" (click)="backToLibrary()" aria-label="Back to your decks">← Decks</button>
      }
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
            <button class="go start__go" type="submit" [disabled]="!brief().trim() || busy()">
              <span class="go__sq" aria-hidden="true"></span> {{ busy() ? 'Creating…' : 'Start' }}
            </button>
          </div>

          <!-- AC2: when the daemon skipped a file (unsupported / too large), the
               attach control shows the friendly note and we hold here with a
               Continue affordance — the staged files still ride into the workspace,
               nothing is blocked. -->
          @if (pendingProjectId(); as pid) {
            <button class="go start__continue" type="button" (click)="continueToWorkspace(pid)">
              Continue to workspace →
            </button>
          }
        </form>

        <div class="chips">
          @for (chip of starters; track chip) {
            <button class="chip" type="button" (click)="brief.set(chip)">{{ chip }}</button>
          }
        </div>

        @if (agentNote()) {
          <p class="agent-note">{{ agentNote() }}</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .home { position: relative; min-height: 100vh; display: grid; place-items: center; padding: 7vh 20px 48px;
        background: var(--studio-paper); color: var(--studio-ink); }
      .home__center { width: 100%; max-width: 960px; text-align: center; }
      .back {
        position: absolute; top: 18px; left: 18px; font: inherit; font-size: 13px;
        display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px;
        border-radius: 999px; border: 1px solid var(--studio-line);
        background: var(--studio-panel); color: var(--studio-muted); cursor: pointer;
      }
      .back:hover { border-color: var(--studio-muted); color: var(--studio-ink); }
      .back:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 1px; }
      .wordmark { font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--studio-faint); }
      .headline { font-size: clamp(28px, 4vw, 40px); font-weight: 300; margin: 12px 0 30px; letter-spacing: -0.02em; }
      .start { display: flex; flex-direction: column; gap: 14px; max-width: 600px; width: 100%; margin: 0 auto; }
      .start__input {
        font: inherit; resize: vertical; padding: 16px 18px; border-radius: 16px;
        border: 1px solid var(--studio-line); background: var(--studio-panel); color: var(--studio-ink);
      }
      .start__input::placeholder { color: var(--studio-faint); }
      .start__input:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 1px; }
      .start__row { display: flex; gap: 10px; justify-content: flex-end; align-items: center; }
      .start__attach { margin-right: auto; }
      .start__runtime { font: inherit; padding: 11px 14px; border-radius: 12px; border: 1px solid var(--studio-line); background: var(--studio-panel); color: var(--studio-ink); cursor: pointer; }

      .go { display: inline-flex; align-items: center; justify-content: center; gap: 11px; font: inherit; font-size: 14px; font-weight: 500;
        background: var(--studio-ink); color: var(--studio-paper); border: 0; border-radius: 13px; padding: 14px 22px; cursor: pointer;
        transition: opacity 0.2s ease, transform 0.15s ease; }
      .go:hover { opacity: 0.9; }
      .go:active { transform: translateY(1px); }
      .go:disabled { opacity: 0.45; cursor: default; }
      .go:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 2px; }
      .go__sq { width: 10px; height: 10px; border-radius: 2px; background: var(--mag); }
      .start__go { min-width: 130px; }
      .start__continue { align-self: flex-end; }

      .chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 20px; }
      .chip { font: inherit; font-size: 13px; padding: 8px 14px; border-radius: 999px; border: 1px solid var(--studio-line); background: var(--studio-panel); color: var(--studio-muted); cursor: pointer; }
      .chip:hover { border-color: var(--studio-muted); color: var(--studio-ink); }
      .agent-note { margin-top: 24px; color: var(--studio-muted); font-size: 13px; }
    `,
  ],
})
export class ComposerComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly attach = viewChild(AttachControlComponent);

  readonly brief = signal('');
  readonly runtimeId = signal<string | null>(null);
  readonly busy = signal(false);
  readonly availableAgents = signal<DetectedAgent[]>([]);
  readonly agentNote = signal<string>('');

  /** True when the user already has past Projects — gates the "← Decks" link.
   *  When zero, the Composer is the landing screen and the link is hidden. */
  readonly hasDecks = signal(false);

  /** Slice 8 (issue #9): when the user attached source files that the daemon
   *  skipped (unsupported / too large), the project IS created + the supported
   *  files staged, but we HOLD here so the friendly note is seen (AC2) before
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
    this.hasDecks.set(projects.length > 0);
    this.runtimeId.set(this.pickDefaultRuntime(available));

    // Surface a gentle sign-in note for any present-but-unauthenticated runtime
    // (the Library handles the first-run redirect to /welcome when none is ready).
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

  /** Back to the deck library (only offered when the user has decks). */
  backToLibrary(): void {
    void this.router.navigate(['/']);
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
      // user here to read the note, then continue; otherwise navigate straight in.
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
            return; // hold so the friendly note is seen; flow continues on Continue.
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
}
