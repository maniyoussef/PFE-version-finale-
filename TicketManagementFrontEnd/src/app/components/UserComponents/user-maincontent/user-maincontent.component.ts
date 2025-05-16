// users-main-content.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { catchError, finalize, map } from 'rxjs/operators';
import { of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSnackBarModule } from '@angular/material/snack-bar';

interface TicketStats {
  totalCount: number;
  resolvedCount: number;
  assignedCount: number;
}

@Component({
  selector: 'app-users-main-content',
  standalone: true,
  imports: [
    CommonModule, 
    MatCardModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDividerModule,
    RouterModule,
    MatSnackBarModule
  ],
  templateUrl: './user-maincontent.component.html',
  styleUrls: ['./user-maincontent.component.scss'],
})
export class UsersMainContentComponent implements OnInit {
  // Statistics for the dashboard
  stats = [
    { icon: 'assignment', label: 'Total Tickets', value: 0 },
    { icon: 'check_circle', label: 'Résolu', value: 0 },
    { icon: 'assignment_ind', label: 'Assigné', value: 0 },
  ];
  
  isLoading = true;
  apiUrl = environment.apiUrl;

  constructor(
    private router: Router,
    private http: HttpClient,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    document.title = 'Dashboard Utilisateur';
    this.loadTicketStats();
  }
  
  loadTicketStats(): void {
    this.isLoading = true;
    
    // First try to get user's tickets
    this.http.get<any[]>(`${this.apiUrl}/tickets/mes-tickets`)
      .pipe(
        map(tickets => {
          // Calculate stats from the returned tickets
          const totalCount = tickets.length;
          const resolvedCount = tickets.filter(t => 
            t.status?.toLowerCase() === 'resolved' || 
            t.status?.toLowerCase() === 'closed' || 
            t.status?.toLowerCase() === 'résolu' ||
            t.status?.toLowerCase() === 'fermé'
          ).length;
          const assignedCount = tickets.filter(t => 
            t.status?.toLowerCase() === 'assigned' || 
            t.status?.toLowerCase() === 'assigné' ||
            t.status?.toLowerCase() === 'en cours'
          ).length;
          
          return { totalCount, resolvedCount, assignedCount };
        }),
        catchError(error => {
          console.error('Error fetching ticket statistics:', error);
          
          // Fallback to another endpoint if the first one fails
          return this.http.get<any[]>(`${this.apiUrl}/tickets/user`).pipe(
            map(tickets => {
              const totalCount = tickets.length;
              const resolvedCount = tickets.filter(t => 
                t.status?.toLowerCase() === 'resolved' || 
                t.status?.toLowerCase() === 'closed' || 
                t.status?.toLowerCase() === 'résolu' ||
                t.status?.toLowerCase() === 'fermé'
              ).length;
              const assignedCount = tickets.filter(t => 
                t.status?.toLowerCase() === 'assigned' || 
                t.status?.toLowerCase() === 'assigné' ||
                t.status?.toLowerCase() === 'en cours'
              ).length;
              
              return { totalCount, resolvedCount, assignedCount };
            }),
            catchError(secondError => {
              console.error('Error fetching from fallback endpoint:', secondError);
              
              // If both endpoints fail, use mock data
              this.snackBar.open('Impossible de charger les statistiques de tickets', 'Fermer', {
                duration: 3000,
                panelClass: ['error-snackbar']
              });
              
              // Generate some random mock data for testing
              const mockTotal = Math.floor(Math.random() * 25) + 10; // 10-35
              const mockResolved = Math.floor(Math.random() * mockTotal);
              const mockAssigned = Math.floor(Math.random() * (mockTotal - mockResolved));
              
              return of({ 
                totalCount: mockTotal, 
                resolvedCount: mockResolved, 
                assignedCount: mockAssigned 
              });
            })
          );
        }),
        finalize(() => {
          this.isLoading = false;
        })
      )
      .subscribe(stats => {
        console.log('Ticket stats:', stats);
        this.stats[0].value = stats.totalCount;
        this.stats[1].value = stats.resolvedCount;
        this.stats[2].value = stats.assignedCount;
      });
  }

  // Navigation methods
  navigateToProfile(): void {
    this.router.navigate(['/user/profile']);
  }

  navigateToTickets(): void {
    this.router.navigate(['/user/mes-tickets']);
  }
  
  navigateToSupport(): void {
    this.router.navigate(['/support']);
  }
}
