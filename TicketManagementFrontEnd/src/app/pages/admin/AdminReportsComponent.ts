import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ticket } from '../../models/ticket.model';
import { TicketService } from '../../services/ticket.service';

@Component({
  selector: 'app-admin-reports',
  template: `
    <div class="admin-reports-container">
      <div class="content-wrapper">
        <div class="header-section">
          <h1 class="page-title">Rapports des Tickets</h1>
          <div class="header-actions">
            <div class="search-sort-container">
              <div class="sort-container">
                <label for="sort-select">Trier par :</label>
                <select id="sort-select" (change)="sortReports($event)">
                  <option value="newest">Plus récents en premier</option>
                  <option value="oldest">Plus anciens en premier</option>
                  <option value="status">Statut</option>
                  <option value="title">Titre</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div class="loading-container" *ngIf="isLoading">
          <div class="loading-spinner">
            <mat-spinner diameter="50"></mat-spinner>
          </div>
        </div>

        <!-- No tickets state -->
        <div *ngIf="!isLoading && tickets.length === 0" class="empty-state">
          <mat-icon>info</mat-icon>
          <p>Aucun rapport trouvé</p>
        </div>

        <!-- Tickets with reports -->
        <div *ngIf="!isLoading && tickets.length > 0" class="table-container">
          <table class="reports-table">
            <thead>
              <tr>
                <th>Titre</th>
                <th>Projet</th>
                <th>Date de création</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let ticket of tickets">
                <td class="title-cell">{{ ticket.title }}</td>
                <td>{{ ticket.project?.name || 'Non spécifié' }}</td>
                <td>{{ ticket.createdAt | date:'dd/MM/yyyy' }}</td>
                <td>
                  <span class="ticket-status" [ngClass]="getStatusClass(ticket.status)">{{ ticket.status }}</span>
                </td>
                <td class="actions-cell">
                  <button mat-icon-button color="primary" matTooltip="Voir le rapport" (click)="openReportDialog(ticket)">
                    <mat-icon>description</mat-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Animations */
    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes moveGradient {
      0% {
        background-position: 0% 0%;
      }
      50% {
        background-position: 100% 100%;
      }
      100% {
        background-position: 0% 0%;
      }
    }

    /* Container Styles */
    .admin-reports-container {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      width: 100%;
      padding: 24px;
      min-height: calc(100vh - 64px);
      position: relative;
      background: linear-gradient(135deg, #f8f9fa 0%, #f0f2f5 100%);
      animation: fadeIn 0.5s ease-out forwards;
      margin-top: 0;
      overflow: hidden;
    }

    /* Particle background */
    .admin-reports-container::after {
      content: "";
      position: absolute;
      width: 100%;
      height: 150%;
      top: -25%;
      left: 0;
      background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ff7043' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E");
      animation: moveGradient 120s linear infinite;
      z-index: 0;
    }

    .content-wrapper {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }

    /* Header Styles */
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    }

    .page-title {
      font-size: 28px;
      font-weight: 700;
      color: #333;
      margin: 0;
      position: relative;
      padding-bottom: 12px;
    }

    .page-title::after {
      content: "";
      position: absolute;
      left: 0;
      bottom: 0;
      height: 2px;
      width: 40px;
      background: linear-gradient(to right, #ff7043, #ffccbc);
      border-radius: 2px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .search-sort-container {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sort-container {
      display: flex;
      align-items: center;
      gap: 8px;
      background-color: white;
      padding: 6px 12px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .sort-container label {
      font-weight: 500;
      color: #333;
      font-size: 14px;
    }

    .sort-container select {
      padding: 6px 8px;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      outline: none;
      background-color: white;
      font-size: 14px;
      cursor: pointer;
    }

    /* Loading State */
    .loading-container {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 40px;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      background-color: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      text-align: center;
    }

    .empty-state mat-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #bdbdbd;
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 16px;
      color: #757575;
      margin-bottom: 24px;
    }

    /* Table Styles */
    .table-container {
      background-color: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .reports-table {
      width: 100%;
      border-collapse: collapse;
    }

    .reports-table th {
      background-color: #f5f5f5;
      color: #424242;
      font-weight: 600;
      text-align: left;
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
    }

    .reports-table td {
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      vertical-align: middle;
    }

    .reports-table tr:last-child td {
      border-bottom: none;
    }

    .reports-table tr:hover {
      background-color: #f8f9fa;
    }

    .title-cell {
      font-weight: 500;
      color: #333;
      max-width: 250px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions-cell {
      text-align: center;
      white-space: nowrap;
    }

    .ticket-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-open {
      background-color: #e3f2fd;
      color: #1976d2;
    }

    .status-accepted, .status-assigned {
      background-color: #e8f5e9;
      color: #388e3c;
    }

    .status-in-progress {
      background-color: #fff8e1;
      color: #ffa000;
    }

    .status-resolved, .status-closed {
      background-color: #e0f2f1;
      color: #00897b;
    }

    .status-refused {
      background-color: #ffebee;
      color: #d32f2f;
    }
  `],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatSnackBarModule
  ],
})
export class AdminReportsComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = false;
  errorMessage = '';
  selectedTicket: Ticket | null = null;
  
  constructor(
    private ticketService: TicketService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadTicketsWithReports();
  }

  loadTicketsWithReports(): void {
    this.isLoading = true;
    console.log('[AdminReportsComponent] Loading tickets with reports');
    
    this.ticketService.getTicketsWithReports().subscribe({
      next: (tickets) => {
        // Filter to only include tickets that have a report
        this.tickets = tickets.filter(ticket => {
          const hasReport = ticket.report && ticket.report.trim() !== '';
          if (!hasReport) {
            console.log(`[AdminReportsComponent] Ticket #${ticket.id} has no report, skipping`);
          }
          return hasReport;
        });
        
        this.isLoading = false;
        console.log(`[AdminReportsComponent] Loaded ${this.tickets.length} tickets with reports`);
        
        // Log the first few tickets for debugging
        if (this.tickets.length > 0) {
          console.log('[AdminReportsComponent] Sample ticket reports:');
          this.tickets.slice(0, 3).forEach(ticket => {
            console.log(`Ticket #${ticket.id} (${ticket.status}): "${ticket.report?.substring(0, 30)}..."`);
          });
        } else {
          console.log('[AdminReportsComponent] No tickets with reports found');
        }
      },
      error: (error) => {
        this.errorMessage = 'Erreur lors du chargement des tickets avec rapports';
        this.isLoading = false;
        console.error('[AdminReportsComponent] Error loading tickets with reports:', error);
        this.snackBar.open('Échec du chargement des rapports', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  sortReports(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const sortValue = select.value;
    
    this.tickets = [...this.tickets].sort((a, b) => {
      switch (sortValue) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'title':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('ouvert') || statusLower.includes('open')) {
      return 'status-open';
    } else if (statusLower.includes('accepté') || statusLower.includes('accepted')) {
      return 'status-accepted';
    } else if (statusLower.includes('assigné') || statusLower.includes('assigned')) {
      return 'status-assigned';
    } else if (statusLower.includes('cours') || statusLower.includes('progress')) {
      return 'status-in-progress';
    } else if (statusLower.includes('résolu') || statusLower.includes('resolved') || statusLower.includes('fermé') || statusLower.includes('closed')) {
      return 'status-resolved';
    } else if (statusLower.includes('rejeté') || statusLower.includes('refused') || statusLower.includes('non résolu')) {
      return 'status-refused';
    }
    
    return '';
  }

  openReportDialog(ticket: Ticket): void {
    this.selectedTicket = ticket;
    
    this.dialog.open(ReportViewerDialog, {
      width: '600px',
      data: {
        ticket: ticket
      }
    });
  }
}

@Component({
  selector: 'app-report-viewer-dialog',
  template: `
    <div class="report-dialog-container" style="padding: 16px; max-width: 600px;">
      <h2 mat-dialog-title>Rapport de Ticket #{{ data.ticket.id }}</h2>
      
      <mat-dialog-content style="max-height: 60vh;">
        <div style="margin-bottom: 24px; padding: 16px; background-color: #f5f5f5; border-radius: 8px;">
          <div style="display: flex; margin-bottom: 12px; align-items: center;">
            <span style="font-weight: 500; color: #616161; width: 140px;">Titre:</span>
            <span>{{ data.ticket.title }}</span>
          </div>
          
          <div style="display: flex; margin-bottom: 12px; align-items: center;">
            <span style="font-weight: 500; color: #616161; width: 140px;">Statut:</span>
            <span style="display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500;"
                  [ngStyle]="getStatusStyle(data.ticket.status)">
              {{ data.ticket.status }}
            </span>
          </div>
          
          <div style="display: flex; margin-bottom: 12px; align-items: center;">
            <span style="font-weight: 500; color: #616161; width: 140px;">Projet:</span>
            <span>{{ data.ticket.project?.name || 'Non spécifié' }}</span>
          </div>
          
          <div style="display: flex; margin-bottom: 12px; align-items: center;">
            <span style="font-weight: 500; color: #616161; width: 140px;">Date de création:</span>
            <span>{{ data.ticket.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
          </div>
        </div>
        
        <div style="background-color: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 16px;">
          <h3 style="margin-top: 0; color: #424242; font-size: 18px; font-weight: 500; border-bottom: 1px solid #e0e0e0; padding-bottom: 8px; margin-bottom: 16px;">Contenu du rapport</h3>
          <div *ngIf="data.ticket.report" style="white-space: pre-line; color: #424242; line-height: 1.5;">
            <p>{{ data.ticket.report }}</p>
          </div>
          <div *ngIf="!data.ticket.report" style="color: #9e9e9e; font-style: italic; text-align: center; padding: 20px;">
            <p>Aucun contenu de rapport disponible.</p>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button (click)="close()">Fermer</button>
      </mat-dialog-actions>
    </div>
  `,
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule]
})
export class ReportViewerDialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket },
    private dialogRef: MatDialogRef<ReportViewerDialog>
  ) {}
  
  getStatusStyle(status: string | undefined): any {
    if (!status) return {};
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('ouvert') || statusLower.includes('open')) {
      return { backgroundColor: '#e3f2fd', color: '#1976d2' };
    } else if (statusLower.includes('accepté') || statusLower.includes('accepted')) {
      return { backgroundColor: '#e0f7fa', color: '#0097a7' };
    } else if (statusLower.includes('assigné') || statusLower.includes('assigned')) {
      return { backgroundColor: '#f3e5f5', color: '#7b1fa2' };
    } else if (statusLower.includes('cours') || statusLower.includes('progress')) {
      return { backgroundColor: '#ede7f6', color: '#512da8' };
    } else if (statusLower.includes('résolu') || statusLower.includes('resolved') || statusLower.includes('fermé') || statusLower.includes('closed')) {
      return { backgroundColor: '#e8f5e9', color: '#388e3c' };
    } else if (statusLower.includes('rejeté') || statusLower.includes('refused') || statusLower.includes('non résolu')) {
      return { backgroundColor: '#ffebee', color: '#d32f2f' };
    }
    
    return {};
  }
  
  close(): void {
    this.dialogRef.close();
  }
} 