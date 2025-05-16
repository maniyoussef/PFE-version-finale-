import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./user-dashboard/user-dashboard.component').then(
        (m) => m.UserDashboardComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./user-profile/user-profile.component').then(
        (m) => m.UserProfileComponent
      ),
  },
  {
    path: 'tickets',
    loadComponent: () =>
      import('./ticket-list/ticket-list.component').then(
        (m) => m.TicketListComponent
      ),
  },
];
