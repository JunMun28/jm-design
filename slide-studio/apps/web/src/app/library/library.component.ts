import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { DeckThumbnailComponent } from '../files/deck-thumbnail.component';
import type { FlowStage, ProjectRecord } from '../core/types';

/** Library sort orders the <select> offers. */
type SortKey = 'recent' | 'oldest' | 'name';

/**
 * Deck Library (`/`, CONTEXT.md "Deck Library"). The landing screen for a
 * returning user: a grid (or list) of cards, one per past Project, each with a
 * live slide preview, its stage badge, date, and the active deck's slide count.
 *
 * Split out of the old single-screen Home (which also held the composer); the
 * composer now lives at `/new` in {@link ComposerComponent}. Clicking a card opens
 * the Workspace for that Project; "Create new" routes to the Composer. Cards carry
 * a ⋮ menu for inline Rename + Delete.
 *
 * Landing rule (CONTEXT.md): no runtime ready → `/welcome`; zero Projects → `/new`;
 * else show the Library.
 */
@Component({
  selector: 'ss-library',
  standalone: true,
  imports: [FormsModule, DatePipe, DeckThumbnailComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib">
      <div class="lib__center">
        <header class="lib__head">
          <h1 class="lib__title">Your decks <span class="lib__count">· {{ recents().length }}</span></h1>
          <button class="mic-btn mic-btn--primary lib__create" type="button" (click)="createNew()">Create new</button>
        </header>

        <div class="toolbar">
          <input
            class="toolbar__search"
            type="search"
            [(ngModel)]="search"
            name="search"
            placeholder="Search decks…"
            aria-label="Search decks by title"
            autocomplete="off"
          />
          <select class="toolbar__sort" [(ngModel)]="sort" name="sort" aria-label="Sort decks">
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
            <option value="name">Name A–Z</option>
          </select>
          <div class="seg" role="group" aria-label="Library layout">
            <button class="seg__btn" type="button" [class.seg__btn--on]="view() === 'cards'" [attr.aria-pressed]="view() === 'cards'" (click)="setView('cards')">Cards</button>
            <button class="seg__btn" type="button" [class.seg__btn--on]="view() === 'list'" [attr.aria-pressed]="view() === 'list'" (click)="setView('list')">List</button>
          </div>
        </div>

        @if (view() === 'cards') {
          <ul class="cards">
            <li>
              <button class="card card--new" type="button" (click)="createNew()" aria-label="Create new deck">
                <span class="card-new__plus" aria-hidden="true">+</span>
                <span class="card-new__label">Create new</span>
              </button>
            </li>
            @for (p of visible(); track p.id) {
              <li>
                <div class="card" [class.card--menu]="openMenuId() === p.id">
                  <button class="card__open" type="button" (click)="openWorkspace(p)" [attr.aria-label]="'Open ' + p.title">
                    <ss-deck-thumbnail class="card__thumb" [projectId]="p.id" [entry]="deckEntry(p)" [placeholder]="stageLabel(p.stage)" />
                  </button>
                  <div class="card__foot">
                    @if (editingId() === p.id) {
                      <input
                        class="card__rename"
                        type="text"
                        [value]="p.title"
                        aria-label="Rename deck"
                        (click)="$event.stopPropagation()"
                        (keydown.enter)="commitRename(p, $event)"
                        (keydown.escape)="cancelRename($event)"
                        (blur)="commitRename(p, $event)"
                      />
                    } @else {
                      <button class="card__name" type="button" (click)="openWorkspace(p)">{{ p.title }}</button>
                    }
                    <span class="card__row">
                      <span class="badge" [class.badge--soft]="p.stage !== 'deck'">{{ stageLabel(p.stage) }}</span>
                      <span class="card__meta">
                        @if (slideCount(p.id); as n) {
                          <span class="card__slides">· {{ n }} {{ n === 1 ? 'slide' : 'slides' }}</span>
                        }
                        <span class="card__date">{{ p.updatedAt | date: 'mediumDate' }}</span>
                      </span>
                    </span>
                  </div>

                  <button
                    class="card__more"
                    type="button"
                    aria-label="Deck options"
                    [attr.aria-expanded]="openMenuId() === p.id"
                    (click)="toggleMenu(p.id, $event)"
                  >⋮</button>
                  @if (openMenuId() === p.id) {
                    <div class="menu" role="menu" (click)="$event.stopPropagation()">
                      <button class="menu__item" type="button" role="menuitem" (click)="startRename(p, $event)">Rename</button>
                      <button class="menu__item menu__item--danger" type="button" role="menuitem" (click)="remove(p, $event)">Delete</button>
                    </div>
                  }
                </div>
              </li>
            }
          </ul>
        } @else {
          <ul class="rows">
            @for (p of visible(); track p.id) {
              <li>
                <div class="row" [class.row--menu]="openMenuId() === p.id">
                  @if (editingId() === p.id) {
                    <div class="row__open row__open--edit">
                      <input
                        class="row__rename"
                        type="text"
                        [value]="p.title"
                        aria-label="Rename deck"
                        (click)="$event.stopPropagation()"
                        (keydown.enter)="commitRename(p, $event)"
                        (keydown.escape)="cancelRename($event)"
                        (blur)="commitRename(p, $event)"
                      />
                    </div>
                  } @else {
                    <button class="row__open" type="button" (click)="openWorkspace(p)" [attr.aria-label]="'Open ' + p.title">
                      <span class="row__name">{{ p.title }}</span>
                      <span class="badge" [class.badge--soft]="p.stage !== 'deck'">{{ stageLabel(p.stage) }}</span>
                      @if (slideCount(p.id); as n) {
                        <span class="row__slides">{{ n }} {{ n === 1 ? 'slide' : 'slides' }}</span>
                      }
                      <span class="row__date">{{ p.updatedAt | date: 'medium' }}</span>
                    </button>
                  }
                  <button
                    class="row__more"
                    type="button"
                    aria-label="Deck options"
                    [attr.aria-expanded]="openMenuId() === p.id"
                    (click)="toggleMenu(p.id, $event)"
                  >⋮</button>
                  @if (openMenuId() === p.id) {
                    <div class="menu menu--row" role="menu" (click)="$event.stopPropagation()">
                      <button class="menu__item" type="button" role="menuitem" (click)="startRename(p, $event)">Rename</button>
                      <button class="menu__item menu__item--danger" type="button" role="menuitem" (click)="remove(p, $event)">Delete</button>
                    </div>
                  }
                </div>
              </li>
            }
          </ul>
        }

        @if (recents().length && !visible().length) {
          <p class="lib__empty">No decks match “{{ search() }}”.</p>
        }
      </div>
    </div>
  `,
  styles: [
    `
      /* Top-align so a returning user sees their recent decks without scrolling
         past a full-viewport empty hero. */
      .lib { min-height: 100vh; display: grid; place-items: start center; padding: 7vh 20px 48px; }
      .lib__center { width: 100%; max-width: 960px; }
      .lib__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 0 18px; }
      .lib__title { font-size: 22px; font-weight: 600; margin: 0; letter-spacing: -0.01em; }
      .lib__count { color: var(--mic-faint); font-weight: 400; }
      .lib__create { white-space: nowrap; }

      .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 18px; }
      .toolbar__search {
        flex: 1; min-width: 180px; font: inherit; padding: 8px 12px; border-radius: var(--mic-radius-sm);
        border: 1px solid var(--mic-border-strong); background: var(--mic-surface); color: var(--mic-ink);
      }
      .toolbar__search:focus-visible { outline: 3px solid var(--mic-accent-soft); border-color: var(--mic-accent); }
      .toolbar__sort { font: inherit; padding: 8px 12px; border-radius: var(--mic-radius-sm); border: 1px solid var(--mic-border-strong); background: var(--mic-surface); color: var(--mic-ink); }
      .toolbar__sort:focus-visible { outline: 3px solid var(--mic-accent-soft); border-color: var(--mic-accent); }
      .seg { display: inline-flex; border: 1px solid var(--mic-border-strong); border-radius: var(--mic-radius-sm); overflow: hidden; }
      .seg__btn { font: inherit; font-size: 13px; padding: 7px 14px; border: 0; background: var(--mic-surface); color: var(--mic-muted); cursor: pointer; }
      .seg__btn + .seg__btn { border-left: 1px solid var(--mic-border); }
      .seg__btn--on { background: var(--mic-accent); color: #fff; }
      .seg__btn:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: -3px; }

      .cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px; }
      .card { position: relative; width: 100%; height: 100%; display: flex; flex-direction: column; overflow: visible; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface); color: var(--mic-ink); }
      .card:hover { border-color: var(--mic-accent); }
      .card--menu { border-color: var(--mic-accent); z-index: 5; }
      .card__open { width: 100%; display: block; font: inherit; text-align: left; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; border-radius: var(--mic-radius) var(--mic-radius) 0 0; overflow: hidden; }
      .card__open:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: -2px; }
      .card__thumb { display: block; border-bottom: 1px solid var(--mic-border); }
      .card__foot { display: flex; flex-direction: column; gap: 8px; padding: 10px 12px; }
      .card__name { display: block; max-width: 100%; font: inherit; text-align: left; font-size: 14px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0 24px 0 0; border: 0; background: none; color: var(--mic-ink); cursor: pointer; }
      .card__name:hover { color: var(--mic-accent); }
      .card__name:focus-visible { outline: 3px solid var(--mic-accent-soft); border-radius: var(--mic-radius-sm); }
      .card__rename {
        font: inherit; font-size: 14px; font-weight: 500; width: 100%; padding: 3px 6px;
        border: 1px solid var(--mic-accent); border-radius: var(--mic-radius-sm); background: var(--mic-surface); color: var(--mic-ink);
      }
      .card__rename:focus-visible { outline: 3px solid var(--mic-accent-soft); }
      .card__row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .card__meta { display: inline-flex; align-items: center; gap: 6px; min-width: 0; }
      .card__slides { font-size: 12px; color: var(--mic-faint); white-space: nowrap; }
      .card__date { font-size: 12px; color: var(--mic-faint); white-space: nowrap; }

      .card--new { align-items: center; justify-content: center; gap: 8px; min-height: 168px; border-style: dashed; background: var(--mic-surface-2); color: var(--mic-muted); cursor: pointer; font: inherit; }
      .card--new:hover { border-color: var(--mic-accent); color: var(--mic-accent); }
      .card--new:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: 1px; }
      .card-new__plus { font-size: 30px; line-height: 1; font-weight: 300; }
      .card-new__label { font-size: 13px; font-weight: 500; }

      .card__more, .row__more {
        position: absolute; top: 8px; right: 8px; width: 28px; height: 28px; display: grid; place-items: center;
        border: 0; border-radius: var(--mic-radius-sm); background: var(--mic-surface); color: var(--mic-muted);
        font-size: 18px; line-height: 1; cursor: pointer; opacity: 0; box-shadow: 0 0 0 1px var(--mic-border);
      }
      .card:hover .card__more, .card:focus-within .card__more, .card--menu .card__more,
      .row:hover .row__more, .row:focus-within .row__more, .row--menu .row__more { opacity: 1; }
      .card__more:hover, .row__more:hover { color: var(--mic-ink); }
      .card__more:focus-visible, .row__more:focus-visible { opacity: 1; outline: 3px solid var(--mic-accent-soft); }

      .menu {
        position: absolute; top: 38px; right: 8px; z-index: 10; min-width: 132px; padding: 4px;
        display: flex; flex-direction: column; border: 1px solid var(--mic-border-strong); border-radius: var(--mic-radius-sm);
        background: var(--mic-surface); box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
      }
      .menu--row { top: 40px; }
      .menu__item { font: inherit; font-size: 13px; text-align: left; padding: 7px 10px; border: 0; border-radius: var(--mic-radius-sm); background: none; color: var(--mic-ink); cursor: pointer; }
      .menu__item:hover { background: var(--mic-surface-2); }
      .menu__item:focus-visible { outline: 3px solid var(--mic-accent-soft); }
      .menu__item--danger { color: var(--mic-danger, #c0392b); }

      .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
      .row { position: relative; width: 100%; }
      .row--menu { z-index: 5; }
      .row__open { width: 100%; display: flex; align-items: center; gap: 12px; font: inherit; text-align: left; padding: 11px 44px 11px 14px; border-radius: var(--mic-radius-sm); border: 1px solid var(--mic-border); background: var(--mic-surface); color: var(--mic-ink); cursor: pointer; }
      .row__open--edit { cursor: default; }
      button.row__open:hover { border-color: var(--mic-accent); background: var(--mic-surface-2); }
      .row__open:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: 1px; }
      .row__name { font-size: 14px; font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .row__rename {
        font: inherit; font-size: 14px; font-weight: 500; flex: 1; padding: 3px 6px;
        border: 1px solid var(--mic-accent); border-radius: var(--mic-radius-sm); background: var(--mic-surface); color: var(--mic-ink);
      }
      .row__rename:focus-visible { outline: 3px solid var(--mic-accent-soft); }
      .row__slides { color: var(--mic-faint); font-size: 13px; white-space: nowrap; }
      .row__date { color: var(--mic-faint); font-size: 13px; white-space: nowrap; }

      .badge { font-size: 11px; padding: 2px 9px; border-radius: 999px; background: var(--mic-accent-soft); color: var(--mic-accent-strong); white-space: nowrap; }
      .badge--soft { background: var(--mic-surface-2); color: var(--mic-muted); }

      .lib__empty { margin-top: 24px; color: var(--mic-muted); font-size: 14px; }
    `,
  ],
})
export class LibraryComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  /** Past Projects (newest-first from the daemon). */
  readonly recents = signal<ProjectRecord[]>([]);
  /** Instant client-side title filter + sort. */
  readonly search = signal('');
  readonly sort = signal<SortKey>('recent');

  /** Active deck slide counts by project id (fetched per project that has a deck);
   *  absent / 0 → the "· N slides" chip is hidden. */
  private readonly slidesByProject = signal<Record<string, number>>({});

  /** "Your decks" layout, persisted across reloads (cards is the default). */
  readonly view = signal<'cards' | 'list'>(this.initialView());

  /** The card whose ⋮ menu is open, and the card being inline-renamed. */
  readonly openMenuId = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  /** Filtered + sorted recents the grid/list renders. */
  readonly visible = computed(() => {
    const q = this.search().trim().toLowerCase();
    const filtered = q
      ? this.recents().filter((p) => p.title.toLowerCase().includes(q))
      : this.recents();
    const sort = this.sort();
    const list = [...filtered];
    if (sort === 'name') {
      list.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'oldest') {
      list.sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
    } else {
      list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    return list;
  });

  ngOnInit(): void {
    void this.load();
  }

  private async load(): Promise<void> {
    const [agents, projects] = await Promise.all([this.api.listAgents(), this.api.listProjects()]);
    const available = agents.filter((a) => a.available);

    // First-run landing rule (CONTEXT.md): no runtime ready → onboarding wizard;
    // zero Projects → the Composer; otherwise show the Library.
    const ready = available.filter((a) => a.authStatus !== 'missing');
    if (ready.length === 0) {
      void this.router.navigate(['/welcome']);
      return;
    }
    if (projects.length === 0) {
      void this.router.navigate(['/new']);
      return;
    }
    this.recents.set(projects);
    void this.loadSlideCounts(projects);
  }

  /** Fetch the active deck's slide count for each Project that produced a deck, so
   *  the card can show "· N slides". Best-effort + parallel; a failure just omits
   *  the chip for that card. */
  private async loadSlideCounts(projects: ProjectRecord[]): Promise<void> {
    const withDeck = projects.filter((p) => p.decks.length > 0);
    await Promise.all(
      withDeck.map(async (p) => {
        const files = await this.api.listFiles(p.id);
        const decks = files?.decks ?? [];
        const active = decks.find((d) => d.active) ?? decks[0];
        if (active?.slides) {
          this.slidesByProject.update((m) => ({ ...m, [p.id]: active.slides }));
        }
      }),
    );
  }

  /** The active deck's slide count for a Project, or null when unknown / 0. */
  slideCount(id: string): number | null {
    return this.slidesByProject()[id] ?? null;
  }

  /** Open a past deck straight into its workspace to keep building. */
  openWorkspace(p: ProjectRecord): void {
    if (this.editingId() === p.id) return; // a click inside the rename input
    void this.router.navigate(['/workspace', p.id]);
  }

  /** Route to the Composer to start a fresh deck. */
  createNew(): void {
    void this.router.navigate(['/new']);
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

  // --- Overflow menu: rename + delete --------------------------------------

  /** Toggle a card's ⋮ menu; stops the click from opening the workspace. */
  toggleMenu(id: string, ev: Event): void {
    ev.stopPropagation();
    this.openMenuId.update((open) => (open === id ? null : id));
  }

  /** Enter inline-rename mode for a card (the title becomes a text input). */
  startRename(p: ProjectRecord, ev: Event): void {
    ev.stopPropagation();
    this.openMenuId.set(null);
    this.editingId.set(p.id);
  }

  /** Commit an inline rename on Enter / blur. Empty → no-op (cancel). */
  async commitRename(p: ProjectRecord, ev: Event): Promise<void> {
    if (this.editingId() !== p.id) return;
    const input = ev.target as HTMLInputElement;
    const title = input.value.trim();
    this.editingId.set(null);
    if (!title || title === p.title) return; // reject empty / unchanged
    const updated = await this.api.renameProject(p.id, title);
    const nextTitle = updated?.title ?? title;
    this.recents.update((list) =>
      list.map((r) => (r.id === p.id ? { ...r, title: nextTitle } : r)),
    );
  }

  /** Cancel inline-rename on Escape (the title reverts). */
  cancelRename(ev: Event): void {
    ev.stopPropagation();
    this.editingId.set(null);
  }

  /** Delete a Project (and its files) after a confirm; removes it from recents. */
  async remove(p: ProjectRecord, ev: Event): Promise<void> {
    ev.stopPropagation();
    this.openMenuId.set(null);
    const ok = window.confirm(`Delete "${p.title}" and its files? This cannot be undone.`);
    if (!ok) return;
    await this.api.deleteProject(p.id);
    this.recents.update((list) => list.filter((r) => r.id !== p.id));
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
