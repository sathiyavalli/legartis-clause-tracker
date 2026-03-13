import { Routes } from '@angular/router';

export const routes: Routes = [
  // landing/home page
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  // keep legacy contracts/dashboard redirects
  { path: 'dashboard', redirectTo: 'contracts', pathMatch: 'full' },
  {
    path: 'contracts',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
  },
  {
    path: 'contracts/:id',
    loadComponent: () =>
      import('./pages/document-viewer/document-viewer.component').then(
        (m) => m.DocumentViewerComponent
      ),
  },
  {
    path: 'contracts/:id/clauses',
    loadComponent: () =>
      import('./pages/document-viewer/document-viewer.component').then(
        (m) => m.DocumentViewerComponent
      ),
  },
  {
    path: 'upload',
    loadComponent: () => import('./pages/upload/upload.component').then((m) => m.UploadComponent),
  },
  {
    path: 'documents/:id',
    redirectTo: 'contracts/:id',
    pathMatch: 'full',
  },
  { path: '**', redirectTo: '' },
];
