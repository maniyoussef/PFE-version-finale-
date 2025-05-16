// chef-projet-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatGridListModule } from '@angular/material/grid-list';

@Component({
  selector: 'app-chef-projet-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatGridListModule,
  ],
  templateUrl: './chef-projet-dashboard.component.html',
  styleUrls: ['./chef-projet-dashboard.component.scss'],
})
export class ChefProjetDashboardComponent implements OnInit {
  title = 'Tableau de Bord Chef de Projet';
  dashboardCards = [
    {
      title: 'Projets',
      icon: 'folder',
      route: '/chef-projet/projects',
      buttonText: 'Gérer mes Projets',
      color: 'primary',
    },
    {
      title: 'Tickets',
      icon: 'confirmation_number',
      route: '/chef-projet/tickets',
      buttonText: 'Gérer mes Tickets',
      color: 'primary',
    },
    {
      title: 'Équipe',
      icon: 'people',
      route: '/chef-projet/equipe',
      buttonText: 'Gérer mon Équipe',
      color: 'primary',
    },
    {
      title: 'Rapports',
      icon: 'description',
      route: '/chef-projet/reports',
      buttonText: 'Consulter les Rapports',
      color: 'primary',
    },
  ];

  constructor() {
    console.log('[ChefProjetDashboard] Component constructed');
  }

  ngOnInit() {
    console.log('[ChefProjetDashboard] Component initialized', {
      cardCount: this.dashboardCards.length,
      timestamp: new Date().toISOString(),
    });
  }
}
