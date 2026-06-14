import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { AgentSocketService, type SocketFrame } from '../core/agent-socket.service';
import type { OnboardingPlan, OnboardingRuntime } from '../core/types';

/**
 * First-run onboarding wizard (plan §13, Slice 10 / issue #10, M7, AC1).
 *
 * Detects the runtimes + auth state (via /api/onboarding) and walks a
 * NON-TECHNICAL user from launch → installed → signed-in in plain language:
 * each runtime is a card with ONE next step (install, then sign in).
 *
 * AC1 — the step runs IN-APP. When the runtime declares an in-app command
 * (`canRunInApp`), the primary button ("Install now" / "Sign in") tells the
 * daemon to RUN the install/login itself; progress streams into a live log and
 * the plan refreshes on its own when it finishes — the user never opens a
 * terminal. The external setup page remains as a secondary fallback. The
 * recommended runtime (enterprise GitHub Copilot when present, §13) leads. CLI
 * flags are never shown in the step copy — only an optional "For IT / advanced"
 * disclosure reveals a command. Once a runtime is ready, "Start building" routes
 * to Home.
 */
@Component({
  selector: 'ss-onboarding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ob">
      <div class="ob__center">
        <div class="wordmark">Slide&nbsp;Studio</div>
        <h1 class="headline">Let's get you set up</h1>
        <p class="summary">{{ plan()?.summary ?? 'Checking what is installed on this computer…' }}</p>

        @if (loading()) {
          <p class="muted">Looking for your assistant…</p>
        }

        <ol class="cards">
          @for (r of runtimes(); track r.id) {
            <li class="card" [class.card--ready]="r.ready" [class.card--rec]="r.recommended">
              <div class="card__head">
                <span class="card__status" [attr.data-step]="r.step" aria-hidden="true">
                  {{ r.ready ? '✓' : r.step === 'install' ? '↓' : '→' }}
                </span>
                <div class="card__titles">
                  <div class="card__name">
                    {{ r.name }}
                    @if (r.recommended) {
                      <span class="badge">Recommended</span>
                    }
                  </div>
                  <div class="card__title">{{ r.title }}</div>
                </div>
              </div>

              <p class="card__detail">{{ r.detail }}</p>

              <div class="card__actions">
                @if (!r.ready && r.canRunInApp) {
                  <!-- AC1: run the step IN-APP — no terminal for the user. -->
                  <button
                    class="mic-btn mic-btn--primary"
                    type="button"
                    (click)="runStep(r)"
                    [disabled]="busyRuntime() === r.id"
                  >
                    @if (busyRuntime() === r.id) {
                      {{ r.step === 'install' ? 'Installing…' : 'Signing in…' }}
                    } @else {
                      {{ r.step === 'install' ? 'Install now' : inAppSignInLabel(r) }}
                    }
                  </button>
                }
                @if (!r.ready && r.actionUrl) {
                  <a
                    class="link-fallback"
                    [href]="r.actionUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ r.canRunInApp ? 'Or open the setup page' : (r.step === 'install' ? 'Open setup page' : actionLabel(r)) }}
                  </a>
                }
                @if (r.ready) {
                  <span class="ready-pill">Ready</span>
                }
              </div>

              @if (busyRuntime() === r.id && progress().length) {
                <pre class="progress" aria-live="polite">{{ progress().join('\n') }}</pre>
              }
              @if (resultFor(r.id); as msg) {
                <p class="step-result" [class.step-result--err]="!lastOk()">{{ msg }}</p>
              }

              @if (r.commandHint) {
                <details class="adv">
                  <summary>For IT / advanced setup</summary>
                  <p class="adv__hint">Run this in a terminal if you prefer:</p>
                  <code class="adv__cmd">{{ r.commandHint }}</code>
                </details>
              }
            </li>
          }
        </ol>

        @if (runtimes().length === 0 && !loading()) {
          <p class="muted">
            No assistant was found. Install GitHub Copilot (recommended) or Codex, then choose Recheck.
          </p>
        }

        <div class="footer">
          <button class="mic-btn" type="button" (click)="rescan()" [disabled]="loading()">
            {{ loading() ? 'Checking…' : 'Recheck' }}
          </button>
          <button
            class="mic-btn mic-btn--primary"
            type="button"
            (click)="start()"
            [disabled]="!plan()?.canStart"
          >
            Start building
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .ob { min-height: 100vh; display: grid; place-items: start center; padding: 56px 20px; }
      .ob__center { width: 100%; max-width: 620px; }
      .wordmark { font-weight: 700; letter-spacing: -0.02em; color: var(--mic-accent); font-size: 15px; text-transform: uppercase; text-align: center; }
      .headline { font-size: 28px; font-weight: 600; margin: 10px 0 8px; letter-spacing: -0.02em; text-align: center; }
      .summary { color: var(--mic-ink-2); text-align: center; margin: 0 0 28px; }
      .muted { color: var(--mic-muted); text-align: center; }
      .cards { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 14px; }
      .card { border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface); padding: 18px; }
      .card--rec { border-color: var(--mic-accent); }
      .card--ready { border-color: var(--mic-border); background: var(--mic-surface-2); }
      .card__head { display: flex; gap: 12px; align-items: flex-start; }
      .card__status { flex: none; width: 28px; height: 28px; border-radius: 999px; display: grid; place-items: center; font-weight: 700; background: var(--mic-surface-2); color: var(--mic-muted); }
      .card--ready .card__status { background: var(--mic-accent-soft); color: var(--mic-accent-strong); }
      .card__titles { flex: 1; min-width: 0; }
      .card__name { font-size: 13px; color: var(--mic-muted); display: flex; align-items: center; gap: 8px; }
      .badge { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-on-accent); background: var(--mic-accent); padding: 2px 7px; border-radius: 999px; }
      .card__title { font-size: 17px; font-weight: 600; margin-top: 2px; }
      .card__detail { color: var(--mic-ink-2); margin: 12px 0 14px; }
      .card__actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
      .link-fallback { font-size: 13px; color: var(--mic-muted); text-decoration: underline; }
      .ready-pill { font-size: 13px; color: var(--mic-accent-strong); font-weight: 600; }
      .progress { margin: 12px 0 0; max-height: 160px; overflow: auto; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 12px; line-height: 1.5; background: var(--mic-surface-2); border: 1px solid var(--mic-border); border-radius: var(--mic-radius-sm); padding: 10px 12px; white-space: pre-wrap; color: var(--mic-ink-2); }
      .step-result { margin: 10px 0 0; font-size: 14px; color: var(--mic-accent-strong); }
      .step-result--err { color: var(--mic-danger, #b42318); }
      .adv { margin-top: 14px; border-top: 1px solid var(--mic-border); padding-top: 12px; }
      .adv summary { cursor: pointer; color: var(--mic-muted); font-size: 13px; }
      .adv__hint { color: var(--mic-muted); font-size: 13px; margin: 8px 0 6px; }
      .adv__cmd { display: block; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; background: var(--mic-surface-2); border: 1px solid var(--mic-border); border-radius: var(--mic-radius-sm); padding: 8px 10px; overflow-x: auto; }
      .footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 28px; }
    `,
  ],
})
export class OnboardingComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly socket = inject(AgentSocketService);

  readonly plan = signal<OnboardingPlan | null>(null);
  readonly loading = signal(true);

  /** The runtime whose install/sign-in is currently running in-app (AC1). */
  readonly busyRuntime = signal<string | null>(null);
  /** Live streamed progress lines for the running step. */
  readonly progress = signal<string[]>([]);
  /** The last step's friendly result message, keyed by runtime id. */
  private readonly results = signal<Record<string, string>>({});
  readonly lastOk = signal(true);

  private detach: (() => void) | null = null;

  runtimes(): OnboardingRuntime[] {
    return this.plan()?.runtimes ?? [];
  }

  ngOnInit(): void {
    // Listen for the in-app install/sign-in progress + result frames (AC1).
    this.detach = this.socket.listen((e) => this.onSocketEvent(e));
    void this.rescan();
  }

  ngOnDestroy(): void {
    this.detach?.();
  }

  /** Re-detect runtimes + auth (the manual "Recheck", also used as a fallback). */
  async rescan(): Promise<void> {
    this.loading.set(true);
    try {
      const plan = await this.api.getOnboarding();
      this.plan.set(plan);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * AC1: run THIS runtime's next step (install or sign-in) IN-APP. The daemon
   * executes the command and streams progress; the result frame refreshes the
   * plan so the card advances on its own — the user never opens a terminal.
   */
  runStep(r: OnboardingRuntime): void {
    if (this.busyRuntime()) return;
    const kind = r.step === 'install' ? 'install' : 'signin';
    this.busyRuntime.set(r.id);
    this.progress.set([]);
    this.results.update((m) => {
      const { [r.id]: _drop, ...rest } = m;
      return rest;
    });
    this.socket.runOnboarding(r.id, kind);
  }

  private onSocketEvent(e: SocketFrame): void {
    if (e.type === 'onboard:progress') {
      if (e.runtimeId !== this.busyRuntime()) return;
      this.progress.update((lines) => [...lines, e.line].slice(-200));
      return;
    }
    if (e.type === 'onboard:result') {
      this.plan.set(e.plan); // the wizard advances on the refreshed plan
      this.lastOk.set(e.ok);
      this.results.update((m) => ({ ...m, [e.runtimeId]: e.message }));
      this.busyRuntime.set(null);
    }
  }

  /** The last friendly result line for a runtime, or null. */
  resultFor(id: string): string | null {
    return this.results()[id] ?? null;
  }

  /** A friendlier sign-in label that names the provider, never a CLI verb. */
  actionLabel(r: OnboardingRuntime): string {
    if (r.signInProvider === 'github-sso') return 'Sign in with GitHub';
    if (r.signInProvider === 'openai') return 'Sign in with OpenAI';
    return 'Open sign-in';
  }

  /** In-app sign-in button label (the provider, never a CLI verb). */
  inAppSignInLabel(r: OnboardingRuntime): string {
    if (r.signInProvider === 'github-sso') return 'Sign in with GitHub';
    if (r.signInProvider === 'openai') return 'Sign in with OpenAI';
    return 'Sign in';
  }

  start(): void {
    if (!this.plan()?.canStart) return;
    void this.router.navigate(['/']);
  }
}
