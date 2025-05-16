import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom } from 'rxjs';
import { DatePipe } from '@angular/common';
import { ChefProjetReportDialogComponent } from '../../../components/chef-projetComponents/chef-projet-report-dialog/chef-projet-report-dialog.component';

@Component({
  selector: 'app-chef-projet-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatSnackBarModule,
    MatDialogModule,
    MatButtonModule,
    MatTooltipModule,
    RouterModule,
  ],
  templateUrl: './chef-projet-reports.component.html',
  styleUrls: ['./chef-projet-reports.component.scss'],
})
export class ChefProjetReportsComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = true;

  constructor(
    private ticketService: TicketService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    await this.loadReports();
  }

  async loadReports() {
    this.isLoading = true;
    
    try {
      // Get current user (chef projet)
      const currentUser = await firstValueFrom(this.authService.getCurrentUser());
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const chefProjetId = currentUser.id;
      console.log('Chef Projet ID:', chefProjetId);
      
      this.ticketService.getProjectTicketsByChefProjetId(chefProjetId).subscribe({
        next: (tickets) => {
          console.log('Raw tickets for chef projet:', tickets);
          
          // Check for report field in each ticket for debugging
          tickets.forEach(ticket => {
            console.log(`Ticket #${ticket.id} - Status: ${ticket.status} - Report:`, 
                        ticket.report ? `"${ticket.report.substring(0, 30)}..."` : 'null or empty');
          });
          
          // Filter tickets that have reports
          this.tickets = tickets.filter(ticket => {
            const hasReport = ticket.report && ticket.report.trim() !== '';
            if (hasReport) {
              console.log(`Ticket #${ticket.id} has report: "${ticket.report.substring(0, 50)}..."`);
            } else {
              console.log(`Ticket #${ticket.id} has no report or empty report`);
            }
            return hasReport;
          });
          
          console.log('Filtered tickets with reports:', this.tickets.length);
          console.log('Reports include refused tickets:', this.tickets.filter(t => t.status === 'Refusé').length);
          
          this.isLoading = false;
          
          if (this.tickets.length === 0) {
            this.snackBar.open('Aucun rapport trouvé', 'Fermer', {
              duration: 3000,
            });
          }
        },
        error: (err) => {
          console.error('Error fetching tickets:', err);
          this.snackBar.open('Échec du chargement des rapports', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
          this.isLoading = false;
        },
      });
    } catch (error) {
      console.error('Error in loadReports:', error);
      this.snackBar.open('Échec du chargement des rapports', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      this.isLoading = false;
    }
  }

  openReportDialog(ticket: Ticket) {
    console.log('Opening report dialog for ticket:', ticket.id, 'with report:', ticket.report);
    this.dialog.open(ChefProjetReportDialogComponent, {
      width: '600px',
      data: ticket,
      panelClass: 'report-dialog-container',
    });
  }

  getPriorityClass(priority: string | undefined): string {
    if (!priority) return '';
    
    switch (priority.toLowerCase()) {
      case 'high':
      case 'urgent':
      case 'élevé':
        return 'priority-high';
      case 'medium':
      case 'moyen':
        return 'priority-medium';
      case 'low':
      case 'faible':
        return 'priority-low';
      default:
        return '';
    }
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'open':
        return 'status-open';
      case 'en attente':
        return 'status-en-attente';
      case 'assigné':
        return 'status-assigné';
      case 'en cours':
        return 'status-en-cours';
      case 'résolu':
        return 'status-résolu';
      case 'refusé':
        return 'status-refusé';
      default:
        return '';
    }
  }
}
