import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { ApiService } from '../core/api.service';
import type { OutputFormat, ThemeCard } from '../core/types';

/**
 * The **Theme picker** canvas surface (plan §7.4, §11, issue #12 / Slice 5,
 * Gate 3).
 *
 * Lists the existing `html-slides` Micron themes — the slide-output styling
 * surface — as **crafted preview cards built from each theme's real palette**
 * (read live from the daemon `/api/themes`), NOT scaled-down screenshots. Each
 * card renders a tiny on-brand "slide" from the theme's bg / ink / accent colours
 * plus a palette-dot row, so every card looks intentional and consistent. The
 * user picks one (the selection rings purple and **persists** on the Project via
 * Gate 3), chooses an output format, then confirms to generate the themed Deck.
 *
 * Two styling surfaces never cross (§11): these are the *slide* themes, NOT the
 * app's Atlas shell. The Wireframe stays theme-less — the theme applies only here,
 * at generation.
 */
@Component({
  selector: 'ss-themes',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="themes">
      <div class="themes__head">
        <h2 class="canvas__h">Pick a theme</h2>
        <p class="themes__hint">
          The wireframe is theme-less. Choose a Micron theme for the final deck — it applies only now, at generation.
        </p>
      </div>

      @if (loading()) {
        <p class="themes__loading">Loading themes…</p>
      } @else if (!themes().length) {
        <p class="themes__loading">No themes are available.</p>
      } @else {
        <ul class="grid" role="listbox" aria-label="Themes">
          @for (t of themes(); track t.id) {
            <li>
              <button
                class="card"
                type="button"
                role="option"
                [class.card--selected]="selected() === t.id"
                [class.card--deprecated]="t.deprecated"
                [attr.aria-selected]="selected() === t.id"
                (click)="select(t.id)"
              >
                <span class="card__prev" [class.card__prev--img]="!!t.preview" [style.background]="(!t.preview && t.palette?.bg) || null">
                  @if (t.preview) {
                    <img
                      class="prev__img"
                      [src]="'/api/themes/' + t.id + '/thumbnail'"
                      [alt]="t.name + ' theme preview'"
                      loading="lazy"
                    />
                  } @else if (t.palette; as p) {
                    <span class="prev__kicker" [style.background]="p.accent"></span>
                    <span class="prev__title">
                      <span class="prev__bar prev__bar--lg" [style.background]="p.ink"></span>
                      <span class="prev__bar prev__bar--md" [style.background]="p.ink"></span>
                    </span>
                    <span class="prev__chart" aria-hidden="true">
                      <span class="prev__col" [style.background]="p.accent2 || p.accent" style="height: 42%"></span>
                      <span class="prev__col" [style.background]="p.accent" style="height: 78%"></span>
                      <span class="prev__col prev__col--dim" [style.background]="p.ink" style="height: 58%"></span>
                      <span class="prev__col" [style.background]="p.accent" style="height: 96%"></span>
                    </span>
                  } @else {
                    <span class="prev__mono">{{ initials(t.name) }}</span>
                  }
                  @if (selected() === t.id) {
                    <span class="card__check" aria-hidden="true">✓</span>
                  }
                </span>

                <span class="card__row">
                  <span class="card__name">{{ t.name }}</span>
                  @if (t.palette; as p) {
                    <span class="card__dots" aria-hidden="true">
                      <span class="card__dot" [style.background]="p.bg"></span>
                      <span class="card__dot" [style.background]="p.accent"></span>
                      <span class="card__dot" [style.background]="p.accent2 || p.ink"></span>
                      <span class="card__dot" [style.background]="p.ink"></span>
                    </span>
                  }
                  @if (t.deprecated) {
                    <span class="card__badge">deprecated</span>
                  }
                </span>

                @if (t.when) {
                  <span class="card__when">{{ t.when }}</span>
                }
              </button>
            </li>
          }
        </ul>

        <div class="gate gate--theme" role="group" aria-label="Gate 3: pick a theme">
          @if (current()) {
            <p class="gate__done">✓ Theme set to {{ currentName() }} — generating the deck.</p>
          } @else {
            <div class="gate__row">
              <!-- Format choice (Slice 6 / issue #13, AC1): segmented HTML / PPTX / both. -->
              <fieldset class="seg" [disabled]="busy()">
                <legend class="seg__legend">Output format</legend>
                <div class="seg__opts" role="radiogroup" aria-label="Output format">
                  @for (f of formatOptions; track f.id) {
                    <button
                      class="seg__opt"
                      type="button"
                      role="radio"
                      [class.seg__opt--on]="format() === f.id"
                      [attr.aria-checked]="format() === f.id"
                      [title]="f.desc"
                      (click)="format.set(f.id)"
                    >
                      {{ f.label }}
                    </button>
                  }
                </div>
              </fieldset>

              <button
                class="mic-btn mic-btn--primary gate__gen"
                type="button"
                [disabled]="!selected() || busy()"
                (click)="confirm()"
              >
                {{ busy() ? 'Starting…' : (selected() ? 'Generate deck in ' + selectedName() : 'Select a theme to continue') }}
              </button>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .themes { display: flex; flex-direction: column; gap: 18px; min-height: 0; }
      .themes__head { flex: 0 0 auto; }
      .canvas__h { font-size: 13px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-muted); margin: 0 0 8px; }
      .themes__hint { margin: 0; color: var(--mic-ink-2); line-height: 1.5; max-width: 60ch; }
      .themes__loading { color: var(--mic-faint); }

      .grid {
        list-style: none; margin: 0; padding: 0;
        display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 16px;
        overflow-y: auto;
      }

      .card {
        display: flex; flex-direction: column; gap: 10px; width: 100%; text-align: left;
        padding: 12px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius);
        background: var(--mic-surface); color: var(--mic-ink); cursor: pointer;
        transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
      }
      .card:hover { transform: translateY(-2px); }
      .card:not(.card--selected):hover { border-color: var(--mic-border-strong); }
      .card:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: 2px; }
      .card--selected { border-color: var(--mic-accent); box-shadow: 0 0 0 2px var(--mic-accent-soft); }
      .card--selected:hover { border-color: var(--mic-accent); }
      .card--deprecated { opacity: 0.7; }

      /* --- Crafted palette preview (a tiny on-brand slide) --- */
      .card__prev {
        position: relative; aspect-ratio: 16 / 9; border-radius: var(--mic-radius-sm);
        overflow: hidden; padding: 11px 12px; display: flex; flex-direction: column; justify-content: space-between;
        background: var(--mic-surface-2);
        box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.14);
      }
      /* Real per-theme slide screenshot (served by the daemon) — the preferred
         preview. Fills the 16:9 card; the crafted palette/monogram below are
         fallbacks only when a theme ships no screenshot. */
      .card__prev--img { padding: 0; }
      .prev__img { width: 100%; height: 100%; object-fit: cover; display: block; }
      .prev__kicker { width: 26px; height: 5px; border-radius: 3px; flex: 0 0 auto; }
      .prev__title { display: flex; flex-direction: column; gap: 5px; }
      .prev__bar { height: 7px; border-radius: 2px; }
      .prev__bar--lg { width: 78%; }
      .prev__bar--md { width: 52%; opacity: 0.5; }
      .prev__chart { display: flex; align-items: flex-end; gap: 5px; height: 26px; }
      .prev__col { width: 8px; border-radius: 2px 2px 0 0; }
      .prev__col--dim { opacity: 0.4; }
      .prev__mono {
        margin: auto; font-size: 26px; font-weight: 700; letter-spacing: 0.02em;
        color: var(--mic-faint); opacity: 0.6;
      }
      .card__check {
        position: absolute; top: 8px; right: 8px; width: 24px; height: 24px;
        display: grid; place-items: center; border-radius: 999px;
        background: var(--mic-accent); color: var(--mic-on-accent); font-size: 14px; font-weight: 700;
        box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
      }

      .card__row { display: flex; align-items: center; gap: 8px; }
      .card__name { font-weight: 600; }
      .card__dots { display: inline-flex; gap: 4px; margin-left: auto; }
      .card__dot { width: 11px; height: 11px; border-radius: 50%; box-shadow: inset 0 0 0 1px rgba(127, 127, 127, 0.28); }
      .card__badge {
        font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em;
        color: var(--mic-faint); border: 1px solid var(--mic-border-strong); border-radius: 999px; padding: 0 6px;
      }
      .card__when { font-size: 12.5px; color: var(--mic-muted); line-height: 1.45; }

      /* --- Gate 3 footer --- */
      .gate { flex: 0 0 auto; padding: 18px 20px; border: 1px solid var(--mic-border); border-radius: var(--mic-radius); background: var(--mic-surface-2); }
      .gate__done { margin: 0; color: var(--mic-accent); font-weight: 600; }
      .gate__row { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .gate__gen { white-space: nowrap; }

      .seg { border: 0; padding: 0; margin: 0; }
      .seg__legend { font-size: 12px; text-transform: uppercase; letter-spacing: 0.04em; color: var(--mic-muted); padding: 0; margin-bottom: 8px; }
      .seg__opts { display: inline-flex; border: 1px solid var(--mic-border-strong); border-radius: var(--mic-radius-sm); overflow: hidden; }
      .seg__opt {
        font: inherit; font-size: 13px; padding: 8px 16px; border: 0; border-right: 1px solid var(--mic-border);
        background: var(--mic-surface); color: var(--mic-ink-2); cursor: pointer; transition: background 0.12s ease, color 0.12s ease;
      }
      .seg__opt:last-child { border-right: 0; }
      .seg__opt:hover { color: var(--mic-accent); }
      .seg__opt--on { background: var(--mic-accent-soft); color: var(--mic-accent); font-weight: 500; }
      .seg__opt:focus-visible { outline: 3px solid var(--mic-accent-soft); outline-offset: -3px; }
      .seg:disabled .seg__opt { opacity: 0.6; pointer-events: none; }
    `,
  ],
})
export class ThemesComponent {
  /** The owning Project (Gate 3 persists the selection on it). */
  readonly projectId = input.required<string>();
  /** The already-chosen theme on a resumed Project (so the picker shows it). */
  readonly chosen = input<string | null>(null);
  /** The already-chosen format(s) on a resumed Project (so the picker shows them). */
  readonly chosenFormats = input<OutputFormat[]>(['html']);

  /** Fires when the user confirms a theme + format(s) (Gate 3): the workspace
   *  persists them and kicks off generation. */
  readonly themePicked = output<{ theme: string; formats: OutputFormat[] }>();

  readonly api = inject(ApiService);

  /** The three format choices (AC1): HTML, PPTX, or both. */
  readonly formatOptions: { id: FormatChoice; label: string; desc: string }[] = [
    { id: 'html', label: 'HTML', desc: 'One self-contained web file' },
    { id: 'pptx', label: 'PowerPoint', desc: 'Editable .pptx (real text boxes)' },
    { id: 'both', label: 'Both', desc: 'HTML + editable PowerPoint' },
  ];

  readonly themes = signal<ThemeCard[]>([]);
  readonly loading = signal(true);
  /** The theme the user has highlighted but not yet confirmed. */
  readonly selected = signal<string | null>(null);
  /** The theme already persisted on the Project (Gate 3 approved). */
  readonly current = signal<string | null>(null);
  /** The format choice (single radio over {html, pptx, both}). Defaults to HTML. */
  readonly format = signal<FormatChoice>('html');
  readonly busy = signal(false);

  async ngOnInit(): Promise<void> {
    this.current.set(this.chosen());
    this.selected.set(this.chosen());
    this.format.set(formatsToChoice(this.chosenFormats()));
    const themes = await this.api.listThemes();
    this.themes.set(themes);
    this.loading.set(false);
  }

  select(id: string): void {
    if (this.current()) return; // already locked in (Gate 3 approved)
    this.selected.set(id);
  }

  /** Up-to-two-letter monogram for the no-palette fallback preview. */
  initials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    const first = words[0][0] ?? '';
    const second = words.length > 1 ? (words[1][0] ?? '') : '';
    return (first + second).toUpperCase();
  }

  /** The display name of the highlighted / persisted theme. */
  selectedName(): string {
    return this.themes().find((t) => t.id === this.selected())?.name ?? this.selected() ?? '';
  }

  currentName(): string {
    return this.themes().find((t) => t.id === this.current())?.name ?? this.current() ?? '';
  }

  async confirm(): Promise<void> {
    const theme = this.selected();
    if (!theme || this.busy()) return;
    this.busy.set(true);
    try {
      this.current.set(theme);
      this.themePicked.emit({ theme, formats: choiceToFormats(this.format()) });
    } finally {
      this.busy.set(false);
    }
  }
}

/** The single-radio format choice (HTML, PPTX, or both) the picker offers. */
type FormatChoice = 'html' | 'pptx' | 'both';

/** Map the single-radio choice to the daemon's OutputFormat[] (AC1). */
function choiceToFormats(choice: FormatChoice): OutputFormat[] {
  if (choice === 'both') return ['html', 'pptx'];
  return [choice];
}

/** Map a persisted OutputFormat[] back to the single-radio choice (resume). */
function formatsToChoice(formats: OutputFormat[]): FormatChoice {
  const hasHtml = formats.includes('html');
  const hasPptx = formats.includes('pptx');
  if (hasHtml && hasPptx) return 'both';
  if (hasPptx) return 'pptx';
  return 'html';
}
