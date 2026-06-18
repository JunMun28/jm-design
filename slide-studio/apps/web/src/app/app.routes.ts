import type { Routes } from '@angular/router';
import { LibraryComponent } from './library/library.component';
import { ComposerComponent } from './composer/composer.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { FileBrowserComponent } from './files/file-browser.component';
import { OnboardingComponent } from './onboarding/onboarding.component';

export const routes: Routes = [
  // Landing screen: the Deck Library (CONTEXT.md). It redirects on the first run
  // when no runtime is ready (/welcome) or when there are zero Projects (/new).
  { path: '', component: LibraryComponent },
  // The Composer — the clean create screen. Submitting creates a Project and
  // routes into the workspace.
  { path: 'new', component: ComposerComponent },
  // First-run onboarding wizard (Slice 10, §13). The Library routes here on the
  // first run when no runtime is ready; users can also reach it directly.
  { path: 'welcome', component: OnboardingComponent },
  // Per-project file browser (the file-browser back-link still points here); its
  // "Open in workspace" routes on to the workspace below.
  { path: 'files/:id', component: FileBrowserComponent },
  { path: 'workspace/:id', component: WorkspaceComponent },
  { path: '**', redirectTo: '' },
];
