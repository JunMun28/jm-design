import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import type { SkippedAttachment } from '../core/types';

/**
 * Attachment intake control (Slice 8, issue #9, §9.5). The shared attach
 * affordance on BOTH the Home composer and the chat composer: a paperclip
 * button + hidden file input, a drag-and-drop welcome over the composer, the
 * selected source files shown as **removable chips**, and a friendly "skipped /
 * couldn't read / too large" note surfaced from the daemon (AC2) — which NEVER
 * blocks the flow.
 *
 * This control is intentionally "dumb" about WHEN to upload: it owns the pending
 * file selection and emits `filesChanged` so the parent can decide. The Home
 * composer holds the selection until the Project exists, then uploads; the chat
 * composer uploads immediately against the live Project. After an upload the
 * parent calls {@link clear} (and {@link showNotes} to surface skipped files).
 */
@Component({
  selector: 'ss-attach-control',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="attach"
      [class.attach--drag]="dragging()"
      (dragenter)="onDragOver($event)"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      <button
        type="button"
        class="attach__btn"
        [class.attach__btn--compact]="compact()"
        [disabled]="disabled()"
        (click)="picker.click()"
        aria-label="Attach source files"
        title="Attach source files (CSV, Excel, PDF, PowerPoint, images)"
      >
        <!-- Paperclip -->
        <svg class="attach__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        @if (!compact()) {
          <span class="attach__btn-label">Attach</span>
        }
      </button>

      <input
        #picker
        type="file"
        class="attach__input"
        multiple
        [accept]="acceptAttr"
        (change)="onPicked($event)"
        hidden
      />

      @if (dragging()) {
        <div class="attach__hint" aria-hidden="true">Drop source files to attach</div>
      }
    </div>

    @if (files().length) {
      <div class="attach__chips" aria-label="Attached files">
        @for (f of files(); track f.name + f.size) {
          <span class="attach-chip" [class.attach-chip--busy]="disabled()">
            <span class="attach-chip__name" [title]="f.name">{{ f.name }}</span>
            <span class="attach-chip__size">{{ prettySize(f.size) }}</span>
            <button
              type="button"
              class="attach-chip__x"
              aria-label="Remove attachment"
              [disabled]="disabled()"
              (click)="remove(f)"
            >×</button>
          </span>
        }
      </div>
    }

    <!-- AC2: friendly "skipped / couldn't read / too large" note — never a raw
         error, never blocks the flow. -->
    @if (notes().length) {
      <div class="attach__notes" role="status">
        @for (n of notes(); track n.filename + n.reason) {
          <p class="attach__note">{{ n.note }}</p>
        }
        <button type="button" class="attach__notes-dismiss" (click)="notes.set([])">Dismiss</button>
      </div>
    }
  `,
  styles: [
    `
      :host { display: block; }
      .attach { position: relative; display: inline-flex; }
      .attach--drag::after {
        content: ''; position: fixed; inset: 0; z-index: 1; pointer-events: none;
      }
      .attach__btn {
        display: inline-flex; align-items: center; gap: 6px; font: inherit; font-size: 13px;
        padding: 8px 12px; border-radius: var(--mic-radius-sm);
        border: 1px solid var(--mic-border-strong); background: var(--mic-surface); color: var(--mic-ink-2);
        cursor: pointer;
      }
      .attach__btn:hover:not(:disabled) { border-color: var(--mic-accent); color: var(--mic-accent); }
      .attach__btn:disabled { opacity: 0.55; cursor: not-allowed; }
      .attach__btn:focus-visible { outline: 3px solid var(--mic-accent-soft); border-color: var(--mic-accent); }
      /* Icon-only ghost variant for the in-composer attach (chat). Home keeps the label. */
      .attach__btn--compact {
        width: 34px; height: 34px; padding: 0; justify-content: center; gap: 0;
        border-radius: 999px; background: transparent; border-color: transparent; color: var(--mic-muted);
      }
      .attach__btn--compact:hover:not(:disabled) { background: var(--mic-surface-2); border-color: transparent; color: var(--mic-accent); }
      .attach__icon { flex: 0 0 auto; }
      .attach__hint {
        position: absolute; left: 0; bottom: calc(100% + 6px); white-space: nowrap;
        font-size: 12px; padding: 6px 10px; border-radius: var(--mic-radius-sm);
        background: var(--mic-accent); color: var(--mic-on-accent);
      }

      .attach__chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
      .attach-chip {
        display: inline-flex; align-items: center; gap: 6px; max-width: 100%;
        padding: 4px 6px 4px 10px; border-radius: 999px; font-size: 12px;
        background: var(--mic-surface); border: 1px solid var(--mic-border-strong); color: var(--mic-ink);
      }
      .attach-chip--busy { opacity: 0.7; }
      .attach-chip__name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 220px; }
      .attach-chip__size { color: var(--mic-faint); }
      .attach-chip__x {
        border: none; background: none; cursor: pointer; color: var(--mic-muted);
        font-size: 15px; line-height: 1; padding: 0 2px;
      }
      .attach-chip__x:hover:not(:disabled) { color: var(--mic-ink); }
      .attach-chip__x:disabled { opacity: 0.5; cursor: not-allowed; }

      .attach__notes {
        margin-top: 8px; padding: 10px 12px; border-radius: var(--mic-radius-sm);
        border: 1px solid var(--mic-warn-border, #e6c200); background: var(--mic-warn-bg, #fff8e6);
        color: var(--mic-warn-ink, #5a4500);
      }
      .attach__note { margin: 0 0 6px; font-size: 13px; line-height: 1.45; }
      .attach__note:last-of-type { margin-bottom: 8px; }
      .attach__notes-dismiss {
        border: none; background: none; cursor: pointer; padding: 0;
        font: inherit; font-size: 12px; color: var(--mic-warn-ink, #5a4500); text-decoration: underline;
      }
    `,
  ],
})
export class AttachControlComponent {
  /** Emitted whenever the pending selection changes (parent reads `currentFiles`). */
  readonly filesChanged = output<File[]>();

  /** Render the trigger as an icon-only ghost button (no "Attach" label) — used
   *  inside the chat composer's action bar. Home keeps the labeled pill. */
  readonly compact = input(false);

  /** The pending source files the user has chosen but not yet had cleared by the
   *  parent (rendered as removable chips). */
  readonly files = signal<File[]>([]);
  /** Friendly notes for files the daemon skipped (AC2). Cleared on dismiss. */
  readonly notes = signal<SkippedAttachment[]>([]);
  /** True while the parent is uploading — disables the controls without blocking. */
  readonly disabled = signal(false);
  readonly dragging = signal(false);

  /** The accepted source-file extensions, mirrored from the daemon's
   *  ACCEPTED_EXTENSIONS (src/attachments.ts) so the picker filters sensibly.
   *  The daemon is still the source of truth — anything else is skipped (AC2). */
  readonly acceptAttr =
    '.csv,.tsv,.xlsx,.xls,.pptx,.pdf,.docx,.doc,.txt,.md,.json,.png,.jpg,.jpeg,.gif,.webp,.svg';

  /** The current pending selection (the parent uploads these, then calls clear). */
  currentFiles(): File[] {
    return this.files();
  }

  /** Clear the pending selection (after the parent uploads them). */
  clear(): void {
    if (!this.files().length) return;
    this.files.set([]);
    this.filesChanged.emit([]);
  }

  /** Surface the daemon's friendly skipped notes (AC2). */
  showNotes(skipped: SkippedAttachment[]): void {
    this.notes.set(skipped ?? []);
  }

  onPicked(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    this.add(input.files);
    // Reset so re-selecting the same file fires `change` again.
    input.value = '';
  }

  onDragOver(ev: DragEvent): void {
    if (this.disabled()) return;
    ev.preventDefault();
    ev.stopPropagation();
    this.dragging.set(true);
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.dragging.set(false);
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    ev.stopPropagation();
    this.dragging.set(false);
    if (this.disabled()) return;
    this.add(ev.dataTransfer?.files ?? null);
  }

  remove(file: File): void {
    this.files.update((list) => list.filter((f) => f !== file));
    this.filesChanged.emit(this.files());
  }

  /** Append the picked / dropped files, de-duped by name+size. */
  private add(picked: FileList | null): void {
    if (this.disabled() || !picked || !picked.length) return;
    const incoming = [...picked];
    this.files.update((list) => {
      const seen = new Set(list.map((f) => `${f.name}:${f.size}`));
      const next = [...list];
      for (const f of incoming) {
        const key = `${f.name}:${f.size}`;
        if (!seen.has(key)) {
          seen.add(key);
          next.push(f);
        }
      }
      return next;
    });
    this.filesChanged.emit(this.files());
  }

  prettySize(bytes: number): string {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }
}
