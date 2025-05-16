// admin.routes.ts
import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './AdminDashboard/AdminDashboard.component';
import { PaysListComponent } from './pays-list/pays-list.component';
import { CompaniesComponent } from './companies/companies.component';
import { ProjectsComponent } from './projects/projects.component';
import { ProblemCategoryComponent } from './problem-category/problem-category.component';
import { HistoriqueTicketsComponent } from './historique-tickets.component/historique-tickets.component';
import { TicketsComponent } from './tickets/tickets.component';
import { UsersListCreationComponent } from './users-list&creation/users-list&creation.component';
import { RolesComponent } from './roles/roles.component';
import { AdminProfileComponent } from './admin-profile/admin-profile.component';
import { AssignementComponent } from './assignement/assignement.component';
import { NotFoundComponent } from '../not-found/not-found.component';
import { AdminReportsComponent } from './AdminReportsComponent';
import { AdminLayoutComponent } from './admin-layout.component';
import { authGuard } from '../../guards/auth.guard';
import { UserRole } from '../../core/constants/roles';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [() => authGuard([UserRole.ADMIN])],
    canActivateChild: [() => authGuard([UserRole.ADMIN])],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
      },
      {
        path: 'pays-list',
        component: PaysListComponent,
      },
      {
        path: 'societes',
        component: CompaniesComponent,
      },
      {
        path: 'projects',
        component: ProjectsComponent,
      },
      {
        path: 'problems',
        component: ProblemCategoryComponent,
      },
      {
        path: 'historique',
        component: HistoriqueTicketsComponent,
      },
      {
        path: 'tickets',
        component: TicketsComponent,
      },
      {
        path: 'users',
        component: UsersListCreationComponent,
      },
      {
        path: 'roles',
        component: RolesComponent,
      },
      {
        path: 'profile',
        component: AdminProfileComponent,
      },
      {
        path: 'assignement',
        component: AssignementComponent,
      },
      {
        path: 'rapports',
        component: AdminReportsComponent,
      },
      {
        path: '**',
        component: NotFoundComponent,
      },
    ],
  },
];
