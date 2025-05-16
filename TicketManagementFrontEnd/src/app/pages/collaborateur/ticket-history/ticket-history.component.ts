import { Component, OnInit, ViewChild, Inject, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../../services/ticket.service';
import { AuthService } from '../../../services/auth.service';
import { Ticket } from '../../../models/ticket.model';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TICKET_STATUS } from '../../../constants/ticket-status.constant';

@Component({
  selector: 'app-ticket-history',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatTableModule,
    MatDividerModule,
    MatChipsModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatSortModule,
    FormsModule,
    DatePipe,
    MatDialogModule,
  ],
  templateUrl: './ticket-history.component.html',
  styleUrls: ['./ticket-history.component.scss']
})
export class TicketHistoryComponent implements OnInit, AfterViewInit {
  // Data sources
  tickets: Ticket[] = [];
  dataSource: MatTableDataSource<Ticket> = new MatTableDataSource<Ticket>([]);
  
  // UI state
  isLoading = true;
  searchTerm = '';
  statusFilter = 'all';
  
  // User info
  currentUserId: number | null = null;
  
  // Table configuration
  displayedColumns: string[] = [
    'id',
    'title',
    'project',
    'priority',
    'status',
    'createdAt',
    'completedAt',
    'duration',
    'actions'
  ];
  
  // Pagination options
  pageSize = 10;
  
  // Statistics
  totalTickets = 0;
  resolvedTickets = 0;
  unresolvedTickets = 0;
  averageDuration = '00:00:00';
  
  // Constants
  readonly STATUS = TICKET_STATUS;
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private ticketService: TicketService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe({
      next: (user) => {
        if (user && user.id !== undefined) {
          this.currentUserId = user.id as number;
          this.loadTickets();
        } else {
          console.error('User not found or ID is undefined');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        console.error('Error fetching current user:', error);
        this.router.navigate(['/login']);
      },
    });
  }

  ngAfterViewInit(): void {
    // If we already have data loaded, set up the paginator and sort
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      
      if (this.paginator) {
        this.paginator.pageSize = this.pageSize;
      }
    }
  }

  loadTickets(): void {
    this.isLoading = true;
    
    if (!this.currentUserId) {
      this.showSnackBar('Erreur: Utilisateur non identifié');
      this.isLoading = false;
      return;
    }

    this.ticketService.getUserAssignedTickets(this.currentUserId).subscribe({
      next: (tickets) => {
        console.log(`Retrieved ${tickets.length} tickets assigned to collaborateur`);
        
        // Filter only completed tickets (resolved or unresolved)
        this.tickets = tickets.filter(ticket => 
          this.isResolved(ticket.status) || 
          this.isNotResolved(ticket.status)
        );
        
        // Initialize the data source
        this.dataSource = new MatTableDataSource(this.tickets);
        
        // Apply custom filter predicate for search
        this.setupCustomFilter();
        
        // Set initial page size
        this.dataSource.paginator = this.paginator;
        if (this.paginator) {
          this.paginator.pageSize = this.pageSize;
        }
        
        // Set up sorting
        this.dataSource.sort = this.sort;
        
        // Update statistics
        this.updateStatistics();
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.showSnackBar('Erreur lors du chargement des tickets');
        this.isLoading = false;
      }
    });
  }
  
  setupCustomFilter(): void {
    if (this.dataSource) {
      this.dataSource.filterPredicate = (data: Ticket, filter: string) => {
        const searchTerms = filter.toLowerCase().split('|');
        const searchTerm = searchTerms[0];
        const statusFilter = searchTerms[1];
        
        // Status filtering
        let matchesStatus = true;
        if (statusFilter !== 'all') {
          if (statusFilter === 'resolved') {
            matchesStatus = this.isResolved(data.status);
          } else if (statusFilter === 'unresolved') {
            matchesStatus = this.isNotResolved(data.status);
          }
        }
        
        // Search term filtering
        let matchesSearch = true;
        if (searchTerm && searchTerm.trim() !== '') {
          matchesSearch = (
            (data.id?.toString().includes(searchTerm)) ||
            (data.title?.toLowerCase().includes(searchTerm)) ||
            (data.description?.toLowerCase().includes(searchTerm)) ||
            (data.project?.name?.toLowerCase().includes(searchTerm)) ||
            (data.problemCategory?.name?.toLowerCase().includes(searchTerm)) ||
            (data.status?.toLowerCase().includes(searchTerm)) ||
            (data.priority?.toLowerCase().includes(searchTerm))
          );
        }
        
        return matchesStatus && matchesSearch;
      };
    }
  }
  
  applyFilter(): void {
    if (!this.dataSource) return;
    
    const filterValue = `${this.searchTerm.toLowerCase()}|${this.statusFilter}`;
    this.dataSource.filter = filterValue;
    
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  setStatusFilter(status: string): void {
    this.statusFilter = status;
    this.applyFilter();
  }
  
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFilter();
  }
  
  updateStatistics(): void {
    this.totalTickets = this.tickets.length;
    
    // Count resolved tickets
    this.resolvedTickets = this.tickets.filter(ticket => this.isResolved(ticket.status)).length;
    
    // Count unresolved tickets
    this.unresolvedTickets = this.tickets.filter(ticket => this.isNotResolved(ticket.status)).length;
    
    // Calculate average duration
    const ticketsWithDuration = this.tickets.filter(ticket => 
      ticket.workDuration !== undefined && 
      ticket.workDuration !== null && 
      !isNaN(ticket.workDuration) && 
      ticket.workDuration > 0
    );
    
    if (ticketsWithDuration.length > 0) {
      const totalDuration = ticketsWithDuration.reduce(
        (sum, ticket) => sum + (ticket.workDuration || 0), 0
      );
      const averageSeconds = Math.round(totalDuration / ticketsWithDuration.length);
      this.averageDuration = this.formatDuration(averageSeconds);
    } else {
      this.averageDuration = '00:00:00';
    }
  }
  
  formatDuration(seconds: number): string {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '00:00:00';
    }
    
    seconds = Math.max(0, Math.round(seconds));
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  getWorkDuration(ticket: Ticket): string {
    return this.formatDuration(ticket.workDuration || 0);
  }
  
  isResolved(status: string | undefined): boolean {
    if (!status) return false;
    
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === 'RESOLVED' || 
           normalizedStatus === 'RÉSOLU' || 
           normalizedStatus === this.STATUS.RESOLVED;
  }
  
  isNotResolved(status: string | undefined): boolean {
    if (!status) return false;
    
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === 'UNRESOLVED' || 
           normalizedStatus === 'NON RÉSOLU' || 
           normalizedStatus === this.STATUS.UNRESOLVED;
  }
  
  getStatusClass(status: string | undefined): string {
    if (!status) return 'unknown';
    
    if (this.isResolved(status)) {
      return 'resolved';
    } else if (this.isNotResolved(status)) {
      return 'unresolved';
    } else {
      return 'unknown';
    }
  }
  
  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'unknown';
    
    const normalizedPriority = priority.toLowerCase();
    if (normalizedPriority === 'haute' || normalizedPriority === 'high') {
      return 'high';
    } else if (normalizedPriority === 'moyenne' || normalizedPriority === 'medium') {
      return 'medium';
    } else if (normalizedPriority === 'basse' || normalizedPriority === 'low') {
      return 'low';
    } else {
      return 'unknown';
    }
  }
  
  getNormalizedStatus(status: string | undefined): string {
    if (!status) return 'Inconnu';
    
    const normalizedStatus = status.toUpperCase();
    
    if (normalizedStatus === 'RESOLVED') {
      return 'Résolu';
    } else if (normalizedStatus === 'UNRESOLVED') {
      return 'Non résolu';
    } else {
      return status;
    }
  }
  
  openTicketDetails(ticket: Ticket): void {
    this.dialog.open(TicketDetailsDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: { ticket }
    });
  }
  
  refreshTickets(): void {
    this.loadTickets();
    this.showSnackBar('Liste des tickets actualisée');
  }
  
  showSnackBar(message: string): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}

@Component({
  selector: 'app-ticket-details-dialog',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDividerModule],
  template: `
    <div class="dialog-header">
      <h2>Détails du ticket #{{ data.ticket.id }}</h2>
      <button mat-icon-button (click)="close()">
        <mat-icon>close</mat-icon>
      </button>
    </div>
    
    <div class="dialog-content">
      <h3>{{ data.ticket.title }}</h3>
      
      <div class="ticket-status">
        <span class="badge badge-status-{{ getStatusClass(data.ticket.status) }}">
          <mat-icon *ngIf="isResolved(data.ticket.status)" class="status-icon">check_circle</mat-icon>
          <mat-icon *ngIf="isNotResolved(data.ticket.status)" class="status-icon">cancel</mat-icon>
          {{ getNormalizedStatus(data.ticket.status) }}
        </span>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="info-grid">
        <div class="info-item">
          <span class="label">Projet:</span>
          <span class="value">{{ data.ticket.project?.name || 'Non spécifié' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Catégorie:</span>
          <span class="value">{{ data.ticket.problemCategory?.name || 'Non spécifié' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Priorité:</span>
          <span class="value badge badge-priority-{{ getPriorityClass(data.ticket.priority) }}">
            {{ data.ticket.priority || 'Non défini' }}
          </span>
        </div>
        
        <div class="info-item">
          <span class="label">Créé le:</span>
          <span class="value">{{ data.ticket.createdAt | date: 'dd/MM/yyyy HH:mm' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Terminé le:</span>
          <span class="value">{{ data.ticket.finishWorkTime | date: 'dd/MM/yyyy HH:mm' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">Durée de travail:</span>
          <span class="value">{{ formatDuration(data.ticket.workDuration) }}</span>
        </div>
      </div>
      
      <mat-divider></mat-divider>
      
      <div class="description-section" *ngIf="data.ticket.description">
        <h4>Description</h4>
        <p class="description">{{ data.ticket.description }}</p>
      </div>
      
      <div class="resolution-section" *ngIf="data.ticket.report">
        <h4>Rapport de résolution</h4>
        <p class="resolution">{{ data.ticket.report }}</p>
      </div>
    </div>
    
    <div class="dialog-actions">
      <button mat-button color="primary" (click)="close()">Fermer</button>
    </div>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
      background-color: #f5f5f5;
      border-bottom: 1px solid #e0e0e0;
    }
    
    .dialog-header h2 {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
    
    .dialog-content {
      padding: 24px;
      max-height: 70vh;
      overflow-y: auto;
    }
    
    .dialog-content h3 {
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 20px;
      font-weight: 500;
    }
    
    .ticket-status {
      margin-bottom: 16px;
    }
    
    mat-divider {
      margin: 16px 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 16px 0;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
    }
    
    .label {
      font-size: 12px;
      color: #757575;
      margin-bottom: 4px;
    }
    
    .value {
      font-size: 14px;
      color: #212121;
    }
    
    .description-section,
    .resolution-section {
      margin-top: 16px;
    }
    
    .description-section h4,
    .resolution-section h4 {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 8px;
    }
    
    .description,
    .resolution {
      background-color: #f9f9f9;
      padding: 12px;
      border-radius: 4px;
      font-size: 14px;
      line-height: 1.5;
      white-space: pre-line;
    }
    
    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      padding: 8px 16px 16px;
    }
    
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .badge-status-resolved {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }
    
    .badge-status-unresolved {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
    
    .badge-status-unknown {
      background-color: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }
    
    .badge-priority-high {
      background-color: rgba(244, 67, 54, 0.1);
      color: #f44336;
    }
    
    .badge-priority-medium {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ff9800;
    }
    
    .badge-priority-low {
      background-color: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }
    
    .badge-priority-unknown {
      background-color: rgba(158, 158, 158, 0.1);
      color: #9e9e9e;
    }
    
    .status-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 4px;
    }
    
    @media (max-width: 600px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class TicketDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<TicketDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket }
  ) {}
  
  close(): void {
    this.dialogRef.close();
  }
  
  isResolved(status: string | undefined): boolean {
    if (!status) return false;
    
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === 'RESOLVED' || 
           normalizedStatus === 'RÉSOLU' || 
           normalizedStatus === 'RESOLVED';
  }
  
  isNotResolved(status: string | undefined): boolean {
    if (!status) return false;
    
    const normalizedStatus = status.toUpperCase();
    return normalizedStatus === 'UNRESOLVED' || 
           normalizedStatus === 'NON RÉSOLU' || 
           normalizedStatus === 'UNRESOLVED';
  }
  
  getStatusClass(status: string | undefined): string {
    if (!status) return 'unknown';
    
    if (this.isResolved(status)) {
      return 'resolved';
    } else if (this.isNotResolved(status)) {
      return 'unresolved';
    } else {
      return 'unknown';
    }
  }
  
  getPriorityClass(priority: string | undefined): string {
    if (!priority) return 'unknown';
    
    const normalizedPriority = priority.toLowerCase();
    if (normalizedPriority === 'haute' || normalizedPriority === 'high') {
      return 'high';
    } else if (normalizedPriority === 'moyenne' || normalizedPriority === 'medium') {
      return 'medium';
    } else if (normalizedPriority === 'basse' || normalizedPriority === 'low') {
      return 'low';
    } else {
      return 'unknown';
    }
  }
  
  getNormalizedStatus(status: string | undefined): string {
    if (!status) return 'Inconnu';
    
    const normalizedStatus = status.toUpperCase();
    
    if (normalizedStatus === 'RESOLVED') {
      return 'Résolu';
    } else if (normalizedStatus === 'UNRESOLVED') {
      return 'Non résolu';
    } else {
      return status;
    }
  }
  
  formatDuration(seconds?: number): string {
    if (seconds === null || seconds === undefined || isNaN(seconds)) {
      return '00:00:00';
    }
    
    seconds = Math.max(0, Math.round(seconds));
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}
