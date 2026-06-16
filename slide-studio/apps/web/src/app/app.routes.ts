import type { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { FileBrowserComponent } from './files/file-browser.component';
import { OnboardingComponent } from './onboarding/onboarding.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  // First-run onboarding wizard (Slice 10, §13). Home routes here on the first
  // run when no runtime is ready; users can also reach it directly.
  { path: 'welcome', component: OnboardingComponent },
  // Per-project file browser (the home library opens this on a deck click); its
  // "Open in workspace" routes on to the workspace below.
  { path: 'files/:id', component: FileBrowserComponent },
  { path: 'workspace/:id', component: WorkspaceComponent },
  { path: '**', redirectTo: '' },
];
