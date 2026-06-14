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

/**
 * The **Wireframe canvas surface** (plan §7.3, §10, issue #8 / Slice 3).
 *
 * Selected when the Artifact Manifest's `kind === 'wireframe'`. Renders the
 * low-fi, theme-less Wireframe in a **sandboxed `<iframe>`** and lets the user
 * **page through slide by slide**.
 *
 * Security posture (plan §10): the iframe is `sandbox="allow-scripts"` with **no
 * `allow-same-origin`**, so the artifact runs in an opaque origin — it can't
 * touch the app's cookies, storage, or DOM. The HTML is loaded via `srcdoc`
 * (fetched from the daemon) so the artifact stays portable. A tiny pager script
 * is injected before `</body>`; the host drives it with `postMessage` (the only
 * channel a `allow-scripts`-but-not-`allow-same-origin` frame has back).
 *
 * Slide segmentation matches the brainstorm wireframe skeleton: each slide is an
 * element marked `[data-slide]` (or `.slide-panel` / `.slide` / top-level
 * `<section>` as fallbacks). The pager shows exactly one at a time.
 *
 * Slice 4 (issue #11, §10): the daemon also injects the **Annotation SDK** before
 * `</body>`. The user clicks an element / selects text / comments on the whole
 * slide; the SDK captures a re-locatable anchor and posts it on the
 * `ss-annotation` channel. This component relays each queued annotation up via
 * {@link annotate}; the workspace queues it as a composer pill (the durable
 * feedback queue), so on the next send the agent revises exactly those elements
 * and the iframe live-reloads. The host keeps the SDK in sync with the visible
 * slide so a click reports the correct slide index.
 */
@Component({
  selector: 'ss-wireframe',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="wf">
      <div class="wf__bar">
        <span class="wf__tag">Wireframe · low-fi</span>
        @if (manifest().inferred) {
          <span class="wf__inferred" title="No manifest sidecar; kind/format inferred from the file">inferred</span>
        }
        <span class="wf__count">{{ total() }} {{ total() === 1 ? 'slide' : 'slides' }}</span>
        <div class="wf__nav">
          <button
            class="mic-btn wf__btn"
            type="button"
            [disabled]="current() <= 0"
            (click)="prev()"
            aria-label="Previous slide"
          >‹</button>
          <span class="wf__pos">{{ total() ? current() + 1 : 0 }} / {{ total() }}</span>
          <button
            class="mic-btn wf__btn"
            type="button"
            [disabled]="current() >= total() - 1"
            (click)="next()"
            aria-label="Next slide"
          >›</button>
        </div>
      </div>

      <div class="wf__stage">
        @if (loading()) {
          <p class="wf__hint">Loading the wireframe…</p>
        } @else if (!srcdoc()) {
          <p class="wf__hint">The wireframe could not be loaded.</p>
        }
        <iframe
          #frame
          class="wf__frame"
          title="Wireframe preview"
          sandbox="allow-scripts"
          [srcdoc]="srcdoc()"
          [class.wf__frame--hidden]="loading() || !srcdoc()"
          (load)="onFrameLoad()"
        ></iframe>
      </div>
    </div>
  `,
  styles: [
    `
      .wf { display: flex; flex-direction: column; height: 100%; min-height: 0; gap: 12px; }
      .wf__bar {
        display: flex; align-items: center; gap: 12px;
        padding: 8px 12px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius);
        background: var(--mic-surface-2);
      }
      .wf__tag { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-muted); }
      .wf__inferred {
        font-size: 11px; color: var(--mic-faint); border: 1px dashed var(--mic-border-strong);
        border-radius: 999px; padding: 1px 8px;
      }
      .wf__count { font-size: 12px; color: var(--mic-faint); }
      .wf__nav { margin-left: auto; display: flex; align-items: center; gap: 8px; }
      .wf__btn { padding: 2px 12px; font-size: 18px; line-height: 1; }
      .wf__pos { font-size: 13px; color: var(--mic-ink-2); min-width: 56px; text-align: center; }
      .wf__stage {
        flex: 1; min-height: 0; position: relative;
        border: 1px solid var(--mic-border); border-radius: var(--mic-radius);
        overflow: hidden; background: var(--mic-surface);
      }
      .wf__frame { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
      .wf__frame--hidden { visibility: hidden; }
      .wf__hint { position: absolute; inset: 0; display: grid; place-items: center; color: var(--mic-faint); margin: 0; }
    `,
  ],
})
export class WireframeComponent {
  /** The resolved manifest (kind === 'wireframe'). Drives the slide count. */
  readonly manifest = input.required<ArtifactManifest>();
  /** The owning Project (to fetch the artifact bytes). */
  readonly projectId = input.required<string>();

  /** Slice 4 (issue #11): one annotation the user pinned in the iframe (element /
   *  text-range / whole-slide). The workspace relays it into the chat's durable
   *  feedback queue so it rides the next turn as a scoped revise instruction. */
  readonly annotate = output<Annotation>();

  private readonly api = inject(ApiService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly frame = viewChild<ElementRef<HTMLIFrameElement>>('frame');

  readonly loading = signal(true);
  /**
   * The wireframe HTML, bound to `[srcdoc]`. Angular treats `iframe[srcdoc]` as
   * an HTML security context and would strip our injected `<script>` pager, so
   * we bypass — SAFE because the frame is `sandbox="allow-scripts"` with **no**
   * `allow-same-origin`: an opaque origin that can't touch the app (plan §10).
   */
  readonly srcdoc = signal<SafeHtml | ''>('');
  /** Slide count the iframe pager reports (authoritative once loaded). */
  private readonly reported = signal<number | null>(null);
  readonly current = signal(0);

  /** Total = the pager's reported count once loaded, else the manifest's. */
  readonly total = computed(() => this.reported() ?? this.manifest().slides ?? 0);

  constructor() {
    // (Re)load the artifact whenever the manifest entry changes (live reload on
    // a revise). The effect tracks manifest() + projectId().
    effect(() => {
      const m = this.manifest();
      const id = this.projectId();
      if (!m?.entry || !id) return;
      void this.load(id, m.entry);
    });

    // The sandboxed frame can't reach us except via postMessage; receive its
    // reported slide count + confirmations here.
    window.addEventListener('message', this.onMessage);
  }

  private readonly onMessage = (ev: MessageEvent): void => {
    const data = ev.data as
      | { source?: string; type?: string; total?: number; annotation?: Annotation }
      | null;
    if (!data) return;
    // The Slice-3 pager reports the slide count.
    if (data.source === 'ss-wireframe-pager') {
      if (data.type === 'ready' && typeof data.total === 'number') {
        this.reported.set(data.total);
        // Clamp current into range and show it.
        this.current.update((c) => Math.min(Math.max(c, 0), Math.max(0, data.total! - 1)));
        this.show(this.current());
        this.loading.set(false);
      }
      return;
    }
    // Slice 4: the Annotation SDK queues one pinned annotation. Relay it up so the
    // workspace enqueues it as a composer pill (durable feedback queue, §10).
    if (data.source === 'ss-annotation' && data.type === 'queue' && data.annotation) {
      this.annotate.emit(data.annotation);
    }
  };

  private async load(id: string, entry: string): Promise<void> {
    this.loading.set(true);
    this.reported.set(null);
    const [html, sdk] = await Promise.all([
      this.api.getArtifactContent(id, entry),
      this.api.getAnnotationSdk(),
    ]);
    if (html == null) {
      this.srcdoc.set('');
      this.loading.set(false);
      return;
    }
    // Inject the pager (Slice 3) + the Annotation SDK (Slice 4) before </body>.
    // Bypass HTML sanitization (would strip the injected <script>s); safe under the
    // cross-origin sandbox. See the `srcdoc` field doc.
    const withPager = this.injectPager(html);
    const withSdk = sdk ? this.injectSdk(withPager, sdk) : withPager;
    this.srcdoc.set(this.sanitizer.bypassSecurityTrustHtml(withSdk));
  }

  /** Inject the Annotation SDK before `</body>` (after the pager). The SDK source
   *  is the daemon's single copy, fetched at load. */
  private injectSdk(html: string, sdk: string): string {
    const tag = `<script>${sdk}</script>`;
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${tag}</body>`);
    return html + tag;
  }

  onFrameLoad(): void {
    // The injected pager posts 'ready' with the slide total; if the artifact had
    // no script (or messaging failed), stop the spinner after a beat anyway.
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

  /** Tell the sandboxed pager which slide to display. */
  private show(index: number): void {
    this.frame()?.nativeElement.contentWindow?.postMessage(
      { source: 'ss-wireframe-host', type: 'goto', index },
      '*',
    );
  }

  /**
   * Inject a tiny vanilla-JS pager before `</body>`. It finds the slide
   * elements, hides all but one, reports the count to the host, and responds to
   * `goto` messages. Kept self-contained so the artifact still renders fine when
   * opened standalone (the pager just shows slide 1). Mirrors the slide markers
   * the brainstorm wireframe skeleton emits.
   */
  private injectPager(html: string): string {
    const pager = `
<script>(function(){
  function slides(){
    var sel = ['[data-slide]', '.slide-panel', '.slide', 'body > section'];
    for (var i=0;i<sel.length;i++){ var n=document.querySelectorAll(sel[i]); if(n.length) return [].slice.call(n); }
    return [];
  }
  var els = slides(), idx = 0;
  function render(){ for (var i=0;i<els.length;i++){ els[i].style.display = (i===idx?'':'none'); } }
  function clamp(i){ return Math.max(0, Math.min(i, els.length-1)); }
  window.addEventListener('message', function(ev){
    var d = ev.data || {};
    if (d.source !== 'ss-wireframe-host') return;
    if (d.type === 'goto'){ idx = clamp(d.index|0); render(); }
  });
  if (els.length){ render(); }
  try { parent.postMessage({ source:'ss-wireframe-pager', type:'ready', total: els.length }, '*'); } catch(e){}
})();</script>`;
    if (/<\/body>/i.test(html)) return html.replace(/<\/body>/i, `${pager}</body>`);
    return html + pager;
  }
}
