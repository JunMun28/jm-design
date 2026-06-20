import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../core/api.service';
import { DeckThumbnailComponent } from '../files/deck-thumbnail.component';
import type { FlowStage, ProjectRecord } from '../core/types';

/** Library sort orders the <select> offers. */
type SortKey = 'recent' | 'oldest' | 'name';

/** Thin ring gauge (faint track + ink arc by value, value centred). Ink, never
 *  magenta — gauges stay neutral per DESIGN.md. */
@Component({
  selector: 'ss-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--studio-line)" stroke-width="5" />
      <circle cx="50" cy="50" r="42" fill="none" stroke="var(--studio-ink)" stroke-width="5" stroke-linecap="round" [attr.stroke-dasharray]="dash" transform="rotate(-90 50 50)" />
    </svg>
    <span class="big">{{ big }}</span>
  `,
  styles: [
    `
      :host { position: relative; display: inline-grid; place-items: center; }
      svg { display: block; width: 100%; height: 100%; }
      .big { position: absolute; font-size: var(--ring-num, 11px); font-weight: 400; color: var(--studio-muted); font-variant-numeric: tabular-nums; }
    `,
  ],
})
export class RingComponent {
  @Input() value = 0;
  @Input() big = '';
  private readonly C = 2 * Math.PI * 42;
  get dash(): string {
    const f = (Math.max(0, Math.min(100, this.value)) / 100) * this.C;
    return `${f} ${this.C - f}`;
  }
}

/** Calm neutral spectrum motif (decorative, never magenta). */
@Component({
  selector: 'ss-spectrum',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 120 36" preserveAspectRatio="none" aria-hidden="true">
      @for (b of bars; track $index) {
        <rect [attr.x]="$index * 4 + 1" [attr.y]="36 - b" width="2" [attr.height]="b" rx="1" fill="var(--studio-faint)" />
      }
    </svg>
  `,
  styles: [`:host{display:block} svg{display:block;width:100%;height:100%}`],
})
export class SpectrumComponent {
  readonly bars = Array.from({ length: 29 }, (_, i) => 3 + Math.round(15 * Math.abs(Math.sin(i * 0.7) * Math.cos(i * 0.31))));
}

/**
 * Deck Library (`/`, CONTEXT.md "Deck Library"). The landing screen for a
 * returning user: a soft-card grid (or calm row list), one per past Project, each
 * with a live slide preview (or a calm spectrum placeholder), a stage ring, its
 * uppercase meta, and the active deck's slide count.
 *
 * Visual register: the warm "recording studio" surface (DESIGN.md) — near-
 * monochrome on warm white, color reduced to one very-minimal magenta accent
 * (`--mag`) used only for the most-recent live dot and the "new deck" square.
 *
 * Split out of the old single-screen Home; the composer lives at `/new`. Clicking
 * a card opens the Workspace; "new deck" routes to the Composer. Cards carry a ⋮
 * menu for inline Rename + Delete.
 *
 * Landing rule (CONTEXT.md): no runtime ready → `/welcome`; zero Projects → `/new`;
 * else show the Library.
 */
@Component({
  selector: 'ss-library',
  standalone: true,
  imports: [FormsModule, DatePipe, DeckThumbnailComponent, RingComponent, SpectrumComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="lib">
      <div class="lib__center">
        <header class="lib__head">
          <div>
            <div class="lab">{{ recents().length }} decks</div>
            <h1 class="lib__title">Your decks</h1>
          </div>
          <button class="go" type="button" (click)="createNew()"><span class="go__sq" aria-hidden="true"></span> new deck</button>
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
            @for (p of visible(); track p.id; let i = $index) {
              <li>
                <div class="card" [class.card--menu]="openMenuId() === p.id">
                  <button class="card__open" type="button" (click)="openWorkspace(p)" [attr.aria-label]="'Open ' + p.title">
                    <span class="card__art">
                      @if (deckEntry(p); as e) {
                        <ss-deck-thumbnail [projectId]="p.id" [entry]="e" [placeholder]="stageLabel(p.stage)" />
                      } @else {
                        <span class="ph"><ss-spectrum /><span class="lab">{{ stageLabel(p.stage) }}</span></span>
                      }
                    </span>
                    @if (isActive(p, i)) { <span class="live" aria-label="most recent"></span> }
                  </button>
                  <div class="card__foot">
                    <div class="card__ftext">
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
                      <span class="card__meta">
                        <span class="lab">{{ stageLabel(p.stage) }}</span>
                        <span class="card__date">· {{ p.updatedAt | date: 'MMM d' }}</span>
                        @if (slideCount(p.id); as n) {
                          <span class="card__date">· {{ n }} {{ n === 1 ? 'slide' : 'slides' }}</span>
                        }
                      </span>
                    </div>
                    <span class="card__ring"><ss-ring [value]="stagePct(p.stage)" [big]="stageStep(p.stage) + '/4'" /></span>
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
            @for (p of visible(); track p.id; let i = $index) {
              <li>
                <div class="row" [class.row--menu]="openMenuId() === p.id">
                  @if (editingId() === p.id) {
                    <div class="row__open row__open--edit">
                      <span class="row__ring"><ss-ring [value]="stagePct(p.stage)" [big]="stageStep(p.stage) + '/4'" /></span>
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
                      <span class="row__ring"><ss-ring [value]="stagePct(p.stage)" [big]="stageStep(p.stage) + '/4'" /></span>
                      <span class="row__mid">
                        <span class="row__name">{{ p.title }}</span>
                        <span class="row__meta">
                          <span class="lab">{{ stageLabel(p.stage) }}</span>
                          <span>· {{ p.updatedAt | date: 'MMM d, yyyy' }}</span>
                          @if (slideCount(p.id); as n) { <span>· {{ n }} {{ n === 1 ? 'slide' : 'slides' }}</span> }
                        </span>
                      </span>
                      @if (isActive(p, i)) { <span class="live" aria-label="most recent"></span> }
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
      :host { display: block; }
      .lab { font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--studio-faint); }

      .lib { min-height: 100vh; background: var(--studio-paper); color: var(--studio-ink); display: grid; place-items: start center; padding: 7vh clamp(20px, 5vw, 56px) 12vh; }
      .lib__center { width: 100%; max-width: 1100px; }
      .lib__head { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin: 0 0 26px; }
      .lib__title { font-size: clamp(32px, 5vw, 52px); font-weight: 300; letter-spacing: -0.02em; margin: 8px 0 0; }

      .go { display: inline-flex; align-items: center; gap: 11px; font: inherit; font-size: 14px; font-weight: 500; white-space: nowrap;
        background: var(--studio-ink); color: var(--studio-paper); border: 0; border-radius: 13px; padding: 13px 20px; cursor: pointer;
        transition: transform 0.15s ease, opacity 0.2s ease; }
      .go:hover { opacity: 0.9; }
      .go:active { transform: translateY(1px); }
      .go:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 2px; }
      .go__sq { width: 10px; height: 10px; border-radius: 2px; background: var(--mag); }

      .toolbar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 0 0 22px; }
      .toolbar__search { flex: 1; min-width: 200px; font: inherit; padding: 11px 16px; border-radius: 12px;
        border: 1px solid var(--studio-line); background: var(--studio-panel); color: var(--studio-ink); }
      .toolbar__search::placeholder { color: var(--studio-faint); }
      .toolbar__sort { font: inherit; padding: 11px 14px; border-radius: 12px; border: 1px solid var(--studio-line); background: var(--studio-panel); color: var(--studio-ink); cursor: pointer; }
      .toolbar__search:focus-visible, .toolbar__sort:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 1px; }
      .seg { display: inline-flex; border: 1px solid var(--studio-line); border-radius: 12px; overflow: hidden; background: var(--studio-panel); }
      .seg__btn { font: inherit; font-size: 13px; padding: 9px 16px; border: 0; background: none; color: var(--studio-muted); cursor: pointer; }
      .seg__btn--on { background: var(--studio-ink); color: var(--studio-paper); }
      .seg__btn:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: -2px; }

      /* --- cards --------------------------------------------------------- */
      .cards { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(248px, 1fr)); gap: 20px; }
      .card { position: relative; height: 100%; display: flex; flex-direction: column; overflow: visible;
        border: 1px solid var(--studio-line); border-radius: 20px; background: var(--studio-panel); color: var(--studio-ink);
        transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s, border-color 0.3s; }
      .card:hover { transform: translateY(-5px); box-shadow: 0 24px 40px -28px rgba(28,26,23,0.45); }
      .card--menu { border-color: var(--studio-muted); z-index: 5; }
      .card__open { width: 100%; display: block; font: inherit; text-align: left; padding: 0; border: 0; background: none; color: inherit; cursor: pointer; position: relative; }
      .card__open:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: -2px; border-radius: 20px 20px 0 0; }
      .card__art { display: block; aspect-ratio: 16 / 10; border-bottom: 1px solid var(--studio-line); border-radius: 20px 20px 0 0; overflow: hidden; }
      .card__art ss-deck-thumbnail { display: block; width: 100%; height: 100%; }
      .ph { width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
        background: linear-gradient(180deg, var(--studio-panel), var(--studio-paper)); }
      .ph ss-spectrum { width: 46%; height: 26px; opacity: 0.75; }
      .live { position: absolute; top: 12px; left: 12px; width: 10px; height: 10px; border-radius: 50%; background: var(--mag); box-shadow: 0 0 0 4px var(--mag-soft); }

      .card__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 15px 18px; }
      .card__ftext { min-width: 0; }
      .card__name { display: block; max-width: 100%; font: inherit; text-align: left; font-size: 15px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding: 0; border: 0; background: none; color: var(--studio-ink); cursor: pointer; }
      .card__name:hover { color: var(--studio-muted); }
      .card__name:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 2px; border-radius: 4px; }
      .card__rename { font: inherit; font-size: 15px; font-weight: 500; width: 100%; padding: 4px 8px; border: 1px solid var(--studio-muted); border-radius: 8px; background: var(--studio-paper); color: var(--studio-ink); }
      .card__rename:focus-visible { outline: 2px solid var(--studio-ink); }
      .card__meta { display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px; margin-top: 7px; }
      .card__date { font-size: 12px; color: var(--studio-faint); white-space: nowrap; }
      .card__ring { width: 46px; height: 46px; flex: none; --ring-num: 11px; }

      .card--new { align-items: center; justify-content: center; gap: 8px; min-height: 190px; border-style: dashed; border-color: var(--studio-line); background: transparent; color: var(--studio-muted); cursor: pointer; font: inherit; }
      .card--new:hover { transform: none; box-shadow: none; border-color: var(--studio-muted); color: var(--studio-ink); }
      .card--new:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 2px; }
      .card-new__plus { font-size: 30px; line-height: 1; font-weight: 200; }
      .card-new__label { font-size: 13px; font-weight: 500; }

      .card__more, .row__more {
        position: absolute; top: 10px; right: 10px; width: 28px; height: 28px; display: grid; place-items: center;
        border: 0; border-radius: 8px; background: var(--studio-panel); color: var(--studio-muted);
        font-size: 18px; line-height: 1; cursor: pointer; opacity: 0; box-shadow: 0 0 0 1px var(--studio-line);
      }
      .card:hover .card__more, .card:focus-within .card__more, .card--menu .card__more,
      .row:hover .row__more, .row:focus-within .row__more, .row--menu .row__more { opacity: 1; }
      .card__more:hover, .row__more:hover { color: var(--studio-ink); }
      .card__more:focus-visible, .row__more:focus-visible { opacity: 1; outline: 2px solid var(--studio-ink); }

      .menu { position: absolute; top: 42px; right: 10px; z-index: 10; min-width: 138px; padding: 5px;
        display: flex; flex-direction: column; border: 1px solid var(--studio-line); border-radius: 12px;
        background: var(--studio-panel); box-shadow: 0 12px 30px -12px rgba(28,26,23,0.4); }
      .menu--row { top: 44px; }
      .menu__item { font: inherit; font-size: 13px; text-align: left; padding: 8px 11px; border: 0; border-radius: 8px; background: none; color: var(--studio-ink); cursor: pointer; }
      .menu__item:hover { background: var(--studio-paper); }
      .menu__item:focus-visible { outline: 2px solid var(--studio-ink); }
      .menu__item--danger { color: var(--mag); }

      /* --- rows (list) --------------------------------------------------- */
      .rows { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; max-width: 920px; }
      .row { position: relative; width: 100%; }
      .row--menu { z-index: 5; }
      .row__open { width: 100%; display: flex; align-items: center; gap: 20px; font: inherit; text-align: left; padding: 16px 52px 16px 20px; border-radius: 18px; border: 1px solid var(--studio-line); background: var(--studio-panel); color: var(--studio-ink); cursor: pointer; transition: border-color 0.3s, transform 0.3s; }
      .row__open--edit { cursor: default; padding-right: 52px; }
      button.row__open:hover { border-color: var(--studio-muted); transform: translateX(3px); }
      .row__open:focus-visible { outline: 2px solid var(--studio-ink); outline-offset: 1px; }
      .row__ring { width: 50px; height: 50px; flex: none; --ring-num: 12px; }
      .row__mid { flex: 1; min-width: 0; }
      .row__name { display: block; font-size: 17px; font-weight: 400; letter-spacing: -0.01em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .row__meta { display: flex; flex-wrap: wrap; gap: 6px; align-items: baseline; margin-top: 5px; font-size: 12px; color: var(--studio-faint); }
      .row__rename { font: inherit; font-size: 16px; font-weight: 400; flex: 1; padding: 5px 8px; border: 1px solid var(--studio-muted); border-radius: 8px; background: var(--studio-paper); color: var(--studio-ink); }
      .row__rename:focus-visible { outline: 2px solid var(--studio-ink); }
      .row .live { position: static; flex: none; }

      .lib__empty { margin-top: 24px; color: var(--studio-muted); font-size: 14px; }

      @media (prefers-reduced-motion: reduce) {
        .card, button.row__open { transition: none; }
        .card:hover { transform: none; }
        button.row__open:hover { transform: none; }
      }
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

  /** Whether to show the single magenta "live" dot — the most-recent deck, and only
   *  in the default "recent" sort (so the marker stays meaningful, not arbitrary). */
  isActive(p: ProjectRecord, index: number): boolean {
    return index === 0 && this.sort() === 'recent' && !this.search().trim();
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
   *  project hasn't produced a deck yet (a calm placeholder shows instead). */
  deckEntry(p: ProjectRecord): string | null {
    const active = p.decks.find((d) => d.id === p.activeDeckId) ?? p.decks[0];
    return active?.file ?? null;
  }

  stageLabel(stage: FlowStage): string {
    return STAGE_LABELS[stage] ?? stage;
  }
  /** Stage as a ring fill 0–100 and a "step/4" label. */
  stagePct(stage: FlowStage): number {
    return STAGE_PCT[stage] ?? 0;
  }
  stageStep(stage: FlowStage): number {
    return (STAGE_PCT[stage] ?? 0) / 25;
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

/** Stage → ring fill percent (pipeline progress). */
const STAGE_PCT: Record<FlowStage, number> = { brief: 25, wireframe: 50, theme: 75, deck: 100 };
