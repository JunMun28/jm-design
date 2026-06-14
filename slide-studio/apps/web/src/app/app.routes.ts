import type { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { WorkspaceComponent } from './workspace/workspace.component';
import { OnboardingComponent } from './onboarding/onboarding.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  // First-run onboarding wizard (Slice 10, §13). Home routes here on the first
  // run when no runtime is ready; users can also reach it directly.
  { path: 'welcome', component: OnboardingComponent },
  { path: 'workspace/:id', component: WorkspaceComponent },
  { path: '**', redirectTo: '' },
];
