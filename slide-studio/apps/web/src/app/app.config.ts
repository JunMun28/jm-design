import { type ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';

// Zoneless change detection (Angular 22 default): the whole shell is
// signal-based, so no zone.js polyfill is needed. Using provideZoneChangeDetection
// without a zone.js polyfill throws NG0908 at bootstrap and the app never renders.
//
// `withViewTransitions()` opts the router into the native View Transitions API so
// a route change (Home → Workspace) cross-fades instead of snapping. The actual
// cross-fade + the staggered panel entrance are styled in styles.css against the
// `::view-transition-old/new(root)` pseudo-elements; both are disabled under
// prefers-reduced-motion. Browsers without the API fall back to an instant swap.
export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection(), provideRouter(routes, withViewTransitions())],
};
