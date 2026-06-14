import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';

const THEME_KEY = 'slide-studio.theme';

/**
 * App shell root. Hosts the router outlet + a light/dark toggle.
 *
 * Slice 13 (AC3): the theme choice persists across reloads, and the first load
 * honors the OS `prefers-color-scheme` when the user has no saved choice — so the
 * app "renders correctly in light and dark". `prefers-reduced-motion` is honored
 * globally in styles.css (transitions/animations disabled under `reduce`).
 */
@Component({
  selector: 'ss-root',
  standalone: true,
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button class="theme-toggle mic-btn" type="button" (click)="toggleTheme()" [attr.aria-pressed]="dark()">
      {{ dark() ? '☾ Dark' : '☀ Light' }}
    </button>
    <router-outlet />
  `,
  styles: [
    `
      .theme-toggle { position: fixed; top: 14px; right: 16px; z-index: 50; font-size: 13px; padding: 6px 12px; }
    `,
  ],
})
export class AppComponent {
  readonly dark = signal(this.initialDark());

  constructor() {
    // Apply the resolved theme immediately so the first paint is correct.
    this.apply(this.dark());
  }

  toggleTheme(): void {
    this.dark.update((v) => !v);
    this.apply(this.dark());
    try {
      localStorage.setItem(THEME_KEY, this.dark() ? 'dark' : 'light');
    } catch {
      /* storage unavailable — in-memory toggle still works */
    }
  }

  /** Saved choice wins; otherwise fall back to the OS preference. */
  private initialDark(): boolean {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      /* ignore */
    }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches;
  }

  private apply(dark: boolean): void {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }
}
