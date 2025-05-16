import { Component, OnInit, OnDestroy, inject, ViewChild } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Ticket } from '../../../models/ticket.model';
import { AuthService } from '../../../services/auth.service';
import { lastValueFrom } from 'rxjs';
import { ReportDialogComponent } from '../report-dialog.component';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { ExportDialogComponent } from './export-dialog.component';
import { TicketService } from '../../../services/ticket.service';
import { TicketDebugService } from '../../../services/ticket-debug.service';
import { ExcelService } from '../../../services/excel.service';
import { FormsModule } from '@angular/forms';
import {
  interval,
  Subscription,
  Subject,
  takeUntil,
  map,
  finalize,
  switchMap,
  take,
  tap,
  catchError,
  of,
  throwError,
  forkJoin,
} from 'rxjs';
import { TICKET_STATUS } from '../../../constants/ticket-status.constant';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { RouterLink } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ChangeDetectorRef } from '@angular/core';
import { TicketDetailsDialogComponent } from '../../../components/ticket-details-dialog/ticket-details-dialog.component';
import { TicketActionsDialogComponent } from '../../../components/ticket-actions-dialog/ticket-actions-dialog.component';
import { CommentDialogComponent } from '../../../pages/admin/tickets/comment-dialog.component';

@Component({
  selector: 'app-collaborateur-tickets',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatBadgeModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatSortModule,
    MatTableModule,
    MatProgressSpinnerModule,
    FormsModule,
  ],
  templateUrl: './collaborateur-tickets.component.html',
  styleUrls: ['./collaborateur-tickets.component.scss'],
  styles: [`
    ::ng-deep .non-blocking-snackbar {
      position: fixed !important;
      bottom: 20px !important;
      right: 20px !important;
      margin: 0 !important;
      z-index: 9999 !important;
      max-width: 300px !important;
    }
    
    ::ng-deep .non-blocking-snackbar .mat-mdc-snack-bar-container {
      box-shadow: 0 3px 5px -1px rgba(0,0,0,.2), 0 6px 10px 0 rgba(0,0,0,.14), 0 1px 18px 0 rgba(0,0,0,.12) !important;
    }
    
    ::ng-deep .non-blocking-snackbar .mdc-snackbar__surface {
      background-color: #323232 !important;
      opacity: 0.9 !important;
    }
    
    /* Global overlay container - highest z-index */
    ::ng-deep .cdk-overlay-container {
      z-index: 10000 !important;
      position: fixed !important;
    }
    
    /* Global overlay wrapper - ensures proper positioning */
    ::ng-deep .cdk-global-overlay-wrapper {
      z-index: 10000 !important;
      display: flex !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      height: 100% !important;
      width: 100% !important;
      justify-content: center !important;
      align-items: center !important;
      pointer-events: none !important;
    }
    
    /* Overlay pane - contains the actual dialog */
    ::ng-deep .cdk-overlay-pane {
      position: static !important; /* Changed from fixed to static for better positioning */
      pointer-events: auto !important;
      box-sizing: border-box !important;
      z-index: 10001 !important;
      display: flex !important;
      max-width: 90% !important; /* Reduced from 95% to 90% */
      max-height: 90% !important; /* Reduced from 95% to 90% */
      margin: auto !important;
    }
    
    /* Dialog container */
    ::ng-deep .mat-mdc-dialog-container {
      z-index: 10001 !important;
      max-height: 90vh !important;
      max-width: 90vw !important;
      overflow: visible !important;
      display: flex !important;
      flex-direction: column !important;
    }

    /* High performance dialog */
    ::ng-deep .high-performance-dialog {
      z-index: 10001 !important;
    }

    /* Dialog container */
    ::ng-deep .mat-dialog-container {
      position: relative !important;
      z-index: 10001 !important;
      box-shadow: 0 11px 15px -7px rgba(0,0,0,.2), 0 24px 38px 3px rgba(0,0,0,.14), 0 9px 46px 8px rgba(0,0,0,.12) !important;
      overflow: visible !important;
      border-radius: 8px !important;
      margin: auto !important;
    }
    
    /* Centered dialog */
    ::ng-deep .centered-dialog {
      margin: auto !important;
    }
    
    /* Light backdrop */
    ::ng-deep .light-backdrop {
      background: rgba(0, 0, 0, 0.5) !important;
    }
    
    /* Simplified dialog */
    ::ng-deep .simplified-dialog {
      max-width: 90% !important;
      width: auto !important;
      min-width: 350px !important; /* Reduced from 400px to 350px */
      overflow: visible !important;
      margin: auto !important;
    }

    /* Dialog content */
    ::ng-deep .dialog-content {
      width: 100% !important;
      overflow-x: visible !important;
      overflow-y: auto !important;
      max-height: 70vh !important;
      padding: 16px !important;
    }

    /* Details table */
    ::ng-deep .details-table {
      table-layout: fixed !important;
      width: 100% !important;
      border-collapse: collapse !important;
    }

    ::ng-deep .details-table td {
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      padding: 8px !important;
    }
    
    /* Dialog container */
    ::ng-deep .mdc-dialog__container {
      height: auto !important;
      overflow: visible !important;
      display: flex !important;
      flex-direction: column !important;
      margin: auto !important;
    }
    
    /* Dialog surface */
    ::ng-deep .mdc-dialog__surface {
      overflow: visible !important;
      max-width: 95vw !important;
    }
  `]
})
export class CollaborateurTicketsComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  searchTerm = '';
  currentSortValue = 'newest';
  
  // Properties for filtering export
  projects: any[] = [];
  problemCategories: any[] = [];
  statuses: string[] = ['Assigned', 'In Progress', 'Resolved', 'Unresolved'];
  priorities: string[] = ['Haute', 'Moyenne', 'Basse'];

  displayedColumns: string[] = [
    'title',
    'project',
    'priority',
    'status',
    'workDuration',
    'actions',
  ];
  isLoading = true;
  error: string | null = null;
  currentUserId!: number;
  private destroy$ = new Subject<void>();
  private readonly UPDATE_INTERVAL = 60000; // 1 minute in milliseconds

  // Active timer state - needed for the HTML template
  activeTimer: { ticketId: number; startTime: Date } | null = null;

  // Statistics properties
  totalTickets = 0;
  assignedTickets = 0;
  resolvedTickets = 0;
  nonResolvedTickets = 0;
  inProgressTickets = 0;
  averageDuration = '00:00:00';

  // Constants for easy reference
  readonly STATUS = TICKET_STATUS;

  dataSource!: MatTableDataSource<Ticket>;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Helper to format seconds as HH:mm:ss
  private formatDuration(seconds: number): string {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  // Timer state
  private timerSub: Subscription | null = null;
  private timerTicketId: number | null = null;
  private timerBaseDuration: number = 0;
  private timerStartTime: Date | null = null;
  public timerDisplay: string = '00:00:00';

  constructor(
    private http: HttpClient,
    private auth: AuthService,
    private snackBar: MatSnackBar,
    public dialog: MatDialog,
    public ticketService: TicketService,
    private ticketDebugService: TicketDebugService,
    private router: Router,
    private excelService: ExcelService,
  ) {}

  ngOnInit(): void {
    console.log('[CollaborateurTicketsComponent] Initializing component');
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.stopTimer();
  }

  loadTickets(): void {
    this.isLoading = true;

    this.auth
      .getCurrentUser()
      .pipe(
        take(1),
        switchMap((user) => {
          if (!user || user.id === undefined) {
            throw new Error('User not found or ID is undefined');
          }

          this.currentUserId = user.id;
          console.log(
            `[CollaborateurTicketsComponent] Loading tickets for user ID: ${this.currentUserId}`
          );

          return this.ticketService.getUserAssignedTickets(this.currentUserId);
        }),
        finalize(() => {
          this.isLoading = false;
          
          // Apply default sort as soon as data is loaded and loading state is finished
          if (this.filteredTickets.length > 0) {
            console.log('[CollaborateurTicketsComponent] Applying initial sort after loading');
            this.applyCurrentSort();
          }
        })
      )
      .subscribe({
        next: (tickets) => {
          // Log only the count for better console readability
          console.log(
            `[CollaborateurTicketsComponent] Retrieved ${tickets.length} tickets assigned to collaborateur`
          );
          
          // Debug: Log createdAt dates from API response
          tickets.forEach(ticket => {
            console.log(`Ticket #${ticket.id} createdAt from API: ${ticket.createdAt}, type: ${typeof ticket.createdAt}`);
          });

          // Process tickets without modifying the createdAt values from the API
          this.tickets = tickets.map((ticket) => {
            // Fix status display
            if (
              ticket.status?.toUpperCase() === 'ASSIGNED' ||
              ticket.status === 'assigné'
            ) {
              ticket.status = this.STATUS.ASSIGNED;
            }
            
            // DO NOT modify createdAt - keep the original value from the API
            
            return ticket;
          });

          this.filteredTickets = [...this.tickets];
          this.dataSource = new MatTableDataSource(this.tickets);
          if (this.paginator) {
            this.dataSource.paginator = this.paginator;
          }
          if (this.sort) {
            this.dataSource.sort = this.sort;
          }

          // Extract unique projects and problem categories for filtering
          this.extractFilterData();
          
          this.updateStatistics();
          
          // Fetch detailed ticket data for tickets missing a createdAt value
          this.fetchMissingTicketDates();
          
          // Apply default sort immediately after data is set
          this.applyCurrentSort();
        },
        error: (error) => {
          console.error(
            '[CollaborateurTicketsComponent] Error loading tickets',
            error
          );
          this.error =
            'Erreur lors du chargement des tickets. Veuillez réessayer.';
          this.snackBar.open(
            'Erreur lors du chargement des tickets',
            'Fermer',
            {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'bottom',
            }
          );
        },
      });
  }
  
  // Fetch and update ticket data for tickets missing createdAt
  private fetchMissingTicketDates(): void {
    if (!this.tickets || this.tickets.length === 0) return;
    
    // Find tickets that have an ID but no valid date information using our parsing method
    const ticketsNeedingUpdate = this.tickets.filter(ticket => 
      ticket.id && this.parseTicketDate(ticket) === 0
    );
    
    console.log(`[CollaborateurTicketsComponent] Fetching detailed data for ${ticketsNeedingUpdate.length} tickets missing date information`);
    
    if (ticketsNeedingUpdate.length === 0) return;
    
    // Only update the first 10 to avoid too many requests
    const ticketsToUpdate = ticketsNeedingUpdate.slice(0, 10);
    
    // Create an array of observables for each ticket to fetch
    const fetchObservables = ticketsToUpdate.map(ticket => 
      this.ticketService.getTicketById(ticket.id).pipe(
        tap(updatedTicket => {
          if (updatedTicket) {
            console.log(`[Ticket Update] Fetched details for ticket #${ticket.id}, createdAt: ${updatedTicket.createdAt}`);
            
            // Update the ticket in our arrays
            const index = this.tickets.findIndex(t => t.id === ticket.id);
            if (index !== -1) {
              this.tickets[index] = updatedTicket;
              
              // Also update in filteredTickets
              const filteredIndex = this.filteredTickets.findIndex(t => t.id === ticket.id);
              if (filteredIndex !== -1) {
                this.filteredTickets[filteredIndex] = updatedTicket;
              }
            }
          }
        }),
        catchError(error => {
          console.error(`[Ticket Update] Failed to fetch details for ticket #${ticket.id}:`, error);
          return of(null);
        })
      )
    );
    
    // Execute all fetch operations in parallel
    if (fetchObservables.length > 0) {
      forkJoin(fetchObservables)
        .pipe(
          finalize(() => {
            console.log('[Ticket Update] Completed fetching missing ticket dates');
            
            // Update the data source with the updated tickets
            this.dataSource.data = this.tickets;
            
            // Re-apply sorting after updating ticket data
            this.applyCurrentSort();
            
            // Force change detection
            this.filteredTickets = [...this.filteredTickets];
          })
        )
        .subscribe();
    }
  }

  // Extract unique projects and problem categories for filter options
  private extractFilterData(): void {
    console.log('Extracting filter data from', this.tickets.length, 'tickets');
    
    // Extract unique projects
    const projectsMap = new Map();
    this.tickets.forEach(ticket => {
      if (ticket.project && ticket.project.id) {
        projectsMap.set(ticket.project.id, {
          id: ticket.project.id,
          name: ticket.project.name || 'Projet sans nom'
        });
      }
    });
    this.projects = Array.from(projectsMap.values());
    console.log('Extracted', this.projects.length, 'unique projects');
    
    // Extract unique problem categories
    const categoriesMap = new Map();
    this.tickets.forEach(ticket => {
      if (ticket.problemCategory && ticket.problemCategory.id) {
        categoriesMap.set(ticket.problemCategory.id, {
          id: ticket.problemCategory.id,
          name: ticket.problemCategory.name || 'Catégorie sans nom'
        });
      }
    });
    this.problemCategories = Array.from(categoriesMap.values());
    console.log('Extracted', this.problemCategories.length, 'unique problem categories');
    
    // Normalize statuses
    const statusSet = new Set<string>();
    this.tickets.forEach(ticket => {
      if (ticket.status) {
        statusSet.add(ticket.status);
      }
    });
    this.statuses = Array.from(statusSet);
    console.log('Extracted', this.statuses.length, 'unique statuses:', this.statuses);
    
    // Normalize priorities
    const prioritySet = new Set<string>();
    this.tickets.forEach(ticket => {
      if (ticket.priority) {
        prioritySet.add(ticket.priority);
      }
    });
    this.priorities = Array.from(prioritySet);
    console.log('Extracted', this.priorities.length, 'unique priorities:', this.priorities);
    
    // If arrays are empty, provide defaults
    if (this.statuses.length === 0) {
      this.statuses = ['Assigned', 'In Progress', 'Resolved', 'Unresolved'];
    }
    
    if (this.priorities.length === 0) {
      this.priorities = ['Haute', 'Moyenne', 'Basse'];
    }
  }

  // Filter tickets based on search term
  filterTickets(event: Event): void {
    const searchValue = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.searchTerm = searchValue;
    
    if (!searchValue) {
      this.filteredTickets = [...this.tickets];
    } else {
      this.filteredTickets = this.tickets.filter(ticket => 
        (ticket.title && ticket.title.toLowerCase().includes(searchValue)) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchValue)) ||
        (ticket.id && ticket.id.toString().includes(searchValue)) ||
        (ticket.project?.name && ticket.project.name.toLowerCase().includes(searchValue)) ||
        (ticket.problemCategory?.name && ticket.problemCategory.name.toLowerCase().includes(searchValue)) ||
        (ticket.status && ticket.status.toLowerCase().includes(searchValue))
      );
    }
    
    // Re-apply current sort
    this.applyCurrentSort();
  }

  // Apply sort based on selection
  applySort(event: Event): void {
    this.currentSortValue = (event.target as HTMLSelectElement).value;
    this.applyCurrentSort();
  }
  
  // Helper method to parse dates consistently
  private parseTicketDate(ticket: Ticket): number {
    // Try different date fields
    const dateStr = ticket.createdAt || 
                   (ticket as any).createdDate || 
                   (ticket as any).creationDate ||
                   (ticket as any).created ||
                   (ticket as any).dateCreated;
    
    if (!dateStr) {
      return 0; // Default to oldest possible date (timestamp 0)
    }
    
    try {
      const timestamp = new Date(dateStr).getTime();
      return isNaN(timestamp) ? 0 : timestamp;
    } catch (error) {
      console.error(`[Date Parsing] Error parsing date ${dateStr}:`, error);
      return 0;
    }
  }

  // Apply the current sort selection
  private applyCurrentSort(): void {
    console.log('[Sorting] Applying sort with value:', this.currentSortValue);
    
    // Debug ticket dates before sorting
    if (this.currentSortValue === 'newest' || this.currentSortValue === 'oldest') {
      console.log('[Sorting] Sample of ticket dates before sorting:');
      this.filteredTickets.slice(0, 5).forEach(ticket => {
        console.log(`Ticket #${ticket.id} createdAt: ${ticket.createdAt}, parsed timestamp: ${this.parseTicketDate(ticket)}`);
      });
    }
    
    switch(this.currentSortValue) {
      case 'newest':
        this.filteredTickets.sort((a, b) => {
          const timestampA = this.parseTicketDate(a);
          const timestampB = this.parseTicketDate(b);
          return timestampB - timestampA; // Most recent first
        });
        break;
      case 'oldest':
        this.filteredTickets.sort((a, b) => {
          const timestampA = this.parseTicketDate(a);
          const timestampB = this.parseTicketDate(b);
          return timestampA - timestampB; // Oldest first
        });
        break;
      case 'status':
        this.filteredTickets.sort((a, b) => {
          const statusA = a.status || '';
          const statusB = b.status || '';
          return statusA.localeCompare(statusB);
        });
        break;
      case 'title':
        this.filteredTickets.sort((a, b) => {
          const titleA = a.title || '';
          const titleB = b.title || '';
          return titleA.localeCompare(titleB);
        });
        break;
      case 'priority':
        // Define priority order
        const priorityOrder = { 'Haute': 1, 'Moyenne': 2, 'Basse': 3 };
        this.filteredTickets.sort((a, b) => {
          const priorityA = a.priority ? priorityOrder[a.priority as keyof typeof priorityOrder] || 4 : 4;
          const priorityB = b.priority ? priorityOrder[b.priority as keyof typeof priorityOrder] || 4 : 4;
          return priorityA - priorityB;
        });
        break;
    }
    
    // Debug ticket dates after sorting
    if (this.currentSortValue === 'newest' || this.currentSortValue === 'oldest') {
      console.log('[Sorting] Sample of ticket dates after sorting:');
      this.filteredTickets.slice(0, 5).forEach(ticket => {
        console.log(`Ticket #${ticket.id} createdAt: ${ticket.createdAt}, parsed timestamp: ${this.parseTicketDate(ticket)}`);
      });
    }
  }

  // Open export dialog
  openExportDialog(): void {
    // Ensure we have data for the dialog
    if (this.tickets.length === 0) {
      this.snackBar.open('Aucun ticket à exporter', 'Fermer', { duration: 3000 });
      return;
    }
    
    // If data hasn't been extracted yet, do it now
    if (this.projects.length === 0 && this.problemCategories.length === 0) {
      this.extractFilterData();
    }
    
    // Prepare data for the dialog
    const dialogData = {
      projects: this.projects,
      problemCategories: this.problemCategories,
      statuses: this.statuses,
      priorities: this.priorities,
    };
    
    console.log('Opening export dialog with data:', {
      projects: dialogData.projects.length,
      problemCategories: dialogData.problemCategories.length,
      statuses: dialogData.statuses,
      priorities: dialogData.priorities
    });
    
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: ['export-dialog', 'mat-elevation-z24'],
      disableClose: false,
      autoFocus: true,
      data: dialogData,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Export dialog result:', result);
        this.exportTickets(result);
      }
    });
  }

  // Export tickets based on filter options
  private exportTickets(filterOptions: any): void {
    let filteredTickets: Ticket[] = [];
    let fileName = 'tickets-collaborateur';

    // Apply filters
    if (filterOptions.filterType === 'all') {
      filteredTickets = [...this.tickets];
    } else if (filterOptions.filterType === 'project' && filterOptions.projectId) {
      filteredTickets = this.tickets.filter(
        t => t.project && t.project.id === filterOptions.projectId
      );
      const projectName = this.projects.find(
        p => p.id === filterOptions.projectId
      )?.name || 'projet';
      fileName = `tickets-${projectName}`;
    } else if (filterOptions.filterType === 'problemCategory' && filterOptions.problemCategoryId) {
      filteredTickets = this.tickets.filter(
        t => t.problemCategory && t.problemCategory.id === filterOptions.problemCategoryId
      );
      const categoryName = this.problemCategories.find(
        c => c.id === filterOptions.problemCategoryId
      )?.name || 'categorie';
      fileName = `tickets-${categoryName}`;
    } else if (filterOptions.filterType === 'status' && filterOptions.status) {
      filteredTickets = this.tickets.filter(
        t => t.status === filterOptions.status
      );
      fileName = `tickets-${filterOptions.status}`;
    } else if (filterOptions.filterType === 'priority' && filterOptions.priority) {
      filteredTickets = this.tickets.filter(
        t => t.priority === filterOptions.priority
      );
      fileName = `tickets-priorite-${filterOptions.priority}`;
    }

    // Export to Excel if we have tickets
    if (filteredTickets.length > 0) {
      this.excelService.exportToExcel(filteredTickets, fileName);
      this.snackBar.open('Export Excel réussi', 'Fermer', { duration: 3000 });
    } else {
      this.snackBar.open('Aucun ticket à exporter', 'Fermer', {
        duration: 3000,
      });
    }
  }

  // Format date for display - matches exactly what's used in the details dialog
  formatCreatedDate(ticketData: any): string {
    // Use our consistent date parsing method to get the timestamp
    const timestamp = this.parseTicketDate(ticketData);
    
    if (timestamp === 0) {
      return 'Date inconnue';
    }
    
    try {
      const date = new Date(timestamp);
      
      // Use the exact same format as used in the details dialog
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      console.error('[Date Formatting] Error formatting date:', error);
      return 'Erreur de date';
    }
  }

  private updateStatistics(): void {
    this.totalTickets = this.tickets.length;
    this.resolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === this.STATUS.RESOLVED
    ).length;
    this.nonResolvedTickets = this.tickets.filter(
      (ticket) => ticket.status === this.STATUS.UNRESOLVED
    ).length;
    this.inProgressTickets = this.tickets.filter(
      (ticket) => ticket.status === this.STATUS.IN_PROGRESS
    ).length;
    this.assignedTickets = this.tickets.filter(
      (ticket) => ticket.status === this.STATUS.ASSIGNED
    ).length;

    // Calculate average duration only from tickets that have a workDuration value
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

  getStatusIcon(status: string): string {
    switch (status) {
      case this.STATUS.ASSIGNED:
        return 'assignment';
      case this.STATUS.IN_PROGRESS:
        return 'engineering';
      case this.STATUS.RESOLVED:
        return 'check_circle';
      case this.STATUS.UNRESOLVED:
        return 'report_problem';
      default:
        return 'help';
    }
  }

  // Method for the stopTimer error
  private stopTimer(): void {
    if (this.timerSub) {
      this.timerSub.unsubscribe();
      this.timerSub = null;
    }
    
    this.timerTicketId = null;
    this.timerStartTime = null;
    this.activeTimer = null;
    
    // Reset display
    this.timerDisplay = '00:00:00';
  }

  // Add missing methods referenced in the template
  refreshTickets(): void {
    console.log('[CollaborateurTicketsComponent] Refreshing tickets');
    this.loadTickets();
  }
  
  getStatusClass(status: string): string {
    status = status.toLowerCase();
    if (status.includes('assigned') || status.includes('assigné')) {
      return 'status-assigned';
    } else if (status.includes('progress') || status.includes('cours')) {
      return 'status-in-progress';
    } else if (status.includes('resolved') || status.includes('résolu')) {
      return 'status-resolved';
    } else if (status.includes('unresolved') || status.includes('non résolu')) {
      return 'status-unresolved';
    }
    return 'status-unknown';
  }
  
  openDetailsDialog(ticket: Ticket): void {
    this.dialog.open(TicketDetailsDialogComponent, {
      width: '700px',
      maxWidth: '90vw',
      data: { ticket }
    });
  }
  
  openActionsDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(TicketActionsDialogComponent, {
      width: '450px',
      maxWidth: '90vw',
      data: { ticket },
      panelClass: 'ticket-actions-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Handle actions returned from the dialog
        if (result.action === 'viewDetails') {
          this.openDetailsDialog(result.ticket);
        } else if (result.action === 'refresh') {
          this.loadTickets();
        }
      }
    });
  }
  
  openCommentDialog(ticket: Ticket): void {
    // Open the comment dialog from admin components for consistent UI
    this.dialog.open(CommentDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      data: {
        ticketId: ticket.id,
        ticket: ticket
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        // Refresh tickets list to show updated comment
        this.loadTickets();
      }
    });
  }
}
