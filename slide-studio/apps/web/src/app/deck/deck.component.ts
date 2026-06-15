import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../core/api.service';
import type { Annotation, ArtifactManifest } from '../core/types';
import { DECK_BRIDGE } from './deck-bridge.snippet';

/**
 * The **Deck preview** canvas surface (plan §7.5, §12, issue #12 / Slice 5 +
 * issue #15 / Slice 12).
 *
 * Selected when the Artifact Manifest's `kind === 'deck'` — the final, themed,
 * high-fi slide output. Renders the single-file HTML Deck in a **sandboxed
 * `<iframe>`** (same security posture as the Wireframe, plan §10: `allow-scripts`
 * with no `allow-same-origin`, an opaque origin that can't touch the app) and
 * lets the user **page through slide by slide**.
 *
 * The Deck is loaded via `srcdoc` (fetched from the daemon). It is marked
 * `data-embed` so the new shell hides its chrome, and a small host **bridge** is
 * injected before `</body>` that drives the shell's `window.presentation` API
 * using the host `postMessage` protocol (`ss-deck-pager` / `ss-deck-host`).
 *
 * Slice 12 (issue #15): the Deck reuses the **same Annotation SDK** the Wireframe
 * does (plan §10, §M8). The daemon's single SDK source is injected before
 * `</body>` (after the pager); the user clicks an element / selects text /
 * comments on the whole slide and the SDK posts a queued annotation on the
 * `ss-annotation` channel — tagged `surface: 'deck'` because the host declares it
 * over `ss-deck-host`. This component relays each one up via {@link annotate}; the
 * workspace queues it as a composer pill, and a **Regenerate deck** affordance
 * re-runs generation so the agent rewrites exactly the affected slides.
 */
@Component({
  selector: 'ss-deck',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="deck">
      <div class="deck__bar">
        <span class="deck__tag">Deck · {{ manifest().theme || 'themed' }}</span>
        @if (manifest().inferred) {
          <span class="deck__inferred" title="No manifest sidecar; kind/format inferred from the file">inferred</span>
        }
        <span class="deck__count">{{ total() }} {{ total() === 1 ? 'slide' : 'slides' }}</span>
        <div class="deck__nav">
          <button class="mic-btn deck__btn" type="button" [disabled]="current() <= 0" (click)="prev()" aria-label="Previous slide">‹</button>
          <span class="deck__pos">{{ total() ? current() + 1 : 0 }} / {{ total() }}</span>
          <button class="mic-btn deck__btn" type="button" [disabled]="current() >= total() - 1" (click)="next()" aria-label="Next slide">›</button>
        </div>
      </div>

      <div class="deck__stage">
        @if (loading()) {
          <p class="deck__hint">Loading the deck…</p>
        } @else if (!srcdoc()) {
          <p class="deck__hint">The deck could not be loaded.</p>
        }
        <iframe
          #frame
          class="deck__frame"
          title="Deck preview"
          sandbox="allow-scripts"
          [srcdoc]="srcdoc()"
          [class.deck__frame--hidden]="loading() || !srcdoc()"
          (load)="onFrameLoad()"
        ></iframe>
      </div>
    </div>
  `,
  styles: [
    `
      .deck { display: flex; flex-direction: column; height: 100%; min-height: 0; gap: 12px; }
      .deck__bar {
        display: flex; align-items: center; gap: 12px;
        padding: 8px 12px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius);
        background: var(--mic-surface-2);
      }
      .deck__tag { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-accent); }
      .deck__inferred {
        font-size: 11px; color: var(--mic-faint); border: 1px dashed var(--mic-border-strong);
        border-radius: 999px; padding: 1px 8px;
      }
      .deck__count { font-size: 12px; color: var(--mic-faint); }
      .deck__nav { margin-left: auto; display: flex; align-items: center; gap: 8px; }
      .deck__btn { padding: 2px 12px; font-size: 18px; line-height: 1; }
      .deck__pos { font-size: 13px; color: var(--mic-ink-2); min-width: 56px; text-align: center; }
      .deck__stage {
        flex: 1; min-height: 0; position: relative;
        border: 1px solid var(--mic-border); border-radius: var(--mic-radius);
        overflow: hidden; background: var(--mic-surface);
      }
      .deck__frame { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
      .deck__frame--hidden { visibility: hidden; }
      .deck__hint { position: absolute; inset: 0; display: grid; place-items: center; color: var(--mic-faint); margin: 0; }
    `,
  ],
})
export class DeckComponent {
  /** The resolved manifest (kind === 'deck'). Drives the slide count + theme. */
  readonly manifest = input.required<ArtifactManifest>();
  /** The owning Project (to fetch the artifact bytes). */
  readonly projectId = input.required<string>();

  /** Slice 12 (issue #15): one annotation the user pinned on the Deck (element /
   *  text-range / whole-slide). The workspace relays it into the durable feedback
   *  queue so it rides the next regenerate as a scoped revise instruction. */
  readonly annotate = output<Annotation>();

  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');

  readonly loading = signal(true);
  /** The deck HTML, bound to `[srcdoc]`. Bypass is SAFE: the frame is
   *  `sandbox="allow-scripts"` with no `allow-same-origin` (opaque origin, §10). */
  readonly srcdoc = signal<SafeHtml | ''>('');
  private readonly reported = signal<number | null>(null);
  readonly current = signal(0);

  readonly total = computed(() => this.reported() ?? this.manifest().slides ?? 0);

  constructor() {
    // (Re)load the deck whenever the manifest entry changes (live reload on a
    // regenerate). The effect tracks manifest() + projectId().
    effect(() => {
      const m = this.manifest();
      const id = this.projectId();
      if (!m?.entry || !id) return;
      void this.load(id, m.entry);
    });
    window.addEventListener('message', this.onMessage);
  }

  private readonly onMessage = (ev: MessageEvent): void => {
    const data = ev.data as
      | { source?: string; type?: string; total?: number; annotation?: Annotation }
      | null;
    if (!data) return;
    // The pager reports the slide count.
    if (data.source === 'ss-deck-pager') {
      if (data.type === 'ready' && typeof data.total === 'number') {
        this.reported.set(data.total);
        this.current.update((c) => Math.min(Math.max(c, 0), Math.max(0, data.total! - 1)));
        this.show(this.current());
        this.loading.set(false);
      }
      return;
    }
    // Slice 12 (issue #15): the Annotation SDK queues one pinned deck annotation
    // (tagged surface: 'deck'). Relay it up so the workspace enqueues it as a
    // composer pill for the next regenerate (§10, §M8).
    if (data.source === 'ss-annotation' && data.type === 'queue' && data.annotation) {
      this.annotate.emit({ ...data.annotation, surface: 'deck' });
    }
  };

  private async load(id: string, entry: string): Promise<void> {
    this.loading.set(true);
    this.reported.set(null);
    // Slice 12 (issue #15): fetch the Deck bytes AND the daemon's single Annotation
    // SDK source (same one the Wireframe injects) so the user annotates the Deck.
    const [html, sdk] = await Promise.all([
      this.api.getArtifactContent(id, entry),
      this.api.getAnnotationSdk(),
    ]);
    if (html == null) {
      this.srcdoc.set('');
      this.loading.set(false);
      return;
    }
    // Inject the pager (Slice 5) + the Annotation SDK (Slice 12) before </body>.
    // Bypass HTML sanitization (would strip the injected <script>s); safe under the
    // cross-origin sandbox (allow-scripts, no allow-same-origin — §10).
    const embedded = this.markEmbed(html);
    const withBridge = this.injectBridge(embedded);
    const withSdk = sdk ? this.injectSdk(withBridge, sdk) : withBridge;
    this.srcdoc.set(this.sanitizer.bypassSecurityTrustHtml(withSdk));
  }

  /** Inject the Annotation SDK before `</body>` (after the pager). The SDK source
   *  is the daemon's single copy, fetched at load — identical to the Wireframe's,
   *  so the deck annotations capture exactly the same anchors (Slice 12 / §10). */
  private injectSdk(html: string, sdk: string): string {
    const tag = `<script>${sdk}</script>`;
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${tag}</body>`);
    return html + tag;
  }

  onFrameLoad(): void {
    setTimeout(() => this.loading.set(false), 600);
  }

  prev(): void {
    if (this.current() <= 0) return;
    this.current.update((c) => c - 1);
    this.show(this.current());
  }

  next(): void {
    if (this.current() >= this.total() - 1) return;
    this.current.update((c) => c + 1);
    this.show(this.current());
  }

  private show(index: number): void {
    // Drive the pager AND declare the surface to the Annotation SDK (Slice 12 /
    // issue #15) so a queued annotation is tagged `surface: 'deck'` → a regenerate.
    this.frame()?.nativeElement.contentWindow?.postMessage(
      { source: 'ss-deck-host', type: 'goto', index, surface: 'deck' },
      '*',
    );
  }

  /** Mark the deck for the shell's embedded viewer mode (hides app bar, rail,
   *  notes, overlays — leaving just the stage). The shell still runs and exposes
   *  window.presentation, which the bridge drives. */
  private markEmbed(html: string): string {
    // Touch only the real opening <body> tag (check its own attributes), so we
    // never trip on a literal "<body …>" that appears in comments/CSS prose.
    return html.replace(/<body\b([^>]*)>/i, (_m: string, attrs: string) =>
      /\bdata-embed\b/.test(attrs) ? _m : `<body${attrs} data-embed>`);
  }

  /** Inject the host bridge before </body>: it reports the slide count to the host
   *  (ss-deck-pager/ready) and navigates the shell's window.presentation on
   *  ss-deck-host/goto — the same protocol the old pager used, so the nav bar,
   *  slide count, and Annotation SDK surface logic are unchanged. */
  private injectBridge(html: string): string {
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${DECK_BRIDGE}</body>`);
    return html + DECK_BRIDGE;
  }
}
