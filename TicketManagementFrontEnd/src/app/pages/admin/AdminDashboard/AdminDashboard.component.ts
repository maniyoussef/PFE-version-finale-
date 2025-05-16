import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

// Import the AdminReportsComponent directly from its new location
import { AdminReportsComponent } from '../AdminReportsComponent';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './AdminDashboard.component.html',
  styleUrls: ['./AdminDashboard.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
  ],
})
export class AdminDashboardComponent implements OnInit {
  title = 'Tableau de Bord Administrateur';
  dashboardCards = [
    {
      title: 'Utilisateurs',
      icon: 'people',
      route: '/admin/users',
      buttonText: 'Gérer les Utilisateurs',
      color: 'primary',
    },
    {
      title: 'Sociétés',
      icon: 'business',
      route: '/admin/societes',
      buttonText: 'Gérer les Sociétés',
      color: 'primary',
    },
    {
      title: 'Projets',
      icon: 'folder',
      route: '/admin/projects',
      buttonText: 'Gérer les Projets',
      color: 'primary',
    },
    {
      title: 'Tickets',
      icon: 'confirmation_number',
      route: '/admin/tickets',
      buttonText: 'Gérer les Tickets',
      color: 'primary',
    },
    {
      title: 'Assignations',
      icon: 'assignment',
      route: '/admin/assignement',
      buttonText: 'Gérer les Assignations',
      color: 'primary',
    },
    {
      title: 'Rapports',
      icon: 'assessment',
      route: '/admin/rapports',
      buttonText: 'Voir les Rapports',
      color: 'primary',
    },
  ];

  constructor() {
    console.log('[AdminDashboard] 🏗️ Component constructed');
  }

  ngOnInit() {
    console.log('[AdminDashboard] 🔍 Component initialized', {
      cardCount: this.dashboardCards.length,
      timestamp: new Date().toISOString(),
    });
  }
}
