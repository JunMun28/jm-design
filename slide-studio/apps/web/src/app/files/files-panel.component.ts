import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { FilesResponse } from '../core/types';

@Component({
  selector: 'ss-files-panel',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="files" aria-label="Project files">
      <div class="files__group">
        <h3 class="files__label">Wireframe</h3>
        @if (files()?.wireframe; as wf) {
          <button class="files__item" [class.files__item--active]="activeKind() === 'wireframe'" (click)="openWireframe.emit()">
            <span class="files__name">Wireframe</span><span class="files__meta">{{ wf.slides }} slides</span>
          </button>
        } @else { <p class="files__empty">None yet</p> }
      </div>
      <div class="files__group">
        <h3 class="files__label">Decks</h3>
        @for (d of files()?.decks ?? []; track d.id) {
          <button class="files__item" [class.files__item--active]="d.active && activeKind() === 'deck'" (click)="openDeck.emit(d.id)">
            <span class="files__name">{{ d.theme }}</span>
            <span class="files__meta">{{ d.slides }} slides @if (d.stale) { · <span class="files__stale" title="The wireframe changed after this was generated">wireframe changed</span> }</span>
          </button>
        } @empty { <p class="files__empty">No decks yet</p> }
      </div>
      <div class="files__group">
        <h3 class="files__label">Exports</h3>
        @for (e of files()?.exports ?? []; track e.entry) {
          <a class="files__item" [href]="downloadHref()(e.entry)"><span class="files__name">{{ e.filename }}</span><span class="files__meta">{{ e.format }}</span></a>
        } @empty { <p class="files__empty">No exports yet</p> }
      </div>
    </nav>
  `,
  styles: [`
    .files { display: flex; flex-direction: column; gap: 16px; padding: 12px; overflow: auto; height: 100%; }
    .files__group { display: flex; flex-direction: column; gap: 4px; }
    .files__label { margin: 0 0 4px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--mic-faint); }
    .files__item { display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%; text-align: left;
      padding: 7px 9px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface);
      color: var(--mic-ink); cursor: pointer; text-decoration: none; font-size: 13px; }
    .files__item:hover { border-color: var(--mic-border-strong); }
    .files__item--active { border-color: var(--mic-accent); background: var(--mic-surface-2); }
    .files__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .files__meta { flex: 0 0 auto; font-size: 11px; color: var(--mic-faint); }
    .files__stale { color: var(--mic-accent); }
    .files__empty { margin: 0; font-size: 12px; color: var(--mic-faint); }
  `],
})
export class FilesPanelComponent {
  readonly files = input.required<FilesResponse | null>();
  /** Which canvas is currently shown, so the matching item highlights. */
  readonly activeKind = input<'deck' | 'wireframe' | null>(null);
  /** Builds an export download href for an entry (workspace supplies it). */
  readonly downloadHref = input.required<(entry: string) => string>();
  readonly openDeck = output<string>();    // deck variant id
  readonly openWireframe = output<void>();
}
