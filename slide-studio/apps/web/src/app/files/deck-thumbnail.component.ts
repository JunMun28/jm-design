import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DomSanitizer, type SafeHtml } from '@angular/platform-browser';
import { ApiService } from '../core/api.service';

/** The logical slide box we render the deck into before scaling it down. The
 *  universal Slide Player shell fits its stage to this viewport, so a single
 *  fixed 16:9 box gives a faithful slide-1 thumbnail at any display size. */
const LOGICAL_W = 1200;
const LOGICAL_H = 675;

/**
 * A live, scaled-down preview of a deck (or wireframe) — slide 1 only, no chrome.
 *
 * Reuses the workspace's iframe security posture (plan §10): the artifact HTML is
 * loaded via `srcdoc` into a `sandbox="allow-scripts"` frame with no
 * `allow-same-origin`, so it runs at an opaque origin that can't touch the app.
 * The `<body>` is marked `data-embed` so the Slide Player shell hides its app bar
 * / rail / notes and shows just the stage, which auto-fits the fixed logical box.
 *
 * Used twice: as the home library's card thumbnails (lazy — only fetched once the
 * card scrolls into view) and as the file browser's preview pane (eager). When
 * `entry` is null — or the fetch fails — a neutral placeholder with the stage
 * label is shown instead, so a Brief/Wireframe-stage project still renders a card.
 */
@Component({
  selector: 'ss-deck-thumbnail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="thumb" #host>
      @if (srcdoc(); as doc) {
        <iframe
          class="thumb__frame"
          title="Slide preview"
          aria-hidden="true"
          tabindex="-1"
          scrolling="no"
          sandbox="allow-scripts"
          [srcdoc]="doc"
          [style.width.px]="logicalW"
          [style.height.px]="logicalH"
          [style.transform]="transform()"
          (load)="onFrameLoad()"
        ></iframe>
      }
      <!-- Overlay covers the iframe's white first paint with a spinner until the
           deck's shell has booted and fitted slide 1 (or shows the stage label
           when there's nothing to preview / a load failed). -->
      @if (!ready()) {
        <div class="thumb__ph">
          @if (loading()) {
            <span class="thumb__spinner" aria-hidden="true"></span>
          } @else {
            <span class="thumb__label">{{ placeholder() }}</span>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .thumb { position: relative; width: 100%; aspect-ratio: 16 / 9; overflow: hidden; background: var(--mic-surface-2); }
      .thumb__frame { position: absolute; top: 0; left: 0; border: 0; transform-origin: top left; pointer-events: none; background: #fff; }
      .thumb__ph { position: absolute; inset: 0; display: grid; place-items: center; color: var(--mic-faint); background: var(--mic-surface-2); }
      .thumb__label { font-size: 12px; }
      .thumb__spinner {
        width: 18px; height: 18px; border: 2px solid var(--mic-border-strong);
        border-top-color: var(--mic-accent); border-radius: 50%; animation: ss-thumb-spin 0.8s linear infinite;
      }
      @keyframes ss-thumb-spin { to { transform: rotate(360deg); } }
      @media (prefers-reduced-motion: reduce) { .thumb__spinner { animation: none; } }
    `,
  ],
})
export class DeckThumbnailComponent {
  readonly projectId = input.required<string>();
  /** The artifact-relative deck/wireframe file to preview, or null → placeholder. */
  readonly entry = input<string | null>(null);
  /** The label shown when there's nothing to preview yet (usually the stage). */
  readonly placeholder = input<string>('No preview');
  /** Defer the fetch until the thumbnail scrolls into view (the home grid). The
   *  file browser's single preview passes false so it loads immediately. */
  readonly lazy = input<boolean>(true);

  readonly logicalW = LOGICAL_W;
  readonly logicalH = LOGICAL_H;

  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = viewChild<ElementRef<HTMLDivElement>>('host');

  readonly loading = signal(false);
  /** True once the iframe has painted slide 1 — gates the overlay so the white
   *  first paint of the embedded deck never shows through. */
  readonly ready = signal(false);
  /** The embedded deck HTML, bound to `[srcdoc]`. Bypass is SAFE: the frame is
   *  `sandbox="allow-scripts"` with no `allow-same-origin` (opaque origin, §10). */
  readonly srcdoc = signal<SafeHtml | ''>('');
  private readonly scale = signal(0.2);
  private readonly visible = signal(false);
  /** Guards against re-fetching the same artifact on unrelated change detection. */
  private loadedKey: string | null = null;

  readonly transform = computed(() => `scale(${this.scale()})`);

  constructor() {
    // Keep the scaled iframe filling the host box, and (when lazy) hold the fetch
    // until the card scrolls near the viewport. Observers are torn down on view
    // teardown / re-init via the effect's cleanup.
    effect((onCleanup) => {
      const el = this.host()?.nativeElement;
      if (!el) return;
      const lazy = this.lazy();

      const ro = new ResizeObserver(() => this.scale.set((el.clientWidth || 1) / LOGICAL_W));
      ro.observe(el);
      this.scale.set((el.clientWidth || 1) / LOGICAL_W);

      let io: IntersectionObserver | null = null;
      if (lazy) {
        io = new IntersectionObserver(
          (entries) => {
            if (entries.some((e) => e.isIntersecting)) {
              this.visible.set(true);
              io?.disconnect();
            }
          },
          { rootMargin: '200px' },
        );
        io.observe(el);
      } else {
        this.visible.set(true);
      }

      onCleanup(() => {
        ro.disconnect();
        io?.disconnect();
      });
    });

    // Fetch + render once we have an entry AND are eager / scrolled into view.
    effect(() => {
      const id = this.projectId();
      const entry = this.entry();
      const visible = this.visible();
      if (!entry || !visible) return; // keep the placeholder
      const key = `${id}::${entry}`;
      if (key === this.loadedKey) return;
      this.loadedKey = key;
      void this.load(id, entry);
    });
  }

  private async load(id: string, entry: string): Promise<void> {
    this.loading.set(true);
    this.ready.set(false);
    this.srcdoc.set('');
    const html = await this.api.getArtifactContent(id, entry);
    if (html == null) {
      // Leave the placeholder showing the stage label rather than a stuck spinner.
      this.loading.set(false);
      return;
    }
    // Embedded mode hides the shell chrome (deck.component §). Bypass sanitization
    // (it would strip the shell's own <script>s); safe under the cross-origin sandbox.
    const embedded = html.replace(/<body\b([^>]*)>/i, (m: string, attrs: string) =>
      /\bdata-embed\b/.test(attrs) ? m : `<body${attrs} data-embed>`,
    );
    // Keep `loading` (spinner) up until the iframe paints — onFrameLoad clears it.
    this.srcdoc.set(this.sanitizer.bypassSecurityTrustHtml(embedded));
  }

  /** The iframe finished parsing the deck; give the shell a beat to boot + fit
   *  slide 1, then reveal it (mirrors deck.component's 600ms settle). */
  onFrameLoad(): void {
    setTimeout(() => {
      this.ready.set(true);
      this.loading.set(false);
    }, 500);
  }
}
