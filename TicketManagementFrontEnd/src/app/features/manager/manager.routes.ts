import { Routes } from '@angular/router';

export const MANAGER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./manager-dashboard/manager-dashboard.component').then(
        (m) => m.ManagerDashboardComponent
      ),
  },
  {
    path: 'team',
    loadComponent: () =>
      import('./team-management/team-management.component').then(
        (m) => m.TeamManagementComponent
      ),
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./reports/reports.component').then((m) => m.ReportsComponent),
  },
];
