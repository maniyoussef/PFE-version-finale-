import { Routes } from '@angular/router';
import { UsersDashboardComponent } from './users-dashboard/users-dashboard.component';
import { MesTicketsComponent } from './mes-tickets/mes-tickets.component';
import { FixUserIdentityComponent } from './fix-user-identity/fix-user-identity.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { authGuard } from '../../guards/auth.guard';
import { UserRole } from '../../core/constants/roles';
import { UsersLayoutComponent } from './users-layout.component';

export const usersRoutes: Routes = [
  // Special route for profile that doesn't use layout or auth guard
  {
    path: 'profile-direct',
    component: UserProfileComponent,
    // No auth guard here
  },
  {
    path: '',
    component: UsersLayoutComponent,
    canActivate: [() => authGuard([UserRole.USER, UserRole.CLIENT])],
    canActivateChild: [() => authGuard([UserRole.USER, UserRole.CLIENT])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: UsersDashboardComponent,
      },
      {
        path: 'mes-tickets',
        component: MesTicketsComponent,
      },
      {
        path: 'fix-identity',
        component: FixUserIdentityComponent,
      },
      {
        path: 'profile',
        component: UserProfileComponent,
      },
    ],
  },
];
