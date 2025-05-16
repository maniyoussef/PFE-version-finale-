// chef-projet.routes.ts
import { Routes } from '@angular/router';
import { ChefProjetDashboardComponent } from './chef-projet-dashboard/chef-projet-dashboard.component';
import { ChefProjetLayoutComponent } from './chef-projet-layout/chef-projet-layout.component';
import { ProjectComponent } from './chef-projet-projets/chef-projet-projets';
import { ChefProjetEquipeComponent } from './chef-projet-equipe/chef-projet-equipe';
import { ChefProjetTicketsComponent } from './chef-projet-tickets.component/chef-projet-tickets.component';
import { TicketDetailComponent } from './chef-projet-tickets.component/ticket-detail.component';
import { ChefProjetReportsComponent } from './chef-projet-reports.component/chef-projet-reports.component';
import { ChefProjetProfileComponent } from './chef-projet-profile/chef-projet-profile.component';

export const CHEF_PROJET_ROUTES: Routes = [
  {
    path: '',
    component: ChefProjetLayoutComponent,
    children: [
      { path: '', component: ChefProjetDashboardComponent },
      { path: 'projects', component: ProjectComponent },
      { path: 'equipe', component: ChefProjetEquipeComponent },
      { path: 'reports', component: ChefProjetReportsComponent },
      { path: 'tickets', component: ChefProjetTicketsComponent },
      { path: 'tickets/:id', component: TicketDetailComponent },
      { path: 'profile', component: ChefProjetProfileComponent },
    ],
  },
];
