/* historique-tickets.component.ts */
import { Component, OnInit, ViewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent, MatPaginator } from '@angular/material/paginator';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-historique-tickets',
  templateUrl: './historique-tickets.component.html',
  styleUrls: ['./historique-tickets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatButtonModule,
    MatTooltipModule,
    MatFormFieldModule,
    MatInputModule,
    MatPaginatorModule,
    MatSnackBarModule,
    FormsModule
  ],
})
export class HistoriqueTicketsComponent implements OnInit {
  resolvedTickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  isLoading = true;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];
  filterValue = '';
  searchText = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  constructor(
    private ticketService: TicketService, 
    public dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.loadResolvedTickets();
  }

  loadResolvedTickets() {
    this.isLoading = true;
    console.log('[HistoriqueTicketsComponent] Loading resolved tickets with all status variations...');
    
    this.ticketService.getAllResolvedTickets().subscribe({
      next: (tickets: Ticket[]) => {
        console.log(`[HistoriqueTicketsComponent] Loaded ${tickets.length} resolved tickets`);
        this.resolvedTickets = tickets;
        this.filteredTickets = tickets;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        console.error('[HistoriqueTicketsComponent] Failed to load resolved tickets:', error);
        this.isLoading = false;
        this.snackBar.open('Échec du chargement des tickets résolus', 'Fermer', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.filterValue = filterValue;
    
    this.filteredTickets = this.resolvedTickets.filter(ticket => {
      return (
        (ticket.title?.toLowerCase().includes(filterValue)) ||
        (ticket.qualification?.toLowerCase().includes(filterValue)) ||
        (ticket.project?.name?.toLowerCase().includes(filterValue)) ||
        (ticket.problemCategory?.name?.toLowerCase().includes(filterValue)) ||
        (ticket.assignedTo?.name?.toLowerCase().includes(filterValue)) ||
        (ticket.assignedTo?.lastName?.toLowerCase().includes(filterValue))
      );
    });
    
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  clearSearch() {
    this.searchText = '';
    this.filterValue = '';
    this.filteredTickets = this.resolvedTickets;
    if (this.paginator) {
      this.paginator.firstPage();
    }
  }

  getPriorityClass(priority?: string): string {
    if (!priority) return '';
    
    const priorityLower = priority.toLowerCase();
    
    if (priorityLower.includes('haute') || priorityLower.includes('high')) {
      return 'priority-high';
    } else if (priorityLower.includes('moyenne') || priorityLower.includes('medium')) {
      return 'priority-medium';
    } else if (priorityLower.includes('basse') || priorityLower.includes('low')) {
      return 'priority-low';
    }
    
    return '';
  }

  getStatusClass(status?: string): string {
    if (!status) return 'status-resolved';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('résolu') || statusLower.includes('resolu') || statusLower.includes('resolved')) {
      return 'status-resolved';
    } else if (statusLower.includes('terminé') || statusLower.includes('termine') || statusLower.includes('completed')) {
      return 'status-completed';
    } else if (statusLower.includes('fini') || statusLower.includes('finish')) {
      return 'status-finished';
    }
    
    return 'status-resolved'; // Default class
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  showDescription(ticket: Ticket): void {
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket },
    });
  }

  viewTicketDetails(ticket: Ticket): void {
    // If you need to implement this function for viewing more details
    this.dialog.open(DescriptionDialogComponent, {
      width: '600px',
      data: { ticket, showFullDetails: true },
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    // Add pagination logic if needed
  }
}
