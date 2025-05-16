// collaborateur.routes.ts
import { Routes } from '@angular/router';
import { CollaborateurLayoutComponent } from './collaborateur.layout';
import { CollaborateurDashboardComponent } from './collaborateur-dashboard/collaborateur-dashboard.component';
import { CollaborateurTicketsComponent } from './collaborateur-tickets/collaborateur-tickets.component';
import { TicketHistoryComponent } from './ticket-history/ticket-history.component';
import { CollaborateurProfileComponent } from './collaborateur-profile/collaborateur-profile.component';

export const COLLABORATEUR_ROUTES: Routes = [
  {
    path: '',
    component: CollaborateurLayoutComponent,
    children: [
      { path: '', component: CollaborateurDashboardComponent },
      { path: 'dashboard', component: CollaborateurDashboardComponent },
      { path: 'tickets', component: CollaborateurTicketsComponent },
      { path: 'historique', component: TicketHistoryComponent },
      { path: 'profile', component: CollaborateurProfileComponent },
    ],
  },
];
