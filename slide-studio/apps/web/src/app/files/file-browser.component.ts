import { UpperCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DomSanitizer, type SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../core/api.service';
import type { FilesResponse, ProjectRecord, StagedAttachment } from '../core/types';
import { DeckThumbnailComponent } from './deck-thumbnail.component';

const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

/** What the preview pane is currently showing. `deck`/`wireframe` render a live
 *  preview; `source`/`export` show file metadata (+ a download for exports). */
type Selection =
  | { kind: 'deck'; id: string; theme: string; entry: string; slides: number; active: boolean; stale: boolean }
  | { kind: 'wireframe'; entry: string; slides: number }
  | { kind: 'source'; file: StagedAttachment }
  | { kind: 'export'; entry: string; filename: string; format: string; bytes: number }
  | null;

/**
 * The per-project **file browser** (reached from the home library by clicking a
 * deck → `/files/:id`). A read/manage view modelled on Claude's "Design Files":
 * a curated, grouped list of the project's real outputs on the left — Decks (each
 * theme variant), the Wireframe, Source files (the user's attachments), and
 * Exports — and a preview pane on the right. It deliberately omits the chat: to
 * resume the conversation the user clicks **Open in workspace**, which routes to
 * the existing `/workspace/:id`.
 *
 * No new daemon surface is needed: decks/wireframe/exports come from the existing
 * `files` endpoint, attachments from `attachments`, and the deck/wireframe preview
 * reuses the `artifact/content` route via {@link DeckThumbnailComponent}. Exports
 * download through the existing Content-Disposition route; deck/wireframe "Open"
 * opens the artifact standalone (its own full Slide Player shell) in a new tab.
 */
@Component({
  selector: 'ss-file-browser',
  standalone: true,
  imports: [RouterLink, UpperCasePipe, DeckThumbnailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fb">
      <header class="fb__top">
        <a class="fb__back" routerLink="/" aria-label="Back to home">←</a>
        <nav class="fb__crumb" aria-label="Breadcrumb">
          <a routerLink="/">Your decks</a>
          <span class="fb__sep">/</span>
          <span class="fb__here">{{ project()?.title || 'Project' }}</span>
        </nav>
        <a class="mic-btn mic-btn--primary fb__open" [routerLink]="['/workspace', id()]">Open in workspace →</a>
      </header>

      <div class="fb__body">
        <nav class="fb__list" aria-label="Project files">
          @if (decks().length) {
            <h3 class="fb__grp">Decks</h3>
            @for (d of decks(); track d.id) {
              <button
                class="fb__item"
                type="button"
                [class.fb__item--on]="sel()?.kind === 'deck' && idOf(sel()) === d.id"
                (click)="selectDeck(d)"
              >
                <span class="fb__ico fb__ico--accent" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="12" rx="1.5"/><line x1="9" y1="21" x2="15" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </span>
                <span class="fb__txt">
                  <span class="fb__nm">{{ d.theme }} @if (d.active) { <span class="tag">active</span> }</span>
                  <span class="fb__sub">{{ d.slides }} {{ d.slides === 1 ? 'slide' : 'slides' }} · HTML @if (d.stale) { · <span class="fb__stale">wireframe changed</span> }</span>
                </span>
              </button>
            }
          }

          @if (wireframe(); as wf) {
            <h3 class="fb__grp">Wireframe</h3>
            <button
              class="fb__item"
              type="button"
              [class.fb__item--on]="sel()?.kind === 'wireframe'"
              (click)="selectWireframe(wf)"
            >
              <span class="fb__ico" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="4" width="18" height="16" rx="1.5"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="9" x2="9" y2="20"/></svg>
              </span>
              <span class="fb__txt">
                <span class="fb__nm">Wireframe</span>
                <span class="fb__sub">{{ wf.slides }} {{ wf.slides === 1 ? 'slide' : 'slides' }}</span>
              </span>
            </button>
          }

          @if (attachments().length) {
            <h3 class="fb__grp">Source files</h3>
            @for (a of attachments(); track a.relPath) {
              <button
                class="fb__item"
                type="button"
                [class.fb__item--on]="sel()?.kind === 'source' && idOf(sel()) === a.relPath"
                (click)="selectSource(a)"
              >
                <span class="fb__ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>
                </span>
                <span class="fb__txt">
                  <span class="fb__nm">{{ a.filename }}</span>
                  <span class="fb__sub">{{ a.category }} · {{ size(a.bytes) }}</span>
                </span>
              </button>
            }
          }

          @if (exports().length) {
            <h3 class="fb__grp">Exports</h3>
            @for (e of exports(); track e.entry) {
              <button
                class="fb__item"
                type="button"
                [class.fb__item--on]="sel()?.kind === 'export' && idOf(sel()) === e.entry"
                (click)="selectExport(e)"
              >
                <span class="fb__ico" aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v12"/><path d="m7 12 5 5 5-5"/><path d="M5 21h14"/></svg>
                </span>
                <span class="fb__txt">
                  <span class="fb__nm">{{ e.filename }}</span>
                  <span class="fb__sub">{{ e.format | uppercase }} · {{ size(e.bytes) }}</span>
                </span>
              </button>
            }
          }

          @if (loaded() && empty()) {
            <p class="fb__empty">Nothing here yet. Open this in the workspace to start building.</p>
          }
        </nav>

        <section class="fb__preview" aria-label="Preview">
          @if (sel(); as s) {
            @switch (s.kind) {
              @case ('deck') {
                <div class="pv__stage"><ss-deck-thumbnail [projectId]="id()" [entry]="s.entry" [lazy]="false" /></div>
                <div class="pv__foot">
                  <div class="pv__meta">
                    <span class="pv__name">{{ s.theme }}</span>
                    <span class="pv__sub">{{ s.slides }} slides · HTML @if (s.active) { · active } @if (s.stale) { · wireframe changed }</span>
                  </div>
                  <a class="mic-btn" [href]="standaloneHref(s.entry)" target="_blank" rel="noopener">Open ↗</a>
                </div>
              }
              @case ('wireframe') {
                <div class="pv__stage"><ss-deck-thumbnail [projectId]="id()" [entry]="s.entry" [lazy]="false" placeholder="Wireframe" /></div>
                <div class="pv__foot">
                  <div class="pv__meta">
                    <span class="pv__name">Wireframe</span>
                    <span class="pv__sub">{{ s.slides }} slides</span>
                  </div>
                  <a class="mic-btn" [href]="standaloneHref(s.entry)" target="_blank" rel="noopener">Open ↗</a>
                </div>
              }
              @case ('export') {
                <div class="pv__file">
                  <span class="pv__fileico" aria-hidden="true">{{ s.format | uppercase }}</span>
                  <span class="pv__name">{{ s.filename }}</span>
                  <span class="pv__sub">{{ s.format | uppercase }} · {{ size(s.bytes) }}</span>
                  <a class="mic-btn mic-btn--primary" [href]="downloadHref(s.entry)">Download</a>
                </div>
              }
              @case ('source') {
                @if (isImage(s.file.filename)) {
                  <div class="pv__stage pv__stage--img">
                    <img [src]="attachmentHref(s.file.relPath)" [alt]="s.file.filename" />
                  </div>
                  <div class="pv__foot">
                    <div class="pv__meta">
                      <span class="pv__name">{{ s.file.filename }}</span>
                      <span class="pv__sub">{{ s.file.category }} · {{ size(s.file.bytes) }}</span>
                    </div>
                    <a class="mic-btn" [href]="attachmentHref(s.file.relPath)" [attr.download]="s.file.filename">Download</a>
                  </div>
                } @else if (isPdf(s.file.filename) && pdfSrc(); as pdf) {
                  <div class="pv__stage pv__stage--pdf">
                    <iframe [src]="pdf" title="PDF preview"></iframe>
                  </div>
                  <div class="pv__foot">
                    <div class="pv__meta">
                      <span class="pv__name">{{ s.file.filename }}</span>
                      <span class="pv__sub">{{ s.file.category }} · {{ size(s.file.bytes) }}</span>
                    </div>
                    <a class="mic-btn" [href]="attachmentHref(s.file.relPath)" [attr.download]="s.file.filename">Download</a>
                  </div>
                } @else {
                  <div class="pv__file">
                    <span class="pv__fileico" aria-hidden="true">{{ ext(s.file.filename) }}</span>
                    <span class="pv__name">{{ s.file.filename }}</span>
                    <span class="pv__sub">{{ s.file.category }} · {{ size(s.file.bytes) }}</span>
                    <a class="mic-btn mic-btn--primary" [href]="attachmentHref(s.file.relPath)" [attr.download]="s.file.filename">Download</a>
                    <p class="pv__note">Preview isn't available for this file type — download to open it.</p>
                  </div>
                }
              }
            }
          } @else {
            <p class="pv__empty">Select a file to preview it.</p>
          }
        </section>
      </div>
    </div>
  `,
  styles: [
    `
      .fb { min-height: 100vh; display: flex; flex-direction: column; }
      .fb__top {
        display: flex; align-items: center; gap: 12px; padding: 12px 20px;
        /* Reserve space on the right so the breadcrumb / actions never slide under
           the app shell's fixed light/dark toggle (top: 14px; right: 16px). */
        padding-right: 116px;
        border-bottom: 1px solid var(--mic-border); background: var(--mic-surface);
      }
      .fb__back { text-decoration: none; color: var(--mic-ink-2); font-size: 18px; line-height: 1; padding: 2px 6px; border-radius: var(--mic-radius-sm); }
      .fb__back:hover { background: var(--mic-surface-2); }
      .fb__crumb { display: flex; align-items: center; gap: 8px; font-size: 14px; min-width: 0; }
      .fb__crumb a { color: var(--mic-muted); text-decoration: none; }
      .fb__crumb a:hover { color: var(--mic-accent); }
      .fb__sep { color: var(--mic-faint); }
      .fb__here { font-weight: 600; color: var(--mic-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .fb__open { margin-left: auto; text-decoration: none; white-space: nowrap; }
      .fb__body { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(280px, 360px) 1fr; }
      .fb__list { padding: 8px 14px 28px; border-right: 1px solid var(--mic-border); overflow: auto; }
      .fb__grp { margin: 16px 2px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mic-faint); }
      .fb__item {
        display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; margin-bottom: 5px;
        padding: 8px 10px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius);
        background: var(--mic-surface); color: var(--mic-ink); cursor: pointer; font: inherit;
      }
      .fb__item:hover { border-color: var(--mic-border-strong); }
      .fb__item--on { border-color: var(--mic-accent); background: var(--mic-surface-2); }
      .fb__ico {
        flex: 0 0 auto; width: 28px; height: 28px; display: grid; place-items: center;
        border-radius: var(--mic-radius-sm); background: var(--mic-surface-2); color: var(--mic-muted);
      }
      .fb__ico--accent { color: var(--mic-accent); }
      .fb__txt { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .fb__nm { font-size: 13px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .fb__sub { font-size: 11px; color: var(--mic-faint); }
      .fb__stale { color: var(--mic-accent); }
      .tag { font-size: 10px; padding: 1px 6px; border-radius: 999px; background: var(--mic-accent-soft); color: var(--mic-accent-strong); vertical-align: middle; }
      .fb__empty, .pv__empty { margin: 16px 2px; font-size: 13px; color: var(--mic-faint); }

      .fb__preview { padding: 24px; display: flex; flex-direction: column; gap: 16px; align-items: stretch; overflow: auto; }
      .pv__stage { border: 1px solid var(--mic-border); border-radius: var(--mic-radius); overflow: hidden; background: var(--mic-surface-2); }
      .pv__stage--img { display: grid; place-items: center; padding: 16px; }
      .pv__stage--img img { max-width: 100%; max-height: 60vh; object-fit: contain; display: block; }
      .pv__stage--pdf { height: 70vh; }
      .pv__stage--pdf iframe { width: 100%; height: 100%; border: 0; display: block; background: #fff; }
      .pv__foot { display: flex; align-items: center; gap: 12px; }
      .pv__meta { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
      .pv__name { font-size: 15px; font-weight: 600; }
      .pv__sub { font-size: 12px; color: var(--mic-faint); }
      .pv__foot .mic-btn { margin-left: auto; text-decoration: none; }
      .pv__empty { display: grid; place-items: center; height: 100%; }
      .pv__file {
        margin: auto; max-width: 360px; display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center;
        padding: 32px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface);
      }
      .pv__fileico {
        width: 64px; height: 64px; display: grid; place-items: center; border-radius: var(--mic-radius);
        background: var(--mic-surface-2); color: var(--mic-muted); font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;
      }
      .pv__file .mic-btn { margin-top: 8px; text-decoration: none; }
      .pv__note { margin: 4px 0 0; font-size: 12px; color: var(--mic-faint); }

      @media (max-width: 760px) {
        .fb__body { grid-template-columns: 1fr; }
        .fb__list { border-right: 0; border-bottom: 1px solid var(--mic-border); }
      }
    `,
  ],
})
export class FileBrowserComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  readonly id = signal(this.route.snapshot.paramMap.get('id') ?? '');
  /** A trusted resource URL for the selected PDF source file (set in selectSource
   *  so the iframe binding stays stable across change detection). */
  readonly pdfSrc = signal<SafeResourceUrl | null>(null);
  readonly project = signal<ProjectRecord | null>(null);
  private readonly files = signal<FilesResponse | null>(null);
  readonly attachments = signal<StagedAttachment[]>([]);
  readonly loaded = signal(false);
  readonly sel = signal<Selection>(null);

  readonly decks = computed(() => this.files()?.decks ?? []);
  readonly wireframe = computed(() => this.files()?.wireframe ?? null);
  readonly exports = computed(() => this.files()?.exports ?? []);
  readonly empty = computed(
    () => !this.decks().length && !this.wireframe() && !this.attachments().length && !this.exports().length,
  );

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const id = this.id();
    if (!id) {
      this.loaded.set(true);
      return;
    }
    const [project, files, attachments] = await Promise.all([
      this.api.getProject(id),
      this.api.listFiles(id),
      this.api.listAttachments(id),
    ]);
    this.project.set(project);
    this.files.set(files);
    this.attachments.set(attachments);
    this.loaded.set(true);
    this.selectDefault();
  }

  /** Default the preview to the active deck (or first), else the wireframe, else
   *  the first export — so opening a project lands on something useful. */
  private selectDefault(): void {
    const decks = this.decks();
    const active = decks.find((d) => d.active) ?? decks[0];
    if (active) {
      this.selectDeck(active);
      return;
    }
    const wf = this.wireframe();
    if (wf) {
      this.selectWireframe(wf);
      return;
    }
    const ex = this.exports()[0];
    if (ex) this.selectExport(ex);
  }

  selectDeck(d: FilesResponse['decks'][number]): void {
    this.sel.set({ kind: 'deck', id: d.id, theme: d.theme, entry: d.file, slides: d.slides, active: d.active, stale: d.stale });
  }

  selectWireframe(wf: NonNullable<FilesResponse['wireframe']>): void {
    this.sel.set({ kind: 'wireframe', entry: wf.entry, slides: wf.slides });
  }

  selectSource(file: StagedAttachment): void {
    this.sel.set({ kind: 'source', file });
    // Pre-build the PDF iframe's trusted URL once per selection (the file is the
    // user's own upload, served same-origin by the daemon).
    this.pdfSrc.set(
      this.isPdf(file.filename)
        ? this.sanitizer.bypassSecurityTrustResourceUrl(this.attachmentHref(file.relPath))
        : null,
    );
  }

  selectExport(e: FilesResponse['exports'][number]): void {
    this.sel.set({ kind: 'export', entry: e.entry, filename: e.filename, format: e.format, bytes: e.bytes });
  }

  /** The stable id for the currently-selected row, used to highlight the list. */
  idOf(s: Selection): string {
    if (!s) return '';
    if (s.kind === 'deck') return s.id;
    if (s.kind === 'source') return s.file.relPath;
    if (s.kind === 'export') return s.entry;
    return 'wireframe';
  }

  /** Open the artifact standalone (its own full Slide Player shell) in a new tab. */
  standaloneHref(entry: string): string {
    return `/api/projects/${encodeURIComponent(this.id())}/artifact/content?entry=${encodeURIComponent(entry)}`;
  }

  downloadHref(entry: string): string {
    return this.api.exportDownloadUrl(this.id(), entry);
  }

  /** Served URL for a staged source file (preview <img>/<iframe> + download). */
  attachmentHref(relPath: string): string {
    return this.api.attachmentContentUrl(this.id(), relPath);
  }

  /** The file's extension, lower-cased, no dot ('' when none). */
  private extOf(filename: string): string {
    const i = filename.lastIndexOf('.');
    return i >= 0 ? filename.slice(i + 1).toLowerCase() : '';
  }

  /** Upper-cased extension for the non-previewable file card's badge. */
  ext(filename: string): string {
    return this.extOf(filename).toUpperCase() || 'FILE';
  }

  isImage(filename: string): boolean {
    return IMAGE_EXTS.includes(this.extOf(filename));
  }

  isPdf(filename: string): boolean {
    return this.extOf(filename) === 'pdf';
  }

  size(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
